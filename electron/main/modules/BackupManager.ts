import { app, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import log from 'electron-log'
import { getDatabase } from '../database'
import dayjs from 'dayjs'

interface BackupData {
  version: string
  createdAt: string
  tables: {
    category: any[]
    script: any[]
    room: any[]
    settings: any[]
    sensitive_word: any[]
  }
}

export class BackupManager {
  private static instance: BackupManager

  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager()
    }
    return BackupManager.instance
  }

  /**
   * 创建备份
   */
  async createBackup(): Promise<string> {
    log.info('开始创建备份...')

    const db = getDatabase()
    const backup: BackupData = {
      version: app.getVersion(),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      tables: {
        category: db.prepare('SELECT * FROM category WHERE is_active = 1').all(),
        script: db.prepare('SELECT * FROM script WHERE is_active = 1').all(),
        room: db.prepare('SELECT * FROM room WHERE is_active = 1').all(),
        settings: db.prepare('SELECT * FROM settings').all(),
        sensitive_word: db.prepare('SELECT * FROM sensitive_word WHERE is_active = 1').all()
      }
    }

    // 生成备份文件名
    const fileName = `windv_backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`
    const backupDir = join(app.getPath('userData'), 'backups')
    const filePath = join(backupDir, fileName)

    // 确保目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // 写入备份文件
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8')

    log.info(`备份创建成功: ${filePath}`)
    return filePath
  }

  /**
   * 恢复备份
   */
  async restoreBackup(filePath: string): Promise<void> {
    log.info(`开始恢复备份: ${filePath}`)

    if (!fs.existsSync(filePath)) {
      throw new Error('备份文件不存在')
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const backup: BackupData = JSON.parse(content)

    if (!backup.version || !backup.tables) {
      throw new Error('无效的备份文件格式')
    }

    const db = getDatabase()

    // 使用事务确保原子性
    const restore = db.transaction(() => {
      // 清空现有数据（软删除）
      db.prepare('UPDATE category SET is_active = 0').run()
      db.prepare('UPDATE script SET is_active = 0').run()
      db.prepare('UPDATE room SET is_active = 0').run()
      db.prepare('UPDATE sensitive_word SET is_active = 0').run()

      // 恢复分类
      if (backup.tables.category) {
        const insertCategory = db.prepare(`
          INSERT OR REPLACE INTO category (id, name, type, icon, color, order_index, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
        `)

        for (const cat of backup.tables.category) {
          insertCategory.run(
            cat.id, cat.name, cat.type, cat.icon, cat.color, 
            cat.order_index, cat.created_at
          )
        }
      }

      // 恢复话术
      if (backup.tables.script) {
        const insertScript = db.prepare(`
          INSERT OR REPLACE INTO script (id, category_id, keywords, responses, intent_type, priority, ai_enabled, random_enabled, match_mode, remark, is_active, hit_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, datetime('now'))
        `)

        for (const script of backup.tables.script) {
          insertScript.run(
            script.id, script.category_id, script.keywords, script.responses,
            script.intent_type, script.priority, script.ai_enabled,
            script.random_enabled, script.match_mode, script.remark,
            script.hit_count, script.created_at
          )
        }
      }

      // 恢复直播间
      if (backup.tables.room) {
        const insertRoom = db.prepare(`
          INSERT OR REPLACE INTO room (id, platform_code, name, url, window_title, process_name, status, config, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `)

        for (const room of backup.tables.room) {
          insertRoom.run(
            room.id, room.platform_code, room.name, room.url,
            room.window_title, room.process_name, room.status,
            room.config, room.created_at
          )
        }
      }

      // 恢复设置
      if (backup.tables.settings) {
        for (const setting of backup.tables.settings) {
          db.prepare(`
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
          `).run(setting.key, setting.value)
        }
      }

      // 恢复违禁词
      if (backup.tables.sensitive_word) {
        const insertWord = db.prepare(`
          INSERT OR REPLACE INTO sensitive_word (id, word, type, is_active, created_at)
          VALUES (?, ?, ?, 1, ?)
        `)

        for (const word of backup.tables.sensitive_word) {
          insertWord.run(word.id, word.word, word.type, word.created_at)
        }
      }
    })

    restore()

    log.info('备份恢复成功')
  }

  /**
   * 获取备份列表
   */
  getBackupList(): { name: string; path: string; size: number; createdAt: Date }[] {
    const backupDir = join(app.getPath('userData'), 'backups')
    
    if (!fs.existsSync(backupDir)) {
      return []
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = join(backupDir, f)
        const stats = fs.statSync(filePath)
        const name = f.replace('.json', '')
        const createdAt = stats.mtime

        return { name, path: filePath, size: stats.size, createdAt }
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return files
  }

  /**
   * 删除备份
   */
  deleteBackup(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      log.info(`备份已删除: ${filePath}`)
    }
  }

  /**
   * 导出话术模板
   */
  exportScriptTemplate(): any[] {
    return [
      {
        category_id: '',
        keywords: ['关键词1', '关键词2'],
        responses: ['回复内容1', '回复内容2'],
        intent_type: 'chat',
        priority: 1,
        remark: '备注'
      }
    ]
  }

  /**
   * 获取话术导入模板路径
   */
  getTemplatePath(): string {
    const templateDir = join(app.getPath('userData'), 'templates')
    const templatePath = join(templateDir, 'script_template.json')

    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true })
    }

    if (!fs.existsSync(templatePath)) {
      fs.writeFileSync(templatePath, JSON.stringify(this.exportScriptTemplate(), null, 2), 'utf-8')
    }

    return templatePath
  }
}

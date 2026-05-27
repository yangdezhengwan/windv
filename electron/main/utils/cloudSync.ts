/**
 * Cloud Sync Manager - 云端同步管理器
 * 处理本地数据与云端的数据同步
 */

import { cloudAPI } from './cloudAPI'
import { licenseManager } from './licenseManager'
import { getSettings, setSettings } from '../database'
import { getDatabase } from '../database'

// 同步状态
export interface SyncStatus {
  lastSyncTime: string | null
  syncEnabled: boolean
  isSyncing: boolean
  pendingChanges: number
  lastError: string | null
}

class CloudSyncManager {
  private syncInterval: NodeJS.Timeout | null = null
  private status: SyncStatus = {
    lastSyncTime: null,
    syncEnabled: false,
    isSyncing: false,
    pendingChanges: 0,
    lastError: null,
  }

  constructor() {
    this.init()
  }

  /**
   * 初始化
   */
init(): void {
  const syncEnabled = getSettings('cloudSyncEnabled')
  this.status.syncEnabled = syncEnabled === 'true'
  const lastSync = getSettings('lastSyncTime')
  this.status.lastSyncTime = lastSync || null
  if (this.status.syncEnabled) {
    this.startAutoSync()
  }
}

  /**
   * 启用/禁用同步
   */
  async setSyncEnabled(enabled: boolean): Promise<void> {
    this.status.syncEnabled = enabled
    await setSettings('cloudSyncEnabled', enabled.toString())

    if (enabled) {
      this.startAutoSync()
    } else {
      this.stopAutoSync()
    }
  }

  /**
   * 获取同步状态
   */
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  /**
   * 手动执行同步
   */
  async sync(force = false): Promise<{ success: boolean; message: string }> {
    // 检查授权
    const licenseCheck = await licenseManager.checkLicenseStatus()
    if (!licenseCheck.valid) {
      return { success: false, message: '未授权，无法同步' }
    }

    // 检查同步权限
    if (!licenseManager.hasFeature('sync')) {
      return { success: false, message: '当前授权不支持云端同步' }
    }

    if (this.status.isSyncing && !force) {
      return { success: false, message: '同步正在进行中' }
    }

    this.status.isSyncing = true
    this.status.lastError = null

    try {
      // 1. 同步话术数据
      await this.syncScripts()

      // 2. 同步统计数据
      await this.syncStats()

      // 3. 更新同步时间
      this.status.lastSyncTime = new Date().toISOString()
      await setSettings('lastSyncTime', this.status.lastSyncTime)

      this.status.isSyncing = false
      this.status.pendingChanges = 0

      return { success: true, message: '同步成功' }
    } catch (error: any) {
      this.status.isSyncing = false
      this.status.lastError = error.message
      return { success: false, message: '同步失败: ' + error.message }
    }
  }

  /**
   * 同步话术数据
   */
  private async syncScripts(): Promise<void> {
    const db = getDatabase()

    // 获取本地话术
    const localScripts = db.prepare(`
      SELECT s.*, c.name as category_name 
      FROM scripts s 
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.deleted = 0
    `).all()

    // 转换为云端格式
    const scriptsForCloud = localScripts.map((s: any) => ({
      keywords: s.keywords,
      responses: s.responses,
      intentType: s.intent_type,
      matchMode: s.match_mode,
      priority: s.priority,
      aiEnabled: s.ai_enabled === 1,
      randomEnabled: s.random_enabled === 1,
      categoryId: s.category_id,
      categoryName: s.category_name,
      updatedAt: s.updated_at,
    }))

    // 上传到云端
    await cloudAPI.syncScripts(scriptsForCloud)

    // 获取云端话术
    const cloudScripts = await cloudAPI.fetchScripts()

    // 合并逻辑：以本地为准，但记录云端更新的
    console.log(`同步完成: 上传 ${scriptsForCloud.length} 条话术，云端有 ${cloudScripts.length} 条`)
  }

  /**
   * 同步统计数据
   */
  private async syncStats(): Promise<void> {
    const db = getDatabase()

    // 获取未同步的统计数据
    const lastSyncId = await getSettings('lastSyncStatsId') || '0'
    
    const stats = db.prepare(`
      SELECT * FROM stats 
      WHERE id > ? 
      ORDER BY id ASC 
      LIMIT 100
    `).all(lastSyncId)

    if (stats.length === 0) return

    // 格式化统计数据
    const formattedStats = stats.map((s: any) => ({
      date: s.date,
      danmakuCount: s.danmaku_count,
      responseCount: s.response_count,
      orderCount: s.order_count,
      revenue: s.revenue,
      platform: s.platform,
    }))

    // 上传
    await cloudAPI.uploadStats({ stats: formattedStats })

    // 更新最后同步 ID
    const maxId = Math.max(...stats.map((s: any) => s.id))
    await setSettings('lastSyncStatsId', maxId.toString())

    console.log(`统计数据同步: ${stats.length} 条`)
  }

  /**
   * 从云端恢复数据
   */
  async restoreFromCloud(): Promise<{ success: boolean; message: string }> {
    // 检查授权
    const licenseCheck = await licenseManager.checkLicenseStatus()
    if (!licenseCheck.valid) {
      return { success: false, message: '未授权，无法恢复数据' }
    }

    try {
      // 获取云端话术
      const cloudScripts = await cloudAPI.fetchScripts()

      const db = getDatabase()
      
      // 清空本地话术
      db.prepare('DELETE FROM scripts').run()

      // 插入云端话术
      const insert = db.prepare(`
        INSERT INTO scripts (
          keywords, responses, intent_type, match_mode, priority,
          ai_enabled, random_enabled, category_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const script of cloudScripts) {
        insert.run(
          JSON.stringify(script.keywords),
          JSON.stringify(script.responses),
          script.intentType || 'keyword',
          script.matchMode || 'keyword',
          script.priority || 0,
          script.aiEnabled ? 1 : 0,
          script.randomEnabled !== false ? 1 : 0,
          script.categoryId || null,
          script.createdAt || new Date().toISOString(),
          script.updatedAt || new Date().toISOString()
        )
      }

      return { 
        success: true, 
        message: `成功恢复 ${cloudScripts.length} 条话术` 
      }
    } catch (error: any) {
      return { success: false, message: '恢复失败: ' + error.message }
    }
  }

  /**
   * 启动自动同步
   */
  private startAutoSync(): void {
    if (this.syncInterval) return

    // 每 5 分钟检查一次是否需要同步
    this.syncInterval = setInterval(async () => {
      if (!this.status.syncEnabled) return
      
      // 检查是否有未同步的更改
      // 这里可以实现更复杂的逻辑
      
      // 简单的自动同步：每小时同步一次
      const lastSync = this.status.lastSyncTime 
        ? new Date(this.status.lastSyncTime) 
        : null
      
      if (!lastSync || Date.now() - lastSync.getTime() > 3600000) {
        await this.sync()
      }
    }, 300000) // 5 分钟
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

// 导出单例
export const cloudSyncManager = new CloudSyncManager()

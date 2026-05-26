import { ipcMain, dialog, shell, app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { getDatabase } from '../database'
import { PlatformManager } from '../modules/PlatformManager'
import { ScriptManager } from '../modules/ScriptManager'
import { StatisticsCollector } from '../modules/StatisticsCollector'
import { SettingsManager } from '../modules/SettingsManager'
import { BackupManager } from '../modules/BackupManager'
import { ExcelManager } from '../modules/ExcelManager'
import { ShortcutManager } from '../modules/ShortcutManager'
import { OrderConfigManager } from '../modules/OrderConfigManager'
import { HighFrequencyDetector } from '../modules/HighFrequencyDetector'
import { LLMConfigManager } from '../modules/LLMConfigManager'
import { LoopMessageManager } from '../modules/LoopMessageManager'
import { PROVIDER_INFO } from '../ai/providers/LLMManager'
import { LocalModelManager } from '../ai/providers/LocalModelManager'
import { LiveAIService } from '../ai/LiveAIService'

/**
 * 注册所有 IPC 处理器
 */
export function setupIpcHandlers(platformManager: PlatformManager): void {
  log.info('注册 IPC 处理器...')

  // ===== 直播间管理 =====
  ipcMain.handle('room:list', async () => {
    try {
      const db = getDatabase()
      return db.prepare('SELECT * FROM room WHERE is_active = 1 ORDER BY created_at DESC').all()
    } catch (error) {
      log.error('room:list error:', error)
      throw error
    }
  })

  ipcMain.handle('room:create', async (_, roomData) => {
    try {
      const db = getDatabase()
      const id = uuidv4()
      const stmt = db.prepare(`
        INSERT INTO room (id, platform_code, name, url, window_title, process_name, status, config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(
        id,
        roomData.platform_code,
        roomData.name,
        roomData.url || '',
        roomData.window_title || '',
        roomData.process_name || '',
        'offline',
        JSON.stringify(roomData.config || {})
      )
      return { id, ...roomData }
    } catch (error) {
      log.error('room:create error:', error)
      throw error
    }
  })

  ipcMain.handle('room:update', async (_, { id, ...updates }) => {
    try {
      const db = getDatabase()
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ')
      const values = Object.values(updates)
      db.prepare(`UPDATE room SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id)
      return { success: true }
    } catch (error) {
      log.error('room:update error:', error)
      throw error
    }
  })

  ipcMain.handle('room:delete', async (_, { id }) => {
    try {
      const db = getDatabase()
      db.prepare('UPDATE room SET is_active = 0 WHERE id = ?').run(id)
      return { success: true }
    } catch (error) {
      log.error('room:delete error:', error)
      throw error
    }
  })

  ipcMain.handle('room:start', async (event, { roomId }) => {
    try {
      await platformManager.startMonitoring(roomId)
      return { success: true }
    } catch (error) {
      log.error('room:start error:', error)
      throw error
    }
  })

  ipcMain.handle('room:stop', async (event, { roomId }) => {
    try {
      await platformManager.stopMonitoring(roomId)
      return { success: true }
    } catch (error) {
      log.error('room:stop error:', error)
      throw error
    }
  })

  ipcMain.handle('room:get-active', async () => {
    return platformManager.getActiveRooms()
  })

  // ===== 话术管理 =====
  ipcMain.handle('script:list', async (_, { categoryId, intentType }) => {
    try {
      const db = getDatabase()
      let query = 'SELECT * FROM script WHERE is_active = 1'
      const params: any[] = []

      if (categoryId) {
        query += ' AND category_id = ?'
        params.push(categoryId)
      }
      if (intentType) {
        query += ' AND intent_type = ?'
        params.push(intentType)
      }

      query += ' ORDER BY priority DESC, created_at DESC'
      const scripts = db.prepare(query).all(...params)
      
      // 解析 JSON 字段
      return scripts.map((s: any) => ({
        ...s,
        keywords: JSON.parse(s.keywords),
        responses: JSON.parse(s.responses)
      }))
    } catch (error) {
      log.error('script:list error:', error)
      throw error
    }
  })

  ipcMain.handle('script:create', async (_, scriptData) => {
    try {
      const db = getDatabase()
      const id = uuidv4()
      const stmt = db.prepare(`
        INSERT INTO script (id, category_id, keywords, responses, intent_type, priority, ai_enabled, random_enabled, match_mode, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(
        id,
        scriptData.category_id,
        JSON.stringify(scriptData.keywords),
        JSON.stringify(scriptData.responses),
        scriptData.intent_type || 'chat',
        scriptData.priority || 0,
        scriptData.ai_enabled ? 1 : 0,
        scriptData.random_enabled !== false ? 1 : 0,
        scriptData.match_mode || 'keyword',
        scriptData.remark || ''
      )
      return { id, ...scriptData }
    } catch (error) {
      log.error('script:create error:', error)
      throw error
    }
  })

  ipcMain.handle('script:update', async (_, { id, ...updates }) => {
    try {
      const db = getDatabase()
      
      // 处理 JSON 字段
      if (updates.keywords) updates.keywords = JSON.stringify(updates.keywords)
      if (updates.responses) updates.responses = JSON.stringify(updates.responses)
      if (updates.ai_enabled !== undefined) updates.ai_enabled = updates.ai_enabled ? 1 : 0
      if (updates.random_enabled !== undefined) updates.random_enabled = updates.random_enabled ? 1 : 0

      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ')
      const values = Object.values(updates)
      db.prepare(`UPDATE script SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id)
      return { success: true }
    } catch (error) {
      log.error('script:update error:', error)
      throw error
    }
  })

  ipcMain.handle('script:delete', async (_, { id }) => {
    try {
      const db = getDatabase()
      db.prepare('UPDATE script SET is_active = 0 WHERE id = ?').run(id)
      return { success: true }
    } catch (error) {
      log.error('script:delete error:', error)
      throw error
    }
  })

  ipcMain.handle('script:import', async (_, { scripts }) => {
    try {
      const db = getDatabase()
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO script (id, category_id, keywords, responses, intent_type, priority, ai_enabled, random_enabled, match_mode, remark, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `)

      const insertMany = db.transaction((items: any[]) => {
        for (const item of items) {
          insertStmt.run(
            item.id || uuidv4(),
            item.category_id,
            JSON.stringify(item.keywords || []),
            JSON.stringify(item.responses || []),
            item.intent_type || 'chat',
            item.priority || 0,
            item.ai_enabled ? 1 : 0,
            item.random_enabled !== false ? 1 : 0,
            item.match_mode || 'keyword',
            item.remark || ''
          )
        }
      })

      insertMany(scripts)
      return { success: true, count: scripts.length }
    } catch (error) {
      log.error('script:import error:', error)
      throw error
    }
  })

  // ===== 分类管理 =====
  ipcMain.handle('category:list', async () => {
    try {
      const db = getDatabase()
      return db.prepare('SELECT * FROM category WHERE is_active = 1 ORDER BY order_index ASC').all()
    } catch (error) {
      log.error('category:list error:', error)
      throw error
    }
  })

  ipcMain.handle('category:create', async (_, categoryData) => {
    try {
      const db = getDatabase()
      const id = uuidv4()
      db.prepare(`
        INSERT INTO category (id, name, type, icon, color, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, categoryData.name, categoryData.type || 'qa', categoryData.icon || '', categoryData.color || '#409EFF', categoryData.order_index || 0)
      return { id, ...categoryData }
    } catch (error) {
      log.error('category:create error:', error)
      throw error
    }
  })

  ipcMain.handle('category:update', async (_, { id, ...updates }) => {
    try {
      const db = getDatabase()
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ')
      const values = Object.values(updates)
      db.prepare(`UPDATE category SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id)
      return { success: true }
    } catch (error) {
      log.error('category:update error:', error)
      throw error
    }
  })

  ipcMain.handle('category:delete', async (_, { id }) => {
    try {
      const db = getDatabase()
      db.prepare('UPDATE category SET is_active = 0 WHERE id = ?').run(id)
      return { success: true }
    } catch (error) {
      log.error('category:delete error:', error)
      throw error
    }
  })

  // ===== 设置管理 =====
  ipcMain.handle('settings:get', async (_, { key }) => {
    try {
      const db = getDatabase()
      const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
      return result?.value
    } catch (error) {
      log.error('settings:get error:', error)
      throw error
    }
  })

  ipcMain.handle('settings:get-all', async () => {
    try {
      const db = getDatabase()
      const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[]
      const settings: Record<string, string> = {}
      rows.forEach(row => {
        settings[row.key] = row.value
      })
      return settings
    } catch (error) {
      log.error('settings:get-all error:', error)
      throw error
    }
  })

  ipcMain.handle('settings:set', async (_, { key, value }) => {
    try {
      const db = getDatabase()
      db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).run(key, value)
      return { success: true }
    } catch (error) {
      log.error('settings:set error:', error)
      throw error
    }
  })

  // ===== 统计数据 =====
  ipcMain.handle('stats:get-realtime', async (_, { roomId }) => {
    try {
      const collector = StatisticsCollector.getInstance()
      return collector.getRealtimeStats(roomId)
    } catch (error) {
      log.error('stats:get-realtime error:', error)
      throw error
    }
  })

  ipcMain.handle('stats:get-history', async (_, { roomId, startDate, endDate }) => {
    try {
      const db = getDatabase()
      let query = 'SELECT * FROM statistics WHERE 1=1'
      const params: any[] = []

      if (roomId) {
        query += ' AND room_id = ?'
        params.push(roomId)
      }
      if (startDate) {
        query += ' AND date >= ?'
        params.push(startDate)
      }
      if (endDate) {
        query += ' AND date <= ?'
        params.push(endDate)
      }

      query += ' ORDER BY date DESC'
      return db.prepare(query).all(...params)
    } catch (error) {
      log.error('stats:get-history error:', error)
      throw error
    }
  })

  ipcMain.handle('stats:export', async (event, { roomId, startDate, endDate }) => {
    try {
      const collector = StatisticsCollector.getInstance()
      const filePath = await collector.exportToExcel(roomId, startDate, endDate)
      return { success: true, filePath }
    } catch (error) {
      log.error('stats:export error:', error)
      throw error
    }
  })

  // ===== 弹幕日志 =====
  ipcMain.handle('danmaku:get-logs', async (_, { roomId, limit = 100, offset = 0 }) => {
    try {
      const db = getDatabase()
      let query = 'SELECT * FROM danmaku_log WHERE 1=1'
      const params: any[] = []

      if (roomId) {
        query += ' AND room_id = ?'
        params.push(roomId)
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      return db.prepare(query).all(...params)
    } catch (error) {
      log.error('danmaku:get-logs error:', error)
      throw error
    }
  })

  ipcMain.handle('danmaku:get-intent-stats', async (_, { roomId, date }) => {
    try {
      const db = getDatabase()
      let query = `
        SELECT intent_type, COUNT(*) as count
        FROM danmaku_log
        WHERE intent_type IS NOT NULL
      `
      const params: any[] = []

      if (roomId) {
        query += ' AND room_id = ?'
        params.push(roomId)
      }
      if (date) {
        query += ' AND DATE(created_at) = ?'
        params.push(date)
      }

      query += ' GROUP BY intent_type ORDER BY count DESC'
      return db.prepare(query).all(...params)
    } catch (error) {
      log.error('danmaku:get-intent-stats error:', error)
      throw error
    }
  })

  // ===== 备份恢复 =====
  ipcMain.handle('backup:create', async () => {
    try {
      const backupManager = BackupManager.getInstance()
      const filePath = await backupManager.createBackup()
      return { success: true, filePath }
    } catch (error) {
      log.error('backup:create error:', error)
      throw error
    }
  })

  ipcMain.handle('backup:restore', async (_, { filePath }) => {
    try {
      const backupManager = BackupManager.getInstance()
      await backupManager.restoreBackup(filePath)
      return { success: true }
    } catch (error) {
      log.error('backup:restore error:', error)
      throw error
    }
  })

  // ===== 系统操作 =====
  ipcMain.handle('system:open-external', async (_, { url }) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('system:get-version', async () => {
    return app.getVersion()
  })

  ipcMain.handle('system:select-file', async (_, { filters }) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || [{ name: '所有文件', extensions: ['*'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('system:save-file', async (_, { defaultPath, filters }) => {
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: filters || [{ name: '所有文件', extensions: ['*'] }]
    })
    return result.canceled ? null : result.filePath
  })

  // ===== Excel 导入导出 =====
  ipcMain.handle('excel:export-scripts', async () => {
    try {
      const excelManager = ExcelManager.getInstance()
      const filePath = await excelManager.exportScripts()
      return { success: true, filePath }
    } catch (error) {
      log.error('excel:export-scripts error:', error)
      throw error
    }
  })

  ipcMain.handle('excel:import-scripts', async (_, { filePath }) => {
    try {
      const excelManager = ExcelManager.getInstance()
      const result = await excelManager.importScripts(filePath)
      return { ...result }
    } catch (error) {
      log.error('excel:import-scripts error:', error)
      throw error
    }
  })

  ipcMain.handle('excel:get-template', async () => {
    try {
      const excelManager = ExcelManager.getInstance()
      const filePath = await excelManager.getTemplateFile()
      return { success: true, filePath }
    } catch (error) {
      log.error('excel:get-template error:', error)
      throw error
    }
  })

  // ===== 快捷键管理 =====
  ipcMain.handle('shortcut:update', async (_, { action, accelerator }) => {
    try {
      const shortcutManager = ShortcutManager.getInstance()
      const success = shortcutManager.updateShortcut(action, accelerator)
      return { success }
    } catch (error) {
      log.error('shortcut:update error:', error)
      throw error
    }
  })

  ipcMain.handle('shortcut:reset', async () => {
    try {
      const shortcutManager = ShortcutManager.getInstance()
      shortcutManager.resetToDefault({})
      return { success: true }
    } catch (error) {
      log.error('shortcut:reset error:', error)
      throw error
    }
  })

  ipcMain.handle('shortcut:get-all', async () => {
    try {
      const shortcutManager = ShortcutManager.getInstance()
      const shortcuts = shortcutManager.getShortcuts()
      return shortcuts
    } catch (error) {
      log.error('shortcut:get-all error:', error)
      throw error
    }
  })

  // ===== Order Config (V3) =====
  ipcMain.handle('order:get-config', async () => {
    try {
      const orderConfig = OrderConfigManager.getInstance()
      return orderConfig.getConfig()
    } catch (error) {
      log.error('order:get-config error:', error)
      throw error
    }
  })

  ipcMain.handle('order:update-config', async (_, { config }) => {
    try {
      const orderConfig = OrderConfigManager.getInstance()
      orderConfig.updateConfig(config)
      return { success: true }
    } catch (error) {
      log.error('order:update-config error:', error)
      throw error
    }
  })

  ipcMain.handle('order:get-templates', async (_, { level }) => {
    try {
      const orderConfig = OrderConfigManager.getInstance()
      return orderConfig.getTemplates(level)
    } catch (error) {
      log.error('order:get-templates error:', error)
      throw error
    }
  })

  ipcMain.handle('order:update-templates', async (_, { level, templates }) => {
    try {
      const orderConfig = OrderConfigManager.getInstance()
      orderConfig.updateTemplates(level, templates)
      return { success: true }
    } catch (error) {
      log.error('order:update-templates error:', error)
      throw error
    }
  })

  // ===== High Frequency Detector (V3) =====
  ipcMain.handle('hfq:get-questions', async () => {
    try {
      const detector = HighFrequencyDetector.getInstance()
      return detector.getHighFrequencyQuestions()
    } catch (error) {
      log.error('hfq:get-questions error:', error)
      throw error
    }
  })

  ipcMain.handle('hfq:reset', async () => {
    try {
      const detector = HighFrequencyDetector.getInstance()
      detector.reset()
      return { success: true }
    } catch (error) {
      log.error('hfq:reset error:', error)
      throw error
    }
  })

  // ===== LLM 大模型配置 (V2.1) =====
  ipcMain.handle('llm:get-config', async () => {
    try {
      const configManager = LLMConfigManager.getInstance()
      return {
        config: configManager.getConfig(),
        providers: PROVIDER_INFO
      }
    } catch (error) {
      log.error('llm:get-config error:', error)
      throw error
    }
  })

  ipcMain.handle('llm:save-config', async (_, { config }) => {
    try {
      const configManager = LLMConfigManager.getInstance()
      configManager.saveConfig(config)
      return { success: true }
    } catch (error) {
      log.error('llm:save-config error:', error)
      throw error
    }
  })

  ipcMain.handle('llm:test-connection', async (_, { provider, apiKey, model }) => {
    try {
      const configManager = LLMConfigManager.getInstance()
      return await configManager.testConnection(provider, apiKey, model)
    } catch (error) {
      log.error('llm:test-connection error:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('llm:analyze-danmaku', async (_, { danmaku }) => {
    try {
      const aiService = LiveAIService.getInstance()
      return await aiService.analyzeDanmaku(danmaku)
    } catch (error) {
      log.error('llm:analyze-danmaku error:', error)
      throw error
    }
  })

  ipcMain.handle('llm:generate-response', async (_, { danmaku, intent, scripts }) => {
    try {
      const aiService = LiveAIService.getInstance()
      return await aiService.generateResponse(danmaku, intent, scripts)
    } catch (error) {
      log.error('llm:generate-response error:', error)
      throw error
    }
  })

  ipcMain.handle('llm:ai-learning', async (_, { questions }) => {
    try {
      const aiService = LiveAIService.getInstance()
      return await aiService.analyzeForLearning(questions)
    } catch (error) {
      log.error('llm:ai-learning error:', error)
      return []
    }
  })

  ipcMain.handle('llm:set-context', async (_, { context }) => {
    try {
      const aiService = LiveAIService.getInstance()
      aiService.setContext(context)
      return { success: true }
    } catch (error) {
      log.error('llm:set-context error:', error)
      throw error
    }
  })

  ipcMain.handle('llm:generate-order-announcement', async (_, { nickname, amount, level }) => {
    try {
      const aiService = LiveAIService.getInstance()
      return await aiService.generateOrderAnnouncement(nickname, amount, level)
    } catch (error) {
      log.error('llm:generate-order-announcement error:', error)
      throw error
    }
  })

  // ===== 本地模型管理 (V2.2) =====
  ipcMain.handle('local-model:get-status', async () => {
    try {
      const manager = LocalModelManager.getInstance()
      return await manager.getOllamaStatus()
    } catch (error) {
      log.error('local-model:get-status error:', error)
      return { installed: false, running: false, models: [] }
    }
  })

  ipcMain.handle('local-model:get-recommended', async () => {
    try {
      const manager = LocalModelManager.getInstance()
      return manager.getRecommendedModels()
    } catch (error) {
      log.error('local-model:get-recommended error:', error)
      return []
    }
  })

  ipcMain.handle('local-model:pull', async (event, { modelId }) => {
    try {
      const manager = LocalModelManager.getInstance()
      
      // 发送进度更新
      const sendProgress = (progress: number, status: string) => {
        event.sender.send('local-model:progress', { modelId, progress, status })
      }
      
      return await manager.pullModel(modelId, sendProgress)
    } catch (error) {
      log.error('local-model:pull error:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('local-model:delete', async (_, { modelId }) => {
    try {
      const manager = LocalModelManager.getInstance()
      return await manager.deleteModel(modelId)
    } catch (error) {
      log.error('local-model:delete error:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('local-model:chat', async (_, { modelId, messages, options }) => {
    try {
      const manager = LocalModelManager.getInstance()
      return await manager.chat(modelId, messages, options)
    } catch (error) {
      log.error('local-model:chat error:', error)
      return { content: '', error: String(error) }
    }
  })

  ipcMain.handle('local-model:get-guide', async () => {
    try {
      const manager = LocalModelManager.getInstance()
      return manager.getInstallGuide()
    } catch (error) {
      log.error('local-model:get-guide error:', error)
      return { windows: '', macos: '', linux: '' }
    }
  })

  ipcMain.handle('local-model:has-available', async () => {
    try {
      const manager = LocalModelManager.getInstance()
      return await manager.hasAvailableLocalModel()
    } catch {
      return false
    }
  })

  // ===== 循环字幕管理 (V2.2) =====
  ipcMain.handle('loop:get-config', async () => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.getConfig()
    } catch (error) {
      log.error('loop:get-config error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:update-config', async (_, { config }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      manager.updateConfig(config)
      return { success: true }
    } catch (error) {
      log.error('loop:update-config error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:set-enabled', async (_, { enabled }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      manager.setEnabled(enabled)
      return { success: true }
    } catch (error) {
      log.error('loop:set-enabled error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:get-messages', async () => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.getMessages()
    } catch (error) {
      log.error('loop:get-messages error:', error)
      return []
    }
  })

  ipcMain.handle('loop:add-message', async (_, { message }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.addMessage(message)
    } catch (error) {
      log.error('loop:add-message error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:update-message', async (_, { id, updates }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      return { success: manager.updateMessage(id, updates) }
    } catch (error) {
      log.error('loop:update-message error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:delete-message', async (_, { id }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      return { success: manager.deleteMessage(id) }
    } catch (error) {
      log.error('loop:delete-message error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:get-next', async () => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.getNextMessage()
    } catch (error) {
      log.error('loop:get-next error:', error)
      return null
    }
  })

  ipcMain.handle('loop:get-schedules', async () => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.getSchedules()
    } catch (error) {
      log.error('loop:get-schedules error:', error)
      return []
    }
  })

  ipcMain.handle('loop:add-schedule', async (_, { schedule }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.addSchedule(schedule)
    } catch (error) {
      log.error('loop:add-schedule error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:update-schedule', async (_, { id, updates }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      return { success: manager.updateSchedule(id, updates) }
    } catch (error) {
      log.error('loop:update-schedule error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:delete-schedule', async (_, { id }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      return { success: manager.deleteSchedule(id) }
    } catch (error) {
      log.error('loop:delete-schedule error:', error)
      throw error
    }
  })

  ipcMain.handle('loop:export', async () => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.exportMessages()
    } catch (error) {
      log.error('loop:export error:', error)
      return ''
    }
  })

  ipcMain.handle('loop:import', async (_, { json }) => {
    try {
      const manager = LoopMessageManager.getInstance()
      return manager.importFromJson(json)
    } catch (error) {
      log.error('loop:import error:', error)
      return { success: 0, failed: 1 }
    }
  })

  ipcMain.handle('loop:reset', async () => {
    try {
      const manager = LoopMessageManager.getInstance()
      manager.resetToDefault()
      return { success: true }
    } catch (error) {
      log.error('loop:reset error:', error)
      throw error
    }
  })

  log.info('IPC handlers registered successfully')
}

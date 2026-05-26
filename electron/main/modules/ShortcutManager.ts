import { app, globalShortcut, dialog } from 'electron'
import log from 'electron-log'
import { SettingsManager } from './SettingsManager'

export class ShortcutManager {
  private static instance: ShortcutManager
  private registeredShortcuts: Map<string, string> = new Map()
  private settingsManager: SettingsManager

  // 默认快捷键配置
  private defaultShortcuts = {
    'toggle_monitor': 'CommandOrControl+Shift+S',
    'clear_logs': 'CommandOrControl+Shift+L',
    'emergency_stop': 'CommandOrControl+Shift+X',
    'show_window': 'CommandOrControl+Shift+M'
  }

  private constructor() {
    this.settingsManager = SettingsManager.getInstance()
    log.info('ShortcutManager 初始化完成')
  }

  public static getInstance(): ShortcutManager {
    if (!ShortcutManager.instance) {
      ShortcutManager.instance = new ShortcutManager()
    }
    return ShortcutManager.instance
  }

  /**
   * 注册所有快捷键
   */
  registerAll(handlers: Record<string, () => void>): void {
    // 加载配置
    const shortcuts = this.loadShortcuts()

    // 注册每个快捷键
    for (const [action, accelerator] of Object.entries(shortcuts)) {
      this.register(action, accelerator, handlers[action])
    }

    log.info(`已注册 ${this.registeredShortcuts.size} 个快捷键`)
  }

  /**
   * 注册单个快捷键
   */
  private register(action: string, accelerator: string, handler?: () => void): boolean {
    try {
      // 先注销已有的
      if (globalShortcut.isRegistered(accelerator)) {
        globalShortcut.unregister(accelerator)
      }

      // 注册新的
      const success = globalShortcut.register(accelerator, () => {
        log.info(`快捷键触发: ${action} (${accelerator})`)
        if (handler) {
          handler()
        } else {
          // 发送事件到主窗口
          this.emitShortcutEvent(action)
        }
      })

      if (success) {
        this.registeredShortcuts.set(action, accelerator)
        log.info(`快捷键注册成功: ${action} = ${accelerator}`)
      } else {
        log.error(`快捷键注册失败: ${action} = ${accelerator}`)
      }

      return success
    } catch (error) {
      log.error(`注册快捷键出错 (${action}):`, error)
      return false
    }
  }

  /**
   * 加载快捷键配置
   */
  private loadShortcuts(): Record<string, string> {
    const shortcuts: Record<string, string> = {}
    
    for (const [action, defaultAccel] of Object.entries(this.defaultShortcuts)) {
      const saved = this.settingsManager.get(`shortcut_${action}`)
      shortcuts[action] = saved || defaultAccel
    }

    return shortcuts
  }

  /**
   * 更新快捷键
   */
  updateShortcut(action: string, accelerator: string, handler?: () => void): boolean {
    // 注销旧的
    const oldAccel = this.registeredShortcuts.get(action)
    if (oldAccel) {
      globalShortcut.unregister(oldAccel)
      this.registeredShortcuts.delete(action)
    }

    // 注册新的
    const success = this.register(action, accelerator, handler)
    
    if (success) {
      // 保存配置
      this.settingsManager.set(`shortcut_${action}`, accelerator)
    }

    return success
  }

  /**
   * 重置为默认快捷键
   */
  resetToDefault(handlers: Record<string, () => void>): void {
    this.unregisterAll()
    
    for (const [action, accelerator] of Object.entries(this.defaultShortcuts)) {
      this.settingsManager.set(`shortcut_${action}`, accelerator)
    }

    this.registerAll(handlers)
    log.info('快捷键已重置为默认值')
  }

  /**
   * 获取当前快捷键配置
   */
  getShortcuts(): Record<string, string> {
    const shortcuts: Record<string, string> = {}
    
    for (const action of Object.keys(this.defaultShortcuts)) {
      shortcuts[action] = this.settingsManager.get(`shortcut_${action}`) || 
                          this.defaultShortcuts[action as keyof typeof this.defaultShortcuts]
    }

    return shortcuts
  }

  /**
   * 获取默认快捷键
   */
  getDefaultShortcuts(): Record<string, string> {
    return { ...this.defaultShortcuts }
  }

  /**
   * 验证快捷键格式
   */
  validateAccelerator(accelerator: string): boolean {
    // 简单的格式验证
    const validModifiers = ['Command', 'Cmd', 'Control', 'Ctrl', 'Alt', 'Option', 'Shift', 'Super']
    const parts = accelerator.split('+').map(p => p.trim())
    
    if (parts.length === 0) return false
    
    // 至少需要一个修饰键或功能键
    const hasModifier = parts.some(p => validModifiers.includes(p))
    const hasKey = parts.some(p => !validModifiers.includes(p) && p.length > 0)
    
    return hasModifier && hasKey
  }

  /**
   * 发送快捷键事件到渲染进程
   */
  private emitShortcutEvent(action: string): void {
    const { mainWindow } = require('../index')
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('shortcut:triggered', { action })
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll()
    this.registeredShortcuts.clear()
    log.info('所有快捷键已注销')
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.unregisterAll()
  }
}

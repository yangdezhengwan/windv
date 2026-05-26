import { app } from 'electron'
import log from 'electron-log'
import { getDatabase } from '../database'

export class SettingsManager {
  private static instance: SettingsManager
  private settings: Map<string, string> = new Map()

  private constructor() {
    this.loadSettings()
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager()
    }
    return SettingsManager.instance
  }

  /**
   * 加载所有设置
   */
  private loadSettings(): void {
    try {
      const db = getDatabase()
      const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
      
      this.settings.clear()
      rows.forEach(row => {
        this.settings.set(row.key, row.value)
      })

      log.info(`加载设置 ${this.settings.size} 项`)
    } catch (error) {
      log.error('加载设置失败:', error)
    }
  }

  /**
   * 获取设置值
   */
  get(key: string, defaultValue?: string): string | undefined {
    return this.settings.get(key) ?? defaultValue
  }

  /**
   * 获取布尔值
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.settings.get(key)
    if (value === undefined) return defaultValue
    return value === 'true' || value === '1'
  }

  /**
   * 获取数字值
   */
  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.settings.get(key)
    if (value === undefined) return defaultValue
    const num = parseFloat(value)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * 设置值
   */
  set(key: string, value: string | number | boolean): void {
    try {
      const db = getDatabase()
      const stringValue = String(value)

      db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).run(key, stringValue)

      this.settings.set(key, stringValue)
      log.info(`设置已保存: ${key} = ${stringValue}`)

    } catch (error) {
      log.error(`保存设置失败 (${key}):`, error)
    }
  }

  /**
   * 获取所有设置
   */
  getAll(): Record<string, string> {
    return Object.fromEntries(this.settings)
  }

  /**
   * 重新加载设置
   */
  reload(): void {
    this.loadSettings()
  }

  /**
   * 删除设置
   */
  delete(key: string): void {
    try {
      const db = getDatabase()
      db.prepare('DELETE FROM settings WHERE key = ?').run(key)
      this.settings.delete(key)
      log.info(`设置已删除: ${key}`)
    } catch (error) {
      log.error(`删除设置失败 (${key}):`, error)
    }
  }

  /**
   * 批量设置
   */
  setMany(settings: Record<string, string | number | boolean>): void {
    for (const [key, value] of Object.entries(settings)) {
      this.set(key, value)
    }
  }

  // ===== 快捷设置方法 =====

  /** 最小延迟 */
  get minDelay(): number {
    return this.getNumber('min_delay', 1000)
  }
  set minDelay(value: number) {
    this.set('min_delay', value)
  }

  /** 最大延迟 */
  get maxDelay(): number {
    return this.getNumber('max_delay', 3000)
  }
  set maxDelay(value: number) {
    this.set('max_delay', value)
  }

  /** 定时播报间隔 */
  get timingInterval(): number {
    return this.getNumber('timing_interval', 300)
  }
  set timingInterval(value: number) {
    this.set('timing_interval', value)
  }

  /** 违禁词过滤开关 */
  get sensitiveFilterEnabled(): boolean {
    return this.getBoolean('sensitive_filter_enabled', true)
  }
  set sensitiveFilterEnabled(value: boolean) {
    this.set('sensitive_filter_enabled', value)
  }

  /** 随机延迟开关 */
  get randomDelayEnabled(): boolean {
    return this.getBoolean('random_delay_enabled', true)
  }
  set randomDelayEnabled(value: boolean) {
    this.set('random_delay_enabled', value)
  }

  /** 开机自启 */
  get autoStartEnabled(): boolean {
    return this.getBoolean('auto_start_enabled', false)
  }
  set autoStartEnabled(value: boolean) {
    this.set('auto_start_enabled', value)
    app.setLoginItemSettings({
      openAtLogin: value,
      path: app.getPath('exe')
    })
  }

  /** 最小化到托盘 */
  get minimizeToTray(): boolean {
    return this.getBoolean('minimize_to_tray', true)
  }
  set minimizeToTray(value: boolean) {
    this.set('minimize_to_tray', value)
  }
}

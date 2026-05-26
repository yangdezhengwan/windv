import { dialog, Notification } from 'electron'
import log from 'electron-log'
import { getDatabase } from '../database'

interface OrderThresholdConfig {
  normalThreshold: number      // 普通订单阈值
  largeThreshold: number       // 大额订单阈值
  megaThreshold: number        // 超大额订单阈值
  enablePopup: boolean         // 启用弹窗
  enableRepeat: boolean        // 启用重复播报
  repeatCount: number          // 重复次数
  repeatInterval: number       // 重复间隔 (秒)
}

interface OrderAnnouncement {
  level: 'normal' | 'large' | 'mega'
  template: string
  popup: boolean
}

export class OrderConfigManager {
  private static instance: OrderConfigManager
  private config: OrderThresholdConfig = {
    normalThreshold: 0,
    largeThreshold: 500,
    megaThreshold: 2000,
    enablePopup: true,
    enableRepeat: true,
    repeatCount: 3,
    repeatInterval: 5
  }

  private templates: Record<string, string[]> = {
    normal: [
      '🎉 Thank you {nickname} for your order!',
      '✨ {nickname} has placed an order, thanks for your support!',
      '👀 {nickname} just ordered, great choice!'
    ],
    large: [
      '🔥🔥🔥 Big order! {nickname} ordered {amount} yuan!',
      '💎 VIP customer {nickname} placed a large order, thank you!',
      '⭐ {nickname} ordered {amount} yuan worth of products!'
    ],
    mega: [
      '🎊🎊🎊 MEGA ORDER! {nickname} just spent {amount} yuan! 🎊🎊🎊',
      '👑👑👑 Royal customer {nickname} with a {amount} yuan order! 👑👑👑',
      '💰💰💰 HUGE! {nickname} purchased {amount} yuan worth! 💰💰💰'
    ]
  }

  private constructor() {
    this.loadConfig()
    log.info('OrderConfigManager initialized')
  }

  static getInstance(): OrderConfigManager {
    if (!OrderConfigManager.instance) {
      OrderConfigManager.instance = new OrderConfigManager()
    }
    return OrderConfigManager.instance
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const db = getDatabase()
      const settings = db.prepare('SELECT * FROM settings WHERE key LIKE ?').all('order_%') as { key: string; value: string }[]
      
      for (const { key, value } of settings) {
        const configKey = key.replace('order_', '') as keyof OrderThresholdConfig
        if (configKey in this.config) {
          if (typeof this.config[configKey] === 'boolean') {
            (this.config as any)[configKey] = value === 'true'
          } else if (typeof this.config[configKey] === 'number') {
            (this.config as any)[configKey] = parseInt(value) || 0
          } else {
            (this.config as any)[configKey] = value
          }
        }
      }
    } catch (error) {
      log.error('Failed to load order config:', error)
    }
  }

  /**
   * 保存配置
   */
  saveConfig(): void {
    try {
      const db = getDatabase()
      
      for (const [key, value] of Object.entries(this.config)) {
        db.prepare(`
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
        `).run(`order_${key}`, String(value))
      }
      
      log.info('Order config saved')
    } catch (error) {
      log.error('Failed to save order config:', error)
    }
  }

  /**
   * 获取订单等级
   */
  getOrderLevel(amount: number): OrderAnnouncement {
    if (amount >= this.config.megaThreshold) {
      return {
        level: 'mega',
        template: this.getRandomTemplate('mega'),
        popup: this.config.enablePopup
      }
    } else if (amount >= this.config.largeThreshold) {
      return {
        level: 'large',
        template: this.getRandomTemplate('large'),
        popup: this.config.enablePopup
      }
    }
    
    return {
      level: 'normal',
      template: this.getRandomTemplate('normal'),
      popup: false
    }
  }

  /**
   * 获取随机模板
   */
  private getRandomTemplate(level: 'normal' | 'large' | 'mega'): string {
    const templates = this.templates[level]
    return templates[Math.floor(Math.random() * templates.length)]
  }

  /**
   * 生成播报文案
   */
  generateAnnouncement(amount: number, nickname: string): { text: string; level: string; shouldPopup: boolean; repeat: number } {
    const announcement = this.getOrderLevel(amount)
    const text = announcement.template
      .replace('{amount}', String(amount))
      .replace('{nickname}', nickname)

    return {
      text,
      level: announcement.level,
      shouldPopup: announcement.popup,
      repeat: announcement.level !== 'normal' && this.config.enableRepeat ? this.config.repeatCount : 1
    }
  }

  /**
   * 显示弹窗通知
   */
  showOrderPopup(amount: number, nickname: string, level: string): void {
    if (!this.config.enablePopup || level === 'normal') return

    const titles: Record<string, string> = {
      large: '🎉 Large Order Alert!',
      mega: '👑 MEGA ORDER!'
    }

    const bodies: Record<string, string> = {
      large: `${nickname} just placed an order worth ${amount} yuan!`,
      mega: `ROYAL CUSTOMER ${nickname} spent ${amount} yuan! 🎊`
    }

    if (Notification.isSupported()) {
      new Notification({
        title: titles[level],
        body: bodies[level],
        silent: false
      }).show()
    }

    // 同时显示对话框
    dialog.showMessageBox({
      type: 'info',
      title: titles[level],
      message: bodies[level],
      buttons: ['OK'],
      defaultId: 0
    }).catch(() => {})
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<OrderThresholdConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
    log.info('Order config updated:', this.config)
  }

  /**
   * 获取当前配置
   */
  getConfig(): OrderThresholdConfig {
    return { ...this.config }
  }

  /**
   * 更新模板
   */
  updateTemplates(level: 'normal' | 'large' | 'mega', templates: string[]): void {
    this.templates[level] = templates
    log.info(`Order templates updated for ${level}`)
  }

  /**
   * 获取模板
   */
  getTemplates(level?: 'normal' | 'large' | 'mega'): Record<string, string[]> | string[] {
    if (level) {
      return [...this.templates[level]]
    }
    return {
      normal: [...this.templates.normal],
      large: [...this.templates.large],
      mega: [...this.templates.mega]
    }
  }
}

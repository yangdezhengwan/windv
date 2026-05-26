import { Notification, dialog, BrowserWindow } from 'electron'
import log from 'electron-log'

type ErrorType = 'risk' | 'disconnect' | 'rate_limit' | 'login_expired' | 'unknown'

interface ErrorNotification {
  type: ErrorType
  title: string
  message: string
  severity: 'info' | 'warning' | 'error'
  timestamp: number
  autoClose?: boolean
}

export class ExceptionNotifier {
  private static instance: ExceptionNotifier
  private errorHistory: ErrorNotification[] = []
  private mainWindow: BrowserWindow | null = null
  private lastNotification: Map<ErrorType, number> = new Map()
  private cooldownTime: number = 60000  // 1 minute cooldown

  private constructor() {
    log.info('ExceptionNotifier initialized')
  }

  static getInstance(): ExceptionNotifier {
    if (!ExceptionNotifier.instance) {
      ExceptionNotifier.instance = new ExceptionNotifier()
    }
    return ExceptionNotifier.instance
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 发送异常通知
   */
  notify(type: ErrorType, message: string, details?: string): void {
    const now = Date.now()
    
    // 检查冷却时间
    const lastTime = this.lastNotification.get(type)
    if (lastTime && now - lastTime < this.cooldownTime) {
      log.debug(`Notification for ${type} skipped due to cooldown`)
      return
    }

    const notification: ErrorNotification = {
      type,
      title: this.getTitle(type),
      message,
      severity: this.getSeverity(type),
      timestamp: now
    }

    this.errorHistory.push(notification)
    this.lastNotification.set(type, now)

    // 限制历史记录数量
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift()
    }

    // 发送桌面通知
    this.sendNotification(notification)

    // 发送给渲染进程
    this.sendToRenderer(notification)

    // 记录日志
    log.warn(`[${type}] ${message}`, details || '')

    // 严重错误显示对话框
    if (notification.severity === 'error') {
      this.showDialog(notification, details)
    }
  }

  /**
   * 获取通知标题
   */
  private getTitle(type: ErrorType): string {
    const titles: Record<ErrorType, string> = {
      risk: '🛡️ Risk Control Alert',
      disconnect: '🔌 Connection Lost',
      rate_limit: '⏱️ Rate Limit',
      login_expired: '🔑 Login Expired',
      unknown: '⚠️ System Warning'
    }
    return titles[type]
  }

  /**
   * 获取严重程度
   */
  private getSeverity(type: ErrorType): 'info' | 'warning' | 'error' {
    const severities: Record<ErrorType, 'info' | 'warning' | 'error'> = {
      risk: 'warning',
      disconnect: 'error',
      rate_limit: 'warning',
      login_expired: 'error',
      unknown: 'warning'
    }
    return severities[type]
  }

  /**
   * 发送桌面通知
   */
  private sendNotification(notification: ErrorNotification): void {
    if (!Notification.isSupported()) return

    const icons: Record<string, string> = {
      info: '📢',
      warning: '⚠️',
      error: '🚨'
    }

    new Notification({
      title: `${icons[notification.severity]} ${notification.title}`,
      body: notification.message,
      silent: notification.severity === 'info'
    }).show()
  }

  /**
   * 发送给渲染进程
   */
  private sendToRenderer(notification: ErrorNotification): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notification:error', notification)
    }
  }

  /**
   * 显示对话框
   */
  private showDialog(notification: ErrorNotification, details?: string): void {
    const buttons = ['OK', 'View Details']
    
    dialog.showMessageBox({
      type: notification.severity,
      title: notification.title,
      message: notification.message,
      detail: details,
      buttons,
      defaultId: 0
    }).then(({ response }) => {
      if (response === 1) {
        // 用户选择查看详情
        this.showDetails(notification)
      }
    }).catch(() => {})
  }

  /**
   * 显示详情（可以打开日志或详情窗口）
   */
  private showDetails(notification: ErrorNotification): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('notification:showDetails', notification)
    }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(limit: number = 50): ErrorNotification[] {
    return this.errorHistory.slice(-limit).reverse()
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.errorHistory = []
    log.info('Error history cleared')
  }

  /**
   * 风险警告快捷方法
   */
  riskWarning(message: string): void {
    this.notify('risk', message)
  }

  /**
   * 断开连接快捷方法
   */
  disconnectError(platform: string): void {
    this.notify('disconnect', `Connection to ${platform} lost`, 'Please check your network connection and try again.')
  }

  /**
   * 频率限制快捷方法
   */
  rateLimitWarning(): void {
    this.notify('rate_limit', 'Too many requests sent', 'The system has temporarily paused to avoid being rate limited.')
  }

  /**
   * 登录过期快捷方法
   */
  loginExpired(platform: string): void {
    this.notify('login_expired', `Please re-login to ${platform}`, 'Your session has expired. Please login again.')
  }
}

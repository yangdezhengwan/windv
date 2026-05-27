import log from 'electron-log'
import { BasePlatformAdapter, PlatformCode, RoomInfo, Danmaku, OrderInfo, RiskStatus } from '../IPlatformAdapter'
import { v4 as uuidv4 } from 'uuid'

/**
 * 京东直播适配器
 */
export class JDAdapter extends BasePlatformAdapter {
  readonly platform: PlatformCode = PlatformCode.JD
  readonly name: string = '京东直播'
  
  private page: any = null
  private isMonitoring: boolean = false
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
    log.info('[京东] 适配器初始化')
  }

  async connect(roomInfo: RoomInfo): Promise<void> {
    log.info('[京东] 连接直播间:', roomInfo)
    
    try {
      // 京东直播网页版
      const url = roomInfo.url || 'https://live.jd.com'
      this.roomInfo = roomInfo
      
      // 触发连接事件
      this.emitStatusChange('connected')
      this.isConnected = true
      
      log.info('[京东] 连接成功')
    } catch (error) {
      log.error('[京东] 连接失败:', error)
      this.emitStatusChange('error')
      throw error
    }
  }

  async disconnect(): Promise<void> {
    log.info('[京东] 断开连接')
    
    this.isConnected = false
    this.isMonitoring = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.emitStatusChange('disconnected')
    log.info('[京东] 已断开连接')
  }

  async sendDanmaku(content: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('未连接')
    }

    log.info(`[京东] 发送弹幕: ${content}`)

    try {
      // 京东弹幕发送方法
      if (this.page) {
        await this.page.evaluate((text: string) => {
          window.postMessage({
            type: 'WINDV_SEND_DANMAKU',
            content: text,
            platform: 'jd'
          }, '*')
        }, content)
      }
    } catch (error) {
      log.error('[京东] 发送弹幕失败:', error)
      throw error
    }
  }

  async sendLike(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('未连接')
    }

    log.info('[京东] 发送点赞')

    try {
      if (this.page) {
        await this.page.evaluate(() => {
          // 京东点赞按钮选择器
          const likeBtn = document.querySelector(
            '.like-btn, [class*="like"], [class*="thumb"], [class*="praise"], .follow-btn'
          )
          if (likeBtn instanceof HTMLElement) {
            likeBtn.click()
          }
        })
      }
    } catch (error) {
      log.error('[京东] 发送点赞失败:', error)
    }
  }

  async checkRiskStatus(): Promise<RiskStatus> {
    if (!this.isConnected) {
      return { isNormal: false, reason: '未连接', level: 'danger' }
    }

    try {
      if (this.page) {
        // 检查风控元素
        const riskElements = await this.page.$$(
          '.captcha, .risk-warning, [class*="verify"], [class*="risk"], .security-check'
        )
        
        if (riskElements.length > 0) {
          return {
            isNormal: false,
            reason: '检测到风控验证',
            level: 'danger'
          }
        }
      }

      return { isNormal: true, level: 'normal' }
    } catch (error) {
      log.error('[京东] 风控检查失败:', error)
      return { isNormal: true, level: 'normal' }
    }
  }

  async getRoomInfo(): Promise<RoomInfo> {
    return this.roomInfo || { id: '' }
  }

  /**
   * 模拟弹幕数据（用于测试）
   */
  simulateDanmaku(content: string, nickname: string = '测试用户'): void {
    const danmaku: Danmaku = {
      id: uuidv4(),
      roomId: this.roomInfo?.id || '',
      content,
      senderId: `jd_${Date.now()}`,
      senderNickname: nickname,
      timestamp: new Date()
    }
    this.emitDanmaku(danmaku)
  }

  /**
   * 模拟订单数据（用于测试）
   */
  simulateOrder(amount: number = 199): void {
    const order: OrderInfo = {
      id: uuidv4(),
      roomId: this.roomInfo?.id || '',
      orderNo: `JD${Date.now()}`,
      amount,
      status: 'new',
      nicknameMasked: this.maskNickname('测试用户'),
      createdAt: new Date()
    }
    this.emitOrder(order)
  }

  private maskNickname(nickname: string): string {
    if (nickname.length <= 2) return nickname + '**'
    return nickname[0] + '*'.repeat(nickname.length - 2) + nickname[nickname.length - 1]
  }

  dispose(): void {
    super.dispose()
    this.page = null
    this.isMonitoring = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

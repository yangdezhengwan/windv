import log from 'electron-log'
import { BasePlatformAdapter, PlatformCode, RoomInfo, Danmaku, OrderInfo, RiskStatus } from '../IPlatformAdapter'
import { v4 as uuidv4 } from 'uuid'

/**
 * Bilibili (B站) 直播适配器
 */
export class BilibiliAdapter extends BasePlatformAdapter {
  readonly platform: PlatformCode = PlatformCode.BILIBILI
  readonly name: string = 'B站直播'
  
  private page: any = null
  private isMonitoring: boolean = false
  private reconnectTimer: NodeJS.Timeout | null = null
  private danmakuWebSocket: any = null

  constructor() {
    super()
    log.info('[B站] 适配器初始化')
  }

  async connect(roomInfo: RoomInfo): Promise<void> {
    log.info('[B站] 连接直播间:', roomInfo)
    
    try {
      // B站直播网页版
      const url = roomInfo.url || 'https://live.bilibili.com'
      this.roomInfo = roomInfo
      
      // B站使用 WebSocket 获取弹幕
      await this.connectDanmakuWebSocket()
      
      // 触发连接事件
      this.emitStatusChange('connected')
      this.isConnected = true
      
      log.info('[B站] 连接成功')
    } catch (error) {
      log.error('[B站] 连接失败:', error)
      this.emitStatusChange('error')
      throw error
    }
  }

  /**
   * 连接 B站弹幕 WebSocket
   */
  private async connectDanmakuWebSocket(): Promise<void> {
    if (!this.roomInfo?.url) {
      log.warn('[B站] 未提供房间 URL，跳过 WebSocket 连接')
      return
    }

    // 提取 B站房间号
    const roomId = this.extractBilibiliRoomId(this.roomInfo.url)
    if (!roomId) {
      log.warn('[B站] 无法解析房间号')
      return
    }

    log.info(`[B站] 连接到房间 ${roomId} 的弹幕服务`)

    // B站弹幕 WebSocket 地址获取
    // 实际实现需要调用 B站 API 获取真实的 WebSocket 地址
    // 这里使用模拟实现
    try {
      // const wsUrl = await this.getBilibiliWebSocketUrl(roomId)
      // this.danmakuWebSocket = new WebSocket(wsUrl)
      
      // 监听弹幕消息
      // this.danmakuWebSocket.onmessage = (event) => {
      //   this.handleBilibiliDanmaku(event.data)
      // }
      
      log.info('[B站] WebSocket 连接已建立（模拟）')
    } catch (error) {
      log.error('[B站] WebSocket 连接失败:', error)
    }
  }

  /**
   * 提取 B站房间号
   */
  private extractBilibiliRoomId(url: string): string | null {
    // 支持多种 URL 格式
    // https://live.bilibili.com/12345
    // https://live.bilibili.com/room/12345
    const match = url.match(/live\.bilibili\.com\/(?:room\/)?(\d+)/)
    return match ? match[1] : null
  }

  /**
   * 处理 B站弹幕消息
   */
  private handleBilibiliDanmaku(data: string): void {
    try {
      // B站弹幕协议是经过压缩的，这里简化处理
      // 实际实现需要解析 B站自定义的弹幕协议
      const message = JSON.parse(data)
      
      if (message.cmd === 'DANMU_MSG') {
        const info = message.info
        const danmaku: Danmaku = {
          id: uuidv4(),
          roomId: this.roomInfo?.id || '',
          content: info[1],
          senderId: String(info[2][0]),
          senderNickname: info[2][1],
          timestamp: new Date()
        }
        this.emitDanmaku(danmaku)
      }
    } catch (error) {
      // 忽略解析错误
    }
  }

  async disconnect(): Promise<void> {
    log.info('[B站] 断开连接')
    
    // 关闭 WebSocket
    if (this.danmakuWebSocket) {
      this.danmakuWebSocket.close()
      this.danmakuWebSocket = null
    }
    
    this.isConnected = false
    this.isMonitoring = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.emitStatusChange('disconnected')
    log.info('[B站] 已断开连接')
  }

  async sendDanmaku(content: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('未连接')
    }

    log.info(`[B站] 发送弹幕: ${content}`)

    try {
      // B站弹幕发送方法
      if (this.page) {
        await this.page.evaluate((text: string) => {
          window.postMessage({
            type: 'WINDV_SEND_DANMAKU',
            content: text,
            platform: 'bilibili'
          }, '*')
        }, content)
      } else {
        // 模拟发送成功
        log.info('[B站] 弹幕已发送（模拟）')
      }
    } catch (error) {
      log.error('[B站] 发送弹幕失败:', error)
      throw error
    }
  }

  async sendLike(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('未连接')
    }

    log.info('[B站] 发送点赞')

    try {
      if (this.page) {
        await this.page.evaluate(() => {
          // B站点赞按钮选择器
          const likeBtn = document.querySelector(
            '.bilibili-live-danmaku-input-container + button, ' +
            '[class*="like"], [class*="heart"], ' +
            '.like-btn, .interaction-btn'
          )
          if (likeBtn instanceof HTMLElement) {
            likeBtn.click()
          }
        })
      } else {
        // 模拟点赞
        log.info('[B站] 点赞已发送（模拟）')
      }
    } catch (error) {
      log.error('[B站] 发送点赞失败:', error)
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
          '.captcha, .risk-warning, [class*="verify"], [class*="risk"], ' +
          '[class*="shield"], .baffle-modal'
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
      log.error('[B站] 风控检查失败:', error)
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
      senderId: `bilibili_${Date.now()}`,
      senderNickname: nickname,
      timestamp: new Date()
    }
    this.emitDanmaku(danmaku)
  }

  /**
   * 模拟订单数据（用于测试）
   */
  simulateOrder(amount: number = 66): void {
    const order: OrderInfo = {
      id: uuidv4(),
      roomId: this.roomInfo?.id || '',
      orderNo: `BL${Date.now()}`,
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
    
    if (this.danmakuWebSocket) {
      this.danmakuWebSocket.close()
      this.danmakuWebSocket = null
    }
    
    this.page = null
    this.isMonitoring = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

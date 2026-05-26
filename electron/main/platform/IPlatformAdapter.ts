/**
 * 平台代码枚举
 */
export enum PlatformCode {
  TAOBAO = 'taobao',
  PINDUODUO = 'pinduoduo',
  DOUYIN = 'douyin',
  VIDEO_WEE = 'video_we',
}

/**
 * 意图类型枚举
 */
export enum IntentType {
  CHAT = 'chat',           // 日常互动
  PRICE = 'price',         // 价格咨询
  LOGISTICS = 'logistics', // 物流咨询
  AFTERSALE = 'aftersale', // 售后咨询
  SIZE = 'size',           // 尺码咨询
  DISCOUNT = 'discount',   // 优惠咨询
  AD = 'ad',               // 广告引流
  SENSITIVE = 'sensitive', // 敏感词
  UNKNOWN = 'unknown',
}

/**
 * 弹幕数据结构
 */
export interface Danmaku {
  id: string
  roomId: string
  content: string
  senderId: string
  senderNickname: string
  timestamp: Date
  raw?: unknown
}

/**
 * 订单数据结构
 */
export interface OrderInfo {
  id: string
  roomId: string
  orderNo: string
  amount: number
  status: 'new' | 'paid' | 'shipped' | 'refunded'
  nicknameMasked: string
  createdAt: Date
}

/**
 * 直播间信息
 */
export interface RoomInfo {
  id: string
  url?: string
  windowTitle?: string
  processName?: string
  config?: Record<string, any>
}

/**
 * 平台配置
 */
export interface PlatformConfig {
  /** 直播间信息 */
  roomInfo: RoomInfo
  /** 是否自动重连 */
  autoReconnect?: boolean
  /** 重连间隔(ms) */
  reconnectInterval?: number
  /** 自定义配置 */
  customConfig?: Record<string, any>
}

/**
 * 风控状态
 */
export interface RiskStatus {
  isNormal: boolean
  reason?: string
  level: 'normal' | 'warning' | 'danger'
}

/**
 * 平台适配器接口
 */
export interface IPlatformAdapter {
  /** 平台代码 */
  readonly platform: PlatformCode
  /** 平台名称 */
  readonly name: string
  /** 当前连接状态 */
  isConnected: boolean

  /**
   * 初始化适配器
   */
  initialize(config: PlatformConfig): Promise<void>

  /**
   * 连接直播间
   */
  connect(roomInfo: RoomInfo): Promise<void>

  /**
   * 断开连接
   */
  disconnect(): Promise<void>

  /**
   * 监听弹幕事件
   */
  onDanmaku(callback: (danmaku: Danmaku) => void): void

  /**
   * 监听订单事件
   */
  onOrder(callback: (order: OrderInfo) => void): void

  /**
   * 监听异常事件
   */
  onError(callback: (error: Error) => void): void

  /**
   * 监听状态变化
   */
  onStatusChange(callback: (status: 'connected' | 'disconnected' | 'error') => void): void

  /**
   * 发送弹幕
   */
  sendDanmaku(content: string): Promise<void>

  /**
   * 检测风控状态
   */
  checkRiskStatus(): Promise<RiskStatus>

  /**
   * 获取房间信息
   */
  getRoomInfo(): Promise<RoomInfo>

  /**
   * 清理资源
   */
  dispose(): void
}

/**
 * 适配器基类
 */
export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly platform: PlatformCode
  abstract readonly name: string
  
  public isConnected: boolean = false
  protected roomInfo: RoomInfo | null = null
  protected config: PlatformConfig | null = null
  
  protected onDanmakuCallback?: (danmaku: Danmaku) => void
  protected onOrderCallback?: (order: OrderInfo) => void
  protected onErrorCallback?: (error: Error) => void
  protected onStatusChangeCallback?: (status: 'connected' | 'disconnected' | 'error') => void

  async initialize(config: PlatformConfig): Promise<void> {
    this.config = config
    this.roomInfo = config.roomInfo
  }

  abstract connect(roomInfo: RoomInfo): Promise<void>
  abstract disconnect(): Promise<void>
  abstract sendDanmaku(content: string): Promise<void>
  abstract checkRiskStatus(): Promise<RiskStatus>
  abstract getRoomInfo(): Promise<RoomInfo>

  onDanmaku(callback: (danmaku: Danmaku) => void): void {
    this.onDanmakuCallback = callback
  }

  onOrder(callback: (order: OrderInfo) => void): void {
    this.onOrderCallback = callback
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback
  }

  onStatusChange(callback: (status: 'connected' | 'disconnected' | 'error') => void): void {
    this.onStatusChangeCallback = callback
  }

  protected emitDanmaku(danmaku: Danmaku): void {
    if (this.onDanmakuCallback) {
      this.onDanmakuCallback(danmaku)
    }
  }

  protected emitOrder(order: OrderInfo): void {
    if (this.onOrderCallback) {
      this.onOrderCallback(order)
    }
  }

  protected emitError(error: Error): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(error)
    }
  }

  protected emitStatusChange(status: 'connected' | 'disconnected' | 'error'): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status)
    }
  }

  dispose(): void {
    this.isConnected = false
    this.roomInfo = null
    this.config = null
    this.onDanmakuCallback = undefined
    this.onOrderCallback = undefined
    this.onErrorCallback = undefined
    this.onStatusChangeCallback = undefined
  }
}

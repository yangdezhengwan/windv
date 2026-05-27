import { BrowserWindow, webContents } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database'
import { TaobaoAdapter } from '../platform/adapters/TaobaoAdapter'
import { PinduoduoAdapter } from '../platform/adapters/PinduoduoAdapter'
import { DouyinAdapter } from '../platform/adapters/DouyinAdapter'
import { VideoWeAdapter } from '../platform/adapters/VideoWeAdapter'
import { KuaishouAdapter } from '../platform/adapters/KuaishouAdapter'
import { JDAdapter } from '../platform/adapters/JDAdapter'
import { BilibiliAdapter } from '../platform/adapters/BilibiliAdapter'
import { IPlatformAdapter, PlatformCode, Danmaku, OrderInfo } from '../platform/IPlatformAdapter'
import { ScriptMatcher } from '../ai/ScriptMatcher'
import { IntentClassifier, IntentType } from '../ai/IntentClassifier'
import { RiskController } from './RiskController'
import { StatisticsCollector } from './StatisticsCollector'
import { HighFrequencyDetector } from './HighFrequencyDetector'
import { OrderConfigManager } from './OrderConfigManager'
import { PopularityManager } from './PopularityManager'
import { LoopMessageManager } from './LoopMessageManager'

interface ActiveRoom {
  id: string
  adapter: IPlatformAdapter
  status: 'monitoring' | 'paused' | 'error'
  config: any
}

// Use RoomInfo from IPlatformAdapter
import type { RoomInfo } from '../platform/IPlatformAdapter'

// Database row type for room table
interface RoomRow {
  id: string
  platform_code: string
  name: string
  url: string
  window_title: string
  process_name: string
  config: string
  status: string
}

export class PlatformManager {
  private static instance: PlatformManager
  private activeRooms: Map<string, ActiveRoom> = new Map()
  private adapters: Map<PlatformCode, IPlatformAdapter> = new Map()
  private scriptMatcher: ScriptMatcher
  private intentClassifier: IntentClassifier
  private riskController: RiskController
  private statsCollector: StatisticsCollector
  private highFrequencyDetector: HighFrequencyDetector
  private orderConfigManager: OrderConfigManager
  private popularityManager: PopularityManager
  private loopMessageManager: LoopMessageManager
  private mainWindow: BrowserWindow | null = null

  constructor() {
    // 注册平台适配器
    this.registerAdapters()
    
    // 初始化 AI 引擎
    this.scriptMatcher = new ScriptMatcher()
    this.intentClassifier = new IntentClassifier()
    this.riskController = new RiskController()
    this.statsCollector = StatisticsCollector.getInstance()
    this.highFrequencyDetector = HighFrequencyDetector.getInstance()
    this.orderConfigManager = OrderConfigManager.getInstance()
    this.popularityManager = PopularityManager.getInstance()
    this.loopMessageManager = LoopMessageManager.getInstance()

    // 设置循环消息回调
    this.loopMessageManager.on('send-message', (message: string, roomId: string) => {
      this.sendLoopMessage(roomId, message)
    })

    // 设置人气辅助的回调
    this.popularityManager.setDanmakuCallback(this.sendVirtualDanmaku.bind(this))
    this.popularityManager.setLikeCallback(this.sendVirtualLike.bind(this))

    // 监听高频问题事件
    this.highFrequencyDetector.on('high_frequency', (data: { content: string; count: number; roomId: string }) => {
      log.info(`检测到高频问题: ${data.content} (${data.count}次)`)
      this.sendToRenderer('hfq:detected', data)
    })

    log.info('PlatformManager 初始化完成')
  }

  public static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager()
    }
    return PlatformManager.instance
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 注册平台适配器
   */
  private registerAdapters(): void {
    // 基础平台
    this.adapters.set(PlatformCode.TAOBAO, new TaobaoAdapter())
    this.adapters.set(PlatformCode.PINDUODUO, new PinduoduoAdapter())
    
    // V2.0 平台
    this.adapters.set(PlatformCode.DOUYIN, new DouyinAdapter())
    this.adapters.set(PlatformCode.VIDEO_WEE, new VideoWeAdapter())
    
    // V3.0 新增平台
    this.adapters.set(PlatformCode.KUAISHOU, new KuaishouAdapter())
    this.adapters.set(PlatformCode.JD, new JDAdapter())
    this.adapters.set(PlatformCode.BILIBILI, new BilibiliAdapter())
    
    log.info(`已注册 ${this.adapters.size} 个平台适配器`)
  }

  /**
   * 获取平台适配器
   */
  getAdapter(platform: PlatformCode): IPlatformAdapter | undefined {
    return this.adapters.get(platform)
  }

  /**
   * 启动房间监控
   */
  async startMonitoring(roomId: string): Promise<void> {
    log.info(`启动房间监控: ${roomId}`)

    // 获取房间信息
    const db = getDatabase()
    const room = db.prepare('SELECT * FROM room WHERE id = ? AND is_active = 1').get(roomId) as RoomRow | undefined

    if (!room) {
      throw new Error(`房间不存在: ${roomId}`)
    }

    // 获取适配器
    const platformCode = room.platform_code as PlatformCode
    const adapter = this.adapters.get(platformCode)

    if (!adapter) {
      throw new Error(`不支持的平台: ${platformCode}`)
    }

    // 创建适配器实例
    const adapterInstance = this.createAdapterInstance(platformCode)

    // 配置回调
    adapterInstance.onDanmaku((danmaku: Danmaku) => {
      this.handleDanmaku(roomId, danmaku)
    })

    adapterInstance.onOrder((order: OrderInfo) => {
      this.handleOrder(roomId, order)
    })

    // 连接直播间
    await adapterInstance.connect({
      id: room.id,
      url: room.url,
      windowTitle: room.window_title,
      processName: room.process_name,
      config: JSON.parse(room.config || '{}')
    })

    // 保存活跃房间
    this.activeRooms.set(roomId, {
      id: roomId,
      adapter: adapterInstance,
      status: 'monitoring',
      config: JSON.parse(room.config || '{}')
    })

    // 更新数据库状态
    db.prepare("UPDATE room SET status = 'monitoring', last_seen_at = datetime('now') WHERE id = ?").run(roomId)

    // 启动人气辅助
    this.popularityManager.startRoom(roomId)

    // 启动循环消息
    this.loopMessageManager.startRoom(roomId)

    // 通知渲染进程
    this.sendToRenderer('room:status-change', { roomId, status: 'monitoring' })

    log.info(`房间监控已启动: ${room.name}`)
  }

  /**
   * 停止房间监控
   */
  async stopMonitoring(roomId: string): Promise<void> {
    log.info(`停止房间监控: ${roomId}`)

    const activeRoom = this.activeRooms.get(roomId)
    if (activeRoom) {
      await activeRoom.adapter.disconnect()
      this.activeRooms.delete(roomId)

      // 停止人气辅助
      this.popularityManager.stopRoom(roomId)

      // 停止循环消息
      this.loopMessageManager.stopRoom(roomId)

      // 更新数据库状态
      const db = getDatabase()
      db.prepare("UPDATE room SET status = 'offline' WHERE id = ?").run(roomId)

      // 通知渲染进程
      this.sendToRenderer('room:status-change', { roomId, status: 'offline' })

      log.info(`房间监控已停止: ${roomId}`)
    }
  }

  /**
   * 暂停/恢复房间监控
   */
  async pauseMonitoring(roomId: string, paused: boolean): Promise<void> {
    const activeRoom = this.activeRooms.get(roomId)
    if (activeRoom) {
      activeRoom.status = paused ? 'paused' : 'monitoring'
      
      const db = getDatabase()
      db.prepare("UPDATE room SET status = ? WHERE id = ?").run(paused ? 'paused' : 'monitoring', roomId)
      
      this.sendToRenderer('room:status-change', { roomId, status: activeRoom.status })
    }
  }

  /**
   * 处理弹幕
   */
  private async handleDanmaku(roomId: string, danmaku: Danmaku): Promise<void> {
    try {
      // 检查风控
      if (this.riskController.checkRateLimit(roomId)) {
        log.warn(`房间 ${roomId} 触发频率限制，跳过回复`)
        return
      }

      // 记录统计
      this.statsCollector.recordDanmaku(roomId, IntentType.UNKNOWN)

      // 记录日志
      const db = getDatabase()
      const logId = uuidv4()
      db.prepare(`
        INSERT INTO danmaku_log (id, room_id, content, sender_id, sender_nickname, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(logId, roomId, danmaku.content, danmaku.senderId, danmaku.senderNickname)

      // 意图分类
      const intentResult = this.intentClassifier.classify(danmaku.content)
      
      // 更新日志意图
      db.prepare('UPDATE danmaku_log SET intent_type = ? WHERE id = ?').run(intentResult.type, logId)

      // 检查违禁词
      if (this.riskController.isSensitive(danmaku.content)) {
        db.prepare('UPDATE danmaku_log SET is_blocked = 1, block_reason = ? WHERE id = ?')
          .run('sensitive_word', logId)
        return
      }

      // 记录高频问题检测
      this.highFrequencyDetector.recordQuestion(danmaku.content, danmaku.senderId)

      // 匹配话术
      const matchResult = await this.scriptMatcher.match(intentResult.type, danmaku.content, roomId)

      if (matchResult) {
        // 真人模拟延迟
        const delay = this.riskController.getHumanDelay()
        await this.sleep(delay)

        // 发送回复
        const activeRoom = this.activeRooms.get(roomId)
        if (activeRoom && activeRoom.status === 'monitoring') {
          await activeRoom.adapter.sendDanmaku(matchResult.response)
          
          // 更新日志
          db.prepare(`
            UPDATE danmaku_log 
            SET response_sent = 1, response_content = ?, matched_script_id = ?
            WHERE id = ?
          `).run(matchResult.response, matchResult.scriptId, logId)

          // 记录回复统计
          this.statsCollector.recordReply(roomId, true)
        }
      } else {
        // 未匹配到话术
        this.statsCollector.recordReply(roomId, false)
      }

      // 通知渲染进程
      this.sendToRenderer('danmaku:new', {
        id: logId,
        roomId,
        content: danmaku.content,
        senderNickname: danmaku.senderNickname,
        intentType: intentResult.type,
        responseSent: matchResult ? true : false
      })

    } catch (error) {
      log.error(`处理弹幕失败: ${error}`)
    }
  }

  /**
   * 处理订单
   */
  private async handleOrder(roomId: string, order: OrderInfo): Promise<void> {
    try {
      log.info(`收到订单: ${order.orderNo}, 金额: ${order.amount}`)

      // 记录订单
      const db = getDatabase()
      const orderId = uuidv4()
      db.prepare(`
        INSERT INTO order_log (id, room_id, order_no, amount, status, nickname_masked, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(orderId, roomId, order.orderNo, order.amount, order.status, order.nicknameMasked)

      // 记录统计
      this.statsCollector.recordOrder(roomId, order.amount, order.status)

      // 获取订单配置
      const config = this.orderConfigManager.getConfig()
      const activeRoom = this.activeRooms.get(roomId)

      // 发送播报
      if (activeRoom && activeRoom.status === 'monitoring') {
        // 确定订单等级
        let level: 'normal' | 'large' | 'mega' = 'normal'
        if (order.amount >= config.megaThreshold) {
          level = 'mega'
        } else if (order.amount >= config.largeThreshold) {
          level = 'large'
        }

        // 获取播报模板（使用 OrderConfigManager）
        const announcement = this.orderConfigManager.generateAnnouncement(order.amount, order.nicknameMasked)
        const announceText = announcement.text
        
        // 根据配置决定播报次数
        const announceCount = announcement.repeat
        
        for (let i = 0; i < announceCount; i++) {
          await this.sleep(i * config.repeatInterval * 1000 + Math.random() * 1000)
          await activeRoom.adapter.sendDanmaku(announceText)
        }

        // 更新播报次数
        db.prepare(`
          UPDATE order_log SET announce_count = ?, last_announced_at = datetime('now') WHERE id = ?
        `).run(announceCount, orderId)

        // 弹窗通知（如果启用）
        if (announcement.shouldPopup) {
          this.orderConfigManager.showOrderPopup(order.amount, order.nicknameMasked, announcement.level)
        }
      }

      // 通知渲染进程
      this.sendToRenderer('order:new', {
        id: orderId,
        roomId,
        orderNo: order.orderNo,
        amount: order.amount,
        status: order.status,
        nicknameMasked: order.nicknameMasked
      })

    } catch (error) {
      log.error(`处理订单失败: ${error}`)
    }
  }

  /**
   * 创建适配器实例
   */
  private createAdapterInstance(platform: PlatformCode): IPlatformAdapter {
    switch (platform) {
      case PlatformCode.TAOBAO:
        return new TaobaoAdapter()
      case PlatformCode.PINDUODUO:
        return new PinduoduoAdapter()
      case PlatformCode.DOUYIN:
        return new DouyinAdapter()
      case PlatformCode.VIDEO_WEE:
        return new VideoWeAdapter()
      case PlatformCode.KUAISHOU:
        return new KuaishouAdapter()
      case PlatformCode.JD:
        return new JDAdapter()
      case PlatformCode.BILIBILI:
        return new BilibiliAdapter()
      default:
        throw new Error(`不支持的平台: ${platform}`)
    }
  }

  /**
   * 获取所有活跃房间
   */
  getActiveRooms(): { id: string; name: string; status: string; platform: string }[] {
    const db = getDatabase()
    const rooms: { id: string; name: string; status: string; platform: string }[] = []

    for (const [roomId, activeRoom] of this.activeRooms) {
      const room = db.prepare('SELECT name, platform_code FROM room WHERE id = ?').get(roomId) as any
      if (room) {
        rooms.push({
          id: roomId,
          name: room.name,
          status: activeRoom.status,
          platform: room.platform_code
        })
      }
    }

    return rooms
  }

  /**
   * 发送消息到渲染进程
   */
  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  /**
   * 发送虚拟弹幕
   */
  private async sendVirtualDanmaku(roomId: string, content: string): Promise<void> {
    const activeRoom = this.activeRooms.get(roomId)
    if (activeRoom && activeRoom.status === 'monitoring') {
      try {
        await activeRoom.adapter.sendDanmaku(content)
        // 发送事件到渲染进程
        this.sendToRenderer('danmaku:new', {
          id: `virtual_${Date.now()}`,
          roomId,
          content,
          senderNickname: '虚拟用户',
          intentType: 'chat',
          responseSent: false,
          isVirtual: true
        })
      } catch (error) {
        log.error(`发送虚拟弹幕失败 [${roomId}]: ${error}`)
      }
    }
  }

  /**
   * 发送虚拟点赞
   */
  private async sendVirtualLike(roomId: string): Promise<void> {
    const activeRoom = this.activeRooms.get(roomId)
    if (activeRoom && activeRoom.status === 'monitoring') {
      try {
        await activeRoom.adapter.sendLike()
        // 发送事件到渲染进程
        this.sendToRenderer('like:new', { roomId, isVirtual: true })
      } catch (error) {
        log.error(`发送虚拟点赞失败 [${roomId}]: ${error}`)
      }
    }
  }

  /**
   * 发送循环消息
   */
  private async sendLoopMessage(roomId: string, content: string): Promise<void> {
    const activeRoom = this.activeRooms.get(roomId)
    if (activeRoom && activeRoom.status === 'monitoring') {
      try {
        await activeRoom.adapter.sendDanmaku(content)
        // 发送事件到渲染进程
        this.sendToRenderer('loop:send', { roomId, content })
        log.info(`循环消息已发送 [${roomId}]: ${content}`)
      } catch (error) {
        log.error(`发送循环消息失败 [${roomId}]: ${error}`)
      }
    }
  }

  /**
   * 关闭所有房间监控
   */
  async disposeAll(): Promise<void> {
    log.info('关闭所有房间监控...')

    for (const [roomId] of this.activeRooms) {
      await this.stopMonitoring(roomId)
    }

    this.activeRooms.clear()
    log.info('所有房间监控已关闭')
  }

  /**
   * 休眠工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

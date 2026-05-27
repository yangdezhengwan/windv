import log from 'electron-log'
import { getDatabase } from '../database'
import { v4 as uuidv4 } from 'uuid'

interface VirtualDanmaku {
  id: string
  content: string
  weight: number  // 权重，影响随机选择概率
  enabled: boolean
}

interface VirtualLike {
  enabled: boolean
  minInterval: number  // 最小间隔 (ms)
  maxInterval: number  // 最大间隔 (ms)
}

interface PopularityConfig {
  enabled: boolean
  virtualDanmaku: VirtualDanmaku[]
  virtualLike: VirtualLike
  dailyLimit: number  // 每日虚拟弹幕上限
  sentToday: number     // 今日已发送数
  lastResetDate: string // 上次重置日期
}

const DEFAULT_DANMAKU_POOL = [
  { content: '666', weight: 10 },
  { content: '厉害', weight: 8 },
  { content: '棒棒哒', weight: 7 },
  { content: '冲冲冲', weight: 6 },
  { content: '买它', weight: 8 },
  { content: '想要', weight: 7 },
  { content: '优惠吗', weight: 5 },
  { content: '多少钱', weight: 8 },
  { content: '有货吗', weight: 6 },
  { content: '好看', weight: 7 },
  { content: '已入手', weight: 5 },
  { content: '收到啦', weight: 4 },
  { content: '质量不错', weight: 5 },
  { content: '支持主播', weight: 6 },
  { content: '下次还来', weight: 4 },
]

export class PopularityManager {
  private static instance: PopularityManager
  private config: PopularityConfig
  private danmakuTimer: NodeJS.Timeout | null = null
  private likeTimer: NodeJS.Timeout | null = null
  private activeRooms: Set<string> = new Set()
  private onSendDanmaku: ((roomId: string, content: string) => Promise<void>) | null = null
  private onSendLike: ((roomId: string) => Promise<void>) | null = null

  private constructor() {
    this.config = {
      enabled: false,
      virtualDanmaku: DEFAULT_DANMAKU_POOL.map((d, i) => ({
        id: `vd_${i}`,
        content: d.content,
        weight: d.weight,
        enabled: true
      })),
      virtualLike: {
        enabled: true,
        minInterval: 5000,   // 5秒
        maxInterval: 15000    // 15秒
      },
      dailyLimit: 100,
      sentToday: 0,
      lastResetDate: ''
    }
    this.loadConfig()
    this.checkDailyReset()
    log.info('PopularityManager initialized')
  }

  public static getInstance(): PopularityManager {
    if (!PopularityManager.instance) {
      PopularityManager.instance = new PopularityManager()
    }
    return PopularityManager.instance
  }

  /**
   * 设置弹幕发送回调
   */
  public setDanmakuCallback(callback: (roomId: string, content: string) => Promise<void>): void {
    this.onSendDanmaku = callback
  }

  /**
   * 设置点赞发送回调
   */
  public setLikeCallback(callback: (roomId: string) => Promise<void>): void {
    this.onSendLike = callback
  }

  /**
   * 启动房间的人气辅助
   */
  public startRoom(roomId: string): void {
    if (!this.config.enabled) {
      log.info(`人气辅助未启用，跳过房间 ${roomId}`)
      return
    }

    this.activeRooms.add(roomId)
    log.info(`启动房间 ${roomId} 的人气辅助`)

    // 启动虚拟弹幕
    this.startVirtualDanmaku(roomId)

    // 启动虚拟点赞
    this.startVirtualLike(roomId)
  }

  /**
   * 停止房间的人气辅助
   */
  public stopRoom(roomId: string): void {
    this.activeRooms.delete(roomId)
    log.info(`停止房间 ${roomId} 的人气辅助`)
  }

  /**
   * 停止所有房间
   */
  public stopAll(): void {
    this.activeRooms.clear()
    this.stopTimers()
    log.info('停止所有房间的人气辅助')
  }

  /**
   * 启动虚拟弹幕
   */
  private startVirtualDanmaku(roomId: string): void {
    if (this.danmakuTimer) {
      clearTimeout(this.danmakuTimer)
    }

    const sendNext = () => {
      if (!this.activeRooms.has(roomId) || !this.config.enabled) {
        return
      }

      this.sendVirtualDanmaku(roomId)
        .then(() => {
          // 随机间隔 10-60 秒
          const delay = 10000 + Math.random() * 50000
          this.danmakuTimer = setTimeout(sendNext, delay)
        })
        .catch(err => {
          log.error(`发送虚拟弹幕失败: ${err}`)
          // 即使失败也继续发送
          const delay = 10000 + Math.random() * 50000
          this.danmakuTimer = setTimeout(sendNext, delay)
        })
    }

    // 初始延迟
    this.danmakuTimer = setTimeout(sendNext, 5000 + Math.random() * 10000)
  }

  /**
   * 启动虚拟点赞
   */
  private startVirtualLike(roomId: string): void {
    if (!this.config.virtualLike.enabled) {
      return
    }

    if (this.likeTimer) {
      clearTimeout(this.likeTimer)
    }

    const sendNext = () => {
      if (!this.activeRooms.has(roomId) || !this.config.enabled) {
        return
      }

      this.sendVirtualLike(roomId)
        .then(() => {
          const { minInterval, maxInterval } = this.config.virtualLike
          const delay = minInterval + Math.random() * (maxInterval - minInterval)
          this.likeTimer = setTimeout(sendNext, delay)
        })
        .catch(err => {
          log.error(`发送虚拟点赞失败: ${err}`)
          const { minInterval, maxInterval } = this.config.virtualLike
          const delay = minInterval + Math.random() * (maxInterval - minInterval)
          this.likeTimer = setTimeout(sendNext, delay)
        })
    }

    // 初始延迟
    this.likeTimer = setTimeout(sendNext, 2000 + Math.random() * 5000)
  }

  /**
   * 发送虚拟弹幕
   */
  private async sendVirtualDanmaku(roomId: string): Promise<void> {
    // 检查每日限制
    this.checkDailyReset()
    if (this.config.sentToday >= this.config.dailyLimit) {
      log.debug('今日虚拟弹幕已达上限')
      return
    }

    // 获取启用的弹幕
    const enabledDanmaku = this.config.virtualDanmaku.filter(d => d.enabled)
    if (enabledDanmaku.length === 0) {
      log.warn('没有启用的虚拟弹幕')
      return
    }

    // 按权重随机选择
    const totalWeight = enabledDanmaku.reduce((sum, d) => sum + d.weight, 0)
    let random = Math.random() * totalWeight
    
    let selectedDanmaku: VirtualDanmaku | null = null
    for (const danmaku of enabledDanmaku) {
      random -= danmaku.weight
      if (random <= 0) {
        selectedDanmaku = danmaku
        break
      }
    }

    if (!selectedDanmaku) {
      selectedDanmaku = enabledDanmaku[Math.floor(Math.random() * enabledDanmaku.length)]
    }

    // 发送弹幕
    if (this.onSendDanmaku) {
      await this.onSendDanmaku(roomId, selectedDanmaku.content)
      
      // 记录发送
      this.config.sentToday++
      this.saveSentToday()
      
      // 记录到数据库（标记为虚拟弹幕）
      this.logVirtualDanmaku(roomId, selectedDanmaku.content)
      
      log.info(`虚拟弹幕已发送 [${roomId}]: ${selectedDanmaku.content}`)
    }
  }

  /**
   * 发送虚拟点赞
   */
  private async sendVirtualLike(roomId: string): Promise<void> {
    if (this.onSendLike) {
      await this.onSendLike(roomId)
      log.debug(`虚拟点赞已发送 [${roomId}]`)
    }
  }

  /**
   * 记录虚拟弹幕到数据库
   */
  private logVirtualDanmaku(roomId: string, content: string): void {
    try {
      const db = getDatabase()
      const logId = uuidv4()
      
      db.prepare(`
        INSERT INTO danmaku_log (id, room_id, content, sender_id, sender_nickname, intent_type, is_virtual, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `).run(logId, roomId, content, 'virtual_user', '虚拟用户', 'chat')
    } catch (error) {
      log.error(`记录虚拟弹幕失败: ${error}`)
    }
  }

  /**
   * 停止定时器
   */
  private stopTimers(): void {
    if (this.danmakuTimer) {
      clearTimeout(this.danmakuTimer)
      this.danmakuTimer = null
    }
    if (this.likeTimer) {
      clearTimeout(this.likeTimer)
      this.likeTimer = null
    }
  }

  /**
   * 检查并重置每日计数
   */
  private checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0]
    if (this.config.lastResetDate !== today) {
      this.config.sentToday = 0
      this.config.lastResetDate = today
      this.saveSentToday()
      log.info(`重置每日虚拟弹幕计数`)
    }
  }

  /**
   * 保存发送计数
   */
  private saveSentToday(): void {
    try {
      const db = getDatabase()
      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('popularity_sent_today', ?, datetime('now'))
      `).run(JSON.stringify({
        sent: this.config.sentToday,
        date: this.config.lastResetDate
      }))
    } catch (error) {
      log.error(`保存虚拟弹幕计数失败: ${error}`)
    }
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const db = getDatabase()
      
      // 加载启用状态
      const enabled = db.prepare("SELECT value FROM settings WHERE key = 'popularity_enabled'").get() as { value: string } | undefined
      if (enabled) {
        this.config.enabled = enabled.value === 'true'
      }

      // 加载虚拟弹幕池
      const danmakuPool = db.prepare("SELECT value FROM settings WHERE key = 'popularity_danmaku_pool'").get() as { value: string } | undefined
      if (danmakuPool) {
        try {
          const pool = JSON.parse(danmakuPool.value)
          if (Array.isArray(pool) && pool.length > 0) {
            this.config.virtualDanmaku = pool
          }
        } catch {
          // 使用默认池
        }
      }

      // 加载点赞配置
      const likeConfig = db.prepare("SELECT value FROM settings WHERE key = 'popularity_like_config'").get() as { value: string } | undefined
      if (likeConfig) {
        try {
          const config = JSON.parse(likeConfig.value)
          this.config.virtualLike = { ...this.config.virtualLike, ...config }
        } catch {
          // 使用默认配置
        }
      }

      // 加载每日限制
      const dailyLimit = db.prepare("SELECT value FROM settings WHERE key = 'popularity_daily_limit'").get() as { value: string } | undefined
      if (dailyLimit) {
        this.config.dailyLimit = parseInt(dailyLimit.value) || 100
      }

      // 加载今日发送数
      const sentToday = db.prepare("SELECT value FROM settings WHERE key = 'popularity_sent_today'").get() as { value: string } | undefined
      if (sentToday) {
        try {
          const data = JSON.parse(sentToday.value)
          this.config.sentToday = data.sent || 0
          this.config.lastResetDate = data.date || ''
        } catch {
          // 使用默认
        }
      }

      this.checkDailyReset()
    } catch (error) {
      log.error(`加载人气配置失败: ${error}`)
    }
  }

  /**
   * 保存配置
   */
  public saveConfig(): void {
    try {
      const db = getDatabase()
      
      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('popularity_enabled', ?, datetime('now'))
      `).run(this.config.enabled.toString())

      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('popularity_danmaku_pool', ?, datetime('now'))
      `).run(JSON.stringify(this.config.virtualDanmaku))

      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('popularity_like_config', ?, datetime('now'))
      `).run(JSON.stringify(this.config.virtualLike))

      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('popularity_daily_limit', ?, datetime('now'))
      `).run(this.config.dailyLimit.toString())

      log.info('人气配置已保存')
    } catch (error) {
      log.error(`保存人气配置失败: ${error}`)
    }
  }

  /**
   * 获取配置
   */
  public getConfig(): PopularityConfig {
    return { ...this.config, virtualDanmaku: [...this.config.virtualDanmaku] }
  }

  /**
   * 更新配置
   */
  public updateConfig(updates: Partial<PopularityConfig>): void {
    if (updates.enabled !== undefined) {
      this.config.enabled = updates.enabled
    }
    if (updates.virtualDanmaku !== undefined) {
      this.config.virtualDanmaku = updates.virtualDanmaku
    }
    if (updates.virtualLike !== undefined) {
      this.config.virtualLike = { ...this.config.virtualLike, ...updates.virtualLike }
    }
    if (updates.dailyLimit !== undefined) {
      this.config.dailyLimit = updates.dailyLimit
    }
    this.saveConfig()
  }

  /**
   * 添加虚拟弹幕
   */
  public addDanmaku(content: string, weight: number = 5): void {
    const id = `vd_${Date.now()}`
    this.config.virtualDanmaku.push({
      id,
      content,
      weight,
      enabled: true
    })
    this.saveConfig()
  }

  /**
   * 移除虚拟弹幕
   */
  public removeDanmaku(id: string): void {
    this.config.virtualDanmaku = this.config.virtualDanmaku.filter(d => d.id !== id)
    this.saveConfig()
  }

  /**
   * 更新虚拟弹幕
   */
  public updateDanmaku(id: string, updates: Partial<VirtualDanmaku>): void {
    const danmaku = this.config.virtualDanmaku.find(d => d.id === id)
    if (danmaku) {
      Object.assign(danmaku, updates)
      this.saveConfig()
    }
  }

  /**
   * 启用/禁用
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    this.saveConfig()
    
    if (!enabled) {
      this.stopAll()
    }
  }

  /**
   * 获取统计数据
   */
  public getStats(): {
    sentToday: number
    dailyLimit: number
    activeRooms: number
    enabled: boolean
  } {
    this.checkDailyReset()
    return {
      sentToday: this.config.sentToday,
      dailyLimit: this.config.dailyLimit,
      activeRooms: this.activeRooms.size,
      enabled: this.config.enabled
    }
  }
}

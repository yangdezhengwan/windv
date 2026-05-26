import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { getDatabase } from '../database'

export interface TimingScript {
  id: string
  content: string
  interval: number  // 秒
  enabled: boolean
  lastExecutedAt: Date | null
}

export class TimingAnnouncer {
  private static instance: TimingAnnouncer
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private scripts: TimingScript[] = []
  private onAnnounce: ((content: string, roomId: string) => void) | null = null
  private roomId: string = ''

  private constructor() {
    log.info('TimingAnnouncer 初始化完成')
  }

  public static getInstance(): TimingAnnouncer {
    if (!TimingAnnouncer.instance) {
      TimingAnnouncer.instance = new TimingAnnouncer()
    }
    return TimingAnnouncer.instance
  }

  /**
   * 设置播报回调
   */
  setOnAnnounce(callback: (content: string, roomId: string) => void): void {
    this.onAnnounce = callback
  }

  /**
   * 加载定时话术
   */
  async loadScripts(roomId: string): Promise<void> {
    this.roomId = roomId
    
    // 从数据库加载分类为 timing 的话术
    const db = getDatabase()
    const rows = db.prepare(`
      SELECT * FROM script 
      WHERE is_active = 1 
      AND category_id IN (SELECT id FROM category WHERE type = 'timing')
    `).all() as any[]

    this.scripts = rows.map(row => {
      const responses = JSON.parse(row.responses)
      return {
        id: row.id,
        content: responses[0] || '',
        interval: parseInt(row.remark) || 300,  // 默认 5 分钟
        enabled: row.is_active === 1,
        lastExecutedAt: null
      }
    })

    log.info(`加载 ${this.scripts.length} 条定时话术`)
  }

  /**
   * 启动定时播报
   */
  start(roomId: string): void {
    this.stop()  // 先停止现有的
    
    if (!this.scripts.length) {
      log.warn('没有定时话术，跳过启动')
      return
    }

    log.info(`启动定时播报 (房间: ${roomId})`)

    // 为每条话术设置定时器
    for (const script of this.scripts) {
      if (!script.enabled) continue

      const timer = setInterval(() => {
        this.executeScript(script)
      }, script.interval * 1000)

      this.timers.set(script.id, timer)
    }
  }

  /**
   * 停止定时播报
   */
  stop(): void {
    log.info('停止定时播报')

    for (const [id, timer] of this.timers) {
      clearInterval(timer)
    }
    this.timers.clear()
  }

  /**
   * 执行单条话术
   */
  private executeScript(script: TimingScript): void {
    if (!this.onAnnounce || !script.content) {
      return
    }

    log.info(`执行定时播报: ${script.content.substring(0, 30)}...`)
    
    this.onAnnounce(script.content, this.roomId)
    script.lastExecutedAt = new Date()
  }

  /**
   * 手动触发一次播报
   */
  triggerOnce(scriptId: string): void {
    const script = this.scripts.find(s => s.id === scriptId)
    if (script) {
      this.executeScript(script)
    }
  }

  /**
   * 手动触发所有播报
   */
  triggerAll(): void {
    for (const script of this.scripts) {
      if (script.enabled) {
        this.executeScript(script)
      }
    }
  }

  /**
   * 添加定时话术
   */
  async addScript(content: string, interval: number): Promise<TimingScript> {
    const db = getDatabase()
    const id = uuidv4()

    // 确保存在定时话术分类
    let categoryId = db.prepare("SELECT id FROM category WHERE type = 'timing'").get() as string | undefined
    if (!categoryId) {
      const catId = uuidv4()
      db.prepare(`
        INSERT INTO category (id, name, type, icon, color, order_index)
        VALUES (?, ?, 'timing', 'Timer', '#00BCD4', 100)
      `).run(catId, '定时播报')
      categoryId = catId
    }

    // 插入话术
    db.prepare(`
      INSERT INTO script (id, category_id, keywords, responses, intent_type, priority, remark)
      VALUES (?, ?, '[]', ?, 'chat', 0, ?)
    `).run(id, categoryId, JSON.stringify([content]), interval.toString())

    const script: TimingScript = {
      id,
      content,
      interval,
      enabled: true,
      lastExecutedAt: null
    }

    this.scripts.push(script)

    // 启动定时器
    if (this.timers.size > 0 || this.roomId) {
      const timer = setInterval(() => {
        this.executeScript(script)
      }, interval * 1000)
      this.timers.set(id, timer)
    }

    return script
  }

  /**
   * 删除定时话术
   */
  async removeScript(id: string): Promise<void> {
    // 停止定时器
    const timer = this.timers.get(id)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(id)
    }

    // 从数组移除
    this.scripts = this.scripts.filter(s => s.id !== id)

    // 从数据库删除
    const db = getDatabase()
    db.prepare('UPDATE script SET is_active = 0 WHERE id = ?').run(id)

    log.info(`删除定时话术: ${id}`)
  }

  /**
   * 更新话术
   */
  async updateScript(id: string, updates: Partial<TimingScript>): Promise<void> {
    const script = this.scripts.find(s => s.id === id)
    if (!script) return

    Object.assign(script, updates)

    // 如果更新了间隔，需要重启定时器
    if (updates.interval !== undefined) {
      const oldTimer = this.timers.get(id)
      if (oldTimer) {
        clearInterval(oldTimer)
        
        if (script.enabled) {
          const newTimer = setInterval(() => {
            this.executeScript(script)
          }, updates.interval * 1000)
          this.timers.set(id, newTimer)
        }
      }
    }

    // 如果更新了启用状态
    if (updates.enabled !== undefined) {
      const timer = this.timers.get(id)
      if (timer) {
        clearInterval(timer)
        this.timers.delete(id)
      }

      if (updates.enabled && script.enabled) {
        const newTimer = setInterval(() => {
          this.executeScript(script)
        }, script.interval * 1000)
        this.timers.set(id, newTimer)
      }
    }

    // 更新数据库
    const db = getDatabase()
    const dbUpdates: string[] = []
    const values: any[] = []

    if (updates.content !== undefined) {
      dbUpdates.push('responses = ?')
      values.push(JSON.stringify([updates.content]))
    }
    if (updates.interval !== undefined) {
      dbUpdates.push('remark = ?')
      values.push(updates.interval.toString())
    }
    if (updates.enabled !== undefined) {
      dbUpdates.push('is_active = ?')
      values.push(updates.enabled ? 1 : 0)
    }

    if (dbUpdates.length > 0) {
      values.push(id)
      db.prepare(`UPDATE script SET ${dbUpdates.join(', ')} WHERE id = ?`).run(...values)
    }
  }

  /**
   * 获取所有定时话术
   */
  getScripts(): TimingScript[] {
    return [...this.scripts]
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop()
    this.scripts = []
    this.onAnnounce = null
  }
}

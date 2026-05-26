/**
 * 循环字幕配置管理器
 * 用于配置和管理直播间循环弹出的字幕内容
 */

import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import log from 'electron-log'

export interface LoopMessage {
  id: string
  content: string
  type: 'product' | 'promotion' | 'follow' | 'rule' | 'custom'
  enabled: boolean
  priority: number
}

export interface LoopConfig {
  enabled: boolean
  interval: number  // 间隔时间（秒）
  randomOrder: boolean  // 随机顺序
  minInterval: number  // 最小间隔（秒）
  maxInterval: number  // 最大间隔（秒）
  useRandomInterval: boolean  // 使用随机间隔
  messages: LoopMessage[]
}

export interface LoopSchedule {
  id: string
  name: string
  startTime: string  // HH:mm 格式
  endTime: string    // HH:mm 格式
  config: LoopConfig
  enabled: boolean
}

export class LoopMessageManager {
  private static instance: LoopMessageManager
  private configPath: string
  private config: LoopConfig
  private schedules: LoopSchedule[] = []
  
  private constructor() {
    this.configPath = join(app.getPath('userData'), 'loop-config.json')
    this.config = this.loadConfig()
    this.schedules = this.loadSchedules()
    log.info('LoopMessageManager initialized')
  }

  static getInstance(): LoopMessageManager {
    if (!LoopMessageManager.instance) {
      LoopMessageManager.instance = new LoopMessageManager()
    }
    return LoopMessageManager.instance
  }

  /**
   * 加载配置
   */
  private loadConfig(): LoopConfig {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8')
        return JSON.parse(data)
      }
    } catch (error) {
      log.error('Failed to load loop config:', error)
    }
    
    // 默认配置
    return {
      enabled: false,
      interval: 60,
      randomOrder: true,
      minInterval: 30,
      maxInterval: 120,
      useRandomInterval: false,
      messages: this.getDefaultMessages()
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
      log.info('Loop config saved')
    } catch (error) {
      log.error('Failed to save loop config:', error)
    }
  }

  /**
   * 加载定时配置
   */
  private loadSchedules(): LoopSchedule[] {
    const schedulePath = join(app.getPath('userData'), 'loop-schedules.json')
    try {
      if (existsSync(schedulePath)) {
        const data = readFileSync(schedulePath, 'utf-8')
        return JSON.parse(data)
      }
    } catch (error) {
      log.error('Failed to load loop schedules:', error)
    }
    return []
  }

  /**
   * 保存定时配置
   */
  private saveSchedules(): void {
    const schedulePath = join(app.getPath('userData'), 'loop-schedules.json')
    try {
      writeFileSync(schedulePath, JSON.stringify(this.schedules, null, 2), 'utf-8')
      log.info('Loop schedules saved')
    } catch (error) {
      log.error('Failed to save loop schedules:', error)
    }
  }

  /**
   * 获取默认消息
   */
  private getDefaultMessages(): LoopMessage[] {
    return [
      {
        id: '1',
        content: '🎉 欢迎来到直播间，点击关注不迷路~',
        type: 'follow',
        enabled: true,
        priority: 1
      },
      {
        id: '2',
        content: '✨ 喜欢这款产品的宝宝们可以下单哦，现货秒发~',
        type: 'product',
        enabled: true,
        priority: 2
      },
      {
        id: '3',
        content: '💰 现在下单享受限时优惠，错过不再有~',
        type: 'promotion',
        enabled: true,
        priority: 3
      },
      {
        id: '4',
        content: '📦 48小时内发货，一般3-5天到货哦~',
        type: 'custom',
        enabled: true,
        priority: 4
      },
      {
        id: '5',
        content: '🔔 点击下方关注按钮，第一时间获取直播通知~',
        type: 'follow',
        enabled: true,
        priority: 5
      },
      {
        id: '6',
        content: '🛡️ 支持7天无理由退换货，放心购买~',
        type: 'rule',
        enabled: true,
        priority: 6
      }
    ]
  }

  // ========== 配置操作 ==========

  /**
   * 获取配置
   */
  getConfig(): LoopConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<LoopConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
    log.info('Loop config updated')
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    this.saveConfig()
  }

  /**
   * 获取当前配置
   */
  getCurrentConfig(): { config: LoopConfig; enabled: boolean } {
    const currentSchedule = this.getCurrentSchedule()
    if (currentSchedule && currentSchedule.enabled) {
      return {
        config: currentSchedule.config,
        enabled: true
      }
    }
    return {
      config: this.config,
      enabled: this.config.enabled
    }
  }

  // ========== 消息操作 ==========

  /**
   * 获取所有消息
   */
  getMessages(): LoopMessage[] {
    return [...this.config.messages]
  }

  /**
   * 添加消息
   */
  addMessage(message: Omit<LoopMessage, 'id'>): LoopMessage {
    const newMessage: LoopMessage = {
      ...message,
      id: Date.now().toString()
    }
    this.config.messages.push(newMessage)
    this.saveConfig()
    return newMessage
  }

  /**
   * 更新消息
   */
  updateMessage(id: string, updates: Partial<LoopMessage>): boolean {
    const index = this.config.messages.findIndex(m => m.id === id)
    if (index !== -1) {
      this.config.messages[index] = { ...this.config.messages[index], ...updates }
      this.saveConfig()
      return true
    }
    return false
  }

  /**
   * 删除消息
   */
  deleteMessage(id: string): boolean {
    const index = this.config.messages.findIndex(m => m.id === id)
    if (index !== -1) {
      this.config.messages.splice(index, 1)
      this.saveConfig()
      return true
    }
    return false
  }

  /**
   * 获取下一条要播报的消息
   */
  getNextMessage(): LoopMessage | null {
    const enabledMessages = this.config.messages
      .filter(m => m.enabled)
      .sort((a, b) => a.priority - b.priority)
    
    if (enabledMessages.length === 0) return null
    
    if (this.config.randomOrder) {
      // 随机选择
      const randomIndex = Math.floor(Math.random() * enabledMessages.length)
      return enabledMessages[randomIndex]
    } else {
      // 按优先级顺序
      return enabledMessages[0]
    }
  }

  /**
   * 计算下一次播报的间隔（秒）
   */
  getNextInterval(): number {
    if (this.config.useRandomInterval) {
      const { minInterval, maxInterval } = this.config
      return Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval
    }
    return this.config.interval
  }

  // ========== 定时任务操作 ==========

  /**
   * 获取所有定时任务
   */
  getSchedules(): LoopSchedule[] {
    return [...this.schedules]
  }

  /**
   * 添加定时任务
   */
  addSchedule(schedule: Omit<LoopSchedule, 'id'>): LoopSchedule {
    const newSchedule: LoopSchedule = {
      ...schedule,
      id: Date.now().toString()
    }
    this.schedules.push(newSchedule)
    this.saveSchedules()
    return newSchedule
  }

  /**
   * 更新定时任务
   */
  updateSchedule(id: string, updates: Partial<LoopSchedule>): boolean {
    const index = this.schedules.findIndex(s => s.id === id)
    if (index !== -1) {
      this.schedules[index] = { ...this.schedules[index], ...updates }
      this.saveSchedules()
      return true
    }
    return false
  }

  /**
   * 删除定时任务
   */
  deleteSchedule(id: string): boolean {
    const index = this.schedules.findIndex(s => s.id === id)
    if (index !== -1) {
      this.schedules.splice(index, 1)
      this.saveSchedules()
      return true
    }
    return false
  }

  /**
   * 获取当前应该使用的定时配置
   */
  private getCurrentSchedule(): LoopSchedule | null {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    for (const schedule of this.schedules) {
      if (!schedule.enabled) continue
      
      const { startTime, endTime } = schedule
      if (this.isTimeInRange(currentTime, startTime, endTime)) {
        return schedule
      }
    }
    
    return null
  }

  /**
   * 判断时间是否在范围内
   */
  private isTimeInRange(current: string, start: string, end: string): boolean {
    if (start <= end) {
      return current >= start && current <= end
    } else {
      // 跨天情况，如 22:00 - 02:00
      return current >= start || current <= end
    }
  }

  // ========== 批量导入/导出 ==========

  /**
   * 导入消息
   */
  importMessages(messages: Omit<LoopMessage, 'id'>[]): number {
    let count = 0
    for (const msg of messages) {
      this.addMessage(msg)
      count++
    }
    return count
  }

  /**
   * 导出消息为 JSON
   */
  exportMessages(): string {
    return JSON.stringify(this.config.messages, null, 2)
  }

  /**
   * 从 JSON 导入
   */
  importFromJson(json: string): { success: number; failed: number } {
    try {
      const messages = JSON.parse(json)
      if (Array.isArray(messages)) {
        const count = this.importMessages(messages)
        return { success: count, failed: 0 }
      }
      return { success: 0, failed: 1 }
    } catch {
      return { success: 0, failed: 1 }
    }
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = {
      enabled: false,
      interval: 60,
      randomOrder: true,
      minInterval: 30,
      maxInterval: 120,
      useRandomInterval: false,
      messages: this.getDefaultMessages()
    }
    this.saveConfig()
    log.info('Loop config reset to default')
  }
}

import { getDatabase } from '../database'
import log from 'electron-log'
import { EventEmitter } from 'events'

interface HighFrequencyQuestion {
  content: string
  count: number
  lastAskedAt: number
  users: Set<string>
}

interface HFQConfig {
  timeWindow: number      // 时间窗口 (毫秒)
  threshold: number       // 触发阈值
  cooldown: number        // 冷却时间 (毫秒)
}

export class HighFrequencyDetector extends EventEmitter {
  private static instance: HighFrequencyDetector
  private questionMap: Map<string, HighFrequencyQuestion> = new Map()
  private recentReplies: Map<string, number> = new Map()  // 记录最近回复时间
  private config: HFQConfig = {
    timeWindow: 30000,    // 30秒
    threshold: 3,         // 3次以上
    cooldown: 60000       // 1分钟冷却
  }
  private cleanupTimer: NodeJS.Timeout | null = null

  private constructor() {
    super()
    this.startCleanup()
    log.info('HighFrequencyDetector initialized')
  }

  static getInstance(): HighFrequencyDetector {
    if (!HighFrequencyDetector.instance) {
      HighFrequencyDetector.instance = new HighFrequencyDetector()
    }
    return HighFrequencyDetector.instance
  }

  /**
   * 记录问题
   */
  recordQuestion(content: string, userId: string): void {
    const normalized = this.normalizeContent(content)
    const now = Date.now()

    let question = this.questionMap.get(normalized)
    
    if (!question) {
      question = {
        content,
        count: 0,
        lastAskedAt: now,
        users: new Set()
      }
      this.questionMap.set(normalized, question)
    }

    // 检查是否在时间窗口内
    if (now - question.lastAskedAt > this.config.timeWindow) {
      // 重置计数
      question.count = 0
      question.users.clear()
    }

    question.count++
    question.users.add(userId)
    question.lastAskedAt = now

    // 检查是否达到高频阈值
    if (this.shouldReply(normalized, question)) {
      this.emit('highFrequency', {
        content,
        count: question.count,
        users: question.users.size,
        normalized
      })
      
      // 记录回复时间
      this.recentReplies.set(normalized, now)
    }
  }

  /**
   * 是否应该回复（避免重复回复）
   */
  private shouldReply(normalized: string, question: HighFrequencyQuestion): boolean {
    // 检查是否达到阈值
    if (question.count < this.config.threshold) {
      return false
    }

    // 检查冷却时间
    const lastReply = this.recentReplies.get(normalized)
    if (lastReply && Date.now() - lastReply < this.config.cooldown) {
      return false
    }

    return true
  }

  /**
   * 标准化内容（用于去重）
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]/g, '')  // 只保留中文、英文、数字
      .trim()
  }

  /**
   * 获取当前高频问题列表
   */
  getHighFrequencyQuestions(): Array<{
    content: string
    count: number
    users: number
    timeLeft: number
  }> {
    const now = Date.now()
    const result: Array<{
      content: string
      count: number
      users: number
      timeLeft: number
    }> = []

    for (const [_, question] of this.questionMap) {
      if (now - question.lastAskedAt <= this.config.timeWindow && question.count >= 2) {
        result.push({
          content: question.content,
          count: question.count,
          users: question.users.size,
          timeLeft: Math.max(0, this.config.timeWindow - (now - question.lastAskedAt))
        })
      }
    }

    return result.sort((a, b) => b.count - a.count)
  }

  /**
   * 配置参数
   */
  configure(config: Partial<HFQConfig>): void {
    this.config = { ...this.config, ...config }
    log.info('HighFrequencyDetector config updated:', this.config)
  }

  /**
   * 获取配置
   */
  getConfig(): HFQConfig {
    return { ...this.config }
  }

  /**
   * 启动清理定时器
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, 60000)  // 每分钟清理一次
  }

  /**
   * 清理过期数据
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, question] of this.questionMap) {
      if (now - question.lastAskedAt > this.config.timeWindow * 2) {
        this.questionMap.delete(key)
        cleaned++
      }
    }

    // 清理过期的回复记录
    for (const [key, time] of this.recentReplies) {
      if (now - time > this.config.cooldown * 2) {
        this.recentReplies.delete(key)
      }
    }

    if (cleaned > 0) {
      log.debug(`Cleaned up ${cleaned} expired questions`)
    }
  }

  /**
   * 重置
   */
  reset(): void {
    this.questionMap.clear()
    this.recentReplies.clear()
    log.info('HighFrequencyDetector reset')
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.questionMap.clear()
    this.recentReplies.clear()
    this.removeAllListeners()
    log.info('HighFrequencyDetector destroyed')
  }
}

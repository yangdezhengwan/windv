import log from 'electron-log'
import { getDatabase } from '../database'

interface RiskConfig {
  minDelay: number
  maxDelay: number
  maxPerMinute: number
  randomVariation: number
}

interface RoomRateLimit {
  count: number
  windowStart: number
}

export class RiskController {
  private config: RiskConfig
  private rateLimitCache: Map<string, RoomRateLimit> = new Map()
  private sensitiveWords: Set<string> = new Set()

  constructor() {
    this.config = {
      minDelay: 1000,
      maxDelay: 3000,
      maxPerMinute: 20,
      randomVariation: 0.3
    }
    
    this.loadConfig()
    this.loadSensitiveWords()
    
    log.info('RiskController 初始化完成')
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const db = getDatabase()
      const settings: Record<string, string> = {}
      
      const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
      rows.forEach(row => {
        settings[row.key] = row.value
      })

      if (settings.min_delay) this.config.minDelay = parseInt(settings.min_delay)
      if (settings.max_delay) this.config.maxDelay = parseInt(settings.max_delay)
      if (settings.max_per_minute) this.config.maxPerMinute = parseInt(settings.max_per_minute)

    } catch (error) {
      log.error('加载风控配置失败:', error)
    }
  }

  /**
   * 加载违禁词
   */
  private loadSensitiveWords(): void {
    try {
      const db = getDatabase()
      const words = db.prepare('SELECT word FROM sensitive_word WHERE is_active = 1').all() as { word: string }[]
      this.sensitiveWords = new Set(words.map(w => w.word))
      
      log.info(`加载违禁词 ${this.sensitiveWords.size} 个`)
    } catch (error) {
      log.error('加载违禁词失败:', error)
    }
  }

  /**
   * 重新加载违禁词
   */
  reloadSensitiveWords(): void {
    this.loadSensitiveWords()
  }

  /**
   * 获取模拟真人延迟
   */
  getHumanDelay(): number {
    const base = this.config.minDelay + Math.random() * (this.config.maxDelay - this.config.minDelay)
    const variation = base * this.config.randomVariation * (Math.random() > 0.5 ? 1 : -1)
    return Math.round(base + variation)
  }

  /**
   * 检查频率限制
   */
  checkRateLimit(roomId: string): boolean {
    const now = Date.now()
    const WINDOW_MS = 60 * 1000 // 1分钟窗口

    let rateLimit = this.rateLimitCache.get(roomId)
    
    if (!rateLimit) {
      rateLimit = { count: 0, windowStart: now }
      this.rateLimitCache.set(roomId, rateLimit)
    }

    // 窗口过期，重置
    if (now - rateLimit.windowStart > WINDOW_MS) {
      rateLimit.count = 0
      rateLimit.windowStart = now
    }

    // 检查是否超限
    if (rateLimit.count >= this.config.maxPerMinute) {
      log.warn(`房间 ${roomId} 触发频率限制: ${rateLimit.count}/${this.config.maxPerMinute}`)
      return true
    }

    rateLimit.count++
    return false
  }

  /**
   * 检查敏感词
   */
  isSensitive(text: string): boolean {
    const lowerText = text.toLowerCase()
    
    for (const word of this.sensitiveWords) {
      if (lowerText.includes(word.toLowerCase())) {
        return true
      }
    }
    
    return false
  }

  /**
   * 获取匹配的敏感词
   */
  getMatchedSensitiveWords(text: string): string[] {
    const lowerText = text.toLowerCase()
    const matched: string[] = []
    
    for (const word of this.sensitiveWords) {
      if (lowerText.includes(word.toLowerCase())) {
        matched.push(word)
      }
    }
    
    return matched
  }

  /**
   * 打乱回复语序
   */
  shuffleResponse(text: string): string {
    // 主动句/被动句转换
    if (Math.random() > 0.5) {
      text = text.replace(/^(.+?)(\s*~\s*)$/, (_, content, suffix) => {
        return content.split(/[，。,]/).reverse().join('，') + suffix
      })
    }

    // 随机添加语气词
    const prefixes = ['', '哈喽~', '亲~', '宝宝~', '小伙伴~']
    const suffixes = ['', '哦~', '呀~', '呢~', '哈~', '嘿~']

    if (Math.random() > 0.7 && !text.startsWith('亲') && !text.startsWith('宝宝')) {
      text = prefixes[Math.floor(Math.random() * prefixes.length)] + text
    }
    if (Math.random() > 0.7 && !text.endsWith('~')) {
      text = text + suffixes[Math.floor(Math.random() * suffixes.length)]
    }

    return text
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RiskConfig>): void {
    this.config = { ...this.config, ...newConfig }
    log.info('风控配置已更新:', this.config)
  }

  /**
   * 获取当前配置
   */
  getConfig(): RiskConfig {
    return { ...this.config }
  }

  /**
   * 获取频率统计
   */
  getRateLimitStats(roomId: string): { count: number; remaining: number; resetIn: number } {
    const now = Date.now()
    const rateLimit = this.rateLimitCache.get(roomId)
    
    if (!rateLimit) {
      return { count: 0, remaining: this.config.maxPerMinute, resetIn: 0 }
    }

    const elapsed = now - rateLimit.windowStart
    const resetIn = Math.max(0, 60000 - elapsed)

    return {
      count: rateLimit.count,
      remaining: Math.max(0, this.config.maxPerMinute - rateLimit.count),
      resetIn
    }
  }
}

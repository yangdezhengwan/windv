/**
 * 平台差异化风控配置
 * 不同平台有不同的风控规则
 */

import { getDatabase } from '../database'
import log from 'electron-log'

export interface PlatformRiskConfig {
  platform: string
  maxPerMinute: number
  minDelay: number
  maxDelay: number
  randomDelay: boolean
  blockedKeywords: string[]
  allowedKeywords: string[]
  specialRules?: Record<string, any>
}

export const DEFAULT_PLATFORM_RISK: Record<string, PlatformRiskConfig> = {
  taobao: {
    platform: 'taobao',
    maxPerMinute: 20,
    minDelay: 1500,
    maxDelay: 3000,
    randomDelay: true,
    blockedKeywords: ['微信', '加V', 'Q群', 'QQ', '私聊', '加群'],
    allowedKeywords: ['领券', '优惠', '限时', '秒杀'],
    specialRules: {
      preventSameReply: true, // 防止相同内容重复回复
      maxSameReplyCount: 3,
    }
  },
  pinduoduo: {
    platform: 'pinduoduo',
    maxPerMinute: 15,
    minDelay: 2000,
    maxDelay: 4000,
    randomDelay: true,
    blockedKeywords: ['微信', '加V', 'Q群', 'QQ', '私聊', '加群', ' VX'],
    allowedKeywords: ['领券', '优惠', '秒杀'],
  },
  douyin: {
    platform: 'douyin',
    maxPerMinute: 25,
    minDelay: 1000,
    maxDelay: 2500,
    randomDelay: true,
    blockedKeywords: ['微信', '加V', 'Q群', 'QQ', '私聊'],
    allowedKeywords: ['粉丝群', '粉丝福利', '关注'],
    specialRules: {
      allowEmoji: true,
      preventRapidReply: true, // 防止快速连续回复
      rapidReplyThreshold: 3,
    }
  },
  video_we: {
    platform: 'video_we',
    maxPerMinute: 20,
    minDelay: 1500,
    maxDelay: 3000,
    randomDelay: true,
    blockedKeywords: ['微信', '加V', 'QQ', '私聊', '二维码'],
    allowedKeywords: ['公众号', '小程序', '视频号'],
  }
}

export class PlatformRiskManager {
  private static instance: PlatformRiskManager
  private configs: Map<string, PlatformRiskConfig> = new Map()
  private replyHistory: Map<string, any[]> = new Map() // 平台: [最近的回复]
  
  private constructor() {
    // 加载默认配置
    Object.entries(DEFAULT_PLATFORM_RISK).forEach(([platform, config]) => {
      this.configs.set(platform, { ...config })
    })
    
    // 从数据库加载用户自定义配置
    this.loadFromDB()
    
    log.info('PlatformRiskManager 初始化完成')
  }

  static getInstance(): PlatformRiskManager {
    if (!PlatformRiskManager.instance) {
      PlatformRiskManager.instance = new PlatformRiskManager()
    }
    return PlatformRiskManager.instance
  }

  /**
   * 从数据库加载配置
   */
  private loadFromDB(): void {
    try {
      const db = getDatabase()
      const rows = db.prepare('SELECT * FROM platform_risk_config WHERE is_active = 1').all()
      
      for (const row of rows) {
        this.configs.set(row.platform, {
          platform: row.platform,
          maxPerMinute: row.max_per_minute,
          minDelay: row.min_delay,
          maxDelay: row.max_delay,
          randomDelay: row.random_delay === 1,
          blockedKeywords: JSON.parse(row.blocked_keywords),
          allowedKeywords: JSON.parse(row.allowed_keywords),
          specialRules: row.special_rules ? JSON.parse(row.special_rules) : undefined,
        })
      }
      
      log.info(`已加载 ${rows.length} 个平台风控配置`)
    } catch (error) {
      log.error('Failed to load risk configs:', error)
    }
  }

  /**
   * 获取平台配置
   */
  getPlatformConfig(platform: string): PlatformRiskConfig {
    return this.configs.get(platform) || DEFAULT_PLATFORM_RISK[platform]
  }

  /**
   * 更新平台配置
   */
  updatePlatformConfig(platform: string, updates: Partial<PlatformRiskConfig>): void {
    const current = this.configs.get(platform)
    if (current) {
      const updated = { ...current, ...updates }
      this.configs.set(platform, updated)
      this.saveToDB(platform, updated)
      log.info(`更新平台 ${platform} 风控配置`)
    }
  }

  /**
   * 保存配置到数据库
   */
  private saveToDB(platform: string, config: PlatformRiskConfig): void {
    try {
      const db = getDatabase()
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO platform_risk_config 
        (platform, max_per_minute, min_delay, max_delay, random_delay, blocked_keywords, allowed_keywords, special_rules, is_active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `)
      
      stmt.run(
        config.platform,
        config.maxPerMinute,
        config.minDelay,
        config.maxDelay,
        config.randomDelay ? 1 : 0,
        JSON.stringify(config.blockedKeywords),
        JSON.stringify(config.allowedKeywords),
        config.specialRules ? JSON.stringify(config.specialRules) : null,
      )
      
      db.prepare('DELETE FROM platform_risk_config WHERE platform = ? AND is_active = 0').run(platform)
    } catch (error) {
      log.error('Failed to save platform risk config:', error)
    }
  }

  /**
   * 检查是否应该回复
   */
  shouldReply(platform: string, lastReplyTime?: Date, recentReplies?: string[]): boolean {
    const config = this.getPlatformConfig(platform)
    
    // 检查回复频率
    if (lastReplyTime) {
      const minDelay = config.randomDelay 
        ? config.minDelay + Math.random() * (config.maxDelay - config.minDelay)
        : config.minDelay
      
      const elapsed = Date.now() - lastReplyTime.getTime()
      if (elapsed < minDelay) {
        return false
      }
    }
    
    // 检查特殊规则
    if (config.specialRules?.preventRapidReply && recentReplies) {
      const last3 = recentReplies.slice(-3)
      if (last3.length >= 3) {
        const allSame = last3.every(reply => reply === last3[0])
        if (allSame) {
          log.warn(`平台 ${platform} 检测到快速连续回复，已阻止`)
          return false
        }
      }
    }
    
    return true
  }

  /**
   * 检查内容是否被禁止
   */
  isBlocked(platform: string, content: string): { blocked: boolean; reason?: string } {
    const config = this.getPlatformConfig(platform)
    const lowerContent = content.toLowerCase()
    
    for (const keyword of config.blockedKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return {
          blocked: true,
          reason: `包含违禁词: ${keyword}`
        }
      }
    }
    
    return { blocked: false }
  }

  /**
   * 记录回复历史
   */
  recordReply(platform: string, content: string): void {
    if (!this.replyHistory.has(platform)) {
      this.replyHistory.set(platform, [])
    }
    
    const history = this.replyHistory.get(platform)!
    history.push({
      content,
      timestamp: Date.now(),
    })
    
    // 只保留最近 10 条
    if (history.length > 10) {
      history.shift()
    }
  }

  /**
   * 获取最近的回复
   */
  getRecentReplies(platform: string): string[] {
    const history = this.replyHistory.get(platform) || []
    return history.map(h => h.content)
  }

  /**
   * 重置回复历史
   */
  resetReplyHistory(platform: string): void {
    this.replyHistory.set(platform, [])
  }

  /**
   * 获取所有平台配置
   */
  getAllConfigs(): Record<string, PlatformRiskConfig> {
    return Object.fromEntries(this.configs)
  }

  /**
   * 重置为默认配置
   */
  resetToDefaults(): void {
    Object.entries(DEFAULT_PLATFORM_RISK).forEach(([platform, config]) => {
      this.configs.set(platform, { ...config })
    })
    log.info('平台风控配置已重置为默认')
  }
}

module.exports = { PlatformRiskManager, DEFAULT_PLATFORM_RISK_CONFIG }
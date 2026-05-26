import Fuse from 'fuse.js'
import log from 'electron-log'
import { getDatabase } from '../database'
import { IntentType } from '../platform/IPlatformAdapter'

export interface MatchResult {
  scriptId: string
  response: string
  matchMode: 'exact' | 'fuzzy' | 'ai'
  score: number
}

interface ScriptRecord {
  id: string
  category_id: string
  keywords: string[]
  responses: string[]
  intent_type: string
  priority: number
  random_enabled: number
}

/**
 * 话术匹配器
 * 支持关键词精确匹配、模糊匹配
 */
export class ScriptMatcher {
  private fuse: Fuse<any> | null = null
  private scriptsCache: ScriptRecord[] = []
  private lastCacheTime: number = 0
  private CACHE_TTL = 60000 // 1分钟缓存

  constructor() {
    log.info('ScriptMatcher 初始化完成')
  }

  /**
   * 匹配话术
   */
  async match(intent: IntentType, userText: string, roomId?: string): Promise<MatchResult | null> {
    // 加载话术缓存
    await this.loadScripts(roomId)

    const lowerText = userText.toLowerCase()

    // 1. 优先：精确关键词匹配
    const exactMatch = this.matchExact(lowerText, intent)
    if (exactMatch) {
      return exactMatch
    }

    // 2. 其次：模糊匹配（Fuse.js）
    const fuzzyMatch = this.matchFuzzy(lowerText, intent)
    if (fuzzyMatch) {
      return fuzzyMatch
    }

    // 3. 最后：拼音模糊匹配
    const pinyinMatch = this.matchPinyin(lowerText, intent)
    if (pinyinMatch) {
      return pinyinMatch
    }

    log.debug(`未匹配到话术: "${userText}" (意图: ${intent})`)
    return null
  }

  /**
   * 加载话术到缓存
   */
  private async loadScripts(roomId?: string): Promise<void> {
    const now = Date.now()
    
    // 检查缓存是否过期
    if (this.scriptsCache.length > 0 && now - this.lastCacheTime < this.CACHE_TTL) {
      return
    }

    try {
      const db = getDatabase()
      
      let query = 'SELECT * FROM script WHERE is_active = 1'
      const params: any[] = []

      if (roomId) {
        // TODO: 支持按房间的话术配置
        // query = 'SELECT s.* FROM script s LEFT JOIN room_script rs ON s.id = rs.script_id WHERE s.is_active = 1 AND (rs.room_id = ? OR rs.room_id IS NULL)'
        // params.push(roomId)
      }

      query += ' ORDER BY priority DESC, hit_count DESC'

      const rows = db.prepare(query).all(...params) as any[]

      this.scriptsCache = rows.map(row => ({
        id: row.id,
        category_id: row.category_id,
        keywords: JSON.parse(row.keywords),
        responses: JSON.parse(row.responses),
        intent_type: row.intent_type,
        priority: row.priority,
        random_enabled: row.random_enabled
      }))

      // 更新模糊搜索索引
      this.updateFuseIndex()

      this.lastCacheTime = now
      log.debug(`加载话术 ${this.scriptsCache.length} 条`)

    } catch (error) {
      log.error('加载话术失败:', error)
    }
  }

  /**
   * 更新模糊搜索索引
   */
  private updateFuseIndex(): void {
    if (this.scriptsCache.length === 0) return

    const fuseOptions: any = {
      keys: ['keywords'],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      ignoreLocation: true
    }

    this.fuse = new Fuse(this.scriptsCache, fuseOptions)
  }

  /**
   * 精确关键词匹配
   */
  private matchExact(text: string, intent: IntentType): MatchResult | null {
    for (const script of this.scriptsCache) {
      // 检查意图类型
      if (script.intent_type !== intent && script.intent_type !== IntentType.CHAT) {
        continue
      }

      // 检查关键词
      for (const keyword of script.keywords) {
        const lowerKeyword = keyword.toLowerCase()
        
        // 全匹配
        if (text.includes(lowerKeyword)) {
          // 增加命中次数
          this.incrementHitCount(script.id)
          
          return {
            scriptId: script.id,
            response: this.selectResponse(script.responses, script.random_enabled),
            matchMode: 'exact',
            score: 1.0
          }
        }
      }
    }

    return null
  }

  /**
   * 模糊匹配
   */
  private matchFuzzy(text: string, intent: IntentType): MatchResult | null {
    if (!this.fuse) return null

    // 搜索与输入文本最相似的话术
    const results = this.fuse.search(text)

    for (const result of results) {
      const script = result.item as ScriptRecord
      
      // 检查意图类型
      if (script.intent_type !== intent && script.intent_type !== IntentType.CHAT) {
        continue
      }

      // 检查相似度阈值
      if (result.score && result.score <= 0.3) {
        this.incrementHitCount(script.id)
        
        return {
          scriptId: script.id,
          response: this.selectResponse(script.responses, script.random_enabled),
          matchMode: 'fuzzy',
          score: 1 - (result.score || 0)
        }
      }
    }

    return null
  }

  /**
   * 拼音模糊匹配
   */
  private matchPinyin(text: string, intent: IntentType): MatchResult | null {
    try {
      // 动态导入拼音库
      const { pinyin } = require('pinyin-pro')
      
      // 转换文本为拼音
      const textPinyin = pinyin(text, { toneType: 'none' }).replace(/\s/g, '')
      
      for (const script of this.scriptsCache) {
        if (script.intent_type !== intent && script.intent_type !== IntentType.CHAT) {
          continue
        }

        for (const keyword of script.keywords) {
          const keywordPinyin = pinyin(keyword, { toneType: 'none' }).replace(/\s/g, '')
          
          // 拼音包含匹配
          if (textPinyin.includes(keywordPinyin) || keywordPinyin.includes(textPinyin)) {
            this.incrementHitCount(script.id)
            
            return {
              scriptId: script.id,
              response: this.selectResponse(script.responses, script.random_enabled),
              matchMode: 'fuzzy',
              score: 0.7
            }
          }
        }
      }

    } catch (error) {
      // 拼音库不可用，忽略
    }

    return null
  }

  /**
   * 选择回复（支持随机轮换）
   */
  private selectResponse(responses: string[], randomEnabled: number): string {
    if (!responses || responses.length === 0) {
      return ''
    }

    if (responses.length === 1 || !randomEnabled) {
      return responses[0]
    }

    // 随机选择
    return responses[Math.floor(Math.random() * responses.length)]
  }

  /**
   * 增加命中次数
   */
  private incrementHitCount(scriptId: string): void {
    try {
      const db = getDatabase()
      db.prepare('UPDATE script SET hit_count = hit_count + 1 WHERE id = ?').run(scriptId)
    } catch (error) {
      log.error('增加命中次数失败:', error)
    }
  }

  /**
   * 清空缓存（强制重新加载）
   */
  clearCache(): void {
    this.scriptsCache = []
    this.lastCacheTime = 0
    this.fuse = null
  }

  /**
   * 刷新缓存
   */
  async refresh(): Promise<void> {
    this.clearCache()
    await this.loadScripts()
  }
}

import log from 'electron-log'
import { IntentType } from '../platform/IPlatformAdapter'

// Re-export IntentType for modules that import from this file
export { IntentType } from '../platform/IPlatformAdapter'

export interface IntentResult {
  type: IntentType
  confidence: number
  matchedKeywords: string[]
  tokens: string[]
}

/**
 * 意图分类器
 * 使用规则 + 关键词权重进行多级意图识别
 */
export class IntentClassifier {
  // 一级规则引擎：正则匹配
  private rulePatterns: Map<IntentType, RegExp[]> = new Map([
    [IntentType.PRICE, [
      /价格|多少钱|多少[块米圆]|价钱|报价|怎么卖|卖多少|价位|贵不贵|便宜|实惠|性价比/i,
    ]],
    [IntentType.LOGISTICS, [
      /发货|到货|物流|快递|几天到|多久到|发货时间|到货时间|包邮|运费|寄出|派送|签收/i,
    ]],
    [IntentType.AFTERSALE, [
      /退货|退款|换货|售后|质保|保修|坏了|有问题|退换|七天|不满意|质量|瑕疵/i,
    ]],
    [IntentType.SIZE, [
      /尺码|大小|尺寸|多长|多宽|身高体重|S\M\L|XL|XXL|合适|合身|胖|瘦|正拍偏大|偏小/i,
    ]],
    [IntentType.DISCOUNT, [
      /优惠|优惠券|红包|满减|折扣|特价|活动|秒杀|拼团|团购|降价|便宜|划算|省钱/i,
    ]],
    [IntentType.AD, [
      /微信|QQ群|加我|私聊|主页|群号|VX|vx|二维码|加微信|加Q|加群/i,
    ]],
    [IntentType.CHAT, [
      /欢迎|你好|hi|hello|666|棒|厉害|牛|赞|打卡|想要|关注|主播|老公|老婆|帅哥|美女/i,
    ]],
  ])

  // 二级关键词权重
  private keywordWeights: Map<string, { type: IntentType; weight: number }> = new Map([
    // 价格类
    ['价格', { type: IntentType.PRICE, weight: 3 }],
    ['多少钱', { type: IntentType.PRICE, weight: 3 }],
    ['便宜', { type: IntentType.PRICE, weight: 2 }],
    ['优惠', { type: IntentType.DISCOUNT, weight: 2 }],
    
    // 物流类
    ['发货', { type: IntentType.LOGISTICS, weight: 3 }],
    ['几天到', { type: IntentType.LOGISTICS, weight: 3 }],
    ['快递', { type: IntentType.LOGISTICS, weight: 2 }],
    
    // 售后类
    ['退货', { type: IntentType.AFTERSALE, weight: 3 }],
    ['售后', { type: IntentType.AFTERSALE, weight: 3 }],
    
    // 尺码类
    ['尺码', { type: IntentType.SIZE, weight: 3 }],
    ['大小', { type: IntentType.SIZE, weight: 2 }],
    
    // 互动类
    ['欢迎', { type: IntentType.CHAT, weight: 1 }],
    ['666', { type: IntentType.CHAT, weight: 1 }],
  ])

  constructor() {
    log.info('IntentClassifier 初始化完成')
  }

  /**
   * 分类意图
   */
  classify(text: string): IntentResult {
    const tokens = this.tokenize(text)
    const lowerText = text.toLowerCase()
    
    // 一级：规则匹配
    const ruleResult = this.matchRules(lowerText)
    if (ruleResult.confidence >= 0.9) {
      return ruleResult
    }

    // 二级：关键词权重
    const keywordResult = this.matchKeywords(lowerText, tokens)
    if (keywordResult.confidence >= 0.5) {
      return keywordResult
    }

    // 默认：互动类
    return {
      type: IntentType.CHAT,
      confidence: 0.3,
      matchedKeywords: [],
      tokens
    }
  }

  /**
   * 正则规则匹配
   */
  private matchRules(text: string): IntentResult {
    const tokens = this.tokenize(text)
    
    for (const [intentType, patterns] of this.rulePatterns) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return {
            type: intentType,
            confidence: 0.95,
            matchedKeywords: [pattern.source],
            tokens
          }
        }
      }
    }

    return { type: IntentType.UNKNOWN, confidence: 0, matchedKeywords: [], tokens }
  }

  /**
   * 关键词权重匹配
   */
  private matchKeywords(text: string, tokens: string[]): IntentResult {
    const scores: Map<IntentType, { score: number; matched: string[] }> = new Map()

    // 遍历文本中的每个词
    for (const token of tokens) {
      const weights = this.getWeightsForToken(token)
      
      for (const { type, weight } of weights) {
        const current = scores.get(type) || { score: 0, matched: [] }
        current.score += weight
        current.matched.push(token)
        scores.set(type, current)
      }
    }

    // 遍历关键词权重表
    for (const [keyword, config] of this.keywordWeights) {
      if (text.includes(keyword.toLowerCase())) {
        const current = scores.get(config.type) || { score: 0, matched: [] }
        current.score += config.weight
        current.matched.push(keyword)
        scores.set(config.type, current)
      }
    }

    // 找出最高分
    let bestType = IntentType.UNKNOWN
    let bestScore = 0
    let bestMatched: string[] = []

    for (const [type, { score, matched }] of scores) {
      if (score > bestScore) {
        bestScore = score
        bestType = type
        bestMatched = matched
      }
    }

    // 归一化置信度
    const confidence = Math.min(bestScore / 5, 1)

    return {
      type: bestType,
      confidence,
      matchedKeywords: [...new Set(bestMatched)],
      tokens
    }
  }

  /**
   * 获取词的所有权重配置
   */
  private getWeightsForToken(token: string): { type: IntentType; weight: number }[] {
    const results: { type: IntentType; weight: number }[] = []
    
    for (const [keyword, config] of this.keywordWeights) {
      if (token.includes(keyword) || keyword.includes(token)) {
        results.push(config)
      }
    }

    return results
  }

  /**
   * 分词（简单实现）
   */
  private tokenize(text: string): string[] {
    // 简单分词：按空格、标点分割
    return text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0)
  }

  /**
   * 添加自定义规则
   */
  addRule(type: IntentType, pattern: RegExp): void {
    const patterns = this.rulePatterns.get(type) || []
    patterns.push(pattern)
    this.rulePatterns.set(type, patterns)
  }

  /**
   * 添加关键词权重
   */
  addKeyword(keyword: string, type: IntentType, weight: number = 1): void {
    this.keywordWeights.set(keyword.toLowerCase(), { type, weight })
  }

  /**
   * 获取所有支持的意图类型
   */
  getSupportedIntents(): IntentType[] {
    return [
      IntentType.CHAT,
      IntentType.PRICE,
      IntentType.LOGISTICS,
      IntentType.AFTERSALE,
      IntentType.SIZE,
      IntentType.DISCOUNT,
      IntentType.AD,
      IntentType.SENSITIVE,
      IntentType.UNKNOWN
    ]
  }

  /**
   * 意图类型描述
   */
  getIntentLabel(type: IntentType): string {
    const labels: Record<IntentType, string> = {
      [IntentType.CHAT]: '日常互动',
      [IntentType.PRICE]: '价格咨询',
      [IntentType.LOGISTICS]: '物流咨询',
      [IntentType.AFTERSALE]: '售后咨询',
      [IntentType.SIZE]: '尺码咨询',
      [IntentType.DISCOUNT]: '优惠咨询',
      [IntentType.AD]: '广告引流',
      [IntentType.SENSITIVE]: '敏感词',
      [IntentType.UNKNOWN]: '未知'
    }
    return labels[type] || '未知'
  }
}

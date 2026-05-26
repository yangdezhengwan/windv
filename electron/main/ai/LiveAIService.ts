/**
 * 直播 AI 服务层
 * 基于大模型的直播场景智能服务
 */

import { LLMManager } from './providers/LLMManager'
import type { LLMMessage } from './providers/types'
import { IntentType } from '../platform/IPlatformAdapter'
import log from 'electron-log'

export interface DanmakuAnalysis {
  intent: IntentType
  confidence: number
  keywords: string[]
  summary: string
  suggestedResponse?: string
}

export interface AILearningSuggestion {
  question: string
  suggestedAnswer: string
  reason: string
  confidence: number
}

export interface LiveStreamingContext {
  productName?: string
  productCategory?: string
  price?: string
  discount?: string
  shippingInfo?: string
  returnPolicy?: string
}

export class LiveAIService {
  private static instance: LiveAIService
  private llmManager: LLMManager
  private context: LiveStreamingContext = {}
  
  private constructor() {
    this.llmManager = LLMManager.getInstance()
    log.info('LiveAIService initialized')
  }

  static getInstance(): LiveAIService {
    if (!LiveAIService.instance) {
      LiveAIService.instance = new LiveAIService()
    }
    return LiveAIService.instance
  }

  /**
   * 设置直播上下文
   */
  setContext(context: Partial<LiveStreamingContext>): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * 分析弹幕意图（基于大模型）
   */
  async analyzeDanmaku(danmaku: string): Promise<DanmakuAnalysis> {
    const systemPrompt = this.buildIntentSystemPrompt()
    
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `分析这条弹幕的意图:\n"${danmaku}"` }
    ]
    
    try {
      const response = await this.llmManager.chat(messages, {
        temperature: 0.3,
        maxTokens: 500
      })
      
      if (response.error) {
        log.error('Intent analysis error:', response.error)
        return this.fallbackIntentAnalysis(danmaku)
      }
      
      return this.parseIntentResponse(response.content, danmaku)
    } catch (error) {
      log.error('Intent analysis failed:', error)
      return this.fallbackIntentAnalysis(danmaku)
    }
  }

  /**
   * 生成智能回复（基于大模型）
   */
  async generateResponse(
    danmaku: string, 
    intent: IntentType,
    customScripts?: string[]
  ): Promise<string> {
    const scriptsContext = customScripts?.length 
      ? `参考话术库:\n${customScripts.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : ''
    
    const prompt = `
你是一个专业的直播带货主播助手。请根据以下信息生成回复：

弹幕内容: "${danmaku}"
弹幕意图: ${this.getIntentLabel(intent)}
${scriptsContext}

产品信息:
- 产品名称: ${this.context.productName || '未设置'}
- 产品分类: ${this.context.productCategory || '通用'}
- 价格: ${this.context.price || '未设置'}
- 优惠: ${this.context.discount || '未设置'}
- 发货: ${this.context.shippingInfo || '48小时内发货'}
- 售后: ${this.context.returnPolicy || '7天无理由退换'}

要求:
1. 回复要自然、亲切，符合直播带货风格
2. 长度控制在20-50字
3. 不要重复，使用多样化表达
4. 如果是广告/引流内容，请礼貌拒绝
`
    
    try {
      const response = await this.llmManager.chat([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.8,
        maxTokens: 200
      })
      
      return response.content || this.getDefaultResponse(intent)
    } catch (error) {
      log.error('Generate response error:', error)
      return this.getDefaultResponse(intent)
    }
  }

  /**
   * AI 自动学习 - 分析未匹配问题，生成建议
   */
  async analyzeForLearning(unmatchedDanmaku: string[]): Promise<AILearningSuggestion[]> {
    if (unmatchedDanmaku.length === 0) return []
    
    const danmakuList = unmatchedDanmaku.map((d, i) => `${i + 1}. "${d}"`).join('\n')
    
    const prompt = `
作为直播带货 AI 助手，分析以下未匹配的弹幕，生成回复建议：

弹幕列表:
${danmakuList}

产品信息:
- 产品名称: ${this.context.productName || '通用产品'}
- 产品分类: ${this.context.productCategory || '综合'}
- 价格: ${this.context.price || '未设置'}
- 优惠: ${this.context.discount || '无'}
- 发货: ${this.context.shippingInfo || '48小时内发货'}
- 售后: ${this.context.returnPolicy || '7天无理由退换'}

请分析这些弹幕可能的意图，并给出建议的回复。每条弹幕输出格式:
[弹幕序号]|意图类型|建议回复|置信度

意图类型包括: price(价格), logistics(物流), aftersale(售后), size(尺码), discount(优惠), chat(互动), other(其他)

请确保回复真实可用，不要编造产品信息。
`
    
    try {
      const response = await this.llmManager.chat([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.5,
        maxTokens: 1000
      })
      
      return this.parseLearningSuggestions(response.content, unmatchedDanmaku)
    } catch (error) {
      log.error('AI learning analysis error:', error)
      return []
    }
  }

  /**
   * 生成定时播报内容
   */
  async generateTimingContent(type: 'product' | 'promotion' | 'follow' | 'rule'): Promise<string> {
    const prompts: Record<string, string> = {
      product: `生成一条产品卖点播报，吸引观众购买。产品: ${this.context.productName || '本产品'}，价格: ${this.context.price || '优惠中'}。要求: 15-30字，自然亲切。`,
      promotion: `生成一条促销活动播报。优惠内容: ${this.context.discount || '限时优惠'}。要求: 15-30字，有紧迫感。`,
      follow: `生成一条关注引导播报。要求: 10-20字，鼓励关注直播间。`,
      rule: `生成一条直播间规则说明。要求: 15-30字，简洁明了。`
    }
    
    try {
      const response = await this.llmManager.chat([
        { role: 'user', content: prompts[type] }
      ], {
        temperature: 0.8,
        maxTokens: 100
      })
      
      return response.content || this.getDefaultTimingContent(type)
    } catch (error) {
      return this.getDefaultTimingContent(type)
    }
  }

  /**
   * 生成成交播报（增强版）
   */
  async generateOrderAnnouncement(
    nickname: string,
    amount: number,
    level: 'normal' | 'large' | 'mega'
  ): Promise<string> {
    const templates = {
      normal: '恭喜 {nickname} 拍下本场直播商品，感谢支持~',
      large: '🎉 大单来袭！{nickname} 豪掷 {amount} 元，感谢信任！',
      mega: '👑👑👑 尊贵客户 {nickname} 豪购 {amount} 元！全场沸腾！'
    }
    
    // 如果已配置大模型，可以生成更个性化的播报
    if (this.llmManager.getConfiguredProviders().length > 0) {
      const prompt = `生成一条直播成交播报：
客户: ${nickname}
金额: ${amount}元
等级: ${level}

要求:
- ${level === 'normal' ? '普通订单，友好祝贺' : level === 'large' ? '大额订单，热烈庆祝' : '超大额订单，奢华庆祝'}
- 15-40字
- 包含emoji增加氛围
`
      try {
        const response = await this.llmManager.chat([
          { role: 'user', content: prompt }
        ], { temperature: 0.9, maxTokens: 100 })
        
        if (response.content) return response.content
      } catch {}
    }
    
    // 回退到模板
    const template = templates[level]
    return template
      .replace('{nickname}', this.maskNickname(nickname))
      .replace('{amount}', String(amount))
  }

  /**
   * 昵称脱敏
   */
  private maskNickname(nickname: string): string {
    if (nickname.length <= 2) return nickname + '**'
    return nickname[0] + '*'.repeat(nickname.length - 2) + nickname[nickname.length - 1]
  }

  /**
   * 构建意图识别系统提示
   */
  private buildIntentSystemPrompt(): string {
    return `
你是一个专业的直播带货弹幕意图分类器。请分析用户弹幕的意图。

意图类型:
- price: 价格相关（问价、优惠、折扣等）
- logistics: 物流相关（发货时间、到货时间、快递等）
- aftersale: 售后相关（退货、退款、质量问题等）
- size: 尺码相关（尺寸、大小、合适与否等）
- discount: 优惠相关（优惠券、红包、满减等）
- chat: 普通互动（打招呼、点赞、关注等）
- ad: 广告引流（微信、QQ、私聊等）

输出格式（JSON）:
{
  "intent": "意图类型",
  "confidence": 0.0-1.0,
  "keywords": ["关键词1", "关键词2"],
  "summary": "一句话概括弹幕内容",
  "suggestedResponse": "建议回复（可选）"
}

请只输出JSON，不要其他内容。
`
  }

  /**
   * 解析意图识别响应
   */
  private parseIntentResponse(content: string, originalDanmaku: string): DanmakuAnalysis {
    try {
      // 提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          intent: parsed.intent || 'chat',
          confidence: parsed.confidence || 0.5,
          keywords: parsed.keywords || [],
          summary: parsed.summary || originalDanmaku,
          suggestedResponse: parsed.suggestedResponse
        }
      }
    } catch {}
    
    return this.fallbackIntentAnalysis(originalDanmaku)
  }

  /**
   * 回退意图分析（规则匹配）
   */
  private fallbackIntentAnalysis(danmaku: string): DanmakuAnalysis {
    const lower = danmaku.toLowerCase()
    
    if (/价格|多少钱|便宜|优惠/.test(lower)) {
      return { intent: IntentType.PRICE, confidence: 0.8, keywords: ['价格'], summary: danmaku }
    }
    if (/发货|物流|几天|快递/.test(lower)) {
      return { intent: IntentType.LOGISTICS, confidence: 0.8, keywords: ['物流'], summary: danmaku }
    }
    if (/退货|退款|售后|质量/.test(lower)) {
      return { intent: IntentType.AFTERSALE, confidence: 0.8, keywords: ['售后'], summary: danmaku }
    }
    if (/尺码|大小|S|M|L|XL/.test(lower)) {
      return { intent: IntentType.SIZE, confidence: 0.7, keywords: ['尺码'], summary: danmaku }
    }
    if (/优惠券|红包|满减/.test(lower)) {
      return { intent: IntentType.DISCOUNT, confidence: 0.8, keywords: ['优惠'], summary: danmaku }
    }
    if (/微信|QQ|加我|私聊/.test(lower)) {
      return { intent: IntentType.AD, confidence: 0.9, keywords: ['引流'], summary: danmaku }
    }
    
    return { intent: IntentType.CHAT, confidence: 0.5, keywords: [], summary: danmaku }
  }

  /**
   * 解析学习建议
   */
  private parseLearningSuggestions(content: string, originalDanmaku: string[]): AILearningSuggestion[] {
    const suggestions: AILearningSuggestion[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const parts = line.split('|')
      if (parts.length >= 4) {
        const index = parseInt(parts[0]) - 1
        if (index >= 0 && index < originalDanmaku.length) {
          suggestions.push({
            question: originalDanmaku[index],
            suggestedAnswer: parts[2] || '',
            reason: parts[3] || '',
            confidence: parseFloat(parts[4]) || 0.5
          })
        }
      }
    }
    
    return suggestions
  }

  /**
   * 获取意图标签
   */
  private getIntentLabel(intent: IntentType): string {
    const labels: Record<string, string> = {
      price: '价格咨询',
      logistics: '物流咨询',
      aftersale: '售后咨询',
      size: '尺码咨询',
      discount: '优惠咨询',
      chat: '日常互动',
      ad: '广告引流'
    }
    return labels[intent] || '其他'
  }

  /**
   * 获取默认回复
   */
  private getDefaultResponse(intent: IntentType): string {
    const responses: Record<IntentType, string> = {
      [IntentType.PRICE]: '感谢关注~有任何问题随时问主播哦',
      [IntentType.LOGISTICS]: '我们48小时内发货，一般3-5天到~',
      [IntentType.AFTERSALE]: '放心购买！我们提供7天无理由退换~',
      [IntentType.SIZE]: '可以根据尺码表选择，有问题随时问客服~',
      [IntentType.DISCOUNT]: '关注主播，获取更多优惠信息~',
      [IntentType.CHAT]: '感谢支持，点击关注不迷路~',
      [IntentType.AD]: '抱歉，直播间不支持私下交易哦',
      [IntentType.SENSITIVE]: '抱歉，该内容不适合在直播间讨论',
      [IntentType.UNKNOWN]: '感谢您的支持~'
    }
    return responses[intent] || '感谢您的支持~'
  }

  /**
   * 获取默认定时内容
   */
  private getDefaultTimingContent(type: string): string {
    const contents: Record<string, string> = {
      product: '喜欢的话赶紧下单哦，错过就没有啦~',
      promotion: '现在下单享受优惠，抓紧时间~',
      follow: '点个关注不迷路，主播带你抢好货~',
      rule: '下单后有任何问题可以随时联系客服哦~'
    }
    return contents[type] || '欢迎来到直播间~'
  }
}

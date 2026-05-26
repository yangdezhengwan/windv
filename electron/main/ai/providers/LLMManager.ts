/**
 * 大模型统一管理器
 * 管理 DeepSeek、豆包、千问等多个大模型 API
 */

import { DeepSeekProvider } from './DeepSeekProvider'
import { DoubaoProvider } from './DoubaoProvider'
import { QianwenProvider } from './QianwenProvider'
import { LLMProvider, LLMConfig, LLMMessage, LLMResponse, LLMOptions } from './types'
import log from 'electron-log'

export type ProviderType = 'deepseek' | 'doubao' | 'qianwen' | 'openai' | 'claude'

export interface ProviderInfo {
  type: ProviderType
  name: string
  logo: string
  defaultModel: string
  models: string[]
  baseUrl?: string
}

export const PROVIDER_INFO: Record<ProviderType, ProviderInfo> = {
  deepseek: {
    type: 'deepseek',
    name: 'DeepSeek',
    logo: '🔮',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  doubao: {
    type: 'doubao',
    name: '豆包',
    logo: '🫛',
    defaultModel: 'doubao-pro-32k',
    models: ['doubao-pro-32k', 'doubao-lite-32k', 'doubao-pro-128k']
  },
  qianwen: {
    type: 'qianwen',
    name: '通义千问',
    logo: '🐎',
    defaultModel: 'qwen-turbo',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-7b-chat', 'qwen-14b-chat', 'qwen-72b-chat']
  },
  openai: {
    type: 'openai',
    name: 'OpenAI',
    logo: '🤖',
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
  },
  claude: {
    type: 'claude',
    name: 'Claude',
    logo: '🧠',
    defaultModel: 'claude-3-haiku',
    models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']
  }
}

export class LLMManager {
  private static instance: LLMManager
  private providers: Map<ProviderType, LLMProvider> = new Map()
  private currentProvider: ProviderType = 'deepseek'
  private configs: Map<ProviderType, LLMConfig> = new Map()
  
  private constructor() {
    log.info('LLMManager initialized')
  }

  static getInstance(): LLMManager {
    if (!LLMManager.instance) {
      LLMManager.instance = new LLMManager()
    }
    return LLMManager.instance
  }

  /**
   * 配置 API
   */
  configure(config: LLMConfig): void {
    this.configs.set(config.provider, config)
    
    let provider: LLMProvider
    
    switch (config.provider) {
      case 'deepseek':
        provider = new DeepSeekProvider(config.apiKey, {
          baseUrl: config.baseUrl,
          model: config.model
        })
        break
        
      case 'doubao':
        provider = new DoubaoProvider(config.apiKey, {
          baseUrl: config.baseUrl,
          model: config.model
        })
        break
        
      case 'qianwen':
        provider = new QianwenProvider(config.apiKey, {
          baseUrl: config.baseUrl,
          model: config.model
        })
        break
        
      default:
        log.warn(`Unsupported provider: ${config.provider}`)
        return
    }
    
    this.providers.set(config.provider, provider)
    log.info(`LLM provider configured: ${config.provider}`)
  }

  /**
   * 设置当前使用的 provider
   */
  setCurrentProvider(type: ProviderType): void {
    if (!this.providers.has(type)) {
      const config = this.configs.get(type)
      if (config) {
        this.configure(config)
      } else {
        log.warn(`Provider ${type} not configured`)
        return
      }
    }
    this.currentProvider = type
    log.info(`Current LLM provider: ${type}`)
  }

  /**
   * 获取当前 provider
   */
  getCurrentProvider(): LLMProvider | undefined {
    return this.providers.get(this.currentProvider)
  }

  /**
   * 发送对话
   */
  async chat(
    messages: LLMMessage[], 
    options?: Partial<LLMOptions & { provider?: ProviderType }>
  ): Promise<LLMResponse> {
    const providerType = options?.provider || this.currentProvider
    const provider = this.providers.get(providerType)
    
    if (!provider) {
      // 尝试从配置创建
      const config = this.configs.get(providerType)
      if (config) {
        this.configure(config)
      } else {
        return {
          content: '',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          model: '',
          finishReason: 'error',
          error: `Provider ${providerType} not configured`
        }
      }
    }
    
    return this.providers.get(providerType)!.chat(messages, options)
  }

  /**
   * 流式对话
   */
  async chatStream(
    messages: LLMMessage[],
    callback: (chunk: string) => void,
    options?: Partial<LLMOptions & { provider?: ProviderType }>
  ): Promise<void> {
    const providerType = options?.provider || this.currentProvider
    const provider = this.providers.get(providerType)
    
    if (!provider) {
      const config = this.configs.get(providerType)
      if (config) {
        this.configure(config)
      } else {
        throw new Error(`Provider ${providerType} not configured`)
      }
    }
    
    return this.providers.get(providerType)!.chatStream(messages, callback, options)
  }

  /**
   * 检查所有已配置 provider 的状态
   */
  async checkAllProviders(): Promise<Record<ProviderType, boolean>> {
    const results: Record<string, boolean> = {}
    
    for (const [type, provider] of this.providers) {
      results[type] = await provider.ping()
    }
    
    return results as Record<ProviderType, boolean>
  }

  /**
   * 获取已配置的 provider 列表
   */
  getConfiguredProviders(): ProviderType[] {
    return Array.from(this.providers.keys())
  }

  /**
   * 获取当前 provider 类型
   */
  getCurrentProviderType(): ProviderType {
    return this.currentProvider
  }

  /**
   * 获取 provider 信息
   */
  getProviderInfo(type: ProviderType): ProviderInfo | undefined {
    return PROVIDER_INFO[type]
  }

  /**
   * 获取所有 provider 信息
   */
  getAllProviderInfo(): ProviderInfo[] {
    return Object.values(PROVIDER_INFO)
  }

  /**
   * 测试连接
   */
  async testConnection(type: ProviderType, apiKey: string, model?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 临时创建 provider
      let provider: LLMProvider
      
      switch (type) {
        case 'deepseek':
          provider = new DeepSeekProvider(apiKey, { model })
          break
        case 'doubao':
          provider = new DoubaoProvider(apiKey, { model })
          break
        case 'qianwen':
          provider = new QianwenProvider(apiKey, { model })
          break
        default:
          return { success: false, error: 'Unsupported provider' }
      }
      
      const result = await provider.chat([
        { role: 'user', content: 'Hello, please respond with "OK"' }
      ], { maxTokens: 10 })
      
      if (result.error) {
        return { success: false, error: result.error }
      }
      
      return { success: result.content.length > 0 }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

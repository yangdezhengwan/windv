/**
 * 大模型 API 提供商接口定义
 * 支持 DeepSeek、豆包(豆包)、千问(通义千问)等大模型
 */

export type ProviderType = 'deepseek' | 'doubao' | 'qianwen' | 'openai' | 'claude'

export interface LLMConfig {
  provider: ProviderType
  apiKey: string
  baseUrl?: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  error?: string
}

export interface LLMProvider {
  /**
   * 发送对话请求
   */
  chat(messages: LLMMessage[], options?: Partial<LLMOptions>): Promise<LLMResponse>
  
  /**
   * 流式对话请求
   */
  chatStream(messages: LLMMessage[], callback: (chunk: string) => void, options?: Partial<LLMOptions>): Promise<void>
  
  /**
   * 检查 API 可用性
   */
  ping(): Promise<boolean>
  
  /**
   * 获取模型列表
   */
  listModels(): Promise<string[]>
}

export interface LLMOptions {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stop?: string[]
}

// 默认配置
export const DEFAULT_LLM_OPTIONS: LLMOptions = {
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0
}

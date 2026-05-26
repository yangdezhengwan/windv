/**
 * 豆包大模型 API 提供者 (火山引擎/Volcengine)
 * 文档: https://www.volcengine.com/docs/82379/1263482
 */

import { LLMProvider, LLMMessage, LLMResponse, LLMOptions, DEFAULT_LLM_OPTIONS } from './types'
import log from 'electron-log'

export class DoubaoProvider implements LLMProvider {
  private apiKey: string
  private baseUrl: string = 'https://ark.cn-beijing.volces.com/api/v3'
  private model: string = 'doubao-pro-32k'
  
  constructor(apiKey: string, options?: { baseUrl?: string; model?: string }) {
    this.apiKey = apiKey
    if (options?.baseUrl) this.baseUrl = options.baseUrl
    if (options?.model) this.model = options.model
    log.info(`DoubaoProvider initialized with model: ${this.model}`)
  }

  /**
   * 发送对话请求
   */
  async chat(messages: LLMMessage[], options?: Partial<LLMOptions>): Promise<LLMResponse> {
    const mergedOptions = { ...DEFAULT_LLM_OPTIONS, ...options }
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          temperature: mergedOptions.temperature,
          max_tokens: mergedOptions.maxTokens,
          top_p: mergedOptions.topP,
          frequency_penalty: mergedOptions.frequencyPenalty,
          presence_penalty: mergedOptions.presencePenalty,
          stop: mergedOptions.stop
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        model: data.model || this.model,
        finishReason: data.choices?.[0]?.finish_reason || 'stop'
      }
    } catch (error: any) {
      log.error('Doubao chat error:', error)
      return {
        content: '',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        model: this.model,
        finishReason: 'error',
        error: error.message
      }
    }
  }

  /**
   * 流式对话请求
   */
  async chatStream(
    messages: LLMMessage[], 
    callback: (chunk: string) => void, 
    options?: Partial<LLMOptions>
  ): Promise<void> {
    const mergedOptions = { ...DEFAULT_LLM_OPTIONS, ...options }
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          temperature: mergedOptions.temperature,
          max_tokens: mergedOptions.maxTokens,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `API Error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) callback(content)
            } catch {}
          }
        }
      }
    } catch (error: any) {
      log.error('Doubao stream error:', error)
      throw error
    }
  }

  /**
   * 检查 API 可用性
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 获取模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      
      if (!response.ok) return [this.model]
      
      const data = await response.json()
      return data.data?.map((m: any) => m.id) || [this.model]
    } catch {
      return [this.model]
    }
  }
}

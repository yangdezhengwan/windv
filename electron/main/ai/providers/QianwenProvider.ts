/**
 * 千问(通义千问)大模型 API 提供者
 * 文档: https://help.aliyun.com/zh/dashscope/
 */

import { LLMProvider, LLMMessage, LLMResponse, LLMOptions, DEFAULT_LLM_OPTIONS } from './types'
import log from 'electron-log'

export class QianwenProvider implements LLMProvider {
  private apiKey: string
  private baseUrl: string = 'https://dashscope.aliyuncs.com/api/v1'
  private model: string = 'qwen-turbo'
  
  constructor(apiKey: string, options?: { baseUrl?: string; model?: string }) {
    this.apiKey = apiKey
    if (options?.baseUrl) this.baseUrl = options.baseUrl
    if (options?.model) this.model = options.model
    log.info(`QianwenProvider initialized with model: ${this.model}`)
  }

  /**
   * 发送对话请求
   */
  async chat(messages: LLMMessage[], options?: Partial<LLMOptions>): Promise<LLMResponse> {
    const mergedOptions = { ...DEFAULT_LLM_OPTIONS, ...options }
    
    try {
      const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: {
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          },
          parameters: {
            temperature: mergedOptions.temperature,
            max_tokens: mergedOptions.maxTokens,
            top_p: mergedOptions.topP,
            result_format: 'message'
          }
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      
      const content = data.output?.choices?.[0]?.message?.content || ''
      
      return {
        content,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        model: this.model,
        finishReason: data.output?.choices?.[0]?.finish_reason || 'stop'
      }
    } catch (error: any) {
      log.error('Qianwen chat error:', error)
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
   * 流式对话请求 (千问使用 SSE)
   */
  async chatStream(
    messages: LLMMessage[], 
    callback: (chunk: string) => void, 
    options?: Partial<LLMOptions>
  ): Promise<void> {
    const mergedOptions = { ...DEFAULT_LLM_OPTIONS, ...options }
    
    try {
      const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify({
          model: this.model,
          input: {
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          },
          parameters: {
            temperature: mergedOptions.temperature,
            max_tokens: mergedOptions.maxTokens,
            result_format: 'message',
            incremental_output: true
          }
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
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim()
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.output?.choices?.[0]?.message?.content
              if (content) callback(content)
            } catch {}
          }
        }
      }
    } catch (error: any) {
      log.error('Qianwen stream error:', error)
      throw error
    }
  }

  /**
   * 检查 API 可用性
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: { messages: [{ role: 'user', content: 'ping' }] },
          parameters: { max_tokens: 1 }
        })
      })
      return response.ok || response.status === 400 // 400 可能是因为内容问题但服务可用
    } catch {
      return false
    }
  }

  /**
   * 获取模型列表
   */
  async listModels(): Promise<string[]> {
    // 千问公开的模型列表
    return [
      'qwen-turbo',
      'qwen-plus',
      'qwen-max',
      'qwen-max-longcontext',
      'qwen-7b-chat',
      'qwen-14b-chat',
      'qwen-72b-chat'
    ]
  }
}

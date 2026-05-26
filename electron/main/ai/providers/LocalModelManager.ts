/**
 * 本地模型管理器
 * 支持 Ollama、本地 HF 模型等多种本地部署方案
 */

import { LLMMessage } from './types'
import log from 'electron-log'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

export interface LocalModel {
  id: string
  name: string
  size: string  // 模型大小，如 "4GB"
  sizeBytes: number
  description: string
  ollamaName?: string  // Ollama 模型名称
  downloaded: boolean
  downloadProgress?: number
}

export interface OllamaStatus {
  installed: boolean
  running: boolean
  version?: string
  models: string[]
}

export class LocalModelManager {
  private static instance: LocalModelManager
  private ollamaUrl: string = 'http://localhost:11434'
  private downloadDir: string
  
  // 推荐的轻量模型
  private recommendedModels = [
    { id: 'llama2:7b', name: 'Llama 2 7B', size: '3.8GB', sizeBytes: 3800000000, description: 'Meta 开源模型，中文能力一般，英文能力强', ollamaName: 'llama2:7b' },
    { id: 'qwen:7b', name: '通义千问 7B', size: '4.4GB', sizeBytes: 4400000000, description: '阿里开源模型，中文能力强，性价比高', ollamaName: 'qwen:7b' },
    { id: 'qwen:14b', name: '通义千问 14B', size: '8.2GB', sizeBytes: 8200000000, description: '阿里开源模型，中文能力强，效果更好', ollamaName: 'qwen:14b' },
    { id: 'mistral:7b', name: 'Mistral 7B', size: '4.1GB', sizeBytes: 4100000000, description: '欧洲开源模型，性能优秀', ollamaName: 'mistral:7b' },
    { id: 'phi:2.7b', name: 'Phi-2 2.7B', size: '1.7GB', sizeBytes: 1700000000, description: '微软小模型，体积小，适合低配电脑', ollamaName: 'phi:2.7b' },
    { id: 'llama3:8b', name: 'Llama 3 8B', size: '4.7GB', sizeBytes: 4700000000, description: 'Meta 最新模型，效果大幅提升', ollamaName: 'llama3:8b' }
  ]
  
  private constructor() {
    this.downloadDir = join(app.getPath('userData'), 'local-models')
    if (!existsSync(this.downloadDir)) {
      mkdirSync(this.downloadDir, { recursive: true })
    }
    log.info('LocalModelManager initialized')
  }

  static getInstance(): LocalModelManager {
    if (!LocalModelManager.instance) {
      LocalModelManager.instance = new LocalModelManager()
    }
    return LocalModelManager.instance
  }

  /**
   * 获取 Ollama 状态
   */
  async getOllamaStatus(): Promise<OllamaStatus> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          installed: true,
          running: true,
          version: await this.getOllamaVersion(),
          models: data.models?.map((m: any) => m.name) || []
        }
      }
      
      return { installed: true, running: false, models: [] }
    } catch {
      return { installed: false, running: false, models: [] }
    }
  }

  /**
   * 获取 Ollama 版本
   */
  private async getOllamaVersion(): Promise<string | undefined> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/version`, {
        signal: AbortSignal.timeout(2000)
      })
      if (response.ok) {
        const data = await response.json()
        return data.version
      }
    } catch {}
    return undefined
  }

  /**
   * 获取推荐模型列表
   */
  getRecommendedModels(): any[] {
    return this.recommendedModels
  }

  /**
   * 检查模型是否已下载
   */
  async isModelDownloaded(modelId: string): Promise<boolean> {
    const status = await this.getOllamaStatus()
    return status.models.includes(modelId)
  }

  /**
   * 下载模型（通过 Ollama）
   */
  async pullModel(
    modelId: string, 
    onProgress?: (progress: number, status: string) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查 Ollama 是否运行
      const status = await this.getOllamaStatus()
      if (!status.installed) {
        return { 
          success: false, 
          error: '请先安装 Ollama，请访问 https://ollama.com 下载安装' 
        }
      }
      if (!status.running) {
        return { 
          success: false, 
          error: 'Ollama 未运行，请在后台启动 Ollama' 
        }
      }

      onProgress?.(0, '开始下载模型...')

      // 发起拉取请求
      const response = await fetch(`${this.ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelId }),
        signal: AbortSignal.timeout(600000) // 10分钟超时
      })

      if (!response.ok) {
        return { success: false, error: `下载失败: ${response.status}` }
      }

      // 解析进度
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
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              
              if (data.status) {
                if (data.total && data.completed) {
                  const progress = Math.round((data.completed / data.total) * 100)
                  onProgress?.(progress, `下载中... ${progress}%`)
                } else if (data.status === 'success') {
                  onProgress?.(100, '下载完成')
                } else {
                  onProgress?.(0, data.status)
                }
              }
            } catch {}
          }
        }
      }

      return { success: true }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: '下载超时，请检查网络或重试' }
      }
      return { success: false, error: error.message }
    }
  }

  /**
   * 删除模型
   */
  async deleteModel(modelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelId })
      })

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.json().catch(() => ({}))
        return { success: false, error: error.error || '删除失败' }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 本地模型聊天
   */
  async chat(
    modelId: string,
    messages: LLMMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
      onStream?: (chunk: string) => void
    }
  ): Promise<{ content: string; error?: string }> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: options?.onStream ? true : false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2000
          }
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return { content: '', error: error.error || '请求失败' }
      }

      if (options?.onStream) {
        // 流式响应
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let buffer = ''

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)
                if (data.message?.content) {
                  fullContent += data.message.content
                  options.onStream!(data.message.content)
                }
              } catch {}
            }
          }
        }

        return { content: fullContent }
      } else {
        // 非流式响应
        const data = await response.json()
        return { content: data.message?.content || '' }
      }
    } catch (error: any) {
      return { content: '', error: error.message }
    }
  }

  /**
   * 获取安装指引
   */
  getInstallGuide(): { windows: string; macos: string; linux: string } {
    return {
      windows: '1. 访问 https://ollama.com\n2. 下载 Windows 版本安装包\n3. 双击安装，完成后 Ollama 会在后台运行\n4. 首次运行会自动下载默认模型',
      macos: '1. 访问 https://ollama.com\n2. 下载 macOS 版本\n3. 双击安装，菜单栏会出现 Ollama 图标',
      linux: 'curl -fsSL https://ollama.com/install.sh | sh'
    }
  }

  /**
   * 检查是否有可用的本地模型
   */
  async hasAvailableLocalModel(): Promise<boolean> {
    const status = await this.getOllamaStatus()
    return status.running && status.models.length > 0
  }

  /**
   * 获取已下载的模型列表
   */
  async getDownloadedModels(): Promise<string[]> {
    const status = await this.getOllamaStatus()
    return status.models
  }
}

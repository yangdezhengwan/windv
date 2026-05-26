/**
 * 大模型 API 配置管理器
 * 用于管理 DeepSeek、豆包、千问等大模型的配置
 */

import { getDatabase } from '../database'
import { LLMManager, ProviderType, PROVIDER_INFO } from '../ai/providers/LLMManager'
import log from 'electron-log'

interface LLMConfig {
  provider: ProviderType
  apiKey: string
  model: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  enabled: boolean
}

export class LLMConfigManager {
  private static instance: LLMConfigManager
  private llmManager: LLMManager
  private currentConfig: LLMConfig | null = null
  
  private constructor() {
    this.llmManager = LLMManager.getInstance()
    this.loadConfig()
  }

  static getInstance(): LLMConfigManager {
    if (!LLMConfigManager.instance) {
      LLMConfigManager.instance = new LLMConfigManager()
    }
    return LLMConfigManager.instance
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const db = getDatabase()
      const rows = db.prepare('SELECT * FROM settings WHERE key LIKE ?').all('llm_%') as { key: string; value: string }[]
      
      if (rows.length === 0) {
        log.info('No LLM config found, using defaults')
        return
      }

      const config: Partial<LLMConfig> = {}
      
      for (const row of rows) {
        const key = row.key.replace('llm_', '')
        const value = row.value
        
        switch (key) {
          case 'provider':
            config.provider = value as ProviderType
            break
          case 'apiKey':
            config.apiKey = value
            break
          case 'model':
            config.model = value
            break
          case 'baseUrl':
            config.baseUrl = value
            break
          case 'temperature':
            config.temperature = parseFloat(value)
            break
          case 'maxTokens':
            config.maxTokens = parseInt(value)
            break
          case 'enabled':
            config.enabled = value === 'true'
            break
        }
      }

      if (config.provider && config.apiKey) {
        this.currentConfig = config as LLMConfig
        this.applyConfig()
      }
    } catch (error) {
      log.error('Failed to load LLM config:', error)
    }
  }

  /**
   * 应用配置到 LLMManager
   */
  private applyConfig(): void {
    if (!this.currentConfig) return

    this.llmManager.configure({
      provider: this.currentConfig.provider,
      apiKey: this.currentConfig.apiKey,
      model: this.currentConfig.model,
      baseUrl: this.currentConfig.baseUrl,
      temperature: this.currentConfig.temperature,
      maxTokens: this.currentConfig.maxTokens
    })

    if (this.currentConfig.enabled) {
      this.llmManager.setCurrentProvider(this.currentConfig.provider)
    }
  }

  /**
   * 保存配置
   */
  saveConfig(config: Partial<LLMConfig>): void {
    try {
      const db = getDatabase()
      
      const updates: Record<string, string> = {
        llm_provider: config.provider || 'deepseek',
        llm_model: config.model || PROVIDER_INFO[config.provider || 'deepseek'].defaultModel,
        llm_enabled: String(config.enabled ?? true),
        llm_temperature: String(config.temperature ?? 0.7),
        llm_maxTokens: String(config.maxTokens ?? 2000)
      }

      if (config.apiKey) {
        updates.llm_apiKey = config.apiKey
      }
      if (config.baseUrl) {
        updates.llm_baseUrl = config.baseUrl
      }

      for (const [key, value] of Object.entries(updates)) {
        db.prepare(`
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
        `).run(key, value)
      }

      // 更新当前配置
      this.currentConfig = {
        provider: (config.provider || this.currentConfig?.provider || 'deepseek') as ProviderType,
        apiKey: config.apiKey || this.currentConfig?.apiKey || '',
        model: config.model || this.currentConfig?.model || PROVIDER_INFO[config.provider || 'deepseek'].defaultModel,
        baseUrl: config.baseUrl || this.currentConfig?.baseUrl,
        temperature: config.temperature ?? this.currentConfig?.temperature ?? 0.7,
        maxTokens: config.maxTokens ?? this.currentConfig?.maxTokens ?? 2000,
        enabled: config.enabled ?? this.currentConfig?.enabled ?? true
      }

      this.applyConfig()
      log.info('LLM config saved')
    } catch (error) {
      log.error('Failed to save LLM config:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): LLMConfig | null {
    if (!this.currentConfig) return null

    // 不返回明文 API Key
    return {
      ...this.currentConfig,
      apiKey: this.currentConfig.apiKey ? '********' + this.currentConfig.apiKey.slice(-4) : ''
    }
  }

  /**
   * 获取完整配置（包含明文 API Key，仅内部使用）
   */
  getFullConfig(): LLMConfig | null {
    return this.currentConfig
  }

  /**
   * 测试连接
   */
  async testConnection(provider: ProviderType, apiKey: string, model?: string): Promise<{ success: boolean; error?: string }> {
    return this.llmManager.testConnection(provider, apiKey, model)
  }

  /**
   * 检查 LLM 是否已启用
   */
  isEnabled(): boolean {
    return this.currentConfig?.enabled ?? false
  }

  /**
   * 获取当前使用的 provider
   */
  getCurrentProvider(): ProviderType | null {
    return this.currentConfig?.provider || null
  }

  /**
   * 获取 provider 信息列表
   */
  getProviderList(): typeof PROVIDER_INFO[ProviderType][] {
    return Object.values(PROVIDER_INFO)
  }
}

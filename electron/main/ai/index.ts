/**
 * AI 模块导出
 */

export * from './IntentClassifier'
export * from './ScriptMatcher'
export * from './LiveAIService'

// 只导出一次 providers，避免重复
export type { LLMConfig, LLMResponse, LLMOptions, LLMProvider, LLMMessage, DEFAULT_LLM_OPTIONS } from './providers/types'
export type { ProviderType, ProviderInfo, PROVIDER_INFO } from './providers/LLMManager'
export { LLMManager } from './providers/LLMManager'
export { DeepSeekProvider } from './providers/DeepSeekProvider'
export { DoubaoProvider } from './providers/DoubaoProvider'
export { QianwenProvider } from './providers/QianwenProvider'

import { contextBridge, ipcRenderer } from 'electron'

// 定义 API 类型
export interface WindVAPI {
  // 直播间管理
  room: {
    list: () => Promise<any[]>
    create: (data: any) => Promise<any>
    update: (data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    start: (roomId: string) => Promise<any>
    stop: (roomId: string) => Promise<any>
    getActive: () => Promise<any[]>
  }
  
  // 话术管理
  script: {
    list: (params?: any) => Promise<any[]>
    create: (data: any) => Promise<any>
    update: (data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    import: (scripts: any[]) => Promise<any>
  }
  
  // 分类管理
  category: {
    list: () => Promise<any[]>
    create: (data: any) => Promise<any>
    update: (data: any) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  
  // 设置管理
  settings: {
    get: (key: string) => Promise<string | undefined>
    getAll: () => Promise<Record<string, string>>
    set: (key: string, value: any) => Promise<any>
  }
  
  // 统计数据
  stats: {
    getRealtime: (roomId: string) => Promise<any>
    getHistory: (params: any) => Promise<any[]>
    export: (params: any) => Promise<any>
  }
  
  // 弹幕日志
  danmaku: {
    getLogs: (params: any) => Promise<any[]>
    getIntentStats: (params: any) => Promise<any[]>
  }
  
  // 备份恢复
  backup: {
    create: () => Promise<any>
    restore: (filePath: string) => Promise<any>
  }
  
  // 系统操作
  system: {
    openExternal: (url: string) => Promise<void>
    getVersion: () => Promise<string>
    selectFile: (options?: any) => Promise<string | null>
    saveFile: (options?: any) => Promise<string | null>
  }
  
  // Excel import/export
  excel: {
    exportScripts: () => Promise<any>
    importScripts: (filePath: string) => Promise<any>
    getTemplate: () => Promise<any>
  }
  
  // Shortcuts
  shortcut: {
    update: (action: string, accelerator: string) => Promise<boolean>
    reset: () => Promise<void>
    getAll: () => Promise<Record<string, string>>
  }
  
  // 高频问题检测
  hfq: {
    getQuestions: () => Promise<any[]>
    reset: () => Promise<any>
  }
  
  // 订单配置
  order: {
    getConfig: () => Promise<any>
    updateConfig: (config: any) => Promise<any>
    getTemplates: (level?: string) => Promise<any>
    updateTemplates: (level: string, templates: string[]) => Promise<any>
  }
  
  // 大模型 AI (V2.1)
  llm: {
    getConfig: () => Promise<{ config: any; providers: any }>
    saveConfig: (config: any) => Promise<any>
    testConnection: (provider: string, apiKey: string, model?: string) => Promise<{ success: boolean; error?: string }>
    analyzeDanmaku: (danmaku: string) => Promise<any>
    generateResponse: (danmaku: string, intent: string, scripts?: string[]) => Promise<string>
    aiLearning: (questions: string[]) => Promise<any[]>
    setContext: (context: any) => Promise<any>
    generateOrderAnnouncement: (nickname: string, amount: number, level: string) => Promise<string>
  }
  
  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => void
  off: (channel: string, callback: (...args: any[]) => void) => void
}

// Allowed channels
const validReceiveChannels = [
  'danmaku:new',
  'order:new',
  'room:status-change',
  'risk:alert',
  'stats:update',
  'menu:import-script',
  'menu:export-data',
  'tray:start-all',
  'tray:pause-all',
  'shortcut:triggered',
  'notification:error',
  'notification:showDetails'
]

// Create API object
const windvAPI: WindVAPI = {
  room: {
    list: () => ipcRenderer.invoke('room:list'),
    create: (data) => ipcRenderer.invoke('room:create', data),
    update: (data) => ipcRenderer.invoke('room:update', data),
    delete: (id) => ipcRenderer.invoke('room:delete', { id }),
    start: (roomId) => ipcRenderer.invoke('room:start', { roomId }),
    stop: (roomId) => ipcRenderer.invoke('room:stop', { roomId }),
    getActive: () => ipcRenderer.invoke('room:get-active')
  },
  
  script: {
    list: (params) => ipcRenderer.invoke('script:list', params || {}),
    create: (data) => ipcRenderer.invoke('script:create', data),
    update: (data) => ipcRenderer.invoke('script:update', data),
    delete: (id) => ipcRenderer.invoke('script:delete', { id }),
    import: (scripts) => ipcRenderer.invoke('script:import', { scripts })
  },
  
  category: {
    list: () => ipcRenderer.invoke('category:list'),
    create: (data) => ipcRenderer.invoke('category:create', data),
    update: (data) => ipcRenderer.invoke('category:update', data),
    delete: (id) => ipcRenderer.invoke('category:delete', { id })
  },
  
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', { key }),
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    set: (key, value) => ipcRenderer.invoke('settings:set', { key, value })
  },
  
  stats: {
    getRealtime: (roomId) => ipcRenderer.invoke('stats:get-realtime', { roomId }),
    getHistory: (params) => ipcRenderer.invoke('stats:get-history', params),
    export: (params) => ipcRenderer.invoke('stats:export', params)
  },
  
  danmaku: {
    getLogs: (params) => ipcRenderer.invoke('danmaku:get-logs', params),
    getIntentStats: (params) => ipcRenderer.invoke('danmaku:get-intent-stats', params)
  },
  
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: (filePath) => ipcRenderer.invoke('backup:restore', { filePath })
  },
  
  system: {
    openExternal: (url) => ipcRenderer.invoke('system:open-external', { url }),
    getVersion: () => ipcRenderer.invoke('system:get-version'),
    selectFile: (options) => ipcRenderer.invoke('system:select-file', { filters: options?.filters }),
    saveFile: (options) => ipcRenderer.invoke('system:save-file', options)
  },
  
  excel: {
    exportScripts: () => ipcRenderer.invoke('excel:export-scripts'),
    importScripts: (filePath) => ipcRenderer.invoke('excel:import-scripts', { filePath }),
    getTemplate: () => ipcRenderer.invoke('excel:get-template')
  },
  
  shortcut: {
    update: (action, accelerator) => ipcRenderer.invoke('shortcut:update', { action, accelerator }),
    reset: () => ipcRenderer.invoke('shortcut:reset'),
    getAll: () => ipcRenderer.invoke('shortcut:get-all')
  },
  
  hfq: {
    getQuestions: () => ipcRenderer.invoke('hfq:get-questions'),
    reset: () => ipcRenderer.invoke('hfq:reset')
  },
  
  order: {
    getConfig: () => ipcRenderer.invoke('order:get-config'),
    updateConfig: (config) => ipcRenderer.invoke('order:update-config', { config }),
    getTemplates: (level) => ipcRenderer.invoke('order:get-templates', { level }),
    updateTemplates: (level, templates) => ipcRenderer.invoke('order:update-templates', { level, templates })
  },
  
  llm: {
    getConfig: () => ipcRenderer.invoke('llm:get-config'),
    saveConfig: (config) => ipcRenderer.invoke('llm:save-config', { config }),
    testConnection: (provider, apiKey, model) => ipcRenderer.invoke('llm:test-connection', { provider, apiKey, model }),
    analyzeDanmaku: (danmaku) => ipcRenderer.invoke('llm:analyze-danmaku', { danmaku }),
    generateResponse: (danmaku, intent, scripts) => ipcRenderer.invoke('llm:generate-response', { danmaku, intent, scripts }),
    aiLearning: (questions) => ipcRenderer.invoke('llm:ai-learning', { questions }),
    setContext: (context) => ipcRenderer.invoke('llm:set-context', { context }),
    generateOrderAnnouncement: (nickname, amount, level) => ipcRenderer.invoke('llm:generate-order-announcement', { nickname, amount, level })
  },
  
  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args))
    }
  },
  
  off: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback)
    }
  }
}

// Expose API
contextBridge.exposeInMainWorld('windv', windvAPI)

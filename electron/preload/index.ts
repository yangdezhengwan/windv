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
  
  // 房间话术配置
  roomScript: {
    list: (params: { roomId: string }) => Promise<any[]>
    getAvailable: (params: { roomId: string }) => Promise<any[]>
    add: (params: { roomId: string; scriptId: string; config: any }) => Promise<any>
    remove: (params: { roomId: string; roomScriptId: string }) => Promise<any>
    update: (params: { roomScriptId: string; updates: any }) => Promise<any>
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
    getHighFrequency: (params: { roomId?: string; startDate: string; endDate: string; limit?: number }) => Promise<any[]>
    getActivityHours: (params: { roomId?: string; startDate: string; endDate: string }) => Promise<any[]>
    getConversionFunnel: (params: { roomId?: string; startDate: string; endDate: string }) => Promise<any>
    getComparison: (params: { roomId?: string; period1Start: string; period1End: string; period2Start: string; period2End: string }) => Promise<any>
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
  
  // 本地模型 (V2.2)
  localModel: {
    getStatus: () => Promise<{ installed: boolean; running: boolean; version?: string; models: string[] }>
    getRecommended: () => Promise<any[]>
    pull: (modelId: string) => Promise<{ success: boolean; error?: string }>
    delete: (modelId: string) => Promise<{ success: boolean; error?: string }>
    chat: (modelId: string, messages: any[], options?: any) => Promise<{ content: string; error?: string }>
    getGuide: () => Promise<{ windows: string; macos: string; linux: string }>
    hasAvailable: () => Promise<boolean>
  }
  
  // 循环字幕 (V2.2)
  loop: {
    getConfig: () => Promise<any>
    updateConfig: (config: any) => Promise<any>
    setEnabled: (enabled: boolean) => Promise<any>
    getMessages: () => Promise<any[]>
    addMessage: (message: any) => Promise<any>
    updateMessage: (id: string, updates: any) => Promise<any>
    deleteMessage: (id: string) => Promise<any>
    getNext: () => Promise<any>
    getSchedules: () => Promise<any[]>
    addSchedule: (schedule: any) => Promise<any>
    updateSchedule: (id: string, updates: any) => Promise<any>
    deleteSchedule: (id: string) => Promise<any>
    export: () => Promise<string>
    import: (json: string) => Promise<{ success: number; failed: number }>
    reset: () => Promise<any>
  }
  
  // 云端同步
  cloud: {
    login: (username: string, password: string, apiUrl?: string) => Promise<any>
    sync: () => Promise<{ success: boolean; message: string }>
    getSyncStatus: () => Promise<{ lastSyncTime: string | null; syncEnabled: boolean; isSyncing: boolean; pendingChanges: number; lastError: string | null }>
    setSyncEnabled: (enabled: boolean) => Promise<any>
    restore: () => Promise<{ success: boolean; message: string }>
  }
  
  // 平台风控配置
  platformRisk: {
    list: () => Promise<any[]>
    get: (platformCode: string) => Promise<any>
    update: (platformCode: string, updates: any) => Promise<{ success: boolean }>
    getEffective: (roomId: string) => Promise<any>
  }
  
  // 授权管理
  license: {
    verify: (licenseCode: string) => Promise<{ valid: boolean; license?: any; error?: string; daysLeft?: number; isExpired?: boolean }>
    activateTrial: () => Promise<{ valid: boolean; license?: any; error?: string; daysLeft?: number; isExpired?: boolean }>
    check: () => Promise<{ valid: boolean; license?: any; error?: string; daysLeft?: number; isExpired?: boolean }>
    getCurrent: () => Promise<any>
    clear: () => Promise<any>
    getDeviceId: () => Promise<string | null>
  }
  
  // TTS 语音播报
  tts: {
    speak: (text: string) => Promise<{ success: boolean; error?: string }>
    setEnabled: (enabled: boolean) => Promise<{ success: boolean }>
    setRate: (rate: number) => Promise<{ success: boolean }>
    setVolume: (volume: number) => Promise<{ success: boolean }>
    getVoices: () => Promise<{ success: boolean; voices: string[] }>
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
  'notification:showDetails',
  'local-model:progress'
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
  
  roomScript: {
    list: (params) => ipcRenderer.invoke('room-script:list', params),
    getAvailable: (params) => ipcRenderer.invoke('room-script:get-available', params),
    add: (params) => ipcRenderer.invoke('room-script:add', params),
    remove: (params) => ipcRenderer.invoke('room-script:remove', params),
    update: (params) => ipcRenderer.invoke('room-script:update', params),
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
    export: (params) => ipcRenderer.invoke('stats:export', params),
    getHighFrequency: (params) => ipcRenderer.invoke('stats:get-high-frequency', params),
    getActivityHours: (params) => ipcRenderer.invoke('stats:get-activity-hours', params),
    getConversionFunnel: (params) => ipcRenderer.invoke('stats:get-conversion-funnel', params),
    getComparison: (params) => ipcRenderer.invoke('stats:get-comparison', params)
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
  
  localModel: {
    getStatus: () => ipcRenderer.invoke('local-model:get-status'),
    getRecommended: () => ipcRenderer.invoke('local-model:get-recommended'),
    pull: (modelId) => ipcRenderer.invoke('local-model:pull', { modelId }),
    delete: (modelId) => ipcRenderer.invoke('local-model:delete', { modelId }),
    chat: (modelId, messages, options) => ipcRenderer.invoke('local-model:chat', { modelId, messages, options }),
    getGuide: () => ipcRenderer.invoke('local-model:get-guide'),
    hasAvailable: () => ipcRenderer.invoke('local-model:has-available')
  },
  
  loop: {
    getConfig: () => ipcRenderer.invoke('loop:get-config'),
    updateConfig: (config) => ipcRenderer.invoke('loop:update-config', { config }),
    setEnabled: (enabled) => ipcRenderer.invoke('loop:set-enabled', { enabled }),
    getMessages: () => ipcRenderer.invoke('loop:get-messages'),
    addMessage: (message) => ipcRenderer.invoke('loop:add-message', { message }),
    updateMessage: (id, updates) => ipcRenderer.invoke('loop:update-message', { id, updates }),
    deleteMessage: (id) => ipcRenderer.invoke('loop:delete-message', { id }),
    getNext: () => ipcRenderer.invoke('loop:get-next'),
    getSchedules: () => ipcRenderer.invoke('loop:get-schedules'),
    addSchedule: (schedule) => ipcRenderer.invoke('loop:add-schedule', { schedule }),
    updateSchedule: (id, updates) => ipcRenderer.invoke('loop:update-schedule', { id, updates }),
    deleteSchedule: (id) => ipcRenderer.invoke('loop:delete-schedule', { id }),
    export: () => ipcRenderer.invoke('loop:export'),
    import: (json) => ipcRenderer.invoke('loop:import', { json }),
    reset: () => ipcRenderer.invoke('loop:reset')
  },
  
  // 云端同步
  cloud: {
    login: (username: string, password: string, apiUrl?: string) => ipcRenderer.invoke('cloud:login', { username, password, apiUrl }),
    sync: () => ipcRenderer.invoke('cloud:sync'),
    getSyncStatus: () => ipcRenderer.invoke('cloud:sync-status'),
    setSyncEnabled: (enabled: boolean) => ipcRenderer.invoke('cloud:set-sync-enabled', { enabled }),
    restore: () => ipcRenderer.invoke('cloud:restore'),
  },
  
  // 平台风控配置
  platformRisk: {
    list: () => ipcRenderer.invoke('platform-risk:list'),
    get: (platformCode: string) => ipcRenderer.invoke('platform-risk:get', { platformCode }),
    update: (platformCode: string, updates: any) => ipcRenderer.invoke('platform-risk:update', { platformCode, updates }),
    getEffective: (roomId: string) => ipcRenderer.invoke('platform-risk:get-effective', { roomId }),
  },
  
  // 授权管理
  license: {
    verify: (licenseCode: string) => ipcRenderer.invoke('license:verify', { licenseCode }),
    activateTrial: () => ipcRenderer.invoke('license:activate-trial'),
    check: () => ipcRenderer.invoke('license:check'),
    getCurrent: () => ipcRenderer.invoke('license:get-current'),
    clear: () => ipcRenderer.invoke('license:clear'),
    getDeviceId: () => ipcRenderer.invoke('license:get-device-id'),
  },
  
  // TTS 语音播报
  tts: {
    speak: (text: string) => ipcRenderer.invoke('tts:speak', { text }),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke('tts:set-enabled', { enabled }),
    setRate: (rate: number) => ipcRenderer.invoke('tts:set-rate', { rate }),
    setVolume: (volume: number) => ipcRenderer.invoke('tts:set-volume', { volume }),
    getVoices: () => ipcRenderer.invoke('tts:get-voices'),
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

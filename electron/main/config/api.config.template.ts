// API Configuration Template
// Copy this file to api.config.local.ts and fill in your credentials
// DO NOT commit api.config.local.ts to version control

export const APIConfig = {
  // Taobao Live API
  taobao: {
    appKey: '',           // Taobao AppKey
    appSecret: '',        // Taobao AppSecret
    sessionKey: '',       // Authorization Session
    enabled: false        // Enable API
  },
  
  // Douyin Live API
  douyin: {
    clientKey: '',        // Douyin Client Key
    clientSecret: '',     // Douyin Client Secret
    accessToken: '',      // OAuth Access Token
    enabled: false        // Enable API
  },
  
  // Pinduoduo Live API
  pinduoduo: {
    clientId: '',         // PDD Client ID
    clientSecret: '',     // PDD Client Secret
    enabled: false        // Enable API
  }
}

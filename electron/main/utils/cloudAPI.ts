/**
 * Cloud API Client - 云端服务 API 客户端
 * 用于对接后端云服务
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { getSettings } from '../database'

// API 基础配置
const DEFAULT_API_URL = 'http://sq.kxkj.ltd/api'

class CloudAPIClient {
  private client: AxiosInstance | null = null
  private token: string | null = null
  private apiUrl: string = DEFAULT_API_URL

  constructor() {
    this.init()
  }

  /**
   * 初始化客户端
   */
  async init() {
    try {
      // 从设置中读取 API 地址
      const savedApiUrl = await getSettings('cloudApiUrl')
      this.apiUrl = savedApiUrl || DEFAULT_API_URL

      // 从设置中读取 Token
      this.token = await getSettings('cloudToken')

      this.createClient()
    } catch (error) {
      console.error('Cloud API 初始化失败:', error)
    }
  }

  /**
   * 创建 Axios 实例
   */
  private createClient() {
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token 过期，清除本地 Token
          this.token = null
         
        }
        return Promise.reject(error.response?.data || error.message)
      }
    )
  }

  /**
   * 设置 API 地址
   */
  setApiUrl(url: string) {
    this.apiUrl = url
    this.createClient()
  }

  /**
   * 设置 Token
   */
  setToken(token: string) {
    this.token = token
  }

  /**
   * 清除 Token
   */
  clearToken() {
    this.token = null
  }

  // ==================== 认证相关 ====================

  /**
   * 用户登录
   */
async login(username: string, password: string): Promise<{ token: string; user: any }> {
  const response = await this.client!.post('/auth/login', { username, password })
  const data = response.data
  if (data.token) {
    this.setToken(data.token)
  }
  return data
}

  /**
   * 用户注册
   */
  async register(username: string, email: string, password: string): Promise<any> {
    return this.client!.post('/auth/register', { username, email, password })
  }

  /**
   * 获取当前用户信息
   */
  async getMe(): Promise<any> {
    return this.client!.get('/auth/me')
  }

  // ==================== 话术同步 ====================

  /**
   * 同步话术到云端
   */
  async syncScripts(scripts: any[]): Promise<any> {
    return this.client!.post('/sync/scripts', { scripts })
  }

  /**
   * 从云端获取话术
   */
  async fetchScripts(): Promise<any[]> {
    return this.client!.get('/sync/scripts')
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<any> {
    return this.client!.get('/sync/status')
  }

  // ==================== 授权相关 ====================

  /**
   * 验证授权码
   */
  async verifyLicense(licenseCode: string, deviceId: string): Promise<any> {
    return this.client!.post('/license/verify', { licenseCode, deviceId })
  }

  /**
   * 激活试用授权
   */
  async activateTrial(deviceId: string, deviceName: string): Promise<any> {
    return this.client!.post('/license/trial', { deviceId, deviceName })
  }

  /**
   * 检查设备授权状态
   */
  async checkLicense(deviceId: string): Promise<any> {
    return this.client!.get(`/license/check/${deviceId}`)
  }

  /**
   * 获取我的授权列表
   */
  async getMyLicenses(deviceId?: string): Promise<any[]> {
    const params = deviceId ? { deviceId } : {}
    return this.client!.get('/license/my', { params })
  }

  // ==================== 统计相关 ====================

  /**
   * 上传统计数据
   */
  async uploadStats(stats: any): Promise<any> {
    return this.client!.post('/stats/upload', stats)
  }

  /**
   * 获取云端统计数据
   */
  async getCloudStats(): Promise<any> {
    return this.client!.get('/stats/overview')
  }

  // ==================== 设置相关 ====================

  /**
   * 获取云端设置
   */
  async getCloudSettings(): Promise<any> {
    return this.client!.get('/settings')
  }

  /**
   * 更新云端设置
   */
  async updateCloudSettings(settings: any): Promise<any> {
    return this.client!.put('/settings', settings)
  }

  // ==================== 用户管理 (管理员) ====================

  /**
   * 获取用户列表
   */
  async getUsers(params?: any): Promise<any> {
    return this.client!.get('/users', { params })
  }

  /**
   * 获取授权列表
   */
  async getLicenses(params?: any): Promise<any> {
    return this.client!.get('/license/list', { params })
  }

  /**
   * 生成授权码
   */
  async generateLicense(data: any): Promise<any> {
    return this.client!.post('/license/generate', data)
  }

  /**
   * 撤销授权
   */
  async revokeLicense(licenseId: string): Promise<any> {
    return this.client!.delete(`/license/${licenseId}`)
  }
}

// 导出单例
export const cloudAPI = new CloudAPIClient()

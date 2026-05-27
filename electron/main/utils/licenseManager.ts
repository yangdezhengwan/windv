/**
 * License Manager - 授权管理器
 * 处理软件授权验证和激活
 */

import { machineId } from 'node-machine-id'
import { getSettings, setSettings } from '../database'
import { cloudAPI } from './cloudAPI'
import { app } from 'electron'

// 授权类型
export type LicenseType = 'trial' | 'standard' | 'admin'

// 授权信息接口
export interface LicenseInfo {
  licenseCode: string
  type: LicenseType
  features: string[]
  expiryDate: string
  deviceId: string
  deviceName: string
  activatedAt?: string
}

// 授权验证结果
export interface LicenseValidationResult {
  valid: boolean
  license?: LicenseInfo
  error?: string
  daysLeft?: number
  isExpired?: boolean
}

class LicenseManager {
  private deviceId: string | null = null
  private cachedLicense: LicenseInfo | null = null

  constructor() {
    this.init()
  }

  /**
   * 初始化，获取设备 ID
   */
  async init(): Promise<void> {
    try {
      // 尝试获取或生成设备 ID
      this.deviceId = await getSettings('deviceId')
      if (!this.deviceId) {
        this.deviceId = await machineId()
        await setSettings('deviceId', this.deviceId)
      }

      // 加载缓存的授权信息
      const cached = await getSettings('licenseInfo')
      if (cached) {
        this.cachedLicense = JSON.parse(cached)
      }
    } catch (error) {
      console.error('License Manager 初始化失败:', error)
    }
  }

  /**
   * 获取设备 ID
   */
  getDeviceId(): string | null {
    return this.deviceId
  }

  /**
   * 获取设备名称
   */
  getDeviceName(): string {
    const os = require('os')
    return `${os.hostname()}-${os.platform()}`
  }

  /**
   * 验证授权码
   */
  async verifyLicense(licenseCode: string): Promise<LicenseValidationResult> {
    try {
      if (!this.deviceId) {
        return { valid: false, error: '设备 ID 未初始化' }
      }

      const result = await cloudAPI.verifyLicense(licenseCode, this.deviceId)
      
      if (result.valid) {
        // 保存授权信息
        this.cachedLicense = result.license
        await setSettings('licenseInfo', JSON.stringify(result.license))
        await setSettings('licenseCode', licenseCode)

        // 计算剩余天数
        const daysLeft = this.calculateDaysLeft(result.license.expiryDate)

        return {
          valid: true,
          license: result.license,
          daysLeft,
          isExpired: daysLeft <= 0,
        }
      }

      return { valid: false, error: result.error || '授权验证失败' }
    } catch (error: any) {
      console.error('验证授权失败:', error)
      return { valid: false, error: error.message || '验证失败' }
    }
  }

  /**
   * 激活试用授权
   */
  async activateTrial(): Promise<LicenseValidationResult> {
    try {
      if (!this.deviceId) {
        return { valid: false, error: '设备 ID 未初始化' }
      }

      const result = await cloudAPI.activateTrial(this.deviceId, this.getDeviceName())
      
      if (result.success) {
        this.cachedLicense = result.license
        await setSettings('licenseInfo', JSON.stringify(result.license))
        await setSettings('licenseCode', result.license.licenseCode)

        return {
          valid: true,
          license: result.license,
          daysLeft: result.license.daysLeft,
          isExpired: false,
        }
      }

      return { valid: false, error: result.error || '试用激活失败' }
    } catch (error: any) {
      console.error('激活试用失败:', error)
      return { valid: false, error: error.message || '激活失败' }
    }
  }

  /**
   * 检查授权状态
   */
  async checkLicenseStatus(): Promise<LicenseValidationResult> {
    try {
      if (!this.deviceId) {
        return { valid: false, error: '设备 ID 未初始化' }
      }

      // 先检查本地缓存
      if (this.cachedLicense) {
        const daysLeft = this.calculateDaysLeft(this.cachedLicense.expiryDate)
        if (daysLeft > 0) {
          return {
            valid: true,
            license: this.cachedLicense,
            daysLeft,
            isExpired: false,
          }
        }
      }

      // 本地没有有效授权，查询云端
      const result = await cloudAPI.checkLicense(this.deviceId)
      
      if (result.licensed && !result.isExpired) {
        // 更新本地缓存
        this.cachedLicense = result.license
        await setSettings('licenseInfo', JSON.stringify(result.license))

        return {
          valid: true,
          license: result.license,
          daysLeft: result.daysLeft,
          isExpired: false,
        }
      }

      return {
        valid: false,
        error: result.licensed ? '授权已过期' : '未授权',
        isExpired: result.isExpired,
        daysLeft: result.daysLeft || 0,
      }
    } catch (error: any) {
      console.error('检查授权状态失败:', error)
      
      // 网络失败时，检查本地缓存
      if (this.cachedLicense) {
        const daysLeft = this.calculateDaysLeft(this.cachedLicense.expiryDate)
        if (daysLeft > 0) {
          return {
            valid: true,
            license: this.cachedLicense,
            daysLeft,
            isExpired: false,
          }
        }
      }

      return { valid: false, error: error.message || '检查失败' }
    }
  }

  /**
   * 获取当前授权信息
   */
  getCurrentLicense(): LicenseInfo | null {
    return this.cachedLicense
  }

  /**
   * 清除授权信息
   */
  async clearLicense(): Promise<void> {
    this.cachedLicense = null
    await setSettings('licenseInfo', '')
    await setSettings('licenseCode', '')
  }

  /**
   * 计算剩余天数
   */
  private calculateDaysLeft(expiryDate: string): number {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  /**
   * 检查功能是否可用
   */
  hasFeature(feature: string): boolean {
    if (!this.cachedLicense) return false
    if (this.cachedLicense.type === 'admin') return true
    return this.cachedLicense.features.includes(feature)
  }

  /**
   * 获取授权类型显示名称
   */
  getLicenseTypeName(type: LicenseType): string {
    const names: Record<LicenseType, string> = {
      trial: '试用版',
      standard: '标准版',
      admin: '管理员',
    }
    return names[type] || '未知'
  }
}

// 导出单例
export const licenseManager = new LicenseManager()
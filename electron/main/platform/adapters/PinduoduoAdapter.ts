import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { BasePlatformAdapter, PlatformCode, RoomInfo, Danmaku, OrderInfo, RiskStatus } from '../IPlatformAdapter'

export class PinduoduoAdapter extends BasePlatformAdapter {
  readonly platform = PlatformCode.PINDUODUO
  readonly name = '拼多多直播'

  private playwright: any = null
  private browser: any = null
  private page: any = null
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  async connect(roomInfo: RoomInfo): Promise<void> {
    log.info(`[拼多多] 开始连接直播间: ${roomInfo.url || roomInfo.windowTitle}`)

    try {
      // 动态导入 Playwright
      const { chromium } = require('playwright')
      this.playwright = chromium

      // 启动浏览器
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--no-sandbox'
        ]
      })

      // 创建页面
      this.page = await this.browser.newPage()

      // 注入脚本拦截弹幕
      await this.injectDanmakuScript()

      // 导航到直播间
      if (roomInfo.url) {
        await this.page.goto(roomInfo.url, { waitUntil: 'networkidle' })
      } else if (roomInfo.windowTitle) {
        await this.findWindowByTitle(roomInfo.windowTitle)
      }

      // 等待页面加载
      await this.page.waitForTimeout(3000)

      this.isConnected = true
      this.emitStatusChange('connected')
      log.info(`[拼多多] 连接成功`)

    } catch (error) {
      log.error(`[拼多多] 连接失败:`, error)
      this.emitError(error as Error)
      this.emitStatusChange('error')
      throw error
    }
  }

  /**
   * 注入弹幕拦截脚本
   */
  private async injectDanmakuScript(): Promise<void> {
    const script = `
      (function() {
        // 弹幕拦截
        const originalWebSocket = window.WebSocket;
        
        window.WebSocket = function(url, protocols) {
          const ws = protocols ? new originalWebSocket(url, protocols) : new originalWebSocket(url);
          
          // 拦截拼多多直播弹幕 WebSocket
          if (url.includes('pinduoduo') || url.includes('yy.com') || url.includes('duoduo')) {
            console.log('[WindV] 拦截到拼多多直播 WebSocket:', url);
            
            ws.addEventListener('message', function(event) {
              try {
                const data = JSON.parse(event.data);
                window.postMessage({
                  type: 'WINDV_DANMAKU',
                  platform: 'pinduoduo',
                  data: data
                }, '*');
              } catch (e) {
                // 可能是二进制消息
              }
            });
          }
          
          return ws;
        };
        
        window.WebSocket.prototype = originalWebSocket.prototype;
        
        // 监听 postMessage
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'WINDV_SEND_DANMAKU') {
            // 发送弹幕
            const danmakuInput = document.querySelector('input[class*="danmaku"], textarea[class*="comment"], [class*="danmaku"] input');
            if (danmakuInput) {
              danmakuInput.value = event.data.content;
              danmakuInput.dispatchEvent(new Event('input', { bubbles: true }));
              
              const sendBtn = danmakuInput.closest('.input-container, .comment-box')?.querySelector('.send-btn, button');
              if (sendBtn) {
                sendBtn.click();
              }
            }
          }
        });
        
        // 拦截 XHR 请求
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
          this.addEventListener('load', function() {
            try {
              const data = JSON.parse(this.responseText);
              if (data.code === 0 && data.data && (data.data.comments || data.data.danmus)) {
                window.postMessage({
                  type: 'WINDV_DANMAKU',
                  platform: 'pinduoduo',
                  data: data.data
                }, '*');
              }
            } catch (e) {}
          });
          return originalXHROpen.call(this, method, url, async, user, password);
        };
        
        console.log('[WindV] 拼多多直播弹幕拦截脚本已注入');
      })();
    `

    await this.page.addInitScript(script)
  }

  /**
   * 处理弹幕数据
   */
  private handleDanmakuData(data: any): void {
    try {
      // 尝试提取弹幕内容
      const content = this.extractDanmakuContent(data)
      if (!content) return

      const danmaku: Danmaku = {
        id: uuidv4(),
        roomId: this.roomInfo?.id || '',
        content: content.text,
        senderId: content.userId || '',
        senderNickname: content.nickname || '匿名用户',
        timestamp: new Date(),
        raw: data
      }

      this.emitDanmaku(danmaku)

    } catch (error) {
      log.error('[拼多多] 处理弹幕数据失败:', error)
    }
  }

  /**
   * 提取弹幕内容
   */
  private extractDanmakuContent(data: any): any {
    try {
      // 拼多多直播弹幕格式
      const formats = [
        // 格式1: comments 数组
        () => {
          if (data.comments && Array.isArray(data.comments)) {
            const comment = data.comments[0]
            return {
              text: comment.content || comment.text || comment.comment,
              nickname: comment.nickname || comment.userName || '匿名',
              userId: comment.userId || comment.uid || ''
            }
          }
        },
        // 格式2: danmus 数组
        () => {
          if (data.danmus && Array.isArray(data.danmus)) {
            const danmu = data.danmus[0]
            return {
              text: danmu.content || danmu.text,
              nickname: danmu.nickname || '匿名',
              userId: danmu.userId || ''
            }
          }
        },
        // 格式3: 直接 content 字段
        () => {
          if (data.content && typeof data.content === 'string' && data.content.length < 200) {
            return {
              text: data.content,
              nickname: data.nickname || data.userName || '匿名',
              userId: data.userId || ''
            }
          }
        }
      ]

      for (const format of formats) {
        const result = format()
        if (result && result.text) return result
      }

      return null

    } catch (error) {
      return null
    }
  }

  /**
   * 发送弹幕
   */
  async sendDanmaku(content: string): Promise<void> {
    if (!this.page) {
      throw new Error('页面未连接')
    }

    log.info(`[拼多多] 发送弹幕: ${content}`)

    try {
      await this.page.evaluate((text: string) => {
        window.postMessage({
          type: 'WINDV_SEND_DANMAKU',
          content: text
        }, '*')
      }, content)

      // 备选：直接 DOM 操作
      const inputSelector = 'input[class*="danmaku"], textarea[class*="comment"]'
      const inputExists = await this.page.$(inputSelector)
      
      if (inputExists) {
        await this.page.fill(inputSelector, content)
        await this.page.keyboard.press('Enter')
      }

    } catch (error) {
      log.error('[拼多多] 发送弹幕失败:', error)
      throw error
    }
  }

  /**
   * 检测风控状态
   */
  async checkRiskStatus(): Promise<RiskStatus> {
    if (!this.page) {
      return { isNormal: false, reason: '页面未连接', level: 'danger' }
    }

    try {
      // 检查风控元素
      const riskElements = await this.page.$$('[class*="verify"], [class*="captcha"], [class*="risk"]')
      
      if (riskElements.length > 0) {
        return {
          isNormal: false,
          reason: '检测到风控验证',
          level: 'danger'
        }
      }

      // 检查页面标题
      const title = await this.page.title()
      if (title.includes('验证') || title.includes('人机')) {
        return {
          isNormal: false,
          reason: '需要完成人机验证',
          level: 'danger'
        }
      }

      return { isNormal: true, level: 'normal' }

    } catch (error) {
      return {
        isNormal: false,
        reason: '检测失败',
        level: 'warning'
      }
    }
  }

  /**
   * 获取房间信息
   */
  async getRoomInfo(): Promise<RoomInfo> {
    if (!this.page) {
      throw new Error('页面未连接')
    }

    try {
      const url = this.page.url()
      const title = await this.page.title()
      
      return {
        id: this.roomInfo?.id || '',
        url,
        windowTitle: title
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    log.info('[拼多多] 断开连接')

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.page) {
      await this.page.close()
      this.page = null
    }

    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }

    this.isConnected = false
    this.emitStatusChange('disconnected')
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.disconnect()
    super.dispose()
  }

  /**
   * 通过窗口标题查找
   */
  private async findWindowByTitle(title: string): Promise<void> {
    log.warn('[拼多多] 窗口标题查找暂未实现，请使用 URL 方式')
  }
}

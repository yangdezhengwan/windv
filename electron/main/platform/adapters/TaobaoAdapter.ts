import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { BasePlatformAdapter, PlatformCode, PlatformConfig, RoomInfo, Danmaku, OrderInfo, RiskStatus } from '../IPlatformAdapter'

export class TaobaoAdapter extends BasePlatformAdapter {
  readonly platform = PlatformCode.TAOBAO
  readonly name = '淘宝直播'

  private playwright: any = null
  private browser: any = null
  private page: any = null
  private wsEndpoint: string | null = null
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  async connect(roomInfo: RoomInfo): Promise<void> {
    log.info(`[淘宝] 开始连接直播间: ${roomInfo.url || roomInfo.windowTitle}`)

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
        // 通过窗口标题查找
        await this.findWindowByTitle(roomInfo.windowTitle)
      }

      // 等待页面加载
      await this.page.waitForTimeout(3000)

      this.isConnected = true
      this.emitStatusChange('connected')
      log.info(`[淘宝] 连接成功`)

    } catch (error) {
      log.error(`[淘宝] 连接失败:`, error)
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
        // 弹幕 WebSocket 拦截
        const originalWebSocket = window.WebSocket;
        
        window.WebSocket = function(url, protocols) {
          const ws = protocols ? new originalWebSocket(url, protocols) : new originalWebSocket(url);
          
          // 拦截淘宝直播弹幕 WebSocket
          if (url.includes('gateway.taobao.org') || url.includes('live.taobao.com') || url.includes('streammanager')) {
            console.log('[WindV] 拦截到淘宝直播 WebSocket:', url);
            
            ws.addEventListener('message', function(event) {
              try {
                const data = JSON.parse(event.data);
                // 解析弹幕消息
                if (data.type === 'danmaku' || data.cmd === 'danmaku' || data.data) {
                  window.postMessage({
                    type: 'WINDV_DANMAKU',
                    platform: 'taobao',
                    data: data
                  }, '*');
                }
              } catch (e) {
                // 可能是二进制消息，忽略
              }
            });
          }
          
          return ws;
        };
        
        window.WebSocket.prototype = originalWebSocket.prototype;
        
        // 监听 postMessage
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'WINDV_SEND_DANMAKU') {
            // 发送弹幕指令
            const danmakuInput = document.querySelector('.live-editor-input, .danmaku-input, [class*="danmaku"] input, textarea[class*="danmaku"]');
            if (danmakuInput) {
              danmakuInput.value = event.data.content;
              danmakuInput.dispatchEvent(new Event('input', { bubbles: true }));
              
              const sendBtn = danmakuInput.closest('form')?.querySelector('button[type="submit"], .send-btn, [class*="send"]');
              if (sendBtn) {
                sendBtn.click();
              }
            }
          }
        });
        
        console.log('[WindV] 淘宝直播弹幕拦截脚本已注入');
      })();
    `

    await this.page.addInitScript(script)

    // 监听页面消息
    await this.page.exposeFunction('onDanmakuReceived', (data: any) => {
      this.handleDanmakuData(data)
    })
  }

  /**
   * 处理弹幕数据
   */
  private handleDanmakuData(data: any): void {
    try {
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
      log.error('[淘宝] 处理弹幕数据失败:', error)
    }
  }

  /**
   * 提取弹幕内容
   */
  private extractDanmakuContent(data: any): any {
    try {
      // 尝试多种数据格式
      const formats = [
        // 格式1: { data: { content: '', user: { nick: '' } } }
        () => {
          if (data.data?.content && data.data.user?.nick) {
            return {
              text: data.data.content,
              nickname: data.data.user.nick,
              userId: data.data.user.id || ''
            }
          }
        },
        // 格式2: { content: '', nickname: '' }
        () => {
          if (data.content && data.nickname) {
            return {
              text: data.content,
              nickname: data.nickname,
              userId: data.userId || ''
            }
          }
        },
        // 格式3: 直接字符串
        () => {
          if (typeof data === 'string' && data.length < 200) {
            return {
              text: data,
              nickname: '匿名用户',
              userId: ''
            }
          }
        }
      ]

      for (const format of formats) {
        const result = format()
        if (result) return result
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

    log.info(`[淘宝] 发送弹幕: ${content}`)

    try {
      // 方法1: 通过注入脚本发送
      await this.page.evaluate((text: string) => {
        window.postMessage({
          type: 'WINDV_SEND_DANMAKU',
          content: text
        }, '*')
      }, content)

      // 方法2: 直接 DOM 操作（备选）
      const inputSelector = '.live-editor-input, .danmaku-input, textarea'
      const inputExists = await this.page.$(inputSelector)
      
      if (inputExists) {
        await this.page.fill(inputSelector, content)
        await this.page.keyboard.press('Enter')
      }

    } catch (error) {
      log.error('[淘宝] 发送弹幕失败:', error)
      throw error
    }
  }

  /**
   * 发送点赞
   */
  async sendLike(): Promise<void> {
    if (!this.page) {
      throw new Error('页面未连接')
    }

    log.info('[淘宝] 发送点赞')

    try {
      // 淘宝直播间点赞 - 点击点赞按钮
      await this.page.evaluate(() => {
        // 尝试多种选择器
        const selectors = [
          '.like-btn',
          '[class*="like"]',
          '[class*="heart"]',
          '[class*="praise"]',
          'button[data-type="like"]'
        ]
        
        for (const selector of selectors) {
          const btn = document.querySelector(selector)
          if (btn instanceof HTMLElement) {
            btn.click()
            return true
          }
        }
        return false
      })
    } catch (error) {
      log.error('[淘宝] 发送点赞失败:', error)
      // 点赞失败不抛出异常，只是静默失败
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
      // 检查页面是否存在风控元素
      const riskElements = await this.page.$$('.risk-warning, .captcha, [class*="risk"], [class*="verify"]')
      
      if (riskElements.length > 0) {
        return {
          isNormal: false,
          reason: '检测到风控验证',
          level: 'danger'
        }
      }

      // 检查页面是否正常加载
      const title = await this.page.title()
      if (title.includes('验证') || title.includes('风险')) {
        return {
          isNormal: false,
          reason: '页面显示安全验证',
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
    log.info('[淘宝] 断开连接')

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
    // TODO: 实现窗口查找逻辑
    log.warn('[淘宝] 窗口标题查找暂未实现，请使用 URL 方式')
  }
}

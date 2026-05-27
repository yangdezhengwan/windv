import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { BasePlatformAdapter, PlatformCode, RoomInfo, Danmaku, OrderInfo, RiskStatus } from '../IPlatformAdapter'

export class DouyinAdapter extends BasePlatformAdapter {
  readonly platform = PlatformCode.DOUYIN
  readonly name = '抖音电商'

  private playwright: any = null
  private browser: any = null
  private page: any = null
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  async connect(roomInfo: RoomInfo): Promise<void> {
    log.info(`[抖音] 开始连接直播间: ${roomInfo.url || roomInfo.windowTitle}`)

    try {
      // 动态导入 Playwright
      const { chromium } = require('playwright')
      this.playwright = chromium

      // 启动浏览器（抖音检测更严格，需要更多反爬措施）
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      })

      // 创建上下文（隔离存储）
      const context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      })

      this.page = await context.newPage()

      // 注入脚本拦截弹幕
      await this.injectDanmakuScript()

      // 导航到直播间
      if (roomInfo.url) {
        await this.page.goto(roomInfo.url, { waitUntil: 'networkidle', timeout: 30000 })
      } else if (roomInfo.windowTitle) {
        await this.findWindowByTitle(roomInfo.windowTitle)
      }

      // 等待页面加载
      await this.page.waitForTimeout(3000)

      this.isConnected = true
      this.emitStatusChange('connected')
      log.info(`[抖音] 连接成功`)

    } catch (error) {
      log.error(`[抖音] 连接失败:`, error)
      this.emitError(error as Error)
      this.emitStatusChange('error')
      throw error
    }
  }

  /**
   * 注入弹幕拦截脚本
   * 抖音直播弹幕通过 WebSocket 传输
   */
  private async injectDanmakuScript(): Promise<void> {
    const script = `
      (function() {
        // 检测是否是抖音直播页面
        const isDyPage = window.location.hostname.includes('douyin.com') || 
                         window.location.hostname.includes('.bytedance');
        
        if (!isDyPage) return;

        console.log('[WindV] 抖音直播页面检测中...');

        // 弹幕 WebSocket 拦截
        const originalWebSocket = window.WebSocket;
        let wsConnected = false;
        
        window.WebSocket = function(url, protocols) {
          const ws = protocols ? new originalWebSocket(url, protocols) : new originalWebSocket(url);
          
          // 抖音直播弹幕 WebSocket 特征
          const isDanmakuWS = url.includes('webcast') || 
                              url.includes('live.douyin.com') ||
                              url.includes('aweme');
          
          if (isDanmakuWS) {
            console.log('[WindV] 检测到抖音弹幕 WebSocket:', url);
            wsConnected = true;
            
            ws.addEventListener('message', function(event) {
              try {
                // 抖音使用 protobuf 或 JSON 格式
                let data;
                try {
                  data = JSON.parse(event.data);
                } catch {
                  // 可能是二进制数据，尝试解码
                  const text = new TextDecoder().decode(event.data);
                  try {
                    data = JSON.parse(text);
                  } catch {
                    return;
                  }
                }
                
                // 解析弹幕消息
                if (data && (data.method === 'WSToSvr/Heartbeat' || 
                    data.method === 'WebcastPushMessage' ||
                    data['X-GEWE-WS-OP'] ||
                    data.type === 'chat' ||
                    data.msg_type)) {
                  
                  const danmakuData = extractDanmaku(data);
                  if (danmakuData) {
                    window.postMessage({
                      type: 'WINDV_DANMAKU',
                      platform: 'douyin',
                      data: danmakuData
                    }, '*');
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            });

            ws.addEventListener('close', function() {
              console.log('[WindV] 抖音弹幕 WebSocket 断开');
              wsConnected = false;
            });
          }
          
          return ws;
        };
        
        window.WebSocket.prototype = originalWebSocket.prototype;

        // 提取弹幕数据
        function extractDanmaku(data) {
          // 抖音弹幕消息格式
          if (data.content) {
            return {
              text: data.content,
              nickname: data.user?.nickname || data.user?.short_id || '抖音用户',
              userId: data.user?.open_id || data.user?.short_id || ''
            };
          }
          
          // WebcastPushMessage 格式
          if (data.messages && Array.isArray(data.messages)) {
            return data.messages.map(msg => extractDanmaku(msg))[0];
          }
          
          // 通用格式
          if (data.text && data.user) {
            return {
              text: data.text,
              nickname: data.user.nickname || '抖音用户',
              userId: data.user.open_id || ''
            };
          }
          
          return null;
        }

        // 监听 postMessage（发送弹幕）
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'WINDV_SEND_DANMAKU') {
            console.log('[WindV] 收到发送弹幕指令:', event.data.content);
            
            // 抖音发送弹幕的方式
            // 方式1：通过页面 DOM 操作
            const danmakuInput = document.querySelector(
              '.webcast-chatcomposer-inputtextarea, ' +  // 网页版
              '[class*="chat-input"], ' +
              '[class*="danmaku"] input, ' +
              'textarea[class*="chat"]'
            );
            
            if (danmakuInput) {
              danmakuInput.focus();
              document.execCommand('insertText', false, event.data.content);
              
              // 点击发送按钮
              setTimeout(() => {
                const sendBtn = danmakuInput.closest('[class*="composer"]')?.querySelector(
                  'button[class*="send"], ' +
                  '[class*="send-btn"], ' +
                  '.webcast-chatcomposer-sendbutton'
                );
                if (sendBtn) {
                  sendBtn.click();
                }
              }, 100);
            }
          }
        });

        // 定期检查弹幕输入框
        setInterval(() => {
          const input = document.querySelector('.webcast-chatcomposer-inputtextarea');
          if (input && !window._windv_douyin_attached) {
            window._windv_douyin_attached = true;
            console.log('[WindV] 抖音弹幕输入框已定位');
          }
        }, 2000);

        console.log('[WindV] 抖音直播弹幕拦截脚本已注入');
      })();
    `

    await this.page.addInitScript(script)
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
        senderNickname: content.nickname || '抖音用户',
        timestamp: new Date(),
        raw: data
      }

      this.emitDanmaku(danmaku)

    } catch (error) {
      log.error('[抖音] 处理弹幕数据失败:', error)
    }
  }

  /**
   * 提取弹幕内容
   */
  private extractDanmakuContent(data: any): any {
    try {
      // 抖音弹幕格式
      const formats = [
        // 格式1: 通用聊天消息
        () => {
          if (data.content && data.user) {
            return {
              text: data.content,
              nickname: data.user.nickname || data.user.short_id || '抖音用户',
              userId: data.user.open_id || data.user.short_id || ''
            }
          }
        },
        // 格式2: 直接字段
        () => {
          if (data.text && data.user?.nickname) {
            return {
              text: data.text,
              nickname: data.user.nickname,
              userId: data.user.open_id || ''
            }
          }
        },
        // 格式3: comments 数组
        () => {
          if (data.comments && Array.isArray(data.comments)) {
            const comment = data.comments[0]
            return {
              text: comment.content || comment.text,
              nickname: comment.user_info?.nickname || '抖音用户',
              userId: comment.user_info?.open_id || ''
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

    log.info(`[抖音] 发送弹幕: ${content}`)

    try {
      await this.page.evaluate((text: string) => {
        window.postMessage({
          type: 'WINDV_SEND_DANMAKU',
          content: text
        }, '*')
      }, content)

    } catch (error) {
      log.error('[抖音] 发送弹幕失败:', error)
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

    log.info('[抖音] 发送点赞')

    try {
      await this.page.evaluate(() => {
        // 抖音直播点赞按钮
        const likeBtn = document.querySelector('.like-icon, [class*="like"], [class*="heart"]')
        if (likeBtn instanceof HTMLElement) {
          likeBtn.click()
        }
      })
    } catch (error) {
      log.error('[抖音] 发送点赞失败:', error)
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
      // 抖音检测更严格
      // 检查是否有验证码弹窗
      const captchaEl = await this.page.$(
        '[class*="captcha"], ' +
        '[class*="verify"], ' +
        '[class*="slider"], ' +
        '[class*="danger"]'
      )
      
      if (captchaEl) {
        return {
          isNormal: false,
          reason: '检测到验证码或风控',
          level: 'danger'
        }
      }

      // 检查页面标题
      const title = await this.page.title()
      if (title.includes('验证') || title.includes('异常')) {
        return {
          isNormal: false,
          reason: '页面显示安全验证',
          level: 'danger'
        }
      }

      // 检查是否被限流
      const bodyText = await this.page.evaluate(() => document.body.innerText)
      if (bodyText.includes('操作过于频繁') || bodyText.includes('请稍后再试')) {
        return {
          isNormal: false,
          reason: '账号被限流',
          level: 'warning'
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

      // 尝试获取抖音房间 ID
      const roomId = await this.page.evaluate(() => {
        const match = window.location.pathname.match(/\/live\/(\w+)/)
        return match ? match[1] : ''
      })

      return {
        id: roomId || this.roomInfo?.id || '',
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
    log.info('[抖音] 断开连接')

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
    log.warn('[抖音] 窗口标题查找暂未实现，请使用 URL 方式')
  }
}

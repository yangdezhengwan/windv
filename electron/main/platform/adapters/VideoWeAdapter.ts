import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { BasePlatformAdapter, PlatformCode, RoomInfo, Danmaku, OrderInfo, RiskStatus } from '../IPlatformAdapter'

export class VideoWeAdapter extends BasePlatformAdapter {
  readonly platform = PlatformCode.VIDEO_WEE
  readonly name = '视频号直播'

  private playwright: any = null
  private browser: any = null
  private page: any = null
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  async connect(roomInfo: RoomInfo): Promise<void> {
    log.info(`[视频号] 开始连接直播间: ${roomInfo.url || roomInfo.windowTitle}`)

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
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      })

      // 创建上下文
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
      log.info(`[视频号] 连接成功`)

    } catch (error) {
      log.error(`[视频号] 连接失败:`, error)
      this.emitError(error as Error)
      this.emitStatusChange('error')
      throw error
    }
  }

  /**
   * 注入弹幕拦截脚本
   * 视频号直播弹幕通过 WebSocket 或轮询获取
   */
  private async injectDanmakuScript(): Promise<void> {
    const script = `
      (function() {
        // 检测是否是视频号直播页面
        const isVideoWePage = window.location.hostname.includes('weixin.qq.com') ||
                             window.location.hostname.includes('video.weixin.qq.com') ||
                             window.location.hostname.includes(' channels.weixin');
        
        if (!isVideoWePage) {
          // 尝试其他视频号域名
          const possibleHosts = ['live.video.qq.com', 'v.qq.com'];
          if (!possibleHosts.some(h => window.location.hostname.includes(h))) {
            return;
          }
        }

        console.log('[WindV] 视频号直播页面检测中...');

        // 弹幕拦截策略
        let lastDanmakuTime = 0;

        // 方法1: WebSocket 拦截
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          const ws = protocols ? new originalWebSocket(url, protocols) : new originalWebSocket(url);
          
          // 视频号 WebSocket 特征
          const isDanmakuWS = url.includes('wss://') && (
            url.includes('weixin') ||
            url.includes('channel') ||
            url.includes('live') ||
            url.includes('msg')
          );
          
          if (isDanmakuWS) {
            console.log('[WindV] 检测到视频号 WebSocket:', url.substring(0, 100));
            
            ws.addEventListener('message', function(event) {
              try {
                let data;
                try {
                  data = JSON.parse(event.data);
                } catch {
                  const text = new TextDecoder().decode(event.data);
                  try {
                    data = JSON.parse(text);
                  } catch {
                    return;
                  }
                }
                
                // 解析弹幕
                const danmakuData = extractDanmaku(data);
                if (danmakuData) {
                  window.postMessage({
                    type: 'WINDV_DANMAKU',
                    platform: 'video_we',
                    data: danmakuData
                  }, '*');
                }
              } catch (e) {}
            });
          }
          
          return ws;
        };
        window.WebSocket.prototype = originalWebSocket.prototype;

        // 方法2: XHR 请求拦截
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
          this.addEventListener('load', function() {
            try {
              const data = JSON.parse(this.responseText);
              
              // 视频号弹幕 API 特征
              if (url.includes('getcomment') || 
                  url.includes('getmsg') || 
                  url.includes('danmu') ||
                  url.includes('comment')) {
                
                const danmakuData = extractDanmaku(data);
                if (danmakuData) {
                  window.postMessage({
                    type: 'WINDV_DANMAKU',
                    platform: 'video_we',
                    data: danmakuData
                  }, '*');
                }
              }
            } catch (e) {}
          });
          return originalXHROpen.call(this, method, url, async, user, password);
        };

        // 方法3: DOM 监听弹幕列表变化
        function observeDanmakuList() {
          const danmakuContainer = document.querySelector(
            '.danmaku-list, ' +           // 弹幕列表容器
            '[class*="comment-list"], ' + // 评论列表
            '[class*="message-list"], ' +  // 消息列表
            '[class*="chat-list"], ' +     // 聊天列表
            '.video-wechat-danmaku'        // 视频号弹幕
          );
          
          if (danmakuContainer) {
            console.log('[WindV] 检测到弹幕列表容器');
            
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === 1) {
                    const text = node.innerText || node.textContent;
                    if (text && text.length < 100 && Date.now() - lastDanmakuTime > 500) {
                      lastDanmakuTime = Date.now();
                      window.postMessage({
                        type: 'WINDV_DANMAKU',
                        platform: 'video_we',
                        data: {
                          text: text.trim(),
                          nickname: '视频号用户',
                          userId: ''
                        }
                      }, '*');
                    }
                  }
                });
              });
            });
            
            observer.observe(danmakuContainer, { childList: true, subtree: true });
          }
        }

        // 定期检查弹幕容器
        setTimeout(observeDanmakuList, 2000);
        setInterval(observeDanmakuList, 5000);

        // 提取弹幕数据
        function extractDanmaku(data) {
          if (!data) return null;

          // 格式1: 列表格式
          if (data.comments && Array.isArray(data.comments)) {
            const comment = data.comments[0];
            return {
              text: comment.content || comment.text || comment.msg,
              nickname: comment.nickname || comment.userInfo?.nickname || '视频号用户',
              userId: comment.openid || comment.userId || ''
            };
          }

          // 格式2: 弹幕数组
          if (data.danmu && Array.isArray(data.danmu)) {
            const danmu = data.danmu[0];
            return {
              text: danmu.content || danmu.text,
              nickname: danmu.nickname || '视频号用户',
              userId: danmu.openid || ''
            };
          }

          // 格式3: 通用消息格式
          if (data.content && typeof data.content === 'string') {
            return {
              text: data.content,
              nickname: data.nickname || data.userInfo?.nickname || '视频号用户',
              userId: data.openid || data.userId || ''
            };
          }

          // 格式4: msg 字段
          if (data.msg && typeof data.msg === 'string') {
            return {
              text: data.msg,
              nickname: data.nickName || data.fromUser?.nickname || '视频号用户',
              userId: data.openId || data.fromUser?.openid || ''
            };
          }

          return null;
        }

        // 发送弹幕
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'WINDV_SEND_DANMAKU') {
            console.log('[WindV] 收到视频号发送弹幕指令:', event.data.content);
            
            // 视频号发送弹幕方式
            const danmakuInput = document.querySelector(
              'input[class*="danmaku"], ' +
              'textarea[class*="comment"], ' +
              '[class*="chat"] input, ' +
              '[class*="message"] input, ' +
              '[class*="input"][class*="danmu"]'
            );
            
            if (danmakuInput) {
              danmakuInput.value = event.data.content;
              danmakuInput.dispatchEvent(new Event('input', { bubbles: true }));
              
              const sendBtn = danmakuInput.closest('form')?.querySelector(
                'button[type="submit"], ' +
                '[class*="send"], ' +
                '[class*="submit"]'
              );
              
              if (sendBtn) {
                sendBtn.click();
              }
            }
          }
        });

        console.log('[WindV] 视频号直播弹幕拦截脚本已注入');
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
        senderNickname: content.nickname || '视频号用户',
        timestamp: new Date(),
        raw: data
      }

      this.emitDanmaku(danmaku)

    } catch (error) {
      log.error('[视频号] 处理弹幕数据失败:', error)
    }
  }

  /**
   * 提取弹幕内容
   */
  private extractDanmakuContent(data: any): any {
    try {
      const formats = [
        () => {
          if (data.content && typeof data.content === 'string') {
            return {
              text: data.content,
              nickname: data.nickname || data.userInfo?.nickname || '视频号用户',
              userId: data.openid || data.userId || ''
            }
          }
        },
        () => {
          if (data.text && typeof data.text === 'string') {
            return {
              text: data.text,
              nickname: data.nickname || '视频号用户',
              userId: data.openid || ''
            }
          }
        },
        () => {
          if (data.msg && typeof data.msg === 'string') {
            return {
              text: data.msg,
              nickname: data.nickName || '视频号用户',
              userId: data.openId || ''
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

    log.info(`[视频号] 发送弹幕: ${content}`)

    try {
      await this.page.evaluate((text: string) => {
        window.postMessage({
          type: 'WINDV_SEND_DANMAKU',
          content: text
        }, '*')
      }, content)

    } catch (error) {
      log.error('[视频号] 发送弹幕失败:', error)
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

    log.info('[视频号] 发送点赞')

    try {
      await this.page.evaluate(() => {
        // 视频号点赞按钮
        const likeBtn = document.querySelector('.like-btn, [class*="like"], [class*="thumb"]')
        if (likeBtn instanceof HTMLElement) {
          likeBtn.click()
        }
      })
    } catch (error) {
      log.error('[视频号] 发送点赞失败:', error)
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
      const riskElements = await this.page.$$(
        '[class*="verify"], ' +
        '[class*="captcha"], ' +
        '[class*="limit"], ' +
        '[class*="block"]'
      )
      
      if (riskElements.length > 0) {
        return {
          isNormal: false,
          reason: '检测到风控验证',
          level: 'danger'
        }
      }

      // 检查页面内容
      const bodyText = await this.page.evaluate(() => document.body.innerText)
      if (bodyText.includes('操作频繁') || bodyText.includes('验证')) {
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
    log.info('[视频号] 断开连接')

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
    log.warn('[视频号] 窗口标题查找暂未实现，请使用 URL 方式')
  }
}

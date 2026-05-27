import { Tray, Menu, nativeImage, BrowserWindow, app, Notification } from 'electron'
import { join } from 'path'
import log from 'electron-log'

interface TrayStatus {
  running: number
  paused: number
  error: number
}

export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.createTray()
  }

  /**
   * 创建托盘图标
   */
  private createTray(): void {
    try {
      // 创建托盘图标（使用简单的内置图标）
      const icon = this.createTrayIcon()
      this.tray = new Tray(icon)

      this.tray.setToolTip('无人直播助手 - 运行中')
      this.updateContextMenu()

      // 点击托盘图标，显示/隐藏主窗口
      this.tray.on('click', () => {
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide()
        } else {
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      })

      // 双击显示主窗口
      this.tray.on('double-click', () => {
        this.mainWindow.show()
        this.mainWindow.focus()
      })

      log.info('系统托盘已创建')

    } catch (error) {
      log.error('创建托盘失败:', error)
    }
  }

  /**
   * 创建托盘图标
   */
  private createTrayIcon(): ReturnType<typeof nativeImage.createFromBuffer> {
    // 创建一个 16x16 的简单图标
    const size = 16
    const canvas = Buffer.alloc(size * size * 4)

    // 绘制一个简单的圆形图标（绿色表示运行中）
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4
        const centerX = size / 2
        const centerY = size / 2
        const radius = size / 2 - 1
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

        if (distance <= radius) {
          // 绿色
          canvas[idx] = 64      // R
          canvas[idx + 1] = 158  // G
          canvas[idx + 2] = 255  // B
          canvas[idx + 3] = 255  // A
        } else {
          // 透明
          canvas[idx] = 0
          canvas[idx + 1] = 0
          canvas[idx + 2] = 0
          canvas[idx + 3] = 0
        }
      }
    }

    return nativeImage.createFromBuffer(canvas, { width: size, height: size })
  }

  /**
   * 更新右键菜单
   */
  updateContextMenu(status?: TrayStatus): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '小狐狸',
        enabled: false
      },
      { type: 'separator' },
      {
        label: '显示主窗口',
        click: () => {
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      },
      { type: 'separator' },
      {
        label: '全部房间开始监控',
        click: () => {
          this.mainWindow.webContents.send('tray:start-all')
        }
      },
      {
        label: '全部房间暂停',
        click: () => {
          this.mainWindow.webContents.send('tray:pause-all')
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          (app as any).isQuitting = true
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }

  /**
   * 更新托盘提示
   */
  updateTooltip(text: string): void {
    if (this.tray) {
      this.tray.setToolTip(text)
    }
  }

  /**
   * 显示通知
   */
  showNotification(title: string, body: string): void {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        silent: true
      })
      notification.show()
    }
  }

  /**
   * 销毁托盘
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
      log.info('系统托盘已销毁')
    }
  }
}

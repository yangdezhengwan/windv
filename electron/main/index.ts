import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { initDatabase } from './database'
import { setupIpcHandlers } from './ipc'
import { PlatformManager } from './modules/PlatformManager'
import { TrayManager } from './modules/TrayManager'
import { ShortcutManager } from './modules/ShortcutManager'
import { ExceptionNotifier } from './modules/ExceptionNotifier'

// 日志配置
log.transports.file.level = 'info'
log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
log.info('应用启动...')

// 全局引用
let mainWindow: BrowserWindow | null = null
let trayManager: TrayManager | null = null
let platformManager: PlatformManager | null = null
let shortcutManager: ShortcutManager | null = null

// 禁止多实例
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  log.warn('已有实例运行，退出...')
  app.quit()
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

/**
 * 创建主窗口
 */
function createWindow(): void {
  log.info('创建主窗口...')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: '小狐狸',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // 创建菜单
  const menu = Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        { label: '导入话术', click: () => mainWindow?.webContents.send('menu:import-script') },
        { label: '导出数据', click: () => mainWindow?.webContents.send('menu:export-data') },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.webContents.reload() },
        { label: '开发者工具', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '使用文档', click: () => require('electron').shell.openExternal('https://github.com/windv') },
        { label: '关于', click: () => showAboutDialog() }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  // 加载页面
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  // 显示窗口
  mainWindow.once('ready-to-show', () => {
    log.info('主窗口已显示')
    mainWindow?.show()
  })

  // 关闭时最小化到托盘
  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      trayManager?.showNotification('小狐狸', '已最小化到托盘，运行中...')
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * 显示关于对话框
 */
function showAboutDialog(): void {
  dialog.showMessageBox({
    type: 'info',
    title: '关于',
    message: '小狐狸',
    detail: `版本: 1.0.0\n小狐狸 AI 辅助系统\n\n© 2026 All Rights Reserved`
  })
}

/**
 * 初始化应用
 */
async function initApp(): Promise<void> {
  try {
    log.info('初始化数据库...')
    await initDatabase()

    log.info('初始化平台管理器...')
    platformManager = new PlatformManager()

    log.info('注册 IPC 处理器...')
    setupIpcHandlers(platformManager)

    log.info('创建主窗口...')
    createWindow()

    log.info('初始化系统托盘...')
    trayManager = new TrayManager(mainWindow!)

    log.info('初始化快捷键管理器...')
    shortcutManager = ShortcutManager.getInstance()
    shortcutManager.registerAll({
      toggle_monitor: () => {
        mainWindow?.webContents.send('shortcut:triggered', { action: 'toggle_monitor' })
      },
      clear_logs: () => {
        mainWindow?.webContents.send('shortcut:triggered', { action: 'clear_logs' })
      },
      emergency_stop: () => {
        mainWindow?.webContents.send('shortcut:triggered', { action: 'emergency_stop' })
      },
      show_window: () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow?.show()
          mainWindow?.focus()
        }
      }
    })

    log.info('初始化异常通知器...')
    ExceptionNotifier.getInstance().setMainWindow(mainWindow!)

    log.info('应用初始化完成!')
  } catch (error) {
    log.error('应用初始化失败:', error)
    dialog.showErrorBox('启动错误', `应用初始化失败: ${error}`)
    app.quit()
  }
}

// 应用事件
app.whenReady().then(initApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  (app as any).isQuitting = true
  log.info('应用即将退出...')
  platformManager?.disposeAll()
})

// 导出给 IPC 使用
export { mainWindow, platformManager, shortcutManager }

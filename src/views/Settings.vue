<template>
  <div class="settings-page">
    <!-- Animated Background -->
    <div class="bg-animation">
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
    </div>
    
    <el-container>
      <!-- Sidebar -->
      <el-aside width="220" class="glass-sidebar">
        <div class="logo-container">
          <div class="logo-glow">
            <img src="/icon.png" class="logo-img" alt="Logo" />
          </div>
          <div class="logo-text">
            <span class="brand">WindV</span>
            <span class="tagline">AI Live Assistant</span>
          </div>
        </div>
        
        <el-menu
          :default-active="$route.path"
          :router="true"
          class="tech-menu"
          background-color="transparent"
          text-color="rgba(255,255,255,0.7)"
          active-text-color="#00d4ff"
        >
          <el-menu-item index="/" class="menu-item">
            <el-icon class="menu-icon"><DataAnalysis /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/platform" class="menu-item">
            <el-icon class="menu-icon"><Monitor /></el-icon>
            <span>平台管理</span>
          </el-menu-item>
          <el-menu-item index="/script" class="menu-item">
            <el-icon class="menu-icon"><ChatDotRound /></el-icon>
            <span>话术库</span>
          </el-menu-item>
          <el-menu-item index="/risk" class="menu-item">
            <el-icon class="menu-icon"><Shield /></el-icon>
            <span>风控设置</span>
          </el-menu-item>
          <el-menu-item index="/stats" class="menu-item">
            <el-icon class="menu-icon"><DataLine /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          <el-menu-item index="/settings" class="menu-item">
            <el-icon class="menu-icon"><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- Main Content -->
      <el-container class="main-container">
        <el-header class="glass-header">
          <div class="header-left">
            <h2 class="page-title">
              <span class="title-highlight">System</span>
              <span class="title-sub">系统设置</span>
              <span class="title-divider"></span>
            </h2>
          </div>
          <div class="header-right">
            <el-button type="primary" class="tech-btn-glow" @click="saveSettings">
              <el-icon><Check /></el-icon>
              Save Changes
            </el-button>
          </div>
        </el-header>

        <el-main class="main-content">
          <el-row :gutter="24">
            <!-- Left Column -->
            <el-col :xs="24" :lg="12">
              <!-- 通用设置 Settings -->
              <div class="settings-card">
                <div class="card-header">
                  <div class="header-icon">⚙️</div>
                  <div class="header-title">通用设置</div>
                </div>
                <div class="card-body">
                  <div class="setting-item">
                    <div class="setting-info">
                      <div class="setting-label">开机启动</div>
                      <div class="setting-desc">Launch on system startup</div>
                    </div>
                    <el-switch v-model="settings.autoStart" />
                  </div>
                  <div class="setting-item">
                    <div class="setting-info">
                      <div class="setting-label">最小化到托盘</div>
                      <div class="setting-desc">Keep running in background</div>
                    </div>
                    <el-switch v-model="settings.minimizeToTray" />
                  </div>
                  <div class="setting-item">
                    <div class="setting-info">
                      <div class="setting-label">Notification Sound</div>
                      <div class="setting-desc">Play sound on new orders</div>
                    </div>
                    <el-switch v-model="settings.notificationSound" />
                  </div>
                </div>
              </div>

              <!-- Risk Control -->
              <div class="settings-card">
                <div class="card-header">
                  <div class="header-icon">🛡️</div>
                  <div class="header-title">风控设置</div>
                </div>
                <div class="card-body">
                  <div class="setting-item vertical">
                    <div class="setting-info">
                      <div class="setting-label">Reply Delay</div>
                      <div class="setting-desc">Random delay between {{ settings.minDelay }}ms - {{ settings.maxDelay }}ms</div>
                    </div>
                    <div class="range-inputs">
                      <el-input-number v-model="settings.minDelay" :min="500" :max="5000" :step="100" size="small" />
                      <span class="range-separator">to</span>
                      <el-input-number v-model="settings.maxDelay" :min="500" :max="10000" :step="100" size="small" />
                    </div>
                  </div>
                  <div class="setting-item">
                    <div class="setting-info">
                      <div class="setting-label">Max Replies/Min</div>
                      <div class="setting-desc">Limit to avoid rate limiting</div>
                    </div>
                    <el-input-number v-model="settings.maxPerMinute" :min="5" :max="60" size="small" />
                  </div>
                  <div class="setting-item">
                    <div class="setting-info">
                      <div class="setting-label">Sensitive Word Filter</div>
                      <div class="setting-desc">Auto-filter prohibited words</div>
                    </div>
                    <el-switch v-model="settings.sensitiveFilter" />
                  </div>
                </div>
              </div>

              <!-- Order Settings (V3) -->
              <div class="settings-card featured">
                <div class="card-glow"></div>
                <div class="card-header">
                  <div class="header-icon">💰</div>
                  <div class="header-title">Order Alerts</div>
                  <el-tag size="small" type="warning" class="v3-tag">V3</el-tag>
                </div>
                <div class="card-body">
                  <div class="setting-item">
                    <div class="setting-info">
                      <div class="setting-label">Enable Popup Alerts</div>
                      <div class="setting-desc">Show notification for large orders</div>
                    </div>
                    <el-switch v-model="orderConfig.enablePopup" />
                  </div>
                  <div class="threshold-list">
                    <div class="threshold-item">
                      <span class="threshold-label">Large Order</span>
                      <el-input-number v-model="orderConfig.largeThreshold" :min="100" :step="100" size="small">
                        <template #suffix>¥</template>
                      </el-input-number>
                    </div>
                    <div class="threshold-item">
                      <span class="threshold-label">Mega Order</span>
                      <el-input-number v-model="orderConfig.megaThreshold" :min="500" :step="500" size="small">
                        <template #suffix>¥</template>
                      </el-input-number>
                    </div>
                  </div>
                  <div class="setting-item">
                    <div class="setting-info">
                      <div class="setting-label">Repeat Announcement</div>
                      <div class="setting-desc">Repeat {{ orderConfig.repeatCount }} times for large orders</div>
                    </div>
                    <el-switch v-model="orderConfig.enableRepeat" />
                  </div>
                </div>
              </div>
            </el-col>

            <!-- Right Column -->
            <el-col :xs="24" :lg="12">
              <!-- Shortcuts -->
              <div class="settings-card">
                <div class="card-header">
                  <div class="header-icon">⌨️</div>
                  <div class="header-title">Keyboard Shortcuts</div>
                </div>
                <div class="card-body">
                  <div class="shortcut-list">
                    <div class="shortcut-item">
                      <div class="shortcut-info">
                        <div class="shortcut-name">Toggle Monitor</div>
                        <div class="shortcut-desc">Start/Stop all rooms</div>
                      </div>
                      <div class="shortcut-key">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
                      </div>
                    </div>
                    <div class="shortcut-item">
                      <div class="shortcut-info">
                        <div class="shortcut-name">Emergency Stop</div>
                        <div class="shortcut-desc">Stop all immediately</div>
                      </div>
                      <div class="shortcut-key danger">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>
                      </div>
                    </div>
                    <div class="shortcut-item">
                      <div class="shortcut-info">
                        <div class="shortcut-name">Clear Logs</div>
                        <div class="shortcut-desc">Clear all danmaku logs</div>
                      </div>
                      <div class="shortcut-key">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>
                      </div>
                    </div>
                    <div class="shortcut-item">
                      <div class="shortcut-info">
                        <div class="shortcut-name">Show Window</div>
                        <div class="shortcut-desc">Bring to foreground</div>
                      </div>
                      <div class="shortcut-key">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Data Management -->
              <div class="settings-card">
                <div class="card-header">
                  <div class="header-icon">💾</div>
                  <div class="header-title">Data Management</div>
                </div>
                <div class="card-body">
                  <div class="data-actions">
                    <el-button class="data-btn" @click="exportScripts">
                      <el-icon><Download /></el-icon>
                      Export Scripts (Excel)
                    </el-button>
                    <el-button class="data-btn" @click="importScripts">
                      <el-icon><Upload /></el-icon>
                      Import Scripts
                    </el-button>
                    <el-button class="data-btn" @click="downloadTemplate">
                      <el-icon><Document /></el-icon>
                      Download Template
                    </el-button>
                    <el-button class="data-btn" @click="createBackup">
                      <el-icon><FolderChecked /></el-icon>
                      Backup Data
                    </el-button>
                    <el-button class="data-btn" @click="restoreBackup">
                      <el-icon><FolderOpened /></el-icon>
                      Restore Backup
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- About -->
              <div class="settings-card about">
                <div class="about-content">
                  <img src="/icon.png" class="about-logo" />
                  <h3 class="about-name">WindV AI Assistant</h3>
                  <p class="about-version">Version {{ version }}</p>
                  <p class="about-desc">Professional multi-platform live streaming AI assistant</p>
                  <div class="about-links">
                    <a href="#" @click.prevent="openExternal('https://github.com')">GitHub</a>
                    <a href="#" @click.prevent="openExternal('https://docs.example.com')">Documentation</a>
                    <a href="#" @click.prevent="openExternal('https://support.example.com')">Support</a>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface Settings {
  autoStart: boolean
  minimizeToTray: boolean
  notificationSound: boolean
  minDelay: number
  maxDelay: number
  maxPerMinute: number
  sensitiveFilter: boolean
}

interface OrderConfig {
  enablePopup: boolean
  largeThreshold: number
  megaThreshold: number
  enableRepeat: boolean
  repeatCount: number
}

const settings = reactive<Settings>({
  autoStart: false,
  minimizeToTray: true,
  notificationSound: true,
  minDelay: 1000,
  maxDelay: 3000,
  maxPerMinute: 20,
  sensitiveFilter: true
})

const orderConfig = reactive<OrderConfig>({
  enablePopup: true,
  largeThreshold: 500,
  megaThreshold: 2000,
  enableRepeat: true,
  repeatCount: 3
})

const version = ref('1.0.0')

async function loadSettings() {
  try {
    const allSettings = await window.windv.settings.getAll()
    
    settings.autoStart = allSettings.autoStart === 'true'
    settings.minimizeToTray = allSettings.minimizeToTray !== 'false'
    settings.notificationSound = allSettings.notificationSound !== 'false'
    settings.minDelay = parseInt(allSettings.minDelay) || 1000
    settings.maxDelay = parseInt(allSettings.maxDelay) || 3000
    settings.maxPerMinute = parseInt(allSettings.maxPerMinute) || 20
    settings.sensitiveFilter = allSettings.sensitiveFilter !== 'false'
    
    // Load order config
    const savedOrderConfig = await window.windv.settings.get('orderConfig')
    if (savedOrderConfig) {
      const parsed = JSON.parse(savedOrderConfig)
      Object.assign(orderConfig, parsed)
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

async function saveSettings() {
  try {
    const promises = [
      window.windv.settings.set('autoStart', String(settings.autoStart)),
      window.windv.settings.set('minimizeToTray', String(settings.minimizeToTray)),
      window.windv.settings.set('notificationSound', String(settings.notificationSound)),
      window.windv.settings.set('minDelay', String(settings.minDelay)),
      window.windv.settings.set('maxDelay', String(settings.maxDelay)),
      window.windv.settings.set('maxPerMinute', String(settings.maxPerMinute)),
      window.windv.settings.set('sensitiveFilter', String(settings.sensitiveFilter)),
      window.windv.settings.set('orderConfig', JSON.stringify(orderConfig))
    ]
    
    await Promise.all(promises)
    ElMessage.success('Settings saved')
  } catch (error) {
    ElMessage.error('Save failed')
  }
}

async function exportScripts() {
  try {
    const result = await window.windv.excel.exportScripts()
    if (result.success) {
      ElMessage.success(`Exported to ${result.filePath}`)
    }
  } catch (error) {
    ElMessage.error('Export failed')
  }
}

async function importScripts() {
  try {
    const filePath = await window.windv.system.selectFile({
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }]
    })
    if (!filePath) return
    
    const result = await window.windv.excel.importScripts(filePath)
    if (result.success) {
      ElMessage.success(`Imported ${result.count} scripts`)
    }
  } catch (error) {
    ElMessage.error('Import failed')
  }
}

async function downloadTemplate() {
  try {
    const result = await window.windv.excel.getTemplate()
    if (result.success) {
      ElMessage.success(`Template saved to ${result.filePath}`)
    }
  } catch (error) {
    ElMessage.error('Download failed')
  }
}

async function createBackup() {
  try {
    const result = await window.windv.backup.create()
    if (result.success) {
      ElMessage.success('Backup created')
    }
  } catch (error) {
    ElMessage.error('Backup failed')
  }
}

async function restoreBackup() {
  try {
    const filePath = await window.windv.system.selectFile({
      filters: [{ name: 'Backup', extensions: ['db', 'zip'] }]
    })
    if (!filePath) return
    
    await window.windv.backup.restore(filePath)
    ElMessage.success('Backup restored')
  } catch (error) {
    ElMessage.error('Restore failed')
  }
}

function openExternal(url: string) {
  window.windv.system.openExternal(url)
}

onMounted(() => {
  loadSettings()
  window.windv.system.getVersion().then(v => {
    version.value = v
  })
})
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2a 100%);
  position: relative;
  overflow: hidden;
}

// Background Animation
.bg-animation {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.bg-glow {
  position: absolute;
  bottom: -30%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 255, 136, 0.08) 0%, transparent 70%);
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

// Glass Sidebar
.glass-sidebar {
  background: rgba(20, 20, 40, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.logo-container {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-glow {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tagline {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.tech-menu {
  flex: 1;
  border: none;
  padding: 16px 12px;
}

.menu-item {
  margin: 8px 0;
  border-radius: 12px;
  height: 48px;
  line-height: 48px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: rgba(0, 212, 255, 0.1) !important;
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 153, 255, 0.1) 100%) !important;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
}

// Main Container
.main-container {
  position: relative;
  z-index: 1;
}

// Header
.glass-header {
  background: rgba(20, 20, 40, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-highlight {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.title-sub {
  font-size: 24px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.5);
}

.title-divider {
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #00d4ff 0%, transparent 100%);
  border-radius: 2px;
  margin-left: 8px;
}

.tech-btn-glow {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  border: none;
  color: #fff;
  font-weight: 500;
  border-radius: 10px;
  padding: 12px 24px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  transition: all 0.3s;
}

.tech-btn-glow:hover {
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  transform: translateY(-2px);
}

// Main Content
.main-content {
  padding: 24px 32px;
}

// Settings Card
.settings-card {
  position: relative;
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
}

.settings-card.featured {
  border-color: rgba(255, 200, 0, 0.2);
}

.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(255, 200, 0, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-icon {
  font-size: 24px;
}

.header-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.v3-tag {
  background: rgba(255, 200, 0, 0.2) !important;
  border-color: rgba(255, 200, 0, 0.3) !important;
  color: #ffc800 !important;
}

.card-body {
  padding: 16px 24px;
}

// Setting Item
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-separator {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

// Threshold List
.threshold-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.threshold-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.threshold-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

// Shortcut List
.shortcut-list {
  display: flex;
  flex-direction: column;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
}

.shortcut-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.shortcut-key {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.shortcut-key.danger {
  color: #ff6464;
}

kbd {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.shortcut-key.danger kbd {
  background: rgba(255, 100, 100, 0.1);
  border-color: rgba(255, 100, 100, 0.3);
}

// Data Actions
.data-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.data-btn {
  justify-content: flex-start;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  height: auto;
}

.data-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: #00d4ff;
}

.data-btn .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

// About Card
.settings-card.about {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 153, 255, 0.05) 100%);
}

.about-content {
  padding: 32px 24px;
  text-align: center;
}

.about-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  margin-bottom: 16px;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
}

.about-name {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px;
}

.about-version {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 16px;
}

.about-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 24px;
}

.about-links {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.about-links a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.3s;
}

.about-links a:hover {
  color: #00d4ff;
}

// Switch
:deep(.el-switch__core) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  border-color: transparent;
}

// Scrollbar
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

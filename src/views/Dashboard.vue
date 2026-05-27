<template>
  <div class="dashboard">
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
            <span class="brand">小狐狸</span>
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
            <span>Dashboard</span>
          </el-menu-item>
          <el-menu-item index="/platform" class="menu-item">
            <el-icon class="menu-icon"><Monitor /></el-icon>
            <span>Platforms</span>
          </el-menu-item>
          <el-menu-item index="/script" class="menu-item">
            <el-icon class="menu-icon"><ChatDotRound /></el-icon>
            <span>Scripts</span>
          </el-menu-item>
          <el-menu-item index="/risk" class="menu-item">
            <el-icon class="menu-icon"><Shield /></el-icon>
            <span>Risk Control</span>
          </el-menu-item>
          <el-menu-item index="/stats" class="menu-item">
            <el-icon class="menu-icon"><DataLine /></el-icon>
            <span>Analytics</span>
          </el-menu-item>
          <el-menu-item index="/settings" class="menu-item">
            <el-icon class="menu-icon"><Setting /></el-icon>
            <span>Settings</span>
          </el-menu-item>
        </el-menu>
        
        <!-- System Status -->
        <div class="system-status">
          <div class="status-item">
            <div class="status-dot" :class="{ active: isRunning }"></div>
            <span>{{ isRunning ? '系统运行中' : '待机中' }}</span>
          </div>
          <div class="version">v{{ version }}</div>
        </div>
      </el-aside>

      <!-- Main Content -->
      <el-container class="main-container">
        <el-header class="glass-header">
          <div class="header-left">
            <h2 class="page-title">
              <span class="title-highlight">Dashboard</span>
              <span class="title-divider"></span>
            </h2>
          </div>
          <div class="header-right">
            <div class="live-indicator" v-if="activeRooms.length > 0">
              <span class="pulse"></span>
              <span>{{ activeRooms.length }} Rooms Active</span>
            </div>
            <div class="time-display">{{ currentTime }}</div>
          </div>
        </el-header>

        <el-main class="main-content">
          <!-- Stats Cards -->
          <el-row :gutter="20" class="stats-row">
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow"></div>
                <div class="stat-icon danmaku">
                  <el-icon><ChatLineSquare /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ formatNumber(todayStats.danmakuCount) }}</div>
                  <div class="stat-label">Danmaku Today</div>
                </div>
                <div class="stat-trend up">+12%</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow"></div>
                <div class="stat-icon reply">
                  <el-icon><Message /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ formatNumber(todayStats.replyCount) }}</div>
                  <div class="stat-label">Replies Sent</div>
                </div>
                <div class="stat-trend up">+8%</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow"></div>
                <div class="stat-icon rate">
                  <el-icon><SuccessFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ todayStats.replyRate }}%</div>
                  <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-trend">--</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow"></div>
                <div class="stat-icon order">
                  <el-icon><ShoppingCart /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ formatNumber(todayStats.orderCount) }}</div>
                  <div class="stat-label">Orders Today</div>
                </div>
                <div class="stat-trend up">+23%</div>
              </div>
            </el-col>
          </el-row>

          <!-- Active Rooms & Logs -->
          <el-row :gutter="20" class="content-row">
            <el-col :xs="24" :lg="12">
              <div class="glass-card">
                <div class="card-header">
                  <div class="header-title">
                    <span class="title-icon active"></span>
                    <span>Active Rooms</span>
                  </div>
                  <el-button type="primary" class="tech-btn" @click="$router.push('/platform')">
                    <el-icon><Plus /></el-icon>
                  </el-button>
                </div>
                <div class="room-list">
                  <div v-if="activeRooms.length === 0" class="empty-state">
                    <div class="empty-icon">📡</div>
                    <div class="empty-text">No active rooms</div>
                    <el-button type="primary" class="tech-btn" @click="$router.push('/platform')">
                      Add Room
                    </el-button>
                  </div>
                  <div v-else class="room-items">
                    <div v-for="room in activeRooms" :key="room.id" class="room-item">
                      <div class="room-platform">
                        <img :src="getPlatformIcon(room.platform)" class="platform-icon-small" />
                      </div>
                      <div class="room-info">
                        <div class="room-name">{{ room.name }}</div>
                        <div class="room-status" :class="room.status">
                          {{ room.status === 'monitoring' ? '直播中' : '已暂停' }}
                        </div>
                      </div>
                      <div class="room-actions">
                        <el-button 
                          size="small" 
                          :type="room.status === 'monitoring' ? 'warning' : 'success'"
                          class="action-btn"
                          @click="toggleRoom(room.id, room.status)"
                        >
                          {{ room.status === 'monitoring' ? '⏸' : '▶' }}
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :lg="12">
              <div class="glass-card">
                <div class="card-header">
                  <div class="header-title">
                    <span class="title-icon log"></span>
                    <span>Live Logs</span>
                  </div>
                  <el-button size="small" class="tech-btn-secondary" @click="clearLogs">
                    Clear
                  </el-button>
                </div>
                <div class="log-container" ref="logContainer">
                  <div v-for="log in danmakuLogs" :key="log.id" class="log-item">
                    <div class="log-time">{{ formatTime(log.created_at) }}</div>
                    <div class="log-badge" :class="log.intent_type">
                      {{ getIntentLabel(log.intent_type) }}
                    </div>
                    <div class="log-content">{{ log.content }}</div>
                    <div class="log-user">{{ log.sender_nickname }}</div>
                    <div class="log-status" :class="{ sent: log.response_sent }">
                      {{ log.response_sent ? '✓' : '' }}
                    </div>
                  </div>
                  <div v-if="danmakuLogs.length === 0" class="empty-logs">
                    Waiting for danmaku...
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

interface ActiveRoom {
  id: string
  name: string
  status: string
  platform: string
}

interface DanmakuLog {
  id: string
  content: string
  sender_nickname: string
  intent_type: string
  response_sent: number
  created_at: string
}

interface TodayStats {
  danmakuCount: number
  replyCount: number
  replyRate: number
  orderCount: number
}

const activeRooms = ref<ActiveRoom[]>([])
const danmakuLogs = ref<DanmakuLog[]>([])
const todayStats = reactive<TodayStats>({
  danmakuCount: 0,
  replyCount: 0,
  replyRate: 0,
  orderCount: 0
})
const currentTime = ref('')
const version = ref('1.0.0')
const isRunning = ref(false)

// Format functions
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

function formatTime(time: string): string {
  const date = new Date(time)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  })
}

function getIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    chat: '弹幕',
    price: '价格',
    logistics: '物流',
    aftersale: '售后',
    size: '尺码',
    discount: '优惠'
  }
  return labels[intent] || 'OTHER'
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    taobao: 'https://img.alicdn.com/tfs/TB1Ly5oS3HqK1RjSZFPXXcwapXa-32-32.png',
    pinduoduo: 'https://cdn.pinduoduo.com/upload/home/img/common/pdd_logo.png',
    douyin: 'https://lf-dw.tiktok.com/obj/tiktok-web-tx/tiktok-logo.png',
    video_we: '/video-we-icon.png'
  }
  return icons[platform] || '/default-icon.png'
}

// Actions
async function loadData() {
  try {
    const rooms = await window.windv.room.getActive()
    activeRooms.value = rooms
    isRunning.value = rooms.some(r => r.status === 'monitoring')
    
    const stats = await window.windv.stats.getRealtime('')
    if (stats) {
      todayStats.danmakuCount = stats.todayDanmakuCount || 0
      todayStats.replyCount = stats.todayReplyCount || 0
      todayStats.replyRate = stats.replySuccessRate || 0
      todayStats.orderCount = stats.todayOrderCount || 0
    }
    
    const logs = await window.windv.danmaku.getLogs({ limit: 50 })
    danmakuLogs.value = logs
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

async function toggleRoom(roomId: string, currentStatus: string) {
  try {
    if (currentStatus === 'monitoring') {
      await window.windv.room.stop(roomId)
    } else {
      await window.windv.room.start(roomId)
    }
    loadData()
    ElMessage.success('Operation successful')
  } catch (error) {
    ElMessage.error('Operation failed')
  }
}

function clearLogs() {
  danmakuLogs.value = []
}

// Time update
let timeInterval: number
function updateTime() {
  currentTime.value = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

onMounted(() => {
  loadData()
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
  
  window.windv.on('danmaku:new', (data: DanmakuLog) => {
    danmakuLogs.value.unshift(data)
    if (danmakuLogs.value.length > 100) {
      danmakuLogs.value.pop()
    }
    todayStats.danmakuCount++
  })
})

onUnmounted(() => {
  clearInterval(timeInterval)
})
</script>

<style lang="scss" scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2a 100%);
  position: relative;
  overflow: hidden;
}

// Animated Background
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
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
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

// Tech Menu
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

// System Status
.system-status {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-dot.active {
  background: #00ff88;
  box-shadow: 0 0 8px #00ff88;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.version {
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

// Main Container
.main-container {
  position: relative;
  z-index: 1;
}

// Glass Header
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

.title-divider {
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #00d4ff 0%, transparent 100%);
  border-radius: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 20px;
  color: #00ff88;
  font-size: 13px;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.time-display {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2px;
}

// Main Content
.main-content {
  padding: 24px 32px;
}

// Stats Row
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-2px);
}

.stat-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover .stat-glow {
  opacity: 1;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.danmaku {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 212, 255, 0.05) 100%);
  color: #00d4ff;
}

.stat-icon.reply {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 136, 0.05) 100%);
  color: #00ff88;
}

.stat-icon.rate {
  background: linear-gradient(135deg, rgba(255, 200, 0, 0.2) 0%, rgba(255, 200, 0, 0.05) 100%);
  color: #ffc800;
}

.stat-icon.order {
  background: linear-gradient(135deg, rgba(255, 100, 100, 0.2) 0%, rgba(255, 100, 100, 0.05) 100%);
  color: #ff6464;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-trend {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
}

.stat-trend.up {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
}

// Content Row
.content-row {
  margin-top: 24px;
}

// Glass Card
.glass-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.title-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.title-icon.active {
  background: #00ff88;
  box-shadow: 0 0 8px #00ff88;
}

.title-icon.log {
  background: #00d4ff;
  box-shadow: 0 0 8px #00d4ff;
}

// Tech Buttons
.tech-btn {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  border: none;
  color: #fff;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s;
}

.tech-btn:hover {
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
  transform: translateY(-1px);
}

.tech-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

// Room List
.room-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.room-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.room-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
}

.platform-icon-small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.room-info {
  flex: 1;
}

.room-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.room-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}

.room-status.monitoring {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

.room-status.paused {
  background: rgba(255, 200, 0, 0.15);
  color: #ffc800;
}

.action-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
  font-size: 16px;
}

// Log Container
.log-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  font-size: 13px;
}

.log-time {
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Courier New', monospace;
  font-size: 11px;
  min-width: 70px;
}

.log-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.log-badge.chat { background: rgba(100, 100, 255, 0.2); color: #9999ff; }
.log-badge.price { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.log-badge.logistics { background: rgba(255, 200, 0, 0.2); color: #ffc800; }
.log-badge.aftersale { background: rgba(255, 100, 100, 0.2); color: #ff6464; }

.log-content {
  flex: 1;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-user {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.log-status {
  width: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
}

.log-status.sent {
  color: #00ff88;
}

.empty-logs {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
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

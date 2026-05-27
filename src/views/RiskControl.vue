<template>
  <div class="risk-page">
    <!-- Animated Background -->
    <div class="bg-animation">
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
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
      </el-aside>

      <!-- Main Content -->
      <el-container class="main-container">
        <el-header class="glass-header">
          <div class="header-left">
            <h2 class="page-title">
              <span class="title-highlight">Risk</span>
              <span class="title-sub">Control</span>
              <span class="title-divider"></span>
            </h2>
          </div>
          <div class="header-right">
            <el-button type="primary" class="tech-btn-glow" @click="saveSettings">
              <el-icon><Select /></el-icon>
              保存设置
            </el-button>
          </div>
        </el-header>

        <el-main class="main-content">
          <!-- Risk Stats Cards -->
          <el-row :gutter="20" class="stats-row">
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow blue"></div>
                <div class="stat-icon shield">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ settings.min_delay }}-{{ settings.max_delay }}</div>
                  <div class="stat-label">Delay Range (ms)</div>
                </div>
                <div class="stat-badge">真人模拟</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow orange"></div>
                <div class="stat-icon speed">
                  <el-icon><Odometer /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ settings.max_per_minute }}</div>
                  <div class="stat-label">Max / Minute</div>
                </div>
                <div class="stat-badge warning">频率限制</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow" :class="settings.random_delay_enabled ? 'green' : 'red'"></div>
                <div class="stat-icon random">
                  <el-icon><Switch /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ settings.random_delay_enabled ? 'ON' : 'OFF' }}</div>
                  <div class="stat-label">Random Delay</div>
                </div>
                <div class="stat-badge" :class="settings.random_delay_enabled ? 'success' : 'danger'">
                  {{ settings.random_delay_enabled ? '已启用' : '已禁用' }}
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow" :class="settings.sensitive_filter_enabled ? 'purple' : 'gray'"></div>
                <div class="stat-icon filter">
                  <el-icon><Filter /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ sensitiveWords.length }}</div>
                  <div class="stat-label">Sensitive Words</div>
                </div>
                <div class="stat-badge" :class="settings.sensitive_filter_enabled ? 'success' : 'danger'">
                  {{ settings.sensitive_filter_enabled ? '过滤中' : '已关闭' }}
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- Global Settings -->
          <el-row :gutter="20" class="section-row">
            <el-col :xs="24" :lg="12">
              <div class="tech-card">
                <div class="card-header">
                  <div class="header-title">
                    <el-icon class="header-icon blue"><Timer /></el-icon>
                    <span>真人模拟设置</span>
                  </div>
                </div>
                <div class="card-body">
                  <el-form label-position="top" class="tech-form">
                    <el-form-item label="最小回复延迟 (ms)">
                      <el-slider 
                        v-model="settings.min_delay" 
                        :min="500" 
                        :max="5000" 
                        :step="100"
                        show-input
                        :input-size="'small'"
                      />
                    </el-form-item>
                    <el-form-item label="最大回复延迟 (ms)">
                      <el-slider 
                        v-model="settings.max_delay" 
                        :min="1000" 
                        :max="10000" 
                        :step="100"
                        show-input
                        :input-size="'small'"
                      />
                    </el-form-item>
                    <el-form-item label="每分钟最大回复数">
                      <el-slider 
                        v-model="settings.max_per_minute" 
                        :min="5" 
                        :max="60" 
                        :step="1"
                        show-input
                        :input-size="'small'"
                      />
                    </el-form-item>
                    <el-form-item label="随机延迟">
                      <el-switch 
                        v-model="settings.random_delay_enabled"
                        active-text="启用"
                        inactive-text="禁用"
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :lg="12">
              <div class="tech-card">
                <div class="card-header">
                  <div class="header-title">
                    <el-icon class="header-icon red"><Filter /></el-icon>
                    <span>违禁词过滤</span>
                  </div>
                  <el-switch 
                    v-model="settings.sensitive_filter_enabled"
                    size="small"
                  />
                </div>
                <div class="card-body">
                  <div class="sensitive-tags">
                    <el-tag
                      v-for="word in sensitiveWords"
                      :key="word.id"
                      closable
                      @close="removeWord(word.id)"
                      :type="'danger'"
                      class="sensitive-tag"
                    >
                      {{ word.word }}
                    </el-tag>
                    <span v-if="sensitiveWords.length === 0" class="empty-text">暂无违禁词</span>
                  </div>
                  <div class="add-word-form">
                    <el-input
                      v-model="newWord"
                      placeholder="输入违禁词"
                      class="tech-input"
                      @keyup.enter="addWord"
                    >
                      <template #prefix>
                        <el-icon><Edit /></el-icon>
                      </template>
                    </el-input>
                    <el-button type="primary" class="tech-btn" @click="addWord">
                      <el-icon><Plus /></el-icon>
                      添加
                    </el-button>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- Platform Risk Config -->
          <div class="tech-card full-width">
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon purple"><Platform /></el-icon>
                <span>平台风控策略</span>
              </div>
              <el-tag type="info" effect="dark">差异化配置</el-tag>
            </div>
            <div class="card-body">
              <el-table 
                :data="platformRisks" 
                stripe 
                class="tech-table"
                :header-cell-style="{ background: 'rgba(64, 158, 255, 0.1)', color: '#fff' }"
              >
                <el-table-column prop="name" label="平台" width="150">
                  <template #default="{ row }">
                    <div class="platform-cell">
                      <span class="platform-icon">{{ getPlatformIcon(row.platform_code) }}</span>
                      <span>{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="最小延迟" width="180">
                  <template #default="{ row }">
                    <el-input-number 
                      v-model="row.min_delay" 
                      :min="500" 
                      :max="5000" 
                      :step="100" 
                      size="small"
                      controls-position="right"
                    />
                    <span class="unit-label">ms</span>
                  </template>
                </el-table-column>
                <el-table-column label="最大延迟" width="180">
                  <template #default="{ row }">
                    <el-input-number 
                      v-model="row.max_delay" 
                      :min="1000" 
                      :max="10000" 
                      :step="100" 
                      size="small"
                      controls-position="right"
                    />
                    <span class="unit-label">ms</span>
                  </template>
                </el-table-column>
                <el-table-column label="每分钟限制" width="150">
                  <template #default="{ row }">
                    <el-input-number 
                      v-model="row.max_per_minute" 
                      :min="5" 
                      :max="60" 
                      size="small"
                      controls-position="right"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="随机延迟" width="120">
                  <template #default="{ row }">
                    <el-switch 
                      v-model="row.random_delay_enabled"
                      :active-value="1"
                      :inactive-value="0"
                      size="small"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="敏感词过滤" width="120">
                  <template #default="{ row }">
                    <el-switch 
                      v-model="row.sensitive_filter_enabled"
                      :active-value="1"
                      :inactive-value="0"
                      size="small"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="savePlatformRisk(row)">
                      <el-icon><Select /></el-icon>
                      保存
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- Frequency Control -->
          <div class="tech-card full-width">
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon green"><Connection /></el-icon>
                <span>实时频率监控</span>
              </div>
            </div>
            <div class="card-body">
              <el-row :gutter="20">
                <el-col :xs="24" :sm="8">
                  <div class="control-item">
                    <span class="control-label">选择房间</span>
                    <el-select v-model="selectedRoom" placeholder="选择房间" class="tech-select">
                      <el-option 
                        v-for="room in rooms" 
                        :key="room.id" 
                        :label="room.name" 
                        :value="room.id" 
                      />
                    </el-select>
                  </div>
                </el-col>
                <el-col :xs="24" :sm="8">
                  <div class="control-item">
                    <span class="control-label">剩余额度</span>
                    <div class="quota-display" v-if="rateLimitStats">
                      <span class="quota-value">{{ rateLimitStats.remaining }}</span>
                      <span class="quota-divider">/</span>
                      <span class="quota-total">{{ rateLimitStats.count }}</span>
                    </div>
                    <div class="quota-display" v-else>
                      <span class="quota-empty">--</span>
                    </div>
                  </div>
                </el-col>
                <el-col :xs="24" :sm="8">
                  <div class="control-item">
                    <span class="control-label">使用率</span>
                    <el-progress 
                      :percentage="getUsagePercent()" 
                      :stroke-width="8"
                      :color="getUsageColor()"
                      class="usage-progress"
                    />
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const settings = reactive({
  min_delay: 1000,
  max_delay: 3000,
  max_per_minute: 20,
  random_delay_enabled: true,
  sensitive_filter_enabled: true
})

const sensitiveWords = ref<{ id: string; word: string }[]>([])
const newWord = ref('')
const rooms = ref<{ id: string; name: string }[]>([])
const selectedRoom = ref('')
const rateLimitStats = ref<{ count: number; remaining: number } | null>(null)
const platformRisks = ref<any[]>([])

function getPlatformIcon(code: string): string {
  const icons: Record<string, string> = {
    'taobao': '🛒',
    'pinduoduo': '🎁',
    'douyin': '🎵',
    'video_we': '📺'
  }
  return icons[code] || '🌐'
}

function getUsagePercent(): number {
  if (!rateLimitStats.value) return 0
  const used = rateLimitStats.value.count - rateLimitStats.value.remaining
  return Math.round((used / rateLimitStats.value.count) * 100)
}

function getUsageColor(): string {
  const percent = getUsagePercent()
  if (percent < 50) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

async function loadSettings() {
  const all = await window.windv.settings.getAll()
  settings.min_delay = parseInt(all.min_delay) || 1000
  settings.max_delay = parseInt(all.max_delay) || 3000
  settings.max_per_minute = parseInt(all.max_per_minute) || 20
  settings.random_delay_enabled = all.random_delay_enabled === 'true'
  settings.sensitive_filter_enabled = all.sensitive_filter_enabled !== 'false'
}

async function saveSettings() {
  try {
    await window.windv.settings.set('min_delay', settings.min_delay.toString())
    await window.windv.settings.set('max_delay', settings.max_delay.toString())
    await window.windv.settings.set('max_per_minute', settings.max_per_minute.toString())
    await window.windv.settings.set('random_delay_enabled', settings.random_delay_enabled.toString())
    await window.windv.settings.set('sensitive_filter_enabled', settings.sensitive_filter_enabled.toString())
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

function addWord() {
  if (!newWord.value.trim()) {
    ElMessage.warning('请输入违禁词')
    return
  }
  
  const exists = sensitiveWords.value.some(w => w.word === newWord.value.trim())
  if (exists) {
    ElMessage.warning('该违禁词已存在')
    return
  }
  
  const newWordObj = { id: Date.now().toString(), word: newWord.value.trim() }
  sensitiveWords.value.push(newWordObj)
  
  saveSensitiveWords()
  newWord.value = ''
  ElMessage.success('违禁词已添加')
}

function removeWord(id: string) {
  sensitiveWords.value = sensitiveWords.value.filter(w => w.id !== id)
  saveSensitiveWords()
  ElMessage.success('违禁词已删除')
}

async function saveSensitiveWords() {
  const words = sensitiveWords.value.map(w => w.word)
  await window.windv.settings.set('sensitive_words', JSON.stringify(words))
}

async function loadSensitiveWords() {
  const saved = await window.windv.settings.get('sensitive_words')
  if (saved) {
    try {
      const words = JSON.parse(saved)
      sensitiveWords.value = words.map((word: string, index: number) => ({ 
        id: (index + 1).toString(), 
        word 
      }))
    } catch {
      sensitiveWords.value = []
    }
  }
}

async function loadRooms() {
  rooms.value = await window.windv.room.list()
}

async function loadPlatformRisks() {
  try {
    platformRisks.value = await (window.windv as any).platformRisk?.list?.() || []
  } catch (error) {
    console.error('加载平台风控配置失败', error)
  }
}

async function savePlatformRisk(row: any) {
  try {
    await (window.windv as any).platformRisk?.update?.(row.platform_code, {
      min_delay: row.min_delay,
      max_delay: row.max_delay,
      max_per_minute: row.max_per_minute,
      random_delay_enabled: row.random_delay_enabled === 1,
      sensitive_filter_enabled: row.sensitive_filter_enabled === 1
    })
    ElMessage.success('平台风控配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadSettings()
  loadSensitiveWords()
  loadRooms()
  loadPlatformRisks()
})
</script>

<style lang="scss" scoped>
.risk-page {
  height: 100vh;
  background-color: #0a0a14;
  position: relative;
  overflow: hidden;
}

.bg-animation {
  position: absolute;
  inset: 0;
  z-index: 0;
  .bg-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }
  .bg-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.3;
    animation: float 10s ease-in-out infinite;
    &.bg-glow-1 {
      width: 400px;
      height: 400px;
      background: #409eff;
      top: -100px;
      right: -100px;
    }
    &.bg-glow-2 {
      width: 300px;
      height: 300px;
      background: #67c23a;
      bottom: -50px;
      left: 20%;
      animation-delay: -5s;
    }
  }
}

@keyframes gridMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(50px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

.glass-sidebar {
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 26, 0.98) 100%) !important;
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
}

.logo-container {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  .logo-glow {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #00d4ff, #0072ff);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    .logo-img { width: 28px; height: 28px; }
  }
  .logo-text {
    display: flex;
    flex-direction: column;
    .brand { color: #fff; font-size: 16px; font-weight: 600; }
    .tagline { color: rgba(255, 255, 255, 0.5); font-size: 10px; }
  }
}

.tech-menu {
  border: none !important;
  .menu-item {
    height: 50px;
    line-height: 50px;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
    &:hover {
      background: rgba(0, 212, 255, 0.1) !important;
    }
    &.is-active {
      background: rgba(0, 212, 255, 0.15) !important;
      border-left: 3px solid #00d4ff;
    }
    .menu-icon { font-size: 18px; margin-right: 12px; }
  }
}

.main-container {
  position: relative;
  z-index: 1;
}

.glass-header {
  background: linear-gradient(180deg, rgba(22, 33, 62, 0.9) 0%, rgba(15, 15, 26, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 70px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  .title-highlight { color: #fff; font-size: 24px; font-weight: 600; }
  .title-sub { color: rgba(255, 255, 255, 0.5); font-size: 18px; }
  .title-divider {
    width: 4px;
    height: 24px;
    background: linear-gradient(180deg, #00d4ff, #0072ff);
    border-radius: 2px;
  }
}

.header-right { display: flex; align-items: center; gap: 16px; }

.tech-btn-glow {
  background: linear-gradient(135deg, #00d4ff, #0072ff) !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
  &:hover { box-shadow: 0 6px 20px rgba(0, 212, 255, 0.5); transform: translateY(-2px); }
}

.main-content {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.stats-row { margin-bottom: 24px; }

.stat-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(15, 15, 26, 0.95) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  &:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); }
  .stat-glow {
    position: absolute;
    top: -50px;
    right: -50px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.3;
    &.blue { background: #409eff; }
    &.orange { background: #e6a23c; }
    &.green { background: #67c23a; }
    &.red { background: #f56c6c; }
    &.purple { background: #9c27b0; }
    &.gray { background: #666; }
  }
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
    &.shield { background: rgba(64, 158, 255, 0.2); color: #409eff; }
    &.speed { background: rgba(230, 162, 60, 0.2); color: #e6a23c; }
    &.random { background: rgba(103, 194, 58, 0.2); color: #67c23a; }
    &.filter { background: rgba(156, 39, 176, 0.2); color: #9c27b0; }
  }
  .stat-info {
    .stat-value { color: #fff; font-size: 28px; font-weight: 700; }
    .stat-label { color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-top: 4px; }
  }
  .stat-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    background: rgba(64, 158, 255, 0.2);
    color: #409eff;
    &.success { background: rgba(103, 194, 58, 0.2); color: #67c23a; }
    &.danger { background: rgba(245, 108, 108, 0.2); color: #f56c6c; }
    &.warning { background: rgba(230, 162, 60, 0.2); color: #e6a23c; }
  }
}

.section-row { margin-bottom: 24px; }

.tech-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(15, 15, 26, 0.95) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  &.full-width { width: 100%; margin-bottom: 24px; }
  
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.2);
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
      font-size: 16px;
      font-weight: 500;
      .header-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        &.blue { background: rgba(64, 158, 255, 0.2); color: #409eff; }
        &.red { background: rgba(245, 108, 108, 0.2); color: #f56c6c; }
        &.purple { background: rgba(156, 39, 176, 0.2); color: #9c27b0; }
        &.green { background: rgba(103, 194, 58, 0.2); color: #67c23a; }
      }
    }
  }
  
  .card-body { padding: 20px; }
}

.tech-form {
  :deep(.el-form-item__label) {
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    margin-bottom: 8px;
  }
  :deep(.el-slider__runway) {
    background: rgba(255, 255, 255, 0.1);
  }
  :deep(.el-slider__bar) {
    background: linear-gradient(90deg, #00d4ff, #0072ff);
  }
  :deep(.el-switch) {
    --el-switch-on-color: #00d4ff;
  }
}

.sensitive-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 60px;
  .sensitive-tag {
    background: rgba(245, 108, 108, 0.15);
    border-color: rgba(245, 108, 108, 0.3);
    color: #f56c6c;
  }
  .empty-text {
    color: rgba(255, 255, 255, 0.3);
    font-size: 14px;
  }
}

.add-word-form {
  display: flex;
  gap: 12px;
  .tech-input {
    flex: 1;
    :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: none;
      &:hover, &:focus-within {
        border-color: rgba(0, 212, 255, 0.5);
      }
    }
    :deep(.el-input__inner) { color: #fff; }
  }
  .tech-btn {
    background: linear-gradient(135deg, #00d4ff, #0072ff);
    border: none;
  }
}

.tech-table {
  background: transparent;
  :deep(.el-table__body-wrapper) {
    tr:hover > td {
      background: rgba(0, 212, 255, 0.05) !important;
    }
  }
  :deep(td) {
    border-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }
}

.platform-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  .platform-icon { font-size: 18px; }
}

.unit-label {
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

.control-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  .control-label {
    display: block;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin-bottom: 12px;
  }
}

.tech-select {
  width: 100%;
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
  :deep(.el-input__inner) { color: #fff; }
}

.quota-display {
  font-size: 28px;
  font-weight: 600;
  .quota-value { color: #00d4ff; }
  .quota-divider { color: rgba(255, 255, 255, 0.3); margin: 0 4px; }
  .quota-total { color: rgba(255, 255, 255, 0.5); }
  .quota-empty { color: rgba(255, 255, 255, 0.3); }
}

.usage-progress {
  :deep(.el-progress__text) { color: #fff; }
}
</style>

<template>
  <div class="license-page">
    <!-- Background Animation -->
    <div class="bg-animation">
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
    </div>

    <!-- Sidebar -->
    <el-aside width="220px" class="sidebar">
      <div class="logo-container">
        <div class="logo-glow"></div>
        <div class="logo-icon">🦊</div>
        <div class="logo-text">WindV</div>
      </div>
      
      <el-menu
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
        <el-menu-item index="/license" class="menu-item active">
          <el-icon class="menu-icon"><Key /></el-icon>
          <span>授权激活</span>
        </el-menu-item>
      </el-menu>

      <!-- System Status -->
      <div class="system-status">
        <div class="status-item">
          <div class="status-dot" :class="{ active: isActivated }"></div>
          <span>{{ isActivated ? '已激活' : '未激活' }}</span>
        </div>
        <div class="version">v1.0.0</div>
      </div>
    </el-aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">授权激活</h2>
          <p class="page-desc">输入授权码激活软件，解锁全部功能</p>
        </div>
      </div>

      <!-- License Card -->
      <div class="license-card">
        <div class="card-header">
          <div class="header-icon">🔑</div>
          <div class="header-title">软件授权</div>
        </div>
        <div class="card-body">
          <!-- Current Status -->
          <div class="status-panel" :class="statusClass">
            <div class="status-icon">{{ statusIcon }}</div>
            <div class="status-info">
              <div class="status-title">{{ statusTitle }}</div>
              <div class="status-desc">{{ statusDesc }}</div>
            </div>
          </div>

          <!-- License Form -->
          <div class="license-form">
            <div class="form-item">
              <label class="form-label">授权码</label>
              <el-input
                v-model="licenseKey"
                placeholder="请输入授权码"
                size="large"
                :disabled="isActivated"
                class="license-input"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
              <div class="form-hint">授权码格式：XXXXX-XXXXX-XXXXX-XXXXX</div>
            </div>

            <div class="form-actions">
              <el-button
                type="primary"
                size="large"
                :loading="activating"
                :disabled="!licenseKey || isActivated"
                class="tech-btn activate-btn"
                @click="activateLicense"
              >
                {{ isActivated ? '已激活' : '激活授权' }}
              </el-button>
              <el-button
                size="large"
                :disabled="!isActivated"
                class="tech-btn secondary-btn"
                @click="checkLicense"
              >
                验证授权
              </el-button>
            </div>
          </div>

          <!-- License Info -->
          <div class="license-info" v-if="licenseInfo">
            <div class="info-row">
              <span class="info-label">授权类型：</span>
              <span class="info-value">{{ licenseInfo.type || '试用版' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">设备ID：</span>
              <span class="info-value device-id">{{ licenseInfo.deviceId || deviceId }}</span>
            </div>
            <div class="info-row" v-if="licenseInfo.expireDate">
              <span class="info-label">到期时间：</span>
              <span class="info-value">{{ licenseInfo.expireDate }}</span>
            </div>
            <div class="info-row" v-if="licenseInfo.features">
              <span class="info-label">功能权限：</span>
              <span class="info-value">{{ licenseInfo.features }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="features-card">
        <div class="card-header">
          <div class="header-icon">✨</div>
          <div class="header-title">授权功能</div>
        </div>
        <div class="card-body">
          <div class="features-grid">
            <div class="feature-item" v-for="(f, i) in features" :key="i" :style="{ animationDelay: `${i * 0.1}s` }">
              <div class="feature-icon">{{ f.icon }}</div>
              <div class="feature-info">
                <div class="feature-name">{{ f.name }}</div>
                <div class="feature-desc">{{ f.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trial Notice -->
      <div class="trial-card" v-if="!isActivated">
        <div class="card-header">
          <div class="header-icon">📋</div>
          <div class="header-title">试用说明</div>
        </div>
        <div class="card-body">
          <ul class="trial-list">
            <li>未激活软件可正常使用基础功能</li>
            <li>高级功能（云端同步、AI智能回复、数据导出）需要激活后使用</li>
            <li>如有授权码，请联系管理员获取</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// Icons are globally registered in main.ts
import { ElMessage } from 'element-plus'

// 状态
const licenseKey = ref('')
const activating = ref(false)
const isActivated = ref(false)
const deviceId = ref<string>('')
const licenseInfo = ref<any>(null)

// API 地址（从设置中获取或使用默认值）
const API_BASE = 'http://sq.kxkj.ltd/api'

// 计算状态样式
const statusClass = computed(() => ({
  active: isActivated.value,
  inactive: !isActivated.value
}))

const statusIcon = computed(() => isActivated.value ? '✅' : '⚠️')
const statusTitle = computed(() => isActivated.value ? '已激活' : '未激活')
const statusDesc = computed(() => 
  isActivated.value ? '软件已激活，所有功能可用' : '请输入授权码激活软件'
)

// 功能列表
const features = [
  { icon: '🎯', name: '精准话术匹配', desc: '智能关键词匹配，自动回复弹幕' },
  { icon: '📊', name: '多平台支持', desc: '淘宝/抖音/拼多多/视频号等' },
  { icon: '☁️', name: '云端同步', desc: '话术库云端备份，多设备同步' },
  { icon: '🤖', name: 'AI智能回复', desc: '大模型驱动的智能对话' },
  { icon: '📱', name: '实时监控', desc: '弹幕实时监控，数据统计' },
  { icon: '🛡️', name: '风控管理', desc: '多维度风控策略，防封禁' }
]

// 获取设备ID
const getDeviceId = async () => {
  try {
    if (window.windv?.license) {
      const id = await window.windv.license.getDeviceId()
      deviceId.value = id || 'UNKNOWN' as string
    } else {
      deviceId.value = 'DEMO-DEVICE-ID-' + Date.now().toString(36).toUpperCase()
    }
  } catch (e) {
    deviceId.value = 'DEMO-DEVICE-ID-' + Date.now().toString(36).toUpperCase()
  }
}

// 验证授权
const checkLicense = async () => {
  try {
    if (window.windv?.license) {
      const result = await window.windv.license.check()
      if (result.valid) {
        isActivated.value = true
        licenseInfo.value = result
        ElMessage.success('授权验证成功')
      } else {
        isActivated.value = false
        licenseInfo.value = null
        ElMessage.warning('授权已过期或无效')
      }
    } else {
      ElMessage.warning('授权模块不可用')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '验证失败')
  }
}

// 激活授权
const activateLicense = async () => {
  if (!licenseKey.value.trim()) {
    ElMessage.warning('请输入授权码')
    return
  }

  activating.value = true
  try {
    if (window.windv?.license) {
      const result = await window.windv.license.verify(licenseKey.value.trim())
      if (result.valid) {
        isActivated.value = true
        licenseInfo.value = result
        ElMessage.success('激活成功！')
      } else {
        ElMessage.error(result.error || '激活失败，授权码无效')
      }
    } else {
      // 模拟激活（演示用）
      if (licenseKey.value.length >= 15) {
        isActivated.value = true
        licenseInfo.value = {
          type: '标准版',
          deviceId: deviceId.value,
          expireDate: '2026-12-31',
          features: '全部功能'
        }
        ElMessage.success('激活成功！（演示模式）')
      } else {
        ElMessage.error('授权码格式不正确')
      }
    }
  } catch (e: any) {
    ElMessage.error(e.message || '激活失败')
  } finally {
    activating.value = false
  }
}

// 初始化
onMounted(async () => {
  await getDeviceId()
  await checkLicense()
})
</script>

<style lang="scss" scoped>
.license-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2a 100%);
  position: relative;
  display: flex;
  overflow-y: auto;
}

// Background Animation
.bg-animation {
  position: fixed;
  inset: 0;
  pointer-events: none;
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
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 30%, rgba(0, 212, 255, 0.08) 0%, transparent 50%);
  }
}

@keyframes gridMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(50px); }
}

// Sidebar
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(20, 20, 40, 0.9);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.logo-container {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  .logo-glow {
    position: absolute;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
    filter: blur(10px);
  }
  .logo-icon {
    font-size: 28px;
    filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));
  }
  .logo-text {
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #00d4ff, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.tech-menu {
  flex: 1;
  border: none;
  .menu-item {
    margin: 4px 12px;
    border-radius: 10px;
    height: 44px;
    line-height: 44px;
    transition: all 0.3s;
    &.active {
      background: rgba(0, 212, 255, 0.15) !important;
    }
    &:hover {
      background: rgba(0, 212, 255, 0.1) !important;
    }
    .menu-icon {
      margin-right: 8px;
    }
  }
}

.system-status {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 100, 100, 0.5);
    &.active {
      background: #00ff88;
      box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      animation: pulse 2s infinite;
    }
  }
  .version {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Main Content
.main-content {
  margin-left: 220px;
  flex: 1;
  padding: 32px 40px;
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
  .header-left {
    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8px;
    }
    .page-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

// Cards
.license-card, .features-card, .trial-card {
  background: rgba(30, 30, 60, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  .header-icon {
    font-size: 24px;
  }
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }
}

.card-body {
  padding: 24px;
}

// Status Panel
.status-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  &.inactive {
    background: rgba(255, 100, 100, 0.1);
    border: 1px solid rgba(255, 100, 100, 0.3);
    .status-icon { font-size: 32px; }
  }
  &.active {
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid rgba(0, 255, 136, 0.3);
    .status-icon { font-size: 32px; }
  }
  .status-info {
    .status-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }
    .status-desc {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

// License Form
.license-form {
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 16px;
  .form-label {
    display: block;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }
  .form-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 6px;
  }
}

.license-input {
  :deep(.el-input__wrapper) {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    box-shadow: none;
    &:hover, &.is-focus {
      border-color: #00d4ff;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
    }
  }
  :deep(.el-input__inner) {
    color: #fff;
    &::placeholder { color: rgba(255, 255, 255, 0.3); }
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.tech-btn {
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
  &.activate-btn {
    background: linear-gradient(135deg, #00d4ff, #7c3aed);
    border: none;
    color: #fff;
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
    }
    &:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
    }
  }
  &.secondary-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.7);
    &:hover:not(:disabled) {
      border-color: #00d4ff;
      color: #00d4ff;
    }
  }
}

// License Info
.license-info {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 16px;
  .info-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    &:last-child { border-bottom: none; }
    .info-label {
      width: 100px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
    }
    .info-value {
      font-size: 13px;
      color: #fff;
      &.device-id {
        font-family: monospace;
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
}

// Features
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s;
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
    &:hover {
      border-color: rgba(0, 212, 255, 0.3);
      transform: translateY(-2px);
    }
    .feature-icon {
      font-size: 28px;
      flex-shrink: 0;
    }
    .feature-info {
      .feature-name {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 4px;
      }
      .feature-desc {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Trial
.trial-list {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    padding: 10px 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-left: 20px;
    position: relative;
    &:last-child { border-bottom: none; }
    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #00d4ff;
    }
  }
}
</style>

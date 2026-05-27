<template>
  <div class="settings-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">系统设置</h1>
        <p class="page-description">配置系统参数和功能选项</p>
      </div>
    </div>

    <!-- 设置分类 -->
    <div class="settings-layout">
      <!-- 左侧导航 -->
      <div class="settings-nav">
        <div
          v-for="(section, index) in settingsSections"
          :key="index"
          class="nav-item"
          :class="{ active: activeSection === index }"
          @click="activeSection = index"
        >
          <span class="nav-icon" v-html="section.icon"></span>
          <span class="nav-text">{{ section.title }}</span>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="settings-content">
        <!-- 基础设置 -->
        <div class="settings-section" v-if="activeSection === 0">
          <div class="section-header">
            <h2>基础设置</h2>
            <p>配置系统基本信息和显示选项</p>
          </div>

          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">系统名称</span>
                <span class="setting-desc">显示在页面标题和登录页的品牌名称</span>
              </div>
              <div class="setting-control">
                <el-input v-model="settings.systemName" placeholder="WindV 管理后台" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">系统 Logo</span>
                <span class="setting-desc">上传显示在侧边栏的 Logo 图片</span>
              </div>
              <div class="setting-control">
                <el-upload
                  class="logo-uploader"
                  action="#"
                  :show-file-list="false"
                  :before-upload="beforeLogoUpload"
                >
                  <div class="upload-preview" v-if="settings.logoUrl">
                    <img :src="settings.logoUrl" alt="Logo" />
                  </div>
                  <div class="upload-placeholder" v-else>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>点击上传</span>
                  </div>
                </el-upload>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">主题颜色</span>
                <span class="setting-desc">设置系统的主色调</span>
              </div>
              <div class="setting-control">
                <div class="color-picker">
                  <div
                    class="color-option"
                    v-for="color in themeColors"
                    :key="color.value"
                    :style="{ background: color.value }"
                    :class="{ active: settings.themeColor === color.value }"
                    @click="settings.themeColor = color.value"
                  ></div>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">深色模式</span>
                <span class="setting-desc">开启后系统将使用深色主题</span>
              </div>
              <div class="setting-control">
                <el-switch v-model="settings.darkMode" />
              </div>
            </div>
          </div>
        </div>

        <!-- 安全设置 -->
        <div class="settings-section" v-if="activeSection === 1">
          <div class="section-header">
            <h2>安全设置</h2>
            <p>配置系统安全策略和权限管理</p>
          </div>

          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">登录验证码</span>
                <span class="setting-desc">登录时需要输入图形验证码</span>
              </div>
              <div class="setting-control">
                <el-switch v-model="settings.requireCaptcha" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">双因素认证</span>
                <span class="setting-desc">管理员登录需要手机验证码</span>
              </div>
              <div class="setting-control">
                <el-switch v-model="settings.twoFactorAuth" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">密码强度要求</span>
                <span class="setting-desc">要求密码包含大小写字母和数字</span>
              </div>
              <div class="setting-control">
                <el-switch v-model="settings.passwordStrength" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">会话超时</span>
                <span class="setting-desc">多长时间无操作后自动退出登录</span>
              </div>
              <div class="setting-control">
                <el-select v-model="settings.sessionTimeout" style="width: 200px">
                  <el-option label="30 分钟" :value="30" />
                  <el-option label="1 小时" :value="60" />
                  <el-option label="2 小时" :value="120" />
                  <el-option label="4 小时" :value="240" />
                  <el-option label="8 小时" :value="480" />
                </el-select>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">登录尝试限制</span>
                <span class="setting-desc">连续失败多少次后锁定账户</span>
              </div>
              <div class="setting-control">
                <el-input-number v-model="settings.maxLoginAttempts" :min="3" :max="10" />
              </div>
            </div>
          </div>
        </div>

        <!-- 邮件设置 -->
        <div class="settings-section" v-if="activeSection === 2">
          <div class="section-header">
            <h2>邮件设置</h2>
            <p>配置系统邮件发送和通知功能</p>
          </div>

          <div class="settings-card">
            <div class="setting-item full">
              <div class="setting-info">
                <span class="setting-label">SMTP 服务器</span>
                <span class="setting-desc">邮件发送服务器地址</span>
              </div>
              <div class="setting-control">
                <el-input v-model="settings.smtp.host" placeholder="smtp.example.com" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">SMTP 端口</span>
                <span class="setting-desc">邮件服务器端口号</span>
              </div>
              <div class="setting-control">
                <el-input v-model="settings.smtp.port" placeholder="587" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">用户名</span>
                <span class="setting-desc">邮件发送账户</span>
              </div>
              <div class="setting-control">
                <el-input v-model="settings.smtp.username" placeholder="noreply@example.com" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">密码</span>
                <span class="setting-desc">邮件发送账户密码</span>
              </div>
              <div class="setting-control">
                <el-input v-model="settings.smtp.password" type="password" show-password placeholder="请输入密码" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">发件人</span>
                <span class="setting-desc">显示在邮件中的发件人名称</span>
              </div>
              <div class="setting-control">
                <el-input v-model="settings.smtp.from" placeholder="WindV 系统 <noreply@example.com>" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">启用 SSL</span>
                <span class="setting-desc">使用 SSL/TLS 加密连接</span>
              </div>
              <div class="setting-control">
                <el-switch v-model="settings.smtp.secure" />
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-title">测试邮件发送</div>
            <div class="test-email">
              <el-input v-model="testEmail" placeholder="请输入测试邮箱地址" />
              <el-button type="primary" @click="sendTestEmail" :loading="sendingTest">
                发送测试邮件
              </el-button>
            </div>
          </div>
        </div>

        <!-- 备份设置 -->
        <div class="settings-section" v-if="activeSection === 3">
          <div class="section-header">
            <h2>备份设置</h2>
            <p>配置系统数据备份和恢复选项</p>
          </div>

          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">自动备份</span>
                <span class="setting-desc">定期自动备份系统数据</span>
              </div>
              <div class="setting-control">
                <el-switch v-model="settings.autoBackup.enabled" />
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">备份频率</span>
                <span class="setting-desc">自动备份的执行周期</span>
              </div>
              <div class="setting-control">
                <el-select v-model="settings.autoBackup.frequency" style="width: 200px">
                  <el-option label="每天" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">保留备份数</span>
                <span class="setting-desc">最多保留的历史备份数量</span>
              </div>
              <div class="setting-control">
                <el-input-number v-model="settings.autoBackup.keepCount" :min="3" :max="30" />
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-title">手动操作</div>
            <div class="backup-actions">
              <el-button type="primary" @click="createBackup" :loading="creatingBackup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                创建备份
              </el-button>
              <el-button @click="restoreBackup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                恢复备份
              </el-button>
              <el-button @click="downloadBackup">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                下载备份
              </el-button>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-title">备份历史</div>
            <div class="backup-list">
              <div class="backup-item" v-for="backup in backupHistory" :key="backup.id">
                <div class="backup-info">
                  <span class="backup-name">{{ backup.name }}</span>
                  <span class="backup-time">{{ backup.time }}</span>
                </div>
                <div class="backup-actions">
                  <el-button type="primary" link @click="restoreBackupItem(backup)">恢复</el-button>
                  <el-button type="primary" link @click="downloadBackupItem(backup)">下载</el-button>
                  <el-button type="danger" link @click="deleteBackupItem(backup)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于我们 -->
        <div class="settings-section" v-if="activeSection === 4">
          <div class="section-header">
            <h2>关于系统</h2>
            <p>查看系统信息和版本更新</p>
          </div>

          <div class="settings-card">
            <div class="about-section">
              <div class="about-logo">
                <div class="logo-glow"></div>
                <div class="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </div>
              <div class="about-info">
                <h3>{{ settings.systemName }}</h3>
                <p class="version">版本 3.0.0</p>
                <p class="description">智能直播助手 - 管理后台系统</p>
              </div>
            </div>

            <div class="about-details">
              <div class="detail-item">
                <span class="detail-label">构建时间</span>
                <span class="detail-value">2026-05-27</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">前端框架</span>
                <span class="detail-value">Vue 3 + Vite</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">UI 组件库</span>
                <span class="detail-value">Element Plus</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">后端框架</span>
                <span class="detail-value">Node.js + Express</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">数据库</span>
                <span class="detail-value">MongoDB</span>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-title">检查更新</div>
            <div class="check-update">
              <el-button type="primary" @click="checkUpdate" :loading="checkingUpdate">
                检查更新
              </el-button>
              <span class="update-hint">当前已是最新版本</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="settings-footer">
      <el-button @click="resetSettings">重置</el-button>
      <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const activeSection = ref(0)
const saving = ref(false)
const sendingTest = ref(false)
const creatingBackup = ref(false)
const checkingUpdate = ref(false)
const testEmail = ref('')

const settings = reactive({
  systemName: 'WindV 管理后台',
  logoUrl: '',
  themeColor: '#00d4ff',
  darkMode: true,
  requireCaptcha: true,
  twoFactorAuth: false,
  passwordStrength: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  smtp: {
    host: '',
    port: '587',
    username: '',
    password: '',
    from: '',
    secure: true
  },
  autoBackup: {
    enabled: true,
    frequency: 'daily',
    keepCount: 7
  }
})

const themeColors = [
  { name: '青色', value: '#00d4ff' },
  { name: '蓝色', value: '#0072ff' },
  { name: '紫色', value: '#7c3aed' },
  { name: '绿色', value: '#10b981' },
  { name: '橙色', value: '#f59e0b' },
  { name: '粉色', value: '#ec4899' }
]

const settingsSections = [
  {
    title: '基础设置',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  },
  {
    title: '安全设置',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  },
  {
    title: '邮件设置',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
  },
  {
    title: '备份设置',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
  },
  {
    title: '关于系统',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  }
]

const backupHistory = ref([
  { id: 1, name: 'backup_20260527_1200.zip', time: '2026-05-27 12:00:00' },
  { id: 2, name: 'backup_20260526_1200.zip', time: '2026-05-26 12:00:00' },
  { id: 3, name: 'backup_20260525_1200.zip', time: '2026-05-25 12:00:00' }
])

const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }

  // 预览
  const reader = new FileReader()
  reader.onload = (e) => {
    settings.logoUrl = e.target.result
  }
  reader.readAsDataURL(file)

  return false
}

const saveSettings = () => {
  saving.value = true
  setTimeout(() => {
    saving.value = false
    ElMessage.success('设置保存成功')
  }, 500)
}

const resetSettings = () => {
  ElMessage.info('已重置为默认设置')
}

const sendTestEmail = () => {
  if (!testEmail.value) {
    ElMessage.warning('请输入测试邮箱地址')
    return
  }
  sendingTest.value = true
  setTimeout(() => {
    sendingTest.value = false
    ElMessage.success('测试邮件已发送')
  }, 1000)
}

const createBackup = () => {
  creatingBackup.value = true
  setTimeout(() => {
    creatingBackup.value = false
    ElMessage.success('备份创建成功')
  }, 1500)
}

const restoreBackup = () => {
  ElMessage.info('请选择要恢复的备份文件')
}

const downloadBackup = () => {
  ElMessage.success('备份文件下载中...')
}

const restoreBackupItem = (backup) => {
  ElMessageBox.confirm(`确定要恢复备份 ${backup.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('备份恢复成功')
  }).catch(() => {})
}

const downloadBackupItem = (backup) => {
  ElMessage.success(`正在下载 ${backup.name}`)
}

const deleteBackupItem = (backup) => {
  ElMessageBox.confirm(`确定要删除备份 ${backup.name} 吗？`, '提示', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = backupHistory.value.findIndex(b => b.id === backup.id)
    if (index > -1) {
      backupHistory.value.splice(index, 1)
    }
    ElMessage.success('备份已删除')
  }).catch(() => {})
}

const checkUpdate = () => {
  checkingUpdate.value = true
  setTimeout(() => {
    checkingUpdate.value = false
    ElMessage.info('当前已是最新版本')
  }, 1000)
}
</script>

<style scoped>
.settings-page {
  padding: 24px 32px;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}

.page-description {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 14px;
}

/* 布局 */
.settings-layout {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.settings-nav {
  width: 240px;
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  flex-shrink: 0;
  height: fit-content;
  position: sticky;
  top: 24px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4px;
}

.nav-item:hover {
  background: rgba(0, 212, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(124, 58, 237, 0.1));
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

.settings-content {
  flex: 1;
}

.settings-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 6px;
}

.section-header p {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 13px;
}

.settings-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-item:first-child {
  padding-top: 0;
}

.setting-item.full {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.setting-item.full .setting-control {
  width: 100%;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  color: #fff;
  font-weight: 500;
  font-size: 14px;
}

.setting-desc {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-control :deep(.el-input) {
  width: 300px;
}

.setting-control :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.setting-control :deep(.el-input__wrapper):hover,
.setting-control :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(0, 212, 255, 0.3);
}

.setting-control :deep(.el-input__inner) {
  color: #fff;
}

/* 颜色选择器 */
.color-picker {
  display: flex;
  gap: 10px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #fff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

/* Logo 上传 */
.logo-uploader {
  cursor: pointer;
}

.upload-preview {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s;
}

.upload-placeholder:hover {
  border-color: rgba(0, 212, 255, 0.5);
  color: rgba(255, 255, 255, 0.6);
}

.upload-placeholder svg {
  width: 24px;
  height: 24px;
}

.upload-placeholder span {
  font-size: 11px;
}

/* 测试邮件 */
.test-email {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.test-email :deep(.el-input) {
  flex: 1;
}

/* 备份操作 */
.card-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.backup-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.backup-actions :deep(.el-button) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.backup-actions svg {
  width: 16px;
  height: 16px;
}

/* 备份历史 */
.backup-list {
  margin-top: 16px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  margin-bottom: 8px;
}

.backup-item:last-child {
  margin-bottom: 0;
}

.backup-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.backup-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.backup-time {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

.backup-item .backup-actions {
  display: flex;
}

/* 关于我们 */
.about-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.about-logo {
  position: relative;
}

.logo-glow {
  position: absolute;
  inset: -8px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 24px;
  opacity: 0.4;
  filter: blur(20px);
}

.about-logo .logo-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 212, 255, 0.4);
}

.about-logo .logo-icon svg {
  width: 44px;
  height: 44px;
}

.about-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}

.about-info .version {
  color: #00d4ff;
  font-size: 14px;
  margin: 0 0 4px;
}

.about-info .description {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 13px;
}

.about-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.detail-item {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}

.detail-label {
  display: block;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  margin-bottom: 4px;
}

.detail-value {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

/* 检查更新 */
.check-update {
  display: flex;
  align-items: center;
  gap: 16px;
}

.update-hint {
  color: #10b981;
  font-size: 13px;
}

/* 页脚 */
.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

@media (max-width: 1024px) {
  .settings-layout {
    flex-direction: column;
  }

  .settings-nav {
    width: 100%;
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .nav-item {
    flex: 1;
    min-width: 120px;
    justify-content: center;
    margin-bottom: 0;
  }

  .about-details {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .setting-control {
    width: 100%;
  }

  .setting-control :deep(.el-input) {
    width: 100%;
  }

  .about-details {
    grid-template-columns: 1fr;
  }
}
</style>
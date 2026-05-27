<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>⚙️ 系统设置</h1>
      <p>配置系统参数和域名设置</p>
    </div>
    
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 基础设置 -->
      <el-tab-pane label="基础设置" name="basic">
        <div class="settings-section">
          <h3>站点信息</h3>
          <el-form label-width="120px">
            <el-form-item label="站点名称">
              <el-input v-model="settings.siteName" placeholder="小狐狸 管理系统" />
            </el-form-item>
            <el-form-item label="允许注册">
              <el-switch v-model="settings.allowRegister" />
            </el-form-item>
            <el-form-item label="维护模式">
              <el-switch v-model="settings.maintenanceMode" />
              <span class="form-hint">开启后普通用户无法访问</span>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      
      <!-- 域名设置 -->
      <el-tab-pane label="域名设置" name="domain">
        <div class="settings-section">
          <h3>🌐 域名配置</h3>
          <el-form label-width="120px">
            <el-form-item label="主域名">
              <el-input v-model="domainSettings.primary" placeholder="sq.kxkj.ltd">
                <template #append>
                  <el-button @click="saveDomain">保存</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="强制HTTPS">
              <el-switch v-model="domainSettings.forceHttps" />
            </el-form-item>
          </el-form>
          
          <div v-if="domainSettings.primary" class="domain-info">
            <p>📝 DNS 配置说明：</p>
            <div class="dns-record">
              <span class="record-type">A记录</span>
              <span class="record-name">@</span>
              <span class="record-value">8.137.144.68</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- SSL 证书 -->
      <el-tab-pane label="SSL证书" name="ssl">
        <div class="settings-section">
          <h3>🔐 SSL 证书配置</h3>
          
          <div class="ssl-status">
            <el-tag :type="sslStatus.valid ? 'success' : 'danger'" size="large">
              {{ sslStatus.valid ? '✅ 证书已配置' : '❌ 证书未配置' }}
            </el-tag>
            <div v-if="sslStatus.expiryDate" class="ssl-info">
              有效期至: {{ formatDate(sslStatus.expiryDate) }}
            </div>
          </div>
          
          <div class="ssl-actions">
            <el-button type="primary" @click="showCertbotDialog = true">
              🔧 Certbot 一键申请
            </el-button>
            <el-button @click="showManualDialog = true">
              📤 手动上传证书
            </el-button>
            <el-button @click="testSSL" :loading="testing">
              🧪 测试连接
            </el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 系统信息 -->
      <el-tab-pane label="系统信息" name="info">
        <div class="settings-section">
          <h3>📊 系统状态</h3>
          <div class="info-grid" v-if="systemInfo.system">
            <div class="info-item">
              <span class="info-label">操作系统</span>
              <span class="info-value">{{ systemInfo.system.platform }} {{ systemInfo.system.arch }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Node.js 版本</span>
              <span class="info-value">{{ systemInfo.system.nodeVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行时间</span>
              <span class="info-value">{{ formatUptime(systemInfo.system.uptime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务器负载</span>
              <span class="info-value">{{ systemInfo.system.loadavg?.join(', ') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">CPU 核心数</span>
              <span class="info-value">{{ systemInfo.system.cpu }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">内存使用</span>
              <span class="info-value">{{ systemInfo.system.memory?.used }} / {{ systemInfo.system.memory?.total }}</span>
            </div>
          </div>
          
          <h3>📦 应用信息</h3>
          <div class="info-grid" v-if="systemInfo.app">
            <div class="info-item">
              <span class="info-label">应用版本</span>
              <span class="info-value">{{ systemInfo.app.version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行端口</span>
              <span class="info-value">{{ systemInfo.app.port }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行模式</span>
              <span class="info-value">{{ systemInfo.app.env }}</span>
            </div>
          </div>
          
          <div class="actions">
            <el-button type="primary" @click="fetchSystemInfo">
              <el-icon><Refresh /></el-icon>
              刷新信息
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- Certbot 对话框 -->
    <el-dialog v-model="showCertbotDialog" title="Certbot 一键申请证书" width="500px">
      <el-form label-width="100px">
        <el-form-item label="邮箱">
          <el-input v-model="certbotEmail" placeholder="your@email.com" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="agreeTos">我同意 Let's Encrypt 服务条款</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCertbotDialog = false">取消</el-button>
        <el-button type="primary" @click="applyCertbot" :loading="applying">申请证书</el-button>
      </template>
    </el-dialog>
    
    <!-- 手动上传对话框 -->
    <el-dialog v-model="showManualDialog" title="手动上传证书" width="600px">
      <el-form label-width="100px">
        <el-form-item label="证书文件">
          <el-input 
            v-model="manualCert" 
            type="textarea" 
            :rows="4"
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
          />
        </el-form-item>
        <el-form-item label="私钥文件">
          <el-input 
            v-model="manualKey" 
            type="textarea" 
            :rows="4"
            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
          />
        </el-form-item>
        <el-form-item label="过期日期">
          <el-date-picker 
            v-model="manualExpiry" 
            type="date" 
            placeholder="证书过期日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showManualDialog = false">取消</el-button>
        <el-button type="primary" @click="uploadCert" :loading="uploading">上传证书</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://sq.kxkj.ltd/api'

const activeTab = ref('basic')
const settings = ref({
  siteName: '小狐狸 管理系统',
  allowRegister: true,
  maintenanceMode: false
})

const domainSettings = ref({
  primary: 'sq.kxkj.ltd',
  forceHttps: false
})

const sslStatus = ref({
  valid: false,
  enabled: false,
  provider: 'none'
})

const systemInfo = ref({})
const testing = ref(false)
const applying = ref(false)
const uploading = ref(false)

const showCertbotDialog = ref(false)
const showManualDialog = ref(false)
const certbotEmail = ref('')
const agreeTos = ref(false)
const manualCert = ref('')
const manualKey = ref('')
const manualExpiry = ref(null)

async function fetchSettings() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.settings) {
      settings.value = { ...settings.value, ...data.settings }
    }
    if (data.settings?.domain) {
      domainSettings.value = { ...domainSettings.value, ...data.settings.domain }
    }
  } catch (err) {
    console.error('获取设置失败', err)
  }
}

async function saveDomain() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/settings/domain`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(domainSettings.value)
    })
    const data = await res.json()
    if (res.ok) {
      ElMessage.success('域名设置已保存')
    } else {
      ElMessage.error(data.error || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

async function fetchSSLStatus() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/settings/ssl`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.ssl) {
      sslStatus.value = data.ssl
    }
  } catch (err) {
    console.error('获取SSL状态失败', err)
  }
}

async function applyCertbot() {
  if (!certbotEmail.value) {
    ElMessage.warning('请输入邮箱')
    return
  }
  applying.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/settings/ssl/certbot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: certbotEmail.value, agreeTos: agreeTos.value })
    })
    const data = await res.json()
    if (res.ok) {
      ElMessage.success('证书申请成功')
      showCertbotDialog.value = false
      fetchSSLStatus()
    } else {
      ElMessage.error(data.error || '申请失败')
    }
  } catch (err) {
    ElMessage.error('申请失败')
  } finally {
    applying.value = false
  }
}

async function uploadCert() {
  if (!manualCert.value || !manualKey.value) {
    ElMessage.warning('请填写证书和私钥')
    return
  }
  uploading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/settings/ssl/manual`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        certContent: manualCert.value,
        keyContent: manualKey.value,
        expiryDate: manualExpiry.value
      })
    })
    const data = await res.json()
    if (res.ok) {
      ElMessage.success('证书上传成功')
      showManualDialog.value = false
      fetchSSLStatus()
    } else {
      ElMessage.error(data.error || '上传失败')
    }
  } catch (err) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

async function testSSL() {
  testing.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/settings/ssl/test`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('SSL 连接测试成功')
    } else {
      ElMessage.error(data.error || '测试失败')
    }
  } catch (err) {
    ElMessage.error('测试失败')
  } finally {
    testing.value = false
  }
}

async function fetchSystemInfo() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/settings/info`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    systemInfo.value = data
  } catch (err) {
    console.error('获取系统信息失败', err)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatUptime(seconds) {
  if (!seconds) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${days}天 ${hours}小时 ${mins}分钟`
}

onMounted(() => {
  fetchSettings()
  fetchSSLStatus()
  fetchSystemInfo()
})
</script>

<style scoped>
.settings-page {
  padding: 24px;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  color: #fff;
  font-size: 24px;
  margin-bottom: 8px;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.settings-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  max-width: 800px;
}

.settings-section h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-hint {
  margin-left: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.domain-info {
  margin-top: 16px;
  padding: 14px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
}

.domain-info p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
}

.dns-record {
  display: flex;
  gap: 12px;
  font-family: monospace;
  font-size: 13px;
}

.record-type {
  background: rgba(0, 212, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  color: #00d4ff;
}

.ssl-status {
  margin-bottom: 16px;
}

.ssl-info {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.ssl-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.info-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.info-value {
  color: #fff;
  font-weight: 500;
  font-size: 13px;
}

.actions {
  margin-top: 16px;
}
</style>
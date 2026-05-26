<template>
  <div class="licenses-page">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">📺</div>
          <span class="logo-text">WindV</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-text">仪表盘</span>
        </router-link>
        <router-link to="/users" class="nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-text">用户管理</span>
        </router-link>
        <router-link to="/licenses" class="nav-item active">
          <span class="nav-icon">🔑</span>
          <span class="nav-text">授权管理</span>
        </router-link>
        <router-link to="/scripts" class="nav-item">
          <span class="nav-icon">💬</span>
          <span class="nav-text">话术库</span>
        </router-link>
        <router-link to="/stats" class="nav-item">
          <span class="nav-icon">📈</span>
          <span class="nav-text">数据统计</span>
        </router-link>
        <router-link to="/settings" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">系统设置</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="page-title">
          <h1>授权管理</h1>
          <p>管理软件授权和设备绑定</p>
        </div>
        <div class="top-actions">
          <button class="action-btn secondary" @click="exportLicenses">
            📥 导出
          </button>
          <button class="action-btn primary" @click="showGenerateDialog = true">
            ➕ 生成授权
          </button>
        </div>
      </header>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon blue">🔑</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">总授权数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">✓</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.active }}</span>
            <span class="stat-label">有效授权</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">⏰</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.expiring }}</span>
            <span class="stat-label">即将过期</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">✕</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.expired }}</span>
            <span class="stat-label">已过期</span>
          </div>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="search-box">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="搜索授权码/设备ID..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
        <div class="filter-group">
          <select v-model="filterType" class="filter-select">
            <option value="">全部类型</option>
            <option value="admin">管理员</option>
            <option value="standard">标准版</option>
            <option value="trial">试用版</option>
          </select>
          <select v-model="filterStatus" class="filter-select">
            <option value="">全部状态</option>
            <option value="active">有效</option>
            <option value="expiring">即将过期</option>
            <option value="expired">已过期</option>
          </select>
        </div>
      </div>

      <!-- 授权列表 -->
      <div class="licenses-table">
        <table>
          <thead>
            <tr>
              <th>授权码</th>
              <th>类型</th>
              <th>设备信息</th>
              <th>到期时间</th>
              <th>功能</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="license in filteredLicenses" :key="license._id">
              <td class="license-code">
                <code>{{ license.licenseCode }}</code>
                <button class="copy-btn" @click="copyCode(license.licenseCode)">📋</button>
              </td>
              <td>
                <span class="type-badge" :class="license.type">
                  {{ typeLabels[license.type] }}
                </span>
              </td>
              <td>
                <div class="device-info">
                  <span class="device-id">{{ license.deviceId || '未绑定' }}</span>
                  <span class="device-name">{{ license.deviceName || '-' }}</span>
                </div>
              </td>
              <td>
                <div class="expiry-info">
                  <span>{{ formatDate(license.expiryDate) }}</span>
                  <span class="days-left" :class="getDaysLeftClass(license)">
                    {{ getDaysLeft(license) }}天后
                  </span>
                </div>
              </td>
              <td>
                <div class="features">
                  <span v-for="f in license.features.slice(0, 2)" :key="f" class="feature-tag">
                    {{ featureLabels[f] || f }}
                  </span>
                  <span v-if="license.features.length > 2" class="feature-more">
                    +{{ license.features.length - 2 }}
                  </span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(license)">
                  {{ getStatus(license) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="action-icon" title="续期" @click="renewLicense(license)">🔄</button>
                  <button class="action-icon danger" title="撤销" @click="revokeLicense(license)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <span class="total">共 {{ total }} 条</span>
        <div class="page-btns">
          <button :disabled="page === 1" @click="page--">‹</button>
          <span class="current">{{ page }} / {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="page++">›</button>
        </div>
      </div>
    </main>

    <!-- 生成授权对话框 -->
    <div v-if="showGenerateDialog" class="dialog-overlay" @click.self="showGenerateDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>生成授权</h3>
          <button class="close-btn" @click="showGenerateDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>授权类型</label>
            <select v-model="generateForm.type" class="form-select">
              <option value="standard">标准版</option>
              <option value="trial">试用版 (7天)</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-group">
            <label>设备ID</label>
            <input v-model="generateForm.deviceId" type="text" class="form-input" placeholder="留空则不绑定设备" />
          </div>
          <div class="form-group">
            <label>设备名称</label>
            <input v-model="generateForm.deviceName" type="text" class="form-input" placeholder="如: 张三的电脑" />
          </div>
          <div class="form-group">
            <label>授权天数</label>
            <input v-model.number="generateForm.expiryDays" type="number" class="form-input" min="1" max="3650" />
          </div>
          <div class="form-group">
            <label>授权功能</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" v-model="generateForm.features" value="basic" />
                <span>基础功能</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="generateForm.features" value="sync" />
                <span>话术同步</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="generateForm.features" value="stats" />
                <span>数据统计</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="generateForm.features" value="cloud_backup" />
                <span>云端备份</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="generateForm.features" value="ai_llm" />
                <span>AI大模型</span>
              </label>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn secondary" @click="showGenerateDialog = false">取消</button>
          <button class="btn primary" @click="handleGenerate">生成</button>
        </div>
      </div>
    </div>

    <!-- 生成结果对话框 -->
    <div v-if="showResultDialog" class="dialog-overlay" @click.self="showResultDialog = false">
      <div class="dialog result-dialog">
        <div class="dialog-header">
          <h3>✅ 授权生成成功</h3>
          <button class="close-btn" @click="showResultDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <div class="result-code">
            <span class="code-label">授权码</span>
            <div class="code-box">
              <code>{{ generatedLicense?.licenseCode }}</code>
              <button class="copy-btn" @click="copyCode(generatedLicense?.licenseCode)">📋 复制</button>
            </div>
          </div>
          <div class="result-info">
            <div class="info-row">
              <span class="label">类型</span>
              <span class="value">{{ typeLabels[generatedLicense?.type] }}</span>
            </div>
            <div class="info-row">
              <span class="label">到期时间</span>
              <span class="value">{{ formatDate(generatedLicense?.expiryDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">功能</span>
              <span class="value">{{ generatedLicense?.features?.join(', ') }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn primary" @click="showResultDialog = false">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = 10

const showGenerateDialog = ref(false)
const showResultDialog = ref(false)
const generatedLicense = ref(null)

const generateForm = ref({
  type: 'standard',
  deviceId: '',
  deviceName: '',
  expiryDays: 365,
  features: ['basic', 'sync', 'stats'],
})

const licenses = ref([])

const stats = computed(() => ({
  total: licenses.value.length,
  active: licenses.value.filter(l => new Date(l.expiryDate) > new Date() && l.isActive).length,
  expiring: licenses.value.filter(l => {
    const days = (new Date(l.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    return days > 0 && days <= 7
  }).length,
  expired: licenses.value.filter(l => new Date(l.expiryDate) < new Date()).length,
}))

const total = computed(() => filteredLicenses.value.length)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

const filteredLicenses = computed(() => {
  return licenses.value.filter(l => {
    if (searchQuery.value && !l.licenseCode.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    if (filterType.value && l.type !== filterType.value) {
      return false
    }
    if (filterStatus.value) {
      const status = getStatus(l)
      if (filterStatus.value === 'active' && status !== '有效') return false
      if (filterStatus.value === 'expiring' && status !== '即将过期') return false
      if (filterStatus.value === 'expired' && status !== '已过期') return false
    }
    return true
  })
})

const typeLabels = { admin: '管理员', standard: '标准版', trial: '试用版' }
const featureLabels = {
  basic: '基础', sync: '同步', stats: '统计', 
  cloud_backup: '备份', ai_llm: 'AI', all: '全部',
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const getDaysLeft = (license) => {
  const days = Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

const getDaysLeftClass = (license) => {
  const days = getDaysLeft(license)
  if (days <= 0) return 'expired'
  if (days <= 7) return 'expiring'
  return ''
}

const getStatus = (license) => {
  if (!license.isActive) return '已撤销'
  const days = getDaysLeft(license)
  if (days <= 0) return '已过期'
  if (days <= 7) return '即将过期'
  return '有效'
}

const getStatusClass = (license) => {
  const status = getStatus(license)
  if (status === '有效') return 'success'
  if (status === '即将过期') return 'warning'
  return 'danger'
}

const copyCode = async (code) => {
  await navigator.clipboard.writeText(code)
  ElMessage.success('已复制到剪贴板')
}

const handleGenerate = async () => {
  try {
    const res = await fetch('/api/license/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(generateForm.value),
    })
    const data = await res.json()
    
    if (data.licenseCode) {
      generatedLicense.value = data
      showGenerateDialog.value = false
      showResultDialog.value = true
      await loadLicenses()
    } else {
      ElMessage.error(data.error || '生成失败')
    }
  } catch (error) {
    ElMessage.error('生成失败')
  }
}

const renewLicense = (license) => {
  generateForm.value = {
    type: license.type,
    deviceId: license.deviceId,
    deviceName: license.deviceName,
    expiryDays: 365,
    features: [...license.features],
  }
  showGenerateDialog.value = true
}

const revokeLicense = async (license) => {
  if (!confirm('确定要撤销该授权吗？')) return
  
  try {
    const res = await fetch(`/api/license/${license._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    if (res.ok) {
      ElMessage.success('已撤销授权')
      await loadLicenses()
    }
  } catch (error) {
    ElMessage.error('撤销失败')
  }
}

const exportLicenses = () => {
  const csv = [
    ['授权码', '类型', '设备ID', '到期时间', '状态'],
    ...licenses.value.map(l => [
      l.licenseCode,
      typeLabels[l.type],
      l.deviceId || '',
      formatDate(l.expiryDate),
      getStatus(l),
    ])
  ].map(r => r.join(',')).join('\n')
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `licenses_${Date.now()}.csv`
  a.click()
}

const loadLicenses = async () => {
  try {
    const res = await fetch('/api/license/list', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
    const data = await res.json()
    if (data.licenses) {
      licenses.value = data.licenses
    }
  } catch (error) {
    console.error('加载授权列表失败:', error)
  }
}

onMounted(() => {
  loadLicenses()
})
</script>

<style scoped>
/* 复用 Dashboard 的样式 ... */
/* 授权页面特定样式 */
.licenses-page { display: flex; min-height: 100vh; background: #0a0a1a; }
.sidebar { width: 260px; background: rgba(20,20,40,0.95); border-right: 1px solid rgba(255,255,255,0.05); position: fixed; top: 0; left: 0; bottom: 0; display: flex; flex-direction: column; }
.sidebar-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.logo { display: flex; align-items: center; gap: 12px; }
.logo-icon { font-size: 28px; }
.logo-text { font-size: 24px; font-weight: 700; background: linear-gradient(135deg,#fff,#00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sidebar-nav { flex: 1; padding: 16px 12px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 4px; transition: all 0.3s; }
.nav-item:hover { background: rgba(0,212,255,0.1); color: #fff; }
.nav-item.active { background: linear-gradient(135deg,rgba(0,212,255,0.2),rgba(124,58,237,0.1)); color: #00d4ff; border: 1px solid rgba(0,212,255,0.3); }
.nav-icon { font-size: 18px; }
.nav-text { font-size: 15px; font-weight: 500; }
.main-content { flex: 1; margin-left: 260px; padding: 24px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.page-title h1 { font-size: 28px; font-weight: 600; color: #fff; margin: 0 0 4px; }
.page-title p { color: rgba(255,255,255,0.5); margin: 0; }
.top-actions { display: flex; gap: 12px; }
.action-btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.action-btn.secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
.action-btn.primary { background: linear-gradient(135deg,#00d4ff,#7c3aed); border: none; color: white; box-shadow: 0 4px 15px rgba(0,212,255,0.3); }
.stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { background: rgba(30,30,60,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.stat-icon.blue { background: rgba(0,212,255,0.2); }
.stat-icon.purple { background: rgba(124,58,237,0.2); }
.stat-icon.orange { background: rgba(251,146,60,0.2); }
.stat-icon.red { background: rgba(239,68,68,0.2); }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 28px; font-weight: 700; color: #fff; }
.stat-label { color: rgba(255,255,255,0.5); font-size: 14px; }
.filter-bar { display: flex; gap: 16px; margin-bottom: 20px; }
.search-box { flex: 1; position: relative; }
.search-input { width: 100%; padding: 12px 16px 12px 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 14px; }
.search-input:focus { outline: none; border-color: #00d4ff; }
.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); }
.filter-group { display: flex; gap: 12px; }
.filter-select { padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 14px; cursor: pointer; }
.licenses-table { background: rgba(30,30,60,0.6); border-radius: 16px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 16px 20px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
th { background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.6); font-weight: 500; font-size: 13px; text-transform: uppercase; }
td { color: rgba(255,255,255,0.8); font-size: 14px; }
tr:hover { background: rgba(255,255,255,0.02); }
.license-code code { background: rgba(0,212,255,0.1); padding: 4px 8px; border-radius: 4px; color: #00d4ff; font-family: monospace; }
.copy-btn { background: none; border: none; cursor: pointer; margin-left: 8px; font-size: 14px; opacity: 0.6; }
.copy-btn:hover { opacity: 1; }
.type-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.type-badge.admin { background: rgba(124,58,237,0.2); color: #a78bfa; }
.type-badge.standard { background: rgba(0,212,255,0.2); color: #00d4ff; }
.type-badge.trial { background: rgba(251,146,60,0.2); color: #fb923c; }
.device-info { display: flex; flex-direction: column; gap: 2px; }
.device-id { font-family: monospace; font-size: 12px; }
.device-name { font-size: 12px; color: rgba(255,255,255,0.5); }
.expiry-info { display: flex; flex-direction: column; gap: 2px; }
.days-left { font-size: 12px; }
.days-left.expiring { color: #fb923c; }
.days-left.expired { color: #ef4444; }
.features { display: flex; gap: 6px; flex-wrap: wrap; }
.feature-tag { background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; font-size: 11px; color: rgba(255,255,255,0.6); }
.feature-more { font-size: 11px; color: rgba(255,255,255,0.4); }
.status-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.status-badge.success { background: rgba(16,185,129,0.2); color: #10b981; }
.status-badge.warning { background: rgba(251,146,60,0.2); color: #fb923c; }
.status-badge.danger { background: rgba(239,68,68,0.2); color: #ef4444; }
.actions { display: flex; gap: 8px; }
.action-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); border: none; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.action-icon:hover { background: rgba(255,255,255,0.1); }
.action-icon.danger:hover { background: rgba(239,68,68,0.2); }
.pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 16px 0; }
.total { color: rgba(255,255,255,0.5); font-size: 14px; }
.page-btns { display: flex; align-items: center; gap: 12px; }
.page-btns button { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; }
.page-btns button:disabled { opacity: 0.3; cursor: not-allowed; }
.current { color: #00d4ff; font-size: 14px; }
/* 对话框 */
.dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: rgba(30,30,60,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 480px; max-width: 90vw; backdrop-filter: blur(20px); }
.dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.dialog-header h3 { color: #fff; font-size: 20px; margin: 0; }
.close-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 20px; cursor: pointer; }
.close-btn:hover { color: #fff; }
.dialog-body { padding: 24px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
.btn { padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.btn.secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
.btn.primary { background: linear-gradient(135deg,#00d4ff,#7c3aed); border: none; color: white; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 8px; }
.form-select, .form-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 14px; }
.form-select:focus, .form-input:focus { outline: none; border-color: #00d4ff; }
.checkbox-group { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
.checkbox-item { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.8); cursor: pointer; }
.checkbox-item input { width: 18px; height: 18px; }
.result-code { text-align: center; margin-bottom: 24px; }
.code-label { display: block; color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 12px; }
.code-box { background: rgba(0,212,255,0.1); padding: 16px 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 16px; }
.code-box code { color: #00d4ff; font-size: 18px; font-family: monospace; letter-spacing: 2px; }
.result-info { display: flex; flex-direction: column; gap: 12px; }
.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.info-row .label { color: rgba(255,255,255,0.5); }
.info-row .value { color: #fff; font-weight: 500; }
</style>
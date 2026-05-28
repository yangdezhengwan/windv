<template>
  <div class="licenses-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">授权管理</h1>
        <p class="page-description">管理所有软件授权码</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openGenerateDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          生成授权
        </el-button>
        <el-button @click="batchImport">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          批量导入
        </el-button>
        <el-button @click="openTypeManager">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          管理类型
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card" v-for="(stat, index) in licenseStats" :key="index">
        <div class="stat-icon" :class="stat.color">
          <span v-html="stat.icon"></span>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索授权码、设备ID..."
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </template>
        </el-input>
      </div>
      <div class="filter-right">
        <el-select v-model="filterType" placeholder="授权类型" clearable @change="handleFilter">
          <el-option label="全部" value=""/>
          <el-option v-for="t in licenseTypes" :key="t.code" :label="t.name" :value="t.code"/>
        </el-select>
        <el-select v-model="filterStatus" placeholder="授权状态" clearable @change="handleFilter">
          <el-option label="全部" value=""/>
          <el-option label="有效" value="active"/>
          <el-option label="过期" value="expired"/>
          <el-option label="撤销" value="revoked"/>
        </el-select>
      </div>
    </div>

    <!-- 授权表格 -->
    <div class="table-container">
      <el-table :data="filteredLicenses" v-loading="loading" stripe :row-class-name="() => 'table-row'" :cell-style="{ color: '#ffffff', background: 'rgba(30, 30, 60, 0.4)' }" :header-cell-style="{ color: '#ffffff', background: 'rgba(0, 212, 255, 0.1)' }">
        <el-table-column prop="code" label="授权码" min-width="220">
          <template #default="{ row }">
            <div class="code-cell">
              <span class="code-text">{{ row.code }}</span>
              <el-button
                type="primary"
                link
                @click="copyCode(row.code)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceId" label="设备ID" width="200" />
        <el-table-column prop="username" label="用户" width="150" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="expiresAt" label="过期时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetails(row)">详情</el-button>
            <el-button type="primary" link @click="extendLicense(row)" v-if="row.status === 'active'">延长</el-button>
            <el-button type="danger" link @click="revokeLicense(row)" v-if="row.status === 'active'">撤销</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 生成授权对话框 -->
    <el-dialog
      v-model="generateDialogVisible"
      title="生成授权码"
      width="600px"
      @close="resetGenerateForm"
    >
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="100px">
        <el-form-item label="授权类型" prop="type">
          <el-select v-model="generateForm.type" placeholder="请选择授权类型">
            <el-option v-for="t in licenseTypes" :key="t.code" :label="t.name" :value="t.code"/>
          </el-select>
        </el-form-item>
        <el-form-item label="用户邮箱" prop="email">
          <el-input v-model="generateForm.email" placeholder="请输入用户邮箱" />
        </el-form-item>
        <el-form-item label="有效期" prop="duration">
          <el-select v-model="generateForm.duration" placeholder="请选择有效期">
            <el-option label="30天" :value="30" />
            <el-option label="90天" :value="90" />
            <el-option label="180天" :value="180" />
            <el-option label="365天" :value="365" />
            <el-option label="永久" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="功能权限" prop="features">
          <el-checkbox-group v-model="generateForm.features">
            <el-checkbox label="basic">基础功能</el-checkbox>
            <el-checkbox label="sync">云端同步</el-checkbox>
            <el-checkbox label="stats">数据统计</el-checkbox>
            <el-checkbox label="cloud_backup">云端备份</el-checkbox>
            <el-checkbox label="ai_llm">AI 大模型</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input v-model="generateForm.note" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGenerate" :loading="generating">生成授权</el-button>
      </template>
    </el-dialog>

    <!-- 授权类型管理对话框 -->
    <el-dialog
      v-model="typeManagerVisible"
      title="授权类型管理"
      width="800px"
    >
      <div class="type-manager">
        <div class="type-header">
          <el-button type="primary" @click="openTypeDialog()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加类型
          </el-button>
        </div>
        <el-table :data="licenseTypes" v-loading="typeLoading" stripe :cell-style="{ color: '#ffffff', background: 'rgba(30, 30, 60, 0.4)' }" :header-cell-style="{ color: '#ffffff', background: 'rgba(0, 212, 255, 0.1)' }">
          <el-table-column prop="code" label="标识" width="150">
            <template #default="{ row }">
              <code style="color: #90cdf4;">{{ row.code }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="120" />
          <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
          <el-table-column prop="defaultExpiryDays" label="默认有效期" width="100" align="center">
            <template #default="{ row }">
              {{ row.defaultExpiryDays }}天
            </template>
          </el-table-column>
          <el-table-column prop="isActive" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                {{ row.isActive ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="系统" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isSystem" type="warning" size="small">内置</el-tag>
              <span v-else style="color: rgba(255,255,255,0.3);">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openTypeDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="deleteType(row)" v-if="!row.isSystem">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 类型编辑对话框 -->
    <el-dialog
      v-model="typeDialogVisible"
      :title="editingType._id ? '编辑授权类型' : '添加授权类型'"
      width="500px"
      @close="resetTypeForm"
    >
      <el-form :model="typeForm" :rules="typeRules" ref="typeFormRef" label-width="100px">
        <el-form-item label="类型标识" prop="code" v-if="!editingType._id || !editingType.isSystem">
          <el-input v-model="typeForm.code" placeholder="如: vip, enterprise" :disabled="!!editingType.isSystem" />
          <div class="form-tip">唯一标识，小写字母、数字、连字符</div>
        </el-form-item>
        <el-form-item label="显示名称" prop="name">
          <el-input v-model="typeForm.name" placeholder="如: VIP会员" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="typeForm.description" type="textarea" :rows="2" placeholder="类型描述" />
        </el-form-item>
        <el-form-item label="默认有效期" prop="defaultExpiryDays">
          <el-input-number v-model="typeForm.defaultExpiryDays" :min="1" :max="3650" />
          <span style="margin-left: 8px; color: rgba(255,255,255,0.5);">天</span>
        </el-form-item>
        <el-form-item label="功能权限" prop="features">
          <el-checkbox-group v-model="typeForm.features">
            <el-checkbox label="basic">基础功能</el-checkbox>
            <el-checkbox label="sync">云端同步</el-checkbox>
            <el-checkbox label="stats">数据统计</el-checkbox>
            <el-checkbox label="cloud_backup">云端备份</el-checkbox>
            <el-checkbox label="ai_llm">AI 大模型</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="typeForm.sortOrder" :min="0" :max="999" />
          <div class="form-tip">数字越小排序越靠前</div>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="typeForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitType" :loading="typeSubmitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const generateDialogVisible = ref(false)
const generating = ref(false)
const generateFormRef = ref(null)

// 授权类型管理
const typeManagerVisible = ref(false)
const typeDialogVisible = ref(false)
const typeLoading = ref(false)
const typeSubmitting = ref(false)
const typeFormRef = ref(null)
const licenseTypes = ref([])
const editingType = ref({})
const typeForm = ref({
  code: '',
  name: '',
  description: '',
  defaultExpiryDays: 365,
  features: ['basic'],
  sortOrder: 10,
  isActive: true
})
const typeRules = {
  code: [
    { required: true, message: '请输入类型标识', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入显示名称', trigger: 'blur' }
  ],
  defaultExpiryDays: [
    { required: true, message: '请输入默认有效期', trigger: 'change' }
  ]
}

const licenses = ref([
  {
    id: 1,
    code: 'STD-2026-XXXX-XXXX-XXXX',
    type: 'standard',
    deviceId: 'device_001',
    username: 'user001@example.com',
    createdAt: '2026-01-15 10:30:00',
    expiresAt: '2027-01-15 10:30:00',
    status: 'active',
    features: ['basic', 'sync', 'stats']
  },
  {
    id: 2,
    code: 'TRL-2026-XXXX-XXXX-XXXX',
    type: 'trial',
    deviceId: 'device_002',
    username: 'trial@example.com',
    createdAt: '2026-05-20 09:15:00',
    expiresAt: '2026-06-20 09:15:00',
    status: 'active',
    features: ['basic']
  },
  {
    id: 3,
    code: 'ADM-2026-XXXX-XXXX-XXXX',
    type: 'admin',
    deviceId: 'device_admin',
    username: 'admin@windv.com',
    createdAt: '2026-01-01 00:00:00',
    expiresAt: '2099-12-31 23:59:59',
    status: 'active',
    features: ['basic', 'sync', 'stats', 'cloud_backup', 'ai_llm']
  },
  {
    id: 4,
    code: 'STD-2025-XXXX-XXXX-XXXX',
    type: 'standard',
    deviceId: 'device_old',
    username: 'old@example.com',
    createdAt: '2025-01-10 14:20:00',
    expiresAt: '2026-01-10 14:20:00',
    status: 'expired',
    features: ['basic', 'sync', 'stats']
  }
])

const generateForm = ref({
  type: 'standard',
  email: '',
  duration: 365,
  features: ['basic'],
  note: ''
})

const generateRules = {
  type: [
    { required: true, message: '请选择授权类型', trigger: 'change' }
  ],
  email: [
    { required: true, message: '请输入用户邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请选择有效期', trigger: 'change' }
  ],
  features: [
    { required: true, message: '请选择功能权限', trigger: 'change' }
  ]
}

const licenseStats = ref([
  {
    label: '总授权数',
    value: '1,234',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    color: 'blue'
  },
  {
    label: '有效授权',
    value: '1,156',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    color: 'green'
  },
  {
    label: '即将过期',
    value: '23',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    color: 'orange'
  },
  {
    label: '已撤销',
    value: '12',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    color: 'red'
  }
])

const filteredLicenses = computed(() => {
  let result = licenses.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(license =>
      license.code.toLowerCase().includes(query) ||
      license.deviceId.toLowerCase().includes(query) ||
      license.username.toLowerCase().includes(query)
    )
  }

  if (filterType.value) {
    result = result.filter(license => license.type === filterType.value)
  }

  if (filterStatus.value) {
    result = result.filter(license => license.status === filterStatus.value)
  }

  return result
})

const getTypeLabel = (typeCode) => {
  const found = licenseTypes.value.find(t => t.code === typeCode)
  if (found) return found.name
  const labels = {
    admin: '管理员',
    standard: '标准版',
    trial: '试用版'
  }
  return labels[typeCode] || typeCode
}

const getTypeTag = (typeCode) => {
  const tagMap = {
    admin: 'danger',
    standard: 'primary',
    trial: 'warning'
  }
  return tagMap[typeCode] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    active: '有效',
    expired: '过期',
    revoked: '撤销'
  }
  return labels[status] || status
}

const getStatusTag = (status) => {
  const tags = {
    active: 'success',
    expired: 'info',
    revoked: 'danger'
  }
  return tags[status] || ''
}

const openGenerateDialog = () => {
  generateDialogVisible.value = true
}

const copyCode = (code) => {
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success('授权码已复制到剪贴板')
  })
}

const viewDetails = (row) => {
  ElMessageBox.alert(
    `<div style="line-height: 2;">
      <strong>授权码:</strong> ${row.code}<br>
      <strong>类型:</strong> ${getTypeLabel(row.type)}<br>
      <strong>设备ID:</strong> ${row.deviceId}<br>
      <strong>用户:</strong> ${row.username}<br>
      <strong>创建时间:</strong> ${row.createdAt}<br>
      <strong>过期时间:</strong> ${row.expiresAt}<br>
      <strong>功能权限:</strong> ${row.features.join(', ')}
    </div>`,
    '授权详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

const extendLicense = (row) => {
  ElMessageBox.prompt('请输入延长天数', '延长授权', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效的天数'
  }).then(({ value }) => {
    ElMessage.success(`已延长 ${value} 天`)
  }).catch(() => {})
}

const revokeLicense = (row) => {
  ElMessageBox.confirm(`确定要撤销授权码 ${row.code} 吗？`, '警告', {
    confirmButtonText: '确定撤销',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    row.status = 'revoked'
    ElMessage.success('授权已撤销')
  }).catch(() => {})
}

const submitGenerate = () => {
  generateFormRef.value.validate((valid) => {
    if (valid) {
      generating.value = true
      setTimeout(() => {
        const newLicense = {
          id: licenses.value.length + 1,
          code: `${generateForm.value.type.toUpperCase()}-${new Date().getFullYear()}-${generateRandomString()}`,
          type: generateForm.value.type,
          deviceId: '-',
          username: generateForm.value.email,
          createdAt: new Date().toLocaleString('zh-CN'),
          expiresAt: generateForm.value.duration === 0
            ? '2099-12-31 23:59:59'
            : new Date(Date.now() + generateForm.value.duration * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          status: 'active',
          features: generateForm.value.features
        }
        licenses.value.unshift(newLicense)
        generateDialogVisible.value = false
        generating.value = false
        ElMessage.success('授权码生成成功')
        resetGenerateForm()
      }, 500)
    }
  })
}

const resetGenerateForm = () => {
  generateForm.value = {
    type: 'standard',
    email: '',
    duration: 365,
    features: ['basic'],
    note: ''
  }
  generateFormRef.value?.resetFields()
}

const batchImport = () => {
  ElMessage.info('批量导入功能开发中...')
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const generateRandomString = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 授权类型管理
const openTypeManager = async () => {
  typeManagerVisible.value = true
  await fetchTypes()
}

const fetchTypes = async () => {
  typeLoading.value = true
  try {
    // 模拟获取数据，实际应从API获取
    const API_BASE = import.meta.env.VITE_API_BASE || '/api'
    const res = await fetch(`${API_BASE}/license-type/list`)
    if (res.ok) {
      const data = await res.json()
      licenseTypes.value = data.types || []
    } else {
      // 如果API未实现，使用默认类型
      licenseTypes.value = [
        { _id: '1', code: 'admin', name: '管理员', description: '管理员权限，无限制', defaultExpiryDays: 3650, features: ['all'], isActive: true, isSystem: true, sortOrder: 1 },
        { _id: '2', code: 'standard', name: '标准版', description: '标准功能授权', defaultExpiryDays: 365, features: ['basic', 'advanced'], isActive: true, isSystem: true, sortOrder: 2 },
        { _id: '3', code: 'trial', name: '试用版', description: '试用授权，限制功能', defaultExpiryDays: 7, features: ['basic'], isActive: true, isSystem: true, sortOrder: 3 }
      ]
    }
  } catch (e) {
    console.error('获取授权类型失败:', e)
    ElMessage.error('获取授权类型失败')
  }
  typeLoading.value = false
}

const openTypeDialog = (type = null) => {
  editingType.value = type || {}
  if (type) {
    typeForm.value = {
      code: type.code,
      name: type.name,
      description: type.description || '',
      defaultExpiryDays: type.defaultExpiryDays || 365,
      features: type.features || ['basic'],
      sortOrder: type.sortOrder || 10,
      isActive: type.isActive !== false
    }
  } else {
    resetTypeForm()
  }
  typeDialogVisible.value = true
}

const resetTypeForm = () => {
  typeForm.value = {
    code: '',
    name: '',
    description: '',
    defaultExpiryDays: 365,
    features: ['basic'],
    sortOrder: 10,
    isActive: true
  }
  typeFormRef.value?.resetFields()
}

const submitType = async () => {
  typeFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    typeSubmitting.value = true
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '/api'
      const token = localStorage.getItem('token') || ''
      const isEdit = !!editingType.value._id
      const url = isEdit ? `${API_BASE}/license-type/${editingType.value._id}` : `${API_BASE}/license-type`
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(typeForm.value)
      })
      
      if (res.ok) {
        ElMessage.success(isEdit ? '类型已更新' : '类型已添加')
        typeDialogVisible.value = false
        await fetchTypes()
        // 刷新筛选下拉
        await refreshTypeOptions()
      } else {
        const err = await res.json()
        ElMessage.error(err.error || '操作失败')
      }
    } catch (e) {
      console.error('保存授权类型失败:', e)
      ElMessage.error('保存失败')
    }
    typeSubmitting.value = false
  })
}

const deleteType = (type) => {
  ElMessageBox.confirm(`确定要删除授权类型"${type.name}"吗？`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '/api'
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`${API_BASE}/license-type/${type._id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      if (res.ok) {
        ElMessage.success('类型已删除')
        await fetchTypes()
        await refreshTypeOptions()
      } else {
        const err = await res.json()
        ElMessage.error(err.error || '删除失败')
      }
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 刷新筛选栏的类型下拉
const refreshTypeOptions = async () => {
  await fetchTypes()
  // 更新 getTypeLabel 函数的数据源
  if (licenseTypes.value.length > 0) {
    window.__licenseTypes = licenseTypes.value
  }
}

onMounted(async () => {
  total.value = licenses.value.length
  // 加载授权类型
  await fetchTypes()
})
</script>

<style scoped>
/* 相同的样式，与 Users.vue 保持一致 */
.licenses-page {
  padding: 24px 32px;
  animation: fadeInUp 0.6s ease-out;
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.header-content .page-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}

.header-content .page-description {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions :deep(.el-button) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions svg {
  width: 16px;
  height: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 212, 255, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.stat-icon.blue svg {
  color: #00d4ff;
}

.stat-icon.green {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.stat-icon.green svg {
  color: #10b981;
}

.stat-icon.orange {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.stat-icon.orange svg {
  color: #f59e0b;
}

.stat-icon.red {
  background: rgba(255, 100, 100, 0.15);
  border: 1px solid rgba(255, 100, 100, 0.2);
}

.stat-icon.red svg {
  color: #ff6464;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(26, 26, 50, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
}

.filter-left,
.filter-right {
  display: flex;
  gap: 12px;
}

.filter-left :deep(.el-input) {
  width: 300px;
}

.filter-left :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.filter-left :deep(.el-input__wrapper):hover,
.filter-left :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(0, 212, 255, 0.3);
}

.filter-left :deep(.el-input__inner) {
  color: #fff;
}

.filter-left :deep(.el-input__inner)::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.filter-right :deep(.el-select) {
  width: 150px;
}

/* 表格容器 */
.table-container {
  background: rgba(26, 26, 50, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
}

/* 强制覆盖 Element Plus 表格样式 - 最高优先级 */
.table-container :deep(.el-table) {
  background: transparent !important;
  color: #ffffff !important;
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: rgba(0, 212, 255, 0.1) !important;
  --el-table-row-hover-bg-color: rgba(0, 212, 255, 0.05) !important;
  --el-table-border-color: rgba(255, 255, 255, 0.1) !important;
  --el-table-text-color: #ffffff !important;
  --el-table-header-text-color: #ffffff !important;
}

.table-container :deep(.el-table th.el-table__cell) {
  background: rgba(0, 212, 255, 0.1) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
}

.table-container :deep(.el-table td.el-table__cell) {
  background: rgba(30, 30, 60, 0.4) !important;
  color: #ffffff !important;
}

.table-container :deep(.el-table tr) {
  background: rgba(30, 30, 60, 0.4) !important;
  color: #ffffff !important;
}

.table-container :deep(.el-table tr:hover > td) {
  background: rgba(0, 212, 255, 0.08) !important;
  color: #ffffff !important;
}

.code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-text {
  font-family: 'Courier New', monospace;
  color: #ffffff;
  font-weight: 500;
}

.code-cell :deep(.el-button) {
  padding: 4px;
}

.code-cell svg {
  width: 16px;
  height: 16px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.pagination :deep(.el-pagination button) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
}

.pagination :deep(.el-pagination button:hover) {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.pagination :deep(.el-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  color: white;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
    gap: 16px;
  }

  .filter-left,
  .filter-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .filter-left :deep(.el-input) {
    flex: 1;
    min-width: 200px;
  }
}

/* 操作栏按钮 - 暗淡半透明样式 */
.el-table :deep(.el-button--primary) {
  background: rgba(64, 158, 255, 0.15);
  border-color: rgba(64, 158, 255, 0.3);
  color: #ffffff;
}

.el-table :deep(.el-button--primary:hover) {
  background: rgba(64, 158, 255, 0.25);
  border-color: rgba(64, 158, 255, 0.5);
  color: #ffffff;
}

.el-table :deep(.el-button--danger) {
  background: rgba(245, 101, 101, 0.15);
  border-color: rgba(245, 101, 101, 0.3);
  color: #ffffff;
}

.el-table :deep(.el-button--danger:hover) {
  background: rgba(245, 101, 101, 0.25);
  border-color: rgba(245, 101, 101, 0.5);
  color: #ffffff;
}

/* 授权类型管理 */
.type-manager {
  min-height: 300px;
}

.type-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.type-header :deep(.el-button) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-header :deep(svg) {
  width: 14px;
  height: 14px;
}

.form-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
  line-height: 1.4;
}
</style>
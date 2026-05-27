<template>
  <div class="users-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">用户管理</h1>
        <p class="page-description">管理平台所有注册用户</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新增用户
        </el-button>
        <el-button @click="exportUsers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card" v-for="(stat, index) in userStats" :key="index">
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
          placeholder="搜索用户名、邮箱..."
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
        <el-select v-model="filterStatus" placeholder="用户状态" clearable @change="handleFilter">
          <el-option label="全部" value=""/>
          <el-option label="活跃" value="active"/>
          <el-option label="禁用" value="disabled"/>
        </el-select>
        <el-select v-model="filterRole" placeholder="角色类型" clearable @change="handleFilter">
          <el-option label="全部" value=""/>
          <el-option label="管理员" value="admin"/>
          <el-option label="普通用户" value="user"/>
        </el-select>
      </div>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <el-table :data="filteredUsers" v-loading="loading" stripe :row-class-name="() => 'table-row'" :cell-style="{ color: '#ffffff', background: 'rgba(30, 30, 60, 0.4)' }" :header-cell-style="{ color: '#ffffff', background: 'rgba(0, 212, 255, 0.1)' }">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar">{{ row.username.charAt(0).toUpperCase() }}</div>
              <div class="user-info">
                <span class="user-name">{{ row.username }}</span>
                <span class="user-email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180" />
        <el-table-column prop="lastLogin" label="最后登录" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editUser(row)">编辑</el-button>
            <el-button type="primary" link @click="resetPassword(row)">重置密码</el-button>
            <el-button type="danger" link @click="deleteUser(row)">删除</el-button>
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

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="userForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status" placeholder="请选择状态">
            <el-option label="活跃" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const filterRole = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const users = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@windv.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-15 10:30:00',
    lastLogin: '2026-05-27 14:20:00'
  },
  {
    id: 2,
    username: 'user001',
    email: 'user001@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-02-20 09:15:00',
    lastLogin: '2026-05-26 18:45:00'
  },
  {
    id: 3,
    username: 'zhangsan',
    email: 'zhangsan@test.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-03-10 14:20:00',
    lastLogin: '2026-05-27 09:30:00'
  },
  {
    id: 4,
    username: 'lisi',
    email: 'lisi@example.com',
    role: 'user',
    status: 'disabled',
    createdAt: '2026-04-05 11:25:00',
    lastLogin: '2026-05-20 16:40:00'
  }
])

const userForm = ref({
  id: null,
  username: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active'
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const userStats = ref([
  {
    label: '总用户数',
    value: '1,234',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    color: 'blue'
  },
  {
    label: '活跃用户',
    value: '1,156',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    color: 'green'
  },
  {
    label: '管理员',
    value: '8',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    color: 'purple'
  },
  {
    label: '今日新增',
    value: '12',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    color: 'orange'
  }
])

const filteredUsers = computed(() => {
  let result = users.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    result = result.filter(user => user.status === filterStatus.value)
  }

  if (filterRole.value) {
    result = result.filter(user => user.role === filterRole.value)
  }

  return result
})

const openAddDialog = () => {
  dialogTitle.value = '新增用户'
  isEdit.value = false
  dialogVisible.value = true
}

const editUser = (row) => {
  dialogTitle.value = '编辑用户'
  isEdit.value = true
  userForm.value = { ...row }
  dialogVisible.value = true
}

const resetPassword = (row) => {
  ElMessageBox.confirm(`确定要重置用户 ${row.username} 的密码吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('密码重置成功')
  }).catch(() => {})
}

const deleteUser = (row) => {
  ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    const index = users.value.findIndex(u => u.id === row.id)
    if (index > -1) {
      users.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      setTimeout(() => {
        if (isEdit.value) {
          const index = users.value.findIndex(u => u.id === userForm.value.id)
          if (index > -1) {
            users.value[index] = { ...userForm.value }
          }
          ElMessage.success('更新成功')
        } else {
          userForm.value.id = users.value.length + 1
          userForm.value.createdAt = new Date().toLocaleString('zh-CN')
          userForm.value.lastLogin = '-'
          users.value.unshift({ ...userForm.value })
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        submitting.value = false
      }, 500)
    }
  })
}

const resetForm = () => {
  userForm.value = {
    id: null,
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  }
  formRef.value?.resetFields()
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

const exportUsers = () => {
  ElMessage.success('数据导出中...')
}

onMounted(() => {
  total.value = users.value.length
})
</script>

<style scoped>
.users-page {
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

/* 页面头部 */
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

/* 统计卡片 */
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

.stat-icon.purple {
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.stat-icon.purple svg {
  color: #7c3aed;
}

.stat-icon.orange {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.stat-icon.orange svg {
  color: #f59e0b;
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

/* 筛选栏 */
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

/* 用户单元格 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: #fff;
  font-weight: 500;
  font-size: 14px;
}

.user-email {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 2px;
}

/* 分页 */
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

/* 响应式 */
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
</style>
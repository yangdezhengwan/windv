<template>
  <div class="users-page">
    <div class="bg-animation">
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
    </div>
    
    <div class="page-header">
      <h1>👥 用户管理</h1>
      <p>管理系统用户和权限</p>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户名、邮箱..."
        class="search-input"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="fetchUsers">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <!-- 用户列表 -->
    <div class="content-card">
      <el-table
        :data="users"
        v-loading="loading"
        stripe
        class="tech-table"
      >
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="licenseQuota" label="授权配额" width="100" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editUser(row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="resetPassword(row)"
              :disabled="row.role === 'admin'"
            >
              重置密码
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchUsers"
          @size-change="fetchUsers"
        />
      </div>
    </div>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role">
            <el-option label="管理员" value="admin" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权配额">
          <el-input-number v-model="editForm.licenseQuota" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://sq.kxkj.ltd/api'

const users = ref([])
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const editDialogVisible = ref(false)
const editForm = ref({
  id: '',
  username: '',
  email: '',
  role: 'user',
  licenseQuota: 0,
  isActive: true
})

async function fetchUsers() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: pageSize.value
    })
    if (searchQuery.value) {
      params.append('keyword', searchQuery.value)
    }
    
    const res = await fetch(`${API_BASE}/users?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    if (data.users) {
      users.value = data.users
      total.value = data.pagination?.total || data.users.length
    } else if (Array.isArray(data)) {
      users.value = data
      total.value = data.length
    }
  } catch (err) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchUsers()
}

function editUser(row) {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

async function saveUser() {
  saving.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users/${editForm.value.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editForm.value)
    })
    
    if (res.ok) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      fetchUsers()
    } else {
      const data = await res.json()
      ElMessage.error(data.error || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function resetPassword(row) {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${row.username}" 的密码吗？`,
      '重置密码',
      { type: 'warning' }
    )
    
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users/${row.id}/reset-password`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const data = await res.json()
    if (res.ok) {
      ElMessage.success(`新密码: ${data.password}`)
    } else {
      ElMessage.error(data.error || '重置失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('重置失败')
    }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-page {
  padding: 24px;
  min-height: 100vh;
  position: relative;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  color: #fff;
  font-size: 28px;
  margin-bottom: 8px;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.content-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
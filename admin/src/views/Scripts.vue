<template>
  <div class="scripts-page">
    <div class="page-header">
      <h1>💬 话术库管理</h1>
      <p>管理云端话术模板和分类</p>
    </div>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索话术..."
        class="search-input"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="categoryFilter" placeholder="选择分类" clearable @change="fetchScripts">
        <el-option label="全部" value="" />
        <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
      </el-select>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加话术
      </el-button>
      <el-button @click="fetchScripts">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <!-- 话术列表 -->
    <div class="content-card">
      <el-table
        :data="scripts"
        v-loading="loading"
        stripe
        class="tech-table"
      >
        <el-table-column prop="keywords" label="关键词" min-width="200">
          <template #default="{ row }">
            <div class="keywords">
              <el-tag 
                v-for="kw in (row.keywords || []).slice(0, 3)" 
                :key="kw"
                size="small"
                class="kw-tag"
              >
                {{ kw }}
              </el-tag>
              <span v-if="(row.keywords || []).length > 3" class="kw-more">
                +{{ row.keywords.length - 3 }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="responses" label="回复内容" min-width="250">
          <template #default="{ row }">
            <div class="response-preview">{{ (row.responses || [])[0] || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="intentType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getIntentTypeColor(row.intentType)" size="small">
              {{ getIntentTypeName(row.intentType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.priority > 5 ? 'danger' : 'info'" size="small">
              {{ row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editScript(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteScript(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchScripts"
        />
      </div>
    </div>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑话术' : '添加话术'" 
      width="700px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="关键词">
          <el-input 
            v-model="form.keywordsText" 
            placeholder="多个关键词用逗号分隔，如：你好,欢迎,下单"
          />
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input 
            v-model="form.responsesText" 
            type="textarea" 
            :rows="3"
            placeholder="多个回复用换行分隔"
          />
        </el-form-item>
        <el-form-item label="匹配类型">
          <el-select v-model="form.intentType">
            <el-option label="关键词匹配" value="keyword" />
            <el-option label="模糊匹配" value="fuzzy" />
            <el-option label="正则匹配" value="regex" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类">
            <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="AI增强">
          <el-switch v-model="form.aiEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveScript" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://sq.kxkj.ltd/api'

const scripts = ref([])
const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: '',
  keywordsText: '',
  responsesText: '',
  intentType: 'keyword',
  categoryId: '',
  priority: 0,
  aiEnabled: false
})

async function fetchScripts() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: pageSize.value
    })
    if (searchQuery.value) params.append('keyword', searchQuery.value)
    if (categoryFilter.value) params.append('categoryId', categoryFilter.value)
    
    const res = await fetch(`${API_BASE}/scripts?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    if (data.scripts) {
      scripts.value = data.scripts
      total.value = data.pagination?.total || data.scripts.length
    } else if (Array.isArray(data)) {
      scripts.value = data
      total.value = data.length
    }
  } catch (err) {
    ElMessage.error('获取话术列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/scripts/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    categories.value = data.categories || data || []
  } catch (err) {
    console.error('获取分类失败', err)
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchScripts()
}

function showAddDialog() {
  isEdit.value = false
  form.value = {
    id: '',
    keywordsText: '',
    responsesText: '',
    intentType: 'keyword',
    categoryId: '',
    priority: 0,
    aiEnabled: false
  }
  dialogVisible.value = true
}

function editScript(row) {
  isEdit.value = true
  form.value = {
    id: row._id,
    keywordsText: (row.keywords || []).join(','),
    responsesText: (row.responses || []).join('\n'),
    intentType: row.intentType || 'keyword',
    categoryId: row.categoryId || '',
    priority: row.priority || 0,
    aiEnabled: row.aiEnabled || false
  }
  dialogVisible.value = true
}

async function saveScript() {
  saving.value = true
  try {
    const token = localStorage.getItem('token')
    const scriptData = {
      keywords: form.value.keywordsText.split(',').map(k => k.trim()).filter(k => k),
      responses: form.value.responsesText.split('\n').map(r => r.trim()).filter(r => r),
      intentType: form.value.intentType,
      categoryId: form.value.categoryId || undefined,
      priority: form.value.priority,
      aiEnabled: form.value.aiEnabled
    }
    
    const url = isEdit.value ? `${API_BASE}/scripts/${form.value.id}` : `${API_BASE}/scripts`
    const method = isEdit.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scriptData)
    })
    
    if (res.ok) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchScripts()
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

async function deleteScript(row) {
  try {
    await ElMessageBox.confirm('确定删除该话术？', '删除确认', { type: 'warning' })
    
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/scripts/${row._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (res.ok) {
      ElMessage.success('删除成功')
      fetchScripts()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

function getIntentTypeName(type) {
  const map = { keyword: '关键词', fuzzy: '模糊', regex: '正则' }
  return map[type] || type
}

function getIntentTypeColor(type) {
  const map = { keyword: 'primary', fuzzy: 'warning', regex: 'success' }
  return map[type] || 'info'
}

onMounted(() => {
  fetchScripts()
  fetchCategories()
})
</script>

<style scoped>
.scripts-page {
  padding: 24px;
  min-height: 100vh;
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  width: 250px;
}

.content-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.kw-tag {
  margin: 2px;
}

.kw-more {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.response-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 250px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
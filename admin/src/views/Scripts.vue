<template>
  <div class="scripts-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">话术库</h1>
        <p class="page-description">管理智能回复话术模板</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新增话术
        </el-button>
        <el-button @click="importScripts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          导入话术
        </el-button>
        <el-button @click="exportScripts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出话术
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card" v-for="(stat, index) in scriptStats" :key="index">
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
          placeholder="搜索关键词、问题..."
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
        <el-select v-model="filterCategory" placeholder="话术分类" clearable @change="handleFilter">
          <el-option label="全部" value=""/>
          <el-option label="日常互动" value="daily"/>
          <el-option label="价格咨询" value="price"/>
          <el-option label="物流售后" value="service"/>
          <el-option label="尺码推荐" value="size"/>
          <el-option label="优惠话术" value="discount"/>
        </el-select>
      </div>
    </div>

    <!-- 话术列表 -->
    <div class="scripts-grid">
      <div class="script-card" v-for="script in filteredScripts" :key="script.id">
        <div class="script-header">
          <div class="script-category" :class="script.category">
            {{ getCategoryLabel(script.category) }}
          </div>
          <div class="script-actions">
            <el-button type="primary" link @click="editScript(script)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </el-button>
            <el-button type="danger" link @click="deleteScript(script)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </el-button>
          </div>
        </div>
        <div class="script-question">
          <div class="question-label">问题</div>
          <div class="question-text">{{ script.question }}</div>
        </div>
        <div class="script-answer">
          <div class="answer-label">回复</div>
          <div class="answer-text">{{ script.answer }}</div>
        </div>
        <div class="script-footer">
          <span class="script-keywords">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="9" x2="20" y2="9"/>
              <line x1="4" y1="15" x2="20" y2="15"/>
              <line x1="10" y1="3" x2="8" y2="21"/>
              <line x1="16" y1="3" x2="14" y2="21"/>
            </svg>
            {{ script.keywords.join(', ') }}
          </span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑话术对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form :model="scriptForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="话术分类" prop="category">
          <el-select v-model="scriptForm.category" placeholder="请选择分类">
            <el-option label="日常互动" value="daily" />
            <el-option label="价格咨询" value="price" />
            <el-option label="物流售后" value="service" />
            <el-option label="尺码推荐" value="size" />
            <el-option label="优惠话术" value="discount" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题" prop="question">
          <el-input v-model="scriptForm.question" type="textarea" :rows="2" placeholder="请输入用户可能提问的问题" />
        </el-form-item>
        <el-form-item label="回复" prop="answer">
          <el-input v-model="scriptForm.answer" type="textarea" :rows="4" placeholder="请输入自动回复内容" />
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-select v-model="scriptForm.keywords" multiple filterable allow-create default-first-option placeholder="输入关键词后按回车">
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
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(24)
const total = ref(0)

const dialogVisible = ref(false)
const dialogTitle = ref('新增话术')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const scripts = ref([
  {
    id: 1,
    category: 'price',
    question: '这个多少钱？',
    answer: '亲，这款产品目前活动价是XX元，非常优惠哦！点击下方链接可以领取专属优惠券~',
    keywords: ['价格', '多少钱', '优惠']
  },
  {
    id: 2,
    category: 'size',
    question: '尺码怎么选？',
    answer: '亲，根据您的身高体重，建议选择M码哦～如果不确定可以告诉我您的具体数据，我帮您推荐~',
    keywords: ['尺码', '大小', '选码']
  },
  {
    id: 3,
    category: 'service',
    question: '几天能到？',
    answer: '亲，正常情况下48小时内发货，快递一般3-5天送达哦～偏远地区可能稍慢一些~',
    keywords: ['物流', '快递', '几天']
  },
  {
    id: 4,
    category: 'discount',
    question: '有优惠吗？',
    answer: '亲，当前店铺正在做活动，全场8折起！下单前记得先领券，还能再减XX元哦~',
    keywords: ['优惠', '折扣', '便宜']
  },
  {
    id: 5,
    category: 'daily',
    question: '老板在吗？',
    answer: '亲，您好！小二在线为您服务～有什么可以帮您的吗？',
    keywords: ['在吗', '老板', '客服']
  },
  {
    id: 6,
    category: 'service',
    question: '可以退换吗？',
    answer: '亲，支持7天无理由退换货哦～如果收到货有任何问题，随时联系我们处理~',
    keywords: ['退换', '退货', '售后']
  }
])

const scriptForm = ref({
  id: null,
  category: 'daily',
  question: '',
  answer: '',
  keywords: []
})

const formRules = {
  category: [
    { required: true, message: '请选择话术分类', trigger: 'change' }
  ],
  question: [
    { required: true, message: '请输入问题', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入回复内容', trigger: 'blur' }
  ]
}

const scriptStats = ref([
  {
    label: '话术总数',
    value: '5,678',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    color: 'blue'
  },
  {
    label: '今日使用',
    value: '1,234',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    color: 'green'
  },
  {
    label: '分类数',
    value: '12',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    color: 'purple'
  },
  {
    label: '命中率',
    value: '94.5%',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    color: 'orange'
  }
])

const filteredScripts = computed(() => {
  let result = scripts.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(script =>
      script.question.toLowerCase().includes(query) ||
      script.answer.toLowerCase().includes(query) ||
      script.keywords.some(k => k.toLowerCase().includes(query))
    )
  }

  if (filterCategory.value) {
    result = result.filter(script => script.category === filterCategory.value)
  }

  return result
})

const getCategoryLabel = (category) => {
  const labels = {
    daily: '日常互动',
    price: '价格咨询',
    service: '物流售后',
    size: '尺码推荐',
    discount: '优惠话术'
  }
  return labels[category] || category
}

const openAddDialog = () => {
  dialogTitle.value = '新增话术'
  isEdit.value = false
  dialogVisible.value = true
}

const editScript = (script) => {
  dialogTitle.value = '编辑话术'
  isEdit.value = true
  scriptForm.value = { ...script, keywords: [...script.keywords] }
  dialogVisible.value = true
}

const deleteScript = (script) => {
  ElMessageBox.confirm(`确定要删除这条话术吗？`, '提示', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = scripts.value.findIndex(s => s.id === script.id)
    if (index > -1) {
      scripts.value.splice(index, 1)
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
          const index = scripts.value.findIndex(s => s.id === scriptForm.value.id)
          if (index > -1) {
            scripts.value[index] = { ...scriptForm.value }
          }
          ElMessage.success('更新成功')
        } else {
          scriptForm.value.id = scripts.value.length + 1
          scripts.value.unshift({ ...scriptForm.value })
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        submitting.value = false
      }, 500)
    }
  })
}

const resetForm = () => {
  scriptForm.value = {
    id: null,
    category: 'daily',
    question: '',
    answer: '',
    keywords: []
  }
  formRef.value?.resetFields()
}

const importScripts = () => {
  ElMessage.info('导入功能开发中...')
}

const exportScripts = () => {
  ElMessage.success('话术导出中...')
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

onMounted(() => {
  total.value = scripts.value.length
})
</script>

<style scoped>
.scripts-page {
  padding: 24px 32px;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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

.stat-icon.blue { background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.2); }
.stat-icon.blue svg { color: #00d4ff; }
.stat-icon.green { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.2); }
.stat-icon.green svg { color: #10b981; }
.stat-icon.purple { background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.2); }
.stat-icon.purple svg { color: #7c3aed; }
.stat-icon.orange { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.2); }
.stat-icon.orange svg { color: #f59e0b; }
.stat-icon svg { width: 28px; height: 28px; }

.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 28px; font-weight: 700; color: #fff; line-height: 1; margin-bottom: 4px; }
.stat-label { color: rgba(255, 255, 255, 0.5); font-size: 13px; }

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

.filter-left, .filter-right { display: flex; gap: 12px; }
.filter-left :deep(.el-input) { width: 300px; }
.filter-left :deep(.el-input__wrapper) { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); }
.filter-left :deep(.el-input__wrapper):hover, .filter-left :deep(.el-input__wrapper.is-focus) { border-color: rgba(0, 212, 255, 0.3); }
.filter-left :deep(.el-input__inner) { color: #fff; }
.filter-left :deep(.el-input__inner)::placeholder { color: rgba(255, 255, 255, 0.3); }
.filter-right :deep(.el-select) { width: 150px; }

.scripts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.script-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s;
}

.script-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 212, 255, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.script-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.script-category {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.script-category.daily { background: rgba(0, 212, 255, 0.15); color: #00d4ff; }
.script-category.price { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.script-category.service { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.script-category.size { background: rgba(124, 58, 237, 0.15); color: #7c3aed; }
.script-category.discount { background: rgba(255, 100, 100, 0.15); color: #ff6464; }

.script-actions { display: flex; gap: 8px; }
.script-actions svg { width: 16px; height: 16px; }

.script-question, .script-answer { margin-bottom: 12px; }
.question-label, .answer-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.question-text {
  color: #fff;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.5;
}

.answer-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.script-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.script-keywords {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.script-keywords svg { width: 14px; height: 14px; }

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.pagination-container :deep(.el-pagination button) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
}

.pagination-container :deep(.el-pagination button:hover) {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.pagination-container :deep(.el-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  color: white;
}

@media (max-width: 1200px) {
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .scripts-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .stats-cards, .scripts-grid { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; gap: 16px; }
  .filter-left, .filter-right { width: 100%; flex-wrap: wrap; }
  .filter-left :deep(.el-input) { flex: 1; min-width: 200px; }
}
</style>
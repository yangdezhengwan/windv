<template>
  <div class="script-page">
    <!-- Animated Background -->
    <div class="bg-animation">
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
    </div>
    
    <el-container>
      <!-- Sidebar -->
      <el-aside width="220" class="glass-sidebar">
        <div class="logo-container">
          <div class="logo-glow">
            <img src="/icon.png" class="logo-img" alt="Logo" />
          </div>
          <div class="logo-text">
            <span class="brand">WindV</span>
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
        </el-menu>
      </el-aside>

      <!-- Main Content -->
      <el-container class="main-container">
        <el-header class="glass-header">
          <div class="header-left">
            <h2 class="page-title">
              <span class="title-highlight">Script</span>
              <span class="title-sub">Library</span>
              <span class="title-divider"></span>
            </h2>
          </div>
          <div class="header-right">
            <el-button type="primary" class="tech-btn-glow" @click="showAddScript = true">
              <el-icon><Plus /></el-icon>
              Add Script
            </el-button>
          </div>
        </el-header>

        <el-main class="main-content">
          <!-- Category Stats -->
          <div class="category-bar">
            <div 
              v-for="cat in categories" 
              :key="cat.id"
              class="category-chip"
              :class="{ active: selectedCategory === cat.id }"
              @click="selectedCategory = cat.id === selectedCategory ? '' : cat.id"
            >
              <span class="category-icon">{{ getCategoryIcon(cat.type) }}</span>
              <span class="category-name">{{ cat.name }}</span>
              <span class="category-count">{{ getScriptCount(cat.id) }}</span>
            </div>
            <div class="category-chip add" @click="showAddCategory = true">
              <el-icon><Plus /></el-icon>
            </div>
          </div>

          <!-- Script Grid -->
          <div class="script-grid">
            <div 
              v-for="script in filtered话术库" 
              :key="script.id" 
              class="script-card"
              :class="{ 'is-timing': isTimingScript(script) }"
            >
              <div class="card-glow"></div>
              
              <div class="script-header">
                <div class="intent-badge" :class="script.intent_type">
                  {{ getIntentLabel(script.intent_type) }}
                </div>
                <div class="script-actions">
                  <el-button circle class="action-btn" @click="editScript(script)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button circle class="action-btn" @click="duplicateScript(script)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                  <el-button circle class="action-btn delete" @click="deleteScript(script.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <div class="script-body">
                <div class="keywords-section">
                  <div class="section-label">Keywords</div>
                  <div class="keywords-list">
                    <el-tag 
                      v-for="kw in parseKeywords(script.keywords)" 
                      :key="kw"
                      size="small"
                      class="keyword-tag"
                      :class="script.intent_type"
                    >
                      {{ kw }}
                    </el-tag>
                  </div>
                </div>

                <div class="response-section">
                  <div class="section-label">Response</div>
                  <div class="response-text">{{ script.response_text }}</div>
                </div>

                <div v-if="isTimingScript(script)" class="timing-section">
                  <el-icon><Timer /></el-icon>
                  <span>Every {{ parseTimingInterval(script.remark) }} seconds</span>
                </div>
              </div>

              <div class="script-footer">
                <div class="priority-badge" :class="'p' + script.priority">
                  P{{ script.priority }}
                </div>
                <div class="usage-count">
                  <el-icon><SuccessFilled /></el-icon>
                  <span>{{ script.use_count || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Add Card -->
            <div class="script-card add-card" @click="showAddScript = true">
              <div class="add-content">
                <div class="add-icon">
                  <el-icon><Plus /></el-icon>
                </div>
                <div class="add-text">New Script</div>
              </div>
            </div>
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- Add/Edit Script Dialog -->
    <el-dialog
      v-model="showAddScript"
      :title="editingScript ? '编辑话术' : '新建话术'"
      width="600px"
      class="tech-dialog"
    >
      <el-form :model="scriptForm" label-width="100px" class="tech-form">
        <el-form-item label="Category">
          <el-select v-model="scriptForm.category_id" class="tech-select-full">
            <el-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :label="cat.name" 
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Intent Type">
          <el-select v-model="scriptForm.intent_type" class="tech-select-full">
            <el-option label="General Chat" value="chat" />
            <el-option label="Price Inquiry" value="price" />
            <el-option label="Logistics" value="logistics" />
            <el-option label="After-sales" value="aftersale" />
            <el-option label="Size/Specs" value="size" />
            <el-option label="Discount" value="discount" />
            <el-option label="Advertisement" value="ad" />
          </el-select>
        </el-form-item>

        <el-form-item label="Keywords">
          <el-input 
            v-model="scriptForm.keywords" 
            type="textarea" 
            :rows="2"
            placeholder="Enter keywords, separated by commas"
            class="tech-textarea"
          />
          <div class="form-hint">Multiple keywords separated by commas</div>
        </el-form-item>

        <el-form-item label="Response">
          <el-input 
            v-model="scriptForm.response_text" 
            type="textarea" 
            :rows="4"
            placeholder="Enter the response text"
            class="tech-textarea"
          />
        </el-form-item>

        <el-form-item label="Priority">
          <el-slider v-model="scriptForm.priority" :min="1" :max="10" show-stops />
        </el-form-item>

        <el-form-item label="Timing">
          <el-switch v-model="scriptForm.is_timing" />
          <span class="form-hint" style="margin-left: 12px">Enable for periodic announcement</span>
        </el-form-item>

        <el-form-item v-if="scriptForm.is_timing" label="Interval">
          <el-input-number v-model="scriptForm.interval" :min="10" :max="3600" :step="10" />
          <span class="form-hint" style="margin-left: 12px">seconds</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddScript = false" class="tech-btn-secondary">Cancel</el-button>
        <el-button type="primary" @click="saveScript" class="tech-btn">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Category {
  id: string
  name: string
  type: string
}

interface Script {
  id: string
  category_id: string
  intent_type: string
  keywords: string
  response_text: string
  priority: number
  use_count?: number
  remark?: string
}

const categories = ref<Category[]>([])
const scripts = ref<Script[]>([])
const selectedCategory = ref('')
const showAddScript = ref(false)
const showAddCategory = ref(false)
const editingScript = ref<Script | null>(null)

const scriptForm = reactive({
  category_id: '',
  intent_type: 'chat',
  keywords: '',
  response_text: '',
  priority: 5,
  is_timing: false,
  interval: 60
})

const filtered话术库 = computed(() => {
  if (!selectedCategory.value) return scripts.value
  return scripts.value.filter(s => s.category_id === selectedCategory.value)
})

function getCategoryIcon(type: string): string {
  const icons: Record<string, string> = {
    chat: '💬',
    price: '💰',
    logistics: '📦',
    aftersale: '🛠️',
    size: '📏',
    discount: '🎁',
    timing: '⏰'
  }
  return icons[type] || '📝'
}

function getIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    chat: '弹幕',
    price: '价格',
    logistics: '物流',
    aftersale: '售后',
    size: '规格',
    discount: '优惠',
    ad: '推广'
  }
  return labels[intent] || intent.toUpperCase()
}

function parseKeywords(keywords: string): string[] {
  return keywords.split(',').map(k => k.trim()).filter(k => k)
}

function isTimingScript(script: Script): boolean {
  return script.remark?.startsWith('timing:') || false
}

function parseTimingInterval(remark?: string): number {
  if (!remark?.startsWith('timing:')) return 60
  return parseInt(remark.replace('timing:', '')) || 60
}

function getScriptCount(categoryId: string): number {
  return scripts.value.filter(s => s.category_id === categoryId).length
}

async function loadData() {
  try {
    const [cats, scrs] = await Promise.all([
      window.windv.category.list(),
      window.windv.script.list()
    ])
    categories.value = cats
    scripts.value = scrs
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

function editScript(script: Script) {
  editingScript.value = script
  scriptForm.category_id = script.category_id
  scriptForm.intent_type = script.intent_type
  scriptForm.keywords = script.keywords
  scriptForm.response_text = script.response_text
  scriptForm.priority = script.priority
  scriptForm.is_timing = isTimingScript(script)
  scriptForm.interval = parseTimingInterval(script.remark)
  showAddScript.value = true
}

async function duplicateScript(script: Script) {
  try {
    const newScript = {
      category_id: script.category_id,
      intent_type: script.intent_type,
      keywords: script.keywords,
      response_text: script.response_text,
      priority: script.priority
    }
    await window.windv.script.create(newScript)
    ElMessage.success('话术已复制')
    loadData()
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

async function deleteScript(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此话术吗？', '确认', { type: 'warning' })
    await window.windv.script.delete(id)
    ElMessage.success('话术已删除')
    loadData()
  } catch (error) {
    // Cancelled
  }
}

async function saveScript() {
  try {
    const data = {
      category_id: scriptForm.category_id,
      intent_type: scriptForm.intent_type,
      keywords: scriptForm.keywords,
      response_text: scriptForm.response_text,
      priority: scriptForm.priority,
      remark: scriptForm.is_timing ? `timing:${scriptForm.interval}` : ''
    }
    
    if (editingScript.value) {
      await window.windv.script.update({ id: editingScript.value.id, ...data })
      ElMessage.success('话术已更新')
    } else {
      await window.windv.script.create(data)
      ElMessage.success('话术已创建')
    }
    
    showAddScript.value = false
    editingScript.value = null
    resetForm()
    loadData()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

function resetForm() {
  scriptForm.category_id = categories.value[0]?.id || ''
  scriptForm.intent_type = 'chat'
  scriptForm.keywords = ''
  scriptForm.response_text = ''
  scriptForm.priority = 5
  scriptForm.is_timing = false
  scriptForm.interval = 60
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.script-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2a 100%);
  position: relative;
  overflow: hidden;
}

// Background Animation
.bg-animation {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.bg-glow {
  position: absolute;
  top: -30%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(180, 50, 255, 0.1) 0%, transparent 70%);
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

// Glass Sidebar
.glass-sidebar {
  background: rgba(20, 20, 40, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.logo-container {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-glow {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tagline {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.tech-menu {
  flex: 1;
  border: none;
  padding: 16px 12px;
}

.menu-item {
  margin: 8px 0;
  border-radius: 12px;
  height: 48px;
  line-height: 48px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: rgba(0, 212, 255, 0.1) !important;
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 153, 255, 0.1) 100%) !important;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
}

// Main Container
.main-container {
  position: relative;
  z-index: 1;
}

// Header
.glass-header {
  background: rgba(20, 20, 40, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-highlight {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.title-sub {
  font-size: 24px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.5);
}

.title-divider {
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #00d4ff 0%, transparent 100%);
  border-radius: 2px;
  margin-left: 8px;
}

.tech-btn-glow {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  border: none;
  color: #fff;
  font-weight: 500;
  border-radius: 10px;
  padding: 12px 24px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  transition: all 0.3s;
}

.tech-btn-glow:hover {
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  transform: translateY(-2px);
}

// Main Content
.main-content {
  padding: 24px 32px;
}

// Category Bar
.category-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
  padding: 4px;
}

.category-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
}

.category-chip.active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 153, 255, 0.1) 100%);
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}

.category-chip.add {
  padding: 10px;
  aspect-ratio: 1;
}

.category-icon {
  font-size: 16px;
}

.category-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.category-count {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  color: #00d4ff;
}

// Script Grid
.script-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.script-card {
  position: relative;
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
}

.script-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-4px);
}

.script-card.is-timing {
  border-color: rgba(255, 200, 0, 0.3);
}

.script-card.is-timing:hover {
  border-color: rgba(255, 200, 0, 0.5);
  box-shadow: 0 0 20px rgba(255, 200, 0, 0.1);
}

.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.script-card:hover .card-glow {
  opacity: 1;
}

.script-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.intent-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.intent-badge.chat { background: rgba(100, 100, 255, 0.2); color: #9999ff; }
.intent-badge.price { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.intent-badge.logistics { background: rgba(255, 200, 0, 0.2); color: #ffc800; }
.intent-badge.aftersale { background: rgba(255, 100, 100, 0.2); color: #ff6464; }
.intent-badge.size { background: rgba(180, 100, 255, 0.2); color: #b464ff; }
.intent-badge.discount { background: rgba(255, 150, 50, 0.2); color: #ff9632; }

.script-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.action-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: #00d4ff;
}

.action-btn.delete:hover {
  background: rgba(255, 100, 100, 0.1);
  border-color: rgba(255, 100, 100, 0.3);
  color: #ff6464;
}

.script-body {
  padding: 20px;
}

.section-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.keywords-section {
  margin-bottom: 16px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.keyword-tag.chat { background: rgba(100, 100, 255, 0.1); border-color: rgba(100, 100, 255, 0.3); }
.keyword-tag.price { background: rgba(0, 255, 136, 0.1); border-color: rgba(0, 255, 136, 0.3); }
.keyword-tag.logistics { background: rgba(255, 200, 0, 0.1); border-color: rgba(255, 200, 0, 0.3); }
.keyword-tag.aftersale { background: rgba(255, 100, 100, 0.1); border-color: rgba(255, 100, 100, 0.3); }

.response-section {
  margin-bottom: 16px;
}

.response-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.timing-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 200, 0, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #ffc800;
}

.script-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.priority-badge.p1, .priority-badge.p2 { background: rgba(255, 100, 100, 0.2); color: #ff6464; }
.priority-badge.p3, .priority-badge.p4 { background: rgba(255, 150, 50, 0.2); color: #ff9632; }
.priority-badge.p5, .priority-badge.p6 { background: rgba(255, 200, 0, 0.2); color: #ffc800; }
.priority-badge.p7, .priority-badge.p8 { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.priority-badge.p9, .priority-badge.p10 { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }

.usage-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

// Add Card
.add-card {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: rgba(30, 30, 60, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.add-card:hover {
  border-color: rgba(0, 212, 255, 0.5);
  background: rgba(0, 212, 255, 0.05);
}

.add-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
}

.add-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.add-text {
  font-size: 14px;
}

// Dialog
:deep(.tech-dialog) {
  background: rgba(20, 20, 40, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

:deep(.tech-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 20px 24px;
}

:deep(.tech-dialog .el-dialog__title) {
  color: #fff;
  font-weight: 600;
}

:deep(.tech-dialog .el-dialog__body) {
  padding: 24px;
}

.tech-form :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.7);
}

.tech-input :deep(.el-input__wrapper),
.tech-select-full :deep(.el-input__wrapper),
.tech-textarea :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
  color: #fff;
}

.tech-textarea :deep(.el-textarea__inner) {
  resize: none;
}

.form-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

// Slider
:deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-slider__bar) {
  background: linear-gradient(90deg, #00d4ff 0%, #0099ff 100%);
}

:deep(.el-slider__button) {
  border-color: #00d4ff;
  background: #00d4ff;
}

// Switch
:deep(.el-switch__core) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  border-color: transparent;
}

// Buttons
.tech-btn {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  border: none;
  color: #fff;
}

.tech-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

// Scrollbar
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

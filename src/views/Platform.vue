<template>
  <div class="platform-page">
    <!-- Animated Background -->
    <div class="bg-animation">
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
    </div>
    
    <el-container>
      <!-- Sidebar -->
      <el-aside width="220" class="glass-sidebar">
        <div class="logo-container">
          <div class="logo-glow">
            <img src="/icon.png" class="logo-img" alt="Logo" />
          </div>
          <div class="logo-text">
            <span class="brand">小狐狸</span>
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
              <span class="title-highlight">平台</span>
              <span class="title-sub">Adapter</span>
              <span class="title-divider"></span>
            </h2>
          </div>
          <div class="header-right">
            <el-button type="primary" class="tech-btn-glow" @click="showAddRoom = true">
              <el-icon><Plus /></el-icon>
              添加房间
            </el-button>
          </div>
        </el-header>

        <el-main class="main-content">
          <!-- 平台 Stats -->
          <el-row :gutter="20" class="stats-row">
            <el-col :xs="24" :sm="12" :md="8">
              <div class="platform-stat-card">
                <div class="stat-glow blue"></div>
                <div class="stat-content">
                  <div class="stat-icon platform-taobao">🛒</div>
                  <div class="stat-info">
                    <div class="stat-value">{{ platformStats.taobao }}</div>
                    <div class="stat-label">Taobao Rooms</div>
                  </div>
                </div>
                <div class="stat-bar">
                  <div class="bar-fill" :style="{ width: get平台Percent('taobao') + '%' }"></div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="platform-stat-card">
                <div class="stat-glow orange"></div>
                <div class="stat-content">
                  <div class="stat-icon platform-pdd">🎁</div>
                  <div class="stat-info">
                    <div class="stat-value">{{ platformStats.pinduoduo }}</div>
                    <div class="stat-label">Pinduoduo Rooms</div>
                  </div>
                </div>
                <div class="stat-bar">
                  <div class="bar-fill orange" :style="{ width: get平台Percent('pinduoduo') + '%' }"></div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="platform-stat-card">
                <div class="stat-glow purple"></div>
                <div class="stat-content">
                  <div class="stat-icon platform-douyin">🎵</div>
                  <div class="stat-info">
                    <div class="stat-value">{{ platformStats.douyin }}</div>
                    <div class="stat-label">Douyin Rooms</div>
                  </div>
                </div>
                <div class="stat-bar">
                  <div class="bar-fill purple" :style="{ width: get平台Percent('douyin') + '%' }"></div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- Room List -->
          <div class="section-header">
            <div class="section-title">
              <span class="title-dot active"></span>
              <span>Live Rooms</span>
            </div>
            <div class="section-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索房间..."
                class="tech-search"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="filter平台" placeholder="选择平台" class="tech-select">
                <el-option label="全部平台" value="" />
                <el-option label="淘宝" value="taobao" />
                <el-option label="拼多多" value="pinduoduo" />
                <el-option label="抖音" value="douyin" />
                <el-option label="视频号" value="video_we" />
              </el-select>
            </div>
          </div>

          <div class="rooms-grid">
            <div v-for="room in filteredRooms" :key="room.id" class="room-card" :class="room.status">
              <div class="card-glow"></div>
              <div class="room-header">
                <div class="platform-badge" :class="room.platform">
                  <img :src="get平台Icon(room.platform)" class="platform-icon" />
                  <span class="platform-name">{{ get平台Name(room.platform) }}</span>
                </div>
                <div class="room-status-badge" :class="room.status">
                  <span class="status-dot"></span>
                  {{ room.status === 'monitoring' ? 'LIVE' : 'OFFLINE' }}
                </div>
              </div>
              
              <div class="room-body">
                <h3 class="room-name">{{ room.name }}</h3>
                <div class="room-id">ID: {{ room.room_id }}</div>
                <div class="room-stats">
                  <div class="room-stat">
                    <el-icon><ChatLineRound /></el-icon>
                    <span>{{ room.danmaku_count || 0 }}</span>
                  </div>
                  <div class="room-stat">
                    <el-icon><Message /></el-icon>
                    <span>{{ room.reply_count || 0 }}</span>
                  </div>
                </div>
              </div>

              <div class="room-actions">
                <el-button 
                  :type="room.status === 'monitoring' ? 'warning' : 'success'"
                  class="action-btn-main"
                  @click="toggleRoom(room)"
                >
                  <el-icon v-if="room.status === 'monitoring'"><VideoPause /></el-icon>
                  <el-icon v-else><VideoPlay /></el-icon>
                  {{ room.status === 'monitoring' ? '停止' : '启动' }}
                </el-button>
                <el-button class="action-btn-secondary" @click="editRoom(room)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button class="action-btn" @click="configureRoomScripts(room)" title="话术配置">
                  <el-icon><ChatDotRound /></el-icon>
                </el-button>
                <el-button class="action-btn-danger" @click="deleteRoom(room.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 添加房间 Card -->
            <div class="room-card add-card" @click="showAddRoom = true">
              <div class="add-content">
                <div class="add-icon">
                  <el-icon><Plus /></el-icon>
                </div>
                <div class="add-text">添加新房间</div>
              </div>
            </div>
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- Add/编辑房间 Dialog -->
    <el-dialog
      v-model="showAddRoom"
      :title="editingRoom ? '编辑房间' : '添加房间'"
      width="500px"
      class="tech-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="roomForm" label-width="100px" class="tech-form">
        <el-form-item label="选择平台">
          <el-select v-model="roomForm.platform" class="tech-select-full">
            <el-option label="淘宝直播" value="taobao">
              <span style="margin-right: 8px">🛒</span> Taobao Live
            </el-option>
            <el-option label="拼多多直播" value="pinduoduo">
              <span style="margin-right: 8px">🎁</span> Pinduoduo Live
            </el-option>
            <el-option label="抖音直播" value="douyin">
              <span style="margin-right: 8px">🎵</span> Douyin Live
            </el-option>
            <el-option label="视频号" value="video_we">
              <span style="margin-right: 8px">📱</span> Video Channel
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="Room Name">
          <el-input v-model="roomForm.name" placeholder="输入房间名称" class="tech-input" />
        </el-form-item>
        
        <el-form-item label="Room ID">
          <el-input v-model="roomForm.room_id" placeholder="输入房间ID" class="tech-input" />
          <div class="form-hint">Found in the live room URL</div>
        </el-form-item>
        
        <el-form-item label="Stream URL">
          <el-input v-model="roomForm.stream_url" placeholder="输入直播地址" class="tech-input" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddRoom = false" class="tech-btn-secondary">取消</el-button>
        <el-button type="primary" @click="saveRoom" class="tech-btn">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 房间话术配置 Dialog -->
    <el-dialog v-model="showRoomScripts" :title="`话术配置 - ${currentRoom?.name || ''}`" width="800px">
      <div class="room-scripts-config">
        <div class="config-header">
          <span>为当前房间配置专属话术，留空则使用全局话术</span>
        </div>
        
        <el-tabs v-model="scriptTab">
          <el-tab-pane label="专属话术" name="room">
            <div class="script-list">
              <el-table :data="roomScripts" stripe style="width: 100%">
                <el-table-column prop="keywords" label="关键词" width="150" />
                <el-table-column prop="responses" label="回复内容" />
                <el-table-column prop="category_name" label="分类" width="100" />
                <el-table-column label="优先级" width="80">
                  <template #default="{ row }">
                    <el-input-number v-model="row.priority" :min="0" :max="100" size="small" @change="updateRoomScriptPriority(row)" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ row }">
                    <el-button type="danger" size="small" @click="removeRoomScript(row.id)">移除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="添加话术" name="add">
            <div class="add-script-form">
              <el-form :model="scriptForm" label-width="100px">
                <el-form-item label="话术分类">
                  <el-select v-model="scriptForm.categoryId" placeholder="选择分类" style="width: 100%">
                    <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="关键词">
                  <el-input v-model="scriptForm.keywords" placeholder="输入关键词，逗号分隔" />
                </el-form-item>
                <el-form-item label="回复内容">
                  <el-input v-model="scriptForm.responses" type="textarea" :rows="3" placeholder="输入回复内容" />
                </el-form-item>
                <el-form-item label="优先级">
                  <el-input-number v-model="scriptForm.priority" :min="0" :max="100" />
                </el-form-item>
              </el-form>
              <div class="form-actions">
                <el-button type="primary" @click="addRoomScript">添加专属话术</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="全局话术" name="global">
            <div class="global-scripts">
              <el-table :data="globalScripts" stripe style="width: 100%">
                <el-table-column prop="keywords" label="关键词" width="150" />
                <el-table-column prop="responses" label="回复内容" />
                <el-table-column prop="category_name" label="分类" width="100" />
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="addToRoomScripts(row)">添加到房间</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Room {
  id: string
  name: string
  platform: string
  room_id: string
  stream_url: string
  status: 'monitoring' | 'paused' | 'error'
  danmaku_count?: number
  reply_count?: number
}

const rooms = ref<Room[]>([])
const showAddRoom = ref(false)
const showRoomScripts = ref(false)
const editingRoom = ref<Room | null>(null)
const currentRoom = ref<Room | null>(null)
const searchQuery = ref('')
const filter平台 = ref('')
const scriptTab = ref('room')
const categories = ref<{ id: string; name: string; color: string }[]>([])

const roomScripts = ref<any[]>([])
const globalScripts = ref<any[]>([])

const scriptForm = reactive({
  categoryId: '',
  keywords: '',
  responses: '',
  priority: 0
})

const roomForm = reactive({
  platform: 'taobao',
  name: '',
  room_id: '',
  stream_url: ''
})

const platformStats = computed(() => {
  const stats = { taobao: 0, pinduoduo: 0, douyin: 0, video_we: 0 }
  rooms.value.forEach(room => {
    if (stats.hasOwnProperty(room.platform)) {
      stats[room.platform as keyof typeof stats]++
    }
  })
  return stats
})

const totalRooms = computed(() => rooms.value.length)

const filteredRooms = computed(() => {
  return rooms.value.filter(room => {
    const matchSearch = !searchQuery.value || 
      room.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      room.room_id.includes(searchQuery.value)
    const match平台 = !filter平台.value || room.platform === filter平台.value
    return matchSearch && match平台
  })
})

function get平台Percent(platform: string): number {
  if (totalRooms.value === 0) return 0
  return (platformStats.value[platform as keyof typeof platformStats.value] / totalRooms.value) * 100
}

function get平台Icon(platform: string): string {
  const icons: Record<string, string> = {
    taobao: 'https://img.alicdn.com/tfs/TB1Ly5oS3HqK1RjSZFPXXcwapXa-32-32.png',
    pinduoduo: 'https://cdn.pinduoduo.com/upload/home/img/common/pdd_logo.png',
    douyin: 'https://lf-dw.tiktok.com/obj/tiktok-web-tx/tiktok-logo.png',
    video_we: '/video-we-icon.png'
  }
  return icons[platform] || '/default-icon.png'
}

function get平台Name(platform: string): string {
  const names: Record<string, string> = {
    taobao: '淘宝',
    pinduoduo: 'PDD',
    douyin: '抖音',
    video_we: '视频'
  }
  return names[platform] || platform
}

async function loadRooms() {
  try {
    const data = await window.windv.room.list()
    rooms.value = data
  } catch (error) {
    ElMessage.error('Failed to load rooms')
  }
}

async function toggleRoom(room: Room) {
  try {
    if (room.status === 'monitoring') {
      await window.windv.room.stop(room.id)
      ElMessage.success('Room stopped')
    } else {
      await window.windv.room.start(room.id)
      ElMessage.success('Room started')
    }
    loadRooms()
  } catch (error) {
    ElMessage.error('Operation failed')
  }
}

function editRoom(room: Room) {
  editingRoom.value = room
  roomForm.platform = room.platform
  roomForm.name = room.name
  roomForm.room_id = room.room_id
  roomForm.stream_url = room.stream_url
  showAddRoom.value = true
}

async function configureRoomScripts(room: Room) {
  currentRoom.value = room
  showRoomScripts.value = true
  scriptTab.value = 'room'
  
  try {
    // 加载分类
    const cats = await window.windv.category.list()
    categories.value = cats
    
    // 加载房间专属话术
    roomScripts.value = await (window.windv as any).roomScript?.list?.({ roomId: room.id }) || []
    
    // 加载全局话术
    globalScripts.value = await (window.windv as any).roomScript?.getAvailable?.({ roomId: room.id }) || []
  } catch (error) {
    console.error('加载话术失败', error)
  }
}

async function addRoomScript() {
  if (!currentRoom.value || !scriptForm.keywords || !scriptForm.responses) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await (window.windv as any).roomScript?.add?.({
      roomId: currentRoom.value.id,
      scriptId: '',
      config: scriptForm
    })
    ElMessage.success('话术已添加')
    configureRoomScripts(currentRoom.value)
    scriptForm.keywords = ''
    scriptForm.responses = ''
    scriptForm.priority = 0
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

async function addToRoomScripts(script: any) {
  if (!currentRoom.value) return
  
  try {
    await (window.windv as any).roomScript?.add?.({
      roomId: currentRoom.value.id,
      scriptId: script.id,
      config: { categoryId: script.category_id, priority: script.priority }
    })
    ElMessage.success('话术已添加到房间')
    configureRoomScripts(currentRoom.value)
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

async function removeRoomScript(roomScriptId: string) {
  if (!currentRoom.value) return
  
  try {
    await ElMessageBox.confirm('确定要从房间移除此话术吗？', '确认', { type: 'warning' })
    await (window.windv as any).roomScript?.remove?.({
      roomId: currentRoom.value.id,
      roomScriptId
    })
    ElMessage.success('话术已移除')
    configureRoomScripts(currentRoom.value)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败')
    }
  }
}

async function updateRoomScriptPriority(row: any) {
  try {
    await (window.windv as any).roomScript?.update?.({
      roomScriptId: row.id,
      updates: { priority: row.priority }
    })
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

async function deleteRoom(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个房间吗？', '确认', {
      type: 'warning'
    })
    await window.windv.room.delete(id)
    ElMessage.success('Room deleted')
    loadRooms()
  } catch (error) {
    // 取消led
  }
}

async function saveRoom() {
  try {
    const data = { ...roomForm }
    if (editingRoom.value) {
      await window.windv.room.update({ id: editingRoom.value.id, ...data })
      ElMessage.success('Room updated')
    } else {
      await window.windv.room.create(data)
      ElMessage.success('Room created')
    }
    showAddRoom.value = false
    editingRoom.value = null
    resetForm()
    loadRooms()
  } catch (error) {
    ElMessage.error('保存 failed')
  }
}

function resetForm() {
  roomForm.platform = 'taobao'
  roomForm.name = ''
  roomForm.room_id = ''
  roomForm.stream_url = ''
}

onMounted(() => {
  loadRooms()
})
</script>

<style lang="scss" scoped>
.platform-page {
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
  border-radius: 50%;
  filter: blur(100px);
  animation: glowPulse 4s ease-in-out infinite;
}

.bg-glow-1 {
  top: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
}

.bg-glow-2 {
  bottom: -20%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, transparent 70%);
  animation-delay: 2s;
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

// Stats Row
.stats-row {
  margin-bottom: 32px;
}

.platform-stat-card {
  position: relative;
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  overflow: hidden;
  transition: all 0.3s;
}

.platform-stat-card:hover {
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateY(-2px);
}

.stat-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-glow.blue {
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
}

.stat-glow.orange {
  background: radial-gradient(circle, rgba(255, 150, 50, 0.15) 0%, transparent 70%);
}

.stat-glow.purple {
  background: radial-gradient(circle, rgba(180, 50, 255, 0.15) 0%, transparent 70%);
}

.platform-stat-card:hover .stat-glow {
  opacity: 1;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.platform-taobao {
  background: linear-gradient(135deg, rgba(255, 80, 0, 0.2) 0%, rgba(255, 80, 0, 0.05) 100%);
}

.platform-pdd {
  background: linear-gradient(135deg, rgba(255, 150, 50, 0.2) 0%, rgba(255, 150, 50, 0.05) 100%);
}

.platform-douyin {
  background: linear-gradient(135deg, rgba(180, 50, 255, 0.2) 0%, rgba(180, 50, 255, 0.05) 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #0099ff 100%);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.bar-fill.orange {
  background: linear-gradient(90deg, #ff9632 0%, #ff6400 100%);
}

.bar-fill.purple {
  background: linear-gradient(90deg, #b432ff 0%, #8000ff 100%);
}

// Section Header
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.title-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.title-dot.active {
  background: #00ff88;
  box-shadow: 0 0 8px #00ff88;
  animation: pulse 2s infinite;
}

.section-actions {
  display: flex;
  gap: 12px;
}

.tech-search {
  width: 240px;
}

.tech-select {
  width: 140px;
}

// Rooms Grid
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.room-card {
  position: relative;
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
}

.room-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-4px);
}

.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.room-card:hover .card-glow {
  opacity: 1;
}

.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.platform-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.platform-badge.taobao {
  background: rgba(255, 80, 0, 0.15);
  color: #ff5000;
}

.platform-badge.pinduoduo {
  background: rgba(255, 150, 50, 0.15);
  color: #ff9632;
}

.platform-badge.douyin {
  background: rgba(180, 50, 255, 0.15);
  color: #b432ff;
}

.platform-badge.video_we {
  background: rgba(0, 200, 100, 0.15);
  color: #00c864;
}

.platform-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.room-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.room-status-badge.monitoring {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

.room-status-badge.paused, .room-status-badge.error {
  background: rgba(255, 100, 100, 0.15);
  color: #ff6464;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.room-body {
  padding: 20px;
}

.room-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px;
}

.room-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Courier New', monospace;
}

.room-stats {
  display: flex;
  gap: 20px;
  margin-top: 16px;
}

.room-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.room-stat .el-icon {
  font-size: 16px;
}

.room-actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.action-btn-main {
  flex: 1;
}

.action-btn-secondary, .action-btn-danger {
  width: 40px;
  padding: 0;
}

// Add Card
.add-card {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: rgba(30, 30, 60, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
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
.tech-select-full :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.tech-input :deep(.el-input__inner),
.tech-select-full :deep(.el-input__inner) {
  color: #fff;
}

.form-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

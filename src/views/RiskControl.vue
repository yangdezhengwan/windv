<template>
  <div class="risk-page">
    <el-container>
      <el-aside width="200px">
        <div class="logo">
          <span class="logo-icon">📺</span>
          <span class="logo-text">无人直播助手</span>
        </div>
        <el-menu :default-active="$route.path" :router="true" background-color="#1a1a2e" text-color="#fff" active-text-color="#409EFF">
          <el-menu-item index="/"><el-icon><DataAnalysis /></el-icon><span>仪表盘</span></el-menu-item>
          <el-menu-item index="/platform"><el-icon><Monitor /></el-icon><span>平台适配</span></el-menu-item>
          <el-menu-item index="/script"><el-icon><ChatDotRound /></el-icon><span>话术库</span></el-menu-item>
          <el-menu-item index="/risk"><el-icon><Shield /></el-icon><span>风控设置</span></el-menu-item>
          <el-menu-item index="/stats"><el-icon><DataLine /></el-icon><span>数据报表</span></el-menu-item>
          <el-menu-item index="/settings"><el-icon><Setting /></el-icon><span>系统设置</span></el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header><h2>风控设置</h2></el-header>
        <el-main>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="settings-card">
                <template #header><span>真人模拟设置</span></template>
                <el-form label-width="120px">
                  <el-form-item label="最小回复延迟">
                    <el-input-number v-model="settings.min_delay" :min="500" :max="10000" :step="100" />
                    <span class="unit">ms</span>
                  </el-form-item>
                  <el-form-item label="最大回复延迟">
                    <el-input-number v-model="settings.max_delay" :min="1000" :max="30000" :step="100" />
                    <span class="unit">ms</span>
                  </el-form-item>
                  <el-form-item label="每分钟最大回复">
                    <el-input-number v-model="settings.max_per_minute" :min="5" :max="100" />
                    <span class="unit">条/分钟</span>
                  </el-form-item>
                  <el-form-item label="随机延迟开关">
                    <el-switch v-model="settings.random_delay_enabled" />
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="settings-card">
                <template #header><span>违禁词过滤</span></template>
                <el-form label-width="120px">
                  <el-form-item label="启用违禁词过滤">
                    <el-switch v-model="settings.sensitive_filter_enabled" />
                  </el-form-item>
                  <el-form-item label="违禁词库">
                    <div class="sensitive-list">
                      <el-tag v-for="word in sensitiveWords" :key="word.id" closable @close="removeWord(word.id)" type="danger" style="margin-right: 5px; margin-bottom: 5px;">
                        {{ word.word }}
                      </el-tag>
                    </div>
                  </el-form-item>
                  <el-form-item label="添加违禁词">
                    <el-input v-model="newWord" placeholder="输入违禁词" style="width: 200px; margin-right: 10px;" />
                    <el-button type="primary" @click="addWord">添加</el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
          </el-row>

          <el-card class="settings-card" style="margin-top: 20px;">
            <template #header>
              <span>频率控制</span>
            </template>
            <el-form label-width="120px" inline>
              <el-form-item label="当前房间">
                <el-select v-model="selectedRoom" placeholder="选择房间" style="width: 200px;">
                  <el-option v-for="room in rooms" :key="room.id" :label="room.name" :value="room.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="使用剩余">
                <el-tag v-if="rateLimitStats">{{ rateLimitStats.remaining }}/{{ rateLimitStats.count }}</el-tag>
              </el-form-item>
            </el-form>
          </el-card>

          <div class="save-btn">
            <el-button type="primary" size="large" @click="saveSettings">保存设置</el-button>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

const settings = reactive({
  min_delay: 1000,
  max_delay: 3000,
  max_per_minute: 20,
  random_delay_enabled: true,
  sensitive_filter_enabled: true
})

const sensitiveWords = ref<{ id: string; word: string }[]>([])
const newWord = ref('')
const rooms = ref<{ id: string; name: string }[]>([])
const selectedRoom = ref('')
const rateLimitStats = ref<{ count: number; remaining: number } | null>(null)

async function loadSettings() {
  const all = await window.windv.settings.getAll()
  settings.min_delay = parseInt(all.min_delay) || 1000
  settings.max_delay = parseInt(all.max_delay) || 3000
  settings.max_per_minute = parseInt(all.max_per_minute) || 20
  settings.random_delay_enabled = all.random_delay_enabled === 'true'
  settings.sensitive_filter_enabled = all.sensitive_filter_enabled !== 'false'
}

async function saveSettings() {
  try {
    await window.windv.settings.set('min_delay', settings.min_delay.toString())
    await window.windv.settings.set('max_delay', settings.max_delay.toString())
    await window.windv.settings.set('max_per_minute', settings.max_per_minute.toString())
    await window.windv.settings.set('random_delay_enabled', settings.random_delay_enabled.toString())
    await window.windv.settings.set('sensitive_filter_enabled', settings.sensitive_filter_enabled.toString())
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

function addWord() {
  if (!newWord.value.trim()) return
  // TODO: 实现添加违禁词
  newWord.value = ''
}

function removeWord(id: string) {
  // TODO: 实现删除违禁词
}

async function loadRooms() {
  rooms.value = await window.windv.room.list()
}

onMounted(() => {
  loadSettings()
  loadRooms()
})
</script>

<style lang="scss" scoped>
.risk-page {
  height: 100vh;
  background-color: #0f0f1a;
  .el-container { height: 100%; }
  .el-aside {
    background-color: #1a1a2e;
    .logo { height: 60px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #2d2d44; .logo-icon { font-size: 24px; margin-right: 10px; } .logo-text { color: #fff; font-size: 16px; font-weight: bold; } }
  }
  .el-header { background-color: #16213e; display: flex; align-items: center; padding: 0 20px; h2 { color: #fff; margin: 0; } }
  .el-main { background-color: #0f0f1a; padding: 20px; }
}

.settings-card {
  background-color: #1a1a2e;
  border: none;
  :deep(.el-card__header) { border-color: #2d2d44; color: #fff; }
}

.unit { margin-left: 10px; color: #888; }
.sensitive-list { max-height: 150px; overflow-y: auto; }
.save-btn { margin-top: 20px; text-align: center; }
</style>

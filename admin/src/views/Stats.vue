<template>
  <div class="stats-page">
    <div class="page-header">
      <h1>📈 数据统计</h1>
      <p>查看系统使用数据和趋势分析</p>
    </div>
    
    <!-- 概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.today.danmaku || 0 }}</div>
            <div class="stat-label">今日弹幕</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon">🤖</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.today.responses || 0 }}</div>
            <div class="stat-label">今日回复</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon">🛒</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.today.orders || 0 }}</div>
            <div class="stat-label">今日订单</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">¥{{ stats.today.revenue || 0 }}</div>
            <div class="stat-label">今日收入</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 月度统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card secondary">
          <div class="stat-info">
            <div class="stat-value">{{ stats.month.totalDanmaku || 0 }}</div>
            <div class="stat-label">本月弹幕</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card secondary">
          <div class="stat-info">
            <div class="stat-value">{{ stats.month.totalResponses || 0 }}</div>
            <div class="stat-label">本月回复</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card secondary">
          <div class="stat-info">
            <div class="stat-value">{{ stats.month.totalOrders || 0 }}</div>
            <div class="stat-label">本月订单</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card secondary">
          <div class="stat-info">
            <div class="stat-value">{{ stats.users?.total || 0 }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 趋势图表 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <div class="chart-header">
            <h3>📊 数据趋势</h3>
            <el-select v-model="trendDays" @change="fetchTrend" size="small">
              <el-option label="近7天" :value="7" />
              <el-option label="近14天" :value="14" />
              <el-option label="近30天" :value="30" />
            </el-select>
          </div>
          <div class="chart-placeholder">
            <p>📈 趋势图表加载中...</p>
            <div v-if="trendData.length" class="trend-list">
              <div v-for="item in trendData" :key="item.date" class="trend-item">
                <span class="trend-date">{{ formatDate(item.date) }}</span>
                <span class="trend-value">弹幕: {{ item.danmakuCount || 0 }} | 回复: {{ item.responseCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 高频问题 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>❓ 高频问题</h3>
            <el-button size="small" @click="fetchHighFreq">刷新</el-button>
          </div>
          <div class="question-list">
            <div 
              v-for="(q, idx) in highFreqQuestions" 
              :key="idx"
              class="question-item"
            >
              <span class="q-rank">{{ idx + 1 }}</span>
              <span class="q-text">{{ q.question }}</span>
              <span class="q-count">{{ q.count }}次</span>
            </div>
            <div v-if="!highFreqQuestions.length" class="empty">
              暂无数据
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>⏰ 时段分布</h3>
          </div>
          <div class="hour-distribution">
            <div 
              v-for="(item, hour) in hourDistribution" 
              :key="hour"
              class="hour-item"
            >
              <span class="hour-label">{{ hour }}:00</span>
              <div class="hour-bar">
                <div 
                  class="hour-fill" 
                  :style="{ width: getHourWidth(item.count) + '%' }"
                ></div>
              </div>
              <span class="hour-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const API_BASE = 'http://sq.kxkj.ltd/api'

const stats = ref({
  today: {},
  month: {},
  users: {}
})
const trendData = ref([])
const trendDays = ref(7)
const highFreqQuestions = ref([])
const hourDistribution = ref({})

const maxHourCount = computed(() => {
  const counts = Object.values(hourDistribution.value).map(h => h.count)
  return Math.max(...counts, 1)
})

async function fetchOverview() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/stats/overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.today) stats.value = data
  } catch (err) {
    console.error('获取统计数据失败', err)
  }
}

async function fetchTrend() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/stats/trend?days=${trendDays.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    trendData.value = data.stats || []
  } catch (err) {
    console.error('获取趋势数据失败', err)
  }
}

async function fetchHighFreq() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/stats/high-freq`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    highFreqQuestions.value = data.questions || []
  } catch (err) {
    console.error('获取高频问题失败', err)
  }
}

async function fetchHourDistribution() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/stats/time-distribution?days=7`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    // 转换为对象格式
    const dist = {}
    ;(data.distribution || []).forEach(item => {
      dist[item.hour] = { count: item.count }
    })
    hourDistribution.value = dist
  } catch (err) {
    console.error('获取时段分布失败', err)
  }
}

function getHourWidth(count) {
  if (!count) return 0
  return Math.round((count / maxHourCount.value) * 100)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchOverview()
  fetchTrend()
  fetchHighFreq()
  fetchHourDistribution()
})
</script>

<style scoped>
.stats-page {
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

.stats-row, .chart-row {
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 150, 255, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card.secondary {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-icon {
  font-size: 36px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.chart-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  min-height: 300px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  color: #fff;
  font-size: 18px;
}

.chart-placeholder {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.trend-list {
  margin-top: 20px;
  text-align: left;
}

.trend-item {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
}

.trend-date {
  color: rgba(255, 255, 255, 0.7);
}

.question-list {
  max-height: 400px;
  overflow-y: auto;
}

.question-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.q-rank {
  width: 30px;
  height: 30px;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00d4ff;
  font-weight: bold;
  margin-right: 12px;
}

.q-text {
  flex: 1;
  color: #fff;
}

.q-count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.hour-distribution {
  max-height: 400px;
  overflow-y: auto;
}

.hour-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.hour-label {
  width: 60px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.hour-bar {
  flex: 1;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 12px;
}

.hour-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0096ff);
  border-radius: 4px;
  transition: width 0.3s;
}

.hour-count {
  width: 50px;
  text-align: right;
  color: rgba(255, 255, 255, 0.7);
}

.empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px;
}
</style>
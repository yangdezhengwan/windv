<template>
  <div class="stats-page">
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
              <span class="title-highlight">Data</span>
              <span class="title-sub">Analytics</span>
              <span class="title-divider"></span>
            </h2>
          </div>
          <div class="header-right">
            <div class="date-range">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="loadData"
                class="tech-search"
              />
            </div>
            <el-button type="primary" class="tech-btn-glow" @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </el-header>

        <el-main class="main-content">
          <!-- Stats Summary -->
          <el-row :gutter="20" class="stats-row">
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow blue"></div>
                <div class="stat-icon danmaku">
                  <el-icon><ChatLineSquare /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ compareStats.todayDanmaku }}</div>
                  <div class="stat-label">Total Danmaku</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow green"></div>
                <div class="stat-icon reply">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ compareStats.yesterdayDanmaku }}</div>
                  <div class="stat-label">Yesterday</div>
                </div>
                <div class="stat-trend" :class="compareStats.change >= 0 ? 'up' : 'down'">
                  {{ compareStats.change >= 0 ? '+' : '' }}{{ compareStats.change }}%
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow orange"></div>
                <div class="stat-icon order">
                  <el-icon><Goods /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ historyStats.reduce((sum, s) => sum + (s.order_new_count || 0), 0) }}</div>
                  <div class="stat-label">Total Orders</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-glow blue"></div>
                <div class="stat-icon danmaku">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ historyStats.length }}</div>
                  <div class="stat-label">Data Days</div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- Charts Row 1 -->
          <el-row :gutter="20" class="section-row">
            <el-col :xs="24" :lg="12">
              <div class="tech-card full-width">
                <div class="card-header">
                  <span>弹幕意图分布</span>
                </div>
                <div ref="intentChartRef" class="chart-container"></div>
              </div>
            </el-col>
            <el-col :xs="24" :lg="12">
              <div class="tech-card full-width">
                <div class="card-header">
                  <span>每日数据趋势</span>
                </div>
                <div ref="trendChartRef" class="chart-container"></div>
              </div>
            </el-col>
          </el-row>
          
          <!-- Charts Row 2 -->
          <el-row :gutter="20" class="section-row">
            <el-col :xs="24" :lg="12">
              <div class="tech-card full-width">
                <div class="card-header">
                  <span>高频问题 TOP 10</span>
                </div>
                <div ref="topQuestionsChartRef" class="chart-container"></div>
              </div>
            </el-col>
            <el-col :xs="24" :lg="12">
              <div class="tech-card full-width">
                <div class="card-header">
                  <span>活跃时段分析</span>
                </div>
                <div ref="activityChartRef" class="chart-container"></div>
              </div>
            </el-col>
          </el-row>
          
          <!-- Charts Row 3 -->
          <el-row :gutter="20" class="section-row">
            <el-col :xs="24" :lg="12">
              <div class="tech-card full-width">
                <div class="card-header">
                  <span>转化率漏斗</span>
                </div>
                <div ref="funnelChartRef" class="chart-container"></div>
              </div>
            </el-col>
            <el-col :xs="24" :lg="12">
              <div class="tech-card full-width">
                <div class="card-header">
                  <span>数据对比</span>
                </div>
                <div class="compare-info">
                  <div class="compare-item">
                    <span class="label">今日弹幕</span>
                    <span class="value">{{ compareStats.todayDanmaku }}</span>
                  </div>
                  <div class="compare-item">
                    <span class="label">昨日弹幕</span>
                    <span class="value">{{ compareStats.yesterdayDanmaku }}</span>
                  </div>
                  <div class="compare-item">
                    <span class="label">变化</span>
                    <span class="value" :class="compareStats.change >= 0 ? 'up' : 'down'">
                      {{ compareStats.change >= 0 ? '+' : '' }}{{ compareStats.change }}%
                    </span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- History Table -->
          <div class="tech-card full-width">
            <div class="card-header">
              <span>历史统计</span>
              <el-button type="primary" class="tech-btn-glow" @click="exportData">
                <el-icon><Download /></el-icon>
                导出Excel
              </el-button>
            </div>
            <el-table :data="historyStats" stripe class="tech-table">
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="danmaku_count" label="弹幕数" width="100" />
              <el-table-column prop="reply_count" label="回复数" width="100" />
              <el-table-column label="回复率" width="100">
                <template #default="{ row }">
                  {{ row.reply_count > 0 ? Math.round((row.reply_success_count || 0) / row.reply_count * 100) + '%' : '0%' }}
                </template>
              </el-table-column>
              <el-table-column prop="order_new_count" label="订单数" width="100" />
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-button size="small" type="primary" @click="viewDetail(row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="数据详情" width="600px">
      <div v-if="detailData" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日期">{{ detailData.date }}</el-descriptions-item>
          <el-descriptions-item label="弹幕总数">{{ detailData.danmaku_count }}</el-descriptions-item>
          <el-descriptions-item label="回复总数">{{ detailData.reply_count }}</el-descriptions-item>
          <el-descriptions-item label="回复成功">{{ detailData.reply_success_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="回复率">{{ detailData.reply_count > 0 ? Math.round(detailData.reply_success_count / detailData.reply_count * 100) + '%' : '0%' }}</el-descriptions-item>
          <el-descriptions-item label="新订单">{{ detailData.order_new_count || 0 }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin-top: 20px; color: #fff;">意图分布</h4>
        <div v-if="detailData.top_intents">
          <el-tag v-for="intent in JSON.parse(detailData.top_intents)" :key="intent.type" style="margin-right: 10px; margin-bottom: 10px;" type="info">
            {{ getIntentName(intent.type) }}: {{ intent.count }}
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const historyStats = ref<any[]>([])
const intentChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const topQuestionsChartRef = ref<HTMLElement | null>(null)
const activityChartRef = ref<HTMLElement | null>(null)
const funnelChartRef = ref<HTMLElement | null>(null)
const dateRange = ref<[Date, Date]>([
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
])

const compareStats = reactive({
  todayDanmaku: 0,
  yesterdayDanmaku: 0,
  change: 0
})

const detailVisible = ref(false)
const detailData = ref<any>(null)

async function loadData() {
  // 使用日期范围或默认最近7天
  let startDate: string, endDate: string
  
  if (dateRange.value && dateRange.value.length === 2) {
    startDate = dateRange.value[0].toISOString().split('T')[0]
    endDate = dateRange.value[1].toISOString().split('T')[0]
  } else {
    endDate = new Date().toISOString().split('T')[0]
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
  
  historyStats.value = await window.windv.stats.getHistory({ startDate, endDate })
  
  // 更新所有图表
  updateIntentChart()
  updateTrendChart()
  updateTopQuestionsChart()
  updateActivityChart()
  updateFunnelChart()
  updateCompareStats()
}

function updateIntentChart() {
  if (!intentChartRef.value) return
  
  const chart = echarts.init(intentChartRef.value)
  const intentData = historyStats.value[0]?.top_intents ? JSON.parse(historyStats.value[0].top_intents) : []
  
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: '#fff' } },
    series: [{
      type: 'pie',
      radius: '60%',
      data: intentData.map((item: any) => ({ 
        name: getIntentName(item.type), 
        value: item.count 
      })),
      label: { color: '#fff' },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
}

function updateTrendChart() {
  if (!trendChartRef.value) return
  
  const chart = echarts.init(trendChartRef.value)
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['弹幕', '回复'], textStyle: { color: '#fff' } },
    xAxis: { type: 'category', data: historyStats.value.map(s => s.date), axisLabel: { color: '#fff' } },
    yAxis: { type: 'value', axisLabel: { color: '#fff' } },
    series: [
      { name: '弹幕', type: 'line', data: historyStats.value.map(s => s.danmaku_count) },
      { name: '回复', type: 'line', data: historyStats.value.map(s => s.reply_count) }
    ]
  })
}

// 高频问题 TOP 10
async function updateTopQuestionsChart() {
  if (!topQuestionsChartRef.value) return
  
  const chart = echarts.init(topQuestionsChartRef.value)
  
  try {
    let startDate: string, endDate: string
    if (dateRange.value && dateRange.value.length === 2) {
      startDate = dateRange.value[0].toISOString().split('T')[0]
      endDate = dateRange.value[1].toISOString().split('T')[0]
    } else {
      endDate = new Date().toISOString().split('T')[0]
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
    
    const questions = await window.windv.stats.getHighFrequency({ startDate, endDate, limit: 10 })
    
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { 
        type: 'category', 
        data: questions.map(q => Array.isArray(q.keywords) ? q.keywords[0] : q.keywords),
        axisLabel: { color: '#fff', rotate: 30 }
      },
      yAxis: { type: 'value', axisLabel: { color: '#fff' } },
      series: [{
        type: 'bar',
        data: questions.map(q => q.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#0072ff' }
          ]),
          borderRadius: [5, 5, 0, 0]
        }
      }]
    })
  } catch (error) {
    console.error('获取高频问题失败:', error)
    chart.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#666' } }
    })
  }
}

// 活跃时段分析
async function updateActivityChart() {
  if (!activityChartRef.value) return
  
  const chart = echarts.init(activityChartRef.value)
  
  try {
    let startDate: string, endDate: string
    if (dateRange.value && dateRange.value.length === 2) {
      startDate = dateRange.value[0].toISOString().split('T')[0]
      endDate = dateRange.value[1].toISOString().split('T')[0]
    } else {
      endDate = new Date().toISOString().split('T')[0]
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
    
    const hoursData = await window.windv.stats.getActivityHours({ startDate, endDate })
    
    // 填充 0-23 小时的完整数据
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const activityMap: Record<number, number> = {}
    hoursData.forEach((item: any) => {
      activityMap[parseInt(item.hour)] = item.danmaku_count
    })
    const activity = hours.map((_, i) => activityMap[i] || 0)
    
    // 找出高峰时段（超过平均值的时间段）
    const avg = activity.reduce((a, b) => a + b, 0) / 24
    
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: { type: 'category', data: hours, axisLabel: { color: '#aaa' } },
      yAxis: { type: 'value', axisLabel: { color: '#aaa' } },
      series: [{
        type: 'bar',
        data: activity,
        itemStyle: {
          color: (params: any) => {
            const value = params.value as number
            // 高于平均值的时段用渐变色
            if (value > avg * 1.5) {
              return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#ff6b6b' },
                { offset: 1, color: '#ee5a5a' }
              ])
            } else if (value > avg) {
              return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#ffd93d' },
                { offset: 1, color: '#ffb830' }
              ])
            }
            return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#00d4ff' },
              { offset: 1, color: '#0072ff' }
            ])
          }
        }
      }]
    })
  } catch (error) {
    console.error('获取活跃时段失败:', error)
    chart.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#666' } }
    })
  }
}

// 转化率漏斗图
async function updateFunnelChart() {
  if (!funnelChartRef.value) return
  
  const chart = echarts.init(funnelChartRef.value)
  
  try {
    let startDate: string, endDate: string
    if (dateRange.value && dateRange.value.length === 2) {
      startDate = dateRange.value[0].toISOString().split('T')[0]
      endDate = dateRange.value[1].toISOString().split('T')[0]
    } else {
      endDate = new Date().toISOString().split('T')[0]
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
    
    const funnelData = await window.windv.stats.getConversionFunnel({ startDate, endDate })
    
    // 计算转化率（以弹幕总数为基准）
    const total = funnelData.danmaku_total || 1
    const data = [
      { name: '弹幕总数', value: funnelData.danmaku_total || 0, rate: 100 },
      { name: '意图识别', value: funnelData.intent_matched || 0, rate: Math.round((funnelData.intent_matched || 0) / total * 100) },
      { name: '自动回复', value: funnelData.reply_total || 0, rate: Math.round((funnelData.reply_total || 0) / total * 100) },
      { name: '回复成功', value: funnelData.reply_success || 0, rate: Math.round((funnelData.reply_success || 0) / total * 100) },
      { name: '成交订单', value: funnelData.order_count || 0, rate: Math.round((funnelData.order_count || 0) / total * 100) }
    ]
    
    const colors = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534']
    
    chart.setOption({
      tooltip: { 
        trigger: 'item', 
        formatter: (params: any) => `${params.name}: ${params.value} (${params.data.rate}%)`
      },
      series: [{
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          formatter: (params: any) => `${params.name}\n${params.value} (${params.data.rate}%)`
        },
        labelLine: {
          length: 10,
          lineStyle: { width: 1, color: '#fff' }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          rate: item.rate,
          itemStyle: {
            color: colors[index]
          }
        }))
      }]
    })
  } catch (error) {
    console.error('获取转化率漏斗失败:', error)
    chart.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#666' } }
    })
  }
}

// 数据对比
function updateCompareStats() {
  if (historyStats.value.length >= 2) {
    const today = historyStats.value[0]?.danmaku_count || 0
    const yesterday = historyStats.value[1]?.danmaku_count || 0
    const change = today > 0 ? Math.round((today - yesterday) / yesterday * 100) : 0
    
    compareStats.todayDanmaku = today
    compareStats.yesterdayDanmaku = yesterday
    compareStats.change = change
  }
}

async function exportData() {
  try {
    const result = await window.windv.stats.export({})
    ElMessage.success(`导出成功: ${result.filePath}`)
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

function viewDetail(row: any) {
  detailData.value = row
  detailVisible.value = true
}

function getIntentName(type: string): string {
  const names: Record<string, string> = {
    'chat': '弹幕',
    'price': '价格',
    'logistics': '物流',
    'aftersale': '售后',
    'size': '尺码',
    'discount': '优惠',
    'ad': '广告'
  }
  return names[type] || type
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.stats-page {
  height: 100vh;
  background-color: #0a0a14;
  position: relative;
  overflow: hidden;
}

.bg-animation {
  position: absolute;
  inset: 0;
  z-index: 0;
  .bg-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }
  .bg-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.3;
    animation: float 10s ease-in-out infinite;
    &.bg-glow-1 {
      width: 400px;
      height: 400px;
      background: #409eff;
      top: -100px;
      right: -100px;
    }
    &.bg-glow-2 {
      width: 300px;
      height: 300px;
      background: #67c23a;
      bottom: -50px;
      left: 20%;
      animation-delay: -5s;
    }
  }
}

@keyframes gridMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(50px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

.glass-sidebar {
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 26, 0.98) 100%) !important;
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
}

.logo-container {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  .logo-glow {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #00d4ff, #0072ff);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    .logo-img { width: 28px; height: 28px; }
  }
  .logo-text {
    display: flex;
    flex-direction: column;
    .brand { color: #fff; font-size: 16px; font-weight: 600; }
    .tagline { color: rgba(255, 255, 255, 0.5); font-size: 10px; }
  }
}

.tech-menu {
  border: none !important;
  .menu-item {
    height: 50px;
    line-height: 50px;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
    &:hover { background: rgba(0, 212, 255, 0.1) !important; }
    &.is-active {
      background: rgba(0, 212, 255, 0.15) !important;
      border-left: 3px solid #00d4ff;
    }
    .menu-icon { font-size: 18px; margin-right: 12px; }
  }
}

.main-container { position: relative; z-index: 1; }

.glass-header {
  background: linear-gradient(180deg, rgba(22, 33, 62, 0.9) 0%, rgba(15, 15, 26, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 70px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  .title-highlight { color: #fff; font-size: 24px; font-weight: 600; }
  .title-sub { color: rgba(255, 255, 255, 0.5); font-size: 18px; }
  .title-divider {
    width: 4px;
    height: 24px;
    background: linear-gradient(180deg, #00d4ff, #0072ff);
    border-radius: 2px;
  }
}

.header-right { display: flex; align-items: center; gap: 16px; }

.tech-btn-glow {
  background: linear-gradient(135deg, #00d4ff, #0072ff) !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

.tech-search {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;
    &:hover, &:focus-within { border-color: rgba(0, 212, 255, 0.5); }
  }
  :deep(.el-input__inner) { color: #fff; }
}

.main-content { padding: 24px; position: relative; z-index: 1; }

.stats-row { margin-bottom: 24px; }

.stat-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(15, 15, 26, 0.95) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  &:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); }
  .stat-glow {
    position: absolute;
    top: -50px;
    right: -50px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.3;
    &.blue { background: #409eff; }
    &.green { background: #67c23a; }
    &.orange { background: #e6a23c; }
  }
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
    &.danmaku { background: rgba(64, 158, 255, 0.2); color: #409eff; }
    &.reply { background: rgba(103, 194, 58, 0.2); color: #67c23a; }
    &.order { background: rgba(230, 162, 60, 0.2); color: #e6a23c; }
  }
  .stat-info {
    .stat-value { color: #fff; font-size: 28px; font-weight: 700; }
    .stat-label { color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-top: 4px; }
  }
  .stat-trend {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 12px;
    font-weight: 600;
    &.up { color: #67c23a; }
    &.down { color: #f56c6c; }
  }
}

.tech-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(15, 15, 26, 0.95) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  &.full-width { width: 100%; margin-bottom: 24px; }
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.2);
    color: #fff;
    font-size: 16px;
    font-weight: 500;
  }
  .chart-container { height: 300px; padding: 16px; }
}

.tech-table {
  background: transparent;
  :deep(.el-table__header-wrapper th) {
    background: rgba(64, 158, 255, 0.1) !important;
    color: #fff;
    border-color: rgba(255, 255, 255, 0.05) !important;
  }
  :deep(.el-table__body-wrapper) {
    tr:hover > td { background: rgba(0, 212, 255, 0.05) !important; }
  }
  :deep(td) {
    border-color: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.8);
  }
}

.compare-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  .compare-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    .label { color: rgba(255, 255, 255, 0.6); font-size: 14px; }
    .value { color: #fff; font-size: 20px; font-weight: 600; &.up { color: #67c23a; } &.down { color: #f56c6c; } }
  }
}

.date-range {
  display: flex;
  align-items: center;
  gap: 12px;
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
  :deep(.el-range-input) { color: #fff; }
  :deep(.el-range-separator) { color: rgba(255, 255, 255, 0.4); }
}

.detail-content {
  :deep(.el-descriptions__label) { color: rgba(255, 255, 255, 0.6); }
  :deep(.el-descriptions__content) { color: #fff; }
}
</style>

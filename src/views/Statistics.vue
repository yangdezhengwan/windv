<template>
  <div class="stats-page">
    <el-container>
      <el-aside width="200px">
        <div class="logo"><span class="logo-icon">📺</span><span class="logo-text">小狐狸</span></div>
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
        <el-header>
          <h2>数据报表</h2>
          <div class="date-range">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadData"
            />
            <el-button type="primary" @click="loadData">刷新</el-button>
          </div>
        </el-header>
        <el-main>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header><span>弹幕意图分布</span></template>
                <div ref="intentChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header><span>每日数据趋势</span></template>
                <div ref="trendChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header><span>高频问题 TOP 10</span></template>
                <div ref="topQuestionsChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header><span>活跃时段分析</span></template>
                <div ref="activityChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header><span>转化率漏斗</span></template>
                <div ref="funnelChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header><span>数据对比</span></template>
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
              </el-card>
            </el-col>
          </el-row>

          <el-card class="table-card" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>历史统计</span>
                <el-button type="primary" @click="exportData">导出Excel</el-button>
              </div>
            </template>
            <el-table :data="historyStats" stripe>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="danmaku_count" label="弹幕数" width="100" />
              <el-table-column prop="reply_count" label="回复数" width="100" />
              <el-table-column label="回复率" width="100">
                <template #default="{ row }">
                  {{ row.reply_count > 0 ? Math.round(row.reply_success_count / row.reply_count * 100) + '%' : '0%' }}
                </template>
              </el-table-column>
              <el-table-column prop="order_new_count" label="订单数" width="100" />
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-button size="small" @click="viewDetail(row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
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
  background-color: #0f0f1a;
  .el-container { height: 100%; }
  .el-aside {
    background-color: #1a1a2e;
    .logo { height: 60px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #2d2d44; .logo-icon { font-size: 24px; margin-right: 10px; } .logo-text { color: #fff; font-size: 16px; font-weight: bold; } }
  }
  .el-header { background-color: #16213e; display: flex; align-items: center; padding: 0 20px; h2 { color: #fff; margin: 0; } }
  .el-main { background-color: #0f0f1a; padding: 20px; }
}

.chart-card, .table-card {
  background-color: #1a1a2e;
  border: none;
  :deep(.el-card__header) { border-color: #2d2d44; color: #fff; }
}

.card-header { display: flex; justify-content: space-between; color: #fff; }
</style>

<template>
  <div class="stats-page">
    <el-container>
      <el-aside width="200px">
        <div class="logo"><span class="logo-icon">📺</span><span class="logo-text">无人直播助手</span></div>
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
        <el-header><h2>数据报表</h2></el-header>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const historyStats = ref<any[]>([])
const intentChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)

async function loadData() {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  historyStats.value = await window.windv.stats.getHistory({ startDate, endDate })
  
  // 更新图表
  updateIntentChart()
  updateTrendChart()
}

function updateIntentChart() {
  if (!intentChartRef.value) return
  
  const chart = echarts.init(intentChartRef.value)
  const intentData = historyStats.value[0]?.top_intents ? JSON.parse(historyStats.value[0].top_intents) : []
  
  chart.setOption({
    tooltip: {},
    series: [{
      type: 'pie',
      radius: '60%',
      data: intentData.map((item: any) => ({ name: item.type, value: item.count })),
      label: { color: '#fff' }
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

async function exportData() {
  try {
    const result = await window.windv.stats.export({})
    ElMessage.success(`导出成功: ${result.filePath}`)
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

function viewDetail(row: any) {
  // TODO: 显示详情
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

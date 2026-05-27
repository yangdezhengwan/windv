<template>
  <div class="stats-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">数据统计</h1>
        <p class="page-description">平台运营数据分析</p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        />
        <el-button @click="exportStats">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card" v-for="(item, index) in overviewData" :key="index">
        <div class="card-glow" :style="{ background: item.gradient }"></div>
        <div class="card-content">
          <div class="card-header">
            <span class="card-icon" v-html="item.icon"></span>
            <span class="card-trend" :class="item.trend > 0 ? 'up' : 'down'">
              {{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%
            </span>
          </div>
          <div class="card-value">{{ item.value }}</div>
          <div class="card-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 用户趋势图 -->
      <div class="chart-card large">
        <div class="card-header">
          <h3>用户增长趋势</h3>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="dot" style="background: #00d4ff"></span> 新增用户
            </span>
            <span class="legend-item">
              <span class="dot" style="background: #7c3aed"></span> 活跃用户
            </span>
          </div>
        </div>
        <div class="chart-body">
          <div class="line-chart">
            <div class="chart-bars">
              <div class="bar-group" v-for="(item, index) in userTrendData" :key="index">
                <div class="bars">
                  <div class="bar bar-primary" :style="{ height: item.new + '%' }"></div>
                  <div class="bar bar-secondary" :style="{ height: item.active + '%' }"></div>
                </div>
                <span class="bar-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 授权分布饼图 -->
      <div class="chart-card">
        <div class="card-header">
          <h3>授权类型分布</h3>
        </div>
        <div class="chart-body">
          <div class="pie-chart">
            <svg viewBox="0 0 200 200" class="pie-svg">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#00d4ff" stroke-width="25" stroke-dasharray="330" stroke-dashoffset="0" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="#7c3aed" stroke-width="25" stroke-dasharray="330" stroke-dashoffset="-110" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="#10b981" stroke-width="25" stroke-dasharray="330" stroke-dashoffset="-220" />
            </svg>
            <div class="pie-center">
              <span class="pie-value">1,234</span>
              <span class="pie-label">总授权</span>
            </div>
          </div>
          <div class="pie-legend">
            <div class="legend-item">
              <span class="dot" style="background: #00d4ff"></span>
              <span class="label">标准版</span>
              <span class="value">856 (69%)</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background: #7c3aed"></span>
              <span class="label">试用版</span>
              <span class="value">298 (24%)</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background: #10b981"></span>
              <span class="label">管理员</span>
              <span class="value">80 (7%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 高频问题TOP10 -->
    <div class="section-card">
      <div class="card-header">
        <h3>高频问题 TOP 10</h3>
        <span class="card-subtitle">用户最常咨询的问题</span>
      </div>
      <div class="question-list">
        <div class="question-item" v-for="(q, index) in topQuestions" :key="q.id">
          <div class="rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
          <div class="question-content">
            <span class="question-text">{{ q.text }}</span>
            <div class="question-bar">
              <div class="bar-fill" :style="{ width: q.percent + '%' }"></div>
            </div>
          </div>
          <div class="question-count">{{ q.count }} 次</div>
        </div>
      </div>
    </div>

    <!-- 时段分布 -->
    <div class="section-card">
      <div class="card-header">
        <h3>活跃时段分布</h3>
        <span class="card-subtitle">用户活跃时间分析</span>
      </div>
      <div class="time-distribution">
        <div class="time-bar" v-for="(item, index) in timeDistribution" :key="index">
          <span class="time-label">{{ item.hour }}:00</span>
          <div class="time-progress">
            <div class="progress-fill" :style="{ width: item.value + '%', background: item.peak ? 'linear-gradient(90deg, #00d4ff, #7c3aed)' : '#00d4ff' }"></div>
          </div>
          <span class="time-value">{{ item.value }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const dateRange = ref('')

const overviewData = ref([
  {
    label: '总用户数',
    value: '2,847',
    trend: 12.5,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    gradient: 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 114, 255, 0.1))'
  },
  {
    label: '活跃设备',
    value: '1,892',
    trend: 8.3,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    gradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(168, 85, 247, 0.1))'
  },
  {
    label: '话术使用',
    value: '45,678',
    trend: 15.2,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(34, 197, 94, 0.1))'
  },
  {
    label: '今日新增',
    value: '156',
    trend: -3.2,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 146, 60, 0.1))'
  }
])

const userTrendData = ref([
  { label: '周一', new: 45, active: 65 },
  { label: '周二', new: 55, active: 70 },
  { label: '周三', new: 60, active: 75 },
  { label: '周四', new: 70, active: 80 },
  { label: '周五', new: 65, active: 78 },
  { label: '周六', new: 80, active: 90 },
  { label: '周日', new: 75, active: 85 }
])

const topQuestions = ref([
  { id: 1, text: '这个多少钱？', count: 1234, percent: 100 },
  { id: 2, text: '尺码怎么选？', count: 987, percent: 80 },
  { id: 3, text: '几天能到？', count: 876, percent: 71 },
  { id: 4, text: '有优惠吗？', count: 765, percent: 62 },
  { id: 5, text: '老板在吗？', count: 654, percent: 53 },
  { id: 6, text: '可以退换吗？', count: 543, percent: 44 },
  { id: 7, text: '是正品吗？', count: 432, percent: 35 },
  { id: 8, text: '有运费险吗？', count: 321, percent: 26 },
  { id: 9, text: '怎么下单？', count: 210, percent: 17 },
  { id: 10, text: '发什么快递？', count: 198, percent: 16 }
])

const timeDistribution = ref([
  { hour: '00', value: 5, peak: false },
  { hour: '02', value: 3, peak: false },
  { hour: '04', value: 2, peak: false },
  { hour: '06', value: 8, peak: false },
  { hour: '08', value: 25, peak: false },
  { hour: '10', value: 45, peak: true },
  { hour: '12', value: 60, peak: true },
  { hour: '14', value: 55, peak: true },
  { hour: '16', value: 50, peak: true },
  { hour: '18', value: 70, peak: true },
  { hour: '20', value: 85, peak: true },
  { hour: '22', value: 40, peak: false }
])

const handleDateChange = () => {
  console.log('Date range changed:', dateRange.value)
}

const exportStats = () => {
  ElMessage.success('报表导出中...')
}
</script>

<style scoped>
.stats-page {
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
  align-items: center;
}

.header-actions :deep(.el-button) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions svg { width: 16px; height: 16px; }

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.overview-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.overview-card:hover {
  transform: translateY(-6px);
  border-color: rgba(0, 212, 255, 0.2);
}

.card-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
}

.card-content { position: relative; z-index: 1; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon svg { width: 24px; height: 24px; color: #fff; }

.card-trend {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.card-trend.up { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.card-trend.down { background: rgba(255, 100, 100, 0.2); color: #ff6464; }

.card-value {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.card-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

.chart-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
}

.chart-card.large { grid-column: span 2; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 折线图 */
.line-chart { height: 250px; }

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.bars {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  height: 200px;
}

.bar {
  width: 20px;
  border-radius: 6px 6px 0 0;
  transition: height 0.5s ease;
}

.bar-primary { background: linear-gradient(180deg, #00d4ff, #0072ff); }
.bar-secondary { background: linear-gradient(180deg, #7c3aed, #a855f7); }

.bar-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* 饼图 */
.pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.pie-svg {
  width: 180px;
  height: 180px;
  transform: rotate(-90deg);
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pie-value {
  display: block;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.pie-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.pie-legend {
  width: 100%;
  margin-top: 24px;
}

.pie-legend .legend-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pie-legend .legend-item:last-child { border-bottom: none; }
.pie-legend .label { flex: 1; }
.pie-legend .value { color: #fff; font-weight: 600; }

/* 区块卡片 */
.section-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 28px;
}

.card-subtitle {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* 问题列表 */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  transition: all 0.3s;
}

.question-item:hover {
  background: rgba(0, 212, 255, 0.05);
}

.rank {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.rank-1 { background: linear-gradient(135deg, #ffd700, #ff8c00); color: #000; }
.rank-2 { background: linear-gradient(135deg, #c0c0c0, #808080); color: #000; }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #8b4513); color: #fff; }
.rank { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); }

.question-content { flex: 1; }
.question-text { color: #fff; font-size: 14px; margin-bottom: 8px; display: block; }

.question-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #7c3aed);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.question-count { color: rgba(255, 255, 255, 0.5); font-size: 13px; white-space: nowrap; }

/* 时段分布 */
.time-distribution {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.time-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  text-align: center;
}

.time-progress {
  height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.progress-fill {
  height: 0;
  border-radius: 8px;
  transition: height 0.5s ease;
  animation: growUp 1s ease-out forwards;
}

@keyframes growUp {
  from { height: 0; }
  to { height: var(--target-height, 50%); }
}

.time-value {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 1200px) {
  .overview-cards { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.large { grid-column: span 1; }
  .time-distribution { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .overview-cards, .time-distribution { grid-template-columns: 1fr; }
}
</style>
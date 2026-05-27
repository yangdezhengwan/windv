<template>
  <div class="dashboard-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">仪表盘</h1>
        <p class="page-description">系统数据总览</p>
      </div>
      <div class="header-actions">
        <el-button type="primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          生成授权
        </el-button>
      </div>
    </div>

    <!-- 欢迎卡片 -->
    <div class="welcome-card animate-fade-in-up">
      <div class="welcome-content">
        <h1>欢迎回来，管理员 👋</h1>
        <p>今天是 {{ formatDate(new Date()) }}，系统运行正常</p>
      </div>
      <div class="welcome-stats">
        <div class="mini-stat">
          <span class="mini-stat-value">98.5%</span>
          <span class="mini-stat-label">系统健康度</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-value">99.9%</span>
          <span class="mini-stat-label">可用性</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片网格 -->
    <div class="stats-grid">
      <div
        class="stat-card"
        v-for="(stat, index) in statsData"
        :key="index"
        :style="{ animationDelay: `${index * 0.1}s` }"
        :class="`animate-fade-in-up`"
      >
        <div class="stat-icon" :class="stat.color">
          <div class="icon-wrapper">
            <span v-html="stat.icon"></span>
          </div>
          <div class="icon-glow"></div>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <span class="stat-title">{{ stat.title }}</span>
            <span class="stat-trend" :class="stat.trendClass">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline :points="stat.trend > 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
              </svg>
              {{ Math.abs(stat.trend) }}%
            </span>
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-footer">
            <span class="stat-subtitle">{{ stat.subtitle }}</span>
            <span class="stat-period">较上{{ stat.period }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 用户增长趋势 -->
      <div class="chart-card large animate-fade-in-up" style="animation-delay: 0.4s">
        <div class="card-header">
          <div class="header-title">
            <h3>用户增长趋势</h3>
            <p>过去 7 天的新增用户数据</p>
          </div>
          <div class="chart-controls">
            <button
              v-for="period in ['day', 'week', 'month']"
              :key="period"
              class="period-btn"
              :class="{ active: activePeriod === period }"
              @click="activePeriod = period"
            >
              {{ periodLabels[period] }}
            </button>
          </div>
        </div>
        <div class="chart-body">
          <div class="chart-placeholder">
            <div class="chart-bars">
              <div
                v-for="(bar, index) in chartBars"
                :key="index"
                class="bar"
                :style="{
                  height: `${bar.value}%`,
                  '--delay': `${index * 0.1}s`
                }"
              >
                <div class="bar-tooltip">
                  <span class="tooltip-label">{{ bar.label }}</span>
                  <span class="tooltip-value">{{ bar.value }} 人</span>
                </div>
              </div>
            </div>
            <div class="chart-axis-x">
              <span v-for="(bar, index) in chartBars" :key="index">{{ bar.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 授权类型分布 -->
      <div class="chart-card small animate-fade-in-up" style="animation-delay: 0.5s">
        <div class="card-header">
          <div class="header-title">
            <h3>授权类型分布</h3>
            <p>当前授权码类型统计</p>
          </div>
        </div>
        <div class="chart-body">
          <div class="donut-chart">
            <svg viewBox="0 0 200 200" class="donut-svg">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#00d4ff"
                stroke-width="20"
                stroke-dasharray="502.65"
                stroke-dashoffset="301.59"
                class="donut-segment standard"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#7c3aed"
                stroke-width="20"
                stroke-dasharray="502.65"
                stroke-dashoffset="402.12"
                class="donut-segment trial"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#10b981"
                stroke-width="20"
                stroke-dasharray="502.65"
                stroke-dashoffset="477.52"
                class="donut-segment admin"
              />
            </svg>
            <div class="donut-center">
              <span class="donut-total">1,234</span>
              <span class="donut-label">总授权</span>
            </div>
          </div>
          <div class="chart-legend">
            <div class="legend-item" v-for="item in legendItems" :key="item.label">
              <span class="legend-dot" :style="{ background: item.color }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动列表 -->
    <div class="activity-section animate-fade-in-up" style="animation-delay: 0.6s">
      <div class="card-header">
        <div class="header-title">
          <h3>最近活动</h3>
          <p>系统最新动态</p>
        </div>
        <a href="#" class="view-all-btn">查看全部 →</a>
      </div>
      <div class="activity-list">
        <div
          class="activity-item"
          v-for="(activity, index) in activities"
          :key="activity.id"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="activity-icon" :class="activity.type">
            <span v-html="activity.icon"></span>
          </div>
          <div class="activity-content">
            <span class="activity-text">{{ activity.text }}</span>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const activePeriod = ref('week')
const periodLabels = {
  day: '今日',
  week: '本周',
  month: '本月'
}

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return date.toLocaleDateString('zh-CN', options)
}

const statsData = ref([
  {
    title: '总用户数',
    value: '2,847',
    subtitle: '活跃用户',
    trend: 12.5,
    period: '周',
    color: 'blue',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  },
  {
    title: '有效授权',
    value: '1,234',
    subtitle: '授权码',
    trend: 8.3,
    period: '周',
    color: 'purple',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  },
  {
    title: '话术库',
    value: '5,678',
    subtitle: '话术模板',
    trend: 15.2,
    period: '月',
    color: 'green',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  },
  {
    title: '活跃设备',
    value: '892',
    subtitle: '在线设备',
    trend: -3.2,
    period: '日',
    color: 'orange',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
  }
])

const chartBars = ref([
  { label: '周一', value: 45 },
  { label: '周二', value: 52 },
  { label: '周三', value: 38 },
  { label: '周四', value: 78 },
  { label: '周五', value: 65 },
  { label: '周六', value: 42 },
  { label: '周日', value: 35 }
])

const legendItems = ref([
  { label: '标准版', value: '600', color: '#00d4ff' },
  { label: '试用版', value: '450', color: '#7c3aed' },
  { label: '管理员', value: '184', color: '#10b981' }
])

const activities = ref([
  {
    id: 1,
    type: 'user',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    text: '新用户「李明」注册成功',
    time: '5 分钟前'
  },
  {
    id: 2,
    type: 'license',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    text: '授权码 WD20241228001 已生成',
    time: '15 分钟前'
  },
  {
    id: 3,
    type: 'system',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    text: '系统已完成自动备份',
    time: '1 小时前'
  },
  {
    id: 4,
    type: 'user',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    text: '用户「王芳」完成了话术学习',
    time: '2 小时前'
  }
])

onMounted(() => {
  statsData.value.forEach((stat, index) => {
    stat.trendClass = stat.trend >= 0 ? 'trend-up' : 'trend-down'
  })
})
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
  min-height: 100%;
  background: #0f0f1a;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.page-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

/* 欢迎卡片 */
.welcome-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 28px;
  background-image: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
}

/* 左侧渐变装饰条 */
.welcome-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #00d4ff, #7c3aed);
  border-radius: 16px 0 0 16px;
}

.welcome-content h1 {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.welcome-content p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.welcome-stats {
  display: flex;
  gap: 32px;
}

.mini-stat {
  text-align: right;
}

.mini-stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.mini-stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* 统计卡片网格 */
.stats-grid {
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
  padding: 24px;
  display: flex;
  gap: 20px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-color), transparent);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.stat-icon.blue {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.05));
  color: #00d4ff;
  --accent-color: #00d4ff;
}

.stat-icon.purple {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.05));
  color: #7c3aed;
  --accent-color: #7c3aed;
}

.stat-icon.green {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
  color: #10b981;
  --accent-color: #10b981;
}

.stat-icon.orange {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05));
  color: #f59e0b;
  --accent-color: #f59e0b;
}

.icon-wrapper {
  position: relative;
  z-index: 1;
}

.icon-wrapper svg {
  width: 24px;
  height: 24px;
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  filter: blur(20px);
  opacity: 0.3;
  background: var(--accent-color);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.stat-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.stat-trend svg {
  width: 14px;
  height: 14px;
}

.trend-up {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.trend-down {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 8px;
}

.stat-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.stat-period {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
}

/* 图表容器 */
.charts-container {
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

.chart-card.large {
  grid-column: span 2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-title h3 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.header-title p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.chart-controls {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s;
}

.period-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.2);
  color: #00d4ff;
}

.period-btn.active {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-color: transparent;
  color: white;
}

.chart-body {
  min-height: 280px;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  gap: 24px;
  padding: 0 20px;
}

.bar {
  flex: 1;
  max-width: 60px;
  background: linear-gradient(180deg, #00d4ff, #7c3aed);
  border-radius: 8px 8px 0 0;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: growUp 0.6s ease-out forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes growUp {
  from {
    height: 0 !important;
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.bar:hover {
  filter: brightness(1.2);
  transform: scaleY(1.05);
  transform-origin: bottom;
}

.bar-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 26, 50, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  pointer-events: none;
}

.bar:hover .bar-tooltip {
  opacity: 1;
  visibility: visible;
  bottom: calc(100% + 8px);
}

.tooltip-label {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin-bottom: 2px;
}

.tooltip-value {
  display: block;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.chart-axis-x {
  display: flex;
  justify-content: space-around;
  padding: 16px 20px 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* 甜甜圈图 */
.donut-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 10px;
  width: 100%;
}

.donut-svg {
  width: min(100%, 280px);
  height: min(100%, 280px);
  max-height: 280px;
  transform: rotate(-90deg);
}

.donut-segment {
  transition: all 0.3s;
  cursor: pointer;
}

.donut-segment:hover {
  filter: brightness(1.2);
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.donut-total {
  display: block;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}

.donut-label {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  margin-top: 4px;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.legend-value {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

/* 活动列表 */
.activity-section {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
}

.view-all-btn {
  color: #00d4ff;
  font-size: 14px;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.view-all-btn:hover {
  color: #7c3aed;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: all 0.3s;
  opacity: 0;
  animation: slideInRight 0.5s ease-out forwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon svg {
  width: 20px;
  height: 20px;
}

.activity-icon.user {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.05));
  color: #00d4ff;
}

.activity-icon.license {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.05));
  color: #7c3aed;
}

.activity-icon.system {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
  color: #10b981;
}

.activity-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.activity-time {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

/* 动画 */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .chart-card.large {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }
  
  .welcome-card {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .welcome-stats {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>

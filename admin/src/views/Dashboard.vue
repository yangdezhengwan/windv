<template>
  <div class="dashboard-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-title">WindV</span>
            <span class="logo-subtitle">管理后台</span>
          </div>
        </div>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg :class="{ rotated: sidebarCollapsed }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section" v-for="(section, index) in navSections" :key="index">
          <div class="nav-section-title" v-if="section.title">{{ section.title }}</div>
          <router-link
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: $route.path === item.path }"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span class="nav-text">{{ item.label }}</span>
            <span class="nav-badge" v-if="item.badge">{{ item.badge }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">
            <span>A</span>
            <div class="avatar-glow"></div>
          </div>
          <div class="user-info">
            <span class="user-name">管理员</span>
            <span class="user-email">admin@windv.com</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部导航栏 -->
      <header class="top-header">
        <div class="header-left">
          <button class="menu-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-item">首页</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">仪表盘</span>
          </div>
        </div>

        <div class="header-right">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="搜索..." />
          </div>

          <button class="notification-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notification-badge">3</span>
          </button>

          <div class="header-actions">
            <button class="action-btn primary" @click="generateLicense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              生成授权
            </button>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="page-content">
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
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const sidebarCollapsed = ref(false)
const activePeriod = ref('week')

const periodLabels = {
  day: '今日',
  week: '本周',
  month: '本月'
}

const navSections = [
  {
    items: [
      {
        path: '/dashboard',
        label: '仪表盘',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
      },
      {
        path: '/users',
        label: '用户管理',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
      },
      {
        path: '/licenses',
        label: '授权管理',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        badge: 12
      },
      {
        path: '/scripts',
        label: '话术库',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
      },
      {
        path: '/stats',
        label: '数据统计',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
      }
    ]
  },
  {
    title: '系统',
    items: [
      {
        path: '/settings',
        label: '系统设置',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
      }
    ]
  }
]

const statsData = ref([
  {
    title: '总用户数',
    value: '2,847',
    subtitle: '活跃用户',
    period: '周',
    trend: 12.5,
    trendClass: 'up',
    color: 'blue',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  },
  {
    title: '有效授权',
    value: '1,234',
    subtitle: '授权码',
    period: '周',
    trend: 8.3,
    trendClass: 'up',
    color: 'purple',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  },
  {
    title: '话术库',
    value: '5,678',
    subtitle: '话术模板',
    period: '月',
    trend: 15.2,
    trendClass: 'up',
    color: 'green',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  },
  {
    title: '活跃设备',
    value: '892',
    subtitle: '在线设备',
    period: '日',
    trend: -3.2,
    trendClass: 'down',
    color: 'orange',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
  }
])

const chartBars = ref([
  { label: '周一', value: 45 },
  { label: '周二', value: 65 },
  { label: '周三', value: 55 },
  { label: '周四', value: 80 },
  { label: '周五', value: 70 },
  { label: '周六', value: 60 },
  { label: '周日', value: 50 }
])

const legendItems = [
  { label: '标准版', value: '856', color: '#00d4ff' },
  { label: '试用版', value: '298', color: '#7c3aed' },
  { label: '管理员', value: '80', color: '#10b981' }
]

const activities = ref([
  {
    id: 1,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    text: '生成了新的授权码 STD-XXXX-XXXX',
    time: '2分钟前',
    type: 'license'
  },
  {
    id: 2,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    text: '新用户注册: zhangsan@example.com',
    time: '5分钟前',
    type: 'user'
  },
  {
    id: 3,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    text: '系统设置已更新',
    time: '10分钟前',
    type: 'settings'
  },
  {
    id: 4,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    text: '数据报表已生成',
    time: '15分钟前',
    type: 'stats'
  }
])

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return date.toLocaleDateString('zh-CN', options)
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const generateLicense = () => {
  console.log('生成授权码...')
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, rgba(26, 26, 50, 0.98) 0%, rgba(15, 15, 35, 0.99) 100%);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar.collapsed .logo-text,
.sidebar.collapsed .nav-text,
.sidebar.collapsed .nav-section-title,
.sidebar.collapsed .user-info {
  display: none;
}

.sidebar.collapsed .sidebar-nav {
  padding: 16px 12px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.4);
  flex-shrink: 0;
}

.logo-icon svg {
  width: 26px;
  height: 26px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.logo-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
  letter-spacing: 0.5px;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.collapse-btn svg {
  width: 18px;
  height: 18px;
  transition: transform 0.3s;
}

.collapse-btn svg.rotated {
  transform: rotate(180deg);
}

.sidebar-nav {
  flex: 1;
  padding: 20px 12px;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 24px;
}

.nav-section:last-child {
  margin-bottom: 0;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 0 16px 8px;
  margin-bottom: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  margin-bottom: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(124, 58, 237, 0.1));
  opacity: 0;
  transition: opacity 0.3s;
}

.nav-item:hover {
  color: #fff;
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item.active {
  color: #00d4ff;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(124, 58, 237, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.nav-item.active::before {
  opacity: 1;
}

.nav-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-text {
  font-size: 15px;
  font-weight: 500;
}

.nav-badge {
  margin-left: auto;
  padding: 4px 10px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  animation: pulse 2s infinite;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  position: relative;
  flex-shrink: 0;
}

.avatar-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 14px;
  opacity: 0.5;
  filter: blur(8px);
  z-index: -1;
  animation: glow 2s ease-in-out infinite;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.user-email {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 2px;
}

.logout-btn {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.2);
  border-radius: 10px;
  color: #ff6464;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 100, 100, 0.2);
  border-color: rgba(255, 100, 100, 0.3);
}

.logout-btn svg {
  width: 18px;
  height: 18px;
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed + .main-content {
  margin-left: 80px;
}

/* 顶部导航栏 */
.top-header {
  height: 72px;
  background: rgba(26, 26, 50, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.menu-toggle {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-toggle:hover {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.menu-toggle svg {
  width: 20px;
  height: 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.breadcrumb-item.active {
  color: #fff;
  font-weight: 500;
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.3s;
}

.search-box:hover,
.search-box:focus-within {
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
}

.search-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.4);
}

.search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 14px;
  width: 200px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.notification-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.notification-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.notification-btn svg {
  width: 20px;
  height: 20px;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 212, 255, 0.4);
}

/* 页面内容 */
.page-content {
  padding: 28px 32px;
  max-width: 100%;
  margin: 0;
}

/* 欢迎卡片 */
.welcome-card {
  background: linear-gradient(135deg, rgba(26, 26, 50, 0.9), rgba(22, 33, 62, 0.95));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d4ff, #7c3aed, #10b981);
}

.welcome-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
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
  text-align: center;
}

.mini-stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mini-stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.9) 0%, rgba(20, 20, 45, 0.95) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-6px);
  border-color: rgba(0, 212, 255, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 212, 255, 0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d4ff, #0072ff);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.stat-icon.blue {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 114, 255, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.stat-icon.purple {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.stat-icon.green {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(34, 197, 94, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.stat-icon.orange {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 146, 60, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper svg {
  width: 100%;
  height: 100%;
  color: inherit;
}

.icon-glow {
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  opacity: 0.3;
  filter: blur(12px);
  animation: glow 3s ease-in-out infinite;
}

.stat-icon.blue .icon-glow {
  background: linear-gradient(135deg, #00d4ff, #0072ff);
}

.stat-icon.purple .icon-glow {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
}

.stat-icon.green .icon-glow {
  background: linear-gradient(135deg, #10b981, #22c55e);
}

.stat-icon.orange .icon-glow {
  background: linear-gradient(135deg, #f59e0b, #fb923c);
}

.stat-content {
  flex: 1;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stat-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.stat-trend.up {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.stat-trend.down {
  background: rgba(255, 100, 100, 0.15);
  color: #ff6464;
}

.stat-trend svg {
  width: 14px;
  height: 14px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 12px;
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
  min-height: 240px;
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
  padding: 20px 0;
}

.donut-svg {
  width: 180px;
  height: 180px;
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

.activity-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(0, 212, 255, 0.1);
}

.activity-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.license {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.activity-icon.license svg {
  color: #00d4ff;
}

.activity-icon.user {
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.activity-icon.user svg {
  color: #7c3aed;
}

.activity-icon.settings {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.activity-icon.settings svg {
  color: #10b981;
}

.activity-icon.stats {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.activity-icon.stats svg {
  color: #f59e0b;
}

.activity-icon svg {
  width: 22px;
  height: 22px;
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

/* 响应式 */
@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .charts-container {
    grid-template-columns: 1fr;
  }

  .chart-card.large {
    grid-column: span 1;
  }
}
</style>
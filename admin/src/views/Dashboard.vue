<template>
  <div class="dashboard">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <span class="logo-text">WindV</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item active">
          <span class="nav-icon">📊</span>
          <span class="nav-text">仪表盘</span>
        </router-link>
        <router-link to="/users" class="nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-text">用户管理</span>
        </router-link>
        <router-link to="/licenses" class="nav-item">
          <span class="nav-icon">🔑</span>
          <span class="nav-text">授权管理</span>
        </router-link>
        <router-link to="/scripts" class="nav-item">
          <span class="nav-icon">💬</span>
          <span class="nav-text">话术库</span>
        </router-link>
        <router-link to="/stats" class="nav-item">
          <span class="nav-icon">📈</span>
          <span class="nav-text">数据统计</span>
        </router-link>
        <router-link to="/settings" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">系统设置</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">A</div>
          <div class="user-details">
            <span class="user-name">Admin</span>
            <span class="user-role">管理员</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="page-title">
          <h1>仪表盘</h1>
          <p>欢迎回来，今天是 {{ currentDate }}</p>
        </div>
        <div class="top-actions">
          <button class="action-btn refresh" @click="refreshData">
            🔄 刷新
          </button>
          <button class="action-btn primary">
            ➕ 生成授权
          </button>
        </div>
      </header>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3>用户增长趋势</h3>
            <div class="chart-actions">
              <button class="time-btn" :class="{ active: chartPeriod === 'week' }" @click="chartPeriod = 'week'">本周</button>
              <button class="time-btn" :class="{ active: chartPeriod === 'month' }" @click="chartPeriod = 'month'">本月</button>
            </div>
          </div>
          <div class="chart-body">
            <div class="chart-placeholder">
              <div class="chart-bars">
                <div class="bar" v-for="(h, i) in chartData" :key="i" :style="{ height: h + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3>授权类型分布</h3>
          </div>
          <div class="chart-body">
            <div class="pie-chart">
              <div class="pie-center">
                <span class="pie-total">1,234</span>
                <span class="pie-label">总授权</span>
              </div>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background: #00d4ff"></span>
                <span class="legend-label">标准版</span>
                <span class="legend-value">856</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #7c3aed"></span>
                <span class="legend-label">试用版</span>
                <span class="legend-value">298</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #10b981"></span>
                <span class="legend-label">管理员</span>
                <span class="legend-value">80</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="activity-section">
        <div class="section-header">
          <h3>最近活动</h3>
          <a href="#" class="view-all">查看全部 →</a>
        </div>
        <div class="activity-list">
          <div class="activity-item" v-for="item in activities" :key="item.id">
            <div class="activity-icon" :style="{ background: item.color }">{{ item.icon }}</div>
            <div class="activity-content">
              <span class="activity-text">{{ item.text }}</span>
              <span class="activity-time">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentDate = computed(() => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
})

const chartPeriod = ref('week')
const chartData = ref([40, 65, 45, 80, 55, 70, 60])

const stats = ref([
  { icon: '👥', label: '总用户数', value: '2,847', trend: 12.5 },
  { icon: '🔑', label: '有效授权', value: '1,234', trend: 8.3 },
  { icon: '💬', label: '话术库', value: '5,678', trend: 15.2 },
  { icon: '📊', label: '活跃设备', value: '892', trend: -3.2 },
])

const activities = ref([
  { id: 1, icon: '🔑', text: '生成了新的授权码 STD-XXXX-XXXX', time: '2分钟前', color: '#00d4ff' },
  { id: 2, icon: '👤', text: '新用户注册: zhangsan@example.com', time: '5分钟前', color: '#7c3aed' },
  { id: 3, icon: '⚙️', text: '系统设置已更新', time: '10分钟前', color: '#10b981' },
  { id: 4, icon: '📊', text: '数据报表已生成', time: '15分钟前', color: '#f59e0b' },
])

const refreshData = () => {
  console.log('Refreshing data...')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  background: #0a0a1a;
}

/* 侧边栏 */
.sidebar {
  width: 260px;
  background: rgba(20, 20, 40, 0.95);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-icon svg {
  width: 24px;
  height: 24px;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  margin-bottom: 4px;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(0, 212, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(124, 58, 237, 0.1));
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 15px;
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: #fff;
  font-weight: 500;
}

.user-role {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  color: #ff6464;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 100, 100, 0.2);
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 24px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title h1 {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
}

.page-title p {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.top-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.refresh {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.action-btn.refresh:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.primary {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
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
  background: linear-gradient(90deg, #00d4ff, #7c3aed);
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.stat-trend {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 20px;
}

.stat-trend.up {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.stat-trend.down {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6464;
}

/* 图表区域 */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
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
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.time-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s;
}

.time-btn.active {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.5);
  color: #00d4ff;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 20px 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 100%;
}

.bar {
  width: 32px;
  background: linear-gradient(180deg, #00d4ff, #7c3aed);
  border-radius: 6px 6px 0 0;
  transition: height 0.5s ease;
}

.pie-chart {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(#00d4ff 0% 40%, #7c3aed 40% 70%, #10b981 70% 100%);
  margin: 20px auto;
  position: relative;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: rgba(30, 30, 60, 0.95);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pie-total {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.pie-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.chart-legend {
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-label {
  flex: 1;
  color: rgba(255, 255, 255, 0.7);
}

.legend-value {
  color: #fff;
  font-weight: 600;
}

/* 最近活动 */
.activity-section {
  background: rgba(30, 30, 60, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.view-all {
  color: #00d4ff;
  font-size: 14px;
  text-decoration: none;
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
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.activity-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-text {
  color: rgba(255, 255, 255, 0.8);
}

.activity-time {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
</style>
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '仪表盘', icon: 'DataAnalysis' }
  },
  {
    path: '/platform',
    name: 'Platform',
    component: () => import('@/views/Platform.vue'),
    meta: { title: '平台适配', icon: 'Monitor' }
  },
  {
    path: '/script',
    name: 'Script',
    component: () => import('@/views/ScriptLibrary.vue'),
    meta: { title: '话术库', icon: 'ChatDotRound' }
  },
  {
    path: '/risk',
    name: 'RiskControl',
    component: () => import('@/views/RiskControl.vue'),
    meta: { title: '风控设置', icon: 'Shield' }
  },
  {
    path: '/stats',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue'),
    meta: { title: '数据报表', icon: 'DataLine' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '系统设置', icon: 'Setting' }
  },
  {
    path: '/license',
    name: 'License',
    component: () => import('@/views/License.vue'),
    meta: { title: '授权激活', icon: 'Key' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

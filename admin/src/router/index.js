import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/Placeholder.vue'),
    props: { title: '👥 用户管理', description: '用户管理功能开发中...' },
    meta: { requiresAuth: true }
  },
  {
    path: '/licenses',
    name: 'Licenses',
    component: () => import('../views/Licenses.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/scripts',
    name: 'Scripts',
    component: () => import('../views/Placeholder.vue'),
    props: { title: '💬 话术库', description: '云端话术库管理功能开发中...' },
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/Placeholder.vue'),
    props: { title: '📈 数据统计', description: '数据统计功能开发中...' },
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Placeholder.vue'),
    props: { title: '⚙️ 系统设置', description: '系统设置功能开发中...' },
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
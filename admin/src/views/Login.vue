<template>
  <div class="login-container">
    <!-- 粒子背景 -->
    <canvas id="login-particles" class="particles-canvas"></canvas>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <div class="logo-glow"></div>
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>
        <h1 class="brand-name">WindV</h1>
        <p class="brand-tagline">智能直播助手 · 管理后台</p>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            用户名 / 邮箱
          </label>
          <div class="input-wrapper">
            <input
              v-model="loginForm.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名或邮箱"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            密码
          </label>
          <div class="input-wrapper">
            <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="loginForm.remember" />
            <span class="checkbox-custom"></span>
            记住我
          </label>
          <a href="#" class="forgot-link">忘记密码？</a>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="!loading">登 录</span>
          <span v-else class="loading">
            <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
            </svg>
            登录中...
          </span>
        </button>
      </form>

      <!-- 底部链接 -->
      <div class="footer-links">
        <p>还没有账号？<a href="#">立即注册</a></p>
      </div>
    </div>

    <!-- 装饰性元素 -->
    <div class="decoration-circle circle-1"></div>
    <div class="decoration-circle circle-2"></div>
    <div class="decoration-circle circle-3"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const showPassword = ref(false)
const loading = ref(false)

const loginForm = ref({
  username: '',
  password: '',
  remember: false,
})

let particleInterval = null

const initParticles = () => {
  const canvas = document.getElementById('login-particles')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles = []
  const particleCount = 80

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.vx = (Math.random() - 0.5) * 0.5
      this.vy = (Math.random() - 0.5) * 0.5
      this.radius = Math.random() * 2 + 1
      this.opacity = Math.random() * 0.5 + 0.2
    }

    update() {
      this.x += this.vx
      this.y += this.vy

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1
    }

    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 212, 255, ${this.opacity})`
      ctx.fill()
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle())
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(particle => {
      particle.update()
      particle.draw()
    })

    // 绘制连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 150) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - distance / 150)})`
          ctx.lineWidth = 0.5
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    particleInterval = requestAnimationFrame(animate)
  }

  animate()

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  })
}

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value),
    })
    const data = await res.json()

    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(data.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initParticles()
})

onUnmounted(() => {
  if (particleInterval) {
    cancelAnimationFrame(particleInterval)
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
}

.particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  background: rgba(26, 26, 50, 0.85);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 48px 44px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  z-index: 10;
  animation: cardAppear 0.6s ease-out;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Logo */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  display: inline-flex;
  position: relative;
  margin-bottom: 20px;
}

.logo-glow {
  position: absolute;
  inset: -8px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 24px;
  opacity: 0.4;
  filter: blur(20px);
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 212, 255, 0.4);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.logo-icon svg {
  width: 44px;
  height: 44px;
}

.brand-name {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 10px;
  letter-spacing: -0.5px;
}

.brand-tagline {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  letter-spacing: 3px;
}

/* 表单 */
.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.form-label svg {
  width: 18px;
  height: 18px;
  color: #00d4ff;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1), 0 0 20px rgba(0, 212, 255, 0.1);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s;
  padding: 4px;
}

.password-toggle:hover {
  color: #00d4ff;
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.remember-me input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  position: relative;
}

.remember-me input:checked + .checkbox-custom {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-color: transparent;
}

.remember-me input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg) translate(1px, -1px);
}

.forgot-link {
  color: #00d4ff;
  font-size: 14px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.forgot-link:hover {
  color: #7c3aed;
}

.submit-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 6px 24px rgba(0, 212, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.submit-btn:hover:not(:disabled)::before {
  left: 100%;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(0, 212, 255, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 底部 */
.footer-links {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-links p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin: 0;
}

.footer-links a {
  color: #00d4ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #7c3aed;
}

/* 装饰元素 */
.decoration-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
  top: -150px;
  right: -150px;
  animation: float 6s ease-in-out infinite;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%);
  bottom: -100px;
  left: -100px;
  animation: float 8s ease-in-out infinite reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
  top: 50%;
  left: 10%;
  animation: float 10s ease-in-out infinite;
}

/* 响应式 */
@media (max-width: 576px) {
  .login-card {
    padding: 36px 28px;
    margin: 20px;
  }

  .logo-icon {
    width: 64px;
    height: 64px;
  }

  .logo-icon svg {
    width: 36px;
    height: 36px;
  }

  .brand-name {
    font-size: 28px;
  }
}
</style>
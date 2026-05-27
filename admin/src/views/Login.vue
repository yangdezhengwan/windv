<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 背景动画 -->
      <div class="bg-animation">
        <div class="grid"></div>
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
      </div>
      
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <h1 class="brand-name">小狐狸</h1>
        <p class="brand-tagline">小狐狸 AI 助手 - 管理后台</p>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">👤</span>
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
            <div class="input-border"></div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">🔐</span>
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
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
            <div class="input-border"></div>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="loginForm.remember" />
            <span class="checkmark"></span>
            记住我
          </label>
          <a href="#" class="forgot-link">忘记密码？</a>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="!loading">登 录</span>
          <span v-else class="loading">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </button>
      </form>

      <!-- 注册入口 -->
      <div class="register-section">
        <p>还没有账号？<a href="#" @click.prevent="$emit('switch', 'register')">立即注册</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const emit = defineEmits(['switch'])

const loginForm = ref({
  username: '',
  password: '',
  remember: false,
})

const showPassword = ref(false)
const loading = ref(false)

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
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a1a;
  padding: 20px;
}

.login-box {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: rgba(20, 20, 40, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 48px 40px;
  overflow: hidden;
}

/* 背景动画 */
.bg-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-animation .grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(40px, 40px); }
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.glow-1 {
  width: 300px;
  height: 300px;
  background: #00d4ff;
  top: -100px;
  right: -100px;
  animation: pulse 4s ease-in-out infinite;
}

.glow-2 {
  width: 200px;
  height: 200px;
  background: #7c3aed;
  bottom: -50px;
  left: -50px;
  animation: pulse 4s ease-in-out infinite 2s;
}

@keyframes pulse {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.1); }
}

/* Logo */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.logo-wrapper {
  display: inline-flex;
  margin-bottom: 16px;
}

.logo-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
  animation: float 3s ease-in-out infinite;
}

.logo-icon svg {
  width: 40px;
  height: 40px;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.brand-name {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px;
}

.brand-tagline {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  letter-spacing: 2px;
}

/* 表单 */
.login-form {
  position: relative;
  z-index: 1;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.label-icon {
  font-size: 16px;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.password-toggle:hover {
  opacity: 1;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, #7c3aed);
  transition: all 0.3s;
  transform: translateX(-50%);
}

.form-input:focus ~ .input-border {
  width: 100%;
}

/* 选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
}

.remember-me input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.remember-me input:checked + .checkmark {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border-color: transparent;
}

.remember-me input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
}

.forgot-link {
  color: #00d4ff;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.3s;
}

.forgot-link:hover {
  color: #7c3aed;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 212, 255, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.loading .dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading .dot:nth-child(1) { animation-delay: -0.32s; }
.loading .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 注册入口 */
.register-section {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.register-section p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0;
}

.register-section a {
  color: #00d4ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.register-section a:hover {
  color: #7c3aed;
}
</style>
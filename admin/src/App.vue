<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 动态添加粒子背景 canvas
  const canvas = document.createElement('canvas')
  canvas.id = 'particles-canvas'
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  `
  document.body.insertBefore(canvas, document.body.firstChild)

  initParticles()
})

const initParticles = () => {
  const canvas = document.getElementById('particles-canvas')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles = []
  const particleCount = 50

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
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - distance / 150)})`
          ctx.lineWidth = 0.5
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    requestAnimationFrame(animate)
  }

  animate()

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  })
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  min-height: 100vh;
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input, select, textarea {
  font-family: inherit;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #00d4ff, #7c3aed);
  border-radius: 4px;
  transition: opacity 0.3s;
}

::-webkit-scrollbar-thumb:hover {
  opacity: 0.8;
}

/* Element Plus 覆盖样式 */
.el-message {
  background: rgba(26, 26, 50, 0.98) !important;
  border: 1px solid rgba(0, 212, 255, 0.2) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 212, 255, 0.1) !important;
}

.el-message__content {
  color: #fff !important;
}

.el-dialog {
  background: rgba(26, 26, 50, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
}

.el-dialog__header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.el-dialog__title {
  color: #fff !important;
}

.el-dialog__body {
  color: rgba(255, 255, 255, 0.8) !important;
}

.el-button--primary {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%) !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3) !important;
  transition: all 0.3s !important;
}

.el-button--primary:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4) !important;
}

.el-input__wrapper {
  background: rgba(255, 255, 255, 0.03) !important;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(10px) !important;
  transition: all 0.3s !important;
}

.el-input__wrapper:hover,
.el-input__wrapper.is-focus {
  border-color: rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.1) !important;
}

.el-input__inner {
  color: #fff !important;
}

.el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.3) !important;
}

.el-select__wrapper {
  background: rgba(255, 255, 255, 0.03) !important;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(10px) !important;
}

.el-select__wrapper:hover,
.el-select__wrapper.is-focused {
  border-color: rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.1) !important;
}

.el-table {
  background: transparent !important;
}

.el-table tr {
  background: rgba(255, 255, 255, 0.02) !important;
}

.el-table tr:hover {
  background: rgba(0, 212, 255, 0.05) !important;
}

.el-table th.el-table__cell {
  background: rgba(0, 212, 255, 0.08) !important;
  color: #00d4ff !important;
  font-weight: 600 !important;
}

.el-table td.el-table__cell {
  color: rgba(255, 255, 255, 0.8) !important;
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background: rgba(0, 212, 255, 0.05) !important;
}

.el-pagination button {
  background: rgba(255, 255, 255, 0.03) !important;
  color: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.el-pagination button:hover {
  background: rgba(0, 212, 255, 0.1) !important;
  color: #00d4ff !important;
  border-color: rgba(0, 212, 255, 0.3) !important;
}

.el-pagination .el-pager li.is-active {
  background: linear-gradient(135deg, #00d4ff, #7c3aed) !important;
  color: #fff !important;
  border: none !important;
}

.el-tag {
  background: rgba(0, 212, 255, 0.1) !important;
  border-color: rgba(0, 212, 255, 0.2) !important;
  color: #00d4ff !important;
}

.el-tag--success {
  background: rgba(16, 185, 129, 0.1) !important;
  border-color: rgba(16, 185, 129, 0.2) !important;
  color: #10b981 !important;
}

.el-tag--warning {
  background: rgba(245, 158, 11, 0.1) !important;
  border-color: rgba(245, 158, 11, 0.2) !important;
  color: #f59e0b !important;
}

.el-tag--danger {
  background: rgba(255, 100, 100, 0.1) !important;
  border-color: rgba(255, 100, 100, 0.2) !important;
  color: #ff6464 !important;
}

/* 自定义动画 */
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 212, 255, 0.5);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}
</style>
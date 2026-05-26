<template>
  <div class="placeholder-page">
    <div class="content">
      <h1>⚙️</h1>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '页面开发中' },
  description: { type: String, default: '该功能正在开发中...' }
})
</script>

<style scoped>
.placeholder-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a1a;
}

.content {
  text-align: center;
}

.content h1 {
  font-size: 80px;
  margin-bottom: 24px;
}

.content h2 {
  color: #fff;
  font-size: 28px;
  margin-bottom: 12px;
}

.content p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
}
</style>
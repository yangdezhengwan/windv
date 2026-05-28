<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { onMounted, onUnmounted } from 'vue'

// 监听主进程事件
onMounted(() => {
  // 新弹幕
  window.windv.on('danmaku:new', (data: any) => {
    console.log('新弹幕:', data)
  })

  // 新订单
  window.windv.on('order:new', (data: any) => {
    console.log('新订单:', data)
  })

  // 房间状态变化
  window.windv.on('room:status-change', (data: any) => {
    console.log('房间状态变化:', data)
  })
})

onUnmounted(() => {
  // 清理监听
})
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: #0a0a1a;
}

#app {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>

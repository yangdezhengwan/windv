<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0a0a1a;
  color: #fff;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
}

input, select, textarea {
  font-family: inherit;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Element Plus 覆盖样式 */
.el-message {
  background: rgba(30, 30, 60, 0.95) !important;
  border-color: rgba(0, 212, 255, 0.3) !important;
}

.el-message__content {
  color: #fff !important;
}

.el-button--primary {
  background: linear-gradient(135deg, #00d4ff, #7c3aed) !important;
  border: none !important;
}

.el-input__wrapper {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-input__inner {
  color: #fff !important;
}

.el-select__wrapper {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
</style>
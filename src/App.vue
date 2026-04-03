<script setup lang="ts">
import Toast from './components/common/Toast.vue'

// Persist adminPath from server-injected config so all tabs share the correct path
const orConfig = (window as any).__OR_CONFIG__ || {}
if (orConfig.adminPath) {
  localStorage.setItem('or_admin_path', orConfig.adminPath)
}
</script>

<template>
  <router-view />
  <Toast />
</template>

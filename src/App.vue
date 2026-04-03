<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import Toast from './components/common/Toast.vue'

const orConfig = (window as any).__OR_CONFIG__ || {}
if (orConfig.adminPath) {
  localStorage.setItem('or_admin_path', orConfig.adminPath)
}

const appError = ref<string | null>(null)

onErrorCaptured((err) => {
  appError.value = (err as Error)?.message || String(err)
  return false // prevent propagation
})

function reload() {
  appError.value = null
  window.location.reload()
}
</script>

<template>
  <div v-if="appError" class="app-error-screen">
    <div class="app-error-card">
      <div class="app-error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
      </div>
      <h2>出了点问题</h2>
      <p class="app-error-msg">{{ appError }}</p>
      <div class="app-error-actions">
        <button class="err-btn-primary" @click="reload">重新加载</button>
        <button class="err-btn-ghost" @click="appError = null">忽略继续</button>
      </div>
    </div>
  </div>
  <router-view v-else />
  <Toast />
</template>

<style>
.app-error-screen {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--bg-0, #070c18);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.app-error-card {
  max-width: 440px; width: 100%;
  background: var(--bg-1, #0d1424);
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.app-error-icon {
  width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 24px;
  background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25);
  display: flex; align-items: center; justify-content: center;
  color: #ef4444;
}
.app-error-card h2 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 12px; }
.app-error-msg {
  font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 28px;
  line-height: 1.6; word-break: break-all;
  max-height: 80px; overflow: hidden;
}
.app-error-actions { display: flex; gap: 10px; }
.err-btn-primary {
  flex: 1; padding: 12px; border-radius: 10px; cursor: pointer;
  background: #2563eb; color: #fff; font-size: 14px; font-weight: 600;
  border: none; transition: opacity 0.15s; &:hover { opacity: 0.85; }
}
.err-btn-ghost {
  flex: 1; padding: 12px; border-radius: 10px; cursor: pointer;
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6);
  font-size: 14px; border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.15s; &:hover { background: rgba(255,255,255,0.1); }
}
</style>

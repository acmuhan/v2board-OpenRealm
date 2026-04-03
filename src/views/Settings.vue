<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useLocaleStore } from '../stores/locale'
import { userApi } from '../api'

const userStore = useUserStore()
const localeStore = useLocaleStore()
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const loading = ref(false)
const msg = ref('')
const msgType = ref<'success' | 'error'>('success')

async function changePassword() {
  if (!oldPwd.value || !newPwd.value) { msg.value = '请填写完整'; msgType.value = 'error'; return }
  if (newPwd.value !== confirmPwd.value) { msg.value = '两次密码不一致'; msgType.value = 'error'; return }
  loading.value = true; msg.value = ''
  try {
    await userApi.resetSecurity({ old_password: oldPwd.value, new_password: newPwd.value })
    msg.value = '密码修改成功'; msgType.value = 'success'
    oldPwd.value = ''; newPwd.value = ''; confirmPwd.value = ''
  } catch (e: any) {
    msg.value = e?.message || '修改失败'; msgType.value = 'error'
  } finally { loading.value = false }
}

// Custom hue
const savedHue = parseInt(localStorage.getItem('or_custom_hue') || '-1')
const customHue = ref(savedHue >= 0 ? savedHue : 220)
const previewColor = computed(() => `hsl(${customHue.value}, 80%, 52%)`)
const colorPresets = [
  { hue: 220, name: '蓝色' }, { hue: 160, name: '绿色' }, { hue: 280, name: '紫色' },
  { hue: 20,  name: '橙色' }, { hue: 0,   name: '红色' }, { hue: 190, name: '青色' },
]
function applyCustomHue() {
  const h = customHue.value
  const brand = `hsl(${h}, 80%, 52%)`
  const brandLight = `hsl(${h}, 80%, 62%)`
  const brandRgb = hslToRgb(h, 80, 52)
  document.documentElement.style.setProperty('--brand', brand)
  document.documentElement.style.setProperty('--brand-light', brandLight)
  document.documentElement.style.setProperty('--brand-rgb', brandRgb)
  localStorage.setItem('or_custom_hue', String(h))
}
function resetCustomHue() {
  document.documentElement.style.removeProperty('--brand')
  document.documentElement.style.removeProperty('--brand-light')
  document.documentElement.style.removeProperty('--brand-rgb')
  localStorage.removeItem('or_custom_hue')
  customHue.value = 220
}
function hslToRgb(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return `${Math.round(f(0)*255)}, ${Math.round(f(8)*255)}, ${Math.round(f(4)*255)}`
}
// Apply saved hue on mount
onMounted(() => {
  if (savedHue >= 0) applyCustomHue()
})
</script>

<template>
  <div class="settings-page">
    <h1 class="page-title">账号设置</h1>

    <!-- Account Info -->
    <div class="settings-section glass-card">
      <h3>账户信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">邮箱</span>
          <span class="info-value">{{ userStore.email }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">余额</span>
          <span class="info-value">&yen;{{ ((userStore.info?.balance || 0) / 100).toFixed(2) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">佣金</span>
          <span class="info-value">&yen;{{ ((userStore.info?.commission_balance || 0) / 100).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Password -->
    <div class="settings-section glass-card">
      <h3>修改密码</h3>
      <div v-if="msg" :class="['settings-msg', msgType]">{{ msg }}</div>
      <form @submit.prevent="changePassword" class="pwd-form">
        <div class="form-group">
          <label>当前密码</label>
          <input v-model="oldPwd" type="password" class="or-input" placeholder="输入当前密码" />
        </div>
        <div class="form-group">
          <label>新密码</label>
          <input v-model="newPwd" type="password" class="or-input" placeholder="输入新密码" />
        </div>
        <div class="form-group">
          <label>确认新密码</label>
          <input v-model="confirmPwd" type="password" class="or-input" placeholder="再次输入新密码" />
        </div>
        <button type="submit" class="btn-gradient" :disabled="loading" style="margin-top: 8px">
          {{ loading ? '保存中...' : '保存修改' }}
        </button>
      </form>
    </div>

    <!-- Language Switch (#40) -->
    <div class="settings-section glass-card">
      <h3>语言 / Language</h3>
      <div class="lang-row">
        <button :class="['lang-btn', { active: localeStore.current === 'zh-CN' }]" @click="localeStore.setLocale('zh-CN')">
          <span class="lang-flag">🇨🇳</span> 中文
        </button>
        <button :class="['lang-btn', { active: localeStore.current === 'en' }]" @click="localeStore.setLocale('en')">
          <span class="lang-flag">🇺🇸</span> English
        </button>
      </div>
    </div>

    <!-- Brand Color HSL Picker (#30) -->
    <div class="settings-section glass-card">
      <h3>自定义品牌色</h3>
      <div class="color-row">
        <div class="color-preview" :style="{ background: previewColor }"></div>
        <input type="range" min="0" max="360" v-model.number="customHue" class="hue-slider" @input="applyCustomHue" />
        <span class="hue-value">{{ customHue }}°</span>
      </div>
      <div class="color-presets">
        <button v-for="preset in colorPresets" :key="preset.hue" class="preset-dot" :style="{ background: `hsl(${preset.hue}, 80%, 52%)` }" :title="preset.name" @click="customHue = preset.hue; applyCustomHue()"></button>
      </div>
      <button class="btn-ghost" style="margin-top:8px; font-size: 12px;" @click="resetCustomHue">恢复默认</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-title { font-size: 22px; font-weight: 700; margin-bottom: $gap-lg; }
.settings-section { padding: $gap-lg; margin-bottom: $gap-lg; h3 { font-size: 16px; font-weight: 600; margin-bottom: $gap-md; } }
.info-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: $gap-md;
  @media (max-width: $bp-mobile) { grid-template-columns: 1fr; }
}
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: var(--text-3); }
.info-value { font-size: 16px; font-weight: 600; }
.pwd-form { display: flex; flex-direction: column; gap: $gap-md; max-width: 400px; }
.form-group { display: flex; flex-direction: column; gap: 6px; label { font-size: 13px; color: var(--text-2); } }
.settings-msg {
  padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: $gap-md;
  &.success { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3); color: var(--success); }
  &.error { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.3); color: var(--danger); }
}
.lang-row { display: flex; gap: $gap-sm; }
.lang-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 8px;
  background: var(--bg-elevated); border: 1px solid var(--border);
  color: var(--text-2); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: rgba(var(--brand-rgb), 0.3); }
  &.active { background: rgba(var(--brand-rgb), 0.12); border-color: rgba(var(--brand-rgb), 0.4); color: var(--brand-light); }
}
.lang-flag { font-size: 16px; }
.color-row { display: flex; align-items: center; gap: $gap-md; margin-bottom: $gap-sm; }
.color-preview { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; border: 2px solid var(--border); }
.hue-slider {
  flex: 1; height: 6px; -webkit-appearance: none; appearance: none;
  background: linear-gradient(to right, hsl(0,80%,52%), hsl(60,80%,52%), hsl(120,80%,52%), hsl(180,80%,52%), hsl(240,80%,52%), hsl(300,80%,52%), hsl(360,80%,52%));
  border-radius: 3px; cursor: pointer;
  &::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 2px solid rgba(0,0,0,0.2); box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
}
.hue-value { font-size: 12px; color: var(--text-3); font-family: 'Space Grotesk', sans-serif; min-width: 36px; }
.color-presets { display: flex; gap: 8px; flex-wrap: wrap; }
.preset-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); cursor: pointer; transition: transform 0.15s; &:hover { transform: scale(1.2); border-color: rgba(255,255,255,0.5); } }
</style>

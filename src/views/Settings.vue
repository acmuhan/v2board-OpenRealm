<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { userApi } from '../api'

const userStore = useUserStore()
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
</style>

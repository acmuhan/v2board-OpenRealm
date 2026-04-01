<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api'

const router = useRouter()
const email = ref('')
const password = ref('')
const emailCode = ref('')
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)
const error = ref('')
const success = ref(false)

async function sendCode() {
  if (!email.value) { error.value = '请输入邮箱'; return }
  sending.value = true
  try {
    await authApi.sendVerify({ email: email.value })
    countdown.value = 60
    const timer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(timer) }, 1000)
  } catch (e: any) { error.value = e?.message || '发送失败' } finally { sending.value = false }
}

async function handleReset() {
  if (!email.value || !password.value || !emailCode.value) { error.value = '请填写完整信息'; return }
  loading.value = true; error.value = ''
  try {
    await authApi.forget({ email: email.value, password: password.value, email_code: emailCode.value })
    success.value = true
    setTimeout(() => router.push('/login'), 2000)
  } catch (e: any) { error.value = e?.message || '重置失败' } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="brand-block">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#2563eb" stroke-width="2"/>
            <path d="M12 7v10M7 9.5l5 3 5-3" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h1>OpenRealm</h1>
      </div>
      <p class="brand-tagline">安全、快速、可靠的网络连接</p>
      <div class="brand-features">
        <div class="feature-item">
          <div class="feature-dot"></div>
          <span>全球节点覆盖</span>
        </div>
        <div class="feature-item">
          <div class="feature-dot"></div>
          <span>零日志隐私保护</span>
        </div>
        <div class="feature-item">
          <div class="feature-dot"></div>
          <span>高速稳定连接</span>
        </div>
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-card">
        <h2>重置密码</h2>
        <p class="auth-subtitle">通过邮箱验证码重置您的密码</p>

        <div v-if="error" class="auth-error">{{ error }}</div>
        <div v-if="success" class="auth-success">密码重置成功，正在跳转登录...</div>

        <form @submit.prevent="handleReset" class="auth-form">
          <div class="form-group">
            <label>邮箱地址</label>
            <input v-model="email" type="email" class="or-input" placeholder="your@email.com" />
          </div>
          <div class="form-group">
            <label>验证码</label>
            <div class="input-with-btn">
              <input v-model="emailCode" type="text" class="or-input" placeholder="验证码" />
              <button type="button" class="btn-ghost send-btn" @click="sendCode" :disabled="sending || countdown > 0">
                {{ countdown > 0 ? `${countdown}s` : '发送' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="password" type="password" class="or-input" placeholder="输入新密码" />
          </div>
          <button type="submit" class="btn-primary auth-btn" :disabled="loading">
            {{ loading ? '重置中...' : '重置密码' }}
          </button>
        </form>

        <p class="auth-switch">
          <router-link to="/login">返回登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.auth-page { min-height: 100vh; display: flex; background: var(--bg-0); }
.auth-left {
  width: 420px; display: flex; flex-direction: column; justify-content: center; padding: 48px;
  background: var(--bg-1); border-right: 1px solid var(--border);
  @media (max-width: $bp-tablet) { display: none; }
}
.brand-block { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.brand-icon {
  width: 44px; height: 44px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.brand-block h1 { font-size: 24px; font-weight: 700; color: var(--text-1); letter-spacing: -0.5px; }
.brand-tagline { font-size: 14px; color: var(--text-2); margin-bottom: 36px; }
.brand-features { display: flex; flex-direction: column; gap: 14px; }
.feature-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-2); }
.feature-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.4); flex-shrink: 0;
}
.auth-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px; }
.auth-card {
  width: 100%; max-width: 380px;
  h2 { font-size: 24px; font-weight: 700; margin-bottom: $gap-xs; letter-spacing: -0.3px; }
}
.auth-subtitle { font-size: 14px; color: var(--text-2); margin-bottom: 28px; }
.auth-error {
  padding: 10px 12px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: $card-radius-sm; color: var(--danger); font-size: 13px; margin-bottom: $gap-md;
}
.auth-success {
  padding: 10px 12px; background: rgba(52, 211, 153, 0.08); border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: $card-radius-sm; color: var(--success); font-size: 13px; margin-bottom: $gap-md;
}
.auth-form { display: flex; flex-direction: column; gap: $gap-md; }
.form-group {
  display: flex; flex-direction: column; gap: 6px;
  label { font-size: 12px; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.5px; }
}
.input-with-btn { display: flex; gap: $gap-sm; .or-input { flex: 1; } }
.send-btn { white-space: nowrap; padding: 10px 16px; font-size: 13px; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.auth-btn { width: 100%; height: 44px; font-size: 14px; margin-top: $gap-sm; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.auth-switch {
  text-align: center; margin-top: 24px; font-size: 13px; color: var(--text-3);
  a { color: var(--brand-light); font-weight: 600; }
}
</style>

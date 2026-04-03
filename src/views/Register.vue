<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '../api'

const router = useRouter()
const route = useRoute()

const orConfig = (window as any).__OR_CONFIG__ || {}
const siteTitle = orConfig.title || 'OpenRealm'
const siteDesc = orConfig.description || '安全、快速、可靠的网络连接'

const email = ref('')
const password = ref('')
const confirmPwd = ref('')
const inviteCode = ref((route.query.code as string) || '')
const emailCode = ref('')
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)
const error = ref('')

// Floating particles — same as Login
const particles = ref<{ x: number; y: number; size: number; delay: number; dur: number }[]>([])
onMounted(() => {
  particles.value = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 5,
    dur: 4 + Math.random() * 6,
  }))
})

async function sendCode() {
  if (!email.value) { error.value = '请输入邮箱'; return }
  sending.value = true
  try {
    await authApi.sendVerify({ email: email.value })
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (e: any) {
    error.value = e?.message || '发送失败'
  } finally {
    sending.value = false
  }
}

async function handleRegister() {
  if (!email.value || !password.value) { error.value = '请填写完整信息'; return }
  if (password.value !== confirmPwd.value) { error.value = '两次密码输入不一致'; return }
  loading.value = true
  error.value = ''
  try {
    const res: any = await authApi.register({
      email: email.value,
      password: password.value,
      invite_code: inviteCode.value || undefined,
      email_code: emailCode.value || undefined,
    })
    localStorage.setItem('or_token', res.data.auth_data || res.data.token)
    router.push('/')
  } catch (e: any) {
    error.value = e?.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Left: animated brand panel -->
    <div class="auth-left">
      <div class="grid-bg"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="particles">
        <span
          v-for="(p, i) in particles" :key="i"
          class="particle"
          :style="{
            left: p.x + '%', top: p.y + '%',
            width: p.size + 'px', height: p.size + 'px',
            animationDelay: p.delay + 's',
            animationDuration: p.dur + 's',
          }"
        ></span>
      </div>

      <div class="brand-content">
        <div class="brand-block stagger-1">
          <div class="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="var(--brand)" stroke-width="2"/>
              <path d="M12 7v10M7 9.5l5 3 5-3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h1>{{ siteTitle }}</h1>
        </div>
        <p class="brand-tagline stagger-2">{{ siteDesc }}</p>
        <div class="brand-features">
          <div class="feature-item stagger-3">
            <div class="feature-dot"></div>
            <span>全球节点覆盖</span>
          </div>
          <div class="feature-item stagger-4">
            <div class="feature-dot"></div>
            <span>零日志隐私保护</span>
          </div>
          <div class="feature-item stagger-5">
            <div class="feature-dot"></div>
            <span>高速稳定连接</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: form -->
    <div class="auth-right">
      <div class="auth-card stagger-2">
        <!-- Mobile-only brand header -->
        <div class="mobile-brand">
          <div class="brand-icon-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="var(--brand)" stroke-width="2"/>
              <path d="M12 7v10M7 9.5l5 3 5-3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="mobile-brand-name">{{ siteTitle }}</span>
        </div>

        <h2>创建账户</h2>

        <div v-if="error" class="auth-error">{{ error }}</div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label>邮箱地址</label>
            <input v-model="email" type="email" class="or-input" placeholder="you@email.com" autocomplete="email" />
          </div>

          <div class="form-group">
            <label>邮箱验证码</label>
            <div class="input-with-btn">
              <input v-model="emailCode" type="text" class="or-input" placeholder="验证码" />
              <button type="button" class="btn-ghost send-btn" :disabled="sending || countdown > 0" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '发送' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>密码</label>
            <input v-model="password" type="password" class="or-input" placeholder="至少 8 位" autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label>确认密码</label>
            <input v-model="confirmPwd" type="password" class="or-input" placeholder="再次输入密码" autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label>邀请码 <span class="optional">(可选)</span></label>
            <input v-model="inviteCode" type="text" class="or-input" placeholder="填写邀请码" />
          </div>

          <button type="submit" class="btn-gradient auth-btn" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>

        <p class="auth-switch">
          已有账户? <router-link to="/login">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.auth-page { min-height: 100vh; display: flex; background: var(--bg-0); }

// Left panel — identical to Login.vue
.auth-left {
  width: 460px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-1); border-right: 1px solid var(--border);
  @media (max-width: $bp-tablet) { display: none; }
}

.grid-bg {
  position: absolute; inset: 0; z-index: 0;
  background-image:
    linear-gradient(rgba(var(--brand-rgb), 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--brand-rgb), 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridMove 20s linear infinite;
}
@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(40px, 40px); }
}

.orb {
  position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0;
}
.orb-1 {
  width: 300px; height: 300px; top: -80px; left: -60px;
  background: rgba(var(--brand-rgb), 0.12);
  animation: float 8s ease-in-out infinite;
}
.orb-2 {
  width: 250px; height: 250px; bottom: -50px; right: -80px;
  background: rgba(var(--accent-rgb), 0.10);
  animation: float 10s ease-in-out infinite reverse;
}

.particles { position: absolute; inset: 0; z-index: 0; }
.particle {
  position: absolute; border-radius: 50%;
  background: rgba(var(--brand-rgb), 0.3);
  animation: particleFloat linear infinite;
}
@keyframes particleFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-30px) scale(1.2); opacity: 0.7; }
}

.brand-content { position: relative; z-index: 1; padding: 48px; }
.brand-block { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.brand-icon {
  width: 48px; height: 48px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--glow-brand);
}
.brand-block h1 { font-size: 26px; font-weight: 700; color: var(--text-1); letter-spacing: -0.5px; }
.brand-tagline { font-size: 15px; color: var(--text-2); margin-bottom: 36px; }
.brand-features { display: flex; flex-direction: column; gap: 14px; }
.feature-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-2); }
.feature-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.5); flex-shrink: 0;
}

// Right panel
.auth-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px; }
.auth-card {
  width: 100%; max-width: 380px;
  h2 { font-size: 26px; font-weight: 700; margin-bottom: 28px; letter-spacing: -0.3px; }
}

.auth-error {
  padding: 10px 12px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: $card-radius-sm; color: var(--danger); font-size: 13px; margin-bottom: $gap-md;
}
.auth-form { display: flex; flex-direction: column; gap: $gap-md; }
.form-group {
  display: flex; flex-direction: column; gap: 6px;
  label { font-size: 12px; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.5px; }
  .optional { color: var(--text-3); font-weight: 400; text-transform: none; }
}
.input-with-btn { display: flex; gap: $gap-sm; .or-input { flex: 1; } }
.send-btn { white-space: nowrap; padding: 10px 16px; font-size: 13px; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.auth-btn { width: 100%; height: 46px; font-size: 14px; margin-top: $gap-sm; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.auth-switch {
  text-align: center; margin-top: 24px; font-size: 13px; color: var(--text-3);
  a { color: var(--brand-light); font-weight: 600; }
}

// Mobile-only brand header
.mobile-brand {
  display: none;
  align-items: center; gap: 10px; margin-bottom: 28px;
  @media (max-width: $bp-tablet) { display: flex; }
}
.brand-icon-sm {
  width: 36px; height: 36px; background: var(--bg-2); border: 1px solid var(--border);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
}
.mobile-brand-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px; font-weight: 700; color: var(--text-1);
}
</style>

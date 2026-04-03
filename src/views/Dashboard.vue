<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useUserStore } from '../stores/user'
import { noticeApi } from '../api'
import SvgIcon from '../components/common/SvgIcon.vue'
import QRCode from 'qrcode'

const userStore = useUserStore()
const notices = ref<any[]>([])
const subLink = ref('')
const copied = ref(false)
const activeNotice = ref<any>(null)
const subRevealed = ref(false)
const showQR = ref(false)
const qrCanvas = ref<HTMLCanvasElement | null>(null)

async function generateQR() {
  showQR.value = !showQR.value
  if (showQR.value && subLink.value) {
    await nextTick()
    if (qrCanvas.value) {
      QRCode.toCanvas(qrCanvas.value, subLink.value, {
        width: 180, margin: 2,
        color: { dark: '#ffffff', light: '#00000000' },
      })
    }
  }
}

const planName = computed(() => userStore.subscribe?.plan?.name || 'Free')
const isActive = computed(() => !!userStore.subscribe?.plan)
const expireDate = computed(() => {
  if (!userStore.info?.expired_at) return '--'
  return new Date(userStore.info.expired_at * 1000).toLocaleDateString()
})
const balance = computed(() => ((userStore.info?.balance || 0) / 100).toFixed(2))
const commission = computed(() => ((userStore.info?.commission_balance || 0) / 100).toFixed(2))

// Personalized greeting
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return '早上好'
  if (h >= 12 && h < 18) return '下午好'
  if (h >= 18 && h < 23) return '晚上好'
  return '还没睡呢'
})
const username = computed(() => userStore.info?.email?.split('@')[0] || '')

// Days until expiry
const daysLeft = computed(() => {
  if (!userStore.info?.expired_at) return -1
  const ms = userStore.info.expired_at * 1000 - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
})

// Real upload / download percentages of total quota
const uploadPct = computed(() => {
  const total = userStore.totalTraffic
  if (!total) return 0
  return Math.min(100, Math.round(((userStore.subscribe?.u || 0) / total) * 100))
})
const downloadPct = computed(() => {
  const total = userStore.totalTraffic
  if (!total) return 0
  return Math.min(100, Math.round(((userStore.subscribe?.d || 0) / total) * 100))
})

onMounted(async () => {
  try {
    const noticeRes: any = await noticeApi.list()
    notices.value = noticeRes?.data || []
  } catch { /* silent */ }
  // subscribe_url comes from getSubscribe (already fetched by AppLayout)
  subLink.value = userStore.subscribe?.subscribe_url || ''
})

// Keep subLink in sync if subscribe loads after mount
watch(() => userStore.subscribe?.subscribe_url, (url) => {
  if (url) subLink.value = url
})

// Escape key closes modal
function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') activeNotice.value = null }
onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

function copyLink() {
  if (!subLink.value) return
  navigator.clipboard.writeText(subLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="dashboard">
    <div class="page-header stagger-1">
      <div class="greeting-block">
        <span class="greeting-sub">{{ greeting }}</span>
        <h1>{{ username || '控制台' }}</h1>
      </div>
      <button class="btn-gradient" @click="$router.push('/shop')">升级计划</button>
    </div>

    <!-- Bento Grid -->
    <div class="bento">
      <!-- 1. Status (2x1) — premium wallet card -->
      <div class="bento-item span-2 card-premium stagger-2" style="padding: 24px;">
        <div class="card-inner-mesh"></div>
        <div class="status-row">
          <div :class="['status-orb', { active: isActive }]">
            <div class="orb-core"></div>
            <div class="orb-ring"></div>
            <div class="orb-ring r2"></div>
          </div>
          <div class="status-info">
            <span class="status-badge" :class="isActive ? 'on' : 'off'">
              {{ isActive ? 'CONNECTED' : 'INACTIVE' }}
            </span>
            <h2 :class="['plan-name', { 'gradient-text': isActive }]">{{ planName }}</h2>
          </div>
        </div>
        <div class="meta-row">
          <div class="meta-block">
            <span class="meta-label">到期</span>
            <span class="meta-value">{{ expireDate }}</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-block">
            <span class="meta-label">余额</span>
            <span class="meta-value gradient-number">&yen;{{ balance }}</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-block">
            <span class="meta-label">佣金</span>
            <span class="meta-value gradient-number">&yen;{{ commission }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Traffic gauge (1x1) -->
      <div class="bento-item card-accent stagger-3" style="padding: 24px;">
        <span class="section-title">流量使用</span>
        <div class="gauge-area">
          <svg viewBox="0 0 120 70" class="gauge-svg">
            <defs>
              <linearGradient id="gG" x1="0%" y1="0%" x2="100%">
                <stop offset="0%" stop-color="var(--brand)"/>
                <stop offset="100%" stop-color="var(--accent)"/>
              </linearGradient>
            </defs>
            <path d="M15 60 A45 45 0 0 1 105 60" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="8" stroke-linecap="round"/>
            <path d="M15 60 A45 45 0 0 1 105 60" fill="none" stroke="url(#gG)" stroke-width="8" stroke-linecap="round"
              :stroke-dasharray="`${(userStore.trafficPercent / 100) * 141} 141`"
              style="transition: stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1);" />
          </svg>
          <div class="gauge-label">
            <span class="gauge-pct gradient-number">{{ userStore.trafficPercent }}%</span>
          </div>
        </div>
        <div class="traffic-nums">
          <span class="t-used">{{ userStore.formatBytes(userStore.usedTraffic) }}</span>
          <span class="t-total">/ {{ userStore.formatBytes(userStore.totalTraffic) }}</span>
        </div>
        <div class="traffic-detail">
          <span>&#8593; {{ userStore.formatBytes(userStore.subscribe?.u || 0) }}</span>
          <span>&#8595; {{ userStore.formatBytes(userStore.subscribe?.d || 0) }}</span>
        </div>
      </div>

      <!-- 3. Usage Detail (2x1) — real data, no mock -->
      <div class="bento-item span-2 card stagger-4" style="padding: 24px;">
        <div class="usage-header">
          <span class="section-title" style="margin:0">用量详情</span>
          <div v-if="daysLeft >= 0" class="days-chip" :class="{ urgent: daysLeft <= 7 }">
            <span class="days-num">{{ daysLeft }}</span>
            <span class="days-label">天后到期</span>
          </div>
          <span v-else class="days-chip no-plan">未订阅</span>
        </div>
        <div class="usage-bars">
          <div class="usage-row">
            <span class="usage-dir up">↑</span>
            <span class="usage-name">上传</span>
            <div class="usage-track">
              <div class="usage-fill up" :style="{ width: uploadPct + '%' }"></div>
            </div>
            <span class="usage-val">{{ userStore.formatBytes(userStore.subscribe?.u || 0) }}</span>
          </div>
          <div class="usage-row">
            <span class="usage-dir down">↓</span>
            <span class="usage-name">下载</span>
            <div class="usage-track">
              <div class="usage-fill down" :style="{ width: downloadPct + '%' }"></div>
            </div>
            <span class="usage-val">{{ userStore.formatBytes(userStore.subscribe?.d || 0) }}</span>
          </div>
        </div>
        <div class="usage-footer">
          <span class="usage-footer-label">本周期已用</span>
          <span class="usage-footer-val gradient-number">{{ userStore.formatBytes(userStore.usedTraffic) }}</span>
          <span class="usage-footer-sep">/</span>
          <span class="usage-footer-cap">{{ userStore.formatBytes(userStore.totalTraffic) }}</span>
          <span class="usage-footer-pct">{{ userStore.trafficPercent }}%</span>
        </div>
      </div>

      <!-- 4. Notices (1x1) -->
      <div class="bento-item card stagger-5" style="padding: 24px;">
        <span class="section-title">通知</span>
        <div v-if="notices.length" class="notice-list">
          <div
            v-for="n in notices.slice(0, 4)"
            :key="n.id"
            class="notice-row clickable"
            @click="activeNotice = n"
          >
            <span class="n-dot"></span>
            <span class="n-text">{{ n.title }}</span>
            <svg class="n-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
        <p v-else class="empty-text">暂无通知</p>
      </div>

      <!-- 5. Clients (2x auto) -->
      <div class="bento-item span-2 card stagger-6" style="padding: 24px;">
        <span class="section-title">客户端下载</span>
        <div class="client-row">
          <div v-for="c in [
            { n: 'Windows', icon: 'windows', g: 'linear-gradient(135deg, var(--brand), #6366f1)' },
            { n: 'iOS', icon: 'apple', g: 'linear-gradient(135deg, #a855f7, var(--brand))' },
            { n: 'Android', icon: 'android', g: 'linear-gradient(135deg, var(--accent), #06b6d4)' },
            { n: 'macOS', icon: 'macos', g: 'linear-gradient(135deg, #f97316, #eab308)' },
          ]" :key="c.n" class="client-chip">
            <div class="chip-icon" :style="{ background: c.g }">
              <SvgIcon :name="c.icon" :size="18" />
            </div>
            <span>{{ c.n }}</span>
          </div>
        </div>
      </div>

      <!-- 6. Subscribe (1x) -->
      <div class="bento-item card stagger-7" style="padding: 24px;">
        <span class="section-title">订阅链接</span>
        <div class="sub-col">
          <div class="sub-input-wrap" :class="{ masked: !subRevealed && subLink }">
            <input :value="subLink" readonly class="or-input mono-input" placeholder="暂无订阅" />
            <div v-if="!subRevealed && subLink" class="sub-mask" @click="subRevealed = true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>点击查看</span>
            </div>
          </div>
          <div class="sub-actions">
            <button class="btn-ghost copy-btn" @click="copyLink" :disabled="!subLink">
              {{ copied ? '✓ 已复制' : '复制' }}
            </button>
            <button class="btn-ghost qr-btn" @click="generateQR" :disabled="!subLink" :class="{ active: showQR }">
              <SvgIcon name="qrcode" :size="14" />
              <span>二维码</span>
            </button>
          </div>
          <!-- QR Code panel -->
          <transition name="fade-slide">
            <div v-if="showQR && subLink" class="qr-panel">
              <canvas ref="qrCanvas" class="qr-canvas"></canvas>
              <p class="qr-hint">移动端扫码导入</p>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Notice Modal — teleported to body so it overlays the sidebar too -->
    <teleport to="body">
      <transition name="fade-slide">
        <div v-if="activeNotice" class="notice-modal-overlay" @click.self="activeNotice = null">
          <div class="notice-modal">
            <div class="notice-modal-header">
              <h3>{{ activeNotice.title }}</h3>
              <button class="notice-close" @click="activeNotice = null">✕</button>
            </div>
            <div class="notice-modal-body" v-html="activeNotice.content"></div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: $gap-lg;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
}
.greeting-block { display: flex; flex-direction: column; gap: 1px; }
.greeting-sub {
  font-size: 11px; font-weight: 600; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.8px;
  font-family: 'Space Grotesk', sans-serif;
}

// Bento Grid
.bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $gap-md;
}
.bento-item { min-height: 0; }
.span-2 { grid-column: span 2; }

// Status card
.status-row { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
.status-orb {
  position: relative; width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
}
.orb-core {
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--text-3);
  transition: background 0.5s ease, box-shadow 0.5s ease;
  .active & {
    background: var(--grad-brand);
    box-shadow: 0 0 8px rgba(var(--brand-rgb), 0.5);
    animation: breathe 3.5s ease-in-out infinite;
  }
}
.orb-ring {
  position: absolute; inset: -10px; border-radius: 50%;
  border: 1px solid transparent;
  .active & { border-color: rgba(var(--brand-rgb), 0.16); }
}
// second ring removed — less is more
.orb-ring.r2 { display: none; }
.status-badge {
  display: inline-block;
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  padding: 3px 10px; border-radius: 5px;
  &.on {
    background: linear-gradient(90deg, rgba(var(--brand-rgb), 0.2), rgba(var(--accent-rgb), 0.15));
    color: var(--brand-light);
    border: 1px solid rgba(var(--brand-rgb), 0.3);
  }
  &.off { background: var(--bg-muted); color: var(--text-3); border: 1px solid var(--border); }
}
.plan-name {
  font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-top: 4px;
  &.gradient-text {
    background: var(--grad-number);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.meta-row { display: flex; align-items: center; gap: 24px; }
.meta-block { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.meta-value { font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.meta-divider { width: 1px; height: 32px; background: var(--border); }

// Gauge
.gauge-area { position: relative; display: flex; justify-content: center; margin: 8px 0; overflow: hidden; }
.gauge-svg { width: 140px; height: 80px; max-width: 100%; flex-shrink: 0; display: block; }
.gauge-label { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); }
.gauge-pct { font-size: 20px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.traffic-nums { text-align: center; }
.t-used { font-size: 15px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; background: var(--grad-number); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.t-total { font-size: 12px; color: var(--text-3); }
.traffic-detail { display: flex; justify-content: center; gap: 20px; margin-top: 4px; font-size: 11px; color: var(--text-3); }

// Usage detail
.usage-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: $gap-md;
}
.days-chip {
  display: flex; align-items: baseline; gap: 3px;
  padding: 3px 10px; border-radius: 20px;
  background: rgba(var(--brand-rgb), 0.10);
  border: 1px solid rgba(var(--brand-rgb), 0.2);
  &.urgent {
    background: rgba(239,68,68,0.10);
    border-color: rgba(239,68,68,0.25);
    .days-num { color: var(--danger); }
    .days-label { color: rgba(239,68,68,0.7); }
  }
  &.no-plan {
    background: var(--bg-muted);
    border-color: var(--border);
  }
}
.days-num { font-size: 13px; font-weight: 700; color: var(--brand-light); font-family: 'Space Grotesk', sans-serif; }
.days-label { font-size: 10px; color: var(--text-3); font-weight: 600; }

.usage-bars { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.usage-row { display: flex; align-items: center; gap: 10px; }
.usage-dir {
  font-size: 11px; font-weight: 700; width: 14px; text-align: center;
  &.up { color: var(--brand-light); }
  &.down { color: var(--accent); }
}
.usage-name { font-size: 11px; color: var(--text-3); font-weight: 600; width: 28px; flex-shrink: 0; }
.usage-track {
  flex: 1; height: 6px; border-radius: 3px;
  background: var(--bg-elevated);
  overflow: hidden;
}
.usage-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  &.up { background: linear-gradient(90deg, var(--brand), var(--brand-light)); }
  &.down { background: linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb),0.6)); }
}
.usage-val { font-size: 11px; font-weight: 600; color: var(--text-2); font-family: 'Space Grotesk', sans-serif; min-width: 50px; text-align: right; }

.usage-footer {
  display: flex; align-items: baseline; gap: 5px;
  padding-top: 12px; border-top: 1px solid var(--border);
}
.usage-footer-label { font-size: 11px; color: var(--text-3); font-weight: 600; flex: 1; }
.usage-footer-val { font-size: 14px; }
.usage-footer-sep { font-size: 11px; color: var(--text-3); }
.usage-footer-cap { font-size: 12px; color: var(--text-2); font-family: 'Space Grotesk', sans-serif; }
.usage-footer-pct {
  font-size: 10px; font-weight: 700; color: var(--brand-light);
  background: rgba(var(--brand-rgb), 0.10);
  padding: 1px 6px; border-radius: 4px; margin-left: 4px;
}

// Notices
.notice-list { display: flex; flex-direction: column; gap: 10px; }
.notice-row {
  display: flex; align-items: center; gap: 8px;
  &.clickable {
    cursor: pointer; padding: 4px 6px; border-radius: 6px; margin: 0 -6px;
    transition: background 0.12s;
    &:hover { background: rgba(var(--brand-rgb), 0.06); }
  }
}
.n-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--brand); flex-shrink: 0; }
.n-text { flex: 1; font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.n-arrow { color: var(--text-3); flex-shrink: 0; }
.empty-text { font-size: 13px; color: var(--text-3); }

// Notice modal
.notice-modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.notice-modal {
  width: 100%; max-width: 560px; max-height: 80vh;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: 16px; box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; overflow: hidden;
}
.notice-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  h3 { font-size: 16px; font-weight: 600; color: var(--text-1); }
}
.notice-close {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: var(--text-3); font-size: 14px;
  transition: all 0.12s;
  &:hover { background: rgba(255,255,255,0.06); color: var(--text-1); }
}
.notice-modal-body {
  flex: 1; overflow-y: auto; padding: 20px 24px;
  font-size: 14px; line-height: 1.7; color: var(--text-2);
  :deep(img) { max-width: 100%; border-radius: 8px; }
  :deep(a) { color: var(--brand-light); }
  :deep(p) { margin-bottom: 12px; }
}

// Clients
.client-row { display: flex; gap: 8px; flex-wrap: wrap; }
.client-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-2); font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  &:hover {
    border-color: rgba(var(--brand-rgb), 0.3);
    transform: translateY(-3px) scale(1.02);
    box-shadow: var(--shadow-md), var(--glow-brand);
    color: var(--text-1);
  }
  &:active { transform: scale(0.97); }
}
.chip-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

// Subscribe
.sub-col { display: flex; flex-direction: column; gap: $gap-sm; }
.mono-input { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.sub-actions { display: flex; gap: 6px; }
.copy-btn { flex: 1; font-size: 12px; padding: 10px; }
.qr-btn {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 10px 14px;
  &.active { background: rgba(var(--brand-rgb), 0.12); color: var(--brand-light); border-color: rgba(var(--brand-rgb), 0.3); }
}
.qr-panel {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px; border-radius: 10px;
  background: var(--bg-elevated); border: 1px solid var(--border);
}
.qr-canvas {
  border-radius: 8px;
  background: rgba(var(--brand-rgb), 0.08);
  padding: 8px;
}
.qr-hint { font-size: 11px; color: var(--text-3); font-weight: 500; }
.sub-input-wrap {
  position: relative;
  &.masked .or-input {
    filter: blur(5px);
    user-select: none;
    pointer-events: none;
  }
}
.sub-mask {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: rgba(var(--bg-card), 0.1);
  backdrop-filter: blur(2px);
  border-radius: $card-radius-sm;
  border: 1px dashed var(--border-active);
  color: var(--brand-light); font-size: 12px; font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(var(--brand-rgb), 0.06); border-style: solid; }
}

@media (max-width: $bp-desktop) {
  .bento { grid-template-columns: 1fr 1fr; }
  // span-2 becomes span-1 so status + gauge sit side by side
  .span-2 { grid-column: span 1; }
  .meta-row { flex-wrap: wrap; gap: 14px; }
  // Client chips: 2x2 grid at medium screens
  .client-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .client-chip { justify-content: flex-start; }
}
@media (max-width: $bp-mobile) {
  .bento { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>

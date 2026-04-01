<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { noticeApi } from '../api'
import SvgIcon from '../components/common/SvgIcon.vue'

const userStore = useUserStore()
const notices = ref<any[]>([])
const subLink = ref('')
const copied = ref(false)

const planName = computed(() => userStore.subscribe?.plan?.name || 'Free')
const isActive = computed(() => !!userStore.subscribe?.plan)
const expireDate = computed(() => {
  if (!userStore.info?.expired_at) return '--'
  return new Date(userStore.info.expired_at * 1000).toLocaleDateString()
})
const balance = computed(() => ((userStore.info?.balance || 0) / 100).toFixed(2))
const commission = computed(() => ((userStore.info?.commission_balance || 0) / 100).toFixed(2))

// Mock 7-day traffic data for chart
const chartData = ref([35, 52, 41, 68, 45, 78, 56])
const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const chartMax = computed(() => Math.max(...chartData.value, 1))

onMounted(async () => {
  try {
    const [noticeRes]: any[] = await Promise.all([
      noticeApi.list(),
      userStore.fetchSubscribe().then(() => userStore.subscribe),
    ])
    notices.value = noticeRes?.data || []
    subLink.value = userStore.subscribe?.subscribe_url || ''
  } catch { /* silent */ }
})

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
      <h1>控制台</h1>
      <button class="btn-gradient" @click="$router.push('/shop')">升级计划</button>
    </div>

    <!-- Bento Grid -->
    <div class="bento">
      <!-- 1. Status (2x1) -->
      <div class="bento-item span-2 card-accent stagger-2" style="padding: 24px;">
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
            <h2 class="plan-name">{{ planName }}</h2>
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
            <span class="meta-value">&yen;{{ balance }}</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-block">
            <span class="meta-label">佣金</span>
            <span class="meta-value">&yen;{{ commission }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Traffic gauge (1x1) -->
      <div class="bento-item card-glow stagger-3" style="padding: 24px;">
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
            <span class="gauge-pct">{{ userStore.trafficPercent }}%</span>
          </div>
        </div>
        <div class="traffic-nums">
          <span class="t-used">{{ userStore.formatBytes(userStore.usedTraffic) }}</span>
          <span class="t-total">/ {{ userStore.formatBytes(userStore.totalTraffic) }}</span>
        </div>
        <div class="traffic-detail">
          <span>&#8593; {{ userStore.formatBytes(userStore.info?.u || 0) }}</span>
          <span>&#8595; {{ userStore.formatBytes(userStore.info?.d || 0) }}</span>
        </div>
      </div>

      <!-- 3. 7-day chart (2x1) -->
      <div class="bento-item span-2 card stagger-4" style="padding: 24px;">
        <div class="chart-header">
          <span class="section-title" style="margin:0">近 7 天流量</span>
          <div class="chart-legend">
            <span class="legend-dot" style="background: var(--brand)"></span> 使用
          </div>
        </div>
        <div class="chart-area">
          <div class="chart-bars">
            <div v-for="(val, i) in chartData" :key="i" class="bar-col">
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ height: (val / chartMax) * 100 + '%', animationDelay: i * 0.08 + 's' }"
                ></div>
              </div>
              <span class="bar-label">{{ chartDays[i] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Notices (1x1) -->
      <div class="bento-item card stagger-5" style="padding: 24px;">
        <span class="section-title">通知</span>
        <div v-if="notices.length" class="notice-list">
          <div v-for="n in notices.slice(0, 4)" :key="n.id" class="notice-row">
            <span class="n-dot"></span>
            <span class="n-text">{{ n.title }}</span>
          </div>
        </div>
        <p v-else class="empty-text">暂无通知</p>
      </div>

      <!-- 5. Clients (2x auto) -->
      <div class="bento-item span-2 card stagger-6" style="padding: 24px;">
        <span class="section-title">客户端下载</span>
        <div class="client-row">
          <div v-for="(c, i) in [
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
        <span class="section-title">订阅</span>
        <div class="sub-col">
          <input :value="subLink" readonly class="or-input mono-input" placeholder="获取订阅后显示" />
          <button class="btn-ghost copy-btn" @click="copyLink">
            {{ copied ? '已复制' : '复制链接' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: $gap-lg;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
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
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--text-3);
  transition: all 0.5s;
  .active & { background: var(--accent); box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.6); }
}
.orb-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1.5px solid transparent;
  .active & {
    border-color: rgba(var(--accent-rgb), 0.3);
    animation: pulse-ring 2s ease-out infinite;
  }
}
.orb-ring.r2 {
  .active & { animation-delay: 0.6s; }
}
.status-badge {
  display: inline-block;
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  padding: 2px 8px; border-radius: 4px;
  &.on { background: rgba(var(--accent-rgb), 0.15); color: var(--accent); }
  &.off { background: rgba(255,255,255,0.06); color: var(--text-3); }
}
.plan-name { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-top: 4px; }

.meta-row { display: flex; align-items: center; gap: 24px; }
.meta-block { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.meta-value { font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.meta-divider { width: 1px; height: 32px; background: var(--border); }

// Gauge
.gauge-area { position: relative; display: flex; justify-content: center; margin: 8px 0; }
.gauge-svg { width: 140px; height: 80px; }
.gauge-label { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); }
.gauge-pct { font-size: 20px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.traffic-nums { text-align: center; }
.t-used { font-size: 15px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.t-total { font-size: 12px; color: var(--text-3); }
.traffic-detail { display: flex; justify-content: center; gap: 20px; margin-top: 4px; font-size: 11px; color: var(--text-3); }

// Chart
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-md; }
.chart-legend { font-size: 11px; color: var(--text-3); display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; }
.chart-area { height: 120px; }
.chart-bars { display: flex; gap: 8px; height: 100%; align-items: flex-end; }
.bar-col {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  height: 100%;
}
.bar-track {
  flex: 1; width: 100%; max-width: 28px; border-radius: 6px;
  background: rgba(255,255,255,0.03);
  display: flex; flex-direction: column; justify-content: flex-end;
  overflow: hidden;
}
.bar-fill {
  width: 100%; border-radius: 6px;
  background: var(--grad-brand);
  animation: barGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes barGrow {
  from { height: 0 !important; }
}
.bar-label { font-size: 10px; color: var(--text-3); font-weight: 600; }

// Notices
.notice-list { display: flex; flex-direction: column; gap: 10px; }
.notice-row { display: flex; align-items: center; gap: 8px; }
.n-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--brand); flex-shrink: 0; }
.n-text { font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty-text { font-size: 13px; color: var(--text-3); }

// Clients
.client-row { display: flex; gap: 10px; flex-wrap: wrap; }
.client-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-2); font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  &:hover {
    border-color: rgba(var(--brand-rgb), 0.2);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}
.chip-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

// Subscribe
.sub-col { display: flex; flex-direction: column; gap: $gap-sm; }
.mono-input { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.copy-btn { width: 100%; font-size: 12px; padding: 10px; }

@media (max-width: $bp-desktop) {
  .bento { grid-template-columns: 1fr 1fr; }
  .span-2 { grid-column: span 2; }
}
@media (max-width: $bp-mobile) {
  .bento { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>

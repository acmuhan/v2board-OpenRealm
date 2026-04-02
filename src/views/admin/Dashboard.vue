<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminStatApi, adminOrderApi } from '../../api/admin'

const { t } = useI18n()

// ── Stat cards ──────────────────────────────
interface OverrideStats {
  online_count: number
  today_income: number
  month_income: number
  pending_tickets: number
  total_users: number
  today_register: number
  today_commission: number
}

const stats = ref<OverrideStats | null>(null)

// ── Revenue chart (31 days) ────────────────
const revenueData = ref<number[]>([])
const chartMax = computed(() => Math.max(...revenueData.value, 1))
const chartDays = computed(() =>
  revenueData.value.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (revenueData.value.length - 1 - i))
    return d.getDate().toString()
  })
)

// ── Ranking tables ─────────────────────────
interface ServerRank {
  server_name: string
  server_type: string
  u: number
  d: number
  total: number
}
interface UserRank {
  user_id: number
  email: string
  u: number
  d: number
  total: number
}

const serverRank = ref<ServerRank[]>([])
const userRank = ref<UserRank[]>([])

// ── Recent orders ──────────────────────────
interface RecentOrder {
  trade_no: string
  email: string
  plan_name: string
  cycle: string
  total_amount: number
  status: number
  created_at: number
}

const recentOrders = ref<RecentOrder[]>([])

// ── Helpers ─────────────────────────────────
function formatCNY(cents: number): string {
  return (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(2) + ' GB'
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

function cycleName(cycle: string): string {
  const map: Record<string, string> = {
    month_price: t('admin.dashboard.cycleMonth'),
    quarter_price: t('admin.dashboard.cycleQuarter'),
    half_year_price: t('admin.dashboard.cycleHalfYear'),
    year_price: t('admin.dashboard.cycleYear'),
    two_year_price: t('admin.dashboard.cycleTwoYear'),
    three_year_price: t('admin.dashboard.cycleThreeYear'),
    onetime_price: t('admin.dashboard.cycleOnetime'),
  }
  return map[cycle] || cycle
}

function orderStatusLabel(status: number): string {
  const map: Record<number, string> = {
    0: t('admin.dashboard.orderPending'),
    1: t('admin.dashboard.orderActivating'),
    2: t('admin.dashboard.orderCancelled'),
    3: t('admin.dashboard.orderCompleted'),
    4: t('admin.dashboard.orderDeducted'),
  }
  return map[status] || '--'
}

function orderStatusClass(status: number): string {
  const map: Record<number, string> = { 0: 'warning', 1: 'info', 2: 'danger', 3: 'success', 4: 'info' }
  return map[status] || 'info'
}

// ── Stat cards definition ──────────────────
const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: t('admin.dashboard.onlineUsers'), value: stats.value.online_count.toLocaleString(), iconType: 'dot', color: 'var(--success)' },
    { label: t('admin.dashboard.todayRevenue'), value: '¥' + formatCNY(stats.value.today_income), iconType: 'currency', color: 'var(--brand)' },
    { label: t('admin.dashboard.monthRevenue'), value: '¥' + formatCNY(stats.value.month_income), iconType: 'chart', color: 'var(--accent)' },
    { label: t('admin.dashboard.pendingTickets'), value: stats.value.pending_tickets.toString(), iconType: 'ticket', color: 'var(--warning)' },
  ]
})

// ── API fetching ────────────────────────────
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const [overrideRes, orderRes, serverTodayRes, userTodayRes, recentOrderRes] = await Promise.allSettled([
      adminStatApi.getOverride(),
      adminStatApi.getOrder(),
      adminStatApi.getServerTodayRank(),
      adminStatApi.getUserTodayRank(),
      adminOrderApi.fetch({ page: 1, page_size: 10 }),
    ])

    // Override stats
    if (overrideRes.status === 'fulfilled' && overrideRes.value?.data) {
      const d = overrideRes.value.data
      stats.value = {
        online_count: d.online_count ?? 0,
        today_income: d.today_income ?? 0,
        month_income: d.month_income ?? 0,
        pending_tickets: d.pending_tickets ?? 0,
        total_users: d.total_users ?? 0,
        today_register: d.today_register ?? 0,
        today_commission: d.today_commission ?? 0,
      }
    } else {
      stats.value = null
    }

    // Revenue chart — use order data from adminStatApi.getOrder()
    if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value?.data)) {
      revenueData.value = orderRes.value.data.map((v: any) => v.amount ?? v.value ?? 0)
    } else {
      revenueData.value = []
    }

    // Server rank
    if (serverTodayRes.status === 'fulfilled' && Array.isArray(serverTodayRes.value?.data)) {
      serverRank.value = serverTodayRes.value.data.slice(0, 5).map((s: any) => ({
        server_name: s.server_name || s.name || 'Unknown',
        server_type: s.server_type || s.type || '--',
        u: s.u || 0,
        d: s.d || 0,
        total: (s.u || 0) + (s.d || 0),
      }))
    } else {
      serverRank.value = []
    }

    // User rank
    if (userTodayRes.status === 'fulfilled' && Array.isArray(userTodayRes.value?.data)) {
      userRank.value = userTodayRes.value.data.slice(0, 5).map((u: any) => ({
        user_id: u.user_id || u.id || 0,
        email: u.email || 'unknown',
        u: u.u || 0,
        d: u.d || 0,
        total: (u.u || 0) + (u.d || 0),
      }))
    } else {
      userRank.value = []
    }

    // Recent orders
    if (recentOrderRes.status === 'fulfilled' && Array.isArray(recentOrderRes.value?.data?.data)) {
      recentOrders.value = recentOrderRes.value.data.data.slice(0, 10)
    } else if (recentOrderRes.status === 'fulfilled' && Array.isArray(recentOrderRes.value?.data)) {
      recentOrders.value = recentOrderRes.value.data.slice(0, 10)
    } else {
      recentOrders.value = []
    }
  } catch (e: any) {
    error.value = e?.message || '加载数据失败，请刷新重试'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="admin-dashboard">
    <!-- Page Header -->
    <div class="page-header stagger-1">
      <h1>{{ t('admin.dashboard.title') }}</h1>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="dashboard-loading">
      <div class="loading-spinner"></div>
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="dashboard-error">
      <span class="error-icon-svg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </span>
      <span>{{ error }}</span>
    </div>

    <template v-else>

    <!-- ── 1. Top Stats Row ───────────────── -->
    <div class="stats-row">
      <div
        v-for="(card, i) in statCards"
        :key="card.label"
        class="stat-card card-accent"
        :class="'stagger-' + (i + 2)"
      >
        <div class="stat-icon" :style="{ color: card.color }">
          <!-- CSS-based icons instead of HTML entities -->
          <svg v-if="card.iconType === 'dot'" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
          <svg v-else-if="card.iconType === 'currency'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <svg v-else-if="card.iconType === 'chart'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <svg v-else-if="card.iconType === 'ticket'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 5H3a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2z"/></svg>
        </div>
        <div class="stat-body">
          <span class="stat-label">{{ card.label }}</span>
          <span class="stat-value">{{ card.value }}</span>
        </div>
      </div>
    </div>

    <!-- ── 2. Revenue Chart (31 days) ─────── -->
    <div class="card chart-card stagger-6" style="padding: 24px;">
      <div class="chart-header">
        <span class="section-title" style="margin: 0">{{ t('admin.dashboard.revenueChartTitle') }}</span>
        <div class="chart-legend">
          <span class="legend-dot"></span> {{ t('admin.dashboard.revenueLabel') }}
        </div>
      </div>
      <div class="chart-area">
        <div v-if="revenueData.length" class="chart-bars">
          <div v-for="(val, i) in revenueData" :key="i" class="bar-col">
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ height: (val / chartMax) * 100 + '%', animationDelay: i * 0.03 + 's' }"
              >
                <div class="bar-tooltip">¥{{ formatCNY(val) }}</div>
              </div>
            </div>
            <span v-if="i % 5 === 0 || i === revenueData.length - 1" class="bar-label">
              {{ chartDays[i] }}
            </span>
            <span v-else class="bar-label empty"></span>
          </div>
        </div>
        <div v-else class="chart-empty">{{ t('admin.dashboard.noData') }}</div>
      </div>
      <div v-if="revenueData.length" class="chart-summary">
        <div class="summary-item">
          <span class="summary-label">{{ t('admin.dashboard.totalLabel') }}</span>
          <span class="summary-value">¥{{ formatCNY(revenueData.reduce((a, b) => a + b, 0)) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('admin.dashboard.dailyAvg') }}</span>
          <span class="summary-value">¥{{ formatCNY(Math.round(revenueData.reduce((a, b) => a + b, 0) / (revenueData.length || 1))) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('admin.dashboard.peakValue') }}</span>
          <span class="summary-value">¥{{ formatCNY(Math.max(...revenueData)) }}</span>
        </div>
      </div>
    </div>

    <!-- ── 3. Ranking Tables Row ──────────── -->
    <div class="rank-row">
      <!-- Server Rank -->
      <div class="card rank-card stagger-7" style="padding: 24px;">
        <span class="section-title">{{ t('admin.dashboard.topServers') }}</span>
        <div class="rank-table-wrap">
          <table class="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ t('admin.dashboard.nodeHeader') }}</th>
                <th>{{ t('admin.dashboard.protocol') }}</th>
                <th>{{ t('admin.dashboard.upload') }}</th>
                <th>{{ t('admin.dashboard.download') }}</th>
                <th>{{ t('admin.dashboard.totalLabel') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in serverRank" :key="s.server_name">
                <td><span class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</span></td>
                <td class="name-cell">{{ s.server_name }}</td>
                <td><span class="or-tag info">{{ s.server_type }}</span></td>
                <td class="mono">{{ formatBytes(s.u) }}</td>
                <td class="mono">{{ formatBytes(s.d) }}</td>
                <td class="mono total-cell">{{ formatBytes(s.total) }}</td>
              </tr>
              <tr v-if="!serverRank.length">
                <td colspan="6" class="empty-row">{{ t('admin.dashboard.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Rank -->
      <div class="card rank-card stagger-8" style="padding: 24px;">
        <span class="section-title">{{ t('admin.dashboard.topUsers') }}</span>
        <div class="rank-table-wrap">
          <table class="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ t('admin.dashboard.userHeader') }}</th>
                <th>{{ t('admin.dashboard.upload') }}</th>
                <th>{{ t('admin.dashboard.download') }}</th>
                <th>{{ t('admin.dashboard.totalLabel') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, i) in userRank" :key="u.user_id">
                <td><span class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</span></td>
                <td class="name-cell">{{ u.email }}</td>
                <td class="mono">{{ formatBytes(u.u) }}</td>
                <td class="mono">{{ formatBytes(u.d) }}</td>
                <td class="mono total-cell">{{ formatBytes(u.total) }}</td>
              </tr>
              <tr v-if="!userRank.length">
                <td colspan="5" class="empty-row">{{ t('admin.dashboard.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── 4. Recent Orders ───────────────── -->
    <div class="card orders-card stagger-9" style="padding: 24px;">
      <div class="orders-header">
        <span class="section-title" style="margin: 0">{{ t('admin.dashboard.recentOrders') }}</span>
        <button class="btn-ghost btn-sm" @click="$router.push('/admin/orders')">{{ t('admin.dashboard.viewAll') }}</button>
      </div>
      <div class="orders-table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>{{ t('admin.dashboard.tradeNo') }}</th>
              <th>{{ t('admin.dashboard.userHeader') }}</th>
              <th>{{ t('admin.dashboard.planHeader') }}</th>
              <th>{{ t('admin.dashboard.cycle') }}</th>
              <th>{{ t('admin.dashboard.amount') }}</th>
              <th>{{ t('common.status') || 'Status' }}</th>
              <th>{{ t('admin.dashboard.time') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.trade_no">
              <td class="mono trade-no">{{ order.trade_no }}</td>
              <td>{{ order.email }}</td>
              <td class="plan-cell">{{ order.plan_name }}</td>
              <td>{{ cycleName(order.cycle) }}</td>
              <td class="mono amount-cell">¥{{ formatCNY(order.total_amount) }}</td>
              <td><span class="or-tag" :class="orderStatusClass(order.status)">{{ orderStatusLabel(order.status) }}</span></td>
              <td class="mono time-cell">{{ formatTime(order.created_at) }}</td>
            </tr>
            <tr v-if="!recentOrders.length">
              <td colspan="7" class="empty-row">{{ t('admin.dashboard.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    </template><!-- end v-else -->
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

// ── Page Layout ─────────────────────────────
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: $gap-md;

  h1 {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
}

.header-sub {
  font-size: 13px;
  color: var(--text-3);
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

// ── Loading / Error / Empty ──────────────────
.dashboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $gap-md;
  padding: $gap-xl * 3;
  color: var(--text-3);
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dashboard-error {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $gap-lg $gap-xl;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: $card-radius;
  color: var(--danger);
  font-size: 14px;
}

.error-icon-svg {
  display: flex;
  align-items: center;
  color: var(--danger);
}

.empty-row {
  text-align: center;
  color: var(--text-3) !important;
  font-size: 13px;
  padding: $gap-xl !important;
}

// ── Stats Row ───────────────────────────────
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $gap-md;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: $gap-md;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: -0.5px;
  background: var(--grad-brand);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: countUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

// ── Revenue Chart ───────────────────────────
.chart-card {
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $gap-lg;
}

.chart-legend {
  font-size: 11px;
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--grad-brand);
}

.chart-area {
  height: 200px;
}

.chart-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 13px;
}

.chart-bars {
  display: flex;
  gap: 4px;
  height: 100%;
  align-items: flex-end;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  min-width: 0;
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 24px;
  border-radius: 4px 4px 2px 2px;
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  width: 100%;
  border-radius: 4px 4px 2px 2px;
  background: var(--grad-brand);
  animation: barGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  position: relative;
  min-height: 2px;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(1.3);

    .bar-tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(-4px);
      pointer-events: auto;
    }
  }
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10;
  box-shadow: var(--shadow-md);
}

@keyframes barGrow {
  from {
    height: 0 !important;
  }
}

.bar-label {
  font-size: 9px;
  color: var(--text-3);
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;

  &.empty {
    visibility: hidden;
  }
}

.chart-summary {
  display: flex;
  gap: $gap-xl;
  margin-top: $gap-lg;
  padding-top: $gap-md;
  border-top: 1px solid var(--border);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  color: var(--text-1);
}

// ── Ranking Row ─────────────────────────────
.rank-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-md;
}

.rank-card {
  overflow: hidden;
}

.rank-table-wrap {
  overflow-x: auto;
}

.rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  td {
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    color: var(--text-2);
    white-space: nowrap;
  }

  tbody tr {
    transition: background 0.15s;

    &:hover {
      background: rgba(var(--brand-rgb), 0.04);
    }

    &:last-child td {
      border-bottom: none;
    }
  }
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-3);

  &.rank-1 {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #000;
  }

  &.rank-2 {
    background: linear-gradient(135deg, #94a3b8, #64748b);
    color: #fff;
  }

  &.rank-3 {
    background: linear-gradient(135deg, #d97706, #b45309);
    color: #fff;
  }
}

.name-cell {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: var(--text-1) !important;
}

.mono {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
}

.total-cell {
  color: var(--text-1) !important;
  font-weight: 700 !important;
}

// ── Orders Card ─────────────────────────────
.orders-card {
  overflow: hidden;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $gap-lg;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 12px;
}

.orders-table-wrap {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    color: var(--text-2);
    white-space: nowrap;
  }

  tbody tr {
    transition: background 0.15s;

    &:hover {
      background: rgba(var(--brand-rgb), 0.04);
    }

    &:last-child td {
      border-bottom: none;
    }
  }
}

.trade-no {
  font-size: 12px;
  color: var(--text-3) !important;
}

.plan-cell {
  font-weight: 600;
  color: var(--text-1) !important;
}

.amount-cell {
  font-weight: 700;
  color: var(--text-1) !important;
}

.time-cell {
  color: var(--text-3) !important;
  font-size: 12px;
}

// ── Responsive ──────────────────────────────
@media (max-width: $bp-desktop) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .rank-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: $bp-mobile) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: $gap-xs;
  }

  .stat-value {
    font-size: 18px;
  }

  .chart-area {
    height: 140px;
  }

  .chart-summary {
    flex-direction: column;
    gap: $gap-md;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminStatApi } from '../../api/admin'

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

const stats = ref<OverrideStats>({
  online_count: 0,
  today_income: 0,
  month_income: 0,
  pending_tickets: 0,
  total_users: 0,
  today_register: 0,
  today_commission: 0,
})

const mockStats: OverrideStats = {
  online_count: 1284,
  today_income: 328600,
  month_income: 12689400,
  pending_tickets: 7,
  total_users: 38420,
  today_register: 156,
  today_commission: 42300,
}

// ── Revenue chart (31 days) ────────────────
const revenueData = ref<number[]>([])
const mockRevenue = [
  3280, 4150, 5920, 3680, 6240, 7100, 4830,
  5560, 8210, 6930, 7450, 9120, 8340, 6780,
  5100, 7890, 9540, 10230, 8760, 7340, 6510,
  8900, 11200, 9870, 10560, 8430, 7210, 9640,
  12380, 11050, 9280,
]
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

const mockServerRank: ServerRank[] = [
  { server_name: 'Tokyo-BGP-01', server_type: 'vmess', u: 1284000000, d: 8562000000, total: 9846000000 },
  { server_name: 'Singapore-IPLC-02', server_type: 'trojan', u: 982000000, d: 7234000000, total: 8216000000 },
  { server_name: 'HongKong-CN2-03', server_type: 'vless', u: 856000000, d: 6120000000, total: 6976000000 },
  { server_name: 'US-SJC-04', server_type: 'hysteria', u: 623000000, d: 5430000000, total: 6053000000 },
  { server_name: 'Seoul-Premium-05', server_type: 'shadowsocks', u: 540000000, d: 4210000000, total: 4750000000 },
]

const mockUserRank: UserRank[] = [
  { user_id: 1042, email: 'alex***@gmail.com', u: 356000000, d: 2840000000, total: 3196000000 },
  { user_id: 2891, email: 'john***@outlook.com', u: 298000000, d: 2560000000, total: 2858000000 },
  { user_id: 539, email: 'test***@qq.com', u: 245000000, d: 1890000000, total: 2135000000 },
  { user_id: 4120, email: 'wang***@163.com', u: 198000000, d: 1560000000, total: 1758000000 },
  { user_id: 782, email: 'dev***@proton.me', u: 156000000, d: 1230000000, total: 1386000000 },
]

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

const mockOrders: RecentOrder[] = [
  { trade_no: 'OR202604011234', email: 'alex***@gmail.com', plan_name: 'Premium', cycle: 'month_price', total_amount: 9800, status: 3, created_at: Date.now() / 1000 - 120 },
  { trade_no: 'OR202604011233', email: 'john***@outlook.com', plan_name: 'Pro', cycle: 'quarter_price', total_amount: 24800, status: 3, created_at: Date.now() / 1000 - 480 },
  { trade_no: 'OR202604011232', email: 'wang***@163.com', plan_name: 'Basic', cycle: 'month_price', total_amount: 2900, status: 0, created_at: Date.now() / 1000 - 960 },
  { trade_no: 'OR202604011231', email: 'test***@qq.com', plan_name: 'Premium', cycle: 'year_price', total_amount: 88800, status: 3, created_at: Date.now() / 1000 - 1800 },
  { trade_no: 'OR202604011230', email: 'dev***@proton.me', plan_name: 'Pro', cycle: 'month_price', total_amount: 15800, status: 1, created_at: Date.now() / 1000 - 3600 },
  { trade_no: 'OR202604011229', email: 'li***@icloud.com', plan_name: 'Basic', cycle: 'month_price', total_amount: 2900, status: 3, created_at: Date.now() / 1000 - 5400 },
]

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
    month_price: '月付',
    quarter_price: '季付',
    half_year_price: '半年付',
    year_price: '年付',
    two_year_price: '两年付',
    three_year_price: '三年付',
    onetime_price: '一次性',
  }
  return map[cycle] || cycle
}

function orderStatusLabel(status: number): string {
  const map: Record<number, string> = { 0: '待支付', 1: '开通中', 2: '已取消', 3: '已完成', 4: '已折抵' }
  return map[status] || '未知'
}

function orderStatusClass(status: number): string {
  const map: Record<number, string> = { 0: 'warning', 1: 'info', 2: 'danger', 3: 'success', 4: 'info' }
  return map[status] || 'info'
}

// ── Stat cards definition ──────────────────
const statCards = computed(() => [
  { label: '在线用户', value: stats.value.online_count.toLocaleString(), icon: '&#9679;', color: 'var(--success)' },
  { label: '今日收入', value: '¥' + formatCNY(stats.value.today_income), icon: '&#36;', color: 'var(--brand)' },
  { label: '月收入', value: '¥' + formatCNY(stats.value.month_income), icon: '&#9733;', color: 'var(--accent)' },
  { label: '待处理工单', value: stats.value.pending_tickets.toString(), icon: '&#9993;', color: 'var(--warning)' },
])

// ── API fetching ────────────────────────────
const loading = ref(true)

onMounted(async () => {
  try {
    const [overrideRes, orderRes, serverTodayRes, userTodayRes] = await Promise.allSettled([
      adminStatApi.getOverride(),
      adminStatApi.getOrder(),
      adminStatApi.getServerTodayRank(),
      adminStatApi.getUserTodayRank(),
    ])

    // Override stats
    if (overrideRes.status === 'fulfilled' && overrideRes.value?.data) {
      const d = overrideRes.value.data
      stats.value = {
        online_count: d.online_count ?? d.month_register ?? mockStats.online_count,
        today_income: d.today_income ?? mockStats.today_income,
        month_income: d.month_income ?? mockStats.month_income,
        pending_tickets: d.pending_tickets ?? d.last_month_income ?? mockStats.pending_tickets,
        total_users: d.total_users ?? mockStats.total_users,
        today_register: d.today_register ?? mockStats.today_register,
        today_commission: d.today_commission ?? mockStats.today_commission,
      }
    } else {
      stats.value = { ...mockStats }
    }

    // Revenue chart — use order data or fallback
    if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value?.data)) {
      revenueData.value = orderRes.value.data.map((v: any) => v.amount ?? v.value ?? 0)
      if (revenueData.value.length < 7) revenueData.value = [...mockRevenue]
    } else {
      revenueData.value = [...mockRevenue]
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
      if (!serverRank.value.length) serverRank.value = [...mockServerRank]
    } else {
      serverRank.value = [...mockServerRank]
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
      if (!userRank.value.length) userRank.value = [...mockUserRank]
    } else {
      userRank.value = [...mockUserRank]
    }

    recentOrders.value = [...mockOrders]
  } catch {
    // Full fallback to mock data
    stats.value = { ...mockStats }
    revenueData.value = [...mockRevenue]
    serverRank.value = [...mockServerRank]
    userRank.value = [...mockUserRank]
    recentOrders.value = [...mockOrders]
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="admin-dashboard">
    <!-- Page Header -->
    <div class="page-header stagger-1">
      <h1>仪表盘</h1>
      <span class="header-sub">Admin Overview</span>
    </div>

    <!-- ── 1. Top Stats Row ───────────────── -->
    <div class="stats-row">
      <div
        v-for="(card, i) in statCards"
        :key="card.label"
        class="stat-card card-accent"
        :class="'stagger-' + (i + 2)"
      >
        <div class="stat-icon" :style="{ color: card.color }">
          <span v-html="card.icon"></span>
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
        <span class="section-title" style="margin: 0">近 31 天收入趋势</span>
        <div class="chart-legend">
          <span class="legend-dot"></span> 收入 (CNY)
        </div>
      </div>
      <div class="chart-area">
        <div class="chart-bars">
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
      </div>
      <div class="chart-summary">
        <div class="summary-item">
          <span class="summary-label">31天总计</span>
          <span class="summary-value">¥{{ formatCNY(revenueData.reduce((a, b) => a + b, 0)) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">日均</span>
          <span class="summary-value">¥{{ formatCNY(Math.round(revenueData.reduce((a, b) => a + b, 0) / (revenueData.length || 1))) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">峰值</span>
          <span class="summary-value">¥{{ formatCNY(Math.max(...revenueData)) }}</span>
        </div>
      </div>
    </div>

    <!-- ── 3. Ranking Tables Row ──────────── -->
    <div class="rank-row">
      <!-- Server Rank -->
      <div class="card rank-card stagger-7" style="padding: 24px;">
        <span class="section-title">今日流量 TOP 服务器</span>
        <div class="rank-table-wrap">
          <table class="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>节点</th>
                <th>协议</th>
                <th>上行</th>
                <th>下行</th>
                <th>总计</th>
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
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Rank -->
      <div class="card rank-card stagger-8" style="padding: 24px;">
        <span class="section-title">今日流量 TOP 用户</span>
        <div class="rank-table-wrap">
          <table class="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>用户</th>
                <th>上行</th>
                <th>下行</th>
                <th>总计</th>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── 4. Recent Orders ───────────────── -->
    <div class="card orders-card stagger-9" style="padding: 24px;">
      <div class="orders-header">
        <span class="section-title" style="margin: 0">最近订单</span>
        <button class="btn-ghost btn-sm" @click="$router.push('/admin/orders')">查看全部</button>
      </div>
      <div class="orders-table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>用户</th>
              <th>套餐</th>
              <th>周期</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
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
          </tbody>
        </table>
      </div>
    </div>
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

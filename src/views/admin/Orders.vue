<script setup lang="ts">
import { ref, computed } from 'vue'


// ── Types ──
interface Order {
  trade_no: string
  user_id: number
  user_email: string
  plan_id: number
  plan_name: string
  period: string
  total_amount: number
  status: number // 0=pending, 1=processing, 2=cancelled, 3=completed
  commission_status: number // 0=pending, 1=valid, 2=invalid
  commission_balance: number
  created_at: number
  paid_at: number | null
  callback_no: string | null
}

// ── State ──
const search = ref('')
const statusFilter = ref('all')
const page = ref(1)
const pageSize = 10
const showDetail = ref(false)
const detailOrder = ref<Order | null>(null)
const showActions = ref<string | null>(null)

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: '0', label: '待支付' },
  { value: '1', label: '开通中' },
  { value: '2', label: '已取消' },
  { value: '3', label: '已完成' },
]

const statusMap: Record<number, { text: string; cls: string }> = {
  0: { text: '待支付', cls: 'warning' },
  1: { text: '开通中', cls: 'info' },
  2: { text: '已取消', cls: 'danger' },
  3: { text: '已完成', cls: 'success' },
}

const commissionStatusMap: Record<number, { text: string; cls: string }> = {
  0: { text: '待确认', cls: 'warning' },
  1: { text: '有效', cls: 'success' },
  2: { text: '无效', cls: 'danger' },
}

const periodMap: Record<string, string> = {
  month_price: '月付',
  quarter_price: '季付',
  half_year_price: '半年付',
  year_price: '年付',
  two_year_price: '两年付',
  three_year_price: '三年付',
  onetime_price: '一次性',
}

// ── Mock Data ──
const orders = ref<Order[]>([
  { trade_no: 'OR20240101001', user_id: 1, user_email: 'alice@example.com', plan_id: 1, plan_name: '基础版', period: 'month_price', total_amount: 1990, status: 3, commission_status: 1, commission_balance: 199, created_at: 1704067200, paid_at: 1704067500, callback_no: 'PAY_2024010100001' },
  { trade_no: 'OR20240115002', user_id: 2, user_email: 'bob@test.io', plan_id: 2, plan_name: '专业版', period: 'year_price', total_amount: 29990, status: 3, commission_status: 1, commission_balance: 2999, created_at: 1705276800, paid_at: 1705277100, callback_no: 'PAY_2024011500002' },
  { trade_no: 'OR20240202003', user_id: 3, user_email: 'charlie@mail.com', plan_id: 1, plan_name: '基础版', period: 'quarter_price', total_amount: 4990, status: 0, commission_status: 0, commission_balance: 0, created_at: 1706832000, paid_at: null, callback_no: null },
  { trade_no: 'OR20240210004', user_id: 4, user_email: 'diana@corp.net', plan_id: 3, plan_name: '企业版', period: 'year_price', total_amount: 79990, status: 3, commission_status: 1, commission_balance: 7999, created_at: 1707523200, paid_at: 1707523800, callback_no: 'PAY_2024021000004' },
  { trade_no: 'OR20240225005', user_id: 6, user_email: 'frank@demo.dev', plan_id: 2, plan_name: '专业版', period: 'month_price', total_amount: 3990, status: 2, commission_status: 2, commission_balance: 0, created_at: 1708819200, paid_at: null, callback_no: null },
  { trade_no: 'OR20240305006', user_id: 7, user_email: 'grace@web3.xyz', plan_id: 1, plan_name: '基础版', period: 'half_year_price', total_amount: 8990, status: 1, commission_status: 0, commission_balance: 899, created_at: 1709596800, paid_at: 1709597200, callback_no: 'PAY_2024030500006' },
  { trade_no: 'OR20240318007', user_id: 8, user_email: 'henry@pro.cc', plan_id: 3, plan_name: '企业版', period: 'onetime_price', total_amount: 199990, status: 3, commission_status: 1, commission_balance: 19999, created_at: 1710720000, paid_at: 1710720600, callback_no: 'PAY_2024031800007' },
  { trade_no: 'OR20240401008', user_id: 2, user_email: 'bob@test.io', plan_id: 2, plan_name: '专业版', period: 'month_price', total_amount: 3990, status: 0, commission_status: 0, commission_balance: 0, created_at: 1711929600, paid_at: null, callback_no: null },
])

// ── Computed ──
const filteredOrders = computed(() => {
  let list = orders.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o => o.user_email.toLowerCase().includes(q) || o.trade_no.toLowerCase().includes(q))
  }
  if (statusFilter.value !== 'all') {
    const s = parseInt(statusFilter.value)
    list = list.filter(o => o.status === s)
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / pageSize)))
const pagedOrders = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

// ── Helpers ──
function formatDate(ts: number | null) {
  if (!ts) return '--'
  return new Date(ts * 1000).toLocaleString('zh-CN')
}

function formatAmount(cents: number) {
  return '\u00a5' + (cents / 100).toFixed(2)
}

// ── Actions ──
function markPaid(order: Order) {
  order.status = 3
  order.paid_at = Math.floor(Date.now() / 1000)
  order.commission_status = 1
  showActions.value = null
}

function cancelOrder(order: Order) {
  order.status = 2
  order.commission_status = 2
  showActions.value = null
}

function openDetail(order: Order) {
  detailOrder.value = order
  showDetail.value = true
  showActions.value = null
}

function toggleActions(tradeNo: string) {
  showActions.value = showActions.value === tradeNo ? null : tradeNo
}
</script>

<template>
  <div class="admin-orders" @click="showActions = null">
    <!-- Top Bar -->
    <div class="top-bar stagger-1">
      <div class="bar-left">
        <input v-model="search" class="or-input search-input" placeholder="搜索邮箱或订单号..." />
        <select v-model="statusFilter" class="or-input filter-select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="bar-right">
        <span class="order-count">共 {{ filteredOrders.length }} 条</span>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-wrap stagger-2">
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>套餐</th>
            <th>周期</th>
            <th>金额</th>
            <th>状态</th>
            <th>佣金</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(order, idx) in pagedOrders" :key="order.trade_no" :class="`stagger-${idx + 3}`">
            <td class="col-tradeno">{{ order.trade_no }}</td>
            <td class="col-email">{{ order.user_email }}</td>
            <td>{{ order.plan_name }}</td>
            <td>{{ periodMap[order.period] || order.period }}</td>
            <td class="col-mono">{{ formatAmount(order.total_amount) }}</td>
            <td>
              <span :class="['or-tag', statusMap[order.status]?.cls || 'info']">
                {{ statusMap[order.status]?.text || '未知' }}
              </span>
            </td>
            <td class="col-mono">{{ order.commission_balance ? formatAmount(order.commission_balance) : '--' }}</td>
            <td class="col-date">{{ formatDate(order.created_at) }}</td>
            <td class="col-actions">
              <div class="actions-wrap">
                <button class="action-trigger" @click.stop="toggleActions(order.trade_no)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
                <transition name="fade-slide">
                  <div v-if="showActions === order.trade_no" class="actions-dropdown" @click.stop>
                    <button v-if="order.status === 0" @click="markPaid(order)">确认支付</button>
                    <button v-if="order.status === 0 || order.status === 1" @click="cancelOrder(order)">取消订单</button>
                    <button @click="openDetail(order)">查看详情</button>
                  </div>
                </transition>
              </div>
            </td>
          </tr>
          <tr v-if="!pagedOrders.length">
            <td colspan="9" class="empty-row">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination stagger-10">
      <button class="btn-ghost pg-btn" :disabled="page <= 1" @click="page--">上一页</button>
      <span class="pg-info">{{ page }} / {{ totalPages }}</span>
      <button class="btn-ghost pg-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>

    <!-- Detail Modal -->
    <teleport to="body">
      <transition name="fade-slide">
        <div v-if="showDetail && detailOrder" class="modal-overlay" @click.self="showDetail = false">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>订单详情</h3>
              <button class="modal-close" @click="showDetail = false">&times;</button>
            </div>
            <div class="modal-body">
              <!-- Order Info -->
              <div class="detail-section">
                <div class="detail-title">基本信息</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">订单号</span>
                    <span class="detail-value mono">{{ detailOrder.trade_no }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">用户邮箱</span>
                    <span class="detail-value">{{ detailOrder.user_email }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">套餐</span>
                    <span class="detail-value">{{ detailOrder.plan_name }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">周期</span>
                    <span class="detail-value">{{ periodMap[detailOrder.period] || detailOrder.period }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">金额</span>
                    <span class="detail-value mono highlight">{{ formatAmount(detailOrder.total_amount) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">状态</span>
                    <span :class="['or-tag', statusMap[detailOrder.status]?.cls || 'info']">
                      {{ statusMap[detailOrder.status]?.text || '未知' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Time Info -->
              <div class="detail-section">
                <div class="detail-title">时间信息</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">创建时间</span>
                    <span class="detail-value mono">{{ formatDate(detailOrder.created_at) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">支付时间</span>
                    <span class="detail-value mono">{{ formatDate(detailOrder.paid_at) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">回调单号</span>
                    <span class="detail-value mono">{{ detailOrder.callback_no || '--' }}</span>
                  </div>
                </div>
              </div>

              <!-- Commission Log -->
              <div class="detail-section">
                <div class="detail-title">佣金记录</div>
                <div class="commission-card">
                  <div class="comm-row">
                    <span class="comm-label">佣金金额</span>
                    <span class="comm-value mono">{{ detailOrder.commission_balance ? formatAmount(detailOrder.commission_balance) : '--' }}</span>
                  </div>
                  <div class="comm-row">
                    <span class="comm-label">佣金状态</span>
                    <span :class="['or-tag', commissionStatusMap[detailOrder.commission_status]?.cls || 'info']">
                      {{ commissionStatusMap[detailOrder.commission_status]?.text || '未知' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Modal Actions -->
              <div class="modal-footer">
                <button
                  v-if="detailOrder.status === 0"
                  class="btn-gradient"
                  @click="markPaid(detailOrder); showDetail = false"
                >确认支付</button>
                <button
                  v-if="detailOrder.status === 0 || detailOrder.status === 1"
                  class="btn-ghost danger-text"
                  @click="cancelOrder(detailOrder); showDetail = false"
                >取消订单</button>
                <button class="btn-ghost" @click="showDetail = false">关闭</button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-orders {
  max-width: 1200px;
}

// ── Top Bar ──
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $gap-md;
  margin-bottom: $gap-lg;
}
.bar-left {
  display: flex;
  gap: $gap-sm;
  flex: 1;
  min-width: 0;
}
.bar-right {
  display: flex;
  align-items: center;
}
.order-count {
  font-size: 13px;
  color: var(--text-3);
  font-family: 'JetBrains Mono', monospace;
}
.search-input {
  max-width: 300px;
}
.filter-select {
  max-width: 140px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%238b9bb8' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

// ── Table ──
.table-wrap {
  overflow-x: auto;
  border-radius: $card-radius;
  border: 1px solid var(--border);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background: var(--bg-2);
    th {
      padding: 12px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      border-bottom: 1px solid var(--border);
    }
  }

  tbody tr {
    background: var(--bg-card);
    transition: background 0.15s;

    &:hover {
      background: var(--bg-card-hover);
    }

    &:not(:last-child) td {
      border-bottom: 1px solid var(--border);
    }
  }

  td {
    padding: 12px 14px;
    color: var(--text-2);
    white-space: nowrap;
  }
}
.col-tradeno {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-1) !important;
  font-weight: 500;
}
.col-email {
  color: var(--text-1) !important;
}
.col-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.col-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-3) !important;
}
.col-actions {
  width: 40px;
  text-align: center;
}
.empty-row {
  text-align: center;
  padding: 40px 14px !important;
  color: var(--text-3) !important;
}

// ── Actions Dropdown ──
.actions-wrap {
  position: relative;
  display: inline-block;
}
.action-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-3);
  transition: all 0.15s;

  &:hover {
    background: rgba(var(--brand-rgb), 0.1);
    color: var(--text-1);
  }
}
.actions-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 50;
  min-width: 120px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
  box-shadow: var(--shadow-lg);
  padding: 4px;
  display: flex;
  flex-direction: column;

  button {
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-2);
    background: transparent;
    border-radius: 6px;
    text-align: left;
    transition: all 0.12s;

    &:hover {
      background: rgba(var(--brand-rgb), 0.1);
      color: var(--text-1);
    }
  }
}

// ── Pagination ──
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $gap-md;
  margin-top: $gap-lg;
}
.pg-btn {
  padding: 8px 18px;
  font-size: 13px;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
.pg-info {
  font-size: 13px;
  color: var(--text-3);
  font-family: 'JetBrains Mono', monospace;
}

// ── Modal ──
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $gap-lg;
}
.modal-card {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $gap-lg $gap-lg $gap-md;

  h3 {
    font-size: 18px;
    font-weight: 700;
  }
}
.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-3);
  font-size: 22px;
  border-radius: 8px;
  transition: all 0.15s;

  &:hover {
    background: rgba(var(--brand-rgb), 0.1);
    color: var(--text-1);
  }
}
.modal-body {
  padding: 0 $gap-lg $gap-lg;
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
}

// ── Detail Sections ──
.detail-section {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
}
.detail-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-sm $gap-md;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 11px;
  color: var(--text-3);
}
.detail-value {
  font-size: 14px;
  color: var(--text-1);
  font-weight: 500;

  &.mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  &.highlight {
    color: var(--brand-light);
    font-weight: 700;
  }
}

// ── Commission Card ──
.commission-card {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
  padding: $gap-md;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
}
.comm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.comm-label {
  font-size: 13px;
  color: var(--text-2);
}
.comm-value {
  font-size: 14px;
  color: var(--text-1);
  font-weight: 600;

  &.mono {
    font-family: 'JetBrains Mono', monospace;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $gap-sm;
  padding-top: $gap-sm;
  border-top: 1px solid var(--border);
}
.danger-text {
  color: var(--danger) !important;

  &:hover {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: rgba(239, 68, 68, 0.3) !important;
  }
}

// ── Responsive ──
@media (max-width: $bp-mobile) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .bar-left {
    flex-direction: column;
  }
  .search-input,
  .filter-select {
    max-width: 100%;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

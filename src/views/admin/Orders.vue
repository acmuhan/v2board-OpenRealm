<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { adminOrderApi } from '../../api/admin'

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
const orders = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const error = ref('')
const toast = ref('')
const toastType = ref<'success' | 'error'>('success')

const search = ref('')
const searchType = ref<'trade_no' | 'email'>('trade_no')
const statusFilter = ref('all')

const showDetail = ref(false)
const detailOrder = ref<Order | null>(null)
const detailLoading = ref(false)
const showActions = ref<string | null>(null)

// ── Assign Modal ──
const showAssign = ref(false)
const assignTradeNo = ref('')
const assignMethod = ref('')
const assignLoading = ref(false)

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

const totalPages = ref(1)

// ── Toast ──
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}

// ── Helpers ──
function formatDate(ts: number | null) {
  if (!ts) return '--'
  return new Date(ts * 1000).toLocaleString('zh-CN')
}

function formatAmount(cents: number) {
  return '\u00a5' + (cents / 100).toFixed(2)
}

// ── Data Loading ──
async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, unknown> = { page: page.value }

    if (statusFilter.value !== 'all') {
      params.status = parseInt(statusFilter.value)
    }

    const q = search.value.trim()
    if (q) {
      if (searchType.value === 'email') {
        params.email = q
      } else {
        params.trade_no = q
      }
    }

    const res = await adminOrderApi.fetch(params)
    const body = res.data
    orders.value = body?.data ?? []
    total.value = body?.total ?? 0
    totalPages.value = Math.max(1, Math.ceil(total.value / pageSize))
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } }; message?: string })
      ?.response?.data?.message ?? (e as { message?: string })?.message ?? '加载失败'
    error.value = msg
  } finally {
    loading.value = false
  }
}

// ── Watchers ──
watch([statusFilter, searchType], () => {
  page.value = 1
  loadOrders()
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadOrders()
  }, 400)
})

watch(page, () => {
  loadOrders()
})

// ── Lifecycle ──
onMounted(() => {
  loadOrders()
})

// ── Actions ──
function toggleActions(tradeNo: string) {
  showActions.value = showActions.value === tradeNo ? null : tradeNo
}

async function openDetail(order: Order) {
  showActions.value = null
  detailLoading.value = true
  showDetail.value = true
  detailOrder.value = order
  try {
    const res = await adminOrderApi.detail({ trade_no: order.trade_no })
    detailOrder.value = res.data?.data ?? res.data ?? order
  } catch {
    // fall back to row data already set
  } finally {
    detailLoading.value = false
  }
}

async function markPaid(tradeNo: string) {
  showActions.value = null
  try {
    await adminOrderApi.paid({ trade_no: tradeNo })
    showToast('已标记为支付成功')
    showDetail.value = false
    loadOrders()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? '操作失败'
    showToast(msg, 'error')
  }
}

async function cancelOrder(tradeNo: string) {
  showActions.value = null
  try {
    await adminOrderApi.cancel({ trade_no: tradeNo })
    showToast('订单已取消')
    showDetail.value = false
    loadOrders()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? '操作失败'
    showToast(msg, 'error')
  }
}

function openAssign(tradeNo: string) {
  showActions.value = null
  assignTradeNo.value = tradeNo
  assignMethod.value = ''
  showAssign.value = true
}

async function confirmAssign() {
  if (!assignMethod.value.trim()) return
  assignLoading.value = true
  try {
    await adminOrderApi.assign({ trade_no: assignTradeNo.value, method: assignMethod.value.trim() })
    showToast('支付方式已分配')
    showAssign.value = false
    loadOrders()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? '操作失败'
    showToast(msg, 'error')
  } finally {
    assignLoading.value = false
  }
}

function prevPage() {
  if (page.value > 1) page.value--
}

function nextPage() {
  if (page.value < totalPages.value) page.value++
}
</script>

<template>
  <div class="admin-orders" @click="showActions = null">

    <!-- Toast -->
    <transition name="fade-slide">
      <div v-if="toast" :class="['or-toast', toastType]">{{ toast }}</div>
    </transition>

    <!-- Top Bar -->
    <div class="page-header stagger-1">
      <div class="bar-left">
        <div class="search-group">
          <select v-model="searchType" class="or-input search-type-select">
            <option value="trade_no">订单号</option>
            <option value="email">邮箱</option>
          </select>
          <input
            v-model="search"
            class="or-input search-input"
            :placeholder="searchType === 'email' ? '搜索用户邮箱...' : '搜索订单号...'"
          />
        </div>
        <select v-model="statusFilter" class="or-input filter-select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="bar-right">
        <span class="order-count">共 {{ total }} 条</span>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner stagger-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="16" r="1" fill="currentColor"/>
      </svg>
      {{ error }}
      <button class="retry-btn" @click="loadOrders">重试</button>
    </div>

    <!-- Data Table -->
    <div class="table-wrap stagger-2">
      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
      </div>

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
          <tr v-for="(order, idx) in orders" :key="order.trade_no" :class="`stagger-${idx + 3}`">
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
                    <button v-if="order.status === 0" @click="markPaid(order.trade_no)">确认支付</button>
                    <button v-if="order.status === 0 || order.status === 1" @click="cancelOrder(order.trade_no)">取消订单</button>
                    <button v-if="order.status === 0" @click="openAssign(order.trade_no)">分配支付</button>
                    <button @click="openDetail(order)">查看详情</button>
                  </div>
                </transition>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!loading && !error && orders.length === 0">
            <td colspan="9" class="empty-row">
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.3">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p>暂无订单数据</p>
              </div>
            </td>
          </tr>

          <!-- Loading placeholder rows -->
          <tr v-if="loading && orders.length === 0" v-for="n in 5" :key="`sk-${n}`" class="skeleton-row">
            <td colspan="9"><div class="skeleton-bar"></div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination stagger-10">
      <button class="btn-ghost pg-btn" :disabled="page <= 1 || loading" @click="prevPage">上一页</button>
      <span class="pg-info">{{ page }} / {{ totalPages }}</span>
      <button class="btn-ghost pg-btn" :disabled="page >= totalPages || loading" @click="nextPage">下一页</button>
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
              <div v-if="detailLoading" class="detail-loading">
                <div class="spinner"></div>
              </div>

              <template v-else>
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
                    @click="markPaid(detailOrder.trade_no)"
                  >确认支付</button>
                  <button
                    v-if="detailOrder.status === 0"
                    class="btn-ghost"
                    @click="openAssign(detailOrder.trade_no); showDetail = false"
                  >分配支付</button>
                  <button
                    v-if="detailOrder.status === 0 || detailOrder.status === 1"
                    class="btn-ghost danger-text"
                    @click="cancelOrder(detailOrder.trade_no)"
                  >取消订单</button>
                  <button class="btn-ghost" @click="showDetail = false">关闭</button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Assign Modal -->
    <teleport to="body">
      <transition name="fade-slide">
        <div v-if="showAssign" class="modal-overlay" @click.self="showAssign = false">
          <div class="modal-card card modal-sm">
            <div class="modal-header">
              <h3>分配支付方式</h3>
              <button class="modal-close" @click="showAssign = false">&times;</button>
            </div>
            <div class="modal-body">
              <div class="detail-section">
                <div class="detail-item">
                  <span class="detail-label">订单号</span>
                  <span class="detail-value mono">{{ assignTradeNo }}</span>
                </div>
              </div>
              <div class="assign-field">
                <label class="detail-label">支付方式</label>
                <input
                  v-model="assignMethod"
                  class="or-input"
                  placeholder="输入支付方式标识，例如 alipay"
                  @keyup.enter="confirmAssign"
                />
              </div>
              <div class="modal-footer">
                <button class="btn-gradient" :disabled="!assignMethod.trim() || assignLoading" @click="confirmAssign">
                  {{ assignLoading ? '提交中...' : '确认分配' }}
                </button>
                <button class="btn-ghost" @click="showAssign = false">取消</button>
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
  position: relative;
}

// ── Toast ──
.or-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  padding: 10px 18px;
  border-radius: $card-radius-sm;
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  pointer-events: none;

  &.success {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  &.error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
}

// ── Error Banner ──
.error-banner {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: 10px 14px;
  margin-bottom: $gap-md;
  border-radius: $card-radius-sm;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  font-size: 13px;
}
.retry-btn {
  margin-left: auto;
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
  }
}

// ── Top Bar ──
.page-header {
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
.search-group {
  display: flex;
  flex: 1;
  min-width: 0;
  max-width: 380px;
}
.search-type-select {
  max-width: 90px;
  border-radius: $card-radius-sm $card-radius-sm 0 0;
  border-right: none;
  appearance: none;
  cursor: pointer;
  flex-shrink: 0;

  @media (min-width: $bp-mobile) {
    border-radius: $card-radius-sm 0 0 $card-radius-sm;
  }
}
.search-input {
  flex: 1;
  min-width: 0;
  border-radius: 0 $card-radius-sm $card-radius-sm 0;
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
  position: relative;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(var(--bg-card-rgb, 0, 0, 0), 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $card-radius;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--brand-light);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-3);
  font-size: 14px;

  p { margin: 0; }
}
.skeleton-row td {
  padding: 14px !important;
}
.skeleton-bar {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--border) 25%, var(--bg-2) 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  opacity: 0.6;
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
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

  &.modal-sm {
    max-width: 400px;
  }
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
.detail-loading {
  display: flex;
  justify-content: center;
  padding: $gap-lg 0;
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

// ── Assign Field ──
.assign-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .or-input {
    width: 100%;
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
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .bar-left {
    flex-direction: column;
  }
  .search-group {
    max-width: 100%;
    flex-direction: column;
  }
  .search-type-select {
    max-width: 100%;
    border-radius: $card-radius-sm $card-radius-sm 0 0;
    border-right: 1px solid var(--border);
    border-bottom: none;
  }
  .search-input {
    border-radius: 0 0 $card-radius-sm $card-radius-sm;
  }
  .filter-select {
    max-width: 100%;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

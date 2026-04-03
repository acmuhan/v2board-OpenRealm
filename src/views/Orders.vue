<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { orderApi } from '../api'
import { useCheckout } from '../composables/useCheckout'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()

const { t } = useI18n()
const { showPayModal, payMethods, payLoading, methodLoading, openPayment, confirmPay, cancelAndClose } = useCheckout()

const orders = ref<any[]>([])
const loading = ref(true)

const statusMap = () => ({
  0: { text: t('orders.pending'),    cls: 'warning' },
  1: { text: t('orders.activating'), cls: 'info' },
  2: { text: t('orders.cancelled'),  cls: 'danger' },
  3: { text: t('orders.completed'),  cls: 'success' },
  4: { text: t('orders.deducted'),   cls: 'info' },
} as Record<number, { text: string; cls: string }>)

async function loadOrders() {
  try {
    const res: any = await orderApi.list()
    orders.value = res.data || []
  } catch (e: any) {
    toast.error(e?.message || '加载订单失败')
  } finally { loading.value = false }
}

onMounted(loadOrders)

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString()
}

async function cancelOrder(tradeNo: string) {
  try {
    await orderApi.cancel(tradeNo)
    toast.success('订单已取消')
  } catch (e: any) {
    toast.error(e?.message || '取消失败')
  }
  await loadOrders()
}

async function handlePayNow(tradeNo: string) {
  await openPayment(tradeNo)
}

async function handleConfirmPay(methodId: number) {
  const result = await confirmPay(methodId)
  if (result?.success) await loadOrders()
}
</script>

<template>
  <div class="orders-page">
    <h1 class="page-title">{{ t('orders.title') }}</h1>

    <div v-if="loading" class="skeleton-list">
      <div v-for="n in 3" :key="n" class="skeleton-item">
        <div class="skel-row">
          <div class="skel-line skel-plan"></div>
          <div class="skel-tag-ph"></div>
        </div>
        <div class="skel-row skel-detail">
          <div class="skel-line skel-detail-a"></div>
          <div class="skel-line skel-detail-b"></div>
        </div>
      </div>
    </div>

    <div v-else-if="orders.length" class="orders-list">
      <div v-for="order in orders" :key="order.trade_no" class="order-item glass-card">
        <div class="order-top">
          <div>
            <span class="order-plan">{{ order.plan?.name || t('orders.plan') }}</span>
            <span class="order-no">#{{ order.trade_no }}</span>
          </div>
          <span :class="['or-tag', statusMap()[order.status]?.cls || 'info']">
            {{ statusMap()[order.status]?.text || order.status }}
          </span>
        </div>
        <div class="order-detail">
          <span>{{ t('orders.amount') }}: &yen;{{ ((order.total_amount || 0) / 100).toFixed(2) }}</span>
          <span>{{ t('orders.createdAt') }}: {{ formatDate(order.created_at) }}</span>
        </div>
        <div v-if="order.status === 0" class="order-actions">
          <button class="btn-gradient" style="padding: 8px 20px; font-size: 13px;" @click="handlePayNow(order.trade_no)">
            {{ t('orders.payNow') }}
          </button>
          <button class="btn-ghost" style="padding: 8px 20px; font-size: 13px;" @click="cancelOrder(order.trade_no)">
            {{ t('orders.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">{{ t('orders.empty') }}</div>

    <!-- Payment Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showPayModal" class="modal-overlay" @click.self="cancelAndClose()">
          <div class="pay-modal">
            <div class="pay-modal-header">
              <h2>{{ t('shop.paymentMethod') }}</h2>
              <button class="pay-close" @click="cancelAndClose()">✕</button>
            </div>

            <div v-if="methodLoading" class="pay-loading">{{ t('common.loading') }}</div>

            <div v-else-if="payMethods.length" class="pay-methods">
              <button
                v-for="m in payMethods"
                :key="m.id"
                class="pay-method-btn"
                :disabled="payLoading"
                @click="handleConfirmPay(m.id)"
              >
                <div class="pay-method-icon">
                  <img v-if="m.icon" :src="m.icon" :alt="m.name" width="28" height="28" />
                  <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
                  </svg>
                </div>
                <div class="pay-method-info">
                  <span class="pay-method-name">{{ m.name }}</span>
                </div>
                <svg class="pay-method-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div v-else class="pay-empty">暂无可用支付方式</div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-title { font-size: 22px; font-weight: 700; margin-bottom: $gap-lg; }

// Skeleton
.skeleton-list { display: flex; flex-direction: column; gap: $gap-md; }
.skeleton-item {
  padding: $gap-lg;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: $card-radius;
}
.skel-row { display: flex; align-items: center; gap: $gap-md; margin-bottom: $gap-sm; }
.skel-line {
  height: 14px;
  border-radius: 6px;
  background: var(--bg-elevated);
  animation: shimmer 1.4s ease-in-out infinite;
}
.skel-plan { width: 40%; }
.skel-tag-ph { margin-left: auto; width: 60px; height: 22px; border-radius: 6px; background: var(--bg-elevated); animation: shimmer 1.4s ease-in-out infinite; }
.skel-detail { gap: $gap-xl; margin-top: $gap-xs; }
.skel-detail-a { width: 130px; }
.skel-detail-b { width: 160px; }
@keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.orders-list { display: flex; flex-direction: column; gap: $gap-md; }
.order-item { padding: $gap-lg; }
.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-sm; }
.order-plan { font-size: 16px; font-weight: 600; }
.order-no { font-size: 12px; color: var(--text-3); margin-left: $gap-sm; }
.order-detail {
  display: flex; gap: $gap-xl; font-size: 13px; color: var(--text-2);
  @media (max-width: $bp-mobile) { flex-direction: column; gap: $gap-xs; }
}
.order-actions { display: flex; gap: $gap-sm; margin-top: $gap-md; flex-wrap: wrap; }
.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); }

// Modal (shared pattern)
.modal-overlay {
  position: fixed; inset: 0; z-index: $z-modal;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  @media (min-width: $bp-tablet) { align-items: center; }
}
.pay-modal {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: $card-radius $card-radius 0 0;
  padding: $gap-lg; width: 100%; max-width: 480px; position: relative;
  @media (min-width: $bp-tablet) { border-radius: $card-radius; }
}
.pay-modal-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: $gap-lg;
  h2 { font-size: 18px; font-weight: 700; }
}
.pay-close {
  width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); color: var(--text-2); font-size: 14px;
  &:hover { background: var(--bg-card-hover); }
}
.pay-methods { display: flex; flex-direction: column; gap: $gap-sm; }
.pay-method-btn {
  display: flex; align-items: center; gap: $gap-md; padding: 14px 16px; border-radius: 10px;
  background: var(--bg-1); border: 1px solid var(--border); text-align: left; transition: all 0.15s;
  &:hover:not(:disabled) { border-color: var(--brand); background: rgba(var(--brand-rgb), 0.05); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.pay-method-icon {
  width: 40px; height: 40px; border-radius: 8px; background: var(--bg-2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--brand);
  img { border-radius: 4px; object-fit: contain; }
}
.pay-method-info { flex: 1; }
.pay-method-name { font-size: 14px; font-weight: 600; color: var(--text-1); }
.pay-method-arrow { color: var(--text-3); flex-shrink: 0; }
.pay-loading, .pay-empty { text-align: center; padding: $gap-xl; color: var(--text-3); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

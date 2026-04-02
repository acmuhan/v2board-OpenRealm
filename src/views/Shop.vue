<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownRenderer from '../components/common/MarkdownRenderer.vue'
import { planApi, orderApi, couponApi } from '../api'
import { useCheckout } from '../composables/useCheckout'
import { useToastStore } from '../stores/toast'

const { t } = useI18n()
const toast = useToastStore()
const { showPayModal, payMethods, payLoading, methodLoading, openPayment, confirmPay, cancelAndClose, formatFee } = useCheckout()

const plans = ref<any[]>([])
const loading = ref(true)
const selectedPlan = ref<any>(null)
const selectedCycle = ref('')
const coupon = ref('')
const couponResult = ref<any>(null)
const couponChecking = ref(false)
const ordering = ref(false)
const pendingTradeNo = ref('')

const cycles: Record<string, string> = {
  month_price: t('shop.monthly'),
  quarter_price: t('shop.quarterly'),
  half_year_price: t('shop.halfYearly'),
  year_price: t('shop.yearly'),
  two_year_price: t('shop.twoYear'),
  three_year_price: t('shop.threeYear'),
  onetime_price: t('shop.onetime'),
}

onMounted(async () => {
  try {
    const res: any = await planApi.list()
    plans.value = res.data || []
  } finally { loading.value = false }
})

function selectPlan(plan: any) {
  selectedPlan.value = plan
  const firstCycle = Object.keys(cycles).find(k => plan[k] !== null && plan[k] !== undefined)
  selectedCycle.value = firstCycle || ''
  coupon.value = ''
  couponResult.value = null
}

function getPrice(plan: any, cycle: string) {
  return ((plan[cycle] || 0) / 100).toFixed(2)
}

function availableCycles(plan: any) {
  return Object.entries(cycles).filter(([k]) => plan[k] !== null && plan[k] !== undefined)
}

async function checkCoupon() {
  if (!coupon.value || !selectedPlan.value) return
  couponChecking.value = true
  try {
    const res: any = await couponApi.check({ code: coupon.value, plan_id: selectedPlan.value.id })
    couponResult.value = res.data
    toast.success('优惠券有效')
  } catch (e: any) {
    couponResult.value = null
    toast.error(e?.message || '优惠券无效')
  } finally { couponChecking.value = false }
}

async function handleOrder() {
  if (!selectedPlan.value || !selectedCycle.value) return
  ordering.value = true
  try {
    const res: any = await orderApi.save({
      plan_id: selectedPlan.value.id,
      cycle: selectedCycle.value,
      coupon_code: coupon.value || undefined,
    })
    const tradeNo = res.data
    if (tradeNo) {
      pendingTradeNo.value = tradeNo
      await openPayment(tradeNo)
    }
  } catch (e: any) {
    toast.error(e?.message || '创建订单失败')
  } finally { ordering.value = false }
}

async function handleConfirmPay(methodId: number) {
  const result = await confirmPay(methodId)
  if (result?.success && !result.redirect) {
    // Balance pay success — nothing to do, stay on page
  }
}

function handleClosePayModal() {
  cancelAndClose()
  // Don't cancel the order — user can pay later from Orders page
  pendingTradeNo.value = ''
}

const planGradients = [
  'linear-gradient(135deg, rgba(var(--brand-rgb), 0.15), rgba(var(--accent-rgb), 0.05))',
  'linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--brand-rgb), 0.05))',
  'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(236, 72, 153, 0.05))',
  'linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(234, 179, 8, 0.05))',
]
</script>

<template>
  <div class="shop-page">
    <div class="page-header stagger-1">
      <h1>{{ t('shop.title') }}</h1>
      <p class="page-desc">{{ t('shop.selectPayment') }}</p>
    </div>

    <div v-if="loading" class="loading-text">{{ t('common.loading') }}</div>

    <div v-else class="plan-grid">
      <div
        v-for="(plan, idx) in plans"
        :key="plan.id"
        :class="['plan-card', 'card-accent', `stagger-${idx + 2}`, { selected: selectedPlan?.id === plan.id }]"
        :style="{ background: planGradients[idx % planGradients.length] }"
        @click="selectPlan(plan)"
      >
        <div class="plan-badge" v-if="idx === 1">{{ t('shop.popular') }}</div>
        <div class="plan-header">
          <h3>{{ plan.name }}</h3>
          <span v-if="plan.month_price !== null" class="plan-price">
            &yen;{{ (plan.month_price / 100).toFixed(0) }}<small>/{{ t('shop.monthly') }}</small>
          </span>
        </div>
        <div class="plan-desc">
          <MarkdownRenderer v-if="plan.content" :content="plan.content" />
          <span v-else class="plan-desc-empty">高速稳定的网络加速服务</span>
        </div>
        <ul class="plan-features">
          <li v-if="plan.transfer_enable">
            流量: {{ (plan.transfer_enable / (1024*1024*1024)).toFixed(0) }} GB
          </li>
          <li v-if="plan.speed_limit">限速: {{ plan.speed_limit }} Mbps</li>
          <li v-if="plan.device_limit">设备: {{ plan.device_limit }} 台</li>
        </ul>
        <div class="plan-select-indicator">
          <div class="check-circle">
            <svg v-if="selectedPlan?.id === plan.id" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Panel -->
    <transition name="fade-slide">
      <div v-if="selectedPlan" class="order-panel card-glow stagger-8">
        <h3>{{ t('shop.monthly') }} — {{ selectedPlan.name }}</h3>
        <div class="cycle-grid">
          <button
            v-for="[key, label] in availableCycles(selectedPlan)"
            :key="key"
            :class="['cycle-btn', { active: selectedCycle === key }]"
            @click="selectedCycle = key"
          >
            <span class="cycle-label">{{ label }}</span>
            <span class="cycle-price">&yen;{{ getPrice(selectedPlan, key) }}</span>
          </button>
        </div>

        <div class="coupon-row">
          <input v-model="coupon" class="or-input" :placeholder="t('shop.couponPlaceholder')" />
          <button class="btn-ghost" :disabled="couponChecking" @click="checkCoupon">
            {{ couponChecking ? t('common.loading') : t('shop.apply') }}
          </button>
        </div>
        <div v-if="couponResult" class="coupon-result">
          <span class="coupon-ok">
            {{ couponResult.type === 1 ? `优惠 ¥${(couponResult.value/100).toFixed(2)}` : `${couponResult.value}% 折扣` }}
          </span>
        </div>

        <button class="btn-gradient order-btn" @click="handleOrder" :disabled="ordering || !selectedCycle">
          {{ ordering ? t('common.loading') : t('shop.buyNow') }}
        </button>
      </div>
    </transition>

    <!-- Payment Method Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showPayModal" class="modal-overlay" @click.self="handleClosePayModal">
          <div class="pay-modal">
            <div class="pay-modal-header">
              <h2>{{ t('shop.paymentMethod') }}</h2>
              <button class="pay-close" @click="handleClosePayModal">✕</button>
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
                  <span v-if="formatFee(m, selectedPlan ? (selectedPlan[selectedCycle] || 0) : 0)" class="pay-method-fee">
                    {{ formatFee(m, selectedPlan ? (selectedPlan[selectedCycle] || 0) : 0) }}
                  </span>
                </div>
                <svg class="pay-method-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div v-else class="pay-empty">
              <p>暂无可用支付方式，请联系管理员</p>
            </div>

            <div v-if="payLoading" class="pay-loading-overlay">
              <div class="pay-spinner"></div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.page-header { margin-bottom: $gap-lg; h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; } }
.page-desc { font-size: 14px; color: var(--text-2); margin-top: 4px; }
.loading-text { color: var(--text-3); }

.plan-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: $gap-md; margin-bottom: $gap-xl;
}
.plan-card {
  padding: $gap-lg; cursor: pointer; position: relative;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 2px solid transparent;
  &.selected {
    border-color: var(--brand);
    box-shadow: var(--shadow-md), var(--glow-brand);
    .check-circle { background: var(--brand); }
  }
  &:hover { transform: translateY(-4px); }
}
.plan-badge {
  position: absolute; top: -1px; right: 16px;
  padding: 4px 12px; border-radius: 0 0 8px 8px;
  background: var(--grad-brand); color: #fff;
  font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
}
.plan-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: $gap-sm;
  h3 { font-size: 18px; font-weight: 700; }
}
.plan-price {
  font-size: 22px; font-weight: 800; color: var(--brand-light);
  font-family: 'Space Grotesk', sans-serif;
  small { font-size: 12px; font-weight: 500; }
}
.plan-desc {
  font-size: 13px; margin-bottom: $gap-md;
  max-height: 80px; overflow: hidden;
  :deep(.md-body) { font-size: 13px; color: var(--text-2); }
}
.plan-desc-empty { color: var(--text-2); }
.plan-features {
  list-style: none; margin-bottom: $gap-md;
  li { font-size: 13px; color: var(--text-2); padding: 4px 0; &::before { content: '+ '; color: var(--accent); font-weight: 700; } }
}
.plan-select-indicator { display: flex; justify-content: flex-end; }
.check-circle {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid var(--border); display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}

.order-panel {
  padding: $gap-xl;
  h3 { font-size: 16px; font-weight: 600; margin-bottom: $gap-md; }
}
.cycle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: $gap-sm; margin-bottom: $gap-lg; }
.cycle-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px; border-radius: 10px; background: rgba(255,255,255,0.04);
  border: 1px solid var(--border); color: var(--text-2); transition: all 0.15s;
  &:hover { border-color: var(--border-active); }
  &.active { border-color: var(--brand); background: rgba(var(--brand-rgb), 0.1); color: #fff; }
}
.cycle-label { font-size: 13px; }
.cycle-price { font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }

.coupon-row { display: flex; gap: $gap-sm; margin-bottom: $gap-sm; .or-input { flex: 1; } }
.coupon-result { margin-bottom: $gap-md; }
.coupon-ok { font-size: 13px; color: var(--success); font-weight: 600; }
.order-btn { width: 100%; height: 48px; font-size: 16px; &:disabled { opacity: 0.6; cursor: not-allowed; } }

// Payment Modal
.modal-overlay {
  position: fixed; inset: 0; z-index: $z-modal;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  @media (min-width: $bp-tablet) { align-items: center; }
}
.pay-modal {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: $card-radius $card-radius 0 0;
  padding: $gap-lg;
  width: 100%; max-width: 480px; position: relative;
  @media (min-width: $bp-tablet) {
    border-radius: $card-radius;
    max-height: 90vh; overflow-y: auto;
  }
}
.pay-modal-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: $gap-lg;
  h2 { font-size: 18px; font-weight: 700; }
}
.pay-close {
  width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); color: var(--text-2); font-size: 14px;
  &:hover { background: var(--bg-card-hover); color: var(--text-1); }
}
.pay-methods { display: flex; flex-direction: column; gap: $gap-sm; }
.pay-method-btn {
  display: flex; align-items: center; gap: $gap-md;
  padding: 14px 16px; border-radius: 10px;
  background: var(--bg-1); border: 1px solid var(--border);
  text-align: left; transition: all 0.15s; cursor: pointer;
  &:hover:not(:disabled) { border-color: var(--brand); background: rgba(var(--brand-rgb), 0.05); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.pay-method-icon {
  width: 40px; height: 40px; border-radius: 8px;
  background: var(--bg-2); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--brand);
  img { border-radius: 4px; object-fit: contain; }
}
.pay-method-info { flex: 1; }
.pay-method-name { display: block; font-size: 14px; font-weight: 600; color: var(--text-1); }
.pay-method-fee { display: block; font-size: 12px; color: var(--text-3); margin-top: 2px; }
.pay-method-arrow { color: var(--text-3); flex-shrink: 0; }
.pay-loading { text-align: center; padding: $gap-xl; color: var(--text-3); }
.pay-empty { text-align: center; padding: $gap-xl; color: var(--text-3); }
.pay-loading-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3); border-radius: $card-radius;
  display: flex; align-items: center; justify-content: center;
}
.pay-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: var(--brand);
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { planApi, orderApi, couponApi } from '../api'

const router = useRouter()
const plans = ref<any[]>([])
const loading = ref(true)
const selectedPlan = ref<any>(null)
const selectedCycle = ref('')
const coupon = ref('')
const couponResult = ref<any>(null)
const ordering = ref(false)

const cycles: Record<string, string> = {
  month_price: '月付',
  quarter_price: '季付',
  half_year_price: '半年付',
  year_price: '年付',
  two_year_price: '两年付',
  three_year_price: '三年付',
  onetime_price: '一次性',
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
}

function getPrice(plan: any, cycle: string) {
  return ((plan[cycle] || 0) / 100).toFixed(2)
}

function availableCycles(plan: any) {
  return Object.entries(cycles).filter(([k]) => plan[k] !== null && plan[k] !== undefined)
}

async function checkCoupon() {
  if (!coupon.value || !selectedPlan.value) return
  try {
    const res: any = await couponApi.check({ code: coupon.value, plan_id: selectedPlan.value.id })
    couponResult.value = res.data
  } catch { couponResult.value = null }
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
    if (res.data) router.push('/orders')
  } finally { ordering.value = false }
}

function planText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
      <h1>购买套餐</h1>
      <p class="page-desc">选择适合您的订阅计划</p>
    </div>

    <div v-if="loading" class="loading-text">加载中...</div>

    <div v-else class="plan-grid">
      <div
        v-for="(plan, idx) in plans"
        :key="plan.id"
        :class="['plan-card', 'card-accent', `stagger-${idx + 2}`, { selected: selectedPlan?.id === plan.id }]"
        :style="{ background: planGradients[idx % planGradients.length] }"
        @click="selectPlan(plan)"
      >
        <div class="plan-badge" v-if="idx === 1">推荐</div>
        <div class="plan-header">
          <h3>{{ plan.name }}</h3>
          <span v-if="plan.month_price !== null" class="plan-price">
            &yen;{{ (plan.month_price / 100).toFixed(0) }}<small>/月起</small>
          </span>
        </div>
        <p class="plan-desc">{{ plan.content ? planText(plan.content) : '高速稳定的网络加速服务' }}</p>
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
        <h3>选择周期 - {{ selectedPlan.name }}</h3>
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
          <input v-model="coupon" class="or-input" placeholder="优惠码（可选）" />
          <button class="btn-ghost" @click="checkCoupon">验证</button>
        </div>

        <button class="btn-gradient order-btn" @click="handleOrder" :disabled="ordering || !selectedCycle">
          {{ ordering ? '提交中...' : '立即购买' }}
        </button>
      </div>
    </transition>
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
.plan-desc { font-size: 13px; color: var(--text-2); margin-bottom: $gap-md; white-space: pre-line; max-height: 80px; overflow: hidden; }
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

.coupon-row { display: flex; gap: $gap-sm; margin-bottom: $gap-md; .or-input { flex: 1; } }
.order-btn { width: 100%; height: 48px; font-size: 16px; &:disabled { opacity: 0.6; cursor: not-allowed; } }
</style>

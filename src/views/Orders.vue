<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { orderApi } from '../api'

const orders = ref<any[]>([])
const loading = ref(true)

const statusMap: Record<number, { text: string; cls: string }> = {
  0: { text: '待支付', cls: 'warning' },
  1: { text: '开通中', cls: 'info' },
  2: { text: '已取消', cls: 'danger' },
  3: { text: '已完成', cls: 'success' },
  4: { text: '已折抵', cls: 'info' },
}

onMounted(async () => {
  try {
    const res: any = await orderApi.list()
    orders.value = res.data || []
  } finally { loading.value = false }
})

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString()
}

async function cancelOrder(tradeNo: string) {
  await orderApi.cancel(tradeNo)
  const res: any = await orderApi.list()
  orders.value = res.data || []
}
</script>

<template>
  <div class="orders-page">
    <h1 class="page-title">我的订单</h1>

    <div v-if="loading" class="loading-text">加载中...</div>

    <div v-else-if="orders.length" class="orders-list">
      <div v-for="order in orders" :key="order.trade_no" class="order-item glass-card">
        <div class="order-top">
          <div>
            <span class="order-plan">{{ order.plan?.name || '套餐' }}</span>
            <span class="order-no">#{{ order.trade_no }}</span>
          </div>
          <span :class="['or-tag', statusMap[order.status]?.cls || 'info']">
            {{ statusMap[order.status]?.text || '未知' }}
          </span>
        </div>
        <div class="order-detail">
          <span>金额: &yen;{{ ((order.total_amount || 0) / 100).toFixed(2) }}</span>
          <span>创建: {{ formatDate(order.created_at) }}</span>
        </div>
        <div v-if="order.status === 0" class="order-actions">
          <button class="btn-primary" style="padding: 8px 20px; font-size: 13px;">去支付</button>
          <button class="btn-ghost" style="padding: 8px 20px; font-size: 13px;" @click="cancelOrder(order.trade_no)">取消</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">暂无订单</div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-title { font-size: 22px; font-weight: 700; margin-bottom: $gap-lg; }
.loading-text { color: var(--text-3); }
.orders-list { display: flex; flex-direction: column; gap: $gap-md; }
.order-item { padding: $gap-lg; }
.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-sm; }
.order-plan { font-size: 16px; font-weight: 600; }
.order-no { font-size: 12px; color: var(--text-3); margin-left: $gap-sm; }
.order-detail {
  display: flex; gap: $gap-xl; font-size: 13px; color: var(--text-2);
  @media (max-width: $bp-mobile) { flex-direction: column; gap: $gap-xs; }
}
.order-actions { display: flex; gap: $gap-sm; margin-top: $gap-md; }
.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); }
</style>

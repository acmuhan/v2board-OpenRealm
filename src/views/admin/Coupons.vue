<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminCouponApi } from '../../api/admin'
import { useToastStore } from '../../stores/toast'

const { t } = useI18n()
const toast = useToastStore()

/* ── Types ── */
interface Coupon {
  id: number
  name: string
  code: string
  type: number        // 1=amount (cents), 2=percent
  value: number
  limit_use: number | null
  limit_use_with_user: number | null
  limit_plan_ids: number[] | null
  used: number
  started_at: number
  ended_at: number
  show: boolean
}

/* ── State ── */
const showModal = ref(false)
const confirmDeleteId = ref<number | null>(null)

const form = ref({
  name: '',
  code: '',
  type: 1,
  value: 0,
  limit_use: null as number | null,
  limit_use_with_user: null as number | null,
  limit_plan_ids: '',
  started_at: '',
  ended_at: '',
  generate_count: 1,
})

const coupons = ref<Coupon[]>([])
const loading = ref(true)

async function loadCoupons() {
  loading.value = true
  try {
    const res: any = await adminCouponApi.fetch()
    coupons.value = res.data || []
  } catch (e: any) {
    coupons.value = []
    toast.error(e?.message || '加载优惠券失败')
  } finally { loading.value = false }
}

onMounted(() => loadCoupons())

/* ── Computed ── */
const isExpired = (c: Coupon) => c.ended_at * 1000 < Date.now()

const statusLabel = (c: Coupon) => {
  if (!c.show) return { text: t('admin.coupons.statusHidden'), cls: 'muted' }
  if (isExpired(c)) return { text: t('admin.coupons.statusExpired'), cls: 'danger' }
  if (c.limit_use !== null && c.used >= c.limit_use) return { text: t('admin.coupons.statusDepleted'), cls: 'warning' }
  return { text: t('admin.coupons.statusActive'), cls: 'success' }
}

/* ── Actions ── */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  form.value.code = code
}

function openGenerate() {
  form.value = {
    name: '', code: '', type: 1, value: 0,
    limit_use: null, limit_use_with_user: null,
    limit_plan_ids: '', started_at: '', ended_at: '', generate_count: 1,
  }
  showModal.value = true
}

async function submitGenerate() {
  const payload: Record<string, unknown> = {
    name: form.value.name,
    code: form.value.code,
    type: form.value.type,
    value: form.value.type === 1 ? form.value.value * 100 : form.value.value,
    limit_use: form.value.limit_use,
    limit_use_with_user: form.value.limit_use_with_user,
    limit_plan_ids: form.value.limit_plan_ids
      ? form.value.limit_plan_ids.split(',').map(s => Number(s.trim())).filter(Boolean)
      : null,
    started_at: form.value.started_at ? Math.floor(new Date(form.value.started_at).getTime() / 1000) : null,
    ended_at: form.value.ended_at ? Math.floor(new Date(form.value.ended_at).getTime() / 1000) : null,
    generate_count: form.value.generate_count,
  }

  try {
    await adminCouponApi.generate(payload)
    toast.success('优惠券已生成')
  } catch (e: any) {
    toast.error(e?.message || '生成优惠券失败')
  }
  showModal.value = false
  await loadCoupons()
}

async function toggleShow(c: Coupon) {
  try { await adminCouponApi.generate({ id: c.id, show: c.show ? 0 : 1 }) } catch { /* ignore */ }
  await loadCoupons()
}

async function deleteCoupon(id: number) {
  try {
    await adminCouponApi.drop({ id })
    toast.success('优惠券已删除')
  } catch (e: any) {
    toast.error(e?.message || '删除失败')
  }
  confirmDeleteId.value = null
  await loadCoupons()
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString()
}

function formatValue(c: Coupon) {
  return c.type === 2 ? `${c.value}%` : `¥${(c.value / 100).toFixed(2)}`
}
</script>

<template>
  <div class="admin-coupons">
    <div class="page-header stagger-1">
      <h1 class="page-title">{{ t('admin.coupons.title') }}</h1>
      <button class="btn-gradient" @click="openGenerate">+ {{ t('admin.coupons.generate') }}</button>
    </div>

    <!-- Table -->
    <div class="table-wrap stagger-2">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('admin.coupons.code') }}</th>
            <th>{{ t('admin.coupons.type') }}</th>
            <th>{{ t('admin.coupons.value') }}</th>
            <th>{{ t('admin.coupons.limitUse') }}</th>
            <th>{{ t('admin.coupons.usedCount') }}</th>
            <th>{{ t('admin.coupons.validPeriod') }}</th>
            <th>{{ t('admin.coupons.status') || 'Status' }}</th>
            <th>{{ t('common.edit') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.id" class="coupon-row">
            <td class="col-id">#{{ c.id }}</td>
            <td class="col-code">
              <code>{{ c.code }}</code>
            </td>
            <td>
              <span :class="['type-badge', c.type === 2 ? 'percent' : 'amount']">
                {{ c.type === 2 ? t('admin.coupons.percent') : t('admin.coupons.fixed') }}
              </span>
            </td>
            <td class="col-value">{{ formatValue(c) }}</td>
            <td class="col-limit">{{ c.limit_use ?? t('admin.coupons.unlimited') }}</td>
            <td class="col-used">
              <span class="used-count">{{ c.used }}</span>
              <span v-if="c.limit_use" class="used-total"> / {{ c.limit_use }}</span>
            </td>
            <td class="col-period">
              <span>{{ formatDate(c.started_at) }}</span>
              <span class="period-sep">~</span>
              <span>{{ formatDate(c.ended_at) }}</span>
            </td>
            <td>
              <span :class="['or-tag', statusLabel(c).cls]">{{ statusLabel(c).text }}</span>
            </td>
            <td class="col-actions">
              <button
                :class="['btn-ghost btn-sm', { 'btn-active': c.show }]"
                @click="toggleShow(c)"
              >{{ c.show ? t('admin.notices.hide') : t('admin.notices.show') }}</button>
              <button
                v-if="confirmDeleteId !== c.id"
                class="btn-ghost btn-sm btn-danger"
                @click="confirmDeleteId = c.id"
              >{{ t('common.delete') }}</button>
              <template v-else>
                <button class="btn-ghost btn-sm btn-danger" @click="deleteCoupon(c.id)">{{ t('common.confirm') }}</button>
                <button class="btn-ghost btn-sm" @click="confirmDeleteId = null">{{ t('common.cancel') }}</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!coupons.length" class="empty-state">{{ t('common.noData') || 'No coupons found.' }}</div>
    </div>

    <!-- Generate Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-box">
            <h2 class="modal-title">{{ t('admin.coupons.generateTitle') }}</h2>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.name') }}</label>
                <input v-model="form.name" class="or-input" :placeholder="t('admin.coupons.name')" />
              </div>
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.code') }}</label>
                <div class="code-row">
                  <input v-model="form.code" class="or-input" placeholder="CODE" style="flex:1" />
                  <button class="btn-ghost btn-sm" @click="generateCode">Auto</button>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.type') }}</label>
                <select v-model="form.type" class="or-input">
                  <option :value="1">{{ t('admin.coupons.fixed') }}</option>
                  <option :value="2">{{ t('admin.coupons.percent') }}</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.value') }} {{ form.type === 2 ? '(%)' : '(¥)' }}</label>
                <input v-model.number="form.value" type="number" class="or-input" min="0" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.limitUse') }} <span class="hint">({{ t('admin.coupons.unlimited') }})</span></label>
                <input v-model.number="form.limit_use" type="number" class="or-input" min="0" :placeholder="t('admin.coupons.unlimited')" />
              </div>
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.perUserLimit') }}</label>
                <input v-model.number="form.limit_use_with_user" type="number" class="or-input" min="0" :placeholder="t('admin.coupons.unlimited')" />
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('admin.coupons.limitPlanIds') }} <span class="hint">({{ t('admin.coupons.unlimited') }})</span></label>
              <input v-model="form.limit_plan_ids" class="or-input" placeholder="1, 2, 3" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.startDate') }}</label>
                <input v-model="form.started_at" type="datetime-local" class="or-input" />
              </div>
              <div class="form-group flex-1">
                <label>{{ t('admin.coupons.endDate') }}</label>
                <input v-model="form.ended_at" type="datetime-local" class="or-input" />
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('admin.coupons.batchCount') }}</label>
              <input v-model.number="form.generate_count" type="number" class="or-input" min="1" max="100" />
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" @click="showModal = false">{{ t('common.cancel') }}</button>
              <button
                class="btn-gradient"
                :disabled="!form.code.trim()"
                @click="submitGenerate"
              >{{ t('admin.coupons.generate') }} {{ form.generate_count > 1 ? `(${form.generate_count})` : '' }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-coupons { max-width: 1200px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: $gap-lg;
}
.page-title { font-size: 24px; font-weight: 700; }

/* Table */
.table-wrap {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: $card-radius; overflow: hidden; overflow-x: auto;
}
.admin-table {
  width: 100%; border-collapse: collapse;
  th, td { padding: 14px 16px; text-align: left; font-size: 13px; }
  thead {
    background: var(--bg-1);
    th {
      font-weight: 600; color: var(--text-3); text-transform: uppercase;
      font-size: 11px; letter-spacing: 0.5px; border-bottom: 1px solid var(--border);
    }
  }
  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
    &:hover { background: var(--bg-card-hover); }
  }
}
.col-id { font-family: 'JetBrains Mono', monospace; color: var(--text-3); font-size: 12px; }
.col-code {
  code {
    font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
    background: var(--bg-elevated); padding: 3px 8px; border-radius: 4px;
    color: var(--brand);
  }
}
.col-value { font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.col-limit { color: var(--text-2); }
.col-used { font-family: 'Space Grotesk', sans-serif; }
.used-count { font-weight: 700; color: var(--text-1); }
.used-total { color: var(--text-3); font-size: 12px; }
.col-period { font-size: 12px; color: var(--text-2); white-space: nowrap; }
.period-sep { margin: 0 4px; color: var(--text-3); }
.col-actions { white-space: nowrap; }

.type-badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 600;
  &.percent { background: rgba(var(--accent-rgb), 0.1); color: var(--accent); }
  &.amount { background: rgba(var(--brand-rgb), 0.1); color: var(--brand); }
}

/* Buttons */
.btn-sm { padding: 5px 12px; font-size: 12px; }
.btn-danger { color: var(--danger); &:hover { background: rgba(239, 68, 68, 0.1); } }
.btn-active { color: var(--success); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: $z-modal;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: $gap-lg;
}
.modal-box {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: $card-radius; padding: $gap-lg;
  width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-md);
}
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: $gap-lg; }
.form-row { display: flex; gap: $gap-md; }
.flex-1 { flex: 1; }
.form-group {
  display: flex; flex-direction: column; gap: 6px; margin-bottom: $gap-md;
  label { font-size: 13px; color: var(--text-2); font-weight: 500; }
  .hint { font-size: 11px; color: var(--text-3); font-weight: 400; }
}
.code-row { display: flex; gap: $gap-sm; }
.modal-actions {
  display: flex; justify-content: flex-end; gap: $gap-sm; margin-top: $gap-lg;
}

.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); font-size: 14px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: $bp-tablet) {
  .form-row { flex-direction: column; }
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { adminCouponApi } from '../../api/admin'

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

/* ── Mock Data ── */
const coupons = ref<Coupon[]>([
  {
    id: 1, name: 'Spring Sale', code: 'SPRING30', type: 2, value: 30,
    limit_use: 100, limit_use_with_user: 1, limit_plan_ids: null,
    used: 42, started_at: 1711728000, ended_at: 1713456000, show: true,
  },
  {
    id: 2, name: 'Welcome Discount', code: 'WELCOME10', type: 1, value: 1000,
    limit_use: null, limit_use_with_user: 1, limit_plan_ids: [1, 2],
    used: 156, started_at: 1709222400, ended_at: 1714608000, show: true,
  },
  {
    id: 3, name: 'VIP Exclusive', code: 'VIP50OFF', type: 2, value: 50,
    limit_use: 20, limit_use_with_user: 1, limit_plan_ids: [3],
    used: 20, started_at: 1710432000, ended_at: 1711641600, show: false,
  },
  {
    id: 4, name: 'Flash Deal', code: 'FLASH5', type: 1, value: 500,
    limit_use: 50, limit_use_with_user: 2, limit_plan_ids: null,
    used: 8, started_at: 1711900800, ended_at: 1712505600, show: true,
  },
])

/* ── Computed ── */
const isExpired = (c: Coupon) => c.ended_at * 1000 < Date.now()

const statusLabel = (c: Coupon) => {
  if (!c.show) return { text: 'Hidden', cls: 'muted' }
  if (isExpired(c)) return { text: 'Expired', cls: 'danger' }
  if (c.limit_use !== null && c.used >= c.limit_use) return { text: 'Depleted', cls: 'warning' }
  return { text: 'Active', cls: 'success' }
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

  try { await adminCouponApi.generate(payload) } catch { /* mock */ }

  // Mock add
  for (let i = 0; i < form.value.generate_count; i++) {
    coupons.value.unshift({
      id: Date.now() + i,
      name: form.value.name,
      code: form.value.generate_count > 1 ? `${form.value.code}-${i + 1}` : form.value.code,
      type: form.value.type,
      value: form.value.type === 1 ? form.value.value * 100 : form.value.value,
      limit_use: form.value.limit_use,
      limit_use_with_user: form.value.limit_use_with_user,
      limit_plan_ids: form.value.limit_plan_ids
        ? form.value.limit_plan_ids.split(',').map(s => Number(s.trim())).filter(Boolean)
        : null,
      used: 0,
      started_at: form.value.started_at ? Math.floor(new Date(form.value.started_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
      ended_at: form.value.ended_at ? Math.floor(new Date(form.value.ended_at).getTime() / 1000) : Math.floor(Date.now() / 1000) + 2592000,
      show: true,
    })
  }
  showModal.value = false
}

async function toggleShow(c: Coupon) {
  c.show = !c.show
  try { await adminCouponApi.generate({ id: c.id, show: c.show ? 1 : 0 }) } catch { /* mock */ }
}

async function deleteCoupon(id: number) {
  try { await adminCouponApi.drop({ id }) } catch { /* mock */ }
  coupons.value = coupons.value.filter(c => c.id !== id)
  confirmDeleteId.value = null
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString()
}

function formatValue(c: Coupon) {
  return c.type === 2 ? `${c.value}%` : `$${(c.value / 100).toFixed(2)}`
}
</script>

<template>
  <div class="admin-coupons">
    <div class="page-header stagger-1">
      <h1 class="page-title">Coupons</h1>
      <button class="btn-primary" @click="openGenerate">+ Generate Coupon</button>
    </div>

    <!-- Table -->
    <div class="table-wrap stagger-2">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Limit</th>
            <th>Used</th>
            <th>Valid Period</th>
            <th>Status</th>
            <th>Actions</th>
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
                {{ c.type === 2 ? 'Percent' : 'Amount' }}
              </span>
            </td>
            <td class="col-value">{{ formatValue(c) }}</td>
            <td class="col-limit">{{ c.limit_use ?? 'Unlimited' }}</td>
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
              >{{ c.show ? 'Hide' : 'Show' }}</button>
              <button
                v-if="confirmDeleteId !== c.id"
                class="btn-ghost btn-sm btn-danger"
                @click="confirmDeleteId = c.id"
              >Delete</button>
              <template v-else>
                <button class="btn-ghost btn-sm btn-danger" @click="deleteCoupon(c.id)">Confirm</button>
                <button class="btn-ghost btn-sm" @click="confirmDeleteId = null">Cancel</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!coupons.length" class="empty-state">No coupons found.</div>
    </div>

    <!-- Generate Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-box">
            <h2 class="modal-title">Generate Coupon</h2>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Name</label>
                <input v-model="form.name" class="or-input" placeholder="Coupon name" />
              </div>
              <div class="form-group flex-1">
                <label>Code</label>
                <div class="code-row">
                  <input v-model="form.code" class="or-input" placeholder="CODE" style="flex:1" />
                  <button class="btn-ghost btn-sm" @click="generateCode">Auto</button>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Type</label>
                <select v-model="form.type" class="or-input">
                  <option :value="1">Fixed Amount</option>
                  <option :value="2">Percentage</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Value {{ form.type === 2 ? '(%)' : '($)' }}</label>
                <input v-model.number="form.value" type="number" class="or-input" min="0" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Total Use Limit <span class="hint">(empty = unlimited)</span></label>
                <input v-model.number="form.limit_use" type="number" class="or-input" min="0" placeholder="Unlimited" />
              </div>
              <div class="form-group flex-1">
                <label>Per-User Limit</label>
                <input v-model.number="form.limit_use_with_user" type="number" class="or-input" min="0" placeholder="Unlimited" />
              </div>
            </div>

            <div class="form-group">
              <label>Limit Plan IDs <span class="hint">(comma-separated, empty = all plans)</span></label>
              <input v-model="form.limit_plan_ids" class="or-input" placeholder="1, 2, 3" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Start Date</label>
                <input v-model="form.started_at" type="datetime-local" class="or-input" />
              </div>
              <div class="form-group flex-1">
                <label>End Date</label>
                <input v-model="form.ended_at" type="datetime-local" class="or-input" />
              </div>
            </div>

            <div class="form-group">
              <label>Batch Generate Count</label>
              <input v-model.number="form.generate_count" type="number" class="or-input" min="1" max="100" />
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" @click="showModal = false">Cancel</button>
              <button
                class="btn-primary"
                :disabled="!form.code.trim()"
                @click="submitGenerate"
              >Generate {{ form.generate_count > 1 ? `(${form.generate_count})` : '' }}</button>
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
.page-title { font-size: 22px; font-weight: 700; }

/* Table */
.table-wrap {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: $card-radius; overflow: hidden;
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
  .admin-table { display: block; overflow-x: auto; }
  .form-row { flex-direction: column; }
}
</style>

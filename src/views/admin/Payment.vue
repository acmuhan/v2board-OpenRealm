<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminPaymentApi } from '../../api/admin'

interface PaymentMethod {
  id: number
  name: string
  icon: string
  payment: string
  config: Record<string, string>
  notify_domain: string
  handling_fee_fixed: number
  handling_fee_percent: number
  enable: boolean
  sort: number
}

interface GatewayOption {
  label: string
  value: string
  fields: { key: string; label: string; type?: string }[]
}

const gateways: GatewayOption[] = [
  {
    label: 'Stripe',
    value: 'StripeAlipay',
    fields: [
      { key: 'stripe_sk_live', label: 'Secret Key' },
      { key: 'stripe_pk_live', label: 'Publishable Key' },
      { key: 'stripe_webhook_key', label: 'Webhook Secret' },
    ],
  },
  {
    label: 'Alipay F2F',
    value: 'AlipayF2F',
    fields: [
      { key: 'app_id', label: 'App ID' },
      { key: 'ali_public_key', label: 'Alipay Public Key' },
      { key: 'private_key', label: 'Private Key' },
    ],
  },
  {
    label: 'USDT / TRC20',
    value: 'MGate',
    fields: [
      { key: 'mgate_url', label: 'API URL' },
      { key: 'mgate_app_id', label: 'App ID' },
      { key: 'mgate_app_secret', label: 'App Secret' },
    ],
  },
  {
    label: 'Epay',
    value: 'Epay',
    fields: [
      { key: 'epay_url', label: 'API URL' },
      { key: 'epay_pid', label: 'PID' },
      { key: 'epay_key', label: 'Key' },
    ],
  },
]

const payments = ref<PaymentMethod[]>([])
const loading = ref(true)

async function loadPayments() {
  loading.value = true
  try {
    const res: any = await adminPaymentApi.fetch()
    payments.value = res.data || []
  } catch { payments.value = [] }
  finally { loading.value = false }
}

onMounted(() => loadPayments())

const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const form = ref<Omit<PaymentMethod, 'id' | 'sort'>>({
  name: '',
  icon: '',
  payment: '',
  config: {},
  notify_domain: '',
  handling_fee_fixed: 0,
  handling_fee_percent: 0,
  enable: true,
})

const selectedGateway = computed(() =>
  gateways.find((g) => g.value === form.value.payment),
)

const isEdit = computed(() => editingId.value !== null)

function openAdd() {
  editingId.value = null
  form.value = {
    name: '',
    icon: '',
    payment: '',
    config: {},
    notify_domain: '',
    handling_fee_fixed: 0,
    handling_fee_percent: 0,
    enable: true,
  }
  showModal.value = true
}

function openEdit(p: PaymentMethod) {
  editingId.value = p.id
  form.value = {
    name: p.name,
    icon: p.icon,
    payment: p.payment,
    config: { ...p.config },
    notify_domain: p.notify_domain,
    handling_fee_fixed: p.handling_fee_fixed,
    handling_fee_percent: p.handling_fee_percent,
    enable: p.enable,
  }
  showModal.value = true
}

async function savePayment() {
  saving.value = true
  try {
    const payload = isEdit.value
      ? { id: editingId.value, ...form.value }
      : form.value
    await adminPaymentApi.save(payload as Record<string, unknown>)
    showModal.value = false
    await loadPayments()
  } finally {
    saving.value = false
  }
}

async function deletePayment(id: number) {
  try { await adminPaymentApi.drop({ id }) } catch { /* ignore */ }
  await loadPayments()
}

async function toggleEnable(p: PaymentMethod) {
  try { await adminPaymentApi.save({ id: p.id, enable: p.enable ? 0 : 1 }) } catch { /* ignore */ }
  await loadPayments()
}

function moveUp(idx: number) {
  if (idx <= 0) return
  const temp = payments.value[idx]
  payments.value[idx] = payments.value[idx - 1]
  payments.value[idx - 1] = temp
  payments.value = [...payments.value]
}

function moveDown(idx: number) {
  if (idx >= payments.value.length - 1) return
  const temp = payments.value[idx]
  payments.value[idx] = payments.value[idx + 1]
  payments.value[idx + 1] = temp
  payments.value = [...payments.value]
}

function onGatewayChange() {
  form.value.config = {}
}

function gatewayLabel(value: string): string {
  return gateways.find((g) => g.value === value)?.label || value
}
</script>

<template>
  <div class="payment-page">
    <div class="page-header stagger-1">
      <div>
        <h1>支付配置</h1>
        <p class="page-desc">管理支付方式、网关配置和手续费设置</p>
      </div>
      <button class="btn-gradient" @click="openAdd">
        <span class="btn-icon">+</span> 添加支付方式
      </button>
    </div>

    <!-- Payment Cards -->
    <div class="payment-grid">
      <div
        v-for="(p, idx) in payments"
        :key="p.id"
        :class="['payment-card', 'card-accent', `stagger-${idx + 2}`]"
      >
        <div class="pc-header">
          <div class="pc-icon-wrap">
            <img v-if="p.icon" :src="p.icon" alt="" class="pc-icon" />
            <div v-else class="pc-icon-placeholder">{{ p.name[0] }}</div>
          </div>
          <div class="pc-info">
            <h3>{{ p.name }}</h3>
            <span class="or-tag info">{{ gatewayLabel(p.payment) }}</span>
          </div>
          <div class="pc-toggle" @click="toggleEnable(p)">
            <div :class="['toggle-track', { on: p.enable }]">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>

        <div class="pc-details">
          <div class="pc-detail-row">
            <span class="detail-label">手续费(固定)</span>
            <span class="detail-value">{{ p.handling_fee_fixed / 100 }} 元</span>
          </div>
          <div class="pc-detail-row">
            <span class="detail-label">手续费(百分比)</span>
            <span class="detail-value">{{ p.handling_fee_percent }}%</span>
          </div>
          <div class="pc-detail-row">
            <span class="detail-label">通知域名</span>
            <span class="detail-value mono">{{ p.notify_domain || '--' }}</span>
          </div>
        </div>

        <div class="pc-actions">
          <div class="sort-btns">
            <button class="btn-ghost btn-sm" :disabled="idx === 0" @click="moveUp(idx)" title="上移">
              &#9650;
            </button>
            <button
              class="btn-ghost btn-sm"
              :disabled="idx === payments.length - 1"
              @click="moveDown(idx)"
              title="下移"
            >
              &#9660;
            </button>
          </div>
          <div class="action-btns">
            <button class="btn-ghost btn-sm" @click="openEdit(p)">编辑</button>
            <button class="btn-ghost btn-sm danger-btn" @click="deletePayment(p.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!payments.length" class="empty-state card stagger-2">
      <div class="empty-icon">&#128179;</div>
      <p>暂无支付方式</p>
      <button class="btn-primary" @click="openAdd">添加第一个</button>
    </div>

    <!-- Modal Backdrop -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
          <div class="modal card-glow">
            <div class="modal-header">
              <h2>{{ isEdit ? '编辑支付方式' : '添加支付方式' }}</h2>
              <button class="close-btn" @click="showModal = false">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>名称</label>
                  <input v-model="form.name" class="or-input" placeholder="如：Stripe" />
                </div>
                <div class="form-group">
                  <label>图标 URL</label>
                  <input v-model="form.icon" class="or-input" placeholder="https://..." />
                </div>
              </div>

              <div class="form-group">
                <label>支付网关</label>
                <select v-model="form.payment" class="or-input" @change="onGatewayChange">
                  <option value="" disabled>选择网关...</option>
                  <option v-for="g in gateways" :key="g.value" :value="g.value">
                    {{ g.label }}
                  </option>
                </select>
              </div>

              <!-- Dynamic gateway config -->
              <div v-if="selectedGateway" class="gateway-config">
                <span class="section-title">网关配置</span>
                <div class="form-group" v-for="field in selectedGateway.fields" :key="field.key">
                  <label>{{ field.label }}</label>
                  <input
                    v-model="form.config[field.key]"
                    :type="field.type || 'text'"
                    class="or-input"
                    :placeholder="field.key"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>通知域名</label>
                <input v-model="form.notify_domain" class="or-input" placeholder="https://api.example.com" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>固定手续费 (分)</label>
                  <input v-model.number="form.handling_fee_fixed" type="number" class="or-input" />
                </div>
                <div class="form-group">
                  <label>百分比手续费 (%)</label>
                  <input v-model.number="form.handling_fee_percent" type="number" step="0.1" class="or-input" />
                </div>
              </div>

              <div class="form-group toggle-row">
                <label>启用状态</label>
                <div class="pc-toggle" @click="form.enable = !form.enable">
                  <div :class="['toggle-track', { on: form.enable }]">
                    <div class="toggle-thumb"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-ghost" @click="showModal = false">取消</button>
              <button class="btn-gradient" :disabled="saving" @click="savePayment">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.payment-page { max-width: 1100px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: $gap-lg;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .page-desc { font-size: 13px; color: var(--text-3); margin-top: 4px; }
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

// Payment Grid
.payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: $gap-md;
}

.payment-card {
  padding: $gap-lg;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
}

.pc-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pc-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: $card-radius-sm;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.pc-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.pc-icon-placeholder {
  font-size: 18px;
  font-weight: 700;
  color: var(--brand-light);
  font-family: 'Space Grotesk', sans-serif;
}

.pc-info {
  flex: 1;
  min-width: 0;
  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }
}

// Toggle switch
.pc-toggle { cursor: pointer; }

.toggle-track {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &.on {
    background: var(--brand);
    border-color: var(--brand);
    .toggle-thumb { transform: translateX(20px); }
  }
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
}

// Details
.pc-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: $gap-sm $gap-md;
  background: var(--bg-2);
  border-radius: $card-radius-sm;
}

.pc-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.detail-label { color: var(--text-3); }
.detail-value {
  color: var(--text-1);
  font-weight: 500;
  &.mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// Actions
.pc-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $gap-sm;
  border-top: 1px solid var(--border);
}

.sort-btns,
.action-btns {
  display: flex;
  gap: $gap-xs;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.danger-btn {
  color: var(--danger) !important;
  &:hover {
    border-color: var(--danger) !important;
    background: rgba(239, 68, 68, 0.08) !important;
  }
}

// Empty State
.empty-state {
  padding: 60px $gap-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $gap-md;
  text-align: center;
  color: var(--text-3);
  font-size: 14px;
}
.empty-icon { font-size: 40px; opacity: 0.5; }

// Modal
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;
  padding: $gap-lg;
}

.modal {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: $card-radius-lg;
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.45));
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $gap-lg $gap-lg $gap-md;
  h2 { font-size: 18px; font-weight: 700; }
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-elevated);
  color: var(--text-2);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover { background: var(--bg-2); color: var(--text-1); }
}

.modal-body {
  padding: 0 $gap-lg $gap-md;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-md;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  label {
    font-size: 13px;
    color: var(--text-2);
    font-weight: 500;
  }
}

.toggle-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.gateway-config {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  padding: $gap-md;
  background: var(--bg-2);
  border-radius: $card-radius-sm;
  border: 1px solid var(--border);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $gap-sm;
  padding: $gap-md $gap-lg $gap-lg;
  border-top: 1px solid var(--border);
}

// Modal transition
.modal-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from { opacity: 0; .modal { transform: scale(0.95) translateY(10px); } }
.modal-leave-to { opacity: 0; .modal { transform: scale(0.97) translateY(5px); } }
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(10px);
}

@media (max-width: $bp-mobile) {
  .payment-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: $gap-md; }
}
</style>

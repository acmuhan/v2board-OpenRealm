<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminGiftcardApi } from '../../api/admin'

/* ── Types ── */
interface Giftcard {
  id: number
  code: string
  type: number        // 1=amount, 2=duration, 3=traffic, 4=plan
  value: number
  status: number      // 0=unused, 1=used
  created_at: number
  used_at: number | null
  used_by: string | null
}

/* ── Maps ── */
const typeMap: Record<number, { text: string; cls: string }> = {
  1: { text: 'Amount', cls: 'amount' },
  2: { text: 'Duration', cls: 'duration' },
  3: { text: 'Traffic', cls: 'traffic' },
  4: { text: 'Plan', cls: 'plan' },
}

const statusMap: Record<number, { text: string; cls: string }> = {
  0: { text: 'Unused', cls: 'success' },
  1: { text: 'Used', cls: 'muted' },
}

/* ── State ── */
const showModal = ref(false)
const confirmDeleteId = ref<number | null>(null)

const form = ref({
  type: 1,
  value: 0,
  generate_count: 1,
})

const giftcards = ref<Giftcard[]>([])
const loading = ref(true)

async function loadGiftcards() {
  loading.value = true
  try {
    const res: any = await adminGiftcardApi.fetch()
    giftcards.value = res.data || []
  } catch { giftcards.value = [] }
  finally { loading.value = false }
}

onMounted(() => loadGiftcards())

/* ── Helpers ── */
function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString()
}

function formatValue(gc: Giftcard) {
  switch (gc.type) {
    case 1: return `$${(gc.value / 100).toFixed(2)}`
    case 2: return `${gc.value} days`
    case 3: return formatBytes(gc.value)
    case 4: return `Plan #${gc.value}`
    default: return String(gc.value)
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

/* ── Actions ── */
function openGenerate() {
  form.value = { type: 1, value: 0, generate_count: 1 }
  showModal.value = true
}

async function submitGenerate() {
  const payload: Record<string, unknown> = {
    type: form.value.type,
    value: form.value.type === 1 ? form.value.value * 100 : form.value.value,
    generate_count: form.value.generate_count,
  }

  try { await adminGiftcardApi.generate(payload) } catch { /* ignore */ }
  showModal.value = false
  await loadGiftcards()
}

async function deleteGiftcard(id: number) {
  try { await adminGiftcardApi.drop({ id }) } catch { /* ignore */ }
  confirmDeleteId.value = null
  await loadGiftcards()
}

/* ── Value placeholder helper ── */
function valuePlaceholder() {
  switch (form.value.type) {
    case 1: return 'Amount in dollars (e.g. 50)'
    case 2: return 'Duration in days (e.g. 30)'
    case 3: return 'Traffic in GB (e.g. 100)'
    case 4: return 'Plan ID (e.g. 2)'
    default: return 'Value'
  }
}

function valueLabel() {
  switch (form.value.type) {
    case 1: return 'Amount ($)'
    case 2: return 'Duration (days)'
    case 3: return 'Traffic (GB)'
    case 4: return 'Plan ID'
    default: return 'Value'
  }
}
</script>

<template>
  <div class="admin-giftcards">
    <div class="page-header stagger-1">
      <h1 class="page-title">Gift Cards</h1>
      <button class="btn-primary" @click="openGenerate">+ Generate Gift Cards</button>
    </div>

    <!-- Stats Summary -->
    <div class="stats-row stagger-2">
      <div class="stat-chip">
        <span class="stat-value">{{ giftcards.length }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value stat-success">{{ giftcards.filter(g => g.status === 0).length }}</span>
        <span class="stat-label">Unused</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value stat-muted">{{ giftcards.filter(g => g.status === 1).length }}</span>
        <span class="stat-label">Used</span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap stagger-3">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="gc in giftcards" :key="gc.id" class="gc-row">
            <td class="col-id">#{{ gc.id }}</td>
            <td class="col-code">
              <code>{{ gc.code }}</code>
            </td>
            <td>
              <span :class="['type-badge', typeMap[gc.type]?.cls]">
                {{ typeMap[gc.type]?.text }}
              </span>
            </td>
            <td class="col-value">{{ formatValue(gc) }}</td>
            <td>
              <span :class="['or-tag', statusMap[gc.status]?.cls]">
                {{ statusMap[gc.status]?.text }}
              </span>
            </td>
            <td class="col-date">
              <div>{{ formatDate(gc.created_at) }}</div>
              <div v-if="gc.used_by" class="used-info">
                Used by {{ gc.used_by }}
              </div>
            </td>
            <td class="col-actions">
              <button
                v-if="confirmDeleteId !== gc.id"
                class="btn-ghost btn-sm btn-danger"
                @click="confirmDeleteId = gc.id"
              >Delete</button>
              <template v-else>
                <button class="btn-ghost btn-sm btn-danger" @click="deleteGiftcard(gc.id)">Confirm</button>
                <button class="btn-ghost btn-sm" @click="confirmDeleteId = null">Cancel</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!giftcards.length" class="empty-state">No gift cards found.</div>
    </div>

    <!-- Generate Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-box">
            <h2 class="modal-title">Generate Gift Cards</h2>

            <div class="form-group">
              <label>Type</label>
              <select v-model="form.type" class="or-input">
                <option :value="1">Amount (balance credit)</option>
                <option :value="2">Duration (days)</option>
                <option :value="3">Traffic (GB)</option>
                <option :value="4">Plan (assign plan)</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ valueLabel() }}</label>
              <input
                v-model.number="form.value"
                type="number"
                class="or-input"
                min="0"
                :placeholder="valuePlaceholder()"
              />
            </div>

            <div class="form-group">
              <label>Generate Count</label>
              <input
                v-model.number="form.generate_count"
                type="number"
                class="or-input"
                min="1"
                max="500"
                placeholder="Number of cards to generate"
              />
            </div>

            <div class="preview-box">
              <span class="preview-label">Preview</span>
              <div class="preview-content">
                <span class="preview-type">{{ typeMap[form.type]?.text }}</span>
                <span class="preview-sep">--</span>
                <span class="preview-value">
                  {{ form.type === 1 ? `$${form.value}` : form.type === 2 ? `${form.value} days` : form.type === 3 ? `${form.value} GB` : `Plan #${form.value}` }}
                </span>
                <span class="preview-sep">x</span>
                <span class="preview-count">{{ form.generate_count }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" @click="showModal = false">Cancel</button>
              <button
                class="btn-gradient"
                :disabled="!form.value"
                @click="submitGenerate"
              >Generate {{ form.generate_count }} Card{{ form.generate_count > 1 ? 's' : '' }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-giftcards { max-width: 1100px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: $gap-lg;
}
.page-title { font-size: 22px; font-weight: 700; }

/* Stats */
.stats-row { display: flex; gap: $gap-md; margin-bottom: $gap-lg; }
.stat-chip {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: $gap-md $gap-lg;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: $card-radius-sm; min-width: 90px;
}
.stat-value {
  font-size: 20px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;
  color: var(--text-1);
}
.stat-success { color: var(--success); }
.stat-muted { color: var(--text-3); }
.stat-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }

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
    color: var(--accent);
  }
}
.col-value { font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.col-date { font-size: 12px; color: var(--text-2); white-space: nowrap; }
.used-info { font-size: 11px; color: var(--text-3); margin-top: 2px; }
.col-actions { white-space: nowrap; }

.type-badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 600;
  &.amount { background: rgba(var(--brand-rgb), 0.1); color: var(--brand); }
  &.duration { background: rgba(var(--accent-rgb), 0.1); color: var(--accent); }
  &.traffic { background: rgba(16, 185, 129, 0.1); color: var(--success); }
  &.plan { background: rgba(234, 179, 8, 0.12); color: var(--warning); }
}

/* Buttons */
.btn-sm { padding: 5px 12px; font-size: 12px; }
.btn-danger { color: var(--danger); &:hover { background: rgba(239, 68, 68, 0.1); } }

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
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-md);
}
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: $gap-lg; }
.form-group {
  display: flex; flex-direction: column; gap: 6px; margin-bottom: $gap-md;
  label { font-size: 13px; color: var(--text-2); font-weight: 500; }
}

/* Preview */
.preview-box {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: $card-radius-sm; padding: $gap-md; margin-bottom: $gap-md;
}
.preview-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block; margin-bottom: $gap-sm; }
.preview-content { display: flex; align-items: center; gap: $gap-sm; font-size: 14px; font-weight: 600; }
.preview-type { color: var(--brand); }
.preview-sep { color: var(--text-3); font-size: 12px; }
.preview-value { color: var(--accent); font-family: 'Space Grotesk', sans-serif; }
.preview-count { color: var(--text-1); font-family: 'Space Grotesk', sans-serif; }

.modal-actions {
  display: flex; justify-content: flex-end; gap: $gap-sm; margin-top: $gap-lg;
}

.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); font-size: 14px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: $bp-tablet) {
  .admin-table { display: block; overflow-x: auto; }
  .stats-row { flex-wrap: wrap; }
}
</style>

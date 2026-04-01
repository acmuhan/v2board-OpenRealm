<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { adminUserApi } from '../../api/admin'


// ── Types ──
interface User {
  id: number
  email: string
  plan_id: number | null
  plan_name: string
  balance: number
  commission_balance: number
  u: number
  d: number
  transfer_enable: number
  status: number // 0=active, 1=banned
  expired_at: number | null
}

// ── State ──
const search = ref('')
const filter = ref('all')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const showEdit = ref(false)
const showActions = ref<number | null>(null)
const editForm = ref<Record<string, any>>({})
const loading = ref(false)
const error = ref('')
const saving = ref(false)

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '有效' },
  { value: 'expired', label: '已过期' },
  { value: 'banned', label: '已封禁' },
]

// ── Data ──
const users = ref<User[]>([])

const totalPages = ref(1)

// ── API: Fetch users ──
async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, unknown> = { page: page.value }
    if (search.value) params.email = search.value
    if (filter.value !== 'all') params.filter = filter.value
    const res = await adminUserApi.fetch(params)
    const body = res.data
    if (body && body.data) {
      users.value = body.data
      total.value = body.total ?? body.data.length
    } else {
      users.value = Array.isArray(body) ? body : []
      total.value = users.value.length
    }
    totalPages.value = Math.max(1, Math.ceil(total.value / pageSize))
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '加载用户列表失败'
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

// ── Watchers: re-fetch on search/filter/page change ──
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchUsers()
  }, 400)
})

watch(filter, () => {
  page.value = 1
  fetchUsers()
})

watch(page, () => {
  fetchUsers()
})

// ── Helpers ──
function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function formatDate(ts: number | null) {
  if (!ts) return '--'
  return new Date(ts * 1000).toLocaleDateString('zh-CN')
}

function statusTag(user: User) {
  if (user.status === 1) return { text: '已封禁', cls: 'danger' }
  if (!user.expired_at || user.expired_at <= Date.now() / 1000) return { text: '已过期', cls: 'warning' }
  return { text: '有效', cls: 'success' }
}

function trafficText(user: User) {
  return `${formatBytes(user.u + user.d)} / ${formatBytes(user.transfer_enable)}`
}

// ── Actions ──
function openEdit(user: User) {
  editForm.value = {
    id: user.id,
    email: user.email,
    password: '',
    plan_id: user.plan_id,
    balance: user.balance / 100,
    commission_balance: user.commission_balance / 100,
    expired_at: user.expired_at ? new Date(user.expired_at * 1000).toISOString().slice(0, 10) : '',
    banned: user.status === 1,
  }
  showEdit.value = true
  showActions.value = null
}

async function saveEdit() {
  saving.value = true
  error.value = ''
  try {
    const payload: Record<string, unknown> = {
      id: editForm.value.id,
      email: editForm.value.email,
      balance: Math.round(editForm.value.balance * 100),
      commission_balance: Math.round(editForm.value.commission_balance * 100),
      plan_id: editForm.value.plan_id,
      expired_at: editForm.value.expired_at
        ? Math.floor(new Date(editForm.value.expired_at).getTime() / 1000)
        : null,
    }
    if (editForm.value.password) {
      payload.password = editForm.value.password
    }
    await adminUserApi.update(payload)
    showEdit.value = false
    await fetchUsers()
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function openAddUser() {
  editForm.value = {
    id: 0,
    email: '',
    password: '',
    plan_id: null,
    balance: 0,
    commission_balance: 0,
    expired_at: '',
    banned: false,
  }
  showEdit.value = true
  showActions.value = null
}

async function saveNewUser() {
  saving.value = true
  error.value = ''
  try {
    const payload: Record<string, unknown> = {
      email: editForm.value.email,
      password: editForm.value.password,
      plan_id: editForm.value.plan_id,
      balance: Math.round(editForm.value.balance * 100),
      commission_balance: Math.round(editForm.value.commission_balance * 100),
    }
    if (editForm.value.expired_at) {
      payload.expired_at = Math.floor(new Date(editForm.value.expired_at).getTime() / 1000)
    }
    await adminUserApi.generate(payload)
    showEdit.value = false
    await fetchUsers()
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '创建用户失败'
  } finally {
    saving.value = false
  }
}

function handleSaveUser() {
  if (editForm.value.id) {
    saveEdit()
  } else {
    saveNewUser()
  }
}

async function banUser(user: User) {
  showActions.value = null
  error.value = ''
  try {
    await adminUserApi.ban({ id: user.id })
    await fetchUsers()
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '操作失败'
  }
}

async function resetSecret(user: User) {
  showActions.value = null
  error.value = ''
  try {
    await adminUserApi.resetSecret({ id: user.id })
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '重置密钥失败'
  }
}

async function deleteUser(id: number) {
  showActions.value = null
  error.value = ''
  try {
    await adminUserApi.delUser({ id })
    await fetchUsers()
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '删除失败'
  }
}

async function exportCSV() {
  error.value = ''
  try {
    const res = await adminUserApi.dumpCSV()
    const blob = new Blob([res.data], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '导出失败'
  }
}

function toggleActions(id: number) {
  showActions.value = showActions.value === id ? null : id
}
</script>

<template>
  <div class="admin-users" @click="showActions = null">
    <!-- Top Bar -->
    <div class="top-bar stagger-1">
      <div class="bar-left">
        <input v-model="search" class="or-input search-input" placeholder="搜索邮箱或ID..." />
        <select v-model="filter" class="or-input filter-select">
          <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="bar-right">
        <button class="btn-ghost" @click="exportCSV">导出CSV</button>
        <button class="btn-gradient" @click="openAddUser">
          添加用户
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner stagger-2">
      <span>{{ error }}</span>
      <button class="error-dismiss" @click="error = ''">×</button>
    </div>

    <!-- Data Table -->
    <div class="table-wrap stagger-2">
      <!-- Loading overlay -->
      <div v-if="loading" class="loading-overlay">
        <span class="loading-spinner"></span>
        <span>加载中...</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>邮箱</th>
            <th>套餐</th>
            <th>余额</th>
            <th>流量</th>
            <th>状态</th>
            <th>到期时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, idx) in users" :key="user.id" :class="`stagger-${idx + 3}`">
            <td class="col-id">{{ user.id }}</td>
            <td class="col-email">{{ user.email }}</td>
            <td>{{ user.plan_name || '--' }}</td>
            <td class="col-mono">&yen;{{ (user.balance / 100).toFixed(2) }}</td>
            <td class="col-traffic">{{ trafficText(user) }}</td>
            <td><span :class="['or-tag', statusTag(user).cls]">{{ statusTag(user).text }}</span></td>
            <td class="col-mono">{{ formatDate(user.expired_at) }}</td>
            <td class="col-actions">
              <div class="actions-wrap">
                <button class="action-trigger" @click.stop="toggleActions(user.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
                <transition name="fade-slide">
                  <div v-if="showActions === user.id" class="actions-dropdown" @click.stop>
                    <button @click="openEdit(user)">编辑</button>
                    <button @click="banUser(user)">{{ user.status === 1 ? '解封' : '封禁' }}</button>
                    <button @click="resetSecret(user)">重置密钥</button>
                    <button class="danger" @click="deleteUser(user.id)">删除</button>
                  </div>
                </transition>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !users.length">
            <td colspan="8" class="empty-row">暂无数据</td>
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

    <!-- Edit / Add Modal -->
    <teleport to="body">
      <transition name="fade-slide">
        <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>{{ editForm.id ? '编辑用户' : '添加用户' }}</h3>
              <button class="modal-close" @click="showEdit = false">&times;</button>
            </div>
            <form class="modal-body" @submit.prevent="handleSaveUser">
              <div class="form-group">
                <label>邮箱</label>
                <input v-model="editForm.email" class="or-input" placeholder="" />
              </div>
              <div class="form-group">
                <label>密码</label>
                <input v-model="editForm.password" type="password" class="or-input" placeholder="留空不修改" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>套餐 ID</label>
                  <input v-model.number="editForm.plan_id" type="number" class="or-input" placeholder="" />
                </div>
                <div class="form-group">
                  <label>到期日期</label>
                  <input v-model="editForm.expired_at" type="date" class="or-input" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>余额 (元)</label>
                  <input v-model.number="editForm.balance" type="number" step="0.01" class="or-input" />
                </div>
                <div class="form-group">
                  <label>佣金余额 (元)</label>
                  <input v-model.number="editForm.commission_balance" type="number" step="0.01" class="or-input" />
                </div>
              </div>
              <div v-if="editForm.id" class="form-group toggle-group">
                <label>封禁状态</label>
                <button
                  type="button"
                  :class="['toggle-switch', { active: editForm.banned }]"
                  @click="editForm.banned = !editForm.banned"
                >
                  <span class="toggle-knob"></span>
                </button>
              </div>
              <div v-if="error" class="form-error">{{ error }}</div>
              <div class="modal-footer">
                <button type="button" class="btn-ghost" @click="showEdit = false">取消</button>
                <button type="submit" class="btn-gradient" :disabled="saving">
                  {{ saving ? '保存中...' : '保存' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-users {
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
  gap: $gap-sm;
}
.search-input {
  max-width: 280px;
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

// ── Error Banner ──
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  margin-bottom: $gap-md;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: $card-radius-sm;
  color: var(--danger);
  font-size: 13px;
}
.error-dismiss {
  background: transparent;
  color: var(--danger);
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(var(--bg-card-rgb, 10, 14, 26), 0.7);
  font-size: 13px;
  color: var(--text-3);
  border-radius: $card-radius;
}
.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--brand);
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
      padding: 12px 16px;
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
    padding: 12px 16px;
    color: var(--text-2);
    white-space: nowrap;
  }
}
.col-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-3) !important;
}
.col-email {
  color: var(--text-1) !important;
  font-weight: 500;
}
.col-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.col-traffic {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.col-actions {
  width: 40px;
  text-align: center;
}
.empty-row {
  text-align: center;
  padding: 40px 16px !important;
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

    &.danger {
      color: var(--danger);
      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
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
  max-width: 520px;
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
  gap: $gap-md;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    color: var(--text-3);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-md;
}
.form-error {
  font-size: 12px;
  color: var(--danger);
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 6px;
}
.toggle-group {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  transition: all 0.2s;
  cursor: pointer;

  &.active {
    background: var(--danger);
    border-color: var(--danger);

    .toggle-knob {
      transform: translateX(20px);
    }
  }
}
.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $gap-sm;
  padding-top: $gap-sm;
  border-top: 1px solid var(--border);
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
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

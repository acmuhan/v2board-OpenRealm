<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminServerApi } from '../../api/admin'

// ── Types ──────────────────────────────────────
interface ServerRoute {
  id: number
  remarks: string
  match: string
  action: string
  enabled: boolean
}

// ── State ──────────────────────────────────────
const loading = ref(true)
const routes = ref<ServerRoute[]>([])
const showEditModal = ref(false)
const editingRoute = ref<Partial<ServerRoute> | null>(null)
const isNew = ref(false)
const confirmDeleteId = ref<number | null>(null)

// ── Mock Data ──────────────────────────────────
const mockRoutes: ServerRoute[] = [
  {
    id: 1,
    remarks: '中国大陆回国线路',
    match: '(geoip:cn|geosite:cn)',
    action: 'direct',
    enabled: true,
  },
  {
    id: 2,
    remarks: '广告拦截规则',
    match: '(geosite:category-ads-all)',
    action: 'reject',
    enabled: true,
  },
]

// ── Lifecycle ──────────────────────────────────
onMounted(async () => {
  try {
    const res: any = await adminServerApi.routeFetch()
    if (res?.data) {
      routes.value = res.data
    } else {
      routes.value = mockRoutes
    }
  } catch {
    routes.value = mockRoutes
  } finally {
    loading.value = false
  }
})

// ── Actions ────────────────────────────────────
function openAdd() {
  isNew.value = true
  editingRoute.value = {
    remarks: '',
    match: '',
    action: '',
    enabled: true,
  }
  showEditModal.value = true
}

function openEdit(route: ServerRoute) {
  isNew.value = false
  editingRoute.value = { ...route }
  showEditModal.value = true
}

function closeModal() {
  showEditModal.value = false
  editingRoute.value = null
}

async function saveRoute() {
  if (!editingRoute.value) return
  const data = { ...editingRoute.value }
  if (!isNew.value) data.id = editingRoute.value.id

  try {
    await adminServerApi.routeSave(data)
    const res: any = await adminServerApi.routeFetch()
    if (res?.data) routes.value = res.data
  } catch {
    // Mock fallback
    if (isNew.value) {
      const newId = Math.max(...routes.value.map(r => r.id), 0) + 1
      routes.value.push({ ...data, id: newId } as ServerRoute)
    } else {
      const idx = routes.value.findIndex(r => r.id === data.id)
      if (idx >= 0) routes.value[idx] = { ...routes.value[idx], ...data } as ServerRoute
    }
  }

  closeModal()
}

async function deleteRoute(route: ServerRoute) {
  if (confirmDeleteId.value !== route.id) {
    confirmDeleteId.value = route.id
    return
  }

  try {
    await adminServerApi.routeDrop({ id: route.id })
    const res: any = await adminServerApi.routeFetch()
    if (res?.data) routes.value = res.data
  } catch {
    routes.value = routes.value.filter(r => r.id !== route.id)
  }

  confirmDeleteId.value = null
}

async function toggleEnabled(route: ServerRoute) {
  route.enabled = !route.enabled
  try {
    await adminServerApi.routeSave({
      id: route.id,
      remarks: route.remarks,
      match: route.match,
      action: route.action,
      enabled: route.enabled,
    })
  } catch {
    // Mock mode — state already toggled locally
  }
}

function actionTagClass(action: string): string {
  if (action === 'direct') return 'success'
  if (action === 'reject') return 'danger'
  return 'info'
}
</script>

<template>
  <div class="routes-page">
    <!-- Header -->
    <div class="page-header stagger-1">
      <div class="header-left">
        <h1>路由规则</h1>
        <span class="route-count">{{ routes.length }} 条规则</span>
      </div>
      <button class="btn-gradient" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        添加路由
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-text stagger-2">加载中...</div>

    <!-- Routes Table -->
    <div v-else class="table-wrap card stagger-2">
      <table class="routes-table" v-if="routes.length">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th class="col-remarks">备注</th>
            <th class="col-match">匹配规则</th>
            <th class="col-action">动作</th>
            <th class="col-status">状态</th>
            <th class="col-ops">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(route, i) in routes"
            :key="route.id"
            :class="[`stagger-${Math.min(i + 3, 12)}`, { disabled: !route.enabled }]"
          >
            <td class="col-id">
              <span class="id-badge">{{ route.id }}</span>
            </td>
            <td class="col-remarks">
              <span class="route-name">{{ route.remarks }}</span>
            </td>
            <td class="col-match">
              <code class="match-code">{{ route.match }}</code>
            </td>
            <td class="col-action">
              <span :class="['or-tag', actionTagClass(route.action)]">
                {{ route.action }}
              </span>
            </td>
            <td class="col-status">
              <button
                :class="['toggle-switch', { on: route.enabled }]"
                @click="toggleEnabled(route)"
                :title="route.enabled ? '禁用' : '启用'"
              >
                <span class="toggle-thumb"></span>
              </button>
            </td>
            <td class="col-ops">
              <div class="ops-row">
                <button class="act-btn edit" title="编辑" @click="openEdit(route)">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button
                  :class="['act-btn', 'del', { confirm: confirmDeleteId === route.id }]"
                  :title="confirmDeleteId === route.id ? '确认删除' : '删除'"
                  @click="deleteRoute(route)"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M3.5 4l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M8 20h24M14 12l-6 8 6 8M26 12l6 8-6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p>暂无路由规则</p>
      </div>
    </div>

    <!-- Edit / Add Modal -->
    <Transition name="fade-slide">
      <div v-if="showEditModal && editingRoute" class="modal-overlay" @click.self="closeModal">
        <div class="modal-panel card-glow">
          <div class="modal-header">
            <h2>{{ isNew ? '添加路由' : '编辑路由' }}</h2>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>

          <div class="modal-body">
            <div class="form-stack">
              <label class="form-field">
                <span class="form-label">备注</span>
                <input
                  v-model="editingRoute.remarks"
                  class="or-input"
                  placeholder="路由规则描述..."
                />
              </label>

              <label class="form-field">
                <span class="form-label">匹配规则 (源)</span>
                <textarea
                  v-model="editingRoute.match"
                  class="or-input textarea"
                  placeholder="(geoip:cn|geosite:cn)"
                  rows="3"
                ></textarea>
                <span class="form-hint">支持正则表达式，多规则用 | 分隔</span>
              </label>

              <label class="form-field">
                <span class="form-label">动作 (目标)</span>
                <input
                  v-model="editingRoute.action"
                  class="or-input"
                  placeholder="direct / reject / relay:server-tag"
                />
                <span class="form-hint">direct: 直连, reject: 拒绝, 或中转目标地址</span>
              </label>

              <label class="form-field toggle-field">
                <span class="form-label">启用</span>
                <button
                  :class="['toggle-switch', { on: editingRoute.enabled }]"
                  @click="editingRoute!.enabled = !editingRoute!.enabled"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">取消</button>
            <button class="btn-gradient" @click="saveRoute">
              {{ isNew ? '创建' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.routes-page {
  padding: $gap-md;
}

// ── Header ─────────────────────────────────
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $gap-lg;

  h1 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: $gap-md;
}

.route-count {
  font-size: 13px;
  color: var(--text-3);
}

// ── Table ──────────────────────────────────
.table-wrap {
  padding: 0;
  overflow-x: auto;
}

.routes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: $gap-md $gap-lg;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }

  th {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--bg-2);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody tr {
    transition: background 0.15s;

    &:hover {
      background: rgba(var(--brand-rgb), 0.04);
    }

    &:last-child td {
      border-bottom: none;
    }

    &.disabled {
      opacity: 0.5;
    }
  }
}

.col-id {
  width: 60px;
}

.col-status {
  width: 70px;
}

.col-ops {
  width: 90px;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: $card-radius-sm;
  background: var(--bg-2);
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-2);
  font-family: 'JetBrains Mono', monospace;
}

.route-name {
  font-weight: 600;
  color: var(--text-1);
}

.match-code {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg-2);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.ops-row {
  display: flex;
  gap: $gap-sm;
}

// ── Toggle Switch ──────────────────────────
.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  transition: all 0.2s;
  cursor: pointer;

  &.on {
    background: var(--brand);
    border-color: var(--brand);
  }
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-1);
  transition: transform 0.2s;

  .toggle-switch.on & {
    transform: translateX(18px);
  }
}

// ── Action Buttons ─────────────────────────
.act-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: $card-radius-sm;
  background: var(--bg-2);
  color: var(--text-2);
  border: 1px solid var(--border);
  transition: all 0.15s;

  &:hover {
    border-color: var(--border-active);
    color: var(--text-1);
  }

  &.edit:hover {
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
  }

  &.del:hover,
  &.del.confirm {
    color: var(--danger);
    background: rgba(239, 68, 68, 0.08);
    border-color: var(--danger);
  }
}

// ── Modal ──────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $gap-lg;
}

.modal-panel {
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
  background: var(--bg-1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $gap-lg $gap-lg $gap-md;

  h2 {
    font-size: 18px;
    font-weight: 700;
  }
}

.modal-close {
  background: none;
  color: var(--text-3);
  font-size: 22px;
  line-height: 1;
  padding: 4px;
  transition: color 0.15s;

  &:hover {
    color: var(--text-1);
  }
}

.modal-body {
  padding: $gap-lg;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-hint {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}

.textarea {
  resize: vertical;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  min-height: 80px;
}

.toggle-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $gap-md;
  padding: $gap-md $gap-lg $gap-lg;
  border-top: 1px solid var(--border);
}

// ── Empty State ────────────────────────────
.empty-state {
  text-align: center;
  padding: $gap-xl * 2;
  color: var(--text-3);

  p {
    margin-top: $gap-md;
    font-size: 14px;
  }
}

.empty-icon {
  display: flex;
  justify-content: center;
  color: var(--text-3);
}

// ── Misc ───────────────────────────────────
.loading-text {
  color: var(--text-3);
  padding: $gap-xl;
}

// ── Responsive ─────────────────────────────
@media (max-width: $bp-tablet) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $gap-md;
  }

  .routes-table {
    th, td {
      padding: $gap-sm $gap-md;
    }
  }

  .col-match {
    .match-code {
      max-width: 160px;
    }
  }
}

@media (max-width: $bp-mobile) {
  .table-wrap {
    border-radius: $card-radius;
  }
}
</style>

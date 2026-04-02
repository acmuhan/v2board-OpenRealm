<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminServerApi } from '../../api/admin'

// ── Types ──────────────────────────────────────
interface ServerGroup {
  id: number
  name: string
  node_count: number
  created_at?: number
  editing?: boolean
  editName?: string
}

// ── State ──────────────────────────────────────
const loading = ref(true)
const groups = ref<ServerGroup[]>([])
const showAddInput = ref(false)
const newGroupName = ref('')
const confirmDeleteId = ref<number | null>(null)

// ── Error State ────────────────────────────────
const error = ref('')

// ── Lifecycle ──────────────────────────────────
async function loadGroups() {
  loading.value = true
  error.value = ''
  try {
    const res: any = await adminServerApi.groupFetch()
    groups.value = res?.data
      ? res.data.map((g: any) => ({ ...g, editing: false, editName: g.name }))
      : []
  } catch {
    error.value = '加载失败，请刷新重试'
    groups.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadGroups())

// ── Actions ────────────────────────────────────
async function addGroup() {
  const name = newGroupName.value.trim()
  if (!name) return

  try {
    await adminServerApi.groupSave({ name })
    await loadGroups()
  } catch {
    // silent — reload will reflect actual state
  }

  newGroupName.value = ''
  showAddInput.value = false
}

function startEdit(group: ServerGroup) {
  // Cancel any other edits first
  groups.value.forEach(g => {
    if (g.id !== group.id) {
      g.editing = false
      g.editName = g.name
    }
  })
  group.editing = true
  group.editName = group.name
}

function cancelEdit(group: ServerGroup) {
  group.editing = false
  group.editName = group.name
}

async function saveEdit(group: ServerGroup) {
  const name = (group.editName || '').trim()
  if (!name || name === group.name) {
    cancelEdit(group)
    return
  }

  try {
    await adminServerApi.groupSave({ id: group.id, name })
  } catch {
    // Mock — continue with local update
  }

  group.name = name
  group.editing = false
}

async function deleteGroup(group: ServerGroup) {
  if (confirmDeleteId.value !== group.id) {
    confirmDeleteId.value = group.id
    return
  }

  try {
    await adminServerApi.groupDrop({ id: group.id })
    await loadGroups()
  } catch {
    // silent
  }

  confirmDeleteId.value = null
}

function handleEditKeydown(e: KeyboardEvent, group: ServerGroup) {
  if (e.key === 'Enter') saveEdit(group)
  if (e.key === 'Escape') cancelEdit(group)
}

function handleAddKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') addGroup()
  if (e.key === 'Escape') {
    showAddInput.value = false
    newGroupName.value = ''
  }
}
</script>

<template>
  <div class="groups-page">
    <!-- Header -->
    <div class="page-header stagger-1">
      <div class="header-left">
        <h1>节点分组</h1>
        <span class="group-count">{{ groups.length }} 个分组</span>
      </div>
      <button class="btn-gradient" @click="showAddInput = true" v-if="!showAddInput">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        添加分组
      </button>
    </div>

    <!-- Add Input -->
    <Transition name="fade-slide">
      <div v-if="showAddInput" class="add-row card-accent stagger-2">
        <div class="add-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="16" rx="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M9 5v8M5 9h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <input
          v-model="newGroupName"
          class="or-input add-input"
          placeholder="输入分组名称..."
          autofocus
          @keydown="handleAddKeydown"
        />
        <div class="add-actions">
          <button class="btn-primary btn-sm" @click="addGroup">创建</button>
          <button class="btn-ghost btn-sm" @click="showAddInput = false; newGroupName = ''">取消</button>
        </div>
      </div>
    </Transition>

    <!-- Loading / Error -->
    <div v-if="loading" class="loading-text stagger-2">加载中...</div>
    <div v-else-if="error" class="error-state stagger-2">
      <p>{{ error }}</p>
      <button class="btn-ghost btn-sm" @click="loadGroups">重新加载</button>
    </div>

    <!-- Group List -->
    <div v-else class="group-list">
      <div
        v-for="(group, i) in groups"
        :key="group.id"
        :class="['group-item', 'card', `stagger-${Math.min(i + 2, 12)}`]"
      >
        <div class="gi-left">
          <div class="gi-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- Display Mode -->
          <div v-if="!group.editing" class="gi-info" @click="startEdit(group)">
            <span class="gi-name">{{ group.name }}</span>
            <span class="gi-meta">{{ group.node_count }} 个节点</span>
          </div>

          <!-- Edit Mode -->
          <div v-else class="gi-edit">
            <input
              v-model="group.editName"
              class="or-input edit-input"
              autofocus
              @keydown="handleEditKeydown($event, group)"
              @blur="saveEdit(group)"
            />
          </div>
        </div>

        <div class="gi-right">
          <span class="or-tag info">{{ group.node_count }}</span>

          <button
            v-if="!group.editing"
            class="act-btn edit"
            title="编辑"
            @click="startEdit(group)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
          </button>

          <button
            v-if="group.editing"
            class="act-btn save"
            title="保存"
            @click.stop="saveEdit(group)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7.5l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <button
            v-if="group.editing"
            class="act-btn cancel"
            title="取消"
            @click.stop="cancelEdit(group)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <button
            v-if="!group.editing"
            :class="['act-btn', 'del', { confirm: confirmDeleteId === group.id }]"
            :title="confirmDeleteId === group.id ? '确认删除' : '删除'"
            @click="deleteGroup(group)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M3.5 4l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="!groups.length && !loading" class="empty-state stagger-2">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="32" height="32" rx="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/>
            <path d="M20 14v12M14 20h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p>暂无分组，点击上方按钮创建</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.groups-page {
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

.group-count {
  font-size: 13px;
  color: var(--text-3);
}

// ── Add Row ────────────────────────────────
.add-row {
  display: flex;
  align-items: center;
  gap: $gap-md;
  padding: $gap-md $gap-lg;
  margin-bottom: $gap-md;
}

.add-icon {
  color: var(--brand);
  flex-shrink: 0;
  display: flex;
}

.add-input {
  flex: 1;
}

.add-actions {
  display: flex;
  gap: $gap-sm;
  flex-shrink: 0;
}

.btn-sm {
  padding: 7px 16px;
  font-size: 13px;
}

// ── Group List ─────────────────────────────
.group-list {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $gap-md $gap-lg;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.gi-left {
  display: flex;
  align-items: center;
  gap: $gap-md;
  flex: 1;
  min-width: 0;
}

.gi-icon {
  color: var(--text-3);
  flex-shrink: 0;
  display: flex;
}

.gi-info {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  &:hover .gi-name {
    color: var(--brand);
  }
}

.gi-name {
  font-size: 15px;
  font-weight: 600;
  transition: color 0.15s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gi-meta {
  font-size: 12px;
  color: var(--text-3);
}

.gi-edit {
  flex: 1;
}

.edit-input {
  padding: 7px 12px;
  font-size: 14px;
}

.gi-right {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  flex-shrink: 0;
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

  &.save {
    color: var(--success);
    border-color: var(--success);
    background: rgba(var(--accent-rgb), 0.08);

    &:hover {
      background: rgba(var(--accent-rgb), 0.15);
    }
  }

  &.cancel:hover {
    color: var(--warning);
    background: rgba(245, 158, 11, 0.08);
  }

  &.del:hover,
  &.del.confirm {
    color: var(--danger);
    background: rgba(239, 68, 68, 0.08);
    border-color: var(--danger);
  }
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

.error-state {
  display: flex;
  align-items: center;
  gap: $gap-md;
  padding: $gap-xl;
  color: var(--danger);
  font-size: 14px;
}

// ── Responsive ─────────────────────────────
@media (max-width: $bp-mobile) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $gap-md;
  }

  .header-left {
    flex-direction: column;
    gap: $gap-xs;
  }

  .add-row {
    flex-wrap: wrap;
  }

  .add-input {
    min-width: 0;
  }
}
</style>

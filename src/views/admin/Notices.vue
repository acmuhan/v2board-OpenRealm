<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminNoticeApi } from '../../api/admin'

/* ── Types ── */
interface Notice {
  id: number
  title: string
  content: string
  img_url: string
  tags: string[]
  show: boolean
  created_at: number
}

/* ── State ── */
const showModal = ref(false)
const editingId = ref<number | null>(null)
const confirmDeleteId = ref<number | null>(null)

const form = ref({
  title: '',
  content: '',
  img_url: '',
  tags: '',
})

const notices = ref<Notice[]>([])
const loading = ref(true)

async function loadNotices() {
  loading.value = true
  try {
    const res: any = await adminNoticeApi.fetch()
    notices.value = res.data || []
  } catch { notices.value = [] }
  finally { loading.value = false }
}

onMounted(() => loadNotices())

/* ── Actions ── */
function openAdd() {
  editingId.value = null
  form.value = { title: '', content: '', img_url: '', tags: '' }
  showModal.value = true
}

function openEdit(n: Notice) {
  editingId.value = n.id
  form.value = {
    title: n.title,
    content: n.content,
    img_url: n.img_url,
    tags: n.tags.join(', '),
  }
  showModal.value = true
}

async function saveNotice() {
  const payload: Record<string, unknown> = {
    title: form.value.title,
    content: form.value.content,
    img_url: form.value.img_url,
    tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
  }

  if (editingId.value !== null) payload.id = editingId.value
  try { await adminNoticeApi.save(payload) } catch { /* ignore */ }
  showModal.value = false
  await loadNotices()
}

async function toggleVisibility(n: Notice) {
  try { await adminNoticeApi.save({ id: n.id, show: n.show ? 0 : 1 }) } catch { /* ignore */ }
  await loadNotices()
}

async function deleteNotice(id: number) {
  try { await adminNoticeApi.drop({ id }) } catch { /* ignore */ }
  confirmDeleteId.value = null
  await loadNotices()
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString()
}
</script>

<template>
  <div class="admin-notices">
    <div class="page-header stagger-1">
      <h1 class="page-title">Notices</h1>
      <button class="btn-primary" @click="openAdd">+ Add Notice</button>
    </div>

    <!-- Notice List -->
    <div class="notice-grid">
      <div
        v-for="(n, i) in notices" :key="n.id"
        :class="['notice-card card', `stagger-${i + 2}`]"
      >
        <div class="notice-top">
          <h3 class="notice-title">{{ n.title }}</h3>
          <div class="notice-actions">
            <button
              :class="['vis-toggle', { visible: n.show }]"
              :title="n.show ? 'Visible' : 'Hidden'"
              @click="toggleVisibility(n)"
            >
              <span class="vis-icon">{{ n.show ? '&#9673;' : '&#9675;' }}</span>
            </button>
            <button class="btn-ghost btn-sm" @click="openEdit(n)">Edit</button>
            <button
              v-if="confirmDeleteId !== n.id"
              class="btn-ghost btn-sm btn-danger"
              @click="confirmDeleteId = n.id"
            >Delete</button>
            <template v-else>
              <button class="btn-ghost btn-sm btn-danger" @click="deleteNotice(n.id)">Confirm</button>
              <button class="btn-ghost btn-sm" @click="confirmDeleteId = null">Cancel</button>
            </template>
          </div>
        </div>

        <div class="notice-meta">
          <span class="notice-date">{{ formatDate(n.created_at) }}</span>
          <div class="tag-list">
            <span v-for="tag in n.tags" :key="tag" class="or-tag info">{{ tag }}</span>
          </div>
        </div>

        <p class="notice-content">{{ n.content }}</p>

        <div v-if="n.img_url" class="notice-img-hint">
          <span class="img-indicator">Image attached</span>
        </div>
      </div>
    </div>

    <div v-if="!notices.length" class="empty-state">No notices yet.</div>

    <!-- Modal Overlay -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-box">
            <h2 class="modal-title">{{ editingId ? 'Edit Notice' : 'Add Notice' }}</h2>

            <div class="form-group">
              <label>Title</label>
              <input v-model="form.title" class="or-input" placeholder="Notice title" />
            </div>

            <div class="form-group">
              <label>Content</label>
              <textarea
                v-model="form.content"
                class="or-input"
                rows="5"
                placeholder="Notice content..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>Image URL</label>
              <input v-model="form.img_url" class="or-input" placeholder="https://..." />
            </div>

            <div class="form-group">
              <label>Tags <span class="hint">(comma-separated)</span></label>
              <input v-model="form.tags" class="or-input" placeholder="tag1, tag2" />
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" @click="showModal = false">Cancel</button>
              <button
                class="btn-primary"
                :disabled="!form.title.trim()"
                @click="saveNotice"
              >{{ editingId ? 'Save Changes' : 'Create Notice' }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-notices { max-width: 1000px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: $gap-lg;
}
.page-title { font-size: 22px; font-weight: 700; }

/* Notice Cards */
.notice-grid { display: flex; flex-direction: column; gap: $gap-md; }

.notice-card {
  padding: $gap-lg;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover { border-color: var(--border-active); box-shadow: var(--shadow-sm); }
}
.notice-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: $gap-md; margin-bottom: $gap-sm;
}
.notice-title { font-size: 16px; font-weight: 700; color: var(--text-1); margin: 0; }
.notice-actions { display: flex; gap: $gap-xs; flex-shrink: 0; }
.notice-meta {
  display: flex; align-items: center; gap: $gap-md; margin-bottom: $gap-md;
}
.notice-date { font-size: 12px; color: var(--text-3); }
.tag-list { display: flex; gap: $gap-xs; flex-wrap: wrap; }
.notice-content {
  font-size: 13px; color: var(--text-2); line-height: 1.7; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
.notice-img-hint { margin-top: $gap-sm; }
.img-indicator {
  font-size: 11px; color: var(--accent); background: rgba(var(--accent-rgb), 0.1);
  padding: 3px 8px; border-radius: 4px;
}

/* Visibility Toggle */
.vis-toggle {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--bg-1); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  &.visible { border-color: var(--success); background: rgba(16, 185, 129, 0.1); }
}
.vis-icon { font-size: 14px; color: var(--text-2); .visible & { color: var(--success); } }

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
  width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-md);
}
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: $gap-lg; }
.form-group {
  display: flex; flex-direction: column; gap: 6px; margin-bottom: $gap-md;
  label { font-size: 13px; color: var(--text-2); font-weight: 500; }
  .hint { font-size: 11px; color: var(--text-3); font-weight: 400; }
}
textarea.or-input { resize: vertical; min-height: 100px; }
.modal-actions {
  display: flex; justify-content: flex-end; gap: $gap-sm; margin-top: $gap-lg;
}

.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); font-size: 14px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

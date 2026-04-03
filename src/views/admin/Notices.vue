<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminNoticeApi } from '../../api/admin'
import MarkdownRenderer from '../../components/common/MarkdownRenderer.vue'
import { useToastStore } from '../../stores/toast'

const { t } = useI18n()
const toast = useToastStore()

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
const showPreview = ref(false)
const saving = ref(false)
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
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function insertMarkdown(before: string, after = '', placeholder = '') {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = form.value.content.slice(start, end) || placeholder
  form.value.content = form.value.content.slice(0, start) + before + selected + after + form.value.content.slice(end)
  // Restore cursor after insertion
  nextTick(() => {
    const newPos = start + before.length + selected.length
    ta.focus()
    ta.setSelectionRange(start + before.length, newPos)
  })
}

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
  showPreview.value = false
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
  showPreview.value = false
  showModal.value = true
}

async function saveNotice() {
  saving.value = true
  const payload: Record<string, unknown> = {
    title: form.value.title,
    content: form.value.content,
    img_url: form.value.img_url,
    tags: form.value.tags.split(',').map(s => s.trim()).filter(Boolean),
  }

  if (editingId.value !== null) payload.id = editingId.value
  try {
    await adminNoticeApi.save(payload)
    toast.success(editingId.value ? t('admin.notices.saveChanges') : t('admin.notices.createNotice'))
    showModal.value = false
    await loadNotices()
  } catch (e: any) {
    toast.error(e?.message || t('common.error') || '保存失败')
  } finally {
    saving.value = false
  }
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
      <h1 class="page-title">{{ t('admin.notices.title') }}</h1>
      <button class="btn-gradient" @click="openAdd">+ {{ t('admin.notices.add') }}</button>
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
              :title="n.show ? t('admin.notices.show') : t('admin.notices.hide')"
              @click="toggleVisibility(n)"
            >
              <span :class="['vis-dot', { active: n.show }]" />
            </button>
            <button class="btn-ghost btn-sm" @click="openEdit(n)">{{ t('common.edit') }}</button>
            <button
              v-if="confirmDeleteId !== n.id"
              class="btn-ghost btn-sm btn-danger"
              @click="confirmDeleteId = n.id"
            >{{ t('common.delete') }}</button>
            <template v-else>
              <button class="btn-ghost btn-sm btn-danger" @click="deleteNotice(n.id)">{{ t('common.confirm') }}</button>
              <button class="btn-ghost btn-sm" @click="confirmDeleteId = null">{{ t('common.cancel') }}</button>
            </template>
          </div>
        </div>

        <div class="notice-meta">
          <span class="notice-date">{{ formatDate(n.created_at) }}</span>
          <div class="tag-list">
            <span v-for="tag in n.tags" :key="tag" class="or-tag info">{{ tag }}</span>
          </div>
        </div>

        <div class="notice-content">
          <MarkdownRenderer :content="n.content" />
        </div>

        <div v-if="n.img_url" class="notice-img-hint">
          <span class="img-indicator">{{ t('admin.notices.imageAttached') }}</span>
        </div>
      </div>
    </div>

    <div v-if="!notices.length" class="empty-state">{{ t('common.noData') || 'No notices yet.' }}</div>

    <!-- Modal Overlay -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-box">
            <h2 class="modal-title">{{ editingId ? t('admin.notices.editTitle') : t('admin.notices.add') }}</h2>

            <div class="form-group">
              <label>{{ t('admin.notices.name') }}</label>
              <input v-model="form.title" class="or-input" :placeholder="t('admin.notices.name')" />
            </div>

            <div class="form-group">
              <div class="content-header">
                <label>{{ t('admin.notices.content') }}</label>
                <button
                  :class="['preview-toggle', { active: showPreview }]"
                  type="button"
                  @click="showPreview = !showPreview"
                >{{ t('admin.notices.markdownPreview') }}</button>
              </div>
              <div v-if="!showPreview" class="md-toolbar">
                <button type="button" class="tb-btn" title="粗体 (Ctrl+B)" @click="insertMarkdown('**', '**', '粗体文字')">
                  <strong>B</strong>
                </button>
                <button type="button" class="tb-btn" title="斜体 (Ctrl+I)" @click="insertMarkdown('*', '*', '斜体文字')">
                  <em>I</em>
                </button>
                <button type="button" class="tb-btn" title="标题" @click="insertMarkdown('## ', '', '标题')">
                  H
                </button>
                <button type="button" class="tb-btn" title="链接" @click="insertMarkdown('[', '](url)', '链接文字')">
                  🔗
                </button>
                <button type="button" class="tb-btn" title="图片" @click="insertMarkdown('![', '](url)', '图片描述')">
                  🖼
                </button>
                <button type="button" class="tb-btn" title="代码" @click="insertMarkdown('`', '`', '代码')">
                  &lt;/&gt;
                </button>
                <button type="button" class="tb-btn" title="列表" @click="insertMarkdown('\n- ', '', '列表项')">
                  ≡
                </button>
                <div class="tb-divider"></div>
                <span class="tb-hint">Markdown</span>
              </div>
              <textarea
                v-if="!showPreview"
                ref="textareaRef"
                v-model="form.content"
                :class="['or-input', { 'with-toolbar': !showPreview }]"
                rows="8"
                :placeholder="t('admin.notices.content') + ' (Markdown supported)'"
                @keydown.ctrl.b.prevent="insertMarkdown('**', '**', '粗体文字')"
                @keydown.ctrl.i.prevent="insertMarkdown('*', '*', '斜体文字')"
              ></textarea>
              <div v-else class="md-preview-wrap">
                <MarkdownRenderer :content="form.content" />
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('admin.notices.imgUrl') }}</label>
              <input v-model="form.img_url" class="or-input" placeholder="https://..." />
            </div>

            <div class="form-group">
              <label>{{ t('admin.notices.tags') }} <span class="hint">(comma-separated)</span></label>
              <input v-model="form.tags" class="or-input" placeholder="tag1, tag2" />
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" @click="showModal = false">{{ t('common.cancel') }}</button>
              <button
                class="btn-gradient"
                :disabled="!form.title.trim() || saving"
                @click="saveNotice"
              >{{ saving ? '...' : (editingId ? t('admin.notices.saveChanges') : t('admin.notices.createNotice')) }}</button>
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
.page-title { font-size: 24px; font-weight: 700; }

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
.notice-actions { display: flex; gap: $gap-xs; flex-shrink: 0; align-items: center; }
.notice-meta {
  display: flex; align-items: center; gap: $gap-md; margin-bottom: $gap-md;
}
.notice-date { font-size: 12px; color: var(--text-3); }
.tag-list { display: flex; gap: $gap-xs; flex-wrap: wrap; }
.notice-content {
  font-size: 13px; color: var(--text-2); line-height: 1.7;
  max-height: 120px; overflow: hidden; position: relative;
  &::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 40px; background: linear-gradient(transparent, var(--bg-card));
  }
}
.notice-img-hint { margin-top: $gap-sm; }
.img-indicator {
  font-size: 11px; color: var(--accent); background: rgba(var(--accent-rgb), 0.1);
  padding: 3px 8px; border-radius: 4px;
}

/* Visibility Toggle — CSS dot instead of HTML entity */
.vis-toggle {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--bg-1); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  &.visible { border-color: var(--success); background: rgba(16, 185, 129, 0.1); }
}
.vis-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--text-3); transition: background 0.2s;
  &.active { background: var(--success); }
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
  width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-md);
}
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: $gap-lg; }
.form-group {
  display: flex; flex-direction: column; gap: 6px; margin-bottom: $gap-md;
  label { font-size: 13px; color: var(--text-2); font-weight: 500; }
  .hint { font-size: 11px; color: var(--text-3); font-weight: 400; }
}
.content-header {
  display: flex; align-items: center; justify-content: space-between;
}
.preview-toggle {
  font-size: 12px; padding: 3px 10px; border-radius: 6px;
  background: var(--bg-1); border: 1px solid var(--border);
  color: var(--text-2); cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--accent); color: var(--accent); }
  &.active { border-color: var(--accent); color: var(--accent); background: rgba(var(--accent-rgb), 0.08); }
}
textarea.or-input { resize: vertical; min-height: 160px; }
.with-toolbar { border-top: none !important; border-radius: 0 0 8px 8px !important; }
.md-toolbar {
  display: flex; align-items: center; gap: 2px;
  padding: 6px 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border); border-bottom: none;
  border-radius: 8px 8px 0 0;
  flex-wrap: wrap;
}
.tb-btn {
  min-width: 28px; height: 28px; padding: 0 6px;
  border-radius: 5px; border: none; background: transparent;
  color: var(--text-2); font-size: 13px; cursor: pointer;
  transition: all 0.12s; display: flex; align-items: center; justify-content: center;
  &:hover { background: rgba(var(--brand-rgb), 0.1); color: var(--brand-light); }
}
.tb-divider { width: 1px; height: 16px; background: var(--border); margin: 0 4px; }
.tb-hint { font-size: 10px; color: var(--text-3); margin-left: auto; font-family: 'Space Grotesk', sans-serif; }
.md-preview-wrap {
  min-height: 160px; max-height: 400px; overflow-y: auto;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: $card-radius-sm; padding: $gap-md;
}
.modal-actions {
  display: flex; justify-content: flex-end; gap: $gap-sm; margin-top: $gap-lg;
}

.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); font-size: 14px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

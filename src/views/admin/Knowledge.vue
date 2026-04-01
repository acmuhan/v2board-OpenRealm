<script setup lang="ts">
import { ref, computed } from 'vue'
import { adminKnowledgeApi } from '../../api/admin'

/* ── Types ── */
interface Article {
  id: number
  title: string
  category: string
  body: string
  show: boolean
  sort: number
}

/* ── State ── */
const activeCategory = ref('all')
const showModal = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  title: '',
  category: '',
  body: '',
  show: true,
})

/* ── Mock Data ── */
const categories = ref<string[]>(['Getting Started', 'Advanced Usage'])

const articles = ref<Article[]>([
  {
    id: 1, title: 'How to Subscribe and Connect', category: 'Getting Started',
    body: 'Step 1: Purchase a plan from the Shop page.\nStep 2: Copy your subscription link from the Dashboard.\nStep 3: Import the link into your client (Clash, V2rayN, Shadowrocket, etc.).\nStep 4: Select a node and connect.',
    show: true, sort: 0,
  },
  {
    id: 2, title: 'Supported Client Applications', category: 'Getting Started',
    body: 'We support the following clients:\n- Windows: Clash for Windows, V2rayN\n- macOS: ClashX Pro, Surge\n- iOS: Shadowrocket, Quantumult X, Stash\n- Android: Clash for Android, V2rayNG\n\nRecommended: Clash-based clients for best compatibility.',
    show: true, sort: 1,
  },
  {
    id: 3, title: 'Configuring Custom DNS and Rules', category: 'Advanced Usage',
    body: 'You can customize DNS resolution and routing rules in Clash:\n\n1. Edit your config file under "dns" section\n2. Add custom nameservers or DoH endpoints\n3. Define rule-providers for ad-blocking or region-based routing\n4. Use rule sets from community repositories for enhanced filtering.',
    show: true, sort: 0,
  },
  {
    id: 4, title: 'Traffic Optimization Tips', category: 'Advanced Usage',
    body: 'To reduce unnecessary traffic and improve speed:\n\n- Enable UDP relay only when needed (gaming, VoIP)\n- Use rule-based proxy mode instead of global\n- Select the nearest geographic node\n- Avoid streaming on multiple devices simultaneously if on a limited plan.',
    show: false, sort: 1,
  },
])

/* ── Computed ── */
const filteredArticles = computed(() => {
  const list = activeCategory.value === 'all'
    ? articles.value
    : articles.value.filter(a => a.category === activeCategory.value)
  return [...list].sort((a, b) => a.sort - b.sort)
})

/* ── Actions ── */
function openAdd() {
  editingId.value = null
  form.value = { title: '', category: categories.value[0] || '', body: '', show: true }
  showModal.value = true
}

function openEdit(a: Article) {
  editingId.value = a.id
  form.value = { title: a.title, category: a.category, body: a.body, show: a.show }
  showModal.value = true
}

async function saveArticle() {
  const payload: Record<string, unknown> = {
    title: form.value.title,
    category: form.value.category,
    body: form.value.body,
    show: form.value.show ? 1 : 0,
  }

  if (editingId.value !== null) {
    payload.id = editingId.value
    try { await adminKnowledgeApi.save(payload) } catch { /* mock */ }
    const idx = articles.value.findIndex(a => a.id === editingId.value)
    if (idx !== -1) {
      articles.value[idx] = { ...articles.value[idx], ...form.value }
    }
  } else {
    try { await adminKnowledgeApi.save(payload) } catch { /* mock */ }
    articles.value.push({
      id: Date.now(),
      title: form.value.title,
      category: form.value.category,
      body: form.value.body,
      show: form.value.show,
      sort: articles.value.length,
    })
    if (!categories.value.includes(form.value.category)) {
      categories.value.push(form.value.category)
    }
  }
  showModal.value = false
}

async function deleteArticle(id: number) {
  try { await adminKnowledgeApi.drop({ id }) } catch { /* mock */ }
  articles.value = articles.value.filter(a => a.id !== id)
}

function moveUp(article: Article) {
  const sameCat = articles.value.filter(a => a.category === article.category).sort((a, b) => a.sort - b.sort)
  const idx = sameCat.findIndex(a => a.id === article.id)
  if (idx <= 0) return
  const prev = sameCat[idx - 1]
  const tmpSort = article.sort
  article.sort = prev.sort
  prev.sort = tmpSort
  syncSort()
}

function moveDown(article: Article) {
  const sameCat = articles.value.filter(a => a.category === article.category).sort((a, b) => a.sort - b.sort)
  const idx = sameCat.findIndex(a => a.id === article.id)
  if (idx === -1 || idx >= sameCat.length - 1) return
  const next = sameCat[idx + 1]
  const tmpSort = article.sort
  article.sort = next.sort
  next.sort = tmpSort
  syncSort()
}

async function syncSort() {
  const ids = [...articles.value].sort((a, b) => a.sort - b.sort).map(a => a.id)
  try { await adminKnowledgeApi.sort({ ids }) } catch { /* mock */ }
}

function toggleShow(a: Article) {
  a.show = !a.show
  adminKnowledgeApi.save({ id: a.id, show: a.show ? 1 : 0 }).catch(() => { /* mock */ })
}
</script>

<template>
  <div class="admin-knowledge">
    <div class="page-header stagger-1">
      <h1 class="page-title">Knowledge Base</h1>
      <button class="btn-primary" @click="openAdd">+ Add Article</button>
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs stagger-2">
      <button
        :class="['tab-btn', { active: activeCategory === 'all' }]"
        @click="activeCategory = 'all'"
      >All</button>
      <button
        v-for="cat in categories" :key="cat"
        :class="['tab-btn', { active: activeCategory === cat }]"
        @click="activeCategory = cat"
      >{{ cat }}</button>
    </div>

    <!-- Article List -->
    <div class="article-list">
      <div
        v-for="(a, i) in filteredArticles" :key="a.id"
        :class="['article-row card', `stagger-${i + 3}`]"
      >
        <div class="row-reorder">
          <button class="arrow-btn" title="Move up" @click="moveUp(a)">&#9650;</button>
          <span class="sort-num">{{ a.sort }}</span>
          <button class="arrow-btn" title="Move down" @click="moveDown(a)">&#9660;</button>
        </div>

        <div class="row-content">
          <div class="row-top">
            <h3 class="article-title">{{ a.title }}</h3>
            <span class="or-tag info">{{ a.category }}</span>
          </div>
          <p class="article-preview">{{ a.body.substring(0, 120) }}{{ a.body.length > 120 ? '...' : '' }}</p>
        </div>

        <div class="row-meta">
          <button
            :class="['vis-toggle', { visible: a.show }]"
            @click="toggleShow(a)"
            :title="a.show ? 'Visible' : 'Hidden'"
          >
            {{ a.show ? 'Visible' : 'Hidden' }}
          </button>
          <button class="btn-ghost btn-sm" @click="openEdit(a)">Edit</button>
          <button class="btn-ghost btn-sm btn-danger" @click="deleteArticle(a.id)">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="!filteredArticles.length" class="empty-state">No articles found.</div>

    <!-- Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-box">
            <h2 class="modal-title">{{ editingId ? 'Edit Article' : 'Add Article' }}</h2>

            <div class="form-group">
              <label>Title</label>
              <input v-model="form.title" class="or-input" placeholder="Article title" />
            </div>

            <div class="form-group">
              <label>Category</label>
              <div class="category-input-row">
                <select v-model="form.category" class="or-input select-input">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
                <input
                  v-model="form.category"
                  class="or-input"
                  placeholder="Or type new category"
                  style="flex: 1;"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Body</label>
              <textarea
                v-model="form.body"
                class="or-input body-textarea"
                rows="10"
                placeholder="Article content..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="toggle-row">
                <input type="checkbox" v-model="form.show" class="toggle-check" />
                <span>Show article to users</span>
              </label>
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" @click="showModal = false">Cancel</button>
              <button
                class="btn-primary"
                :disabled="!form.title.trim() || !form.category.trim()"
                @click="saveArticle"
              >{{ editingId ? 'Save Changes' : 'Create Article' }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-knowledge { max-width: 1000px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: $gap-lg;
}
.page-title { font-size: 22px; font-weight: 700; }

/* Category Tabs */
.category-tabs {
  display: flex; gap: $gap-sm; margin-bottom: $gap-lg; flex-wrap: wrap;
}
.tab-btn {
  padding: 8px 18px; border-radius: $card-radius-sm;
  background: var(--bg-card); border: 1px solid var(--border);
  color: var(--text-2); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  &:hover { border-color: var(--border-active); color: var(--text-1); }
  &.active {
    background: rgba(var(--brand-rgb), 0.12);
    border-color: var(--brand); color: var(--brand);
  }
}

/* Article List */
.article-list { display: flex; flex-direction: column; gap: $gap-sm; }

.article-row {
  display: flex; align-items: center; gap: $gap-md; padding: $gap-md $gap-lg;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover { border-color: var(--border-active); box-shadow: var(--shadow-sm); }
}

/* Reorder */
.row-reorder {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  flex-shrink: 0;
}
.arrow-btn {
  width: 24px; height: 20px; border: none; background: transparent;
  color: var(--text-3); font-size: 10px; cursor: pointer;
  border-radius: 4px; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: var(--bg-elevated); color: var(--brand); }
}
.sort-num {
  font-size: 10px; color: var(--text-3); font-family: 'JetBrains Mono', monospace;
}

/* Content */
.row-content { flex: 1; min-width: 0; }
.row-top { display: flex; align-items: center; gap: $gap-sm; margin-bottom: $gap-xs; }
.article-title { font-size: 14px; font-weight: 600; color: var(--text-1); margin: 0; }
.article-preview {
  font-size: 12px; color: var(--text-3); line-height: 1.5; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Meta / Actions */
.row-meta {
  display: flex; align-items: center; gap: $gap-xs; flex-shrink: 0;
}
.vis-toggle {
  padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--border); background: var(--bg-1);
  color: var(--text-3); cursor: pointer; transition: all 0.2s;
  &.visible {
    border-color: var(--success); color: var(--success);
    background: rgba(16, 185, 129, 0.08);
  }
}

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
  width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-md);
}
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: $gap-lg; }
.form-group {
  display: flex; flex-direction: column; gap: 6px; margin-bottom: $gap-md;
  label { font-size: 13px; color: var(--text-2); font-weight: 500; }
}
.category-input-row { display: flex; gap: $gap-sm; }
.select-input { max-width: 200px; }
.body-textarea { resize: vertical; min-height: 200px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; }
.toggle-row {
  display: flex; align-items: center; gap: $gap-sm; cursor: pointer;
  flex-direction: row !important;
  span { color: var(--text-2); }
}
.toggle-check {
  width: 16px; height: 16px; accent-color: var(--brand);
}
.modal-actions {
  display: flex; justify-content: flex-end; gap: $gap-sm; margin-top: $gap-lg;
}

.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); font-size: 14px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: $bp-mobile) {
  .article-row { flex-direction: column; align-items: flex-start; }
  .row-reorder { flex-direction: row; }
  .row-meta { width: 100%; justify-content: flex-end; }
}
</style>

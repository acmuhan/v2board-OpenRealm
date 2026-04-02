<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { knowledgeApi } from '../api'
import SvgIcon from '../components/common/SvgIcon.vue'

// Fallback static tutorials if V2Board has no knowledge articles
const staticTutorials = [
  { platform: 'Windows', icon: 'windows', steps: ['下载 Clash Verge Rev 客户端', '复制订阅链接', '打开客户端 → 配置 → 导入订阅链接', '开启系统代理'] },
  { platform: 'iOS', icon: 'apple', steps: ['App Store 搜索 Shadowrocket (需海外ID)', '复制订阅链接', '打开 Shadowrocket → 添加节点 → 粘贴订阅', '连接节点'] },
  { platform: 'Android', icon: 'android', steps: ['下载 Clash Meta for Android', '复制订阅链接', '打开应用 → 配置 → 从URL导入', '选择节点并连接'] },
  { platform: 'macOS', icon: 'macos', steps: ['下载 Clash Verge Rev 客户端', '复制订阅链接', '打开客户端 → 配置 → 导入订阅链接', '开启系统代理'] },
]

const articles = ref<any[]>([])
const selectedId = ref<number | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res: any = await knowledgeApi.list()
    articles.value = res.data || []
  } catch { /* fallback to static */ }
  finally { loading.value = false }
})

async function toggleArticle(id: number) {
  if (selectedId.value === id) { selectedId.value = null; return }
  selectedId.value = id
  const article = articles.value.find(a => a.id === id)
  if (article && !article.body) {
    try {
      const res: any = await knowledgeApi.detail(id)
      Object.assign(article, res.data || {})
    } catch { /* use title only */ }
  }
}
</script>

<template>
  <div class="tutorial-page">
    <h1 class="page-title">使用教程</h1>

    <!-- Dynamic articles from V2Board knowledge base -->
    <template v-if="!loading && articles.length">
      <div class="article-list">
        <div
          v-for="a in articles"
          :key="a.id"
          class="article-item glass-card"
          @click="toggleArticle(a.id)"
        >
          <div class="article-header">
            <SvgIcon name="book" :size="16" class="article-icon" />
            <span class="article-title">{{ a.title }}</span>
            <span class="article-arrow" :class="{ open: selectedId === a.id }">›</span>
          </div>
          <transition name="fade-slide">
            <div v-if="selectedId === a.id" class="article-body" v-html="a.body || '加载中...'"></div>
          </transition>
        </div>
      </div>
    </template>

    <!-- Static fallback tutorials -->
    <template v-else-if="!loading">
      <div class="tutorial-grid">
        <div v-for="t in staticTutorials" :key="t.platform" class="tutorial-card glass-card">
          <div class="card-header">
            <div class="platform-icon">
              <SvgIcon :name="t.icon" :size="20" />
            </div>
            <h3>{{ t.platform }}</h3>
          </div>
          <ol class="steps">
            <li v-for="(step, i) in t.steps" :key="i">
              <span class="step-num">{{ i + 1 }}</span>
              <span>{{ step }}</span>
            </li>
          </ol>
        </div>
      </div>
    </template>

    <div v-else class="loading-text">加载中...</div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.page-title { font-size: 22px; font-weight: 700; margin-bottom: $gap-lg; }
.loading-text { color: var(--text-3); }

// Dynamic articles
.article-list { display: flex; flex-direction: column; gap: $gap-sm; }
.article-item {
  padding: $gap-md $gap-lg;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover { transform: translateY(-1px); }
}
.article-header { display: flex; align-items: center; gap: $gap-sm; }
.article-icon { color: var(--brand); flex-shrink: 0; }
.article-title { flex: 1; font-size: 14px; font-weight: 600; }
.article-arrow {
  font-size: 18px; color: var(--text-3); transition: transform 0.2s;
  &.open { transform: rotate(90deg); color: var(--brand); }
}
.article-body {
  margin-top: $gap-md; font-size: 14px; color: var(--text-2);
  line-height: 1.7; padding-top: $gap-md;
  border-top: 1px solid var(--border);
}

// Static grid
.tutorial-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: $gap-md; }
.tutorial-card { padding: $gap-lg; }
.card-header {
  display: flex; align-items: center; gap: $gap-sm; margin-bottom: $gap-md;
  h3 { font-size: 16px; font-weight: 700; }
}
.platform-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--grad-brand);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.steps { list-style: none; display: flex; flex-direction: column; gap: $gap-sm; }
.steps li { display: flex; align-items: flex-start; gap: $gap-sm; font-size: 14px; color: var(--text-2); line-height: 1.5; }
.step-num {
  flex-shrink: 0; width: 22px; height: 22px; border-radius: 6px;
  background: var(--brand); color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.fade-slide-enter-active { transition: all 0.25s ease; }
.fade-slide-leave-active { transition: all 0.15s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-6px); }
.fade-slide-leave-to { opacity: 0; }
</style>

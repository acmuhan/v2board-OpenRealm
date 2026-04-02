<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { knowledgeApi, commApi } from '../api'
import SvgIcon from '../components/common/SvgIcon.vue'
import MarkdownRenderer from '../components/common/MarkdownRenderer.vue'

interface DownloadLinks { windows?: string; macos?: string; ios?: string; android?: string }
const downloads = ref<DownloadLinks>({})

const staticTutorials = [
  { platform: 'Windows', icon: 'windows', dlKey: 'windows' as keyof DownloadLinks,
    steps: ['下载 Clash Verge Rev 客户端', '复制订阅链接', '打开客户端 → 配置 → 导入订阅链接', '开启系统代理'] },
  { platform: 'iOS', icon: 'apple', dlKey: 'ios' as keyof DownloadLinks,
    steps: ['App Store 搜索 Shadowrocket (需海外ID)', '复制订阅链接', '打开 Shadowrocket → 添加节点 → 粘贴订阅', '连接节点'] },
  { platform: 'Android', icon: 'android', dlKey: 'android' as keyof DownloadLinks,
    steps: ['下载 Clash Meta for Android', '复制订阅链接', '打开应用 → 配置 → 从URL导入', '选择节点并连接'] },
  { platform: 'macOS', icon: 'macos', dlKey: 'macos' as keyof DownloadLinks,
    steps: ['下载 Clash Verge Rev 客户端', '复制订阅链接', '打开客户端 → 配置 → 导入订阅链接', '开启系统代理'] },
]

const articles = ref<any[]>([])
const selectedId = ref<number | null>(null)
const loading = ref(true)

onMounted(async () => {
  // Fetch client download links from backend guest config
  try {
    const cfgRes: any = await commApi.config()
    const cfg = cfgRes.data || {}
    downloads.value = {
      windows: cfg.client_windows_url || cfg.windows_download_url || '',
      macos:   cfg.client_macos_url   || cfg.macos_download_url   || '',
      ios:     cfg.client_ios_url     || cfg.ios_download_url     || '',
      android: cfg.client_android_url || cfg.android_download_url || '',
    }
  } catch { /* no config, no links */ }

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
            <div v-if="selectedId === a.id" class="article-body">
              <MarkdownRenderer :content="a.body || '加载中...'" />
            </div>
          </transition>
        </div>
      </div>
    </template>

    <!-- Static fallback tutorials -->
    <template v-else-if="!loading">
      <div class="tutorial-grid">
        <div v-for="tut in staticTutorials" :key="tut.platform" class="tutorial-card glass-card">
          <div class="card-header">
            <div class="platform-icon">
              <SvgIcon :name="tut.icon" :size="20" />
            </div>
            <div class="card-header-info">
              <h3>{{ tut.platform }}</h3>
              <a
                v-if="downloads[tut.dlKey]"
                :href="downloads[tut.dlKey]"
                target="_blank"
                rel="noopener"
                class="dl-btn"
                @click.stop
              >下载客户端</a>
            </div>
          </div>
          <ol class="steps">
            <li v-for="(step, i) in tut.steps" :key="i">
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

.article-list { display: flex; flex-direction: column; gap: $gap-sm; }
.article-item {
  padding: $gap-md $gap-lg; cursor: pointer; transition: transform 0.2s;
  &:hover { transform: translateY(-1px); }
}
.article-header { display: flex; align-items: center; gap: $gap-sm; }
.article-icon { color: var(--brand); flex-shrink: 0; }
.article-title { flex: 1; font-size: 14px; font-weight: 600; }
.article-arrow {
  font-size: 18px; color: var(--text-3); transition: transform 0.2s;
  &.open { transform: rotate(90deg); color: var(--brand); }
}
.article-body { margin-top: $gap-md; padding-top: $gap-md; border-top: 1px solid var(--border); }

.tutorial-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); gap: $gap-md; }
.tutorial-card { padding: $gap-lg; }
.card-header { display: flex; align-items: flex-start; gap: $gap-sm; margin-bottom: $gap-md; }
.card-header-info { display: flex; flex-direction: column; gap: 4px; h3 { font-size: 16px; font-weight: 700; } }
.dl-btn {
  display: inline-block; font-size: 12px; font-weight: 600;
  color: var(--brand-light); background: rgba(var(--brand-rgb), 0.1);
  border: 1px solid rgba(var(--brand-rgb), 0.2);
  padding: 3px 10px; border-radius: 6px; text-decoration: none; transition: all 0.15s;
  &:hover { background: rgba(var(--brand-rgb), 0.2); }
}
.platform-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--grad-brand); display: flex; align-items: center; justify-content: center;
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

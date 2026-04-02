<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { knowledgeApi } from '../api'
import SvgIcon from '../components/common/SvgIcon.vue'
import MarkdownRenderer from '../components/common/MarkdownRenderer.vue'

const { t } = useI18n()

const articles = ref<any[]>([])
const loading = ref(true)
const selected = ref<any>(null)

onMounted(async () => {
  try {
    const res: any = await knowledgeApi.list()
    articles.value = res.data || []
  } finally { loading.value = false }
})

async function openArticle(a: any) {
  if (selected.value?.id === a.id) { selected.value = null; return }
  try {
    const res: any = await knowledgeApi.detail(a.id)
    selected.value = res.data || a
  } catch { selected.value = a }
}
</script>

<template>
  <div class="knowledge-page">
    <h1 class="page-title">{{ t('knowledge.title') }}</h1>
    <div v-if="loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="articles.length" class="article-list">
      <div v-for="a in articles" :key="a.id" class="article-item glass-card" @click="openArticle(a)">
        <div class="article-header">
          <SvgIcon name="knowledge" :size="18" />
          <span class="article-title">{{ a.title }}</span>
        </div>
        <transition name="fade-slide">
          <div v-if="selected?.id === a.id" class="article-content">
            <MarkdownRenderer :content="selected.body || a.body || t('knowledge.noContent')" />
          </div>
        </transition>
      </div>
    </div>
    <div v-else class="empty-state">{{ t('knowledge.empty') }}</div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-title { font-size: 22px; font-weight: 700; margin-bottom: $gap-lg; }
.loading-text { color: var(--text-3); }
.article-list { display: flex; flex-direction: column; gap: $gap-md; }
.article-item { padding: $gap-lg; cursor: pointer; &:hover { transform: translateY(-1px); } }
.article-header { display: flex; align-items: center; gap: $gap-sm; }
.article-title { font-size: 15px; font-weight: 600; }
.article-content { margin-top: $gap-md; font-size: 14px; color: var(--text-2); line-height: 1.7; }
.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); }
</style>

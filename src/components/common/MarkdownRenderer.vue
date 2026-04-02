<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{ content: string }>()

marked.setOptions({ breaks: true, gfm: true })

const html = computed(() => {
  if (!props.content) return ''
  const raw = marked.parse(props.content) as string
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','h4','h5','h6',
                   'code','pre','blockquote','a','img','table','thead','tbody','tr','th','td',
                   'del','hr','div','span'],
    ALLOWED_ATTR: ['href','src','alt','title','class','target','rel'],
  })
})
</script>

<template>
  <div class="md-body" v-html="html" />
</template>

<style scoped lang="scss">
.md-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-2);
  word-break: break-word;

  :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
    font-weight: 700;
    color: var(--text-1);
    margin: 1em 0 0.5em;
    line-height: 1.3;
  }
  :deep(h1) { font-size: 1.4em; }
  :deep(h2) { font-size: 1.2em; }
  :deep(h3) { font-size: 1.05em; }

  :deep(p) { margin: 0.6em 0; }

  :deep(a) {
    color: var(--brand-light);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  :deep(code) {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.88em;
    background: var(--bg-elevated);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--accent);
  }

  :deep(pre) {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px;
    overflow-x: auto;
    margin: 0.8em 0;
    code { background: none; padding: 0; color: var(--text-1); }
  }

  :deep(blockquote) {
    border-left: 3px solid var(--brand);
    margin: 0.8em 0;
    padding: 4px 12px;
    color: var(--text-3);
    background: rgba(var(--brand-rgb), 0.05);
    border-radius: 0 6px 6px 0;
  }

  :deep(ul), :deep(ol) {
    padding-left: 1.5em;
    margin: 0.6em 0;
  }
  :deep(li) { margin: 0.25em 0; }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8em 0;
    font-size: 13px;
  }
  :deep(th), :deep(td) {
    border: 1px solid var(--border);
    padding: 8px 12px;
    text-align: left;
  }
  :deep(th) {
    background: var(--bg-1);
    font-weight: 600;
    color: var(--text-1);
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 1em 0;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 6px;
  }
}
</style>

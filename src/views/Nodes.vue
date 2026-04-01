<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { serverApi } from '../api'

const servers = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res: any = await serverApi.list()
    servers.value = res.data || []
  } finally { loading.value = false }
})

const groups = computed(() => {
  const map = new Map<string, any[]>()
  for (const s of servers.value) {
    const group = s.group_id || '默认'
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push(s)
  }
  return map
})

function rateClass(rate: number) {
  if (rate <= 0.5) return 'low'
  if (rate <= 1) return 'medium'
  return 'high'
}
</script>

<template>
  <div class="nodes-page">
    <div class="page-header stagger-1">
      <h1>节点状态</h1>
      <div class="node-summary" v-if="servers.length">
        <span class="sum-item"><span class="sum-dot online"></span>{{ servers.filter(s => s.online).length }} 在线</span>
        <span class="sum-item"><span class="sum-dot offline"></span>{{ servers.filter(s => !s.online).length }} 离线</span>
      </div>
    </div>

    <div v-if="loading" class="loading-text">加载中...</div>

    <template v-else>
      <div v-for="([group, list], gi) in groups" :key="group" class="node-group">
        <h3 :class="['group-title', `stagger-${gi + 2}`]">{{ group }}</h3>
        <div class="node-grid">
          <div v-for="(node, ni) in list" :key="node.id"
            :class="['node-card', 'card', `stagger-${gi + ni + 3}`]"
            style="padding: 20px;">
            <div class="node-header">
              <div class="node-left">
                <div :class="['status-dot', { online: node.online }]"></div>
                <span class="node-name">{{ node.name }}</span>
              </div>
              <span :class="['node-rate', rateClass(node.rate)]">{{ node.rate }}x</span>
            </div>
            <div class="node-tags">
              <span class="or-tag info">{{ node.type || 'SS' }}</span>
              <span v-if="node.online" class="or-tag success">在线</span>
              <span v-else class="or-tag danger">离线</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!servers.length" class="empty-state">
        <p>暂无可用节点</p>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.page-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-lg;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
}
.node-summary { display: flex; gap: $gap-md; }
.sum-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-2); }
.sum-dot {
  width: 8px; height: 8px; border-radius: 50%;
  &.online { background: var(--accent); box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5); }
  &.offline { background: var(--danger); }
}
.loading-text { color: var(--text-3); }

.node-group { margin-bottom: $gap-xl; }
.group-title { font-size: 14px; font-weight: 600; color: var(--text-2); margin-bottom: $gap-md; text-transform: uppercase; letter-spacing: 0.5px; }

.node-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: $gap-md; }
.node-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-sm; }
.node-left { display: flex; align-items: center; gap: 8px; }
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); flex-shrink: 0;
  &.online { background: var(--accent); box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.5); animation: pulse-ring 2.5s infinite; }
}
.node-name { font-size: 14px; font-weight: 600; }
.node-rate {
  font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px;
  &.low { background: rgba(52,211,153,0.15); color: var(--success); }
  &.medium { background: rgba(251,191,36,0.15); color: var(--warning); }
  &.high { background: rgba(248,113,113,0.15); color: var(--danger); }
}
.node-tags { display: flex; gap: $gap-sm; }
.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); }
</style>

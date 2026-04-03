<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { serverApi } from '../api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()

const servers = ref<any[]>([])
const loading = ref(true)
const sortBy = ref<'default' | 'online' | 'name'>('default')

onMounted(async () => {
  try {
    const res: any = await serverApi.list()
    servers.value = res.data || []
  } catch (e: any) {
    toast.error(e?.message || '加载节点失败')
  } finally { loading.value = false }
})

// V2Board returns is_online (0/1) — normalise to boolean
function isOnline(node: any): boolean {
  return !!(node.is_online || node.online)
}

const groups = computed(() => {
  const map = new Map<string, any[]>()
  for (const s of servers.value) {
    const gid = s.group_id
    const group = gid ? `节点组 ${gid}` : '默认'
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push(s)
  }

  // Sort within each group
  if (sortBy.value !== 'default') {
    map.forEach((nodes, key) => {
      const sorted = [...nodes].sort((a, b) => {
        if (sortBy.value === 'online') {
          return Number(isOnline(b)) - Number(isOnline(a))
        }
        return a.name.localeCompare(b.name, 'zh')
      })
      map.set(key, sorted)
    })
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
      <div class="header-right">
        <div class="node-summary" v-if="servers.length">
          <span class="sum-item"><span class="sum-dot online"></span>{{ servers.filter(s => isOnline(s)).length }} 在线</span>
          <span class="sum-item"><span class="sum-dot offline"></span>{{ servers.filter(s => !isOnline(s)).length }} 离线</span>
        </div>
        <div class="sort-btns" v-if="servers.length">
          <button :class="['sort-btn', { active: sortBy === 'default' }]" @click="sortBy = 'default'">默认</button>
          <button :class="['sort-btn', { active: sortBy === 'online' }]" @click="sortBy = 'online'">在线优先</button>
          <button :class="['sort-btn', { active: sortBy === 'name' }]" @click="sortBy = 'name'">名称</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skel-header">
          <div class="skel-dot"></div>
          <div class="skel-line skel-name"></div>
          <div class="skel-badge"></div>
        </div>
        <div class="skel-tags">
          <div class="skel-tag"></div>
          <div class="skel-tag"></div>
        </div>
      </div>
    </div>

    <template v-else>
      <div v-for="([group, list], gi) in groups" :key="group" class="node-group">
        <h3 :class="['group-title', `stagger-${gi + 2}`]">{{ group }}</h3>
        <div class="node-grid">
          <div v-for="(node, ni) in list" :key="node.id"
            :class="['node-card', 'card', `stagger-${gi + ni + 3}`]"
            style="padding: 20px;">
            <div class="node-header">
              <div class="node-left">
                <div :class="['status-dot', { online: isOnline(node) }]"></div>
                <span class="node-name">{{ node.name }}</span>
              </div>
              <span :class="['node-rate', rateClass(node.rate)]">{{ node.rate }}x</span>
            </div>
            <div class="node-tags">
              <span class="or-tag info">{{ node.type || 'SS' }}</span>
              <span v-if="isOnline(node)" class="or-tag success">在线</span>
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
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: $gap-lg;
  flex-wrap: wrap; gap: $gap-md;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
}
.header-right {
  display: flex; align-items: center; gap: $gap-md; flex-wrap: wrap;
}
.node-summary { display: flex; gap: $gap-md; }
.sum-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-2); }
.sum-dot {
  width: 8px; height: 8px; border-radius: 50%;
  &.online { background: var(--accent); box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5); }
  &.offline { background: var(--danger); }
}

.sort-btns {
  display: flex; gap: 4px;
}
.sort-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-2);
  border: 1px solid var(--border);
  color: var(--text-3);
  transition: all 0.15s;
  &:hover { color: var(--text-2); border-color: var(--border-active); }
  &.active { background: rgba(var(--brand-rgb), 0.12); color: var(--brand-light); border-color: rgba(var(--brand-rgb), 0.3); }
}

// Skeleton
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: $gap-md;
  margin-bottom: $gap-xl;
}

.skeleton-card {
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: $card-radius;
}

.skel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: $gap-sm;
}

.skel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bg-elevated);
  flex-shrink: 0;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skel-line {
  height: 14px;
  border-radius: 6px;
  background: var(--bg-elevated);
  animation: shimmer 1.4s ease-in-out infinite;
}

.skel-name { width: 55%; }

.skel-badge {
  margin-left: auto;
  width: 32px;
  height: 20px;
  border-radius: 6px;
  background: var(--bg-elevated);
  animation: shimmer 1.4s ease-in-out infinite;
}

.skel-tags {
  display: flex;
  gap: $gap-sm;
  margin-top: $gap-sm;
}

.skel-tag {
  width: 44px;
  height: 20px;
  border-radius: 6px;
  background: var(--bg-elevated);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

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

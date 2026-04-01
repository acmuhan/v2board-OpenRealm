<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { inviteApi } from '../api'
import { useUserStore } from '../stores/user'
import SvgIcon from '../components/common/SvgIcon.vue'

const userStore = useUserStore()
const inviteData = ref<any>(null)
const loading = ref(true)
const copied = ref(false)

const inviteLink = computed(() => {
  const code = inviteData.value?.codes?.[0]?.code
  return code ? `${window.location.origin}/register?code=${code}` : ''
})

onMounted(async () => {
  try {
    const res: any = await inviteApi.fetch()
    inviteData.value = res.data
  } finally { loading.value = false }
})

async function generateCode() {
  await inviteApi.save()
  const res: any = await inviteApi.fetch()
  inviteData.value = res.data
}

function copyLink() {
  if (!inviteLink.value) return
  navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="invite-page">
    <h1 class="page-title">我的邀请</h1>

    <!-- Stats -->
    <div class="invite-stats">
      <div class="stat-card glass-card">
        <span class="stat-label">已注册用户</span>
        <span class="stat-value">{{ inviteData?.stat?.[0] || 0 }}</span>
      </div>
      <div class="stat-card glass-card">
        <span class="stat-label">有效佣金</span>
        <span class="stat-value">&yen;{{ ((inviteData?.stat?.[1] || 0) / 100).toFixed(2) }}</span>
      </div>
      <div class="stat-card glass-card">
        <span class="stat-label">确认中佣金</span>
        <span class="stat-value">&yen;{{ ((inviteData?.stat?.[2] || 0) / 100).toFixed(2) }}</span>
      </div>
    </div>

    <!-- Invite Link -->
    <div class="invite-link-card glass-card">
      <h3>邀请链接</h3>
      <div class="link-row">
        <input :value="inviteLink" readonly class="or-input" />
        <button class="btn-ghost" @click="copyLink">
          <SvgIcon name="copy" :size="16" />
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>
      <button v-if="!inviteLink" class="btn-primary" style="margin-top: 12px" @click="generateCode">
        生成邀请码
      </button>
    </div>

    <!-- Invite History -->
    <div v-if="inviteData?.codes?.length" class="codes-section glass-card">
      <h3>邀请码列表</h3>
      <div v-for="c in inviteData.codes" :key="c.id" class="code-item">
        <span class="code-text">{{ c.code }}</span>
        <span :class="['or-tag', c.status ? 'danger' : 'success']">
          {{ c.status ? '已使用' : '未使用' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-title { font-size: 22px; font-weight: 700; margin-bottom: $gap-lg; }
.invite-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: $gap-md; margin-bottom: $gap-lg; }
.stat-card { padding: $gap-lg; text-align: center; }
.stat-label { font-size: 13px; color: var(--text-2); display: block; margin-bottom: $gap-xs; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--brand-light); }
.invite-link-card { padding: $gap-lg; margin-bottom: $gap-lg; h3 { font-size: 15px; font-weight: 600; margin-bottom: $gap-md; } }
.link-row { display: flex; gap: $gap-sm; .or-input { flex: 1; font-family: monospace; font-size: 13px; } }
.codes-section { padding: $gap-lg; h3 { font-size: 15px; font-weight: 600; margin-bottom: $gap-md; } }
.code-item { display: flex; justify-content: space-between; align-items: center; padding: $gap-sm 0; border-bottom: 1px solid var(--border); &:last-child { border: none; } }
.code-text { font-family: monospace; font-size: 14px; }
</style>

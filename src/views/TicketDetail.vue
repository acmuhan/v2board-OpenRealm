<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ticketApi } from '../api'

const route = useRoute()
const ticket = ref<any>(null)
const messages = ref<any[]>([])
const reply = ref('')
const loading = ref(true)
const sending = ref(false)

onMounted(async () => {
  try {
    const res: any = await ticketApi.detail(Number(route.params.id))
    ticket.value = res.data?.ticket || res.data
    messages.value = res.data?.message || []
  } finally { loading.value = false }
})

async function sendReply() {
  if (!reply.value) return
  sending.value = true
  try {
    await ticketApi.reply({ id: Number(route.params.id), message: reply.value })
    reply.value = ''
    const res: any = await ticketApi.detail(Number(route.params.id))
    messages.value = res.data?.message || []
  } finally { sending.value = false }
}

async function closeTicket() {
  await ticketApi.close(Number(route.params.id))
  const res: any = await ticketApi.detail(Number(route.params.id))
  ticket.value = res.data?.ticket || res.data
}
</script>

<template>
  <div class="ticket-detail">
    <div v-if="loading" class="loading-text">加载中...</div>
    <template v-else-if="ticket">
      <div class="detail-header">
        <h1>{{ ticket.subject }}</h1>
        <button v-if="ticket.status !== 2" class="btn-ghost" @click="closeTicket" style="font-size:13px; padding:6px 16px">关闭工单</button>
      </div>

      <div class="msg-list">
        <div v-for="m in messages" :key="m.id" :class="['msg-item', 'glass-card', { admin: m.is_me === false }]">
          <div class="msg-header">
            <span class="msg-role">{{ m.is_me !== false ? '我' : '客服' }}</span>
            <span class="msg-time">{{ new Date(m.created_at * 1000).toLocaleString() }}</span>
          </div>
          <p class="msg-body">{{ m.message }}</p>
        </div>
      </div>

      <div v-if="ticket.status !== 2" class="reply-box glass-card">
        <textarea v-model="reply" class="or-input" rows="3" placeholder="输入回复内容..."></textarea>
        <button class="btn-primary" @click="sendReply" :disabled="sending" style="margin-top:8px">
          {{ sending ? '发送中...' : '发送回复' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.loading-text { color: var(--text-3); }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-lg; h1 { font-size: 20px; font-weight: 700; } }
.msg-list { display: flex; flex-direction: column; gap: $gap-md; margin-bottom: $gap-lg; }
.msg-item { padding: $gap-md; &.admin { border-left: 3px solid var(--brand); } }
.msg-header { display: flex; justify-content: space-between; margin-bottom: $gap-xs; }
.msg-role { font-size: 13px; font-weight: 600; }
.msg-time { font-size: 11px; color: var(--text-3); }
.msg-body { font-size: 14px; color: var(--text-2); line-height: 1.6; }
.reply-box { padding: $gap-lg; }
textarea.or-input { resize: vertical; min-height: 80px; }
</style>

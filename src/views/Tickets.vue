<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ticketApi } from '../api'

const router = useRouter()
const tickets = ref<any[]>([])
const loading = ref(true)
const showNew = ref(false)
const newSubject = ref('')
const newMessage = ref('')
const newLevel = ref(1)
const submitting = ref(false)

const levelMap: Record<number, string> = { 0: '低', 1: '中', 2: '高' }
const statusMap: Record<number, { text: string; cls: string }> = {
  0: { text: '已开启', cls: 'info' },
  1: { text: '已回复', cls: 'success' },
  2: { text: '已关闭', cls: 'danger' },
}

onMounted(async () => {
  try {
    const res: any = await ticketApi.list()
    tickets.value = res.data || []
  } finally { loading.value = false }
})

async function submitTicket() {
  if (!newSubject.value || !newMessage.value) return
  submitting.value = true
  try {
    await ticketApi.save({ subject: newSubject.value, level: newLevel.value, message: newMessage.value })
    showNew.value = false; newSubject.value = ''; newMessage.value = ''
    const res: any = await ticketApi.list()
    tickets.value = res.data || []
  } finally { submitting.value = false }
}
</script>

<template>
  <div class="tickets-page">
    <div class="page-header">
      <h1 class="page-title">服务工单</h1>
      <button class="btn-gradient" @click="showNew = !showNew">
        {{ showNew ? '取消' : '新建工单' }}
      </button>
    </div>

    <!-- New Ticket -->
    <transition name="fade-slide">
      <div v-if="showNew" class="new-ticket glass-card">
        <div class="form-group">
          <label>主题</label>
          <input v-model="newSubject" class="or-input" placeholder="工单主题" />
        </div>
        <div class="form-group">
          <label>优先级</label>
          <div class="level-btns">
            <button v-for="(label, lvl) in levelMap" :key="lvl"
              :class="['btn-ghost', { active: newLevel === Number(lvl) }]"
              @click="newLevel = Number(lvl)"
              style="padding: 6px 16px; font-size: 13px">{{ label }}</button>
          </div>
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea v-model="newMessage" class="or-input" rows="4" placeholder="描述您的问题..."></textarea>
        </div>
        <button class="btn-gradient" @click="submitTicket" :disabled="submitting">
          {{ submitting ? '提交中...' : '提交工单' }}
        </button>
      </div>
    </transition>

    <!-- Ticket List -->
    <div v-if="loading" class="loading-text">加载中...</div>
    <div v-else-if="tickets.length" class="ticket-list">
      <div v-for="t in tickets" :key="t.id" class="ticket-item glass-card" @click="router.push(`/tickets/${t.id}`)">
        <div class="ticket-top">
          <span class="ticket-subject">{{ t.subject }}</span>
          <span :class="['or-tag', statusMap[t.status]?.cls || 'info']">
            {{ statusMap[t.status]?.text || '未知' }}
          </span>
        </div>
        <span class="ticket-date">{{ new Date(t.created_at * 1000).toLocaleString() }}</span>
      </div>
    </div>
    <div v-else class="empty-state">暂无工单</div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-lg; }
.page-title { font-size: 22px; font-weight: 700; }
.loading-text { color: var(--text-3); }
.new-ticket { padding: $gap-lg; margin-bottom: $gap-lg; display: flex; flex-direction: column; gap: $gap-md; }
.form-group { display: flex; flex-direction: column; gap: 6px; label { font-size: 13px; color: var(--text-2); } }
.level-btns { display: flex; gap: $gap-sm; .active { border-color: var(--brand); background: rgba(var(--brand-rgb), 0.1); color: #fff; } }
textarea.or-input { resize: vertical; min-height: 100px; }
.ticket-list { display: flex; flex-direction: column; gap: $gap-md; }
.ticket-item { padding: $gap-lg; cursor: pointer; &:hover { transform: translateY(-1px); } }
.ticket-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-xs; }
.ticket-subject { font-size: 15px; font-weight: 600; }
.ticket-date { font-size: 12px; color: var(--text-3); }
.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); }
</style>

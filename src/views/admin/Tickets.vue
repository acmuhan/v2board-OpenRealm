<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminTicketApi } from '../../api/admin'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()

/* ── Types ── */
interface TicketMessage {
  id: number
  is_admin: boolean
  message: string
  created_at: number
}

interface Ticket {
  id: number
  subject: string
  user_email: string
  status: number      // 0=open, 1=replied, 2=closed
  priority: number    // 0=low, 1=med, 2=high
  messages: TicketMessage[]
  created_at: number
}

/* ── Maps ── */
const statusMap: Record<number, { text: string; cls: string }> = {
  0: { text: 'Open', cls: 'info' },
  1: { text: 'Replied', cls: 'success' },
  2: { text: 'Closed', cls: 'danger' },
}

const priorityMap: Record<number, { text: string; cls: string }> = {
  0: { text: 'Low', cls: 'low' },
  1: { text: 'Medium', cls: 'med' },
  2: { text: 'High', cls: 'high' },
}

/* ── State ── */
const activeTab = ref<number | null>(null)
const expandedId = ref<number | null>(null)
const replyText = ref('')
const replying = ref(false)

const tickets = ref<Ticket[]>([])
const loading = ref(true)

async function loadTickets() {
  loading.value = true
  try {
    const res: any = await adminTicketApi.fetch()
    tickets.value = res.data || []
  } catch (e: any) {
    tickets.value = []
    toast.error(e?.message || '加载工单失败')
  } finally { loading.value = false }
}

onMounted(() => loadTickets())

/* ── Computed ── */
const filteredTickets = computed(() => {
  if (activeTab.value === null) return tickets.value
  return tickets.value.filter(t => t.status === activeTab.value)
})

/* ── Actions ── */
function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
  replyText.value = ''
}

async function sendReply(ticket: Ticket) {
  if (!replyText.value.trim()) return
  replying.value = true
  try {
    await adminTicketApi.reply({ id: ticket.id, message: replyText.value })
    toast.success('回复已发送')
  } catch (e: any) {
    toast.error(e?.message || '回复失败')
  }
  replyText.value = ''
  replying.value = false
  await loadTickets()
}

async function closeTicket(ticket: Ticket) {
  try {
    await adminTicketApi.close({ id: ticket.id })
    toast.success('工单已关闭')
  } catch (e: any) {
    toast.error(e?.message || '操作失败')
  }
  await loadTickets()
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString()
}
</script>

<template>
  <div class="admin-tickets">
    <div class="page-header stagger-1">
      <h1 class="page-title">Tickets</h1>
      <span class="ticket-count">{{ filteredTickets.length }} tickets</span>
    </div>

    <!-- Status Filter Tabs -->
    <div class="filter-tabs stagger-2">
      <button
        :class="['tab-btn', { active: activeTab === null }]"
        @click="activeTab = null"
      >All</button>
      <button
        v-for="(s, key) in statusMap" :key="key"
        :class="['tab-btn', { active: activeTab === Number(key) }]"
        @click="activeTab = Number(key)"
      >{{ s.text }}</button>
    </div>

    <!-- Tickets Table -->
    <div class="table-wrap stagger-3">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>User</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="t in filteredTickets" :key="t.id">
            <tr
              :class="['ticket-row', { expanded: expandedId === t.id }]"
              @click="toggleExpand(t.id)"
            >
              <td class="col-id">#{{ t.id }}</td>
              <td class="col-subject">{{ t.subject }}</td>
              <td class="col-email">{{ t.user_email }}</td>
              <td>
                <span :class="['or-tag', statusMap[t.status]?.cls]">
                  {{ statusMap[t.status]?.text }}
                </span>
              </td>
              <td>
                <span :class="['priority-badge', priorityMap[t.priority]?.cls]">
                  {{ priorityMap[t.priority]?.text }}
                </span>
              </td>
              <td class="col-date">{{ formatDate(t.created_at) }}</td>
              <td class="col-actions" @click.stop>
                <button
                  v-if="t.status !== 2"
                  class="btn-ghost btn-sm"
                  @click="closeTicket(t)"
                >Close</button>
              </td>
            </tr>
            <!-- Expanded Thread -->
            <tr v-if="expandedId === t.id" class="thread-row">
              <td colspan="7">
                <div class="thread-panel">
                  <div class="messages-list">
                    <div
                      v-for="msg in t.messages" :key="msg.id"
                      :class="['msg-bubble', { admin: msg.is_admin }]"
                    >
                      <div class="msg-meta">
                        <span class="msg-sender">{{ msg.is_admin ? 'Admin' : t.user_email }}</span>
                        <span class="msg-time">{{ formatDate(msg.created_at) }}</span>
                      </div>
                      <p class="msg-body">{{ msg.message }}</p>
                    </div>
                  </div>
                  <div v-if="t.status !== 2" class="reply-area">
                    <textarea
                      v-model="replyText"
                      class="or-input reply-input"
                      rows="3"
                      placeholder="Type your reply..."
                    ></textarea>
                    <button
                      class="btn-gradient btn-sm"
                      :disabled="replying || !replyText.trim()"
                      @click="sendReply(t)"
                    >{{ replying ? 'Sending...' : 'Send Reply' }}</button>
                  </div>
                  <div v-else class="closed-notice">This ticket is closed.</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="!filteredTickets.length" class="empty-state">No tickets found.</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-tickets { max-width: 1200px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: $gap-lg;
}
.page-title { font-size: 24px; font-weight: 700; }
.ticket-count { font-size: 13px; color: var(--text-3); }

/* Filter Tabs */
.filter-tabs {
  display: flex; gap: $gap-sm; margin-bottom: $gap-lg;
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

/* Table */
.table-wrap {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: $card-radius; overflow: hidden;
}
.admin-table {
  width: 100%; border-collapse: collapse;
  th, td { padding: 14px 16px; text-align: left; font-size: 13px; }
  thead {
    background: var(--bg-1);
    th {
      font-weight: 600; color: var(--text-3); text-transform: uppercase;
      font-size: 11px; letter-spacing: 0.5px; border-bottom: 1px solid var(--border);
    }
  }
  tbody tr { border-bottom: 1px solid var(--border); }
}
.ticket-row {
  cursor: pointer; transition: background 0.15s;
  &:hover { background: var(--bg-card-hover); }
  &.expanded { background: rgba(var(--brand-rgb), 0.04); }
}
.col-id { font-family: 'JetBrains Mono', monospace; color: var(--text-3); font-size: 12px; }
.col-subject { font-weight: 600; color: var(--text-1); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-email { color: var(--text-2); font-size: 12px; }
.col-date { color: var(--text-3); font-size: 12px; white-space: nowrap; }
.col-actions { white-space: nowrap; }

/* Priority badge */
.priority-badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 600;
  &.low { background: rgba(var(--brand-rgb), 0.1); color: var(--brand); }
  &.med { background: rgba(234, 179, 8, 0.12); color: var(--warning); }
  &.high { background: rgba(239, 68, 68, 0.12); color: var(--danger); }
}

/* Thread Panel */
.thread-row td { padding: 0 !important; }
.thread-panel {
  padding: $gap-lg; background: var(--bg-1);
  border-top: 1px solid var(--border);
}
.messages-list { display: flex; flex-direction: column; gap: $gap-md; margin-bottom: $gap-lg; max-height: 400px; overflow-y: auto; }
.msg-bubble {
  padding: $gap-md; border-radius: $card-radius-sm;
  background: var(--bg-2); border: 1px solid var(--border);
  max-width: 80%;
  &.admin {
    margin-left: auto;
    background: rgba(var(--brand-rgb), 0.08);
    border-color: rgba(var(--brand-rgb), 0.2);
  }
}
.msg-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: $gap-xs; }
.msg-sender { font-size: 12px; font-weight: 600; color: var(--text-2); }
.msg-time { font-size: 11px; color: var(--text-3); }
.msg-body { font-size: 13px; color: var(--text-1); line-height: 1.6; margin: 0; }

/* Reply */
.reply-area { display: flex; gap: $gap-sm; align-items: flex-end; }
.reply-input { flex: 1; resize: vertical; min-height: 70px; }
.closed-notice { font-size: 13px; color: var(--text-3); text-align: center; padding: $gap-md; }

/* Buttons */
.btn-sm { padding: 6px 14px; font-size: 12px; }

.empty-state { text-align: center; padding: $gap-xl; color: var(--text-3); font-size: 14px; }

@media (max-width: $bp-tablet) {
  .admin-table { display: block; overflow-x: auto; }
}
</style>

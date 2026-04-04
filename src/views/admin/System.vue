<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { adminSystemApi } from '../../api/admin'

interface SystemStatus {
  schedule_check: boolean   // mapped from API 'schedule'
  horizon_check: boolean    // mapped from API 'horizon'
  last_check_at: number     // mapped from API 'schedule_last_runtime'
}
interface QueueStats {
  failedJobs: number
  jobsPerMinute: number | string
  paused: boolean
  processes: number
  status: string
  recentlyFailed?: number
}

const systemStatus  = ref<SystemStatus | null>(null)
const queueStats    = ref<QueueStats | null>(null)
const workload      = ref<any[]>([])
const logs          = ref<any[]>([])
const logTotal      = ref(0)
const logPage       = ref(1)
const logLevel      = ref('all')
const loadingStatus = ref(true)
const loadingLogs   = ref(true)
const lastRefreshed = ref('')
let refreshTimer: ReturnType<typeof setInterval> | null = null

async function loadStatus() {
  try {
    const [s, q, w] = await Promise.all([
      adminSystemApi.getSystemStatus()  as any,
      adminSystemApi.getQueueStats()    as any,
      adminSystemApi.getQueueWorkload() as any,
    ])
    // Map API field names → component field names
    const raw = s?.data
    systemStatus.value = raw ? {
      schedule_check: raw.schedule ?? raw.schedule_check ?? false,
      horizon_check:  raw.horizon  ?? raw.horizon_check  ?? false,
      last_check_at:  raw.schedule_last_runtime ?? raw.last_check_at ?? 0,
    } : null
    queueStats.value   = q?.data ?? null
    const rawWork = w?.data
    if (Array.isArray(rawWork)) workload.value = rawWork
    else if (rawWork && typeof rawWork === 'object') workload.value = Object.values(rawWork)
    else workload.value = []
    lastRefreshed.value = new Date().toLocaleTimeString('zh-CN')
  } catch { /* Horizon may not be installed */ }
  loadingStatus.value = false
}

async function loadLogs() {
  loadingLogs.value = true
  try {
    const params: Record<string, unknown> = { page: logPage.value }
    if (logLevel.value !== 'all') params.level = logLevel.value
    const res: any = await adminSystemApi.getSystemLog(params)
    logs.value     = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
    logTotal.value = res?.data?.total || 0
  } catch { logs.value = [] }
  loadingLogs.value = false
}

function fmt(ts: number | undefined) {
  if (!ts) return '--'
  return new Date(ts * 1000).toLocaleString('zh-CN')
}
function jpm(val: number | string | undefined) {
  const n = parseFloat(String(val ?? ''))
  return isNaN(n) ? '--' : n.toFixed(1)
}

const LOG_LEVELS = ['all', 'error', 'warning', 'info', 'debug']
const LOG_COLOR: Record<string, string> = {
  error:   'var(--danger)',
  warning: 'var(--warning)',
  info:    'var(--brand-light)',
  debug:   'var(--text-3)',
}
const totalPages = computed(() => Math.max(1, Math.ceil(logTotal.value / 15)))

function changePage(p: number) {
  if (p < 1 || p > totalPages.value) return
  logPage.value = p
}

watch([logPage, logLevel], loadLogs)

onMounted(() => {
  loadStatus()
  loadLogs()
  refreshTimer = setInterval(loadStatus, 30000)
})
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<template>
  <div class="system-page">
    <div class="page-header stagger-1">
      <div>
        <h1 class="page-title">系统状态</h1>
        <span v-if="lastRefreshed" class="refresh-hint">上次刷新 {{ lastRefreshed }} · 每 30s 自动更新</span>
      </div>
      <button class="btn-ghost btn-sm" @click="loadStatus">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        刷新
      </button>
    </div>

    <!-- Status Cards -->
    <div class="status-grid stagger-2">
      <div class="stat-card card">
        <div class="stat-top">
          <span class="stat-label">定时任务</span>
          <span :class="['status-dot', loadingStatus ? 'loading' : systemStatus?.schedule_check ? 'ok' : 'err']"></span>
        </div>
        <div :class="['stat-value', !loadingStatus && (systemStatus?.schedule_check ? 'text-ok' : 'text-err')]">
          {{ loadingStatus ? '…' : systemStatus?.schedule_check ? '正常' : '异常' }}
        </div>
        <div class="stat-sub">上次检测 {{ loadingStatus ? '--' : fmt(systemStatus?.last_check_at) }}</div>
      </div>

      <div class="stat-card card">
        <div class="stat-top">
          <span class="stat-label">队列服务 (Horizon)</span>
          <span :class="['status-dot', loadingStatus ? 'loading' : systemStatus?.horizon_check ? 'ok' : 'err']"></span>
        </div>
        <div :class="['stat-value', !loadingStatus && (systemStatus?.horizon_check ? 'text-ok' : 'text-err')]">
          {{ loadingStatus ? '…' : systemStatus?.horizon_check ? '运行中' : '已停止' }}
        </div>
        <div class="stat-sub">
          <span v-if="queueStats" :class="['horizon-badge', queueStats.paused ? 'paused' : 'running']">
            {{ queueStats.paused ? '已暂停' : (queueStats.status || 'running') }}
          </span>
          <span v-else>--</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-top">
          <span class="stat-label">处理速率</span>
        </div>
        <div class="stat-value">
          {{ jpm(queueStats?.jobsPerMinute) }}<span class="stat-unit"> /min</span>
        </div>
        <div class="stat-sub">工作进程 {{ queueStats?.processes ?? '--' }} 个</div>
      </div>

      <div class="stat-card card" :class="{ 'card-warn': (queueStats?.failedJobs ?? 0) > 0 }">
        <div class="stat-top">
          <span class="stat-label">失败任务</span>
          <span v-if="(queueStats?.failedJobs ?? 0) > 0" class="warn-badge">需处理</span>
        </div>
        <div class="stat-value" :class="{ 'text-err': (queueStats?.failedJobs ?? 0) > 0 }">
          {{ queueStats?.failedJobs ?? '--' }}
        </div>
        <div class="stat-sub">近期失败 {{ queueStats?.recentlyFailed ?? '--' }} 条</div>
      </div>
    </div>

    <!-- Queue Workload -->
    <div v-if="workload.length" class="section stagger-3">
      <h2 class="section-heading">队列负载</h2>
      <div class="card table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>队列名称</th><th>进程数</th><th>等待任务</th><th>吞吐量 (/min)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(wl, i) in workload" :key="i">
              <td class="mono">{{ wl.name || wl.queue || '--' }}</td>
              <td>{{ wl.processes ?? '--' }}</td>
              <td>{{ wl.wait ?? '--' }}</td>
              <td>{{ jpm(wl.throughput) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- System Log -->
    <div class="section stagger-4">
      <div class="log-header">
        <h2 class="section-heading" style="margin:0">系统日志</h2>
        <div class="log-tabs">
          <button
            v-for="lv in LOG_LEVELS" :key="lv"
            :class="['log-tab', { active: logLevel === lv }]"
            @click="logLevel = lv; logPage = 1"
          >{{ lv === 'all' ? '全部' : lv }}</button>
        </div>
      </div>

      <div class="card log-card">
        <div v-if="loadingLogs" class="log-loading">
          <div v-for="n in 5" :key="n" class="skel-row">
            <span class="skel-chip"></span>
            <span class="skel-line" :style="{ width: (40 + n * 10) + '%' }"></span>
          </div>
        </div>
        <template v-else>
          <div v-if="!logs.length" class="log-empty">暂无日志记录</div>
          <div v-for="(entry, i) in logs" :key="i" class="log-entry">
            <span class="log-level" :style="{ color: LOG_COLOR[entry.level] || 'var(--text-3)' }">
              {{ entry.level || 'info' }}
            </span>
            <span class="log-time">{{ entry.datetime || entry.created_at || '' }}</span>
            <span class="log-msg">{{ entry.message || entry.text || JSON.stringify(entry) }}</span>
          </div>
          <div v-if="totalPages > 1" class="log-pagination">
            <button class="btn-ghost btn-sm" :disabled="logPage <= 1" @click="changePage(logPage - 1)">上一页</button>
            <span class="page-info">{{ logPage }} / {{ totalPages }}</span>
            <button class="btn-ghost btn-sm" :disabled="logPage >= totalPages" @click="changePage(logPage + 1)">下一页</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.system-page { max-width: 960px; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: $gap-lg;
}
.page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
.refresh-hint { font-size: 11px; color: var(--text-3); margin-top: 3px; display: block; }

.status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $gap-md;
  margin-bottom: $gap-xl;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.stat-card {
  padding: 18px 20px;
  &.card-warn { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }
}
.stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.stat-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.6px; }

.stat-value {
  font-size: 26px; font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 4px;
}
.stat-unit { font-size: 13px; font-weight: 500; color: var(--text-3); letter-spacing: 0; }
.stat-sub  { font-size: 11px; color: var(--text-3); }

.text-ok  { color: var(--success); }
.text-err { color: var(--danger); }

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  &.ok      { background: var(--success); box-shadow: 0 0 5px rgba(16,185,129,0.5); animation: breathe 3.5s ease-in-out infinite; }
  &.err     { background: var(--danger);  box-shadow: 0 0 5px rgba(239,68,68,0.5); }
  &.loading { background: var(--text-3);  animation: breathe 1.2s ease-in-out infinite; }
}

.horizon-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  padding: 2px 7px; border-radius: 4px;
  &.running { background: rgba(16,185,129,0.12); color: var(--success); }
  &.paused  { background: rgba(245,158,11,0.12); color: var(--warning); }
}
.warn-badge {
  font-size: 9px; font-weight: 700; letter-spacing: 0.4px;
  background: rgba(239,68,68,0.12); color: var(--danger);
  padding: 2px 6px; border-radius: 4px;
}

.section { margin-bottom: $gap-xl; }
.section-heading {
  font-size: 13px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: $gap-md;
}

.data-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
  th { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
  td { color: var(--text-2); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: var(--bg-hover); }
}
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

.log-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: $gap-sm; margin-bottom: $gap-md;
}
.log-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.log-tab {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  padding: 4px 10px; border-radius: 6px;
  background: transparent; color: var(--text-3); border: 1px solid var(--border);
  transition: all 0.15s;
  &:hover { color: var(--text-1); border-color: rgba(var(--brand-rgb), 0.25); }
  &.active { background: rgba(var(--brand-rgb), 0.10); color: var(--brand-light); border-color: rgba(var(--brand-rgb), 0.3); }
}

.log-card { padding: 0; overflow: hidden; }

.log-loading {
  display: flex; flex-direction: column; gap: 8px; padding: 16px;
}
.skel-row { display: flex; align-items: center; gap: 10px; }
.skel-chip {
  width: 42px; height: 14px; border-radius: 3px;
  background: var(--bg-elevated); animation: shimmer 1.2s ease-in-out infinite; flex-shrink: 0;
}
.skel-line {
  height: 12px; border-radius: 4px;
  background: var(--bg-elevated); animation: shimmer 1.2s ease-in-out infinite;
}

.log-empty { padding: 32px 16px; text-align: center; font-size: 13px; color: var(--text-3); }

.log-entry {
  display: grid;
  grid-template-columns: 52px 158px 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  &:last-of-type { border-bottom: none; }
  &:hover { background: var(--bg-hover); }
  @media (max-width: 600px) {
    grid-template-columns: 52px 1fr;
    .log-time { display: none; }
  }
}
.log-level { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; padding-top: 2px; }
.log-time  { color: var(--text-3); font-family: 'JetBrains Mono', monospace; white-space: nowrap; font-size: 11px; }
.log-msg   { color: var(--text-2); word-break: break-word; line-height: 1.6; }

.log-pagination {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 16px; border-top: 1px solid var(--border);
}
.page-info { font-size: 12px; color: var(--text-3); }
.btn-sm    { padding: 6px 12px; font-size: 12px; }
</style>

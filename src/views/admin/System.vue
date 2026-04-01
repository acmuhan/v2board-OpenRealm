<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { adminSystemApi } from '../../api/admin'

// System status
const systemStatus = ref({
  schedule: 'running' as 'running' | 'stopped',
  queue: 'active' as 'active' | 'inactive',
  last_check: '2026-04-01 09:32:15',
  php_version: '8.2.14',
  laravel_version: '10.40.0',
  os: 'Linux 5.15.0-91-generic',
  uptime: '23d 14h 32m',
})

// Queue stats
const queueStats = ref({
  jobs_per_minute: 42,
  failed_jobs: 3,
  active_processes: 8,
  max_wait_time: 1.2,
  total_processed: 184203,
  success_rate: 99.7,
})

// Queue workload
const queueWorkload = ref([
  { name: 'default', processes: 4, jobs: 156, size: 12 },
  { name: 'high', processes: 2, jobs: 89, size: 3 },
  { name: 'low', processes: 1, jobs: 234, size: 45 },
  { name: 'emails', processes: 1, jobs: 67, size: 8 },
])

// System logs
type LogLevel = 'debug' | 'info' | 'warning' | 'error'

interface LogEntry {
  id: number
  time: string
  level: LogLevel
  message: string
}

const mockLogs: LogEntry[] = [
  { id: 1, time: '09:32:15', level: 'info', message: '[Scheduler] Running scheduled tasks...' },
  { id: 2, time: '09:32:15', level: 'info', message: '[Queue] Processing job #184203: SendEmailNotification' },
  { id: 3, time: '09:32:14', level: 'debug', message: '[Cache] Hit rate: 94.2% | Memory: 128MB / 256MB' },
  { id: 4, time: '09:32:12', level: 'warning', message: '[Queue] Job #184198 exceeded timeout (30s), retrying...' },
  { id: 5, time: '09:32:10', level: 'info', message: '[User] User #4521 logged in from 203.0.113.42' },
  { id: 6, time: '09:32:08', level: 'info', message: '[Payment] Order #OR20260401-0023 payment confirmed via Stripe' },
  { id: 7, time: '09:32:05', level: 'error', message: '[Queue] Job #184195 failed: Connection timed out (SQLSTATE[HY000] [2002])' },
  { id: 8, time: '09:32:03', level: 'info', message: '[Server] Node sync completed: 12 nodes updated' },
  { id: 9, time: '09:32:01', level: 'debug', message: '[API] GET /api/v1/user/info - 200 (23ms)' },
  { id: 10, time: '09:31:58', level: 'info', message: '[Subscribe] Generated subscription for user #3892' },
  { id: 11, time: '09:31:55', level: 'warning', message: '[Server] Node "Tokyo-01" high latency detected: 342ms' },
  { id: 12, time: '09:31:52', level: 'info', message: '[Queue] Processing job #184192: SyncNodeTraffic' },
  { id: 13, time: '09:31:50', level: 'debug', message: '[Route] Matched route: api/v1/client/subscribe' },
  { id: 14, time: '09:31:48', level: 'error', message: '[Email] Failed to send email to user@example.com: SMTP connection refused' },
  { id: 15, time: '09:31:45', level: 'info', message: '[Ticket] New ticket #892 created by user #2103' },
  { id: 16, time: '09:31:42', level: 'info', message: '[Plan] User #5012 upgraded from Basic to Premium' },
  { id: 17, time: '09:31:40', level: 'debug', message: '[Cache] Cleared expired keys: 23 removed' },
  { id: 18, time: '09:31:38', level: 'warning', message: '[System] Disk usage at 78% on /dev/sda1' },
  { id: 19, time: '09:31:35', level: 'info', message: '[Cron] Daily traffic reset completed for 1,203 users' },
  { id: 20, time: '09:31:30', level: 'info', message: '[Server] Health check passed: all 12 nodes online' },
]

const logs = ref<LogEntry[]>([...mockLogs])
const logFilter = ref<LogLevel | 'all'>('all')
const autoScroll = ref(true)
const logViewerRef = ref<HTMLElement | null>(null)
const refreshing = ref(false)
const refreshingLogs = ref(false)

const filteredLogs = ref<LogEntry[]>([])

function updateFilteredLogs() {
  if (logFilter.value === 'all') {
    filteredLogs.value = logs.value
  } else {
    filteredLogs.value = logs.value.filter((l) => l.level === logFilter.value)
  }
}

// Initialize
updateFilteredLogs()

function onFilterChange(level: LogLevel | 'all') {
  logFilter.value = level
  updateFilteredLogs()
}

function scrollToBottom() {
  if (autoScroll.value && logViewerRef.value) {
    nextTick(() => {
      logViewerRef.value!.scrollTop = logViewerRef.value!.scrollHeight
    })
  }
}

async function refreshStatus() {
  refreshing.value = true
  try {
    // const [statusRes, statsRes, workloadRes] = await Promise.all([
    //   adminSystemApi.getSystemStatus(),
    //   adminSystemApi.getQueueStats(),
    //   adminSystemApi.getQueueWorkload(),
    // ])
    await new Promise((r) => setTimeout(r, 800))
    systemStatus.value.last_check = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    // Simulate slight changes
    queueStats.value.jobs_per_minute = 38 + Math.floor(Math.random() * 10)
    queueStats.value.active_processes = 6 + Math.floor(Math.random() * 4)
  } finally {
    refreshing.value = false
  }
}

async function refreshLogs() {
  refreshingLogs.value = true
  try {
    // const res = await adminSystemApi.getSystemLog({ level: logFilter.value })
    await new Promise((r) => setTimeout(r, 500))
    // Add a new mock log entry
    const newId = logs.value.length + 1
    const levels: LogLevel[] = ['info', 'debug', 'warning', 'info']
    const messages = [
      '[System] Heartbeat OK',
      '[Queue] Job completed successfully',
      '[API] Request processed in 12ms',
      '[Server] Connectivity check passed',
    ]
    const idx = Math.floor(Math.random() * levels.length)
    const now = new Date()
    logs.value.unshift({
      id: newId,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      level: levels[idx],
      message: messages[idx],
    })
    updateFilteredLogs()
  } finally {
    refreshingLogs.value = false
  }
}

// Auto-refresh interval
let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

function levelClass(level: LogLevel): string {
  const map: Record<LogLevel, string> = {
    debug: 'debug',
    info: 'info',
    warning: 'warning',
    error: 'error',
  }
  return map[level] || 'info'
}

const statCards = [
  { key: 'jobs_per_minute', label: '处理速率', suffix: '/min', icon: '&#9889;' },
  { key: 'failed_jobs', label: '失败任务', suffix: '', icon: '&#10060;' },
  { key: 'active_processes', label: '活跃进程', suffix: '', icon: '&#9881;' },
  { key: 'max_wait_time', label: '最大等待', suffix: 's', icon: '&#9200;' },
]
</script>

<template>
  <div class="system-page">
    <div class="page-header stagger-1">
      <div>
        <h1>系统状态</h1>
        <p class="page-desc">监控系统运行状态、队列任务与系统日志</p>
      </div>
      <button class="btn-ghost" :disabled="refreshing" @click="refreshStatus">
        <span :class="['refresh-icon', { spinning: refreshing }]">&#8635;</span>
        {{ refreshing ? '刷新中...' : '刷新状态' }}
      </button>
    </div>

    <!-- System Status -->
    <div class="status-section stagger-2">
      <div class="status-grid">
        <div class="status-card card-accent">
          <div class="sc-header">
            <span class="sc-label">定时任务</span>
            <span :class="['status-dot', systemStatus.schedule]"></span>
          </div>
          <div class="sc-value">
            <span :class="['or-tag', systemStatus.schedule === 'running' ? 'success' : 'danger']">
              {{ systemStatus.schedule === 'running' ? 'RUNNING' : 'STOPPED' }}
            </span>
          </div>
          <span class="sc-meta">最后检查: {{ systemStatus.last_check }}</span>
        </div>

        <div class="status-card card-accent">
          <div class="sc-header">
            <span class="sc-label">队列状态</span>
            <span :class="['status-dot', systemStatus.queue === 'active' ? 'running' : 'stopped']"></span>
          </div>
          <div class="sc-value">
            <span :class="['or-tag', systemStatus.queue === 'active' ? 'success' : 'warning']">
              {{ systemStatus.queue === 'active' ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>
          <span class="sc-meta">进程数: {{ queueStats.active_processes }}</span>
        </div>

        <div class="status-card card-accent">
          <div class="sc-header">
            <span class="sc-label">系统信息</span>
          </div>
          <div class="sc-info-list">
            <div class="sc-info-row">
              <span>PHP</span>
              <span class="mono">{{ systemStatus.php_version }}</span>
            </div>
            <div class="sc-info-row">
              <span>Laravel</span>
              <span class="mono">{{ systemStatus.laravel_version }}</span>
            </div>
            <div class="sc-info-row">
              <span>运行时间</span>
              <span class="mono">{{ systemStatus.uptime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Queue Stats -->
    <div class="queue-section stagger-3">
      <h2 class="section-heading">队列统计</h2>
      <div class="stat-grid">
        <div
          v-for="(s, idx) in statCards"
          :key="s.key"
          :class="['stat-card', 'card-glow', `stagger-${idx + 4}`]"
        >
          <div class="stat-icon" v-html="s.icon"></div>
          <div class="stat-body">
            <span class="stat-value">
              {{ (queueStats as any)[s.key] }}{{ s.suffix }}
            </span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <div class="extra-stats">
        <div class="extra-stat">
          <span class="extra-label">总处理量</span>
          <span class="extra-value">{{ queueStats.total_processed.toLocaleString() }}</span>
        </div>
        <div class="extra-divider"></div>
        <div class="extra-stat">
          <span class="extra-label">成功率</span>
          <span class="extra-value success">{{ queueStats.success_rate }}%</span>
        </div>
      </div>
    </div>

    <!-- Queue Workload -->
    <div class="workload-section stagger-5">
      <div class="section-header">
        <h2 class="section-heading">队列工作负载</h2>
      </div>
      <div class="workload-table card">
        <div class="wt-header">
          <span class="wt-col name">队列名称</span>
          <span class="wt-col">进程数</span>
          <span class="wt-col">已处理</span>
          <span class="wt-col">排队中</span>
          <span class="wt-col bar-col">负载</span>
        </div>
        <div
          v-for="(q, idx) in queueWorkload"
          :key="q.name"
          :class="['wt-row', `stagger-${idx + 6}`]"
        >
          <span class="wt-col name">
            <span class="queue-dot" :style="{ background: idx === 0 ? 'var(--brand)' : idx === 1 ? 'var(--accent)' : idx === 2 ? 'var(--warning)' : 'var(--text-3)' }"></span>
            {{ q.name }}
          </span>
          <span class="wt-col mono">{{ q.processes }}</span>
          <span class="wt-col mono">{{ q.jobs }}</span>
          <span class="wt-col">
            <span :class="['or-tag', q.size > 20 ? 'warning' : 'success']">{{ q.size }}</span>
          </span>
          <span class="wt-col bar-col">
            <div class="load-bar-track">
              <div
                class="load-bar-fill"
                :style="{ width: Math.min((q.size / 50) * 100, 100) + '%' }"
              ></div>
            </div>
          </span>
        </div>
      </div>
    </div>

    <!-- System Logs -->
    <div class="log-section stagger-7">
      <div class="section-header">
        <h2 class="section-heading">系统日志</h2>
        <div class="log-controls">
          <div class="filter-group">
            <button
              v-for="f in (['all', 'debug', 'info', 'warning', 'error'] as const)"
              :key="f"
              :class="['filter-btn', { active: logFilter === f }, f]"
              @click="onFilterChange(f)"
            >
              {{ f === 'all' ? '全部' : f }}
            </button>
          </div>
          <label class="auto-scroll-toggle">
            <input type="checkbox" v-model="autoScroll" />
            <span>自动滚动</span>
          </label>
          <button class="btn-ghost btn-sm" :disabled="refreshingLogs" @click="refreshLogs">
            <span :class="['refresh-icon', { spinning: refreshingLogs }]">&#8635;</span>
            刷新
          </button>
        </div>
      </div>

      <div ref="logViewerRef" class="log-viewer card">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          :class="['log-entry', log.level]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span :class="['log-level', log.level]">{{ log.level.toUpperCase().padEnd(7) }}</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
        <div v-if="!filteredLogs.length" class="log-empty">
          暂无日志记录
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.system-page { max-width: 1100px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: $gap-lg;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .page-desc { font-size: 13px; color: var(--text-3); margin-top: 4px; }
}

.refresh-icon {
  display: inline-block;
  font-size: 16px;
  transition: transform 0.3s;
  &.spinning { animation: spin 0.8s linear infinite; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.section-heading {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: $gap-md;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $gap-sm;
}

// Status section
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $gap-md;
  margin-bottom: $gap-xl;
}

.status-card {
  padding: $gap-lg;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
}

.sc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sc-label {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;

  &.running {
    background: var(--success);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    &::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1.5px solid rgba(16, 185, 129, 0.3);
      animation: pulse-ring 2s ease-out infinite;
    }
  }

  &.stopped {
    background: var(--danger);
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
  }
}

.sc-value {
  margin: $gap-xs 0;
}

.sc-meta {
  font-size: 11px;
  color: var(--text-3);
}

.sc-info-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: $gap-xs;
}

.sc-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-2);
}

.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

// Queue stats
.queue-section { margin-bottom: $gap-xl; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $gap-md;
  margin-bottom: $gap-md;
}

.stat-card {
  padding: $gap-lg;
  display: flex;
  align-items: center;
  gap: $gap-md;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: $card-radius-sm;
  background: rgba(var(--brand-rgb), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: -0.5px;
  animation: countUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.stat-label {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 500;
}

.extra-stats {
  display: flex;
  align-items: center;
  gap: $gap-lg;
  padding: $gap-md $gap-lg;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
}

.extra-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.extra-label {
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.extra-value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  &.success { color: var(--success); }
}

.extra-divider {
  width: 1px;
  height: 36px;
  background: var(--border);
}

// Queue workload
.workload-section { margin-bottom: $gap-xl; }

.workload-table {
  padding: 0;
  overflow: hidden;
}

.wt-header {
  display: flex;
  padding: 12px $gap-lg;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wt-row {
  display: flex;
  padding: 14px $gap-lg;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  align-items: center;
  transition: background 0.15s;

  &:last-child { border-bottom: none; }
  &:hover { background: var(--bg-card-hover); }
}

.wt-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: $gap-sm;

  &.name {
    flex: 1.5;
    font-weight: 600;
  }

  &.bar-col { flex: 2; }
}

.queue-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.load-bar-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 3px;
  overflow: hidden;
}

.load-bar-fill {
  height: 100%;
  background: var(--grad-brand);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

// System logs
.log-section { margin-bottom: $gap-xl; }

.log-controls {
  display: flex;
  align-items: center;
  gap: $gap-md;
}

.filter-group {
  display: flex;
  gap: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
  padding: 3px;
}

.filter-btn {
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  background: transparent;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  transition: all 0.15s;

  &:hover { color: var(--text-2); background: var(--bg-elevated); }

  &.active {
    color: #fff;

    &.all { background: var(--brand); }
    &.debug { background: var(--text-3); }
    &.info { background: var(--brand); }
    &.warning { background: var(--warning); }
    &.error { background: var(--danger); }
  }
}

.auto-scroll-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
  cursor: pointer;
  user-select: none;

  input {
    accent-color: var(--brand);
    width: 14px;
    height: 14px;
  }
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.log-viewer {
  margin-top: $gap-sm;
  max-height: 420px;
  overflow-y: auto;
  padding: $gap-sm;
  background: var(--bg-0);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.7;
}

.log-entry {
  display: flex;
  gap: $gap-sm;
  padding: 3px $gap-sm;
  border-radius: 4px;
  transition: background 0.1s;
  white-space: nowrap;

  &:hover { background: rgba(255, 255, 255, 0.02); }

  &.warning { .log-msg { color: var(--warning); } }
  &.error { .log-msg { color: var(--danger); } }
}

.log-time {
  color: var(--text-3);
  flex-shrink: 0;
  min-width: 65px;
}

.log-level {
  flex-shrink: 0;
  min-width: 60px;
  font-weight: 600;
  text-transform: uppercase;

  &.debug { color: var(--text-3); }
  &.info { color: var(--brand-light); }
  &.warning { color: var(--warning); }
  &.error { color: var(--danger); }
}

.log-msg {
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-empty {
  padding: 40px;
  text-align: center;
  color: var(--text-3);
  font-family: 'DM Sans', sans-serif;
}

@media (max-width: $bp-desktop) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: $bp-tablet) {
  .status-grid { grid-template-columns: 1fr; }
  .log-controls { flex-wrap: wrap; }
}

@media (max-width: $bp-mobile) {
  .stat-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: $gap-md; }
  .filter-group { flex-wrap: wrap; }
  .wt-header, .wt-row { font-size: 11px; padding: 10px $gap-md; }
  .wt-col.bar-col { display: none; }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminServerApi } from '../../api/admin'

// ── Types ──────────────────────────────────────
interface ServerNode {
  id: number
  name: string
  type: string
  host: string
  port: number
  server_port: number
  rate: number
  show: boolean
  sort: number
  online: boolean
  online_count: number
  group_id: number
  group_name: string
  tags: string[]
  // Protocol-specific
  cipher?: string
  network?: string
  security?: string
  flow?: string
  server_name?: string
  allow_insecure?: boolean
  up_mbps?: number
  down_mbps?: number
  congestion_control?: string
  password?: string
}

interface ServerGroup {
  id: number
  name: string
}

type Protocol = 'shadowsocks' | 'vmess' | 'vless' | 'trojan' | 'hysteria' | 'tuic' | 'anytls'

// ── State ──────────────────────────────────────
const loading = ref(true)
const servers = ref<ServerNode[]>([])
const groups = ref<ServerGroup[]>([])
const searchQuery = ref('')
const showProtocolMenu = ref(false)
const showEditModal = ref(false)
const editingNode = ref<Partial<ServerNode> | null>(null)
const isNew = ref(false)
const activeTab = ref('basic')
const confirmDeleteId = ref<number | null>(null)

const protocols: { value: Protocol; label: string; color: string }[] = [
  { value: 'shadowsocks', label: 'Shadowsocks', color: 'info' },
  { value: 'vmess', label: 'VMess', color: 'success' },
  { value: 'vless', label: 'VLESS', color: 'warning' },
  { value: 'trojan', label: 'Trojan', color: 'danger' },
  { value: 'hysteria', label: 'Hysteria', color: 'info' },
  { value: 'tuic', label: 'TUIC', color: 'success' },
  { value: 'anytls', label: 'AnyTLS', color: 'warning' },
]

const protocolTagClass: Record<string, string> = {
  shadowsocks: 'info',
  vmess: 'success',
  vless: 'warning',
  trojan: 'danger',
  hysteria: 'info',
  tuic: 'success',
  anytls: 'warning',
}

// ── Error State ────────────────────────────────
const loadError = ref('')

// ── Computed ───────────────────────────────────
const filteredServers = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return servers.value
  return servers.value.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.host.toLowerCase().includes(q) ||
    s.type.toLowerCase().includes(q) ||
    s.group_name.toLowerCase().includes(q)
  )
})

const onlineCount = computed(() => servers.value.filter(s => s.online).length)
const offlineCount = computed(() => servers.value.filter(s => !s.online).length)

// ── Lifecycle ──────────────────────────────────
async function loadNodes() {
  loading.value = true
  loadError.value = ''
  try {
    const [nodeRes, groupRes] = await Promise.allSettled([
      adminServerApi.getNodes(),
      adminServerApi.groupFetch(),
    ])
    servers.value = nodeRes.status === 'fulfilled' && (nodeRes.value as any)?.data
      ? (nodeRes.value as any).data
      : []
    groups.value = groupRes.status === 'fulfilled' && (groupRes.value as any)?.data
      ? (groupRes.value as any).data
      : []
    if (nodeRes.status === 'rejected') loadError.value = '节点数据加载失败'
  } catch {
    loadError.value = '节点数据加载失败'
    servers.value = []
    groups.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadNodes())

// ── Actions ────────────────────────────────────
function openAdd(protocol: Protocol) {
  showProtocolMenu.value = false
  isNew.value = true
  activeTab.value = 'basic'
  editingNode.value = {
    name: '',
    type: protocol,
    host: '',
    port: 443,
    server_port: 443,
    rate: 1,
    show: true,
    sort: servers.value.length + 1,
    group_id: groups.value[0]?.id || 1,
    tags: [],
  }
  showEditModal.value = true
}

function openEdit(node: ServerNode) {
  isNew.value = false
  activeTab.value = 'basic'
  editingNode.value = { ...node }
  showEditModal.value = true
}

function closeModal() {
  showEditModal.value = false
  editingNode.value = null
}

async function saveNode() {
  if (!editingNode.value) return
  const proto = editingNode.value.type as Protocol
  const apiMap: Record<Protocol, Function> = {
    shadowsocks: isNew.value ? adminServerApi.shadowsocksSave : adminServerApi.shadowsocksUpdate,
    vmess: isNew.value ? adminServerApi.vmessSave : adminServerApi.vmessUpdate,
    vless: isNew.value ? adminServerApi.vlessSave : adminServerApi.vlessUpdate,
    trojan: isNew.value ? adminServerApi.trojanSave : adminServerApi.trojanUpdate,
    hysteria: isNew.value ? adminServerApi.hysteriaSave : adminServerApi.hysteriaUpdate,
    tuic: isNew.value ? adminServerApi.tuicSave : adminServerApi.tuicUpdate,
    anytls: isNew.value ? adminServerApi.anytlsSave : adminServerApi.anytlsUpdate,
  }
  try {
    await apiMap[proto](editingNode.value)
    closeModal()
    const res: any = await adminServerApi.getNodes()
    if (res?.data) servers.value = res.data
  } catch {
    closeModal()
  }
}

async function copyNode(node: ServerNode) {
  const proto = node.type as Protocol
  const apiMap: Record<Protocol, Function> = {
    shadowsocks: adminServerApi.shadowsocksCopy,
    vmess: adminServerApi.vmessCopy,
    vless: adminServerApi.vlessCopy,
    trojan: adminServerApi.trojanCopy,
    hysteria: adminServerApi.hysteriaCopy,
    tuic: adminServerApi.tuicCopy,
    anytls: adminServerApi.anytlsCopy,
  }
  try {
    await apiMap[proto]({ id: node.id })
    const res: any = await adminServerApi.getNodes()
    if (res?.data) servers.value = res.data
  } catch {
    // silent
  }
}

async function deleteNode(node: ServerNode) {
  if (confirmDeleteId.value !== node.id) {
    confirmDeleteId.value = node.id
    return
  }
  const proto = node.type as Protocol
  const apiMap: Record<Protocol, Function> = {
    shadowsocks: adminServerApi.shadowsocksDrop,
    vmess: adminServerApi.vmessDrop,
    vless: adminServerApi.vlessDrop,
    trojan: adminServerApi.trojanDrop,
    hysteria: adminServerApi.hysteriaDrop,
    tuic: adminServerApi.tuicDrop,
    anytls: adminServerApi.anytlsDrop,
  }
  try {
    await apiMap[proto]({ id: node.id })
    const res: any = await adminServerApi.getNodes()
    if (res?.data) servers.value = res.data
  } catch {
    // silent
  }
  confirmDeleteId.value = null
}

async function toggleVisibility(node: ServerNode) {
  node.show = !node.show
  const proto = node.type as Protocol
  const apiMap: Record<Protocol, Function> = {
    shadowsocks: adminServerApi.shadowsocksUpdate,
    vmess: adminServerApi.vmessUpdate,
    vless: adminServerApi.vlessUpdate,
    trojan: adminServerApi.trojanUpdate,
    hysteria: adminServerApi.hysteriaUpdate,
    tuic: adminServerApi.tuicUpdate,
    anytls: adminServerApi.anytlsUpdate,
  }
  try {
    await apiMap[proto]({ id: node.id, show: node.show ? 1 : 0 })
  } catch {
    // Mock mode — state already toggled
  }
}

function rateClass(rate: number): string {
  if (rate <= 0.5) return 'low'
  if (rate <= 1) return 'medium'
  return 'high'
}

// Tab definitions per protocol
const tabDefs: Record<string, string[]> = {
  basic: ['所有'],
  shadowsocks: ['基本', '加密'],
  vmess: ['基本', '传输', 'TLS'],
  vless: ['基本', '传输', 'Reality'],
  trojan: ['基本', 'TLS', 'GRPC'],
  hysteria: ['基本', '带宽'],
  tuic: ['基本', 'QUIC'],
  anytls: ['基本', 'TLS'],
}

function getEditTabs() {
  const proto = editingNode.value?.type || 'basic'
  return [
    { key: 'basic', label: '基本设置' },
    ...(tabDefs[proto] || []).slice(1).map((label, i) => ({
      key: `proto_${i}`,
      label,
    })),
  ]
}
</script>

<template>
  <div class="servers-page">
    <!-- Top Bar -->
    <div class="page-header stagger-1">
      <div class="header-left">
        <h1>节点管理</h1>
        <div class="node-summary">
          <span class="sum-item">
            <span class="sum-dot online"></span>{{ onlineCount }} 在线
          </span>
          <span class="sum-item">
            <span class="sum-dot offline"></span>{{ offlineCount }} 离线
          </span>
        </div>
      </div>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          class="or-input search-input"
          placeholder="搜索节点名称、地址、协议…"
        />
        <div class="add-btn-wrap">
          <button class="btn-gradient" @click="showProtocolMenu = !showProtocolMenu">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            添加节点
          </button>
          <Transition name="fade-slide">
            <div v-if="showProtocolMenu" class="protocol-dropdown card">
              <button
                v-for="p in protocols"
                :key="p.value"
                class="protocol-item"
                @click="openAdd(p.value)"
              >
                <span :class="['or-tag', p.color]">{{ p.label }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="loading-text stagger-2">加载中...</div>
    <div v-else-if="loadError" class="error-state stagger-2">
      <p>{{ loadError }}</p>
      <button class="btn-ghost" style="padding:6px 16px;font-size:13px" @click="loadNodes">重新加载</button>
    </div>

    <!-- Server List -->
    <div v-else class="server-grid">
      <div
        v-for="(node, i) in filteredServers"
        :key="node.id"
        :class="['server-card', 'card-accent', `stagger-${Math.min(i + 2, 12)}`, { hidden: !node.show }]"
      >
        <div class="sc-header">
          <div class="sc-left">
            <div :class="['status-dot', { online: node.online }]"></div>
            <span class="sc-name">{{ node.name }}</span>
          </div>
          <span :class="['or-tag', protocolTagClass[node.type] || 'info']">
            {{ node.type.toUpperCase() }}
          </span>
        </div>

        <div class="sc-info">
          <div class="sc-row">
            <span class="sc-label">地址</span>
            <span class="sc-value mono">{{ node.host }}:{{ node.port }}</span>
          </div>
          <div class="sc-row">
            <span class="sc-label">倍率</span>
            <span :class="['sc-rate', rateClass(node.rate)]">{{ node.rate }}x</span>
          </div>
          <div class="sc-row">
            <span class="sc-label">在线</span>
            <span class="sc-value">{{ node.online_count }} 人</span>
          </div>
          <div class="sc-row">
            <span class="sc-label">分组</span>
            <span class="sc-value">{{ node.group_name }}</span>
          </div>
        </div>

        <div v-if="node.tags && node.tags.length" class="sc-tags">
          <span v-for="tag in node.tags" :key="tag" class="or-tag info">{{ tag }}</span>
        </div>

        <div class="sc-actions">
          <button class="act-btn edit" title="编辑" @click="openEdit(node)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="act-btn copy" title="复制" @click="copyNode(node)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M10 4V2.5A1.5 1.5 0 008.5 1h-6A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" stroke="currentColor" stroke-width="1.3"/>
            </svg>
          </button>
          <button
            :class="['act-btn', 'vis', { off: !node.show }]"
            :title="node.show ? '隐藏' : '显示'"
            @click="toggleVisibility(node)"
          >
            <svg v-if="node.show" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.3"/>
              <circle cx="7" cy="7" r="1.5" stroke="currentColor" stroke-width="1.3"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.3"/>
              <path d="M2 12L12 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </button>
          <button
            :class="['act-btn', 'del', { confirm: confirmDeleteId === node.id }]"
            :title="confirmDeleteId === node.id ? '确认删除' : '删除'"
            @click="deleteNode(node)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M3.5 4l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="!filteredServers.length" class="empty-state stagger-2">
        暂无匹配节点
      </div>
    </div>

    <!-- Edit / Add Modal -->
    <Transition name="fade-slide">
      <div v-if="showEditModal && editingNode" class="modal-overlay" @click.self="closeModal">
        <div class="modal-panel card-glow">
          <div class="modal-header">
            <h2>{{ isNew ? '添加节点' : '编辑节点' }}</h2>
            <span :class="['or-tag', protocolTagClass[editingNode.type!] || 'info']">
              {{ (editingNode.type || '').toUpperCase() }}
            </span>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>

          <!-- Tabs -->
          <div class="modal-tabs">
            <button
              v-for="tab in getEditTabs()"
              :key="tab.key"
              :class="['tab-btn', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content: Basic -->
          <div v-show="activeTab === 'basic'" class="modal-body">
            <div class="form-grid">
              <label class="form-field">
                <span class="form-label">名称</span>
                <input v-model="editingNode.name" class="or-input" placeholder="节点名称" />
              </label>
              <label class="form-field">
                <span class="form-label">分组</span>
                <select v-model="editingNode.group_id" class="or-input">
                  <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
              </label>
              <label class="form-field">
                <span class="form-label">标签 (逗号分隔)</span>
                <input
                  :value="(editingNode.tags || []).join(', ')"
                  class="or-input"
                  placeholder="Premium, IPLC"
                  @input="editingNode!.tags = ($event.target as HTMLInputElement).value.split(',').map(t => t.trim()).filter(Boolean)"
                />
              </label>
              <label class="form-field">
                <span class="form-label">倍率</span>
                <input v-model.number="editingNode.rate" type="number" step="0.1" min="0" class="or-input" />
              </label>
              <label class="form-field">
                <span class="form-label">主机地址</span>
                <input v-model="editingNode.host" class="or-input" placeholder="example.com" />
              </label>
              <label class="form-field">
                <span class="form-label">连接端口</span>
                <input v-model.number="editingNode.port" type="number" class="or-input" />
              </label>
              <label class="form-field">
                <span class="form-label">服务端口</span>
                <input v-model.number="editingNode.server_port" type="number" class="or-input" />
              </label>
              <label class="form-field">
                <span class="form-label">排序</span>
                <input v-model.number="editingNode.sort" type="number" class="or-input" />
              </label>
              <label class="form-field toggle-field">
                <span class="form-label">显示</span>
                <button
                  :class="['toggle-switch', { on: editingNode.show }]"
                  @click="editingNode!.show = !editingNode!.show"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </label>
            </div>
          </div>

          <!-- Tab Content: Protocol-Specific -->
          <div v-show="activeTab === 'proto_0'" class="modal-body">
            <!-- Shadowsocks: Cipher -->
            <div v-if="editingNode.type === 'shadowsocks'" class="form-grid">
              <label class="form-field">
                <span class="form-label">加密方式</span>
                <select v-model="editingNode.cipher" class="or-input">
                  <option value="aes-256-gcm">aes-256-gcm</option>
                  <option value="aes-128-gcm">aes-128-gcm</option>
                  <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                  <option value="2022-blake3-aes-256-gcm">2022-blake3-aes-256-gcm</option>
                  <option value="2022-blake3-chacha20-poly1305">2022-blake3-chacha20-poly1305</option>
                </select>
              </label>
              <label class="form-field">
                <span class="form-label">密码</span>
                <input v-model="editingNode.password" class="or-input" placeholder="留空自动生成" />
              </label>
            </div>
            <!-- VMess: Transport -->
            <div v-if="editingNode.type === 'vmess'" class="form-grid">
              <label class="form-field">
                <span class="form-label">传输协议</span>
                <select v-model="editingNode.network" class="or-input">
                  <option value="tcp">TCP</option>
                  <option value="ws">WebSocket</option>
                  <option value="grpc">gRPC</option>
                  <option value="h2">HTTP/2</option>
                </select>
              </label>
              <label class="form-field">
                <span class="form-label">TLS</span>
                <select v-model="editingNode.security" class="or-input">
                  <option value="">无</option>
                  <option value="tls">TLS</option>
                </select>
              </label>
            </div>
            <!-- VLESS: Transport -->
            <div v-if="editingNode.type === 'vless'" class="form-grid">
              <label class="form-field">
                <span class="form-label">传输协议</span>
                <select v-model="editingNode.network" class="or-input">
                  <option value="tcp">TCP</option>
                  <option value="ws">WebSocket</option>
                  <option value="grpc">gRPC</option>
                  <option value="h2">HTTP/2</option>
                </select>
              </label>
              <label class="form-field">
                <span class="form-label">安全</span>
                <select v-model="editingNode.security" class="or-input">
                  <option value="">无</option>
                  <option value="tls">TLS</option>
                  <option value="reality">Reality</option>
                </select>
              </label>
              <label class="form-field">
                <span class="form-label">Flow</span>
                <select v-model="editingNode.flow" class="or-input">
                  <option value="">无</option>
                  <option value="xtls-rprx-vision">xtls-rprx-vision</option>
                </select>
              </label>
            </div>
            <!-- Trojan: TLS -->
            <div v-if="editingNode.type === 'trojan'" class="form-grid">
              <label class="form-field">
                <span class="form-label">SNI (server_name)</span>
                <input v-model="editingNode.server_name" class="or-input" placeholder="域名" />
              </label>
              <label class="form-field toggle-field">
                <span class="form-label">允许不安全</span>
                <button
                  :class="['toggle-switch', { on: editingNode.allow_insecure }]"
                  @click="editingNode!.allow_insecure = !editingNode!.allow_insecure"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </label>
            </div>
            <!-- Hysteria: Bandwidth -->
            <div v-if="editingNode.type === 'hysteria'" class="form-grid">
              <label class="form-field">
                <span class="form-label">上行带宽 (Mbps)</span>
                <input v-model.number="editingNode.up_mbps" type="number" class="or-input" />
              </label>
              <label class="form-field">
                <span class="form-label">下行带宽 (Mbps)</span>
                <input v-model.number="editingNode.down_mbps" type="number" class="or-input" />
              </label>
            </div>
            <!-- TUIC: QUIC -->
            <div v-if="editingNode.type === 'tuic'" class="form-grid">
              <label class="form-field">
                <span class="form-label">拥塞控制</span>
                <select v-model="editingNode.congestion_control" class="or-input">
                  <option value="bbr">BBR</option>
                  <option value="cubic">Cubic</option>
                  <option value="new_reno">New Reno</option>
                </select>
              </label>
            </div>
            <!-- AnyTLS -->
            <div v-if="editingNode.type === 'anytls'" class="form-grid">
              <label class="form-field">
                <span class="form-label">SNI (server_name)</span>
                <input v-model="editingNode.server_name" class="or-input" placeholder="域名" />
              </label>
            </div>
          </div>

          <!-- Tab Content: Third tab (if exists) -->
          <div v-show="activeTab === 'proto_1'" class="modal-body">
            <!-- VMess: TLS settings -->
            <div v-if="editingNode.type === 'vmess'" class="form-grid">
              <label class="form-field">
                <span class="form-label">SNI (server_name)</span>
                <input v-model="editingNode.server_name" class="or-input" placeholder="域名" />
              </label>
              <label class="form-field toggle-field">
                <span class="form-label">允许不安全</span>
                <button
                  :class="['toggle-switch', { on: editingNode.allow_insecure }]"
                  @click="editingNode!.allow_insecure = !editingNode!.allow_insecure"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </label>
            </div>
            <!-- VLESS: Reality settings -->
            <div v-if="editingNode.type === 'vless'" class="form-grid">
              <label class="form-field">
                <span class="form-label">SNI (server_name)</span>
                <input v-model="editingNode.server_name" class="or-input" placeholder="域名" />
              </label>
              <label class="form-field toggle-field">
                <span class="form-label">允许不安全</span>
                <button
                  :class="['toggle-switch', { on: editingNode.allow_insecure }]"
                  @click="editingNode!.allow_insecure = !editingNode!.allow_insecure"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </label>
            </div>
            <!-- Trojan: GRPC -->
            <div v-if="editingNode.type === 'trojan'" class="form-grid">
              <label class="form-field">
                <span class="form-label">传输协议</span>
                <select v-model="editingNode.network" class="or-input">
                  <option value="tcp">TCP</option>
                  <option value="grpc">gRPC</option>
                  <option value="ws">WebSocket</option>
                </select>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">取消</button>
            <button class="btn-gradient" @click="saveNode">
              {{ isNew ? '创建' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.servers-page {
  padding: $gap-md;
}

// ── Header ─────────────────────────────────
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $gap-md;
  margin-bottom: $gap-lg;
  position: relative;
  z-index: 2;

  h1 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: $gap-md;
}

.search-input {
  width: 260px;
}

.node-summary {
  display: flex;
  gap: $gap-md;
}

.sum-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-2);
}

.sum-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.online {
    background: var(--accent);
    box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5);
  }

  &.offline {
    background: var(--danger);
  }
}

// ── Protocol Dropdown ──────────────────────
.add-btn-wrap {
  position: relative;
}

.protocol-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: $z-modal;
  padding: $gap-sm;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--bg-elevated);
}

.protocol-item {
  display: flex;
  align-items: center;
  padding: $gap-sm $gap-md;
  border-radius: $card-radius-sm;
  background: transparent;
  color: var(--text-1);
  transition: background 0.15s;

  &:hover {
    background: rgba(var(--brand-rgb), 0.08);
  }
}

// ── Server Grid ────────────────────────────
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: $gap-md;
}

.server-card {
  padding: $gap-lg;
  transition: opacity 0.2s;

  &.hidden {
    opacity: 0.5;
  }
}

.sc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $gap-md;
}

.sc-left {
  display: flex;
  align-items: center;
  gap: $gap-sm;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-3);
  flex-shrink: 0;

  &.online {
    background: var(--accent);
    box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.5);
    animation: pulse-ring 2.5s infinite;
  }
}

.sc-name {
  font-size: 15px;
  font-weight: 600;
}

.sc-info {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  margin-bottom: $gap-md;
}

.sc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.sc-label {
  color: var(--text-3);
  font-weight: 500;
}

.sc-value {
  color: var(--text-2);

  &.mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
}

.sc-rate {
  font-weight: 700;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 4px;

  &.low {
    background: rgba(52, 211, 153, 0.15);
    color: var(--success);
  }

  &.medium {
    background: rgba(251, 191, 36, 0.15);
    color: var(--warning);
  }

  &.high {
    background: rgba(248, 113, 113, 0.15);
    color: var(--danger);
  }
}

.sc-tags {
  display: flex;
  gap: $gap-xs;
  margin-bottom: $gap-md;
}

// ── Card Actions ───────────────────────────
.sc-actions {
  display: flex;
  gap: $gap-sm;
  padding-top: $gap-md;
  border-top: 1px solid var(--border);
}

.act-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: $card-radius-sm;
  background: var(--bg-2);
  color: var(--text-2);
  border: 1px solid var(--border);
  transition: all 0.15s;

  &:hover {
    border-color: var(--border-active);
    color: var(--text-1);
  }

  &.edit:hover {
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
  }

  &.copy:hover {
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.08);
  }

  &.vis.off {
    opacity: 0.5;
  }

  &.del:hover,
  &.del.confirm {
    color: var(--danger);
    background: rgba(239, 68, 68, 0.08);
    border-color: var(--danger);
  }
}

// ── Modal ──────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $gap-lg;
}

.modal-panel {
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
  background: var(--bg-1);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: $gap-md;
  padding: $gap-lg $gap-lg $gap-md;

  h2 {
    font-size: 18px;
    font-weight: 700;
    flex: 1;
  }
}

.modal-close {
  background: none;
  color: var(--text-3);
  font-size: 22px;
  line-height: 1;
  padding: 4px;
  transition: color 0.15s;

  &:hover {
    color: var(--text-1);
  }
}

// ── Tabs ───────────────────────────────────
.modal-tabs {
  display: flex;
  gap: 2px;
  padding: 0 $gap-lg;
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  padding: $gap-sm $gap-md;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-3);
  background: transparent;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  margin-bottom: -1px;

  &:hover {
    color: var(--text-2);
  }

  &.active {
    color: var(--brand);
    border-bottom-color: var(--brand);
  }
}

.modal-body {
  padding: $gap-lg;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-md;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  transition: all 0.2s;
  cursor: pointer;

  &.on {
    background: var(--brand);
    border-color: var(--brand);
  }
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-1);
  transition: transform 0.2s;

  .toggle-switch.on & {
    transform: translateX(18px);
  }
}

select.or-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23475569' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $gap-md;
  padding: $gap-md $gap-lg $gap-lg;
  border-top: 1px solid var(--border);
}

// ── Misc ───────────────────────────────────
.loading-text {
  color: var(--text-3);
  padding: $gap-xl;
}

.error-state {
  display: flex;
  align-items: center;
  gap: $gap-md;
  padding: $gap-xl;
  color: var(--danger);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: $gap-xl;
  color: var(--text-3);
  grid-column: 1 / -1;
}

// ── Responsive ─────────────────────────────
@media (max-width: $bp-tablet) {
  .server-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
    flex: 1;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

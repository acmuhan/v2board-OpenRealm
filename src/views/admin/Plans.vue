<script setup lang="ts">
import { ref } from 'vue'


// ── Types ──
interface Plan {
  id: number
  name: string
  content: string
  month_price: number | null
  quarter_price: number | null
  half_year_price: number | null
  year_price: number | null
  two_year_price: number | null
  three_year_price: number | null
  onetime_price: number | null
  transfer_enable: number
  speed_limit: number | null
  device_limit: number | null
  group_id: number | null
  sort: number
  show: boolean
  renew: boolean
  user_count: number
}

// ── State ──
const showEdit = ref(false)
const editForm = ref<Record<string, any>>({})

// ── Mock Data ──
const plans = ref<Plan[]>([
  {
    id: 1, name: '基础版', content: '适合轻度使用的个人用户',
    month_price: 1990, quarter_price: 4990, half_year_price: 8990, year_price: 14990,
    two_year_price: 24990, three_year_price: 34990, onetime_price: null,
    transfer_enable: 107374182400, speed_limit: 100, device_limit: 3, group_id: 1,
    sort: 1, show: true, renew: true, user_count: 234,
  },
  {
    id: 2, name: '专业版', content: '适合日常高速使用的用户',
    month_price: 3990, quarter_price: 9990, half_year_price: 17990, year_price: 29990,
    two_year_price: 49990, three_year_price: 69990, onetime_price: null,
    transfer_enable: 214748364800, speed_limit: 300, device_limit: 5, group_id: 1,
    sort: 2, show: true, renew: true, user_count: 156,
  },
  {
    id: 3, name: '企业版', content: '不限速的企业级专属通道',
    month_price: 9990, quarter_price: 24990, half_year_price: 44990, year_price: 79990,
    two_year_price: null, three_year_price: null, onetime_price: 199990,
    transfer_enable: 536870912000, speed_limit: null, device_limit: 10, group_id: 2,
    sort: 3, show: true, renew: true, user_count: 42,
  },
])

const planGradients = [
  'linear-gradient(135deg, rgba(var(--brand-rgb), 0.15), rgba(var(--accent-rgb), 0.05))',
  'linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--brand-rgb), 0.05))',
  'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(236, 72, 153, 0.05))',
  'linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(234, 179, 8, 0.05))',
]

// ── Helpers ──
function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(0) + ' ' + units[i]
}

function formatPrice(cents: number | null) {
  if (cents === null || cents === undefined) return '--'
  return '\u00a5' + (cents / 100).toFixed(2)
}

// ── Actions ──
function openEdit(plan?: Plan) {
  if (plan) {
    editForm.value = { ...plan }
  } else {
    editForm.value = {
      id: 0,
      name: '',
      content: '',
      month_price: null,
      quarter_price: null,
      half_year_price: null,
      year_price: null,
      two_year_price: null,
      three_year_price: null,
      onetime_price: null,
      transfer_enable: 107374182400,
      speed_limit: null,
      device_limit: 3,
      group_id: null,
      sort: plans.value.length + 1,
      show: true,
      renew: true,
    }
  }
  showEdit.value = true
}

function saveEdit() {
  if (editForm.value.id) {
    const idx = plans.value.findIndex(p => p.id === editForm.value.id)
    if (idx !== -1) {
      plans.value[idx] = { ...plans.value[idx], ...editForm.value }
    }
  } else {
    const newId = Math.max(...plans.value.map(p => p.id), 0) + 1
    plans.value.push({ ...editForm.value, id: newId, user_count: 0 } as Plan)
  }
  showEdit.value = false
}

function toggleShow(plan: Plan) {
  plan.show = !plan.show
}

function deletePlan(id: number) {
  plans.value = plans.value.filter(p => p.id !== id)
}

const priceFields = [
  { key: 'month_price', label: '月付' },
  { key: 'quarter_price', label: '季付' },
  { key: 'half_year_price', label: '半年付' },
  { key: 'year_price', label: '年付' },
  { key: 'two_year_price', label: '两年付' },
  { key: 'three_year_price', label: '三年付' },
  { key: 'onetime_price', label: '一次性' },
]
</script>

<template>
  <div class="admin-plans">
    <!-- Top Bar -->
    <div class="top-bar stagger-1">
      <h1 class="page-title">套餐管理</h1>
      <button class="btn-gradient" @click="openEdit()">添加套餐</button>
    </div>

    <!-- Plan Cards Grid -->
    <div class="plan-grid">
      <div
        v-for="(plan, idx) in plans"
        :key="plan.id"
        :class="['plan-card', 'card-accent', `stagger-${idx + 2}`]"
        :style="{ background: planGradients[idx % planGradients.length] }"
      >
        <!-- Card Header -->
        <div class="plan-top">
          <div class="plan-info">
            <h3>{{ plan.name }}</h3>
            <p class="plan-desc">{{ plan.content }}</p>
          </div>
          <div class="plan-controls">
            <button
              :class="['toggle-switch', { active: plan.show }]"
              @click="toggleShow(plan)"
              :title="plan.show ? '点击隐藏' : '点击显示'"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>

        <!-- Card Stats -->
        <div class="plan-stats">
          <div class="stat-item">
            <span class="stat-label">月付价格</span>
            <span class="stat-value">{{ formatPrice(plan.month_price) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">流量</span>
            <span class="stat-value">{{ formatBytes(plan.transfer_enable) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">设备限制</span>
            <span class="stat-value">{{ plan.device_limit ?? '不限' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">限速</span>
            <span class="stat-value">{{ plan.speed_limit ? plan.speed_limit + ' Mbps' : '不限' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">用户数</span>
            <span class="stat-value highlight">{{ plan.user_count }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">排序</span>
            <span class="stat-value">{{ plan.sort }}</span>
          </div>
        </div>

        <!-- Card Tags -->
        <div class="plan-tags">
          <span :class="['or-tag', plan.show ? 'success' : 'warning']">{{ plan.show ? '显示中' : '已隐藏' }}</span>
          <span v-if="plan.renew" class="or-tag info">可续费</span>
        </div>

        <!-- Card Actions -->
        <div class="plan-actions">
          <button class="btn-ghost action-btn" @click="openEdit(plan)">编辑</button>
          <button class="btn-ghost action-btn danger-btn" @click="deletePlan(plan.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!plans.length" class="empty-state stagger-2">
      <p>暂无套餐，请添加</p>
    </div>

    <!-- Edit Modal -->
    <teleport to="body">
      <transition name="fade-slide">
        <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
          <div class="modal-card card">
            <div class="modal-header">
              <h3>{{ editForm.id ? '编辑套餐' : '添加套餐' }}</h3>
              <button class="modal-close" @click="showEdit = false">&times;</button>
            </div>
            <form class="modal-body" @submit.prevent="saveEdit">
              <!-- Basic -->
              <div class="form-group">
                <label>套餐名称</label>
                <input v-model="editForm.name" class="or-input" placeholder="输入套餐名称" />
              </div>
              <div class="form-group">
                <label>套餐说明</label>
                <textarea v-model="editForm.content" class="or-input textarea" rows="2" placeholder="套餐描述"></textarea>
              </div>

              <!-- Prices -->
              <div class="form-section-title">价格设置 (分)</div>
              <div class="price-grid">
                <div v-for="pf in priceFields" :key="pf.key" class="form-group">
                  <label>{{ pf.label }}</label>
                  <input v-model.number="editForm[pf.key]" type="number" class="or-input" placeholder="留空不启用" />
                </div>
              </div>

              <!-- Limits -->
              <div class="form-section-title">流量与限制</div>
              <div class="form-row">
                <div class="form-group">
                  <label>流量 (Bytes)</label>
                  <input v-model.number="editForm.transfer_enable" type="number" class="or-input" />
                </div>
                <div class="form-group">
                  <label>限速 (Mbps)</label>
                  <input v-model.number="editForm.speed_limit" type="number" class="or-input" placeholder="留空不限" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>设备限制</label>
                  <input v-model.number="editForm.device_limit" type="number" class="or-input" placeholder="留空不限" />
                </div>
                <div class="form-group">
                  <label>分组 ID</label>
                  <input v-model.number="editForm.group_id" type="number" class="or-input" placeholder="留空默认" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>排序权重</label>
                  <input v-model.number="editForm.sort" type="number" class="or-input" />
                </div>
                <div class="form-group" style="justify-content: flex-end;">
                  <!-- spacer -->
                </div>
              </div>

              <!-- Toggles -->
              <div class="toggle-row">
                <div class="toggle-item">
                  <label>前台显示</label>
                  <button
                    type="button"
                    :class="['toggle-switch', { active: editForm.show }]"
                    @click="editForm.show = !editForm.show"
                  >
                    <span class="toggle-knob"></span>
                  </button>
                </div>
                <div class="toggle-item">
                  <label>允许续费</label>
                  <button
                    type="button"
                    :class="['toggle-switch', { active: editForm.renew }]"
                    @click="editForm.renew = !editForm.renew"
                  >
                    <span class="toggle-knob"></span>
                  </button>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-ghost" @click="showEdit = false">取消</button>
                <button type="submit" class="btn-gradient">保存</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-plans {
  max-width: 1200px;
}

// ── Top Bar ──
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $gap-lg;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

// ── Plan Grid ──
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: $gap-md;
}
.plan-card {
  padding: $gap-lg;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-4px);
  }
}

// ── Plan Top ──
.plan-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $gap-md;
}
.plan-info {
  h3 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }
}
.plan-desc {
  font-size: 13px;
  color: var(--text-2);
}
.plan-controls {
  flex-shrink: 0;
}

// ── Stats ──
.plan-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $gap-sm;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label {
  font-size: 10px;
  color: var(--text-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.stat-value {
  font-size: 14px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  color: var(--text-1);

  &.highlight {
    color: var(--brand-light);
  }
}

// ── Tags ──
.plan-tags {
  display: flex;
  gap: $gap-xs;
}

// ── Actions ──
.plan-actions {
  display: flex;
  gap: $gap-sm;
  padding-top: $gap-sm;
  border-top: 1px solid var(--border);
}
.action-btn {
  flex: 1;
  padding: 8px;
  font-size: 13px;
}
.danger-btn {
  color: var(--danger) !important;

  &:hover {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: rgba(239, 68, 68, 0.3) !important;
  }
}

// ── Toggle ──
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  transition: all 0.2s;
  cursor: pointer;

  &.active {
    background: var(--success);
    border-color: var(--success);

    .toggle-knob {
      transform: translateX(20px);
    }
  }
}
.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

// ── Empty ──
.empty-state {
  text-align: center;
  padding: $gap-xl * 2;
  color: var(--text-3);
  font-size: 14px;
}

// ── Modal ──
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $gap-lg;
}
.modal-card {
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $gap-lg $gap-lg $gap-md;

  h3 {
    font-size: 18px;
    font-weight: 700;
  }
}
.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-3);
  font-size: 22px;
  border-radius: 8px;
  transition: all 0.15s;

  &:hover {
    background: rgba(var(--brand-rgb), 0.1);
    color: var(--text-1);
  }
}
.modal-body {
  padding: 0 $gap-lg $gap-lg;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    color: var(--text-3);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-md;
}
.form-section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-top: $gap-sm;
  border-top: 1px solid var(--border);
}
.price-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: $gap-sm;
}
.textarea {
  resize: vertical;
  min-height: 56px;
}
.toggle-row {
  display: flex;
  gap: $gap-xl;
}
.toggle-item {
  display: flex;
  align-items: center;
  gap: $gap-sm;

  label {
    font-size: 13px;
    color: var(--text-2);
    font-weight: 500;
  }
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $gap-sm;
  padding-top: $gap-sm;
  border-top: 1px solid var(--border);
}

// ── Responsive ──
@media (max-width: $bp-mobile) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
  .plan-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .price-grid {
    grid-template-columns: 1fr 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

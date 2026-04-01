<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { adminThemeApi, adminConfigApi } from '../../api/admin'

interface ThemePreset {
  name: string
  label: string
  brand: string
  brandLight: string
  accent: string
  bg0: string
  bg1: string
  bg2: string
}

const presets: ThemePreset[] = [
  { name: 'default', label: 'Default', brand: '#2563eb', brandLight: '#3b82f6', accent: '#10b981', bg0: '#070a10', bg1: '#0b0f18', bg2: '#101724' },
  { name: 'emerald', label: 'Emerald', brand: '#059669', brandLight: '#10b981', accent: '#2563eb', bg0: '#070a10', bg1: '#0b0f18', bg2: '#101724' },
  { name: 'violet', label: 'Violet', brand: '#7c3aed', brandLight: '#8b5cf6', accent: '#ec4899', bg0: '#070a10', bg1: '#0b0f18', bg2: '#101724' },
  { name: 'sunset', label: 'Sunset', brand: '#ea580c', brandLight: '#f97316', accent: '#eab308', bg0: '#070a10', bg1: '#0b0f18', bg2: '#101724' },
  { name: 'rose', label: 'Rose', brand: '#e11d48', brandLight: '#f43f5e', accent: '#a855f7', bg0: '#070a10', bg1: '#0b0f18', bg2: '#101724' },
  { name: 'cyan', label: 'Cyan', brand: '#0891b2', brandLight: '#06b6d4', accent: '#14b8a6', bg0: '#070a10', bg1: '#0b0f18', bg2: '#101724' },
]

const activePreset = ref('default')
const activeSection = ref<'palette' | 'custom' | 'frontend' | 'export'>('palette')
const saving = ref(false)
const saved = ref(false)

// Custom theme editor
const custom = reactive({
  name: 'my-theme',
  brand: '#6366f1',
  brandLight: '#818cf8',
  accent: '#f59e0b',
  bg0: '#070a10',
  bg1: '#0b0f18',
  bg2: '#101724',
  bgCard: '#101724',
  text1: '#e2e8f0',
  text2: '#8b9bb8',
  text3: '#475569',
})

// Frontend theme settings
const frontendTheme = ref('OpenRealm')
const frontendThemes = ref(['OpenRealm', 'V2Board', 'Starter', 'Custom'])

// Hex to RGB for preview
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

// Preview gradient
const previewGradient = computed(() =>
  `linear-gradient(135deg, ${custom.brand}, ${custom.accent})`,
)

function selectPreset(name: string) {
  activePreset.value = name
  // In real app: adminThemeApi.saveThemeConfig({ theme: name })
}

async function saveTheme() {
  saving.value = true
  try {
    // await adminThemeApi.saveThemeConfig({ ...custom })
    await new Promise((r) => setTimeout(r, 600))
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } finally {
    saving.value = false
  }
}

// Export / Import
const exportJson = computed(() =>
  JSON.stringify(custom, null, 2),
)

function exportTheme() {
  const blob = new Blob([exportJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `theme-${custom.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importTheme(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.brand) Object.assign(custom, data)
    } catch {
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="theme-page">
    <div class="page-header stagger-1">
      <div>
        <h1>主题管理</h1>
        <p class="page-desc">自定义面板外观、配色方案与主题设置</p>
      </div>
    </div>

    <!-- Section tabs -->
    <div class="section-tabs stagger-2">
      <button
        v-for="sec in [
          { key: 'palette', label: '调色板' },
          { key: 'custom', label: '自定义主题' },
          { key: 'frontend', label: '前端主题' },
          { key: 'export', label: '导出/导入' },
        ]"
        :key="sec.key"
        :class="['sec-tab', { active: activeSection === sec.key }]"
        @click="activeSection = sec.key as any"
      >
        {{ sec.label }}
      </button>
    </div>

    <!-- PALETTE -->
    <div v-if="activeSection === 'palette'" class="section stagger-3">
      <h2 class="section-heading">主题预设</h2>
      <p class="section-sub">选择一个内置主题配色方案</p>

      <div class="preset-grid">
        <div
          v-for="(p, idx) in presets"
          :key="p.name"
          :class="['preset-card', 'card', `stagger-${idx + 3}`, { selected: activePreset === p.name }]"
          @click="selectPreset(p.name)"
        >
          <div class="preset-swatches">
            <div class="swatch large" :style="{ background: p.brand }"></div>
            <div class="swatch" :style="{ background: p.brandLight }"></div>
            <div class="swatch" :style="{ background: p.accent }"></div>
            <div class="swatch small" :style="{ background: p.bg2 }"></div>
          </div>
          <div class="preset-info">
            <h3>{{ p.label }}</h3>
            <div class="preset-colors">
              <span class="color-hex">{{ p.brand }}</span>
              <span class="color-hex">{{ p.accent }}</span>
            </div>
          </div>
          <div class="preset-gradient" :style="{ background: `linear-gradient(135deg, ${p.brand}, ${p.accent})` }"></div>
          <div v-if="activePreset === p.name" class="selected-badge">
            &#10003;
          </div>
        </div>
      </div>
    </div>

    <!-- CUSTOM THEME -->
    <div v-if="activeSection === 'custom'" class="section stagger-3">
      <h2 class="section-heading">自定义主题</h2>
      <p class="section-sub">创建你自己的配色方案</p>

      <div class="custom-layout">
        <!-- Color form -->
        <div class="custom-form card">
          <div class="form-group">
            <label>主题名称</label>
            <input v-model="custom.name" class="or-input" placeholder="my-theme" />
          </div>

          <span class="section-title" style="margin-top: 8px">品牌色</span>
          <div class="color-row">
            <div class="color-pick">
              <label>Brand</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.brand" class="color-native" />
                <input v-model="custom.brand" class="or-input mono-sm" />
              </div>
            </div>
            <div class="color-pick">
              <label>Brand Light</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.brandLight" class="color-native" />
                <input v-model="custom.brandLight" class="or-input mono-sm" />
              </div>
            </div>
            <div class="color-pick">
              <label>Accent</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.accent" class="color-native" />
                <input v-model="custom.accent" class="or-input mono-sm" />
              </div>
            </div>
          </div>

          <span class="section-title" style="margin-top: 8px">背景色</span>
          <div class="color-row">
            <div class="color-pick">
              <label>BG-0</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.bg0" class="color-native" />
                <input v-model="custom.bg0" class="or-input mono-sm" />
              </div>
            </div>
            <div class="color-pick">
              <label>BG-1</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.bg1" class="color-native" />
                <input v-model="custom.bg1" class="or-input mono-sm" />
              </div>
            </div>
            <div class="color-pick">
              <label>BG-2 / Card</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.bg2" class="color-native" />
                <input v-model="custom.bg2" class="or-input mono-sm" />
              </div>
            </div>
          </div>

          <span class="section-title" style="margin-top: 8px">文字色</span>
          <div class="color-row">
            <div class="color-pick">
              <label>Text-1</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.text1" class="color-native" />
                <input v-model="custom.text1" class="or-input mono-sm" />
              </div>
            </div>
            <div class="color-pick">
              <label>Text-2</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.text2" class="color-native" />
                <input v-model="custom.text2" class="or-input mono-sm" />
              </div>
            </div>
            <div class="color-pick">
              <label>Text-3</label>
              <div class="color-input-wrap">
                <input type="color" v-model="custom.text3" class="color-native" />
                <input v-model="custom.text3" class="or-input mono-sm" />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <Transition name="fade-slide">
              <span v-if="saved" class="save-success">&#10003; 已保存</span>
            </Transition>
            <button class="btn-gradient" :disabled="saving" @click="saveTheme">
              {{ saving ? '保存中...' : '保存自定义主题' }}
            </button>
          </div>
        </div>

        <!-- Live preview -->
        <div class="preview-panel">
          <span class="section-title">实时预览</span>
          <div
            class="preview-card"
            :style="{
              background: custom.bg2,
              borderColor: `rgba(${hexToRgb(custom.brand)}, 0.15)`,
              color: custom.text1,
            }"
          >
            <div class="preview-gradient-bar" :style="{ background: previewGradient }"></div>
            <div class="preview-content">
              <h3 :style="{ color: custom.text1 }">Preview Title</h3>
              <p :style="{ color: custom.text2 }">Secondary text preview</p>
              <span :style="{ color: custom.text3, fontSize: '12px' }">Tertiary text</span>
            </div>
            <div class="preview-btns">
              <span class="preview-btn" :style="{ background: custom.brand, color: '#fff' }">Primary</span>
              <span class="preview-btn" :style="{ background: previewGradient, color: '#fff' }">Gradient</span>
              <span
                class="preview-btn ghost"
                :style="{
                  background: 'transparent',
                  border: `1px solid rgba(${hexToRgb(custom.brand)}, 0.3)`,
                  color: custom.text1,
                }"
              >Ghost</span>
            </div>
          </div>

          <div class="preview-swatches">
            <div
              v-for="(c, label) in {
                Brand: custom.brand,
                'Brand Light': custom.brandLight,
                Accent: custom.accent,
                'BG-0': custom.bg0,
                'BG-1': custom.bg1,
                'BG-2': custom.bg2,
              }"
              :key="label"
              class="preview-swatch"
            >
              <div class="sw-color" :style="{ background: c }"></div>
              <span class="sw-label">{{ label }}</span>
              <span class="sw-hex">{{ c }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FRONTEND THEME -->
    <div v-if="activeSection === 'frontend'" class="section stagger-3">
      <h2 class="section-heading">前端主题模板</h2>
      <p class="section-sub">选择要使用的前端模板并配置主题特定设置</p>

      <div class="frontend-grid">
        <div
          v-for="t in frontendThemes"
          :key="t"
          :class="['frontend-card', 'card-accent', { selected: frontendTheme === t }]"
          @click="frontendTheme = t"
        >
          <div class="ft-preview">
            <div class="ft-browser">
              <div class="ft-dots">
                <span></span><span></span><span></span>
              </div>
              <div class="ft-screen">
                <div class="ft-sidebar"></div>
                <div class="ft-main">
                  <div class="ft-block"></div>
                  <div class="ft-block sm"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="ft-info">
            <h3>{{ t }}</h3>
            <span v-if="frontendTheme === t" class="or-tag success">当前使用</span>
          </div>
        </div>
      </div>
    </div>

    <!-- EXPORT / IMPORT -->
    <div v-if="activeSection === 'export'" class="section stagger-3">
      <h2 class="section-heading">导出 / 导入主题</h2>
      <p class="section-sub">以 JSON 格式备份和恢复你的主题配置</p>

      <div class="export-layout">
        <div class="export-block card">
          <h3>导出当前主题</h3>
          <p class="export-desc">将自定义主题配置导出为 JSON 文件</p>
          <pre class="json-preview">{{ exportJson }}</pre>
          <button class="btn-primary" @click="exportTheme">下载 JSON</button>
        </div>

        <div class="export-block card">
          <h3>导入主题</h3>
          <p class="export-desc">从 JSON 文件导入主题配置</p>
          <label class="import-area">
            <input type="file" accept=".json" @change="importTheme" class="file-input" />
            <div class="import-placeholder">
              <span class="import-icon">&#8593;</span>
              <span>点击或拖放 JSON 文件</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.theme-page { max-width: 1100px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: $gap-lg;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .page-desc { font-size: 13px; color: var(--text-3); margin-top: 4px; }
}

// Section tabs
.section-tabs {
  display: flex;
  gap: $gap-xs;
  margin-bottom: $gap-lg;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: $card-radius;
  padding: $gap-xs;
}

.sec-tab {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  background: transparent;
  border-radius: $card-radius-sm;
  transition: all 0.2s;

  &:hover { color: var(--text-1); background: var(--bg-elevated); }

  &.active {
    color: #fff;
    background: var(--brand);
    box-shadow: var(--glow-brand);
  }
}

.section { margin-bottom: $gap-xl; }

.section-heading {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.section-sub {
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: $gap-lg;
}

// Preset grid
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $gap-md;
}

.preset-card {
  padding: $gap-lg;
  cursor: pointer;
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &.selected {
    border-color: var(--brand);
    box-shadow: var(--glow-brand);
  }
}

.preset-swatches {
  display: flex;
  gap: $gap-sm;
  margin-bottom: $gap-md;
}

.swatch {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.2s;

  &.large { width: 48px; height: 48px; border-radius: 10px; }
  &.small { width: 28px; height: 28px; border-radius: 6px; }

  .preset-card:hover & { transform: scale(1.05); }
}

.preset-info {
  h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }
}

.preset-colors {
  display: flex;
  gap: $gap-sm;
}

.color-hex {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-3);
}

.preset-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 0 0 $card-radius $card-radius;
  opacity: 0;
  transition: opacity 0.25s;

  .preset-card:hover &,
  .preset-card.selected & {
    opacity: 1;
  }
}

.selected-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  box-shadow: var(--glow-brand);
}

// Custom theme layout
.custom-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: $gap-lg;
  align-items: start;
}

.custom-form {
  padding: $gap-lg;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  label { font-size: 13px; color: var(--text-2); font-weight: 500; }
}

.color-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $gap-md;
}

.color-pick {
  display: flex;
  flex-direction: column;
  gap: 6px;
  label { font-size: 12px; color: var(--text-3); font-weight: 500; }
}

.color-input-wrap {
  display: flex;
  align-items: center;
  gap: $gap-sm;
}

.color-native {
  width: 36px;
  height: 36px;
  border: 2px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  padding: 0;
  overflow: hidden;

  &::-webkit-color-swatch-wrapper { padding: 2px; }
  &::-webkit-color-swatch { border: none; border-radius: 4px; }
}

.mono-sm {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 8px 10px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $gap-md;
  margin-top: $gap-sm;
  padding-top: $gap-md;
  border-top: 1px solid var(--border);
}

.save-success {
  font-size: 13px;
  color: var(--success);
  font-weight: 600;
}

// Preview panel
.preview-panel {
  position: sticky;
  top: $gap-lg;
}

.preview-card {
  border: 1px solid;
  border-radius: $card-radius;
  overflow: hidden;
  margin-top: $gap-sm;
  margin-bottom: $gap-md;
}

.preview-gradient-bar {
  height: 4px;
  width: 100%;
}

.preview-content {
  padding: $gap-md;
  h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  p { font-size: 13px; margin-bottom: 2px; }
}

.preview-btns {
  display: flex;
  gap: $gap-sm;
  padding: 0 $gap-md $gap-md;
}

.preview-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.preview-swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $gap-sm;
}

.preview-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sw-color {
  width: 100%;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.sw-label {
  font-size: 10px;
  color: var(--text-3);
  font-weight: 600;
  text-transform: uppercase;
}

.sw-hex {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-2);
}

// Frontend theme grid
.frontend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: $gap-md;
}

.frontend-card {
  padding: $gap-md;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &.selected {
    border-color: var(--brand);
    box-shadow: var(--glow-brand);
  }
}

.ft-preview {
  margin-bottom: $gap-md;
}

.ft-browser {
  background: var(--bg-0);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.ft-dots {
  display: flex;
  gap: 5px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-3);
    opacity: 0.4;
  }
}

.ft-screen {
  display: flex;
  height: 80px;
  padding: 6px;
  gap: 6px;
}

.ft-sidebar {
  width: 30%;
  background: var(--bg-1);
  border-radius: 4px;
}

.ft-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ft-block {
  flex: 1;
  background: var(--bg-2);
  border-radius: 4px;
  &.sm { flex: 0.4; }
}

.ft-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 { font-size: 14px; font-weight: 600; }
}

// Export / Import
.export-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-lg;
}

.export-block {
  padding: $gap-lg;
  h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
}

.export-desc {
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: $gap-md;
}

.json-preview {
  background: var(--bg-0);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
  padding: $gap-md;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-2);
  overflow-x: auto;
  max-height: 220px;
  overflow-y: auto;
  margin-bottom: $gap-md;
  white-space: pre;
  line-height: 1.6;
}

.import-area {
  display: block;
  cursor: pointer;
}

.file-input {
  display: none;
}

.import-placeholder {
  border: 2px dashed var(--border);
  border-radius: $card-radius;
  padding: 40px $gap-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $gap-sm;
  color: var(--text-3);
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--brand);
    color: var(--text-2);
    background: rgba(var(--brand-rgb), 0.04);
  }
}

.import-icon {
  font-size: 28px;
  display: block;
  width: 48px;
  height: 48px;
  line-height: 48px;
  text-align: center;
  background: var(--bg-elevated);
  border-radius: 50%;
}

// Transitions
.fade-slide-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: $bp-tablet) {
  .custom-layout { grid-template-columns: 1fr; }
  .export-layout { grid-template-columns: 1fr; }
  .preview-panel { position: static; }
}

@media (max-width: $bp-mobile) {
  .preset-grid { grid-template-columns: 1fr; }
  .frontend-grid { grid-template-columns: 1fr; }
  .color-row { grid-template-columns: 1fr; }
  .section-tabs { flex-wrap: wrap; }
}
</style>

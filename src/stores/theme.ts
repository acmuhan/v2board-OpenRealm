import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeId = 'default' | 'emerald' | 'violet' | 'sunset' | 'rose' | 'cyan' | 'midnight' | 'neon' | 'aurora' | 'gold' | 'sakura' | 'ocean' | 'forest' | 'crimson' | 'usdt' | 'light' | 'light-warm'

export const LIGHT_THEMES: ThemeId[] = ['light', 'light-warm']

export const themes: { id: ThemeId; name: string; colors: [string, string]; light?: boolean }[] = [
  // ── Dark themes ──
  { id: 'default',    name: '深蓝',   colors: ['#2563eb', '#10b981'] },
  { id: 'emerald',    name: '翡翠',   colors: ['#059669', '#2563eb'] },
  { id: 'violet',     name: '紫罗兰', colors: ['#7c3aed', '#ec4899'] },
  { id: 'sunset',     name: '日落',   colors: ['#ea580c', '#eab308'] },
  { id: 'rose',       name: '玫瑰',   colors: ['#e11d48', '#a855f7'] },
  { id: 'cyan',       name: '青蓝',   colors: ['#0891b2', '#14b8a6'] },
  { id: 'midnight',   name: '深夜',   colors: ['#a855f7', '#06b6d4'] },
  { id: 'neon',       name: '霓虹',   colors: ['#22c55e', '#f0abfc'] },
  { id: 'aurora',     name: '极光',   colors: ['#34d399', '#818cf8'] },
  { id: 'gold',       name: '金色',   colors: ['#f59e0b', '#fb923c'] },
  { id: 'sakura',     name: '樱花',   colors: ['#f472b6', '#fb7185'] },
  { id: 'ocean',      name: '深海',   colors: ['#0ea5e9', '#6366f1'] },
  { id: 'forest',     name: '森林',   colors: ['#16a34a', '#84cc16'] },
  { id: 'crimson',    name: '深红',   colors: ['#dc2626', '#f97316'] },
  { id: 'usdt',       name: 'USDT',   colors: ['#26a17b', '#f0b90b'] },
  // ── Light themes ──
  { id: 'light',      name: '浅色',   colors: ['#1d4ed8', '#059669'], light: true },
  { id: 'light-warm', name: '暖白',   colors: ['#c2410c', '#b45309'], light: true },
]

export const useThemeStore = defineStore('theme', () => {
  const validIds = themes.map(t => t.id)
  const stored = localStorage.getItem('or_theme') as ThemeId
  const current = ref<ThemeId>(validIds.includes(stored) ? stored : 'default')

  // Last used dark theme — so we can toggle back from light
  const lastDark = ref<ThemeId>(
    LIGHT_THEMES.includes(current.value) ? 'default' : current.value
  )

  const isLight = computed(() => LIGHT_THEMES.includes(current.value))

  function setTheme(id: ThemeId) {
    if (!LIGHT_THEMES.includes(id)) lastDark.value = id
    current.value = id
    localStorage.setItem('or_theme', id)
    applyTheme(id)
  }

  function toggleLight() {
    if (isLight.value) {
      setTheme(lastDark.value)
    } else {
      setTheme('light')
    }
  }

  function applyTheme(id: ThemeId) {
    if (id === 'default') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', id)
    }
  }

  // Apply on load
  applyTheme(current.value)

  return { current, isLight, setTheme, toggleLight, themes }
})

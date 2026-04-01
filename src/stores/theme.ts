import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeId = 'default' | 'emerald' | 'violet' | 'sunset' | 'rose' | 'cyan'

export const themes: { id: ThemeId; name: string; colors: [string, string] }[] = [
  { id: 'default', name: '深蓝', colors: ['#2563eb', '#10b981'] },
  { id: 'emerald', name: '翡翠', colors: ['#059669', '#2563eb'] },
  { id: 'violet', name: '紫罗兰', colors: ['#7c3aed', '#ec4899'] },
  { id: 'sunset', name: '日落', colors: ['#ea580c', '#eab308'] },
  { id: 'rose', name: '玫瑰', colors: ['#e11d48', '#a855f7'] },
  { id: 'cyan', name: '青蓝', colors: ['#0891b2', '#14b8a6'] },
]

export const useThemeStore = defineStore('theme', () => {
  const current = ref<ThemeId>((localStorage.getItem('or_theme') as ThemeId) || 'default')

  function setTheme(id: ThemeId) {
    current.value = id
    localStorage.setItem('or_theme', id)
    applyTheme(id)
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

  return { current, setTheme, themes }
})

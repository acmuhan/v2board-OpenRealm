import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './locales'
import App from './App.vue'
import './assets/styles/global.scss'

// Restore custom theme CSS variables if admin saved a custom theme
try {
  const savedCustomTheme = localStorage.getItem('or_custom_theme')
  if (savedCustomTheme) {
    const c = JSON.parse(savedCustomTheme)
    const root = document.documentElement
    if (c.brand) root.style.setProperty('--brand', c.brand)
    if (c.brandLight) root.style.setProperty('--brand-light', c.brandLight)
    if (c.accent) root.style.setProperty('--accent', c.accent)
    if (c.bg0) root.style.setProperty('--bg-0', c.bg0)
    if (c.bg1) root.style.setProperty('--bg-1', c.bg1)
    if (c.bg2) { root.style.setProperty('--bg-2', c.bg2); root.style.setProperty('--bg-card', c.bg2) }
    if (c.text1) root.style.setProperty('--text-1', c.text1)
    if (c.text2) root.style.setProperty('--text-2', c.text2)
    if (c.text3) root.style.setProperty('--text-3', c.text3)
  }
} catch { /* ignore */ }

// Sync V2Board injected config (from dashboard.blade.php) to localStorage
const orConfig = (window as any).__OR_CONFIG__
if (orConfig) {
  if (orConfig.theme && !localStorage.getItem('or_theme'))
    localStorage.setItem('or_theme', orConfig.theme)
  if (orConfig.locale && !localStorage.getItem('or_locale'))
    localStorage.setItem('or_locale', orConfig.locale)
  // adminPath is always synced (server-controlled)
  if (orConfig.adminPath)
    localStorage.setItem('or_admin_path', orConfig.adminPath)
}

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount('#app')

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './locales'
import App from './App.vue'
import './assets/styles/global.scss'

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

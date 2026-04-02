import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const info = ref<Record<string, any> | null>(null)
  const stat = ref<Record<string, any> | null>(null)
  const subscribe = ref<Record<string, any> | null>(null)
  const loading = ref(false)

  // is_admin is only in login response, not in /user/info — persist in localStorage
  const isAdmin = ref(localStorage.getItem('or_is_admin') === '1')

  const isLoggedIn = computed(() => !!localStorage.getItem('or_token'))
  const avatar = computed(() => info.value?.avatar_url || '')
  const email = computed(() => info.value?.email || '')

  // Traffic: u/d come from getSubscribe, NOT from user/info
  const usedTraffic = computed(() => {
    const u = subscribe.value?.u || 0
    const d = subscribe.value?.d || 0
    return u + d
  })
  // transfer_enable is in bytes in both info and subscribe
  const totalTraffic = computed(() =>
    info.value?.transfer_enable || subscribe.value?.transfer_enable || 0,
  )
  const trafficPercent = computed(() => {
    if (!totalTraffic.value) return 0
    return Math.min(100, Math.round((usedTraffic.value / totalTraffic.value) * 100))
  })

  // Called after login — stores token + admin flag
  function setLogin(data: { token?: string; auth_data?: string; is_admin?: number }) {
    const token = data.auth_data || data.token || ''
    localStorage.setItem('or_token', token)
    isAdmin.value = !!data.is_admin
    if (data.is_admin) {
      localStorage.setItem('or_is_admin', '1')
    } else {
      localStorage.removeItem('or_is_admin')
    }
  }

  async function fetchInfo() {
    loading.value = true
    try {
      const res: any = await userApi.getInfo()
      info.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchStat() {
    try {
      const res: any = await userApi.getStat()
      stat.value = res.data
    } catch {
      // getStat endpoint may not exist on all v2board forks — ignore silently
    }
  }

  async function fetchSubscribe() {
    const res: any = await userApi.getSubscribe()
    subscribe.value = res.data
  }

  function logout() {
    localStorage.removeItem('or_token')
    localStorage.removeItem('or_is_admin')
    isAdmin.value = false
    info.value = null
    stat.value = null
    subscribe.value = null
  }

  function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0 || !isFinite(bytes)) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.min(
      Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))),
      sizes.length - 1,
    )
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    info, stat, subscribe, loading, isAdmin,
    isLoggedIn, avatar, email, usedTraffic, totalTraffic, trafficPercent,
    setLogin, fetchInfo, fetchStat, fetchSubscribe, logout, formatBytes,
  }
})

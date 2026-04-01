import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const info = ref<Record<string, any> | null>(null)
  const stat = ref<Record<string, any> | null>(null)
  const subscribe = ref<Record<string, any> | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!localStorage.getItem('or_token'))
  const avatar = computed(() => info.value?.avatar_url || '')
  const email = computed(() => info.value?.email || '')

  // Traffic helpers
  const usedTraffic = computed(() => {
    if (!info.value) return 0
    return ((info.value.u || 0) + (info.value.d || 0))
  })
  const totalTraffic = computed(() => info.value?.transfer_enable || 0)
  const trafficPercent = computed(() => {
    if (!totalTraffic.value) return 0
    return Math.min(100, Math.round((usedTraffic.value / totalTraffic.value) * 100))
  })

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
    const res: any = await userApi.getStat()
    stat.value = res.data
  }

  async function fetchSubscribe() {
    const res: any = await userApi.getSubscribe()
    subscribe.value = res.data
  }

  function logout() {
    localStorage.removeItem('or_token')
    info.value = null
    stat.value = null
    subscribe.value = null
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    info, stat, subscribe, loading,
    isLoggedIn, avatar, email, usedTraffic, totalTraffic, trafficPercent,
    fetchInfo, fetchStat, fetchSubscribe, logout, formatBytes,
  }
})

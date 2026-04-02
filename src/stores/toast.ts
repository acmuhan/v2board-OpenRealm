import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function show(message: string, type: ToastItem['type'] = 'info', duration = 3000) {
    const id = ++nextId
    items.value.push({ id, message, type })
    setTimeout(() => {
      items.value = items.value.filter(t => t.id !== id)
    }, duration)
  }

  const success = (msg: string) => show(msg, 'success')
  const error = (msg: string) => show(msg, 'error')
  const info = (msg: string) => show(msg, 'info')

  return { items, show, success, error, info }
})

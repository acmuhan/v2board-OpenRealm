import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import i18n, { LOCALE_STORAGE_KEY, type LocaleKey } from '../locales'

export const useLocaleStore = defineStore('locale', () => {
  const current = ref<LocaleKey>(
    (localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleKey) || 'zh-CN'
  )

  function setLocale(locale: LocaleKey) {
    current.value = locale
    i18n.global.locale.value = locale
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.setAttribute('lang', locale)
  }

  // Keep i18n in sync if current changes externally
  watch(current, (val) => {
    if (i18n.global.locale.value !== val) {
      setLocale(val)
    }
  })

  // Apply on initial load
  document.documentElement.setAttribute('lang', current.value)

  return { current, setLocale }
})

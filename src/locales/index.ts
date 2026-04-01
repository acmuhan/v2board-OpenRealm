import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import en from './en'

export type LocaleKey = 'zh-CN' | 'en'

export const LOCALE_STORAGE_KEY = 'or_locale'

const defaultLocale: LocaleKey =
  (localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleKey) || 'zh-CN'

const i18n = createI18n({
  legacy: false, // use Composition API mode
  locale: defaultLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export default i18n

# OpenRealm — V2Board Frontend

A modern, themeable frontend for V2Board built with Vue 3 + TypeScript + Vite.

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![i18n](https://img.shields.io/badge/i18n-zh--CN%20%7C%20en-blue)

## Features

- **Dual Panel** — Full user panel + complete admin management backend
- **Themeable** — CSS custom properties with light/dark/violet themes and real-time switching
- **i18n** — Chinese (default) and English, switchable at runtime with `localStorage` persistence
- **Responsive** — Sidebar + main content layout, mobile-friendly
- **Secure Admin Path** — Configurable admin entry point via `localStorage` (anti-detection)
- **109 Admin API Endpoints** — Full coverage of V2Board admin API across 14 modules

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript 5.9 |
| Build | Vite 8 |
| State | Pinia 3 |
| Router | Vue Router 4 |
| HTTP | Axios |
| Styling | SCSS + CSS Custom Properties |
| i18n | vue-i18n 9 |
| Utilities | @vueuse/core |

## Project Structure

```
src/
├── api/              # HTTP client & admin API (109 endpoints)
├── assets/styles/    # SCSS variables & global styles
├── components/
│   ├── common/       # SvgIcon, shared components
│   └── layout/       # AppLayout, Sidebar, AdminLayout, AdminSidebar
├── locales/          # zh-CN, en translations
├── router/           # Vue Router config (user + admin routes)
├── stores/           # Pinia stores (user, theme, locale)
└── views/
    ├── *.vue         # 12 user pages (Dashboard, Shop, Nodes, Orders, etc.)
    └── admin/        # 16 admin pages (Dashboard, Users, Plans, Servers, etc.)
```

## Admin Pages

| Page | Description |
|------|-------------|
| Dashboard | Stats overview, revenue chart, server/user rankings |
| Users | User management with search, filter, ban, balance edit |
| Plans | Subscription plan CRUD with drag-sort |
| Orders | Order management with assign, paid, cancel actions |
| Servers | Multi-protocol node management (Trojan/VMess/VLESS/SS/TUIC/Hysteria/AnyTLS) |
| Server Groups | Node group management |
| Server Routes | Route/relay rule management |
| Tickets | Support ticket system with threaded replies |
| Coupons | Coupon generation and management |
| Giftcards | Gift card batch generation |
| Notices | Announcement management |
| Knowledge | Knowledge base with category sorting |
| Payment | Payment gateway configuration |
| Config | System settings (site, email, Telegram, subscribe) |
| Theme | Theme configuration and management |
| System | System monitor, queue stats, logs |

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Theme System

Themes use CSS custom properties defined in `src/stores/theme.ts`:

```ts
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
theme.setTheme('dark')   // 'light' | 'dark' | 'violet'
```

Key variables: `--bg-1`, `--bg-2`, `--bg-3`, `--text-1`, `--text-2`, `--brand`, `--grad-brand`, etc.

## i18n

```ts
import { useLocaleStore } from '@/stores/locale'
const locale = useLocaleStore()
locale.setLocale('en')   // 'zh-CN' | 'en'
```

## License

MIT

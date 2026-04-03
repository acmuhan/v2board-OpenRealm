<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SvgIcon from '../common/SvgIcon.vue'
import { useUserStore } from '../../stores/user'
import { useThemeStore, themes } from '../../stores/theme'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const showThemes = ref(false)
const isOpen = ref(false)

const orConfig = (window as any).__OR_CONFIG__ || {}
const siteTitle = orConfig.title || 'OpenRealm'

const darkThemes = computed(() => themes.filter(th => !th.light))
const lightThemes = computed(() => themes.filter(th => th.light))

const navGroups = computed(() => [
  { label: t('nav.groupOverview'), items: [
    { path: '/', icon: 'dashboard', text: t('nav.dashboard') },
    { path: '/tutorial', icon: 'book', text: t('nav.tutorial') },
  ]},
  { label: t('nav.groupService'), items: [
    { path: '/shop', icon: 'shop', text: t('nav.shop') },
    { path: '/nodes', icon: 'server', text: t('nav.nodes') },
  ]},
  { label: t('nav.groupAccount'), items: [
    { path: '/orders', icon: 'order', text: t('nav.orders') },
    { path: '/invite', icon: 'invite', text: t('nav.invite') },
    { path: '/traffic', icon: 'traffic', text: t('nav.traffic') },
  ]},
  { label: t('nav.groupSupport'), items: [
    { path: '/tickets', icon: 'ticket', text: t('nav.tickets') },
    { path: '/knowledge', icon: 'knowledge', text: t('nav.knowledge') },
    { path: '/settings', icon: 'settings', text: t('nav.settings') },
  ]},
])

const isAdmin = computed(() => userStore.isAdmin)

const isActive = (path: string) => path === '/' ? route.path === '/' : route.path.startsWith(path)
function handleLogout() { userStore.logout(); router.push('/login') }
function navigate(path: string) { isOpen.value = false; router.push(path) }

let touchStartX = 0
let touchStartY = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}
function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  // Only horizontal swipe, left direction (negative dx), not mostly vertical
  if (dx < -50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    isOpen.value = false
  }
}
</script>

<template>
  <!-- Mobile hamburger button -->
  <button class="hamburger" @click="isOpen = true" aria-label="菜单">
    <span></span><span></span><span></span>
  </button>

  <!-- Mobile overlay -->
  <div v-if="isOpen" class="sidebar-overlay" @click="isOpen = false"></div>

  <aside :class="['sidebar', { 'sidebar-open': isOpen }]" @touchstart="onTouchStart" @touchmove="onTouchMove">
    <!-- Logo -->
    <div class="sidebar-logo" @click="navigate('/')">
      <div class="logo-mark">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="var(--brand)" stroke-width="2"/>
          <path d="M12 7v10M7 9.5l5 3 5-3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="logo-text">{{ siteTitle }}</span>
      <!-- Close button on mobile -->
      <button class="sidebar-close" @click="isOpen = false" aria-label="关闭">✕</button>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div v-for="group in navGroups" :key="group.label" class="nav-group">
        <span class="nav-label">{{ group.label }}</span>
        <a
          v-for="item in group.items"
          :key="item.path"
          href="javascript:void(0)"
          :class="['nav-item', { active: isActive(item.path) }]"
          @click="navigate(item.path)"
        >
          <div class="nav-icon-wrap">
            <SvgIcon :name="item.icon" :size="16" />
          </div>
          <span>{{ item.text }}</span>
          <div v-if="isActive(item.path)" class="active-indicator"></div>
        </a>
      </div>
    </nav>

    <!-- Theme Picker -->
    <div class="theme-section">
      <button class="theme-toggle" @click="showThemes = !showThemes">
        <div class="theme-dots">
          <span class="td" v-for="th in themes.slice(0, 4)" :key="th.id" :style="{ background: th.colors[0] }"></span>
        </div>
        <span class="theme-toggle-label">{{ t('nav.theme') }}</span>
        <span class="theme-current-badge">{{ themes.find(th => th.id === themeStore.current)?.name || '深蓝' }}</span>
        <svg class="theme-chevron" :class="{ open: showThemes }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <transition name="fade-slide">
        <div v-if="showThemes" class="theme-picker">
          <!-- Dark themes -->
          <div class="theme-group-label">暗色</div>
          <button
            v-for="th in darkThemes" :key="th.id"
            :class="['theme-opt', { active: themeStore.current === th.id }]"
            @click="themeStore.setTheme(th.id)"
          >
            <div class="theme-preview" :style="{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})` }"></div>
            <span>{{ th.name }}</span>
          </button>
          <!-- Light themes -->
          <div class="theme-group-label light-label">浅色</div>
          <button
            v-for="th in lightThemes" :key="th.id"
            :class="['theme-opt light-opt', { active: themeStore.current === th.id }]"
            @click="themeStore.setTheme(th.id)"
          >
            <div class="theme-preview light-preview" :style="{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})` }"></div>
            <span>{{ th.name }}</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- Admin Panel Link (admin users only) -->
    <div v-if="isAdmin" class="admin-link-row">
      <a href="javascript:void(0)" class="admin-panel-link" @click="navigate('/admin')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{{ t('nav.adminPanel') }}</span>
      </a>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="user-row">
        <div class="user-status"></div>
        <span class="user-name">{{ userStore.info?.email?.split('@')[0] || 'User' }}</span>
      </div>
      <div class="footer-actions">
        <!-- Light/Dark mode quick toggle -->
        <button
          class="icon-btn"
          :title="themeStore.isLight ? '切换暗色' : '切换浅色'"
          @click="themeStore.toggleLight()"
        >
          <!-- Sun icon when dark mode (click to go light) -->
          <svg v-if="!themeStore.isLight" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <!-- Moon icon when light mode (click to go dark) -->
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        </button>
        <button class="icon-btn logout-btn" @click="handleLogout" title="退出登录">
          <SvgIcon name="logout" :size="15" />
        </button>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.sidebar {
  position: fixed;
  left: 0; top: 0;
  width: $sidebar-width;
  height: 100vh;
  background: var(--bg-1);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: $z-sidebar;
  padding: 20px 14px;
}

// Logo
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 0 8px; margin-bottom: 28px; cursor: pointer;
}
.logo-mark {
  width: 34px; height: 34px;
  background: var(--bg-2);
  border-radius: 10px;
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  transition: box-shadow 0.3s;
  .sidebar-logo:hover & { box-shadow: var(--glow-brand); }
}
.logo-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px; font-weight: 700;
  color: var(--text-1); letter-spacing: -0.3px;
}

// Nav
.sidebar-nav { flex: 1; overflow-y: auto; }
.nav-group { margin-bottom: 18px; }
.nav-label {
  display: block; padding: 0 8px; margin-bottom: 4px;
  font-size: 10px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 1.2px;
  font-family: 'Space Grotesk', sans-serif;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px;
  color: var(--text-2); font-size: 13px; font-weight: 500;
  text-decoration: none; margin-bottom: 1px;
  position: relative;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: var(--text-1);
    background: var(--bg-hover);
  }

  &.active {
    color: #fff;
    background: var(--brand);
    box-shadow: 0 2px 8px rgba(var(--brand-rgb), 0.25);
    .nav-icon-wrap { background: rgba(255,255,255,0.15); }
  }
}
.nav-icon-wrap {
  width: 26px; height: 26px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.active-indicator {
  position: absolute;
  right: -14px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 16px; border-radius: 3px;
  background: var(--brand);
}

// Theme
.theme-section {
  padding: 0 4px; margin-bottom: $gap-md;
}
.theme-toggle {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 8px 10px;
  background: var(--bg-2); border-radius: 8px;
  color: var(--text-2); font-size: 12px;
  transition: background 0.15s;
  &:hover { background: var(--bg-card-hover); }
}
.theme-toggle-label { flex: 1; text-align: left; }
.theme-current-badge {
  font-size: 10px; font-weight: 600;
  color: var(--brand-light);
  background: rgba(var(--brand-rgb), 0.12);
  padding: 2px 6px; border-radius: 4px;
}
.theme-chevron {
  color: var(--text-3);
  transition: transform 0.2s;
  &.open { transform: rotate(180deg); }
}
.theme-dots {
  display: flex; gap: 3px;
}
.td {
  width: 8px; height: 8px; border-radius: 50%;
  display: inline-block;
}

.theme-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 6px;
  padding: 8px;
  background: var(--bg-2);
  border-radius: 10px;
  border: 1px solid var(--border);
  max-height: 300px;
  overflow-y: auto;
}
.theme-group-label {
  grid-column: 1 / -1;
  font-size: 9px; font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 4px 2px 2px;
  &:not(:first-child) {
    border-top: 1px solid var(--border);
    margin-top: 4px;
    padding-top: 8px;
  }
  &.light-label { color: var(--brand-light); }
}
.theme-opt {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  padding: 8px 4px;
  border-radius: 6px;
  background: transparent;
  color: var(--text-3);
  font-size: 10px;
  transition: all 0.15s;
  &:hover { background: var(--bg-hover); color: var(--text-1); }
  &.active {
    background: rgba(var(--brand-rgb), 0.12);
    color: var(--brand-light);
  }
}
.theme-preview {
  width: 24px; height: 24px; border-radius: 6px;
}
.light-preview {
  border: 1.5px solid var(--border);
}

// Admin link
.admin-link-row {
  padding: 0 4px;
  margin-bottom: $gap-sm;
}
.admin-panel-link {
  display: flex; align-items: center; gap: $gap-sm;
  padding: 9px 10px; border-radius: 8px;
  color: var(--brand-light); font-size: 13px; font-weight: 600;
  text-decoration: none;
  background: rgba(var(--brand-rgb), 0.08);
  border: 1px solid rgba(var(--brand-rgb), 0.15);
  transition: all 0.15s;
  &:hover {
    background: rgba(var(--brand-rgb), 0.14);
    border-color: rgba(var(--brand-rgb), 0.3);
  }
}

// Footer
.sidebar-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 8px 0; border-top: 1px solid var(--border);
}
.user-row { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.user-status {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent);
  box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5);
  animation: pulse-ring 2.5s infinite;
}
.user-name {
  font-size: 12px; font-weight: 600; color: var(--text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.footer-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.icon-btn {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: var(--text-3);
  transition: all 0.15s;
  &:hover { background: var(--bg-hover); color: var(--text-2); }
}
.logout-btn {
  &:hover { background: rgba(239,68,68,0.1) !important; color: var(--danger) !important; }
}

// Sidebar on mobile: hidden by default, slide-in when open
@media (max-width: $bp-tablet) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: $z-modal;
    box-shadow: var(--shadow-lg);
  }
  .sidebar-open {
    transform: translateX(0);
  }
  .sidebar-close {
    display: flex !important;
  }
}

// Hamburger — hidden now that mobile uses bottom tab bar
.hamburger {
  display: none;
  @media (max-width: 0px) { // disabled — mobile uses bottom tabbar instead
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    position: fixed;
    top: 14px;
    left: 14px;
    z-index: $z-header;
    width: 38px; height: 38px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px;
    cursor: pointer;
    span {
      display: block;
      height: 2px;
      background: var(--text-1);
      border-radius: 2px;
      transition: all 0.2s;
    }
  }
}

// Close button inside sidebar — mobile only
.sidebar-close {
  display: none;
  margin-left: auto;
  background: transparent;
  border: none;
  color: var(--text-3);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  &:hover { color: var(--text-1); }
}

// Overlay
.sidebar-overlay {
  display: none;
  @media (max-width: $bp-tablet) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: calc(#{$z-modal} - 1);
    backdrop-filter: blur(2px);
  }
}
</style>

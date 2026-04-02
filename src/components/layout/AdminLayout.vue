<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from './AdminSidebar.vue'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()
const searchQuery = ref('')
const showLocale = ref(false)
const currentLocale = ref<'zh' | 'en'>('zh')
const adminSidebarOpen = ref(false)

const locales = [
  { id: 'zh' as const, label: '中文' },
  { id: 'en' as const, label: 'English' },
]

function switchLocale(id: 'zh' | 'en') {
  currentLocale.value = id
  showLocale.value = false
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function handleSearch() {
  if (!searchQuery.value.trim()) return
  // Future: integrate admin search
}

onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.info) {
    try {
      await userStore.fetchInfo()
    } catch { /* handled by interceptor */ }
  }
})
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile hamburger -->
    <button class="admin-hamburger" @click="adminSidebarOpen = true" aria-label="菜单">
      <span></span><span></span><span></span>
    </button>

    <!-- Mobile overlay -->
    <div v-if="adminSidebarOpen" class="admin-overlay" @click="adminSidebarOpen = false"></div>

    <AdminSidebar :open="adminSidebarOpen" @close="adminSidebarOpen = false" />

    <div class="admin-main">
      <!-- Top Bar -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <div class="search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="搜索用户、订单、工单..."
              @keydown.enter="handleSearch"
            />
            <kbd class="search-kbd">/</kbd>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Locale Switcher -->
          <div class="locale-switcher">
            <button class="locale-btn" @click="showLocale = !showLocale">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              <span>{{ currentLocale === 'zh' ? '中文' : 'EN' }}</span>
            </button>
            <transition name="fade-slide">
              <div v-if="showLocale" class="locale-dropdown">
                <button
                  v-for="loc in locales"
                  :key="loc.id"
                  :class="['locale-option', { active: currentLocale === loc.id }]"
                  @click="switchLocale(loc.id)"
                >
                  {{ loc.label }}
                </button>
              </div>
            </transition>
          </div>

          <!-- Admin User Info -->
          <div class="admin-user">
            <div class="admin-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div class="admin-user-info">
              <span class="admin-user-name">{{ userStore.info?.email?.split('@')[0] || 'Admin' }}</span>
              <span class="admin-user-role">管理员</span>
            </div>
          </div>

          <!-- Logout -->
          <button class="topbar-logout" @click="handleLogout" title="退出登录">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

$admin-sidebar-width: 260px;

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-0);
}

.admin-main {
  flex: 1;
  margin-left: $admin-sidebar-width;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: calc(100vw - #{$admin-sidebar-width});

  @media (max-width: $bp-tablet) {
    margin-left: 0;
    max-width: 100vw;
  }
}

// ── Top Bar ──
.admin-topbar {
  position: sticky;
  top: 0;
  z-index: $z-header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $gap-md;
  height: 60px;
  padding: 0 $gap-xl;
  background: rgba(var(--brand-rgb), 0.02);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);

  @media (max-width: $bp-tablet) {
    padding: 0 $gap-md;
  }
}

.topbar-left {
  flex: 1;
  max-width: 420px;

  @media (max-width: $bp-tablet) {
    display: none;
  }
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 40px 8px 36px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
  color: var(--text-1);
  font-size: 13px;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder {
    color: var(--text-3);
  }

  &:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.08);
  }
}

.search-kbd {
  position: absolute;
  right: 10px;
  padding: 1px 6px;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-3);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.6;
  pointer-events: none;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: $gap-sm;
}

// ── Locale Switcher ──
.locale-switcher {
  position: relative;
}

.locale-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-2);
  border-radius: $card-radius-sm;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border);
  transition: all 0.15s;

  &:hover {
    border-color: var(--border-active);
    color: var(--text-1);
  }
}

.locale-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 100px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
  padding: 4px;
  box-shadow: var(--shadow-md);
  z-index: $z-modal;
}

.locale-option {
  display: block;
  width: 100%;
  padding: 6px 10px;
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
  border-radius: 6px;
  text-align: left;
  transition: all 0.12s;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-1);
  }

  &.active {
    background: rgba(var(--brand-rgb), 0.1);
    color: var(--brand-light);
  }
}

// ── Admin User ──
.admin-user {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: 6px 12px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: $card-radius-sm;
}

.admin-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.admin-user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  @media (max-width: $bp-mobile) {
    display: none;
  }
}

.admin-user-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-1);
}

.admin-user-role {
  font-size: 10px;
  color: var(--text-3);
}

.topbar-logout {
  width: 34px;
  height: 34px;
  border-radius: $card-radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-3);
  transition: all 0.15s;

  &:hover {
    background: rgba(239, 68, 68, 0.08);
    color: var(--danger);
  }
}

// ── Content Area ──
.admin-content {
  flex: 1;
  padding: $gap-lg $gap-xl;

  @media (max-width: $bp-tablet) {
    padding: $gap-md;
    padding-top: calc(60px + $gap-md);
  }
}

// ── Mobile Hamburger ──
.admin-hamburger {
  display: none;

  @media (max-width: $bp-tablet) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    position: fixed;
    top: 14px;
    left: 14px;
    z-index: calc(#{$z-header} + 1);
    width: 38px;
    height: 38px;
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
    }
  }
}

// ── Mobile Overlay ──
.admin-overlay {
  display: none;

  @media (max-width: $bp-tablet) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: calc(#{$z-modal} - 1);
    backdrop-filter: blur(2px);
  }
}
</style>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'
import SvgIcon from '../common/SvgIcon.vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.info) {
    try {
      await Promise.all([
        userStore.fetchInfo(),
        userStore.fetchSubscribe(),
      ])
    } catch { /* handled by interceptor */ }
    userStore.fetchStat()
  }
})

const mobileNav = [
  { path: '/',        icon: 'dashboard', label: '概览' },
  { path: '/shop',    icon: 'shop',      label: '订阅' },
  { path: '/nodes',   icon: 'server',    label: '节点' },
  { path: '/settings',icon: 'settings',  label: '设置' },
]

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <!-- Mobile bottom tab bar -->
    <nav class="mobile-tabbar">
      <a
        v-for="item in mobileNav"
        :key="item.path"
        href="javascript:void(0)"
        :class="['tab-item', { active: isActive(item.path) }]"
        @click="router.push(item.path)"
      >
        <SvgIcon :name="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </a>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: $sidebar-width;
  padding: $gap-lg $gap-xl;
  min-height: 100vh;
  max-width: calc(100vw - #{$sidebar-width});

  @media (max-width: $bp-tablet) {
    margin-left: 0;
    max-width: 100vw;
    padding: $gap-md;
    padding-top: 14px; // no hamburger — bottom bar handles nav
    padding-bottom: 72px; // clear bottom tabbar
  }
}

// Mobile tab bar — hidden on desktop
.mobile-tabbar {
  display: none;
  @media (max-width: $bp-tablet) {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    background: var(--bg-1);
    border-top: 1px solid var(--border);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: $z-header;
    padding: 0 4px;
    // iOS safe area
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-3);
  font-size: 10px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 10px;
  margin: 6px 2px;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:active { transform: scale(0.92); }

  &.active {
    color: var(--brand-light);
    background: rgba(var(--brand-rgb), 0.10);
  }

  span { font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.2px; }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'
import SvgIcon from '../common/SvgIcon.vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const showImport = ref(false)

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
  { path: '/',        icon: 'dashboard', label: '概览', action: 'navigate' },
  { path: '/shop',    icon: 'shop',      label: '订阅', action: 'navigate' },
  { path: 'import',   icon: 'qrcode',    label: '导入', action: 'import' },
  { path: '/settings',icon: 'settings',  label: '设置', action: 'navigate' },
]

function isActive(path: string) {
  if (path === 'import') return false
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}

function handleTabClick(item: typeof mobileNav[0]) {
  if (item.action === 'import') {
    showImport.value = true
  } else {
    router.push(item.path)
  }
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
        @click="handleTabClick(item)"
      >
        <SvgIcon :name="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </a>
    </nav>
  </div>

  <!-- Import Modal -->
  <teleport to="body">
    <transition name="fade">
      <div v-if="showImport" class="import-modal" @click.self="showImport = false">
        <div class="import-sheet">
          <p class="import-title">导入订阅</p>
          <div class="import-apps">
            <a
              :href="`clash://install-config?url=${encodeURIComponent(userStore.subscribe?.subscribe_url || '')}`"
              class="import-app-btn"
              @click="showImport = false"
            >
              <div class="import-app-icon" style="background: linear-gradient(135deg, #2563eb, #7c3aed);">
                <span>⚡</span>
              </div>
              <span>Clash</span>
            </a>
            <a
              :href="`shadowrocket://add/sub?uri=${encodeURIComponent(userStore.subscribe?.subscribe_url || '')}`"
              class="import-app-btn"
              @click="showImport = false"
            >
              <div class="import-app-icon" style="background: linear-gradient(135deg, #e11d48, #ea580c);">
                <span>🚀</span>
              </div>
              <span>Shadowrocket</span>
            </a>
            <a
              :href="userStore.subscribe?.subscribe_url || ''"
              class="import-app-btn"
              @click="showImport = false"
            >
              <div class="import-app-icon" style="background: linear-gradient(135deg, #059669, #0891b2);">
                <span>V</span>
              </div>
              <span>v2rayNG</span>
            </a>
          </div>
          <button class="import-cancel" @click="showImport = false">取消</button>
        </div>
      </div>
    </transition>
  </teleport>
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

// Import modal styles (not scoped to allow Teleport to body)
</style>

<style lang="scss">
.import-modal {
  position: fixed; inset: 0; z-index: 300;
  display: flex; align-items: flex-end;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
}
.import-sheet {
  width: 100%; background: var(--bg-1);
  border-radius: 20px 20px 0 0;
  border-top: 1px solid var(--border);
  padding: 20px 20px 40px;
}
.import-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: var(--text-1); }
.import-apps { display: flex; flex-direction: column; gap: 10px; }
.import-app-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
  background: var(--bg-elevated); border: 1px solid var(--border);
  color: var(--text-1); font-size: 14px; font-weight: 500;
  text-decoration: none; cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: rgba(var(--brand-rgb), 0.3); }
}
.import-app-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.import-cancel {
  margin-top: 12px; width: 100%; padding: 14px;
  border-radius: 12px; background: var(--bg-elevated);
  border: 1px solid var(--border); color: var(--text-2);
  font-size: 14px; font-weight: 500; cursor: pointer;
}
</style>

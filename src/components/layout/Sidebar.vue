<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '../common/SvgIcon.vue'
import { useUserStore } from '../../stores/user'
import { useThemeStore, themes } from '../../stores/theme'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const showThemes = ref(false)

const navGroups = [
  { label: '概览', items: [
    { path: '/', icon: 'dashboard', text: '控制台' },
    { path: '/tutorial', icon: 'book', text: '使用教程' },
  ]},
  { label: '服务', items: [
    { path: '/shop', icon: 'shop', text: '订阅计划' },
    { path: '/nodes', icon: 'server', text: '节点状态' },
  ]},
  { label: '账户', items: [
    { path: '/orders', icon: 'order', text: '订单记录' },
    { path: '/invite', icon: 'invite', text: '推荐返利' },
    { path: '/traffic', icon: 'traffic', text: '用量统计' },
  ]},
  { label: '支持', items: [
    { path: '/tickets', icon: 'ticket', text: '工单' },
    { path: '/knowledge', icon: 'knowledge', text: '帮助文档' },
    { path: '/settings', icon: 'settings', text: '设置' },
  ]},
]

const isActive = (path: string) => path === '/' ? route.path === '/' : route.path.startsWith(path)
function handleLogout() { userStore.logout(); router.push('/login') }
</script>

<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo" @click="router.push('/')">
      <div class="logo-mark">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="var(--brand)" stroke-width="2"/>
          <path d="M12 7v10M7 9.5l5 3 5-3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="logo-text">OpenRealm</span>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div v-for="group in navGroups" :key="group.label" class="nav-group">
        <span class="nav-label">{{ group.label }}</span>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
        >
          <div class="nav-icon-wrap">
            <SvgIcon :name="item.icon" :size="16" />
          </div>
          <span>{{ item.text }}</span>
          <div v-if="isActive(item.path)" class="active-indicator"></div>
        </router-link>
      </div>
    </nav>

    <!-- Theme Picker -->
    <div class="theme-section">
      <button class="theme-toggle" @click="showThemes = !showThemes">
        <div class="theme-dots">
          <span class="td" v-for="t in themes.slice(0, 4)" :key="t.id" :style="{ background: t.colors[0] }"></span>
        </div>
        <span>主题</span>
      </button>
      <transition name="fade-slide">
        <div v-if="showThemes" class="theme-picker">
          <button
            v-for="t in themes" :key="t.id"
            :class="['theme-opt', { active: themeStore.current === t.id }]"
            @click="themeStore.setTheme(t.id)"
          >
            <div class="theme-preview" :style="{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }"></div>
            <span>{{ t.name }}</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="user-row">
        <div class="user-status"></div>
        <span class="user-name">{{ userStore.info?.email?.split('@')[0] || 'User' }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <SvgIcon name="logout" :size="15" />
      </button>
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
    background: rgba(255,255,255,0.03);
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
  display: flex; align-items: center; gap: $gap-sm;
  width: 100%; padding: 8px;
  background: var(--bg-2); border-radius: 8px;
  color: var(--text-2); font-size: 12px;
  transition: background 0.15s;
  &:hover { background: var(--bg-card-hover); }
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
  padding: 6px;
  background: var(--bg-2);
  border-radius: 10px;
  border: 1px solid var(--border);
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
  &:hover { background: rgba(255,255,255,0.03); color: var(--text-1); }
  &.active {
    background: rgba(var(--brand-rgb), 0.12);
    color: var(--brand-light);
  }
}
.theme-preview {
  width: 24px; height: 24px; border-radius: 6px;
}

// Footer
.sidebar-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 8px 0; border-top: 1px solid var(--border);
}
.user-row { display: flex; align-items: center; gap: 8px; }
.user-status {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5);
  animation: pulse-ring 2.5s infinite;
}
.user-name { font-size: 12px; font-weight: 600; color: var(--text-1); }
.logout-btn {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: var(--text-3);
  transition: all 0.15s;
  &:hover { background: rgba(239,68,68,0.1); color: var(--danger); }
}
</style>

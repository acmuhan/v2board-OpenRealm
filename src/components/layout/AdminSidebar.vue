<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore, themes } from '../../stores/theme'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const showThemes = ref(false)

const navGroups = [
  {
    label: '总览',
    items: [
      { path: '/admin', icon: 'dashboard', text: '仪表盘' },
    ],
  },
  {
    label: '运营',
    items: [
      { path: '/admin/users', icon: 'users', text: '用户管理' },
      { path: '/admin/plans', icon: 'plan', text: '订阅管理' },
      { path: '/admin/orders', icon: 'orders', text: '订单管理' },
      { path: '/admin/coupons', icon: 'coupon', text: '优惠券' },
      { path: '/admin/giftcards', icon: 'gift', text: '礼品卡' },
    ],
  },
  {
    label: '节点',
    items: [
      { path: '/admin/servers', icon: 'server', text: '节点管理' },
      { path: '/admin/server-groups', icon: 'group', text: '节点分组' },
      { path: '/admin/server-routes', icon: 'route', text: '路由规则' },
    ],
  },
  {
    label: '内容',
    items: [
      { path: '/admin/tickets', icon: 'ticket', text: '工单管理' },
      { path: '/admin/notices', icon: 'notice', text: '公告管理' },
      { path: '/admin/knowledge', icon: 'knowledge', text: '知识库' },
    ],
  },
  {
    label: '系统',
    items: [
      { path: '/admin/payment', icon: 'payment', text: '支付配置' },
      { path: '/admin/config', icon: 'config', text: '系统配置' },
      { path: '/admin/theme', icon: 'theme', text: '主题管理' },
      { path: '/admin/system', icon: 'system', text: '系统状态' },
    ],
  },
]

// Inline SVG icon paths (Heroicons-style, 24x24 viewBox, stroke-based)
const iconPaths: Record<string, string> = {
  dashboard:
    'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z',
  users:
    'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  plan:
    'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  orders:
    'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  coupon:
    'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
  gift:
    'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  server:
    'M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z',
  group:
    'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  route:
    'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  ticket:
    'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
  notice:
    'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 01-1.021-.27l-.112-.195a8.297 8.297 0 01-.732-2.209m2-4.5v-4.5m0 4.5H17.25a4.5 4.5 0 000-9H10.34m0 9c-.253.962-.584 1.892-.985 2.783',
  knowledge:
    'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
  payment:
    'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  config:
    'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  theme:
    'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125V11.25a1.125 1.125 0 01-.687 1.036l-.003.002-.006.003a2.96 2.96 0 00-.334.196 5.22 5.22 0 00-.762.618 4.495 4.495 0 00-.926 1.397A4.454 4.454 0 006.75 17.25c0 1.036.42 1.974 1.098 2.652',
  system:
    'M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z',
  back:
    'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3',
}

const isActive = (path: string) =>
  path === '/admin' ? route.path === '/admin' : route.path.startsWith(path)
</script>

<template>
  <aside class="admin-sidebar">
    <!-- Brand -->
    <div class="sidebar-brand" @click="router.push('/admin')">
      <div class="brand-mark">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="var(--brand)" stroke-width="2" />
          <path d="M12 7v10M7 9.5l5 3 5-3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">OpenRealm</span>
        <span class="brand-badge">Admin</span>
      </div>
    </div>

    <!-- Navigation -->
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path :d="iconPaths[item.icon] || iconPaths.dashboard" />
            </svg>
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
          <span
            v-for="t in themes.slice(0, 4)"
            :key="t.id"
            class="td"
            :style="{ background: t.colors[0] }"
          ></span>
        </div>
        <span>主题</span>
      </button>
      <transition name="fade-slide">
        <div v-if="showThemes" class="theme-picker">
          <button
            v-for="t in themes"
            :key="t.id"
            :class="['theme-opt', { active: themeStore.current === t.id }]"
            @click="themeStore.setTheme(t.id)"
          >
            <div
              class="theme-preview"
              :style="{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }"
            ></div>
            <span>{{ t.name }}</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- Footer: Back to User Panel -->
    <div class="sidebar-footer">
      <router-link to="/" class="back-link">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path :d="iconPaths.back" />
        </svg>
        <span>返回用户端</span>
      </router-link>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

$admin-sidebar-width: 260px;

.admin-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: $admin-sidebar-width;
  height: 100vh;
  background: var(--bg-1);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: $z-sidebar;
  padding: 20px 14px;

  @media (max-width: $bp-tablet) {
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

// ── Brand ──
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 28px;
  cursor: pointer;
}

.brand-mark {
  width: 36px;
  height: 36px;
  background: var(--bg-2);
  border-radius: 10px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.3s;

  .sidebar-brand:hover & {
    box-shadow: var(--glow-brand);
  }
}

.brand-text {
  display: flex;
  align-items: center;
  gap: $gap-sm;
}

.brand-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.3px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--grad-brand);
  border-radius: 4px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.6;
}

// ── Navigation ──
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--text-3);
    border-radius: 3px;
  }
}

.nav-group {
  margin-bottom: 18px;
}

.nav-label {
  display: block;
  padding: 0 8px;
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  font-family: 'Space Grotesk', sans-serif;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  margin-bottom: 1px;
  position: relative;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: var(--text-1);
    background: rgba(255, 255, 255, 0.03);
  }

  &.active {
    color: #fff;
    background: var(--grad-brand);
    box-shadow: 0 2px 10px rgba(var(--brand-rgb), 0.3);

    .nav-icon-wrap {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

.nav-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.active-indicator {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  border-radius: 3px;
  background: var(--brand);
}

// ── Theme Section ──
.theme-section {
  padding: 0 4px;
  margin-bottom: $gap-md;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  width: 100%;
  padding: 8px;
  background: var(--bg-2);
  border-radius: 8px;
  color: var(--text-2);
  font-size: 12px;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-card-hover);
  }
}

.theme-dots {
  display: flex;
  gap: 3px;
}

.td {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.theme-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 6px;
  padding: 6px;
  background: var(--bg-2);
  border-radius: $card-radius-sm;
  border: 1px solid var(--border);
}

.theme-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 6px;
  background: transparent;
  color: var(--text-3);
  font-size: 10px;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-1);
  }

  &.active {
    background: rgba(var(--brand-rgb), 0.12);
    color: var(--brand-light);
  }
}

.theme-preview {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

// ── Footer ──
.sidebar-footer {
  padding: 12px 4px 0;
  border-top: 1px solid var(--border);
}

.back-link {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: 10px 8px;
  border-radius: 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;

  &:hover {
    color: var(--brand-light);
    background: rgba(var(--brand-rgb), 0.06);
  }
}
</style>

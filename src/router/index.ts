import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Auth — no sidebar layout
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/forgot',
    name: 'Forgot',
    component: () => import('../views/Forgot.vue'),
    meta: { guest: true },
  },
  // Main layout — requires auth
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'tutorial', name: 'Tutorial', component: () => import('../views/Tutorial.vue') },
      { path: 'shop', name: 'Shop', component: () => import('../views/Shop.vue') },
      { path: 'nodes', name: 'Nodes', component: () => import('../views/Nodes.vue') },
      { path: 'orders', name: 'Orders', component: () => import('../views/Orders.vue') },
      { path: 'invite', name: 'Invite', component: () => import('../views/Invite.vue') },
      { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue') },
      { path: 'tickets', name: 'Tickets', component: () => import('../views/Tickets.vue') },
      { path: 'tickets/:id', name: 'TicketDetail', component: () => import('../views/TicketDetail.vue') },
      { path: 'knowledge', name: 'Knowledge', component: () => import('../views/Knowledge.vue') },
      { path: 'traffic', name: 'Traffic', component: () => import('../views/Traffic.vue') },
    ],
  },
  // Admin layout — requires auth + admin
  {
    path: '/admin',
    component: () => import('../components/layout/AdminLayout.vue'),
    meta: { auth: true, admin: true },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('../views/admin/Dashboard.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/Users.vue') },
      { path: 'plans', name: 'AdminPlans', component: () => import('../views/admin/Plans.vue') },
      { path: 'orders', name: 'AdminOrders', component: () => import('../views/admin/Orders.vue') },
      { path: 'coupons', name: 'AdminCoupons', component: () => import('../views/admin/Coupons.vue') },
      { path: 'giftcards', name: 'AdminGiftcards', component: () => import('../views/admin/Giftcards.vue') },
      { path: 'servers', name: 'AdminServers', component: () => import('../views/admin/Servers.vue') },
      { path: 'server-groups', name: 'AdminServerGroups', component: () => import('../views/admin/ServerGroups.vue') },
      { path: 'server-routes', name: 'AdminServerRoutes', component: () => import('../views/admin/ServerRoutes.vue') },
      { path: 'tickets', name: 'AdminTickets', component: () => import('../views/admin/Tickets.vue') },
      { path: 'notices', name: 'AdminNotices', component: () => import('../views/admin/Notices.vue') },
      { path: 'knowledge', name: 'AdminKnowledge', component: () => import('../views/admin/Knowledge.vue') },
      { path: 'payment', name: 'AdminPayment', component: () => import('../views/admin/Payment.vue') },
      { path: 'config', name: 'AdminConfig', component: () => import('../views/admin/Config.vue') },
      { path: 'theme', name: 'AdminTheme', component: () => import('../views/admin/Theme.vue') },
      { path: 'system', name: 'AdminSystem', component: () => import('../views/admin/System.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('or_token')
  if (to.meta.auth && !token) return next('/login')
  if (to.meta.guest && token) return next('/')
  next()
})

export default router

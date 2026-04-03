import http from './index'

// Admin path resolution (three-tier fallback):
// 1. localStorage 'or_admin_path'  — set at login or from __OR_CONFIG__
// 2. window.__OR_CONFIG__.adminPath — injected by v2board blade template
// 3. VITE_ADMIN_PATH build-time env var (required for Cloudflare/static deployments)
// 4. 'admin' last-resort default
const adminPath = () =>
  localStorage.getItem('or_admin_path') ||
  (window as any).__OR_CONFIG__?.adminPath ||
  import.meta.env.VITE_ADMIN_PATH ||
  'admin'
const ap = () => `/${adminPath()}`

// ──────────────────────────────────────────────
// Stat  (7 endpoints)
// ──────────────────────────────────────────────
export const adminStatApi = {
  getOverride: () =>
    http.get(`${ap()}/stat/getOverride`),
  getOrder: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/stat/getOrder`, { params }),
  getServerLastRank: () =>
    http.get(`${ap()}/stat/getServerLastRank`),
  getServerTodayRank: () =>
    http.get(`${ap()}/stat/getServerTodayRank`),
  getUserLastRank: () =>
    http.get(`${ap()}/stat/getUserLastRank`),
  getUserTodayRank: () =>
    http.get(`${ap()}/stat/getUserTodayRank`),
  getStatUser: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/stat/getStatUser`, { params }),
}

// ──────────────────────────────────────────────
// User  (10 endpoints)
// ──────────────────────────────────────────────
export const adminUserApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/user/fetch`, { params }),
  update: (data: Record<string, unknown>) =>
    http.post(`${ap()}/user/update`, data),
  getUserInfoById: (params: { id: number }) =>
    http.get(`${ap()}/user/getUserInfoById`, { params }),
  generate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/user/generate`, data),
  dumpCSV: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/user/dumpCSV`, { params }),
  sendMail: (data: Record<string, unknown>) =>
    http.post(`${ap()}/user/sendMail`, data),
  ban: (data: { id: number }) =>
    http.post(`${ap()}/user/ban`, data),
  resetSecret: (data: { id: number }) =>
    http.post(`${ap()}/user/resetSecret`, data),
  delUser: (data: { id: number }) =>
    http.post(`${ap()}/user/delUser`, data),
  allDel: (data: { ids: number[] }) =>
    http.post(`${ap()}/user/allDel`, data),
}

// ──────────────────────────────────────────────
// Plan  (5 endpoints)
// ──────────────────────────────────────────────
export const adminPlanApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/plan/fetch`, { params }),
  save: (data: Record<string, unknown>) =>
    http.post(`${ap()}/plan/save`, data),
  drop: (data: { id: number }) =>
    http.post(`${ap()}/plan/drop`, data),
  update: (data: Record<string, unknown>) =>
    http.post(`${ap()}/plan/update`, data),
  sort: (data: { ids: number[] }) =>
    http.post(`${ap()}/plan/sort`, data),
}

// ──────────────────────────────────────────────
// Order  (6 endpoints)
// ──────────────────────────────────────────────
export const adminOrderApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/order/fetch`, { params }),
  update: (data: Record<string, unknown>) =>
    http.post(`${ap()}/order/update`, data),
  assign: (data: Record<string, unknown>) =>
    http.post(`${ap()}/order/assign`, data),
  paid: (data: { trade_no: string }) =>
    http.post(`${ap()}/order/paid`, data),
  cancel: (data: { trade_no: string }) =>
    http.post(`${ap()}/order/cancel`, data),
  detail: (params: { trade_no: string }) =>
    http.get(`${ap()}/order/detail`, { params }),
}

// ──────────────────────────────────────────────
// Server  (40 endpoints)
//   groups (3) + routes (3) + manage (2)
//   + 8 protocols x 4 operations (save/drop/update/copy) = 32
//   Total: 3 + 3 + 2 + 32 = 40
// ──────────────────────────────────────────────
export const adminServerApi = {
  // --- Server Groups ---
  groupFetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/server/group/fetch`, { params }),
  groupSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/group/save`, data),
  groupDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/group/drop`, data),

  // --- Server Routes ---
  routeFetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/server/route/fetch`, { params }),
  routeSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/route/save`, data),
  routeDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/route/drop`, data),

  // --- Server Manage ---
  getNodes: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/server/manage/getNodes`, { params }),
  sort: (data: { ids: number[] }) =>
    http.post(`${ap()}/server/manage/sort`, data),

  // --- Trojan ---
  trojanSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/trojan/save`, data),
  trojanDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/trojan/drop`, data),
  trojanUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/trojan/update`, data),
  trojanCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/trojan/copy`, data),

  // --- Vmess ---
  vmessSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/vmess/save`, data),
  vmessDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/vmess/drop`, data),
  vmessUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/vmess/update`, data),
  vmessCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/vmess/copy`, data),

  // --- Vless ---
  vlessSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/vless/save`, data),
  vlessDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/vless/drop`, data),
  vlessUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/vless/update`, data),
  vlessCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/vless/copy`, data),

  // --- Shadowsocks ---
  shadowsocksSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/shadowsocks/save`, data),
  shadowsocksDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/shadowsocks/drop`, data),
  shadowsocksUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/shadowsocks/update`, data),
  shadowsocksCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/shadowsocks/copy`, data),

  // --- Tuic ---
  tuicSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/tuic/save`, data),
  tuicDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/tuic/drop`, data),
  tuicUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/tuic/update`, data),
  tuicCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/tuic/copy`, data),

  // --- Hysteria ---
  hysteriaSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/hysteria/save`, data),
  hysteriaDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/hysteria/drop`, data),
  hysteriaUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/hysteria/update`, data),
  hysteriaCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/hysteria/copy`, data),

  // --- Anytls ---
  anytlsSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/anytls/save`, data),
  anytlsDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/anytls/drop`, data),
  anytlsUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/anytls/update`, data),
  anytlsCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/anytls/copy`, data),

  // --- V2Node (generic / unified node) ---
  v2nodeSave: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/v2node/save`, data),
  v2nodeDrop: (data: { id: number }) =>
    http.post(`${ap()}/server/v2node/drop`, data),
  v2nodeUpdate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/server/v2node/update`, data),
  v2nodeCopy: (data: { id: number }) =>
    http.post(`${ap()}/server/v2node/copy`, data),
}

// ──────────────────────────────────────────────
// Ticket  (3 endpoints)
// ──────────────────────────────────────────────
export const adminTicketApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/ticket/fetch`, { params }),
  reply: (data: { id: number; message: string }) =>
    http.post(`${ap()}/ticket/reply`, data),
  close: (data: { id: number }) =>
    http.post(`${ap()}/ticket/close`, data),
}

// ──────────────────────────────────────────────
// Coupon  (4 endpoints)
// ──────────────────────────────────────────────
export const adminCouponApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/coupon/fetch`, { params }),
  generate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/coupon/generate`, data),
  drop: (data: { id: number }) =>
    http.post(`${ap()}/coupon/drop`, data),
  show: (params: { id: number }) =>
    http.get(`${ap()}/coupon/show`, { params }),
}

// ──────────────────────────────────────────────
// Giftcard  (3 endpoints)
// ──────────────────────────────────────────────
export const adminGiftcardApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/giftcard/fetch`, { params }),
  generate: (data: Record<string, unknown>) =>
    http.post(`${ap()}/giftcard/generate`, data),
  drop: (data: { id: number }) =>
    http.post(`${ap()}/giftcard/drop`, data),
}

// ──────────────────────────────────────────────
// Notice  (4 endpoints)
// ──────────────────────────────────────────────
export const adminNoticeApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/notice/fetch`, { params }),
  save: (data: Record<string, unknown>) =>
    http.post(`${ap()}/notice/save`, data),
  drop: (data: { id: number }) =>
    http.post(`${ap()}/notice/drop`, data),
  show: (params: { id: number }) =>
    http.get(`${ap()}/notice/show`, { params }),
}

// ──────────────────────────────────────────────
// Knowledge  (6 endpoints)
// ──────────────────────────────────────────────
export const adminKnowledgeApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/knowledge/fetch`, { params }),
  getCategory: () =>
    http.get(`${ap()}/knowledge/getCategory`),
  save: (data: Record<string, unknown>) =>
    http.post(`${ap()}/knowledge/save`, data),
  show: (params: { id: number }) =>
    http.get(`${ap()}/knowledge/show`, { params }),
  drop: (data: { id: number }) =>
    http.post(`${ap()}/knowledge/drop`, data),
  sort: (data: { ids: number[] }) =>
    http.post(`${ap()}/knowledge/sort`, data),
}

// ──────────────────────────────────────────────
// Payment  (7 endpoints)
// ──────────────────────────────────────────────
export const adminPaymentApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/payment/fetch`, { params }),
  getPaymentMethods: () =>
    http.get(`${ap()}/payment/getPaymentMethods`),
  getPaymentForm: (params: { id: number }) =>
    http.get(`${ap()}/payment/getPaymentForm`, { params }),
  save: (data: Record<string, unknown>) =>
    http.post(`${ap()}/payment/save`, data),
  drop: (data: { id: number }) =>
    http.post(`${ap()}/payment/drop`, data),
  show: (params: { id: number }) =>
    http.get(`${ap()}/payment/show`, { params }),
  sort: (data: { ids: number[] }) =>
    http.post(`${ap()}/payment/sort`, data),
}

// ──────────────────────────────────────────────
// Config  (6 endpoints)
// ──────────────────────────────────────────────
export const adminConfigApi = {
  fetch: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/config/fetch`, { params }),
  save: (data: Record<string, unknown>) =>
    http.post(`${ap()}/config/save`, data),
  getEmailTemplate: () =>
    http.get(`${ap()}/config/getEmailTemplate`),
  getThemeTemplate: () =>
    http.get(`${ap()}/config/getThemeTemplate`),
  setTelegramWebhook: (data: Record<string, unknown>) =>
    http.post(`${ap()}/config/setTelegramWebhook`, data),
  testSendMail: (data: Record<string, unknown>) =>
    http.post(`${ap()}/config/testSendMail`, data),
}

// ──────────────────────────────────────────────
// System  (5 endpoints)
// ──────────────────────────────────────────────
export const adminSystemApi = {
  getSystemStatus: () =>
    http.get(`${ap()}/system/getSystemStatus`),
  getQueueStats: () =>
    http.get(`${ap()}/system/getQueueStats`),
  getQueueWorkload: () =>
    http.get(`${ap()}/system/getQueueWorkload`),
  getQueueMasters: () =>
    http.get(`${ap()}/system/getQueueMasters`),
  getSystemLog: (params?: Record<string, unknown>) =>
    http.get(`${ap()}/system/getSystemLog`, { params }),
}

// ──────────────────────────────────────────────
// Theme  (3 endpoints)
// ──────────────────────────────────────────────
export const adminThemeApi = {
  getThemes: () =>
    http.get(`${ap()}/theme/getThemes`),
  saveThemeConfig: (data: Record<string, unknown>) =>
    http.post(`${ap()}/theme/saveThemeConfig`, data),
  getThemeConfig: (params?: { name?: string }) =>
    http.get(`${ap()}/theme/getThemeConfig`, { params }),
}

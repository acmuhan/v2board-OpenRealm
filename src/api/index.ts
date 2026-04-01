import axios from 'axios'

// V2Board API lives under /api/v1/ — configurable via VITE_API_BASE env var
const BASE_URL = import.meta.env.VITE_API_BASE || '/api/v1'

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('or_token')
  if (token) config.headers.Authorization = token
  return config
})

// Response interceptor — handle auth errors
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('or_token')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

// ---- Auth ----
export const authApi = {
  login: (data: { email: string; password: string }) =>
    http.post('/passport/auth/login', data),
  register: (data: { email: string; password: string; invite_code?: string; email_code?: string }) =>
    http.post('/passport/auth/register', data),
  sendVerify: (data: { email: string }) =>
    http.post('/passport/comm/sendEmailVerify', data),
  forget: (data: { email: string; password: string; email_code: string }) =>
    http.post('/passport/auth/forget', data),
}

// ---- User ----
export const userApi = {
  getInfo: () => http.get('/user/info'),
  getStat: () => http.get('/user/getStat'),
  getSubscribe: () => http.get('/user/getSubscribe'),
  checkLogin: () => http.get('/user/checkLogin'),
  resetSecurity: (data: { old_password: string; new_password: string }) =>
    http.post('/user/changePassword', data),
  transfer: (data: { transfer_amount: number }) =>
    http.post('/user/transfer', data),
  update: (data: Record<string, unknown>) =>
    http.post('/user/update', data),
  getTrafficLog: () => http.get('/user/stat/getTrafficLog'),
}

// ---- Plan / Shop ----
export const planApi = {
  list: () => http.get('/user/plan/fetch'),
}

// ---- Order ----
export const orderApi = {
  list: () => http.get('/user/order/fetch'),
  detail: (tradeNo: string) => http.get('/user/order/detail', { params: { trade_no: tradeNo } }),
  check: (tradeNo: string) => http.get('/user/order/check', { params: { trade_no: tradeNo } }),
  getPaymentMethod: () => http.get('/user/order/getPaymentMethod'),
  save: (data: { plan_id: number; cycle: string; coupon_code?: string }) =>
    http.post('/user/order/save', data),
  checkout: (tradeNo: string, method: number) =>
    http.post('/user/order/checkout', { trade_no: tradeNo, method }),
  cancel: (tradeNo: string) =>
    http.post('/user/order/cancel', { trade_no: tradeNo }),
}

// ---- Coupon ----
export const couponApi = {
  check: (data: { code: string; plan_id: number }) =>
    http.post('/user/coupon/check', data),
}

// ---- Invite ----
export const inviteApi = {
  fetch: () => http.get('/user/invite/fetch'),
  save: () => http.get('/user/invite/save'),
  details: () => http.get('/user/invite/details'),
}

// ---- Ticket ----
export const ticketApi = {
  list: () => http.get('/user/ticket/fetch'),
  save: (data: { subject: string; level: number; message: string }) =>
    http.post('/user/ticket/save', data),
  detail: (id: number) => http.get('/user/ticket/fetch', { params: { id } }),
  reply: (data: { id: number; message: string }) =>
    http.post('/user/ticket/reply', data),
  close: (id: number) => http.post('/user/ticket/close', { id }),
}

// ---- Knowledge ----
export const knowledgeApi = {
  list: () => http.get('/user/knowledge/fetch'),
  detail: (id: number) => http.get('/user/knowledge/fetch', { params: { id } }),
  getCategory: () => http.get('/user/knowledge/getCategory'),
}

// ---- Server / Node ----
export const serverApi = {
  list: () => http.get('/user/server/fetch'),
}

// ---- Notice ----
export const noticeApi = {
  list: () => http.get('/user/notice/fetch'),
}

// ---- Comm ----
export const commApi = {
  config: () => http.get('/guest/comm/config'),
}

export default http

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminConfigApi } from '../../api/admin'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()

const tabs = [
  { key: 'site',      label: '站点' },
  { key: 'subscribe', label: '订阅' },
  { key: 'frontend',  label: '前端' },
  { key: 'server',    label: '服务器' },
  { key: 'email',     label: '邮件' },
  { key: 'invite',    label: '邀请' },
  { key: 'telegram',  label: 'Telegram' },
  { key: 'security',  label: '安全' },
  { key: 'ticket',    label: '工单' },
]

const activeTab = ref('site')
const saving = ref(false)
const saved = ref(false)
const testingMail = ref(false)
const settingWebhook = ref(false)
const fetchError = ref('')

// commission_withdraw_method is array — managed separately
const withdrawMethodText = ref('')

const config = reactive({
  // ── site ──────────────────────────────────────
  app_name: '',
  app_url: '',
  app_description: '',
  logo: '',
  force_https: 0,
  stop_register: 0,
  subscribe_url: '',
  subscribe_path: '',
  try_out_plan_id: 0,
  try_out_hour: 1,
  tos_url: '',
  currency: 'CNY',
  currency_symbol: '¥',
  // ── subscribe ─────────────────────────────────
  plan_change_enable: 1,
  reset_traffic_method: 0,
  surplus_enable: 1,
  allow_new_period: 0,
  new_order_event_id: 0,
  renew_order_event_id: 0,
  change_order_event_id: 0,
  show_info_to_server_enable: 0,
  show_subscribe_method: 0,
  show_subscribe_expire: 5,
  // ── frontend ──────────────────────────────────
  frontend_theme: 'openrealm',
  frontend_theme_sidebar: 'light',
  frontend_theme_header: 'dark',
  frontend_theme_color: 'default',
  frontend_background_url: '',
  // ── app downloads ─────────────────────────────
  windows_version: '',
  windows_download_url: '',
  macos_version: '',
  macos_download_url: '',
  android_version: '',
  android_download_url: '',
  // ── server ────────────────────────────────────
  server_api_url: '',
  server_token: '',
  server_pull_interval: 60,
  server_push_interval: 60,
  server_node_report_min_traffic: 0,
  server_device_online_min_traffic: 0,
  device_limit_mode: 0,
  // ── email ─────────────────────────────────────
  email_template: 'default',
  email_host: '',
  email_port: 465,
  email_username: '',
  email_password: '',
  email_encryption: 'SSL',
  email_from_address: '',
  // ── invite & commission ───────────────────────
  invite_force: 0,
  invite_commission: 10,
  invite_gen_limit: 5,
  invite_never_expire: 0,
  commission_first_time_enable: 1,
  commission_auto_check_enable: 1,
  commission_withdraw_limit: 100,
  withdraw_close_enable: 0,
  commission_distribution_enable: 0,
  commission_distribution_l1: null as number | null,
  commission_distribution_l2: null as number | null,
  commission_distribution_l3: null as number | null,
  // ── telegram ──────────────────────────────────
  telegram_bot_enable: 0,
  telegram_bot_token: '',
  telegram_discuss_link: '',
  // ── safe ──────────────────────────────────────
  email_verify: 0,
  safe_mode_enable: 0,
  secure_path: '',
  email_whitelist_enable: 0,
  email_whitelist_suffix: '' as string,
  email_gmail_limit_enable: 0,
  recaptcha_enable: 0,
  recaptcha_key: '',
  recaptcha_site_key: '',
  register_limit_by_ip_enable: 0,
  register_limit_count: 3,
  register_limit_expire: 60,
  password_limit_enable: 1,
  password_limit_count: 5,
  password_limit_expire: 60,
  // ── ticket ────────────────────────────────────
  ticket_status: 0,
})

const emailTemplates = ref(['default'])
const frontendThemes = ref(['openrealm'])

onMounted(async () => {
  try {
    const res = await adminConfigApi.fetch()
    if (res?.data) {
      // Backend returns nested groups — flatten all groups into one object
      const flat: Record<string, any> = {}
      for (const group of Object.values(res.data as Record<string, any>)) {
        if (group && typeof group === 'object' && !Array.isArray(group)) {
          Object.assign(flat, group)
        }
      }
      // Arrays → editable strings
      if (Array.isArray(flat.email_whitelist_suffix)) {
        flat.email_whitelist_suffix = flat.email_whitelist_suffix.join('\n')
      }
      if (Array.isArray(flat.commission_withdraw_method)) {
        withdrawMethodText.value = flat.commission_withdraw_method.join('\n')
        delete flat.commission_withdraw_method
      }
      Object.assign(config, flat)
    }
    const [emailTplRes, themeTplRes] = await Promise.allSettled([
      adminConfigApi.getEmailTemplate(),
      adminConfigApi.getThemeTemplate(),
    ])
    if (emailTplRes.status === 'fulfilled' && Array.isArray((emailTplRes.value as any)?.data))
      emailTemplates.value = (emailTplRes.value as any).data
    if (themeTplRes.status === 'fulfilled' && Array.isArray((themeTplRes.value as any)?.data))
      frontendThemes.value = (themeTplRes.value as any).data
  } catch (e: any) {
    fetchError.value = e?.message || '配置加载失败，请刷新重试'
    toast.error(fetchError.value)
  }
})

async function saveConfig() {
  saving.value = true
  try {
    const payload: Record<string, any> = {
      ...config,
      email_whitelist_suffix: config.email_whitelist_suffix
        ? config.email_whitelist_suffix.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [],
      commission_withdraw_method: withdrawMethodText.value
        ? withdrawMethodText.value.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [],
    }
    await adminConfigApi.save(payload)
    saved.value = true
    toast.success('配置保存成功')
    setTimeout(() => (saved.value = false), 2500)
  } catch (e: any) {
    toast.error(e?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

async function testMail() {
  testingMail.value = true
  try {
    await adminConfigApi.testSendMail({
      email_host: config.email_host,
      email_port: config.email_port,
      email_username: config.email_username,
      email_password: config.email_password,
      email_from_address: config.email_from_address,
    })
    toast.success('测试邮件已发送')
  } catch (e: any) {
    toast.error(e?.message || '发送失败，请检查邮件配置')
  } finally {
    testingMail.value = false
  }
}

async function setWebhook() {
  settingWebhook.value = true
  try {
    await adminConfigApi.setTelegramWebhook({ token: config.telegram_bot_token })
    toast.success('Webhook 设置成功')
  } catch (e: any) {
    toast.error(e?.message || '设置失败，请检查 Bot Token')
  } finally {
    settingWebhook.value = false
  }
}

function toggle(key: keyof typeof config) {
  (config as any)[key] = (config as any)[key] ? 0 : 1
}
</script>

<template>
  <div class="config-page">
    <div class="page-header stagger-1">
      <div>
        <h1>系统配置</h1>
        <p class="page-desc">管理站点、邮件、订阅、安全等系统级设置</p>
      </div>
    </div>

    <div v-if="fetchError" class="fetch-error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ fetchError }}
      <button class="btn-ghost btn-sm" @click="fetchError = ''">重试</button>
    </div>

    <div class="config-layout stagger-2">
      <!-- Tab sidebar -->
      <nav class="tab-nav card">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >{{ tab.label }}</button>
      </nav>

      <!-- Tab content -->
      <div class="tab-content card-accent">

        <!-- ── 站点 ───────────────────────────────── -->
        <div v-if="activeTab === 'site'" class="tab-panel">
          <h2 class="panel-title">站点设置</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>站点名称</label>
              <input v-model="config.app_name" class="or-input" placeholder="OpenRealm" />
            </div>
            <div class="form-group">
              <label>站点 URL</label>
              <input v-model="config.app_url" class="or-input" placeholder="https://..." />
            </div>
            <div class="form-group span-2">
              <label>站点描述</label>
              <input v-model="config.app_description" class="or-input" placeholder="一句话描述" />
            </div>
            <div class="form-group">
              <label>Logo URL</label>
              <input v-model="config.logo" class="or-input" placeholder="https://.../logo.svg" />
            </div>
            <div class="form-group">
              <label>服务条款 URL</label>
              <input v-model="config.tos_url" class="or-input" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>订阅 URL（覆盖站点URL）</label>
              <input v-model="config.subscribe_url" class="or-input" placeholder="留空使用站点URL" />
            </div>
            <div class="form-group">
              <label>订阅路径</label>
              <input v-model="config.subscribe_path" class="or-input" placeholder="/abc/client/sub" />
            </div>
            <div class="form-group">
              <label>货币代码</label>
              <input v-model="config.currency" class="or-input" placeholder="CNY" />
            </div>
            <div class="form-group">
              <label>货币符号</label>
              <input v-model="config.currency_symbol" class="or-input" placeholder="¥" />
            </div>
            <div class="form-group">
              <label>试用套餐 ID</label>
              <input v-model.number="config.try_out_plan_id" type="number" class="or-input" placeholder="0 = 不启用" />
            </div>
            <div class="form-group">
              <label>试用时长（小时）</label>
              <input v-model.number="config.try_out_hour" type="number" class="or-input" />
            </div>
            <div class="form-group toggle-row">
              <label>强制 HTTPS</label>
              <div class="toggle-wrap" @click="toggle('force_https')">
                <div :class="['toggle-track', { on: config.force_https }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>停止注册</label>
              <div class="toggle-wrap" @click="toggle('stop_register')">
                <div :class="['toggle-track', { on: config.stop_register }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 订阅 ───────────────────────────────── -->
        <div v-if="activeTab === 'subscribe'" class="tab-panel">
          <h2 class="panel-title">订阅设置</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>流量重置方式</label>
              <select v-model.number="config.reset_traffic_method" class="or-input">
                <option :value="0">每月1号</option>
                <option :value="1">按天计算（购买日）</option>
                <option :value="2">不重置</option>
                <option :value="3">每月底</option>
                <option :value="4">按套餐购买时间</option>
              </select>
            </div>
            <div class="form-group">
              <label>显示订阅方式</label>
              <select v-model.number="config.show_subscribe_method" class="or-input">
                <option :value="0">全部显示</option>
                <option :value="1">只显示 Clash</option>
                <option :value="2">只显示 V2Ray</option>
              </select>
            </div>
            <div class="form-group">
              <label>显示订阅到期前（天）</label>
              <input v-model.number="config.show_subscribe_expire" type="number" class="or-input" placeholder="5" />
            </div>
            <div class="form-group toggle-row">
              <label>允许更换套餐</label>
              <div class="toggle-wrap" @click="toggle('plan_change_enable')">
                <div :class="['toggle-track', { on: config.plan_change_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>启用折抵</label>
              <div class="toggle-wrap" @click="toggle('surplus_enable')">
                <div :class="['toggle-track', { on: config.surplus_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>允许新周期续费</label>
              <div class="toggle-wrap" @click="toggle('allow_new_period')">
                <div :class="['toggle-track', { on: config.allow_new_period }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>向节点暴露用户信息</label>
              <div class="toggle-wrap" @click="toggle('show_info_to_server_enable')">
                <div :class="['toggle-track', { on: config.show_info_to_server_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
          </div>
          <h3 class="sub-panel-title">事件通知</h3>
          <p class="sub-panel-desc">0 = 关闭，1 = 开启</p>
          <div class="form-grid">
            <div class="form-group toggle-row">
              <label>新订单通知</label>
              <div class="toggle-wrap" @click="toggle('new_order_event_id')">
                <div :class="['toggle-track', { on: config.new_order_event_id }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>续费订单通知</label>
              <div class="toggle-wrap" @click="toggle('renew_order_event_id')">
                <div :class="['toggle-track', { on: config.renew_order_event_id }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>变更订单通知</label>
              <div class="toggle-wrap" @click="toggle('change_order_event_id')">
                <div :class="['toggle-track', { on: config.change_order_event_id }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 前端 ───────────────────────────────── -->
        <div v-if="activeTab === 'frontend'" class="tab-panel">
          <h2 class="panel-title">前端设置</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>前端主题</label>
              <select v-model="config.frontend_theme" class="or-input">
                <option v-for="t in frontendThemes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>侧边栏风格</label>
              <select v-model="config.frontend_theme_sidebar" class="or-input">
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </div>
            <div class="form-group">
              <label>顶栏风格</label>
              <select v-model="config.frontend_theme_header" class="or-input">
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </div>
            <div class="form-group">
              <label>主题配色</label>
              <select v-model="config.frontend_theme_color" class="or-input">
                <option value="default">default</option>
                <option value="darkblue">darkblue</option>
                <option value="black">black</option>
                <option value="green">green</option>
              </select>
            </div>
            <div class="form-group span-2">
              <label>背景图 URL</label>
              <input v-model="config.frontend_background_url" class="or-input" placeholder="https://..." />
            </div>
          </div>

          <h3 class="sub-panel-title">客户端下载地址</h3>
          <p class="sub-panel-desc">留空则不显示对应下载按钮</p>
          <div class="form-grid">
            <div class="form-group">
              <label>Windows 版本号</label>
              <input v-model="config.windows_version" class="or-input" placeholder="1.0.0" />
            </div>
            <div class="form-group">
              <label>Windows 下载链接</label>
              <input v-model="config.windows_download_url" class="or-input" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>macOS 版本号</label>
              <input v-model="config.macos_version" class="or-input" placeholder="1.0.0" />
            </div>
            <div class="form-group">
              <label>macOS 下载链接</label>
              <input v-model="config.macos_download_url" class="or-input" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Android 版本号</label>
              <input v-model="config.android_version" class="or-input" placeholder="1.0.0" />
            </div>
            <div class="form-group">
              <label>Android 下载链接</label>
              <input v-model="config.android_download_url" class="or-input" placeholder="https://..." />
            </div>
          </div>
        </div>

        <!-- ── 服务器 ──────────────────────────────── -->
        <div v-if="activeTab === 'server'" class="tab-panel">
          <h2 class="panel-title">服务器设置</h2>
          <div class="form-grid">
            <div class="form-group span-2">
              <label>节点通信 API URL</label>
              <input v-model="config.server_api_url" class="or-input" placeholder="https://..." />
            </div>
            <div class="form-group span-2">
              <label>节点通信密钥（Token）</label>
              <input v-model="config.server_token" class="or-input" placeholder="至少16位" />
            </div>
            <div class="form-group">
              <label>节点拉取间隔（秒）</label>
              <input v-model.number="config.server_pull_interval" type="number" class="or-input" placeholder="60" />
            </div>
            <div class="form-group">
              <label>节点推送间隔（秒）</label>
              <input v-model.number="config.server_push_interval" type="number" class="or-input" placeholder="60" />
            </div>
            <div class="form-group">
              <label>节点上报最小流量（MB）</label>
              <input v-model.number="config.server_node_report_min_traffic" type="number" class="or-input" placeholder="0" />
            </div>
            <div class="form-group">
              <label>设备在线最小流量（MB）</label>
              <input v-model.number="config.server_device_online_min_traffic" type="number" class="or-input" placeholder="0" />
            </div>
            <div class="form-group">
              <label>设备限制模式</label>
              <select v-model.number="config.device_limit_mode" class="or-input">
                <option :value="0">宽松（超限后断开最早连接）</option>
                <option :value="1">严格（超限后拒绝新连接）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- ── 邮件 ───────────────────────────────── -->
        <div v-if="activeTab === 'email'" class="tab-panel">
          <h2 class="panel-title">邮件设置</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>SMTP 主机</label>
              <input v-model="config.email_host" class="or-input" placeholder="smtp.example.com" />
            </div>
            <div class="form-group">
              <label>SMTP 端口</label>
              <input v-model.number="config.email_port" type="number" class="or-input" placeholder="465" />
            </div>
            <div class="form-group">
              <label>用户名</label>
              <input v-model="config.email_username" class="or-input" />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input v-model="config.email_password" type="password" class="or-input" />
            </div>
            <div class="form-group">
              <label>加密方式</label>
              <select v-model="config.email_encryption" class="or-input">
                <option value="SSL">SSL</option>
                <option value="TLS">TLS</option>
                <option value="">无</option>
              </select>
            </div>
            <div class="form-group">
              <label>发件人地址</label>
              <input v-model="config.email_from_address" class="or-input" />
            </div>
            <div class="form-group">
              <label>邮件模板</label>
              <select v-model="config.email_template" class="or-input">
                <option v-for="t in emailTemplates" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <button class="btn-ghost test-btn" :disabled="testingMail" @click="testMail">
            {{ testingMail ? '发送中...' : '发送测试邮件' }}
          </button>
        </div>

        <!-- ── 邀请 ───────────────────────────────── -->
        <div v-if="activeTab === 'invite'" class="tab-panel">
          <h2 class="panel-title">邀请与佣金</h2>
          <div class="form-grid">
            <div class="form-group toggle-row">
              <label>强制邀请注册</label>
              <div class="toggle-wrap" @click="toggle('invite_force')">
                <div :class="['toggle-track', { on: config.invite_force }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>邀请码永不过期</label>
              <div class="toggle-wrap" @click="toggle('invite_never_expire')">
                <div :class="['toggle-track', { on: config.invite_never_expire }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group">
              <label>邀请佣金比例 (%)</label>
              <input v-model.number="config.invite_commission" type="number" class="or-input" />
            </div>
            <div class="form-group">
              <label>邀请码生成上限</label>
              <input v-model.number="config.invite_gen_limit" type="number" class="or-input" />
            </div>
          </div>

          <h3 class="sub-panel-title">佣金设置</h3>
          <div class="form-grid">
            <div class="form-group toggle-row">
              <label>仅首单返佣</label>
              <div class="toggle-wrap" @click="toggle('commission_first_time_enable')">
                <div :class="['toggle-track', { on: config.commission_first_time_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>自动审核提现</label>
              <div class="toggle-wrap" @click="toggle('commission_auto_check_enable')">
                <div :class="['toggle-track', { on: config.commission_auto_check_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>关闭提现</label>
              <div class="toggle-wrap" @click="toggle('withdraw_close_enable')">
                <div :class="['toggle-track', { on: config.withdraw_close_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>分销模式</label>
              <div class="toggle-wrap" @click="toggle('commission_distribution_enable')">
                <div :class="['toggle-track', { on: config.commission_distribution_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group">
              <label>最低提现金额</label>
              <input v-model.number="config.commission_withdraw_limit" type="number" class="or-input" />
            </div>
            <div class="form-group span-2">
              <label>提现方式（每行一个）</label>
              <textarea v-model="withdrawMethodText" class="or-input textarea" rows="3" placeholder="支付宝&#10;USDT&#10;Paypal"></textarea>
            </div>
            <template v-if="config.commission_distribution_enable">
              <div class="form-group">
                <label>分销 L1 比例 (%)</label>
                <input v-model.number="config.commission_distribution_l1" type="number" class="or-input" />
              </div>
              <div class="form-group">
                <label>分销 L2 比例 (%)</label>
                <input v-model.number="config.commission_distribution_l2" type="number" class="or-input" />
              </div>
              <div class="form-group">
                <label>分销 L3 比例 (%)</label>
                <input v-model.number="config.commission_distribution_l3" type="number" class="or-input" />
              </div>
            </template>
          </div>
        </div>

        <!-- ── Telegram ───────────────────────────── -->
        <div v-if="activeTab === 'telegram'" class="tab-panel">
          <h2 class="panel-title">Telegram 设置</h2>
          <div class="form-grid">
            <div class="form-group toggle-row span-2">
              <label>启用 Telegram Bot</label>
              <div class="toggle-wrap" @click="toggle('telegram_bot_enable')">
                <div :class="['toggle-track', { on: config.telegram_bot_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group span-2">
              <label>Bot Token</label>
              <input v-model="config.telegram_bot_token" class="or-input" placeholder="123456:ABCdef..." />
            </div>
            <div class="form-group span-2">
              <label>讨论组链接</label>
              <input v-model="config.telegram_discuss_link" class="or-input" placeholder="https://t.me/..." />
            </div>
          </div>
          <button
            class="btn-primary webhook-btn"
            :disabled="settingWebhook || !config.telegram_bot_token"
            @click="setWebhook"
          >{{ settingWebhook ? '设置中...' : '设置 Webhook' }}</button>
        </div>

        <!-- ── 安全 ───────────────────────────────── -->
        <div v-if="activeTab === 'security'" class="tab-panel">
          <h2 class="panel-title">安全设置</h2>
          <div class="form-grid">
            <div class="form-group span-2">
              <label>后台路径（secure_path，至少8位字母数字）</label>
              <input v-model="config.secure_path" class="or-input" placeholder="至少8位" />
            </div>
            <div class="form-group toggle-row">
              <label>邮箱验证</label>
              <div class="toggle-wrap" @click="toggle('email_verify')">
                <div :class="['toggle-track', { on: config.email_verify }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>安全模式</label>
              <div class="toggle-wrap" @click="toggle('safe_mode_enable')">
                <div :class="['toggle-track', { on: config.safe_mode_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>邮箱白名单</label>
              <div class="toggle-wrap" @click="toggle('email_whitelist_enable')">
                <div :class="['toggle-track', { on: config.email_whitelist_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>Gmail 别名限制</label>
              <div class="toggle-wrap" @click="toggle('email_gmail_limit_enable')">
                <div :class="['toggle-track', { on: config.email_gmail_limit_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group span-2">
              <label>邮箱后缀白名单（每行一个）</label>
              <textarea v-model="config.email_whitelist_suffix" class="or-input textarea" rows="4" placeholder="gmail.com&#10;qq.com&#10;163.com" :disabled="!config.email_whitelist_enable"></textarea>
            </div>
          </div>

          <h3 class="sub-panel-title">注册限制</h3>
          <div class="form-grid">
            <div class="form-group toggle-row">
              <label>IP 注册限制</label>
              <div class="toggle-wrap" @click="toggle('register_limit_by_ip_enable')">
                <div :class="['toggle-track', { on: config.register_limit_by_ip_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group">
              <label>同 IP 注册次数上限</label>
              <input v-model.number="config.register_limit_count" type="number" class="or-input" :disabled="!config.register_limit_by_ip_enable" />
            </div>
            <div class="form-group">
              <label>IP 限制过期时间（分钟）</label>
              <input v-model.number="config.register_limit_expire" type="number" class="or-input" :disabled="!config.register_limit_by_ip_enable" />
            </div>
          </div>

          <h3 class="sub-panel-title">密码安全</h3>
          <div class="form-grid">
            <div class="form-group toggle-row">
              <label>登录失败限制</label>
              <div class="toggle-wrap" @click="toggle('password_limit_enable')">
                <div :class="['toggle-track', { on: config.password_limit_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group">
              <label>失败次数上限</label>
              <input v-model.number="config.password_limit_count" type="number" class="or-input" :disabled="!config.password_limit_enable" />
            </div>
            <div class="form-group">
              <label>锁定时间（分钟）</label>
              <input v-model.number="config.password_limit_expire" type="number" class="or-input" :disabled="!config.password_limit_enable" />
            </div>
          </div>

          <h3 class="sub-panel-title">reCAPTCHA</h3>
          <div class="form-grid">
            <div class="form-group toggle-row span-2">
              <label>启用 reCAPTCHA</label>
              <div class="toggle-wrap" @click="toggle('recaptcha_enable')">
                <div :class="['toggle-track', { on: config.recaptcha_enable }]"><div class="toggle-thumb"></div></div>
              </div>
            </div>
            <div class="form-group">
              <label>Secret Key</label>
              <input v-model="config.recaptcha_key" class="or-input" :disabled="!config.recaptcha_enable" />
            </div>
            <div class="form-group">
              <label>Site Key</label>
              <input v-model="config.recaptcha_site_key" class="or-input" :disabled="!config.recaptcha_enable" />
            </div>
          </div>
        </div>

        <!-- ── 工单 ───────────────────────────────── -->
        <div v-if="activeTab === 'ticket'" class="tab-panel">
          <h2 class="panel-title">工单设置</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>工单状态</label>
              <select v-model.number="config.ticket_status" class="or-input">
                <option :value="0">开启</option>
                <option :value="1">关闭（用户不可提交）</option>
                <option :value="2">关闭（全部隐藏）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Save bar -->
        <div class="save-bar">
          <Transition name="fade-slide">
            <span v-if="saved" class="save-success">&#10003; 保存成功</span>
          </Transition>
          <button class="btn-gradient" :disabled="saving" @click="saveConfig">
            {{ saving ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.config-page { max-width: 1100px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: $gap-lg;
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .page-desc { font-size: 13px; color: var(--text-3); margin-top: 4px; }
}

.fetch-error {
  display: flex; align-items: center; gap: $gap-sm;
  padding: $gap-md $gap-lg; margin-bottom: $gap-md;
  background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: $card-radius; color: var(--danger); font-size: 13px;
  svg { flex-shrink: 0; }
}

.config-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: $gap-md;
  align-items: start;
}

.tab-nav {
  padding: $gap-sm;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: sticky;
  top: $gap-lg;
}

.tab-btn {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  background: transparent;
  border-radius: $card-radius-sm;
  transition: all 0.15s;
  text-align: left;
  position: relative;

  &:hover { background: var(--bg-elevated); color: var(--text-1); }

  &.active {
    background: rgba(var(--brand-rgb), 0.1);
    color: var(--brand-light);
    font-weight: 600;

    &::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 16px;
      background: var(--grad-brand);
      border-radius: 2px;
    }
  }
}

.tab-content {
  padding: $gap-lg;
  min-height: 400px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: $gap-lg;
  padding-bottom: $gap-sm;
  border-bottom: 1px solid var(--border);
}

.sub-panel-title {
  font-size: 15px; font-weight: 600;
  margin-top: $gap-lg; margin-bottom: 4px;
}

.sub-panel-desc {
  font-size: 12px; color: var(--text-3); margin-bottom: $gap-md;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap-md;
}

.span-2 { grid-column: span 2; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    color: var(--text-2);
    font-weight: 500;
  }
}

.toggle-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle-wrap { cursor: pointer; }

.toggle-track {
  width: 44px; height: 24px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;

  &.on {
    background: var(--brand);
    border-color: var(--brand);
    .toggle-thumb { transform: translateX(20px); }
  }
}

.toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
}

.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.test-btn, .webhook-btn { margin-top: $gap-md; }

.save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $gap-md;
  margin-top: $gap-xl;
  padding-top: $gap-md;
  border-top: 1px solid var(--border);
}

.save-success { font-size: 13px; color: var(--success); font-weight: 600; }
.btn-sm { padding: 5px 12px; font-size: 12px; }

.fade-slide-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: $bp-tablet) {
  .config-layout { grid-template-columns: 1fr; }
  .tab-nav {
    flex-direction: row;
    overflow-x: auto;
    position: static;
    gap: $gap-xs;
    .tab-btn { white-space: nowrap; padding: 8px 12px; font-size: 12px; }
  }
}

@media (max-width: $bp-mobile) {
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>

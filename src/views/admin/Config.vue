<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminConfigApi } from '../../api/admin'

interface TabDef {
  key: string
  label: string
  icon: string
}

const tabs: TabDef[] = [
  { key: 'site', label: '站点', icon: '&#9671;' },
  { key: 'register', label: '注册', icon: '&#9998;' },
  { key: 'email', label: '邮件', icon: '&#9993;' },
  { key: 'subscribe', label: '订阅', icon: '&#9889;' },
  { key: 'frontend', label: '前端', icon: '&#9783;' },
  { key: 'telegram', label: 'Telegram', icon: '&#9992;' },
  { key: 'security', label: '安全', icon: '&#9888;' },
]

const activeTab = ref('site')
const saving = ref(false)
const saved = ref(false)
const testingMail = ref(false)
const settingWebhook = ref(false)

const config = reactive({
  // Site
  app_name: '',
  app_url: '',
  app_description: '',
  logo_url: '',
  force_https: false,
  subscribe_url: '',
  // Register
  email_verify: false,
  email_whitelist_suffix: '',
  invite_force: false,
  invite_commission: 0,
  invite_gen_limit: 0,
  // Email
  email_host: '',
  email_port: 465,
  email_username: '',
  email_password: '',
  email_from: '',
  email_template: 'default',
  // Subscribe
  subscribe_path: '',
  plan_change_enable: false,
  surplus_enable: false,
  // Frontend
  frontend_theme: 'OpenRealm',
  frontend_admin_path: '',
  frontend_background_url: '',
  // Telegram
  telegram_bot_enable: false,
  telegram_bot_token: '',
  telegram_discuss_link: '',
  // Security
  secure_path: '',
  email_whitelist_enable: false,
  recaptcha_enable: false,
  recaptcha_key: '',
  recaptcha_site_key: '',
})

const emailTemplates = ref(['default', 'modern', 'minimal', 'custom'])
const frontendThemes = ref(['OpenRealm', 'V2Board', 'Starter', 'Custom'])

onMounted(async () => {
  try {
    const res = await adminConfigApi.fetch()
    if (res?.data) {
      Object.assign(config, res.data)
    }
    // Optionally load dynamic template lists
    const [emailTplRes, themeTplRes] = await Promise.allSettled([
      adminConfigApi.getEmailTemplate(),
      adminConfigApi.getThemeTemplate(),
    ])
    if (emailTplRes.status === 'fulfilled' && Array.isArray(emailTplRes.value?.data)) {
      emailTemplates.value = emailTplRes.value.data
    }
    if (themeTplRes.status === 'fulfilled' && Array.isArray(themeTplRes.value?.data)) {
      frontendThemes.value = themeTplRes.value.data
    }
  } catch {
    // config stays at empty defaults if load fails
  }
})

async function saveConfig() {
  saving.value = true
  try {
    await adminConfigApi.save(config)
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } catch (e: any) {
    alert(e?.message || '保存失败，请重试')
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
      email_from: config.email_from,
    })
    alert('测试邮件已发送')
  } catch (e: any) {
    alert(e?.message || '发送失败，请检查邮件配置')
  } finally {
    testingMail.value = false
  }
}

async function setWebhook() {
  settingWebhook.value = true
  try {
    await adminConfigApi.setTelegramWebhook({ token: config.telegram_bot_token })
    alert('Webhook 设置成功')
  } catch (e: any) {
    alert(e?.message || '设置失败，请检查 Bot Token')
  } finally {
    settingWebhook.value = false
  }
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

    <div class="config-layout stagger-2">
      <!-- Tabs sidebar -->
      <nav class="tab-nav card">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon" v-html="tab.icon"></span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Tab content -->
      <div class="tab-content card-accent">
        <!-- SITE -->
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
              <input v-model="config.logo_url" class="or-input" placeholder="/logo.svg" />
            </div>
            <div class="form-group">
              <label>订阅 URL (可选覆盖)</label>
              <input v-model="config.subscribe_url" class="or-input" placeholder="留空使用站点URL" />
            </div>
            <div class="form-group toggle-row">
              <label>强制 HTTPS</label>
              <div class="toggle-wrap" @click="config.force_https = !config.force_https">
                <div :class="['toggle-track', { on: config.force_https }]">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- REGISTER -->
        <div v-if="activeTab === 'register'" class="tab-panel">
          <h2 class="panel-title">注册设置</h2>
          <div class="form-grid">
            <div class="form-group toggle-row">
              <label>邮箱验证</label>
              <div class="toggle-wrap" @click="config.email_verify = !config.email_verify">
                <div :class="['toggle-track', { on: config.email_verify }]">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>强制邀请注册</label>
              <div class="toggle-wrap" @click="config.invite_force = !config.invite_force">
                <div :class="['toggle-track', { on: config.invite_force }]">
                  <div class="toggle-thumb"></div>
                </div>
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
            <div class="form-group span-2">
              <label>邮箱后缀白名单 (每行一个)</label>
              <textarea v-model="config.email_whitelist_suffix" class="or-input textarea" rows="4" placeholder="gmail.com&#10;outlook.com"></textarea>
            </div>
          </div>
        </div>

        <!-- EMAIL -->
        <div v-if="activeTab === 'email'" class="tab-panel">
          <h2 class="panel-title">邮件设置</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>SMTP 主机</label>
              <input v-model="config.email_host" class="or-input" placeholder="smtp.gmail.com" />
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
              <input v-model="config.email_password" type="password" class="or-input" placeholder="SMTP密码" />
            </div>
            <div class="form-group">
              <label>发件人地址</label>
              <input v-model="config.email_from" class="or-input" />
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

        <!-- SUBSCRIBE -->
        <div v-if="activeTab === 'subscribe'" class="tab-panel">
          <h2 class="panel-title">订阅设置</h2>
          <div class="form-grid">
            <div class="form-group span-2">
              <label>订阅路径 (留空则随机)</label>
              <input v-model="config.subscribe_path" class="or-input" placeholder="/api/v1/client/subscribe?token=..." />
            </div>
            <div class="form-group toggle-row">
              <label>允许更换套餐</label>
              <div class="toggle-wrap" @click="config.plan_change_enable = !config.plan_change_enable">
                <div :class="['toggle-track', { on: config.plan_change_enable }]">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>启用折抵</label>
              <div class="toggle-wrap" @click="config.surplus_enable = !config.surplus_enable">
                <div :class="['toggle-track', { on: config.surplus_enable }]">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FRONTEND -->
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
              <label>管理后台路径</label>
              <input v-model="config.frontend_admin_path" class="or-input" placeholder="admin" />
            </div>
            <div class="form-group span-2">
              <label>背景图 URL</label>
              <input v-model="config.frontend_background_url" class="or-input" placeholder="https://..." />
            </div>
          </div>
        </div>

        <!-- TELEGRAM -->
        <div v-if="activeTab === 'telegram'" class="tab-panel">
          <h2 class="panel-title">Telegram 设置</h2>
          <div class="form-grid">
            <div class="form-group toggle-row span-2">
              <label>启用 Telegram Bot</label>
              <div class="toggle-wrap" @click="config.telegram_bot_enable = !config.telegram_bot_enable">
                <div :class="['toggle-track', { on: config.telegram_bot_enable }]">
                  <div class="toggle-thumb"></div>
                </div>
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
          >
            {{ settingWebhook ? '设置中...' : '设置 Webhook' }}
          </button>
        </div>

        <!-- SECURITY -->
        <div v-if="activeTab === 'security'" class="tab-panel">
          <h2 class="panel-title">安全设置</h2>
          <div class="form-grid">
            <div class="form-group span-2">
              <label>后台安全路径</label>
              <input v-model="config.secure_path" class="or-input" placeholder="留空使用默认路径" />
            </div>
            <div class="form-group toggle-row">
              <label>邮箱白名单</label>
              <div class="toggle-wrap" @click="config.email_whitelist_enable = !config.email_whitelist_enable">
                <div :class="['toggle-track', { on: config.email_whitelist_enable }]">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
            <div class="form-group toggle-row">
              <label>启用 reCAPTCHA</label>
              <div class="toggle-wrap" @click="config.recaptcha_enable = !config.recaptcha_enable">
                <div :class="['toggle-track', { on: config.recaptcha_enable }]">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>reCAPTCHA Key</label>
              <input v-model="config.recaptcha_key" class="or-input" placeholder="Secret Key" :disabled="!config.recaptcha_enable" />
            </div>
            <div class="form-group">
              <label>reCAPTCHA Site Key</label>
              <input v-model="config.recaptcha_site_key" class="or-input" placeholder="Site Key" :disabled="!config.recaptcha_enable" />
            </div>
          </div>
        </div>

        <!-- Save bar -->
        <div class="save-bar">
          <Transition name="fade-slide">
            <span v-if="saved" class="save-success">
              &#10003; 保存成功
            </span>
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

// Layout
.config-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: $gap-md;
  align-items: start;
}

// Tab Nav
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
  gap: $gap-sm;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  background: transparent;
  border-radius: $card-radius-sm;
  transition: all 0.15s;
  text-align: left;

  .tab-icon {
    width: 20px;
    text-align: center;
    font-size: 14px;
  }

  &:hover {
    background: var(--bg-elevated);
    color: var(--text-1);
  }

  &.active {
    background: rgba(var(--brand-rgb), 0.1);
    color: var(--brand-light);
    font-weight: 600;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 16px;
      background: var(--grad-brand);
      border-radius: 2px;
    }
  }

  position: relative;
}

// Tab content
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
  width: 44px;
  height: 24px;
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
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
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

.test-btn,
.webhook-btn {
  margin-top: $gap-md;
}

// Save bar
.save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $gap-md;
  margin-top: $gap-xl;
  padding-top: $gap-md;
  border-top: 1px solid var(--border);
}

.save-success {
  font-size: 13px;
  color: var(--success);
  font-weight: 600;
}

// Transition
.fade-slide-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: $bp-tablet) {
  .config-layout {
    grid-template-columns: 1fr;
  }
  .tab-nav {
    flex-direction: row;
    overflow-x: auto;
    position: static;
    gap: $gap-xs;

    .tab-btn {
      white-space: nowrap;
      padding: 8px 12px;
      font-size: 12px;
    }
  }
}

@media (max-width: $bp-mobile) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .span-2 { grid-column: span 1; }
}
</style>

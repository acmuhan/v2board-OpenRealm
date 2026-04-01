# 部署指南 — OpenRealm × V2Board

本文档介绍如何将 OpenRealm 前端部署到 V2Board 后端环境。

> **适配版本**：[wyx2685/v2board](https://github.com/wyx2685/v2board)（WebMan 分支），兼容原版 v2board 1.7.x/1.8.x

---

## 目录

- [V2Board 架构说明](#v2board-架构说明)
- [前置要求](#前置要求)
- [构建前端](#构建前端)
- [方案一：集成到 V2Board 主题目录（推荐）](#方案一集成到-v2board-主题目录推荐)
- [方案二：独立子域名部署](#方案二独立子域名部署)
- [方案三：宝塔面板部署](#方案三宝塔面板部署)
- [API 路径说明](#api-路径说明)
- [安全路径配置](#安全路径配置)
- [OpenRealm 主题配置](#openrealm-主题配置)
- [常见问题](#常见问题)

---

## V2Board 架构说明

wyx2685 分支使用 **WebMan** 作为运行时（默认监听 `127.0.0.1:6600`），Nginx 将**全站请求**反代到 WebMan，而非只代理 `/api/`。

```
用户请求
  └─→ Nginx (:80/:443)
        ├─ try_files 找到静态文件 → 直接返回（主题静态资源）
        └─ 其他请求 → proxy_pass http://127.0.0.1:6600 (WebMan)
                          └─ V2Board 路由处理（API + 管理后台）
```

**V2Board API 路径前缀均为 `/api/v1/`**：

| 模块 | 路径前缀 |
|------|---------|
| 登录/注册 | `/api/v1/passport/...` |
| 用户接口 | `/api/v1/user/...` |
| 管理后台 | `/api/v1/admin/...` |
| 节点上报 | `/api/v1/server/...` |
| 访客接口 | `/api/v1/guest/...` |

---

## 前置要求

- **Node.js ≥ 18**（仅构建时需要，服务器不需要）
- 已部署并运行的 V2Board 后端（[wyx2685/v2board](https://github.com/wyx2685/v2board)）
- Nginx（宝塔/aPanel 均可）

---

## 构建前端

```bash
# 1. 克隆仓库
git clone https://github.com/acmuhan/v2board-OpenRealm.git
cd v2board-OpenRealm

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
vim .env
```

编辑 `.env`：

```env
# V2Board API 完整前缀（重要：必须包含 /v1）
# 集成部署（同域）填 /api/v1
# 独立子域名部署填完整地址：https://api.yourdomain.com/api/v1
VITE_API_BASE=/api/v1

# 站点名称
VITE_SITE_NAME=OpenRealm
```

```bash
# 4. 构建生产包（输出到 dist/）
npm run build
```

---

## 方案一：集成到 V2Board 主题目录（推荐）

将 OpenRealm 作为 V2Board 的一个主题，与后端运行在同一域名，无需跨域配置。

### 1. 复制到主题目录

```bash
# V2Board 根目录通常在 /www/wwwroot/v2board 或 /var/www/v2board
V2B_ROOT=/www/wwwroot/v2board

# 创建主题目录
mkdir -p $V2B_ROOT/public/theme/openrealm

# 将构建产物复制进去
cp -r dist/* $V2B_ROOT/public/theme/openrealm/
```

目录结构应为：
```
{v2board}/public/theme/openrealm/
├── index.html
└── assets/
    ├── *.js
    └── *.css
```

### 2. 配置 Nginx 支持 SPA 路由

V2Board 的标准 Nginx 配置为：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/v2board/public;   # 注意：webroot 是 /public
    index index.html index.php;

    # 静态文件直接服务，其他转发到 WebMan
    location / {
        try_files $uri $uri/ @backend;
    }

    # OpenRealm SPA 路由支持（主题子路径下的前端路由）
    location /theme/openrealm/ {
        try_files $uri $uri/ /theme/openrealm/index.html;
    }

    # WebMan 后端（处理所有 API 和动态请求）
    location @backend {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://127.0.0.1:6600;   # WebMan 默认端口
    }

    # 静态资源长缓存
    location ~* \.(js|css|png|jpg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html application/javascript text/css application/json;
}
```

### 3. 在 V2Board 管理后台选择主题

1. 登录 V2Board 管理后台
2. 进入 **系统设置 → 站点配置 → 前端设置**
3. 主题选择：`openrealm`
4. 保存设置

---

## 方案二：独立子域名部署

OpenRealm 部署在独立子域名（如 `app.yourdomain.com`），API 请求跨域转发到 V2Board。

### 1. 修改 `.env`

```env
# 指向 V2Board 后端完整地址（含 /api/v1）
VITE_API_BASE=https://panel.yourdomain.com/api/v1
VITE_SITE_NAME=OpenRealm
```

重新构建：`npm run build`

### 2. 部署静态文件

```bash
cp -r dist/* /www/wwwroot/openrealm/
```

### 3. Nginx 配置（OpenRealm 专用域名）

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    root /www/wwwroot/openrealm;
    index index.html;

    # Vue Router History 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html application/javascript text/css application/json;
}
```

### 4. V2Board 开启 CORS（跨域必须）

在 V2Board 根目录 `.env` 中添加：

```env
# 允许跨域的前端域名
APP_CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
```

---

## 方案三：宝塔面板部署

### 集成部署（推荐）

1. 进入 V2Board 网站根目录 → `public/theme/` 文件夹
2. 新建文件夹 `openrealm`，将 `dist/` 内文件上传进去
3. 进入网站 **设置 → 伪静态**，在现有规则中追加：
   ```nginx
   location /theme/openrealm/ {
       try_files $uri $uri/ /theme/openrealm/index.html;
   }
   ```
4. 登录 V2Board 管理后台 → 站点配置 → 前端设置 → 选择 `openrealm`

### 独立域名部署

1. **新建网站** → 子域名 `app.yourdomain.com`，根目录如 `/www/wwwroot/openrealm`
2. **上传** `dist/` 内所有文件到网站根目录
3. **伪静态** → 选择 `Vue` 预设
4. **SSL** → 申请免费证书，开启强制 HTTPS
5. V2Board 后端需开启 CORS（见方案二第4步）

---

## API 路径说明

OpenRealm 通过 `VITE_API_BASE` 环境变量指定 API 基础路径。

| 部署方式 | `.env` 配置 | 实际请求路径 |
|---------|------------|------------|
| 同域集成 | `VITE_API_BASE=/api/v1` | `/api/v1/passport/auth/login` |
| 独立子域名 | `VITE_API_BASE=https://panel.com/api/v1` | `https://panel.com/api/v1/user/info` |

> **注意**：本项目开发模式（`vite.config.ts`）中配置了 `rewrite: path.replace(/^\/api/, '/api/v1')`，
> 所以本地开发时 `VITE_API_BASE=/api` 也能工作。但**生产环境建议直接设置 `VITE_API_BASE=/api/v1`**，
> 避免 Nginx 额外配置路径重写。

---

## 安全路径配置

OpenRealm 支持**自定义管理后台入口路径**（防扫描器探测 `/admin`）。

在浏览器控制台执行一次：

```javascript
localStorage.setItem('or_admin_path', 'your-secret-path')
```

之后通过 `https://your-domain.com/your-secret-path` 访问管理后台。
清除该值恢复默认 `/admin` 路径。

> V2Board 后端管理路径同样可在 `.env` 的 `ADMIN_AUTHORIZE` 中配置。

---

## OpenRealm 主题配置

所有配置保存在**用户浏览器 `localStorage`**，无需服务端配置：

| 键名 | 可选值 | 默认值 | 说明 |
|------|--------|--------|------|
| `or_theme` | `light` / `dark` / `violet` | `light` | 颜色主题 |
| `or_locale` | `zh-CN` / `en` | `zh-CN` | 界面语言 |
| `or_admin_path` | 任意字符串 | `admin` | 管理后台路径 |
| `or_token` | JWT Token | — | 登录态（自动管理） |

---

## 常见问题

**Q: 刷新页面 404？**
A: 未配置 History 模式伪静态。集成部署需在 Nginx 添加 `/theme/openrealm/` 的 `try_files` 规则；独立部署选择 Vue 伪静态预设。

**Q: API 请求 401/404？**
A: 检查 `VITE_API_BASE` 是否正确设置为 `/api/v1`（含 v1）。用浏览器 DevTools Network 面板确认实际请求 URL。

**Q: API 请求 502？**
A: V2Board WebMan 服务未运行。检查：`ps aux | grep webman` 或宝塔面板进程管理器中 webman 状态。

**Q: 跨域 CORS 报错？**
A: 独立子域名部署必须在 V2Board `.env` 设置 `APP_CORS_ALLOWED_ORIGINS`。

**Q: 管理后台访问 403？**
A: 数据库中确认用户 `is_admin = 1`，或 V2Board 管理员账号密码是否正确。

**Q: 如何更新前端？**
```bash
git pull
npm install
npm run build
# 集成部署：
cp -r dist/* /www/wwwroot/v2board/public/theme/openrealm/
# 独立部署：
cp -r dist/* /www/wwwroot/openrealm/
```

---

## 项目信息

- **GitHub**: https://github.com/acmuhan/v2board-OpenRealm
- **技术栈**: Vue 3 + TypeScript + Vite + Pinia + vue-i18n
- **适配版本**: [wyx2685/v2board](https://github.com/wyx2685/v2board)（WebMan 分支）及原版 v2board 1.7.x / 1.8.x
- **参考文档**: [docs.v2board.com](https://docs.v2board.com)

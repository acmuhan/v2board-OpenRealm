# 部署指南 — OpenRealm × V2Board

本文档介绍如何将 OpenRealm 前端部署到 V2Board 后端环境，支持 **Nginx**、**Apache**、**宝塔面板** 三种方式。

---

## 目录

- [前置要求](#前置要求)
- [构建前端](#构建前端)
- [方案一：Nginx 部署](#方案一nginx-部署)
- [方案二：Apache 部署](#方案二apache-部署)
- [方案三：宝塔面板](#方案三宝塔面板)
- [环境变量配置](#环境变量配置)
- [反代理配置（API 转发）](#反代理配置api-转发)
- [安全路径配置](#安全路径配置)
- [主题与语言](#主题与语言)
- [常见问题](#常见问题)

---

## 前置要求

- Node.js ≥ 18（构建时需要）
- 已部署并运行的 [V2Board](https://github.com/v2board/v2board) 后端
- Web 服务器：Nginx / Apache / 宝塔

---

## 构建前端

```bash
# 1. 克隆仓库
git clone https://github.com/acmuhan/v2board-OpenRealm.git
cd v2board-OpenRealm

# 2. 安装依赖
npm install

# 3. 配置环境变量（见下方说明）
cp .env.example .env
vim .env

# 4. 构建生产包
npm run build
# 输出到 dist/ 目录
```

---

## 环境变量配置

编辑项目根目录的 `.env` 文件：

```env
# V2Board 后端 API 地址（必填）
# 同域部署填 /api，跨域填完整地址
VITE_API_BASE=/api

# 站点名称（可选，显示在页面标题）
VITE_SITE_NAME=OpenRealm
```

> **同域部署**（推荐）：前后端同一域名，`VITE_API_BASE=/api`，由 Nginx 反代到 V2Board。
> **跨域部署**：`VITE_API_BASE=https://api.yourdomain.com`，需在 V2Board 后端开启 CORS。

---

## 方案一：Nginx 部署

### 1. 复制构建产物

```bash
# 将 dist/ 内容复制到 Web 根目录
cp -r dist/* /var/www/openrealm/
```

### 2. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/openrealm;
    index index.html;

    # Vue Router History 模式 — 所有路由返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 反代理到 V2Board 后端
    location /api/ {
        proxy_pass http://127.0.0.1:7001/;   # V2Board 默认端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源长缓存
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 开启 Gzip
    gzip on;
    gzip_types text/html application/javascript text/css application/json;
    gzip_min_length 1024;
}
```

### 3. HTTPS（推荐）

```bash
# 使用 Certbot 申请 SSL
certbot --nginx -d your-domain.com
```

### 4. 重载配置

```bash
nginx -t && systemctl reload nginx
```

---

## 方案二：Apache 部署

### 1. 复制构建产物

```bash
cp -r dist/* /var/www/html/openrealm/
```

### 2. `.htaccess`（已包含在 dist/ 中，如无则手动创建）

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### 3. VirtualHost 配置

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html/openrealm

    <Directory /var/www/html/openrealm>
        AllowOverride All
        Require all granted
    </Directory>

    # 反代到 V2Board
    ProxyPass /api/ http://127.0.0.1:7001/
    ProxyPassReverse /api/ http://127.0.0.1:7001/
</VirtualHost>
```

---

## 方案三：宝塔面板

1. **新建网站** → 域名填入你的域名，根目录选一个空目录（如 `/www/wwwroot/openrealm`）
2. **上传文件** → 将本地 `dist/` 内所有文件上传到网站根目录
3. **伪静态** → 选择 `Vue` 预设，或手动填入：
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
4. **反向代理** → 新增代理规则：
   - 代理名称：`v2board-api`
   - 代理目录：`/api/`
   - 目标 URL：`http://127.0.0.1:7001`（V2Board 地址）
5. **SSL** → 申请免费证书，开启强制 HTTPS

---

## 反代理配置（API 转发）

V2Board 的 API 路径结构：

| 前端请求路径 | 代理转发到 V2Board |
|-------------|------------------|
| `/api/passport/auth/login` | `http://v2board:7001/api/v1/passport/auth/login` |
| `/api/user/info` | `http://v2board:7001/api/v1/user/info` |
| `/api/admin/...` | `http://v2board:7001/api/v1/admin/...` |

> 注意：`vite.config.ts` 中的开发代理已配置 `rewrite: path.replace(/^\/api/, '/api/v1')`，
> 生产环境 Nginx 需要同样处理路径重写：

```nginx
location /api/ {
    rewrite ^/api/(.*)$ /api/v1/$1 break;
    proxy_pass http://127.0.0.1:7001;
    # ... 其他 proxy_set_header
}
```

---

## 安全路径配置

OpenRealm 支持**自定义管理后台入口路径**（防止扫描器探测 `/admin`）。

### 设置自定义路径

在浏览器控制台执行一次（或通过初始化脚本）：

```javascript
localStorage.setItem('or_admin_path', 'your-secret-path')
```

之后通过 `https://your-domain.com/your-secret-path` 访问管理后台。

### Nginx 路由支持

```nginx
# 如果使用了自定义管理路径，确保 try_files 覆盖所有路由
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 主题与语言

所有配置保存在浏览器 `localStorage`，无需服务端配置：

| 键名 | 可选值 | 说明 |
|------|--------|------|
| `or_theme` | `light` / `dark` / `violet` | 主题 |
| `or_locale` | `zh-CN` / `en` | 语言 |
| `or_admin_path` | 任意字符串 | 管理后台路径 |
| `or_token` | JWT Token | 登录态（自动管理） |

---

## 常见问题

**Q: 刷新页面 404？**
A: 未配置 History 模式伪静态。参考上方 Nginx `try_files` 或 Apache `.htaccess` 配置。

**Q: API 请求 502/404？**
A: 检查 V2Board 是否正常运行（`systemctl status v2board` 或 `php artisan queue:work`），以及 Nginx 代理路径是否正确。

**Q: 登录后跳转到空白页？**
A: 通常是 CORS 或 Token 头问题。确认 V2Board 后端 `ADMIN_AUTHORIZE` 配置，以及前端 `Authorization` 请求头是否被 Nginx 透传。

**Q: 管理后台访问 403？**
A: V2Board 后端需要管理员账号（`is_admin = 1`），在数据库中确认用户权限。

**Q: 如何更新前端？**
```bash
git pull
npm install
npm run build
cp -r dist/* /var/www/openrealm/
```

---

## 项目信息

- **GitHub**: https://github.com/acmuhan/v2board-OpenRealm
- **技术栈**: Vue 3 + TypeScript + Vite + Pinia + vue-i18n
- **兼容版本**: V2Board 1.7.x / 1.8.x

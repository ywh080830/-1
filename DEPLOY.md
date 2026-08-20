# 部署与域名（yimei.cc.cd）

> **当前实际方案：方案 B Cloudflare Pages（国内代理）**
> 架构：数据存储于 Supabase（用户不可见）；前端服务部署于 Cloudflare Pages，
> 绑定自定义域名 `yimei.cc.cd`，国内访问经 Cloudflare 代理分发。
> 用户访问入口仅为自有域名，隐私政策不披露 Supabase 存储地址（详见 deliverables/敏感信息排查报告.md）。

## 方案 B：Cloudflare Pages（当前使用，推荐）

1. 构建命令 `npm run build`，输出目录 `dist`
2. SPA 回退：`public/_redirects` 已配置（内容 `/* /index.html 200`，随构建自动进入 dist）
3. 自定义域绑定 `yimei.cc.cd`
4. 平台侧配置环境变量：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_APP_URL`、`VITE_OCR_LIMIT`（勿上传 .env）

## 方案 A：Vercel（备选，已含 vercel.json）

```bash
npm install
npm run build          # 输出 dist/
vercel --prod          # 或 GitHub 集成自动部署
```

- SPA 回退：`vercel.json` 已配置 `rewrites → /index.html`
- 缓存：`/icons/*` 一年不可变缓存；`manifest.webmanifest` 正确 Content-Type

## 域名 CNAME 说明（yimei.cc.cd）

| 记录 | 类型 | 名称 | 值 |
|---|---|---|---|
| 根域 | CNAME | `yimei.cc.cd` | Cloudflare Pages 分配的域名（pages.dev） |
| www | CNAME | `www` | 同上 |

- 在域名注册商处将 `yimei.cc.cd` 添加 CNAME 指向 Cloudflare Pages；
- Cloudflare 侧绑定自定义域后自动签发 HTTPS 证书；
- Supabase API 请求由前端客户端直连 Supabase 默认域名（anon key + RLS 保护），
  普通用户仅感知 `yimei.cc.cd`，不会在界面/文档中暴露 Supabase 存储地址；
  如需完全同域，可将 `api.yimei.cc.cd` 自定义域名绑定至 Supabase（S2 可选优化）。

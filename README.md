# 智能记账

> 元答AI工作室 出品 · 个人 / 家庭智能记账 PWA
> 拍照记账 · 自动归类 · 离线优先 · 永远无广告

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-✓-5A0FC8)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4-7C3AED)
![ECharts](https://img.shields.io/badge/ECharts-5-FC4E4E?logo=apacheecharts&logoColor=white)

一款支持拍照识别、商户自动归类、离线优先的智能记账应用。核心记账功能完全免费，无任何广告。

## ✨ 功能特性

- **快速记账**：支出 / 收入 / 转账，磁力键盘计算器，分类 / 账户 / 商户管理
- **拍照记账**：拍照 OCR 识别金额与内容，智能匹配商户并自动归类
- **离线优先**：本地优先存储，弱网 / 无网可用，联网后自动增量同步（冲突收敛）
- **统计分析**：环形占比、收支趋势、日历热力图
- **多账本**：共享记账，成员分级权限
- **预算与规划**：预算管理、借贷记录、模板 / 周期记账、存钱目标、资产管理
- **会员体系**：订阅制会员，服务端权益校验（首月低价、终身买断）
- **客服支持**：智能客服 FAQ、会话、工单
- **数据能力**：Excel / CSV 导出，主流记账 App 数据导入
- **体验细节**：PWA 可安装离线使用、深色模式、无障碍达标、真实 SVG 图标

## 🛠 技术栈

- **前端**：React 18 · TypeScript 5 · Vite 5 · react-router-dom · Tailwind CSS 3
- **状态**：Zustand（auth / ledger / tx / sync / theme / ui）
- **数据**：本地 IndexedDB 优先 + 后端即服务（BaaS）云同步，增量同步引擎
- **图表**：ECharts 5 · **表格**：SheetJS (xlsx) · **工具**：dayjs · vite-plugin-pwa

## 🚀 快速开始

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
```

生产构建：

```bash
npm run build      # 输出 dist/（含 Service Worker + manifest）
npm run preview
```

## ⚙️ 环境变量

复制 `.env.example` 为 `.env` 并填写（均以占位符为准）：

```bash
VITE_API_URL=<你的后端服务地址>
VITE_ANON_KEY=<公开匿名密钥>
VITE_APP_URL=<你的应用域名>
VITE_OCR_LIMIT=20
```

云函数运行时密钥由部署平台配置（服务端密钥，不进入前端）：

```bash
SERVICE_ROLE_KEY=<服务端角色密钥>
OCR_API_KEY=<可选，OCR 服务密钥>
ALLOWED_ORIGINS=<允许的来源域名>
```

## 📁 目录结构

```
smart_bookkeeping/
├── public/               # manifest、Service Worker、图标（真实 SVG）
├── server/               # 服务端：配置 / 数据库迁移 / 云函数
└── src/
    ├── types/            # 类型定义（唯一类型来源）
    ├── lib/              # 数据访问 / 金额 / 本地存储 / 同步引擎 / OCR / 导出
    ├── stores/           # zustand 状态（auth / ledger / tx / sync / theme / ui）
    ├── hooks/            # useAuth / useLedger / useTransactions / useRealtime / useOnline ...
    ├── components/       # 布局 / 通用 / 分类 / 交易 / 统计 / 键盘 / 账本 / OCR / 会员 / 客服
    ├── pages/            # 33 路由页面（懒加载）
    └── styles/           # 设计 token / 全局样式 / Tailwind
```

## 🏗 部署

1. 构建前端：`npm run build`，产物 `dist/`
2. `dist/` 部署到任意静态托管（支持 SPA 回退与 HTTPS）
3. 云函数与服务端数据库随 BaaS 平台发布，运行时密钥在平台配置
4. 生产环境域名解析至静态托管后，将域名填入前端 `VITE_APP_URL`

## 🎨 设计约定

- 设计 token 见 `src/styles/tokens.css`（6 槽配色 + 语义色，浅 / 深两套主题）
- 金额：接口传输 string decimal；计算一律整数分；展示保留两位小数
- 图标：全部真实 SVG，禁用 emoji
- 动效：仅 `transform` / `opacity`，时长 ≤ 0.3s；触控目标 ≥ 44px

---

> 制作工作室：元答AI工作室

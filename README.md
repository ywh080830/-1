# 智能记账（smart_bookkeeping）

> 元答AI工作室出品 ｜ Web PWA（React 18 + TypeScript + Vite）+ Supabase 全后端
> 正式域名：`yimei.cc.cd` ｜ Supabase ref：`sticrfirfyegdbssdaqm`（PG 17, ap-southeast-1）

## 功能概览

- 快速记账（支出/收入/转账）、磁力键盘计算器、分类/账户/商户
- 拍照 OCR 识别（Edge Function 规则模拟管线 + 商户自学习）
- 离线优先：IndexedDB 本地即真相 + `sync_op_log` 增量同步（LWW 冲突）
- 统计：环形占比 / 收支趋势 / 日历热力（ECharts）
- 多账本 + 共享成员（owner/editor/viewer 角色 + RLS）
- 预算、借贷、模板/周期记账、存钱目标、资产
- 会员体系（模拟支付 + 服务端 entitlements 校验）
- 客服（FAQ 智能客服 / 会话 / 工单）
- Excel/CSV 导出、CSV 导入（钱迹/随手记/鲨鱼映射）
- PWA 可安装、可离线打开；深色模式；WCAG 2.2 AA；真实 SVG 图标（禁 emoji）

## 技术栈

Vite 5 · React 18 · TypeScript 5 · react-router-dom v6 · @supabase/supabase-js v2 ·
zustand v4 · Tailwind CSS 3 · lucide-react · ECharts 5 · xlsx(SheetJS) · idb v8 · dayjs · vite-plugin-pwa

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
```

生产构建：

```bash
npm run build      # 输出 dist/（含 Service Worker + manifest）
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

```
VITE_SUPABASE_URL=https://sticrfirfyegdbssdaqm.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_APP_URL=https://yimei.cc.cd
VITE_OCR_LIMIT=20
```

Edge Functions 运行时密钥（`supabase secrets set`）：

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OCR_API_KEY=<可选>
APP_URL=...
```

## 目录结构

```
smart_bookkeeping/
├── public/               # manifest、SW 占位、icons（29 个真实 SVG）
├── supabase/
│   ├── config.toml
│   ├── migrations/       # 0003–0006 迁移（新表/种子/RLS/RPC）
│   └── functions/        # ocr-recognize / export-excel / import-csv /
│                         # membership-verify / support-faq / reminder-check
├── docs/sql/verify.sql   # 迁移后校验脚本
└── src/
    ├── types/            # database / models / api / sync（唯一类型来源）
    ├── lib/              # supabase / api / money / idb / syncEngine / ocr / export / icons
    ├── stores/           # auth / ledger / tx / sync / theme / ui（zustand）
    ├── hooks/            # useAuth / useLedger / useTransactions / useRealtime / useOnline / useKeypad
    ├── components/       # layout / common / category / tx / stats / keypad /
    │                     # ledger / ocr / merchant / membership / support
    ├── pages/            # 33 路由页面（懒加载）
    └── styles/           # tokens.css（设计 token）/ global.css / tailwind.css
```

## 数据库迁移

```bash
supabase link --project-ref sticrfirfyegdbssdaqm
supabase db push          # 应用 0003–0006
psql "$SUPABASE_DB_URL" -f docs/sql/verify.sql   # 校验
```

## Edge Functions 部署

```bash
supabase functions deploy ocr-recognize
supabase functions deploy export-excel
supabase functions deploy import-csv
supabase functions deploy membership-verify
supabase functions deploy support-faq
supabase functions deploy reminder-check
```

## 设计约定

- 设计 token 见 `src/styles/tokens.css`（§8 6 槽配色 + 语义色，浅/深两套 `data-theme`）
- 金额：API 传输 string decimal；计算一律整数分（`lib/money.ts`）；展示 `toFixed(2)`
- 图标：全部真实 SVG（lucide-react + `public/icons`），禁 emoji
- 动效：仅 `transform` / `opacity`，≤ 0.3s；触控目标 ≥ 44px

> 制作工作室：元答AI工作室

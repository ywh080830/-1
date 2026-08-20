-- ============================================================
-- 0003 · 新表 + 缺失列补全（基于 information_schema 实测核对）
-- ============================================================

-- ---------- 1) ledgers 补列：多币种 / 场景 / 归档 ----------
ALTER TABLE public.ledgers
  ADD COLUMN IF NOT EXISTS currency   text NOT NULL DEFAULT 'CNY',
  ADD COLUMN IF NOT EXISTS scenario   text DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- ---------- 2) accounts 补列：信用卡/电子钱包/隐藏/默认/排序 ----------
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS credit_limit numeric(14,2),
  ADD COLUMN IF NOT EXISTS bill_day     smallint,
  ADD COLUMN IF NOT EXISTS hidden       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_default   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort         int NOT NULL DEFAULT 0;
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE public.accounts ADD CONSTRAINT accounts_type_check
  CHECK (type IN ('cash','bank','credit','invest','stored','wallet','loan'));

-- ---------- 3) transactions 补列：汇率 / 创建人 ----------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS rate       numeric(12,6) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ---------- 4) categories：系统预置分类（ledger_id NULL=全局） ----------
ALTER TABLE public.categories ALTER COLUMN ledger_id DROP NOT NULL;

-- ---------- 5) merchants 补列：个人库 / 默认账户 / 图标 ----------
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS owner_id   uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS icon       text;

-- ---------- 6) profiles 补列：头像 ----------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- ---------- 7) 新表：共享成员 ledger_members ----------
CREATE TABLE IF NOT EXISTS public.ledger_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id  uuid NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','editor','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ledger_id, user_id)
);
CREATE INDEX IF NOT EXISTS lm_ledger ON public.ledger_members(ledger_id);
CREATE INDEX IF NOT EXISTS lm_user   ON public.ledger_members(user_id);

-- ---------- 8) 新表：OCR 任务 ocr_jobs ----------
CREATE TABLE IF NOT EXISTS public.ocr_jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ledger_id   uuid NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  doc_type    text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  result      jsonb,
  confidence  numeric(5,4),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ocr_user ON public.ocr_jobs(user_id, created_at DESC);

-- ---------- 9) 新表：会员购买记录 user_memberships ----------
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id      text NOT NULL REFERENCES public.membership_plans(id),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  provider     text NOT NULL DEFAULT 'mock' CHECK (provider IN ('mock','appstore','alipay','wechat')),
  started_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  original_txn text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS um_user ON public.user_memberships(user_id);

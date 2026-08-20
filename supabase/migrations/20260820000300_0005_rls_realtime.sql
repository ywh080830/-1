-- ============================================================
-- 0005 · RLS 策略补全 + 辅助函数 + Realtime + Storage
-- 范式：业务表一律 is_ledger_member(ledger_id) 读、can_write_ledger(ledger_id) 写
-- ============================================================

-- ---------- 1) 核心辅助函数（RLS 依赖，SECURITY DEFINER 防绕过） ----------
CREATE OR REPLACE FUNCTION public.is_ledger_member(p_ledger uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.ledgers l WHERE l.id = p_ledger AND l.owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.ledger_members m WHERE m.ledger_id = p_ledger AND m.user_id = auth.uid());
$$;

-- 当前用户在账本中的角色：owner/editor/viewer/none
CREATE OR REPLACE FUNCTION public.ledger_role(p_ledger uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT m.role FROM public.ledger_members m WHERE m.ledger_id = p_ledger AND m.user_id = auth.uid()),
    (SELECT 'owner' FROM public.ledgers l WHERE l.id = p_ledger AND l.owner_id = auth.uid()),
    'none');
$$;

-- 是否可写账本（owner/editor）
CREATE OR REPLACE FUNCTION public.can_write_ledger(p_ledger uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT public.ledger_role(p_ledger) IN ('owner','editor');
$$;

-- ---------- 2) 全表开启 RLS ----------
ALTER TABLE public.ledgers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_aliases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_op_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans  ENABLE ROW LEVEL SECURITY;

-- ---------- 3) 逐表策略 ----------

-- ledgers：owner 全权；成员只读
DROP POLICY IF EXISTS ledgers_own ON public.ledgers;
DROP POLICY IF EXISTS ledgers_member_read ON public.ledgers;
CREATE POLICY ledgers_own ON public.ledgers
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ledgers_member_read ON public.ledgers
  FOR SELECT USING (public.is_ledger_member(id));

-- accounts（budgets/loans/templates/goals/transactions 同构）
DROP POLICY IF EXISTS accounts_ledger ON public.accounts;
DROP POLICY IF EXISTS accounts_member_read ON public.accounts;
DROP POLICY IF EXISTS accounts_write ON public.accounts;
CREATE POLICY accounts_member_read ON public.accounts
  FOR SELECT USING (public.is_ledger_member(ledger_id));
CREATE POLICY accounts_write ON public.accounts
  FOR ALL USING (public.can_write_ledger(ledger_id))
  WITH CHECK (public.can_write_ledger(ledger_id));

-- budgets
DROP POLICY IF EXISTS budgets_ledger ON public.budgets;
DROP POLICY IF EXISTS budgets_member_read ON public.budgets;
DROP POLICY IF EXISTS budgets_write ON public.budgets;
CREATE POLICY budgets_member_read ON public.budgets
  FOR SELECT USING (public.is_ledger_member(ledger_id));
CREATE POLICY budgets_write ON public.budgets
  FOR ALL USING (public.can_write_ledger(ledger_id))
  WITH CHECK (public.can_write_ledger(ledger_id));

-- loans
DROP POLICY IF EXISTS loans_ledger ON public.loans;
DROP POLICY IF EXISTS loans_member_read ON public.loans;
DROP POLICY IF EXISTS loans_write ON public.loans;
CREATE POLICY loans_member_read ON public.loans
  FOR SELECT USING (public.is_ledger_member(ledger_id));
CREATE POLICY loans_write ON public.loans
  FOR ALL USING (public.can_write_ledger(ledger_id))
  WITH CHECK (public.can_write_ledger(ledger_id));

-- templates
DROP POLICY IF EXISTS templates_ledger ON public.templates;
DROP POLICY IF EXISTS templates_member_read ON public.templates;
DROP POLICY IF EXISTS templates_write ON public.templates;
CREATE POLICY templates_member_read ON public.templates
  FOR SELECT USING (public.is_ledger_member(ledger_id));
CREATE POLICY templates_write ON public.templates
  FOR ALL USING (public.can_write_ledger(ledger_id))
  WITH CHECK (public.can_write_ledger(ledger_id));

-- goals
DROP POLICY IF EXISTS goals_ledger ON public.goals;
DROP POLICY IF EXISTS goals_member_read ON public.goals;
DROP POLICY IF EXISTS goals_write ON public.goals;
CREATE POLICY goals_member_read ON public.goals
  FOR SELECT USING (public.is_ledger_member(ledger_id));
CREATE POLICY goals_write ON public.goals
  FOR ALL USING (public.can_write_ledger(ledger_id))
  WITH CHECK (public.can_write_ledger(ledger_id));

-- transactions
DROP POLICY IF EXISTS tx_ledger ON public.transactions;
DROP POLICY IF EXISTS tx_member_read ON public.transactions;
DROP POLICY IF EXISTS tx_write ON public.transactions;
CREATE POLICY tx_member_read ON public.transactions
  FOR SELECT USING (public.is_ledger_member(ledger_id));
CREATE POLICY tx_write ON public.transactions
  FOR ALL USING (public.can_write_ledger(ledger_id))
  WITH CHECK (public.can_write_ledger(ledger_id));

-- categories：系统分类全局只读；账本分类按成员读写
DROP POLICY IF EXISTS categories_ledger ON public.categories;
DROP POLICY IF EXISTS categories_system_read ON public.categories;
DROP POLICY IF EXISTS categories_member_read ON public.categories;
DROP POLICY IF EXISTS categories_write ON public.categories;
CREATE POLICY categories_system_read ON public.categories
  FOR SELECT USING (ledger_id IS NULL);
CREATE POLICY categories_member_read ON public.categories
  FOR SELECT USING (public.is_ledger_member(ledger_id));
CREATE POLICY categories_write ON public.categories
  FOR ALL USING (public.can_write_ledger(ledger_id))
  WITH CHECK (public.can_write_ledger(ledger_id));

-- attachments：随交易权限
DROP POLICY IF EXISTS att_tx ON public.attachments;
DROP POLICY IF EXISTS att_member_read ON public.attachments;
DROP POLICY IF EXISTS att_write ON public.attachments;
CREATE POLICY att_member_read ON public.attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transactions t
            WHERE t.id = attachments.transaction_id AND public.is_ledger_member(t.ledger_id)));
CREATE POLICY att_write ON public.attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transactions t
            WHERE t.id = attachments.transaction_id AND public.can_write_ledger(t.ledger_id)))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.transactions t
            WHERE t.id = attachments.transaction_id AND public.can_write_ledger(t.ledger_id)));

-- transaction_tags：随交易权限
DROP POLICY IF EXISTS ttag_tx ON public.transaction_tags;
DROP POLICY IF EXISTS ttag_member_read ON public.transaction_tags;
DROP POLICY IF EXISTS ttag_write ON public.transaction_tags;
CREATE POLICY ttag_member_read ON public.transaction_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_tags.transaction_id AND public.is_ledger_member(t.ledger_id)));
CREATE POLICY ttag_write ON public.transaction_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_tags.transaction_id AND public.can_write_ledger(t.ledger_id)))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_tags.transaction_id AND public.can_write_ledger(t.ledger_id)));

-- merchants：公共库只读；个人库本人可写；公共库写仅 service_role（Edge）
DROP POLICY IF EXISTS merchants_write ON public.merchants;
DROP POLICY IF EXISTS merchants_read ON public.merchants;
DROP POLICY IF EXISTS merchants_personal_write ON public.merchants;
CREATE POLICY merchants_read ON public.merchants
  FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY merchants_personal_write ON public.merchants
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- merchant_aliases：随商户
DROP POLICY IF EXISTS ma_read ON public.merchant_aliases;
DROP POLICY IF EXISTS ma_write ON public.merchant_aliases;
CREATE POLICY ma_read ON public.merchant_aliases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.merchants m
            WHERE m.id = merchant_aliases.merchant_id AND (m.owner_id IS NULL OR m.owner_id = auth.uid())));
CREATE POLICY ma_write ON public.merchant_aliases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.merchants m
            WHERE m.id = merchant_aliases.merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.merchants m
            WHERE m.id = merchant_aliases.merchant_id AND m.owner_id = auth.uid()));

-- ledger_members：成员可见成员列表；仅 owner 增删改（不可授予 owner）
DROP POLICY IF EXISTS lm_member_read ON public.ledger_members;
DROP POLICY IF EXISTS lm_owner_write ON public.ledger_members;
CREATE POLICY lm_member_read ON public.ledger_members
  FOR SELECT USING (public.is_ledger_member(ledger_id) OR user_id = auth.uid());
CREATE POLICY lm_owner_write ON public.ledger_members
  FOR ALL USING (public.ledger_role(ledger_id) = 'owner')
  WITH CHECK (public.ledger_role(ledger_id) = 'owner' AND role IN ('editor','viewer'));

-- ocr_jobs：本人任务
DROP POLICY IF EXISTS ocr_own ON public.ocr_jobs;
CREATE POLICY ocr_own ON public.ocr_jobs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_memberships：只读；写入仅 Edge membership-verify（SECURITY DEFINER / service_role）
DROP POLICY IF EXISTS um_own_read ON public.user_memberships;
CREATE POLICY um_own_read ON public.user_memberships
  FOR SELECT USING (user_id = auth.uid());

-- sync_op_log：只读；写入仅 sync_push RPC
DROP POLICY IF EXISTS synclog_ledger ON public.sync_op_log;
DROP POLICY IF EXISTS synclog_insert ON public.sync_op_log;
DROP POLICY IF EXISTS synclog_member_read ON public.sync_op_log;
CREATE POLICY synclog_member_read ON public.sync_op_log
  FOR SELECT USING (public.is_ledger_member(ledger_id));

-- profiles：本人
DROP POLICY IF EXISTS profiles_own ON public.profiles;
CREATE POLICY profiles_own ON public.profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- support_*：本人会话（保留既有语义，重建保证幂等）
DROP POLICY IF EXISTS sess_own ON public.support_sessions;
CREATE POLICY sess_own ON public.support_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS msg_session ON public.support_messages;
CREATE POLICY msg_session ON public.support_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.support_sessions s
            WHERE s.id = support_messages.session_id AND s.user_id = auth.uid()))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_sessions s
            WHERE s.id = support_messages.session_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS tickets_own ON public.support_tickets;
CREATE POLICY tickets_own ON public.support_tickets
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- membership_plans：公开可读
DROP POLICY IF EXISTS plans_read ON public.membership_plans;
CREATE POLICY plans_read ON public.membership_plans
  FOR SELECT USING (true);

-- ---------- 4) Realtime publication（幂等） ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='sync_op_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_op_log;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='support_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  END IF;
END $$;

-- ---------- 5) Storage buckets + 策略 ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts','receipts',false), ('exports','exports',false), ('avatars','avatars',false)
ON CONFLICT (id) DO NOTHING;

-- 对象路径约定：receipts/<user_id>/<file>；exports/<user_id>/<file>；avatars/<user_id>/<file>
-- 用户仅能读写自己目录（Edge Function 以 service_role 跨用户读 receipts 处理 OCR）
DROP POLICY IF EXISTS receipts_own ON storage.objects;
CREATE POLICY receipts_own ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS exports_own ON storage.objects;
CREATE POLICY exports_own ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS avatars_own ON storage.objects;
CREATE POLICY avatars_own ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

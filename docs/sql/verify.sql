-- ============================================================
-- verify.sql · 迁移后校验脚本（smart_bookkeeping）
-- 用法：psql "$SUPABASE_DB_URL" -f docs/sql/verify.sql
-- 输出：每项检查 RAISE NOTICE 汇总；全部通过打印 ALL_CHECKS_PASSED
-- ============================================================
DO $$
DECLARE
  v_fail int := 0;
  v_cnt  int;
  v_name text;
  v_row  record;
BEGIN
  RAISE NOTICE '======== 智能记账 迁移校验 ========';

  -- 1) 新表存在
  FOREACH v_name IN ARRAY ARRAY['ledger_members','ocr_jobs','user_memberships'] LOOP
    SELECT count(*) INTO v_cnt FROM information_schema.tables
    WHERE table_schema='public' AND table_name=v_name;
    IF v_cnt = 0 THEN
      RAISE NOTICE 'FAIL 表缺失: %', v_name; v_fail := v_fail + 1;
    ELSE
      RAISE NOTICE 'OK   表存在: %', v_name;
    END IF;
  END LOOP;

  -- 2) 关键补列
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ledgers' AND column_name='currency') THEN
    RAISE NOTICE 'FAIL ledgers.currency 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='accounts' AND column_name='credit_limit') THEN
    RAISE NOTICE 'FAIL accounts.credit_limit 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='accounts' AND column_name='bill_day') THEN
    RAISE NOTICE 'FAIL accounts.bill_day 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='rate') THEN
    RAISE NOTICE 'FAIL transactions.rate 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='created_by') THEN
    RAISE NOTICE 'FAIL transactions.created_by 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='merchants' AND column_name='owner_id') THEN
    RAISE NOTICE 'FAIL merchants.owner_id 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='merchants' AND column_name='icon') THEN
    RAISE NOTICE 'FAIL merchants.icon 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
    RAISE NOTICE 'FAIL profiles.avatar_url 缺失'; v_fail := v_fail + 1; END IF;
  RAISE NOTICE 'OK   补列检查完成';

  -- 3) categories 种子 ≥ 40（15 一级 + 二级）
  SELECT count(*) INTO v_cnt FROM public.categories;
  IF v_cnt < 40 THEN
    RAISE NOTICE 'FAIL categories 种子过少: %', v_cnt; v_fail := v_fail + 1;
  ELSE
    RAISE NOTICE 'OK   categories 种子: %', v_cnt;
  END IF;
  SELECT count(*) INTO v_cnt FROM public.categories WHERE parent_id IS NULL;
  IF v_cnt < 15 THEN
    RAISE NOTICE 'FAIL 一级分类过少: %', v_cnt; v_fail := v_fail + 1;
  ELSE
    RAISE NOTICE 'OK   一级分类: %', v_cnt;
  END IF;

  -- 4) RLS 辅助函数
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='is_ledger_member') THEN
    RAISE NOTICE 'FAIL is_ledger_member 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='can_write_ledger') THEN
    RAISE NOTICE 'FAIL can_write_ledger 缺失'; v_fail := v_fail + 1; END IF;
  RAISE NOTICE 'OK   RLS 辅助函数存在';

  -- 5) 关键策略存在
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='tx_member_read') THEN
    RAISE NOTICE 'FAIL transactions.tx_member_read 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='tx_write') THEN
    RAISE NOTICE 'FAIL transactions.tx_write 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sync_op_log' AND policyname='synclog_member_read') THEN
    RAISE NOTICE 'FAIL sync_op_log.synclog_member_read 缺失'; v_fail := v_fail + 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_memberships' AND policyname='um_own_read') THEN
    RAISE NOTICE 'FAIL user_memberships.um_own_read 缺失'; v_fail := v_fail + 1; END IF;
  RAISE NOTICE 'OK   关键 RLS 策略存在';

  -- 6) Realtime publication
  SELECT count(*) INTO v_cnt FROM pg_publication_tables WHERE pubname='supabase_realtime'
    AND schemaname='public' AND tablename IN ('transactions','sync_op_log','support_messages');
  IF v_cnt < 3 THEN
    RAISE NOTICE 'FAIL Realtime publication 表不足: %', v_cnt; v_fail := v_fail + 1;
  ELSE
    RAISE NOTICE 'OK   Realtime publication: % 表', v_cnt;
  END IF;

  -- 7) Storage buckets
  SELECT count(*) INTO v_cnt FROM storage.buckets WHERE id IN ('receipts','exports','avatars');
  IF v_cnt < 3 THEN
    RAISE NOTICE 'FAIL Storage buckets 不足: %', v_cnt; v_fail := v_fail + 1;
  ELSE
    RAISE NOTICE 'OK   Storage buckets: % 个', v_cnt;
  END IF;

  -- 8) RPC 函数
  FOREACH v_name IN ARRAY ARRAY['sync_push','sync_pull','stats_summary','stats_trend','stats_calendar',
                               'search_transactions','ocr_confirm','create_ledger','get_entitlements',
                               'delete_transaction_permanent'] LOOP
    SELECT count(*) INTO v_cnt FROM pg_proc WHERE proname=v_name;
    IF v_cnt = 0 THEN
      RAISE NOTICE 'FAIL RPC 缺失: %', v_name; v_fail := v_fail + 1;
    ELSE
      RAISE NOTICE 'OK   RPC 存在: %', v_name;
    END IF;
  END LOOP;

  -- 9) 同步版本号（sync_op_log.id 为 bigserial）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='sync_op_log' AND column_name='id'
                   AND data_type='bigint') THEN
    RAISE NOTICE 'FAIL sync_op_log.id 非 bigint'; v_fail := v_fail + 1;
  ELSE
    RAISE NOTICE 'OK   sync_op_log.id bigserial 版本号就绪';
  END IF;

  IF v_fail = 0 THEN
    RAISE NOTICE '======== ALL_CHECKS_PASSED ========';
  ELSE
    RAISE NOTICE '======== % CHECK(S) FAILED ========', v_fail;
  END IF;
END $$;

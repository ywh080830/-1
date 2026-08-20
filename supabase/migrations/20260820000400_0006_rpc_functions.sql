-- ============================================================
-- 0006 · RPC 函数
-- 现有函数保留：handle_new_user / learn_merchant / log_sync_op（兼容保留）/ settle_loan
-- 版本号约定：新 op 一律以 sync_op_log.id（bigserial 全局单调）作为 version；
--             sync_pull 以 id > after 增量
-- ============================================================

-- ---------- 1) sync_push / sync_pull（离线同步核心） ----------
-- 批量推送本地 ops：幂等应用 payload 到业务表 + 写 sync_op_log，返回新 version
CREATE OR REPLACE FUNCTION public.sync_push(p_ledger uuid, p_ops jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_op jsonb; v_entity text; v_eid text; v_optype text; v_payload jsonb;
  v_new bigint := 0; v_pushed int := 0;
BEGIN
  IF NOT public.is_ledger_member(p_ledger) THEN RAISE EXCEPTION '40300'; END IF;
  FOR v_op IN SELECT * FROM jsonb_array_elements(p_ops) LOOP
    v_entity := v_op->>'entity'; v_eid := v_op->>'entity_id';
    v_optype := v_op->>'op';     v_payload := v_op->'payload';
    IF EXISTS (SELECT 1 FROM public.sync_op_log
               WHERE ledger_id=p_ledger AND entity=v_entity AND entity_id=v_eid AND op=v_optype) THEN
      CONTINUE; -- 幂等：同实体同操作已存在则跳过
    END IF;
    CASE v_entity
      WHEN 'transaction' THEN
        IF v_optype = 'delete' THEN
          UPDATE public.transactions SET deleted_at = COALESCE(deleted_at, now())
          WHERE id = v_eid::uuid AND ledger_id = p_ledger;
        ELSE
          INSERT INTO public.transactions
            (id, ledger_id, account_id, category_id, type, amount, currency, rate, note,
             merchant_id, merchant_source, txn_date, happened_at, created_by, deleted_at)
          VALUES (
            v_eid::uuid, p_ledger,
            (v_payload->>'account_id')::uuid, (v_payload->>'category_id')::uuid,
            v_payload->>'type', (v_payload->>'amount')::numeric,
            COALESCE(v_payload->>'currency','CNY'), COALESCE((v_payload->>'rate')::numeric,1),
            v_payload->>'note', v_payload->>'merchant_id', v_payload->>'merchant_source',
            COALESCE((v_payload->>'txn_date')::date, CURRENT_DATE),
            COALESCE((v_payload->>'happened_at')::timestamptz, now()),
            auth.uid(), (v_payload->>'deleted_at')::timestamptz
          )
          ON CONFLICT (id) DO UPDATE SET
            account_id=EXCLUDED.account_id, category_id=EXCLUDED.category_id, type=EXCLUDED.type,
            amount=EXCLUDED.amount, currency=EXCLUDED.currency, rate=EXCLUDED.rate, note=EXCLUDED.note,
            merchant_id=EXCLUDED.merchant_id, merchant_source=EXCLUDED.merchant_source,
            txn_date=EXCLUDED.txn_date, happened_at=EXCLUDED.happened_at, deleted_at=EXCLUDED.deleted_at,
            version = transactions.version + 1
          WHERE transactions.version <= COALESCE((v_payload->>'version')::int, 0); -- LWW
        END IF;
      WHEN 'category' THEN
        IF v_optype = 'delete' THEN
          DELETE FROM public.categories WHERE id = v_eid::uuid AND ledger_id = p_ledger;
        ELSE
          INSERT INTO public.categories (id, ledger_id, parent_id, name, kind, icon, color, sort)
          VALUES (v_eid::uuid, p_ledger, (v_payload->>'parent_id')::uuid,
                  v_payload->>'name', COALESCE(v_payload->>'kind','expense'),
                  v_payload->>'icon', v_payload->>'color', COALESCE((v_payload->>'sort')::int, 0))
          ON CONFLICT (id) DO UPDATE SET
            parent_id=EXCLUDED.parent_id, name=EXCLUDED.name, kind=EXCLUDED.kind,
            icon=EXCLUDED.icon, color=EXCLUDED.color, sort=EXCLUDED.sort;
        END IF;
      WHEN 'account' THEN
        IF v_optype = 'delete' THEN
          DELETE FROM public.accounts WHERE id = v_eid::uuid AND ledger_id = p_ledger;
        ELSE
          INSERT INTO public.accounts
            (id, ledger_id, name, type, currency, balance, credit_limit, bill_day, hidden, is_default, sort)
          VALUES (v_eid::uuid, p_ledger, v_payload->>'name', COALESCE(v_payload->>'type','bank'),
                  COALESCE(v_payload->>'currency','CNY'), COALESCE((v_payload->>'balance')::numeric, 0),
                  (v_payload->>'credit_limit')::numeric, (v_payload->>'bill_day')::smallint,
                  COALESCE((v_payload->>'hidden')::boolean, false),
                  COALESCE((v_payload->>'is_default')::boolean, false),
                  COALESCE((v_payload->>'sort')::int, 0))
          ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, type=EXCLUDED.type, currency=EXCLUDED.currency,
            balance=EXCLUDED.balance, credit_limit=EXCLUDED.credit_limit,
            bill_day=EXCLUDED.bill_day, hidden=EXCLUDED.hidden,
            is_default=EXCLUDED.is_default, sort=EXCLUDED.sort;
        END IF;
      WHEN 'budget' THEN
        IF v_optype = 'delete' THEN
          DELETE FROM public.budgets WHERE id = v_eid::uuid AND ledger_id = p_ledger;
        ELSE
          INSERT INTO public.budgets (id, ledger_id, category_id, period, amount, start_date, end_date)
          VALUES (v_eid::uuid, p_ledger, (v_payload->>'category_id')::uuid,
                  COALESCE(v_payload->>'period','month'), (v_payload->>'amount')::numeric,
                  (v_payload->>'start_date')::date, (v_payload->>'end_date')::date)
          ON CONFLICT (id) DO UPDATE SET
            category_id=EXCLUDED.category_id, period=EXCLUDED.period, amount=EXCLUDED.amount,
            start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date;
        END IF;
      WHEN 'template' THEN
        IF v_optype = 'delete' THEN
          DELETE FROM public.templates WHERE id = v_eid::uuid AND ledger_id = p_ledger;
        ELSE
          INSERT INTO public.templates
            (id, ledger_id, name, type, amount, period, category_id, account_id, note, enabled)
          VALUES (v_eid::uuid, p_ledger, v_payload->>'name', COALESCE(v_payload->>'type','expense'),
                  (v_payload->>'amount')::numeric, COALESCE(v_payload->>'period','month'),
                  (v_payload->>'category_id')::uuid, (v_payload->>'account_id')::uuid,
                  v_payload->>'note', COALESCE((v_payload->>'enabled')::boolean, true))
          ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, type=EXCLUDED.type, amount=EXCLUDED.amount,
            period=EXCLUDED.period, category_id=EXCLUDED.category_id,
            account_id=EXCLUDED.account_id, note=EXCLUDED.note, enabled=EXCLUDED.enabled;
        END IF;
      WHEN 'goal' THEN
        IF v_optype = 'delete' THEN
          DELETE FROM public.goals WHERE id = v_eid::uuid AND ledger_id = p_ledger;
        ELSE
          INSERT INTO public.goals (id, ledger_id, name, target_amount, current, deadline, icon, color, note)
          VALUES (v_eid::uuid, p_ledger, v_payload->>'name', (v_payload->>'target_amount')::numeric,
                  COALESCE((v_payload->>'current')::numeric, 0), (v_payload->>'deadline')::date,
                  v_payload->>'icon', v_payload->>'color', v_payload->>'note')
          ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, target_amount=EXCLUDED.target_amount, current=EXCLUDED.current,
            deadline=EXCLUDED.deadline, icon=EXCLUDED.icon, color=EXCLUDED.color, note=EXCLUDED.note;
        END IF;
      WHEN 'loan' THEN
        IF v_optype = 'delete' THEN
          DELETE FROM public.loans WHERE id = v_eid::uuid AND ledger_id = p_ledger;
        ELSE
          INSERT INTO public.loans (id, ledger_id, direction, counterparty, amount, due_at, status, note)
          VALUES (v_eid::uuid, p_ledger, COALESCE(v_payload->>'direction','receivable'),
                  v_payload->>'counterparty', (v_payload->>'amount')::numeric,
                  (v_payload->>'due_at')::date, COALESCE(v_payload->>'status','open'), v_payload->>'note')
          ON CONFLICT (id) DO UPDATE SET
            direction=EXCLUDED.direction, counterparty=EXCLUDED.counterparty,
            amount=EXCLUDED.amount, due_at=EXCLUDED.due_at, status=EXCLUDED.status, note=EXCLUDED.note;
        END IF;
      WHEN 'merchant' THEN
        IF v_optype = 'delete' THEN
          DELETE FROM public.merchants WHERE id = v_eid AND owner_id = auth.uid();
        ELSE
          INSERT INTO public.merchants
            (id, owner_id, name, mcc, category_id, account_id, icon, source, confidence, hit_count, last_used, learned)
          VALUES (v_eid, auth.uid(), v_payload->>'name', v_payload->>'mcc',
                  (v_payload->>'category_id')::uuid, (v_payload->>'account_id')::uuid,
                  v_payload->>'icon', COALESCE(v_payload->>'source','local'),
                  COALESCE((v_payload->>'confidence')::numeric, 0),
                  COALESCE((v_payload->>'hit_count')::int, 0),
                  (v_payload->>'last_used')::timestamptz,
                  COALESCE((v_payload->>'learned')::boolean, false))
          ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, mcc=EXCLUDED.mcc, category_id=EXCLUDED.category_id,
            account_id=EXCLUDED.account_id, icon=EXCLUDED.icon, source=EXCLUDED.source,
            confidence=EXCLUDED.confidence, hit_count=EXCLUDED.hit_count,
            last_used=EXCLUDED.last_used, learned=EXCLUDED.learned;
        END IF;
      ELSE NULL;
    END CASE;
    INSERT INTO public.sync_op_log (ledger_id, entity, entity_id, op, payload, actor_id)
    VALUES (p_ledger, v_entity, v_eid, v_optype, v_payload, auth.uid())
    RETURNING id INTO v_new;
    v_pushed := v_pushed + 1;
  END LOOP;
  RETURN jsonb_build_object('pushed', v_pushed, 'latest_version', v_new);
END $$;

-- 拉取增量 ops（每批 ≤ 200，返回最新 version 供客户端游标）
CREATE OR REPLACE FUNCTION public.sync_pull(p_ledger uuid, p_after bigint, p_limit int DEFAULT 200)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ops jsonb; v_latest bigint;
BEGIN
  IF NOT public.is_ledger_member(p_ledger) THEN RAISE EXCEPTION '40300'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'entity', entity, 'entity_id', entity_id, 'op', op, 'payload', payload, 'version', id
    ) ORDER BY id), '[]'::jsonb)
  INTO v_ops FROM (
    SELECT * FROM public.sync_op_log
    WHERE ledger_id = p_ledger AND id > p_after
    ORDER BY id LIMIT p_limit
  ) t;
  SELECT COALESCE(MAX(id), p_after) INTO v_latest FROM public.sync_op_log WHERE ledger_id = p_ledger;
  RETURN jsonb_build_object('ops', v_ops, 'latest_version', v_latest);
END $$;

-- ---------- 2) 统计 RPC ----------
-- 月度汇总：收入/支出/结余 + 支出分类占比
CREATE OR REPLACE FUNCTION public.stats_summary(p_ledger uuid, p_month date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_income numeric(14,2); v_expense numeric(14,2); v_cat jsonb;
BEGIN
  IF NOT public.is_ledger_member(p_ledger) THEN RAISE EXCEPTION '40300'; END IF;
  SELECT COALESCE(SUM(amount) FILTER (WHERE type='income'),0),
         COALESCE(SUM(amount) FILTER (WHERE type='expense'),0)
  INTO v_income, v_expense
  FROM public.transactions
  WHERE ledger_id = p_ledger AND deleted_at IS NULL
    AND date_trunc('month', txn_date) = date_trunc('month', p_month);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'category_id', category_id, 'category_name', c.name, 'icon', c.icon, 'color', c.color,
      'amount', s.amt, 'ratio', ROUND((s.amt / NULLIF(v_expense,0))::numeric, 4)
    ) ORDER BY s.amt DESC), '[]'::jsonb)
  INTO v_cat
  FROM (
    SELECT category_id, SUM(amount) amt FROM public.transactions
    WHERE ledger_id = p_ledger AND deleted_at IS NULL AND type='expense'
      AND date_trunc('month', txn_date) = date_trunc('month', p_month)
    GROUP BY category_id
  ) s LEFT JOIN public.categories c ON c.id = s.category_id;

  RETURN jsonb_build_object(
    'income', v_income, 'expense', v_expense,
    'balance', ROUND((v_income - v_expense)::numeric, 2), 'by_category', v_cat);
END $$;

-- 趋势：n 个月收支序列（range: '3m'|'6m'|'12m'）
CREATE OR REPLACE FUNCTION public.stats_trend(p_ledger uuid, p_range text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_start date; v_rows jsonb;
BEGIN
  IF NOT public.is_ledger_member(p_ledger) THEN RAISE EXCEPTION '40300'; END IF;
  v_start := date_trunc('month', CURRENT_DATE)::date - (replace(p_range,'m','')::int - 1) * interval '1 month';
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'month', to_char(d, 'YYYY-MM'), 'income', COALESCE(i,0), 'expense', COALESCE(e,0)
    ) ORDER BY d), '[]'::jsonb)
  INTO v_rows FROM generate_series(v_start, CURRENT_DATE, interval '1 month') d
  LEFT JOIN LATERAL (
    SELECT SUM(amount) FILTER (WHERE type='income') i, SUM(amount) FILTER (WHERE type='expense') e
    FROM public.transactions
    WHERE ledger_id=p_ledger AND deleted_at IS NULL
      AND date_trunc('month', txn_date) = date_trunc('month', d)
  ) t ON true;
  RETURN v_rows;
END $$;

-- 日历现金流：某月每日收入/支出/净额
CREATE OR REPLACE FUNCTION public.stats_calendar(p_ledger uuid, p_month date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_rows jsonb;
BEGIN
  IF NOT public.is_ledger_member(p_ledger) THEN RAISE EXCEPTION '40300'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'day', txn_date, 'income', COALESCE(i,0), 'expense', COALESCE(e,0), 'net', COALESCE(i,0)-COALESCE(e,0)
    ) ORDER BY txn_date), '[]'::jsonb)
  INTO v_rows FROM (
    SELECT txn_date,
           SUM(amount) FILTER (WHERE type='income') i,
           SUM(amount) FILTER (WHERE type='expense') e
    FROM public.transactions
    WHERE ledger_id=p_ledger AND deleted_at IS NULL
      AND date_trunc('month', txn_date) = date_trunc('month', p_month)
    GROUP BY txn_date
  ) t;
  RETURN v_rows;
END $$;

-- ---------- 3) 搜索 RPC ----------
-- 全局搜索：备注/金额/商户/分类名/日期；返回最近 50 条
CREATE OR REPLACE FUNCTION public.search_transactions(p_ledger uuid, p_q text, p_limit int DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_rows jsonb;
BEGIN
  IF NOT public.is_ledger_member(p_ledger) THEN RAISE EXCEPTION '40300'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', t.id, 'type', t.type, 'amount', t.amount, 'note', t.note,
      'txn_date', t.txn_date, 'category_name', c.name, 'merchant', m.name
    ) ORDER BY t.txn_date DESC), '[]'::jsonb)
  INTO v_rows FROM public.transactions t
  LEFT JOIN public.categories c ON c.id = t.category_id
  LEFT JOIN public.merchants  m ON m.id = t.merchant_id
  WHERE t.ledger_id = p_ledger AND t.deleted_at IS NULL
    AND (t.note ILIKE '%'||p_q||'%'
      OR t.amount::text LIKE '%'||p_q||'%'
      OR m.name ILIKE '%'||p_q||'%'
      OR c.name ILIKE '%'||p_q||'%'
      OR t.txn_date::text LIKE '%'||p_q||'%')
  LIMIT p_limit;
  RETURN v_rows;
END $$;

-- ---------- 4) OCR 确认 + 商户自学习 RPC ----------
-- OCR 确认：写交易（带 merchant_id）+ 记 op + 触发自学习
CREATE OR REPLACE FUNCTION public.ocr_confirm(
  p_job uuid, p_ledger uuid, p_category_id uuid, p_account_id uuid, p_amount numeric,
  p_merchant_id text, p_happened_at timestamptz, p_note text, p_add_to_library boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_tx public.transactions; v_version bigint;
BEGIN
  IF NOT public.can_write_ledger(p_ledger) THEN RAISE EXCEPTION '40300'; END IF;
  INSERT INTO public.transactions
    (ledger_id, account_id, category_id, type, amount, note, merchant_id, merchant_source, txn_date, happened_at, created_by)
  VALUES (p_ledger, p_account_id, p_category_id, 'expense', p_amount, p_note, p_merchant_id,
          (SELECT source FROM public.merchants WHERE id = p_merchant_id), p_happened_at::date, p_happened_at, auth.uid())
  RETURNING * INTO v_tx;

  IF p_add_to_library AND p_merchant_id IS NOT NULL THEN
    PERFORM public.learn_merchant(p_merchant_id, p_category_id);
  END IF;

  INSERT INTO public.sync_op_log (ledger_id, entity, entity_id, op, payload, actor_id)
  VALUES (p_ledger, 'transaction', v_tx.id::text, 'upsert',
          jsonb_build_object('id', v_tx.id, 'type', v_tx.type, 'amount', v_tx.amount,
                             'category_id', v_tx.category_id, 'account_id', v_tx.account_id,
                             'merchant_id', v_tx.merchant_id, 'txn_date', v_tx.txn_date,
                             'happened_at', v_tx.happened_at, 'note', v_tx.note), auth.uid())
  RETURNING id INTO v_version;

  UPDATE public.ocr_jobs SET status='done', updated_at=now() WHERE id = p_job;
  RETURN jsonb_build_object('transaction', v_tx, 'version', v_version);
END $$;

-- 新建账本：插入 ledgers + ledger_members(owner)
CREATE OR REPLACE FUNCTION public.create_ledger(p_name text, p_type text DEFAULT 'family', p_currency text DEFAULT 'CNY')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ledger public.ledgers;
BEGIN
  INSERT INTO public.ledgers (owner_id, name, type, currency) VALUES (auth.uid(), p_name, p_type, p_currency)
  RETURNING * INTO v_ledger;
  INSERT INTO public.ledger_members (ledger_id, user_id, role) VALUES (v_ledger.id, auth.uid(), 'owner');
  RETURN jsonb_build_object('id', v_ledger.id, 'name', v_ledger.name, 'type', v_ledger.type, 'currency', v_ledger.currency);
END $$;

-- 会员权益（服务端计算，Edge membership-verify 复用）
CREATE OR REPLACE FUNCTION public.get_entitlements()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'tier', p.tier, 'plan_id', p.plan_id, 'expires_at', p.member_expires_at,
    'entitlements', CASE
      WHEN p.tier = 'member' THEN COALESCE(mp.benefits, '[]'::jsonb)
      ELSE '[]'::jsonb END
  )
  FROM public.profiles p LEFT JOIN public.membership_plans mp ON mp.id = p.plan_id
  WHERE p.id = auth.uid();
$$;

-- 回收站：永久删除（回收站专用，仍受账本写权限约束）
CREATE OR REPLACE FUNCTION public.delete_transaction_permanent(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = p_id AND public.can_write_ledger(t.ledger_id)
  ) THEN RAISE EXCEPTION '40300'; END IF;
  DELETE FROM public.transactions WHERE id = p_id;
END $$;

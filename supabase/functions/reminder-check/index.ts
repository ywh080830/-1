// ============================================================
// reminder-check · 定时提醒 Edge Function（可选，S1 浏览器通知前端消费）
// 定时扫预算超支 / 借贷到期 / 周期记账（模板）→ 返回 reminders[]
// ============================================================
import { handleCors, json, withAuth } from '../_shared/cors.ts';

async function run(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  // 鉴权：仅返回当前登录用户有权访问账本的提醒（防全库数据泄露）
  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const client = auth.client;
  const uid = auth.user.id;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';
  const reminders: unknown[] = [];

  // 当前用户可访问的账本集合（owner 或共享成员）
  const { data: ownLedgers } = await client.from('ledgers').select('id').eq('owner_id', uid);
  const { data: memberRows } = await client
    .from('ledger_members')
    .select('ledger_id')
    .eq('user_id', uid);
  const ledgerIds: string[] = [
    ...(ownLedgers ?? []).map((l: any) => l.id),
    ...(memberRows ?? []).map((m: any) => m.ledger_id),
  ];
  if (ledgerIds.length === 0) {
    return json({ code: 0, data: { reminders, generated_at: new Date().toISOString() } });
  }

  // 1) 预算超支：本月支出 vs 预算（总预算 + 分类预算）
  const { data: budgets } = await client
    .from('budgets')
    .select('id, ledger_id, category_id, period, amount')
    .in('ledger_id', ledgerIds);
  for (const b of budgets ?? []) {
    if (b.period !== 'month') continue;
    let spent = 0;
    if (b.category_id) {
      const { data } = await client
        .from('transactions')
        .select('amount')
        .eq('ledger_id', b.ledger_id)
        .eq('category_id', b.category_id)
        .eq('type', 'expense')
        .is('deleted_at', null)
        .gte('txn_date', monthStart);
      spent = (data ?? []).reduce((s, t: any) => s + Number(t.amount), 0);
    } else {
      const { data } = await client
        .from('transactions')
        .select('amount')
        .eq('ledger_id', b.ledger_id)
        .eq('type', 'expense')
        .is('deleted_at', null)
        .gte('txn_date', monthStart);
      spent = (data ?? []).reduce((s, t: any) => s + Number(t.amount), 0);
    }
    if (spent > Number(b.amount)) {
      reminders.push({
        type: 'budget_over',
        ledger_id: b.ledger_id,
        budget_id: b.id,
        message: `本月预算已超支 ¥${(spent - Number(b.amount)).toFixed(2)}`,
        amount: spent.toFixed(2),
      });
    }
  }

  // 2) 借贷到期
  const { data: loans } = await client
    .from('loans')
    .select('id, ledger_id, direction, counterparty, amount, due_at')
    .eq('status', 'open')
    .lte('due_at', today)
    .in('ledger_id', ledgerIds);
  for (const l of loans ?? []) {
    reminders.push({
      type: 'loan_due',
      ledger_id: l.ledger_id,
      loan_id: l.id,
      message: `${l.counterparty ?? '对方'} 的${l.direction === 'receivable' ? '应收' : '应付'} ¥${Number(l.amount).toFixed(2)} 已到期`,
      due_at: l.due_at,
    });
  }

  // 3) 周期记账（模板到期日，简化：每月 1 日提醒启用中的月模板）
  const { data: templates } = await client
    .from('templates')
    .select('id, ledger_id, name, period')
    .eq('enabled', true)
    .in('ledger_id', ledgerIds);
  for (const t of templates ?? []) {
    reminders.push({
      type: 'period_template',
      ledger_id: t.ledger_id,
      template_id: t.id,
      message: `周期记账「${t.name}」本月待记录`,
    });
  }

  return json({ code: 0, data: { reminders, generated_at: new Date().toISOString() } });
}

Deno.serve(async (req: Request) => {
  try {
    return await run(req);
  } catch (err) {
    console.error('reminder-check error', err);
    return json({ code: 50000, message: '提醒检查失败' }, 500);
  }
});

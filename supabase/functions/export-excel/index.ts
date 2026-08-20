// ============================================================
// export-excel · 导出 Edge Function
// 查询交易 → 生成 xlsx/csv → 上传 Storage(exports) → 签名 URL
// ============================================================
import * as XLSX from 'npm:xlsx@0.18.5';
import { corsHeaders, handleCors, json, withAuth, serviceClient } from '../_shared/cors.ts';

interface ExportBody {
  ledger_id: string;
  start?: string;
  end?: string;
  format?: 'xlsx' | 'csv';
}

async function run(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const authed = await withAuth(req);
  if (authed instanceof Response) return authed;
  const { user } = authed;

  const body = (await req.json().catch(() => null)) as ExportBody | null;
  if (!body?.ledger_id) {
    return json({ code: 42200, message: '缺少 ledger_id' }, 422);
  }
  const format = body.format === 'csv' ? 'csv' : 'xlsx';
  const start = body.start ?? '1900-01-01';
  const end = body.end ?? '2099-12-31';

  // 特权角色查询（行级安全不适用 RPC 统计，直接查业务表）
  const service = serviceClient();

  // 校验成员身份（特权角色绕过行级安全，需手动检查）
  const { data: ledger } = await service
    .from('ledgers')
    .select('id, name')
    .eq('id', body.ledger_id)
    .maybeSingle();
  if (!ledger) {
    return json({ code: 40400, message: '账本不存在' }, 404);
  }
  const { data: member } = await service
    .from('ledger_members')
    .select('id')
    .eq('ledger_id', body.ledger_id)
    .eq('user_id', user.id)
    .maybeSingle();
  const { data: owned } = await service
    .from('ledgers')
    .select('id')
    .eq('id', body.ledger_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!member && !owned) {
    return json({ code: 40300, message: '无权访问该账本' }, 403);
  }

  const { data: txs } = await service
    .from('transactions')
    .select('id, txn_date, type, amount, currency, rate, note, merchant_id, category_id, account_id, happened_at')
    .eq('ledger_id', body.ledger_id)
    .is('deleted_at', null)
    .gte('txn_date', start)
    .lte('txn_date', end)
    .order('txn_date', { ascending: false })
    .limit(5000);

  const txList = txs ?? [];
  const merchantIds = [...new Set(txList.map((t: any) => t.merchant_id).filter(Boolean))];
  const categoryIds = [...new Set(txList.map((t: any) => t.category_id).filter(Boolean))];
  const accountIds = [...new Set(txList.map((t: any) => t.account_id).filter(Boolean))];

  const [merchants, categories, accounts] = await Promise.all([
    merchantIds.length
      ? service.from('merchants').select('id, name').in('id', merchantIds)
      : Promise.resolve({ data: [] }),
    categoryIds.length
      ? service.from('categories').select('id, name').in('id', categoryIds)
      : Promise.resolve({ data: [] }),
    accountIds.length
      ? service.from('accounts').select('id, name').in('id', accountIds)
      : Promise.resolve({ data: [] }),
  ]);

  const merchantMap = new Map((merchants.data ?? []).map((m: any) => [m.id, m.name]));
  const categoryMap = new Map((categories.data ?? []).map((c: any) => [c.id, c.name]));
  const accountMap = new Map((accounts.data ?? []).map((a: any) => [a.id, a.name]));

  const rows = txList.map((t: any) => ({
    日期: t.txn_date,
    类型: t.type === 'income' ? '收入' : t.type === 'expense' ? '支出' : '转账',
    金额: Number(t.amount).toFixed(2),
    币种: t.currency ?? 'CNY',
    汇率: Number(t.rate ?? 1),
    分类: categoryMap.get(t.category_id) ?? '',
    账户: accountMap.get(t.account_id) ?? '',
    商户: merchantMap.get(t.merchant_id) ?? '',
    备注: t.note ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '流水');

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `流水导出_${dateStr}.${format}`;
  const mime = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const buf = format === 'csv'
    ? XLSX.write(wb, { bookType: 'csv', type: 'array' }) as unknown as ArrayBuffer
    : XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

  const objectPath = `${user.id}/${filename}`;
  const { error: upErr } = await service.storage
    .from('exports')
    .upload(objectPath, new Uint8Array(buf), { contentType: mime, upsert: true });
  if (upErr) {
    return json({ code: 50000, message: `上传导出文件失败: ${upErr.message}` }, 500);
  }

  const { data: signed } = await service.storage
    .from('exports')
    .createSignedUrl(objectPath, 60 * 60);

  return json({
    code: 0,
    data: {
      url: signed?.signedUrl ?? '',
      filename,
      count: rows.length,
      format,
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    return await run(req);
  } catch (err) {
    console.error('export-excel error', err);
    return json({ code: 50000, message: '导出失败，请稍后重试' }, 500);
  }
});

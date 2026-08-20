// ============================================================
// import-csv · CSV 导入 Edge Function
// 解析 CSV → 字段映射 → 校验 → 批量写交易（sync_push 语义：内部 upsert + 记 op）
// ============================================================
import * as XLSX from 'npm:xlsx@0.18.5';
import { corsHeaders, handleCors, json, withAuth, serviceClient } from '../_shared/cors.ts';

interface Mapping {
  date?: string;
  type?: string;
  amount?: string;
  category?: string;
  account?: string;
  note?: string;
  merchant?: string;
}

// 预置映射模板（钱迹/随手记/鲨鱼）
export const PRESETS: Record<string, Mapping> = {
  qianji: { date: '日期', type: '类型', amount: '金额', category: '分类', account: '账户', note: '备注', merchant: '商家' },
  suishouji: { date: '日期', type: '收支', amount: '金额', category: '分类', account: '账户', note: '备注', merchant: '商家' },
  shayu: { date: '时间', type: '类型', amount: '金额', category: '分类', account: '账户', note: '备注', merchant: '商户' },
};

function normalizeType(raw: string): 'income' | 'expense' {
  const v = String(raw ?? '').trim();
  if (/收|入|income|工资|报销/.test(v)) return 'income';
  return 'expense';
}

function parseAmount(raw: string): string | null {
  const m = String(raw ?? '').replace(/[^\d.-]/g, '');
  if (!m) return null;
  const n = Number(m);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

function parseDate(raw: string): string | null {
  const m = String(raw ?? '').match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

async function run(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const authed = await withAuth(req);
  if (authed instanceof Response) return authed;
  const { user } = authed;

  const form = await req.formData();
  const file = form.get('file');
  const ledgerId = String(form.get('ledger_id') ?? '');
  let mapping: Mapping = {};
  try {
    mapping = JSON.parse(String(form.get('mapping') ?? '{}'));
  } catch {
    mapping = {};
  }

  if (!file || typeof file === 'string') {
    return json({ code: 42200, message: '缺少文件 file' }, 422);
  }
  if (!ledgerId) {
    return json({ code: 42200, message: '缺少 ledger_id' }, 422);
  }
  if (!mapping.date || !mapping.amount) {
    return json({ code: 42200, message: '映射必须包含 date 与 amount 字段' }, 422);
  }

  const service = serviceClient();

  // 成员校验
  const { data: member } = await service
    .from('ledger_members')
    .select('id')
    .eq('ledger_id', ledgerId)
    .eq('user_id', user.id)
    .maybeSingle();
  const { data: owned } = await service
    .from('ledgers')
    .select('id')
    .eq('id', ledgerId)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!member && !owned) {
    return json({ code: 40300, message: '无权访问该账本' }, 403);
  }

  const bytes = await file.arrayBuffer();
  const wb = XLSX.read(bytes, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) {
    return json({ code: 42200, message: '无法解析文件' }, 422);
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  // 预取账户/分类
  const { data: accounts } = await service.from('accounts').select('id, name').eq('ledger_id', ledgerId);
  const { data: categories } = await service
    .from('categories')
    .select('id, name, kind')
    .or(`ledger_id.eq.${ledgerId},ledger_id.is.null`);
  const accountMap = new Map((accounts ?? []).map((a: any) => [String(a.name).trim(), a.id]));
  const categoryMap = new Map((categories ?? []).map((c: any) => [String(c.name).trim(), c]));

  let success = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const lineNo = i + 2;
    try {
      const amount = parseAmount(String(raw[mapping.amount] ?? ''));
      const date = parseDate(String(raw[mapping.date] ?? ''));
      if (!amount || !date) {
        errors.push(`第 ${lineNo} 行：金额或日期无效`);
        continue;
      }
      const type = normalizeType(String(raw[mapping.type] ?? ''));
      const categoryName = String(raw[mapping.category] ?? '').trim();
      const accountName = String(raw[mapping.account] ?? '').trim();
      const category = categoryName ? categoryMap.get(categoryName) : undefined;
      const account = accountName ? accountMap.get(accountName) : undefined;

      const txId = crypto.randomUUID();
      const payload = {
        id: txId,
        type,
        amount,
        currency: 'CNY',
        rate: 1,
        note: String(raw[mapping.note] ?? '').trim(),
        merchant_id: null,
        merchant_source: null,
        txn_date: date,
        happened_at: `${date}T12:00:00+08:00`,
        category_id: category?.id ?? null,
        account_id: account?.id ?? null,
        version: Math.floor(Date.now() / 1000),
      };

      const { error: txErr } = await service.from('transactions').insert({
        id: txId,
        ledger_id: ledgerId,
        account_id: payload.account_id,
        category_id: payload.category_id,
        type: payload.type,
        amount: payload.amount,
        currency: 'CNY',
        rate: 1,
        note: payload.note,
        merchant_id: payload.merchant_id,
        merchant_source: payload.merchant_source,
        txn_date: payload.txn_date,
        happened_at: payload.happened_at,
        created_by: user.id,
      });
      if (txErr) {
        errors.push(`第 ${lineNo} 行：写入失败 ${txErr.message}`);
        continue;
      }

      // 记 op（sync_push 语义：服务端统一分配版本号）
      const { error: opErr } = await service.from('sync_op_log').insert({
        ledger_id: ledgerId,
        entity: 'transaction',
        entity_id: txId,
        op: 'upsert',
        payload,
        actor_id: user.id,
      });
      if (opErr) {
        errors.push(`第 ${lineNo} 行：同步日志失败 ${opErr.message}`);
        continue;
      }
      success++;
    } catch (e) {
      errors.push(`第 ${lineNo} 行：${e instanceof Error ? e.message : '未知错误'}`);
    }
  }

  return json({
    code: 0,
    data: { success, failed: errors.length, errors: errors.slice(0, 100) },
  });
}

Deno.serve(async (req: Request) => {
  try {
    return await run(req);
  } catch (err) {
    console.error('import-csv error', err);
    return json({ code: 50000, message: '导入失败，请稍后重试' }, 500);
  }
});

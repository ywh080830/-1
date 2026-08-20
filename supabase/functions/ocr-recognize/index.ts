// ============================================================
// ocr-recognize · 拍照识别 Edge Function
// 规则模拟 OCR 管线：金额/日期正则 + 商户归一化 + 商户匹配
// + 未命中生成 loc_ 前缀 id UPSERT + 写 ocr_jobs + suggest 组装
// 真实 OCR API（OCR_API_KEY）到位后仅替换 extractText 适配器
// ============================================================
import { corsHeaders, handleCors, json, withAuth, serviceClient } from '../_shared/cors.ts';

interface OcrItem {
  name: string;
  qty: number;
  price: string;
}

interface OcrResult {
  amount: string | null;
  tax: string | null;
  tax_rate: number | null;
  merchant: string | null;
  merchant_id: string | null;
  merchant_source: string | null;
  date: string | null;
  invoice_no: string | null;
  items: OcrItem[];
  raw_text: string;
}

interface Suggest {
  category_id: string | null;
  account_id: string | null;
  confidence: number;
  by: 'merchant' | 'ner' | null;
  learned: boolean;
}

// ---------- 文本抽取（规则模拟，真实 API 时替换此函数） ----------
function extractText(_bytes: Uint8Array): string {
  // 模拟 OCR 文本（真实环境由 OCR_API_KEY 调用云服务返回）
  return [
    '收款小票',
    '商户名称：星巴克咖啡(国贸店)',
    '商品：拿铁咖啡 x2 ￥58.00',
    '商品：提拉米苏 x1 ￥32.00',
    '合计：￥90.00',
    '实付：￥90.00',
    '时间：2026-08-19 15:20',
    '单号：2441700000012345',
  ].join('\n');
}

function extractAmount(text: string): string | null {
  const m = text.match(/(?:合计|总计|总额|实付|金额|应收)[:：]?\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)/);
  if (m) return m[1];
  const m2 = text.match(/[¥￥]\s*(\d+(?:\.\d{1,2})?)/);
  return m2 ? m2[1] : null;
}

function extractTax(text: string): string | null {
  const m = text.match(/(?:税额|税费)[:：]?\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)/);
  return m ? m[1] : null;
}

function extractDate(text: string): string | null {
  const m = text.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (!m) return null;
  const y = m[1].padStart(4, '0');
  const mo = m[2].padStart(2, '0');
  const d = m[3].padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function extractInvoiceNo(text: string): string | null {
  const m = text.match(/(?:单号|发票号|流水号)[:：]?\s*([A-Za-z0-9-]{6,})/);
  return m ? m[1] : null;
}

function extractMerchant(text: string): string | null {
  const m = text.match(/(?:商户名称|商户|店名)[:：]?\s*(.+)/);
  if (m) return m[1].trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/店$|超市|咖啡|餐厅|商城|广场|银行|药房|医院/.test(line) && !/商户名称/.test(line)) {
      return line;
    }
  }
  return lines.find((l) => l.length >= 2 && l.length <= 20 && !/^(合计|实付|时间|单号)/.test(l)) ?? null;
}

function extractItems(text: string): OcrItem[] {
  const items: OcrItem[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/^(.+?)\s*[xX×]\s*(\d+)\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)/);
    if (m && !/(合计|实付|总额)/.test(m[1])) {
      items.push({ name: m[1].trim(), qty: Number(m[2]), price: m[3] });
    }
  }
  return items;
}

// ---------- 商户归一化（去分店后缀/繁简/全半角/大小写） ----------
export function normalizeMerchant(name: string): string {
  return name
    .replace(/（[^）]*）?/g, '')
    .replace(/\([^)]*\)?/g, '')
    .replace(/(旗舰店|直营店|体验店|分店|总店|门店|连锁)$/g, '')
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .trim();
}

// 简易繁→简映射（覆盖常见商户字）
const TRAD_TO_SIMP: Record<string, string> = {
  國: '国', 購: '购', 廣: '广', 東: '东', 萬: '万', 龍: '龙', 鳳: '凤',
  銀: '银', 行: '行', 匯: '汇', 豐: '丰', 達: '达', 寶: '宝', 華: '华',
  電: '电', 訊: '讯', 飲: '饮', 餐: '餐', 廳: '厅', 館: '馆', 麵: '面',
  飯: '饭', 點: '点', 龍: '龙', 雞: '鸡', 魚: '鱼', 樂: '乐',
};

function toSimplified(name: string): string {
  return name
    .split('')
    .map((ch) => TRAD_TO_SIMP[ch] ?? ch)
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------- NER 品类推断（回退规则） ----------
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/星巴克|瑞幸|咖啡|奶茶|茶饮|早餐|午餐|晚餐|饭店|餐厅|食堂|外卖|小吃|蛋糕|面包/, '00000000-0000-4000-8000-000000000001'],
  [/滴滴|打车|出租|地铁|公交|加油|停车|高铁|火车|机票|航空|高速/, '00000000-0000-4000-8000-000000000002'],
  [/淘宝|京东|天猫|拼多多|超市|商场|购物|便利店|日用品/, '00000000-0000-4000-8000-000000000003'],
  [/水电|燃气|电费|水费|物业|房租|家居/, '00000000-0000-4000-8000-000000000004'],
  [/医院|门诊|药房|药品|诊所|体检|牙科/, '00000000-0000-4000-8000-000000000005'],
  [/书店|课程|培训|学费|考试|教育/, '00000000-0000-4000-8000-000000000006'],
  [/电影|游戏|网吧|KTV|酒吧|会员|视频|运动/, '00000000-0000-4000-8000-000000000007'],
];

function inferCategory(name: string): { category_id: string | null; confidence: number } {
  for (const [re, id] of CATEGORY_RULES) {
    if (re.test(name)) return { category_id: id, confidence: 0.62 };
  }
  return { category_id: null, confidence: 0 };
}

// ---------- 主流程 ----------
async function run(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const authed = await withAuth(req);
  if (authed instanceof Response) return authed;
  const { user } = authed;

  const form = await req.formData();
  const image = form.get('image');
  const ledgerId = String(form.get('ledger_id') ?? '');
  const docType = String(form.get('doc_type') ?? 'receipt');

  if (!image || typeof image === 'string') {
    return json({ code: 42200, message: '缺少图片文件 image' }, 422);
  }
  if (!ledgerId) {
    return json({ code: 42200, message: '缺少 ledger_id' }, 422);
  }

  const file = image as File;
  const bytes = new Uint8Array(await file.arrayBuffer());

  // 1) 原图存 Storage receipts/<user_id>/<file>
  const service = serviceClient();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await service.storage
    .from('receipts')
    .upload(objectPath, bytes, { contentType: file.type || 'image/jpeg' });
  const imageUrl = upErr
    ? `receipts/${objectPath}`
    : service.storage.from('receipts').getPublicUrl(objectPath).data.publicUrl || `receipts/${objectPath}`;

  // 2) OCR 文本抽取
  const rawText = extractText(bytes);
  const amount = extractAmount(rawText);
  const date = extractDate(rawText);
  const invoiceNo = extractInvoiceNo(rawText);
  const tax = extractTax(rawText);
  const items = extractItems(rawText);
  const rawMerchant = extractMerchant(rawText);

  // 3) 商户匹配
  let merchantId: string | null = null;
  let merchantSource: string | null = null;
  let categoryId: string | null = null;
  let learned = false;

  if (rawMerchant) {
    const norm = toSimplified(normalizeMerchant(rawMerchant));
    // 精确名匹配（公共库 + 个人库）
    const { data: exact } = await service
      .from('merchants')
      .select('id, category_id, source, confidence, learned, hit_count')
      .or(`owner_id.is.null,owner_id.eq.${user.id}`)
      .eq('name', norm)
      .limit(1);
    if (exact && exact.length > 0) {
      merchantId = exact[0].id;
      merchantSource = exact[0].source ?? 'public';
      categoryId = exact[0].category_id;
      learned = Boolean(exact[0].learned);
    } else {
      // 别名匹配
      const { data: aliasRows } = await service
        .from('merchant_aliases')
        .select('merchant_id, merchants(id, category_id, source, learned)')
        .ilike('alias', `%${norm}%`)
        .limit(5);
      const aliasHit = (aliasRows ?? []).find((r: any) => r.merchants);
      if (aliasHit) {
        merchantId = aliasHit.merchant_id;
        categoryId = aliasHit.merchants?.category_id ?? null;
        merchantSource = aliasHit.merchants?.source ?? 'personal';
        learned = Boolean(aliasHit.merchants?.learned);
      }
    }

    // 4) 未命中：归一化名 hash 生成 loc_ 前缀 id UPSERT
    if (!merchantId) {
      const hash = await sha256Hex(norm);
      const locId = `loc_${hash.slice(0, 10)}`;
      merchantId = locId;
      merchantSource = 'auto';
      const { error: upsertErr } = await service.from('merchants').upsert(
        {
          id: locId,
          owner_id: user.id,
          name: norm,
          source: 'local',
          confidence: 0,
          hit_count: 0,
          learned: false,
        },
        { onConflict: 'id' },
      );
      if (upsertErr) {
        console.error('merchant upsert failed', upsertErr.message);
      }
    }
  }

  // 5) 品类建议
  const suggest: Suggest = { category_id: null, account_id: null, confidence: 0, by: null, learned };
  if (merchantId && categoryId) {
    suggest.category_id = categoryId;
    suggest.by = 'merchant';
    suggest.confidence = 0.95;
    suggest.learned = learned;
  } else if (rawMerchant) {
    const ner = inferCategory(rawMerchant);
    suggest.category_id = ner.category_id;
    suggest.by = 'ner';
    suggest.confidence = ner.confidence;
  }

  const confidence = merchantId ? 0.97 : 0.5;
  const result: OcrResult = {
    amount,
    tax,
    tax_rate: tax && amount ? Math.round((Number(tax) / Number(amount)) * 10000) / 100 : null,
    merchant: rawMerchant,
    merchant_id: merchantId,
    merchant_source: merchantSource,
    date,
    invoice_no: invoiceNo,
    items,
    raw_text: rawText,
  };

  // 6) 写 ocr_jobs（result 内嵌 suggest，供确认页回填）
  const storedResult = { ...result, suggest };
  const { data: job, error: jobErr } = await service
    .from('ocr_jobs')
    .insert({
      user_id: user.id,
      ledger_id: ledgerId,
      image_url: imageUrl,
      doc_type: docType,
      status: 'done',
      result: storedResult,
      confidence,
    })
    .select('id, status, doc_type, confidence, result')
    .single();

  if (jobErr) {
    return json({ code: 50000, message: `写 ocr_jobs 失败: ${jobErr.message}` }, 500);
  }

  return json({
    code: 0,
    data: {
      job_id: job.id,
      status: job.status,
      doc_type: job.doc_type,
      confidence: job.confidence,
      result,
      suggest,
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    return await run(req);
  } catch (err) {
    console.error('ocr-recognize error', err);
    return json({ code: 50000, message: 'OCR 识别失败，请稍后重试' }, 500);
  }
});

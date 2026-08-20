/**
 * API 请求/响应类型 + 错误码枚举（对齐 03-API文档 §1.5）。
 */

export enum ErrorCode {
  OK = 0,
  UNAUTHORIZED = 40100, // 未登录 / token 失效
  OAUTH_FAILED = 40101, // 第三方登录失败
  FORBIDDEN = 40300, // 无权访问该账本
  NOT_FOUND = 40400, // 资源不存在
  CONFLICT = 40900, // 并发冲突
  DUPLICATE = 40901, // 重复（如 client_msg_id 幂等冲突）
  VALIDATION = 42200, // 参数校验失败
  RATE_LIMIT = 42900, // 限流（OCR/同步）
  SERVER = 50000, // 服务器错误
}

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
  request_id?: string;
}

export interface Pager {
  total: number;
  page: number;
  page_size: number;
}

export interface Paginated<T> {
  list: T[];
  pager: Pager;
}

/** 月度汇总（RPC stats_summary 返回） */
export interface StatsSummary {
  income: number;
  expense: number;
  balance: number;
  by_category: Array<{
    category_id: string | null;
    category_name: string | null;
    icon: string | null;
    color: string | null;
    amount: number;
    ratio: number | null;
  }>;
}

/** 趋势（RPC stats_trend 返回，range 3m/6m/12m） */
export interface TrendPoint {
  month: string;
  income: number;
  expense: number;
}

/** 日历现金流（RPC stats_calendar 返回） */
export interface CalendarDay {
  day: string;
  income: number;
  expense: number;
  net: number;
}

/** 搜索（RPC search_transactions 返回） */
export interface SearchHit {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  txn_date: string;
  category_name: string | null;
  merchant: string | null;
}

/** 会员权益（RPC get_entitlements 返回） */
export interface Entitlements {
  tier: 'free' | 'member';
  plan_id: string | null;
  expires_at: string | null;
  entitlements: string[];
}

/** OCR 识别响应（Edge ocr-recognize 返回） */
export interface OcrResponse {
  job_id: string;
  status: string;
  doc_type: string | null;
  confidence: number | null;
  result: {
    amount: string | null;
    tax: string | null;
    tax_rate: number | null;
    merchant: string | null;
    merchant_id: string | null;
    merchant_source: string | null;
    date: string | null;
    invoice_no: string | null;
    items: Array<{ name: string; qty: number; price: string }>;
    raw_text: string;
  };
  suggest: {
    category_id: string | null;
    account_id: string | null;
    confidence: number;
    by: 'merchant' | 'ner' | null;
    learned: boolean;
  };
}

/** 导出响应（Edge export-excel 返回） */
export interface ExportResult {
  url: string;
  filename: string;
  count: number;
  format: 'xlsx' | 'csv';
}

/** 导入响应（Edge import-csv 返回） */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/** 会员开通响应（Edge membership-verify 返回） */
export interface MembershipResult {
  status: string;
  plan: { id: string; name: string; period: string } | null;
  expires_at: string | null;
  entitlements: string[];
  tier: 'free' | 'member';
}

/** FAQ 响应（Edge support-faq 返回） */
export interface FaqResult {
  intent: string;
  answer: string;
  suggest_human: boolean;
  matched: boolean;
  related: Array<{ intent: string; keywords: string[] }>;
}

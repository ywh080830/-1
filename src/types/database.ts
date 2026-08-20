/**
 * 后端数据库行类型（与迁移 0003–0006 手工对齐，snake_case）。
 * 唯一类型来源：src/types/；禁止在组件内内联类型。
 * 金额列：numeric 经 PostgREST 序列化为 number，展示经 lib/money.ts 转 string。
 */

export interface ProfileRow {
  id: string;
  phone: string | null;
  nickname: string | null;
  avatar_url: string | null;
  tier: 'free' | 'member';
  plan_id: string | null;
  member_expires_at: string | null;
  created_at: string;
}

export interface LedgerRow {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  currency: string;
  scenario: string | null;
  is_archived: boolean;
  created_at: string;
}

export type LedgerRole = 'owner' | 'editor' | 'viewer';

export interface LedgerMemberRow {
  id: string;
  ledger_id: string;
  user_id: string;
  role: LedgerRole;
  created_at: string;
}

export type AccountType = 'cash' | 'bank' | 'credit' | 'invest' | 'stored' | 'wallet' | 'loan';

export interface AccountRow {
  id: string;
  ledger_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  credit_limit: number | null;
  bill_day: number | null;
  hidden: boolean;
  is_default: boolean;
  sort: number;
  created_at: string;
}

export type TxType = 'income' | 'expense' | 'transfer';

export interface CategoryRow {
  id: string;
  ledger_id: string | null;
  parent_id: string | null;
  name: string;
  kind: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  sort: number;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  ledger_id: string;
  account_id: string | null;
  category_id: string | null;
  type: TxType;
  amount: number;
  currency: string;
  rate: number;
  note: string | null;
  merchant_id: string | null;
  merchant_source: string | null;
  txn_date: string;
  transfer_to: string | null;
  version: number;
  created_at: string;
  deleted_at: string | null;
  happened_at: string;
  created_by: string | null;
}

export interface MerchantRow {
  id: string; // text：m_ 公共 / p_ 个人 / loc_ 本地自动
  owner_id: string | null;
  name: string;
  mcc: string | null;
  category_id: string | null;
  account_id: string | null;
  icon: string | null;
  source: string | null;
  confidence: number;
  hit_count: number;
  last_used: string | null;
  learned: boolean;
  created_at: string;
}

export interface MerchantAliasRow {
  id: string;
  merchant_id: string;
  alias: string;
}

export interface BudgetRow {
  id: string;
  ledger_id: string;
  category_id: string | null;
  period: string;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface LoanRow {
  id: string;
  ledger_id: string;
  direction: 'receivable' | 'payable';
  counterparty: string;
  amount: number;
  due_at: string | null;
  status: string;
  note: string | null;
  created_at: string;
}

export interface TemplateRow {
  id: string;
  ledger_id: string;
  name: string;
  type: TxType;
  amount: number;
  period: string;
  category_id: string | null;
  account_id: string | null;
  note: string | null;
  enabled: boolean;
  created_at: string;
}

export interface GoalRow {
  id: string;
  ledger_id: string;
  name: string;
  target_amount: number;
  current: number;
  deadline: string | null;
  icon: string | null;
  color: string | null;
  note: string | null;
  created_at: string;
}

export interface AttachmentRow {
  id: string;
  transaction_id: string;
  url: string;
  kind: string | null;
  created_at: string;
}

export interface TransactionTagRow {
  transaction_id: string;
  tag: string;
}

export interface MembershipPlanRow {
  id: string; // text: p_month/p_quarter/p_year/p_lifetime
  name: string;
  price: number;
  period: string;
  benefits: string[]; // jsonb
  is_active: boolean;
  created_at: string;
}

export interface UserMembershipRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled';
  provider: 'mock' | 'appstore' | 'alipay' | 'wechat';
  started_at: string;
  expires_at: string | null;
  original_txn: string | null;
  created_at: string;
}

export interface SyncOpLogRow {
  id: number; // bigserial = 全局版本号
  ledger_id: string;
  entity: string;
  entity_id: string;
  op: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

export interface OcrJobRow {
  id: string;
  user_id: string;
  ledger_id: string;
  image_url: string;
  doc_type: string | null;
  status: 'pending' | 'processing' | 'done' | 'failed';
  result: OcrResultPayload | null;
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface OcrResultPayload {
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
}

export interface OcrSuggest {
  category_id: string | null;
  account_id: string | null;
  confidence: number;
  by: 'merchant' | 'ner' | null;
  learned: boolean;
}

export interface SupportSessionRow {
  id: string;
  user_id: string;
  channel: 'bot' | 'human' | 'ticket';
  status: string;
  context: Record<string, unknown> | null;
  started_at: string;
  last_msg_at: string | null;
  closed_at: string | null;
}

export interface SupportMessageRow {
  id: string;
  session_id: string;
  sender: 'user' | 'bot' | 'agent' | 'system';
  msg_type: 'text' | 'image' | 'sys';
  content: string;
  attachments: unknown[] | null;
  client_msg_id: string | null;
  created_at: string;
}

export interface SupportTicketRow {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  attachments: unknown[] | null;
  priority: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
}

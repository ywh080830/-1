/**
 * 业务模型（camelCase，前端唯一消费形态）。
 * 金额一律 string decimal；数据库行 → 模型转换器在此集中维护。
 */
import type {
  AccountRow,
  BudgetRow,
  CategoryRow,
  GoalRow,
  LedgerMemberRow,
  LedgerRow,
  LoanRow,
  MerchantRow,
  ProfileRow,
  TemplateRow,
  TransactionRow,
} from './database';

export interface Profile {
  id: string;
  phone: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  tier: 'free' | 'member';
  planId: string | null;
  memberExpiresAt: string | null;
  createdAt: string;
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    tier: row.tier,
    planId: row.plan_id,
    memberExpiresAt: row.member_expires_at,
    createdAt: row.created_at,
  };
}

export interface Ledger {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  currency: string;
  scenario: string | null;
  isArchived: boolean;
  createdAt: string;
}

export function toLedger(row: LedgerRow): Ledger {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    scenario: row.scenario,
    isArchived: row.is_archived,
    createdAt: row.created_at,
  };
}

export interface LedgerMember {
  id: string;
  ledgerId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: string;
}

export function toLedgerMember(row: LedgerMemberRow): LedgerMember {
  return { id: row.id, ledgerId: row.ledger_id, userId: row.user_id, role: row.role, createdAt: row.created_at };
}

export interface Account {
  id: string;
  ledgerId: string;
  name: string;
  type: AccountRow['type'];
  balance: string;
  currency: string;
  creditLimit: string | null;
  billDay: number | null;
  hidden: boolean;
  isDefault: boolean;
  sort: number;
  createdAt: string;
}

export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    name: row.name,
    type: row.type,
    balance: row.balance.toFixed(2),
    currency: row.currency,
    creditLimit: row.credit_limit === null ? null : row.credit_limit.toFixed(2),
    billDay: row.bill_day,
    hidden: row.hidden,
    isDefault: row.is_default,
    sort: row.sort,
    createdAt: row.created_at,
  };
}

export interface Category {
  id: string;
  ledgerId: string | null;
  parentId: string | null;
  name: string;
  kind: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  sort: number;
  createdAt: string;
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    parentId: row.parent_id,
    name: row.name,
    kind: row.kind,
    icon: row.icon,
    color: row.color,
    sort: row.sort,
    createdAt: row.created_at,
  };
}

export interface Transaction {
  id: string;
  ledgerId: string;
  accountId: string | null;
  categoryId: string | null;
  type: TransactionRow['type'];
  amount: string;
  currency: string;
  rate: string;
  note: string | null;
  merchantId: string | null;
  merchantSource: string | null;
  txnDate: string;
  transferTo: string | null;
  version: number;
  createdAt: string;
  deletedAt: string | null;
  happenedAt: string;
  createdBy: string | null;
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    accountId: row.account_id,
    categoryId: row.category_id,
    type: row.type,
    amount: row.amount.toFixed(2),
    currency: row.currency,
    rate: String(row.rate),
    note: row.note,
    merchantId: row.merchant_id,
    merchantSource: row.merchant_source,
    txnDate: row.txn_date,
    transferTo: row.transfer_to,
    version: row.version,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    happenedAt: row.happened_at,
    createdBy: row.created_by,
  };
}

export interface Merchant {
  id: string;
  ownerId: string | null;
  name: string;
  mcc: string | null;
  categoryId: string | null;
  accountId: string | null;
  icon: string | null;
  source: string | null;
  confidence: number;
  hitCount: number;
  lastUsed: string | null;
  learned: boolean;
  createdAt: string;
}

export function toMerchant(row: MerchantRow): Merchant {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    mcc: row.mcc,
    categoryId: row.category_id,
    accountId: row.account_id,
    icon: row.icon,
    source: row.source,
    confidence: row.confidence,
    hitCount: row.hit_count,
    lastUsed: row.last_used,
    learned: row.learned,
    createdAt: row.created_at,
  };
}

export interface Budget {
  id: string;
  ledgerId: string;
  categoryId: string | null;
  period: string;
  amount: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export function toBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    categoryId: row.category_id,
    period: row.period,
    amount: row.amount.toFixed(2),
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

export interface Loan {
  id: string;
  ledgerId: string;
  direction: 'receivable' | 'payable';
  counterparty: string;
  amount: string;
  dueAt: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

export function toLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    direction: row.direction,
    counterparty: row.counterparty,
    amount: row.amount.toFixed(2),
    dueAt: row.due_at,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
  };
}

export interface Template {
  id: string;
  ledgerId: string;
  name: string;
  type: TemplateRow['type'];
  amount: string;
  period: string;
  categoryId: string | null;
  accountId: string | null;
  note: string | null;
  enabled: boolean;
  createdAt: string;
}

export function toTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    name: row.name,
    type: row.type,
    amount: row.amount.toFixed(2),
    period: row.period,
    categoryId: row.category_id,
    accountId: row.account_id,
    note: row.note,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export interface Goal {
  id: string;
  ledgerId: string;
  name: string;
  targetAmount: string;
  current: string;
  deadline: string | null;
  icon: string | null;
  color: string | null;
  note: string | null;
  createdAt: string;
}

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    name: row.name,
    targetAmount: row.target_amount.toFixed(2),
    current: row.current.toFixed(2),
    deadline: row.deadline,
    icon: row.icon,
    color: row.color,
    note: row.note,
    createdAt: row.created_at,
  };
}

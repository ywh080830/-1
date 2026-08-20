/**
 * txStore · 交易列表/筛选/分页/编辑态（06-系统设计 §4.5）
 * 离线优先：写本地 + syncEngine.enqueue；读取优先本地缓存
 */
import { create } from 'zustand';
import { api } from '@/lib/api';
import { idbGetAllByIndex, idbGetAll, idbPut, idbDelete } from '@/lib/idb';
import { syncEngine } from '@/lib/syncEngine';
import { useUiStore } from './uiStore';
import type { TransactionRow, TxType } from '@/types/database';
import type { SyncEntity } from '@/types/sync';

export interface TxFilter {
  type: TxType | 'all';
  categoryId: string | null;
  accountId: string | null;
  start: string | null;
  end: string | null;
}

interface TxState {
  transactions: TransactionRow[];
  filter: TxFilter;
  loading: boolean;
  loaded: boolean;

  load: (ledgerId: string, force?: boolean) => Promise<void>;
  loadLocal: (ledgerId: string) => Promise<void>;
  save: (tx: Partial<TransactionRow> & { id?: string; ledger_id: string }) => Promise<TransactionRow>;
  softDelete: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  setFilter: (patch: Partial<TxFilter>) => void;
  invalidate: () => void;
  clear: () => void;
}

const DEFAULT_FILTER: TxFilter = { type: 'all', categoryId: null, accountId: null, start: null, end: null };

function uuid(): string {
  return crypto.randomUUID();
}

export const useTxStore = create<TxState>((set, get) => ({
  transactions: [],
  filter: DEFAULT_FILTER,
  loading: false,
  loaded: false,

  async load(ledgerId, force = false) {
    if (get().loading) return;
    set({ loading: true });
    try {
      const remote = await api.listTransactions(ledgerId);
      // 先写本地（本地即真相）
      await Promise.all(remote.map((t) => idbPut('transactions', t)));
      set({ transactions: remote, loaded: true });
    } catch {
      await get().loadLocal(ledgerId);
    } finally {
      set({ loading: false });
    }
  },

  async loadLocal(ledgerId) {
    const all = await idbGetAll<TransactionRow>('transactions');
    const list = all
      .filter((t) => t.ledger_id === ledgerId && !t.deleted_at)
      .sort((a, b) => (a.txn_date < b.txn_date ? 1 : -1));
    set({ transactions: list, loaded: true });
  },

  async save(tx) {
    const now = new Date().toISOString();
    const record: TransactionRow = {
      id: tx.id ?? uuid(),
      ledger_id: tx.ledger_id,
      account_id: tx.account_id ?? null,
      category_id: tx.category_id ?? null,
      type: tx.type ?? 'expense',
      amount: tx.amount ?? 0,
      currency: tx.currency ?? 'CNY',
      rate: tx.rate ?? 1,
      note: tx.note ?? null,
      merchant_id: tx.merchant_id ?? null,
      merchant_source: tx.merchant_source ?? null,
      txn_date: tx.txn_date ?? now.slice(0, 10),
      transfer_to: tx.transfer_to ?? null,
      version: tx.version ?? Math.floor(Date.now() / 1000),
      created_at: tx.created_at ?? now,
      deleted_at: null,
      happened_at: tx.happened_at ?? now,
      created_by: tx.created_by ?? null,
    };

    // 1) 本地落盘
    await idbPut('transactions', record);
    // 2) 入同步队列
    await syncEngine.enqueue(
      { entity: 'transaction', entity_id: record.id, op: 'upsert', payload: { ...record } as unknown as Record<string, unknown> },
      record.ledger_id,
    );
    // 3) 更新内存
    const exists = get().transactions.some((t) => t.id === record.id);
    set({
      transactions: exists
        ? get().transactions.map((t) => (t.id === record.id ? record : t))
        : [record, ...get().transactions],
    });
    return record;
  },

  async softDelete(id) {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx) return;
    const updated: TransactionRow = { ...tx, deleted_at: new Date().toISOString(), version: Math.floor(Date.now() / 1000) };
    await idbPut('transactions', updated);
    await syncEngine.enqueue(
      { entity: 'transaction', entity_id: id, op: 'delete', payload: { id, deleted_at: updated.deleted_at } },
      tx.ledger_id,
    );
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
    useUiStore.getState().showToast('success', '已移入回收站');
  },

  async restore(id) {
    const all = await idbGetAll<TransactionRow>('transactions');
    const tx = all.find((t) => t.id === id);
    if (!tx) return;
    const updated: TransactionRow = { ...tx, deleted_at: null, version: Math.floor(Date.now() / 1000) };
    await idbPut('transactions', updated);
    await syncEngine.enqueue(
      { entity: 'transaction', entity_id: id, op: 'upsert', payload: { ...updated } as unknown as Record<string, unknown> },
      tx.ledger_id,
    );
    useUiStore.getState().showToast('success', '已恢复');
  },

  setFilter(patch) {
    set({ filter: { ...get().filter, ...patch } });
  },

  invalidate() {
    set({ loaded: false });
  },

  clear() {
    set({ transactions: [], loaded: false, filter: DEFAULT_FILTER });
  },
}));

/** 供 syncEngine 批量写入本地（避免循环依赖） */
export async function txBulkUpsertLocal(rows: TransactionRow[]): Promise<void> {
  for (const row of rows) {
    await idbPut('transactions', row);
  }
}

/** 通用：把任意实体 op 落本地（syncEngine 复用） */
export async function applyEntityToLocal(entity: SyncEntity, id: string, payload: Record<string, unknown>): Promise<void> {
  const storeMap: Record<SyncEntity, string> = {
    transaction: 'transactions',
    category: 'categories',
    account: 'accounts',
    budget: 'budgets',
    template: 'templates',
    goal: 'goals',
    loan: 'loans',
    merchant: 'merchants',
  };
  const store = storeMap[entity];
  await idbPut(store as never, { id, ...payload });
  if (entity === 'transaction') {
    // 从索引读回以刷新列表
    const ledgerId = String(payload.ledger_id ?? '');
    if (ledgerId) await useTxStore.getState().loadLocal(ledgerId);
  }
}

/** 回收站列表 */
export async function listRecycleBin(ledgerId: string): Promise<TransactionRow[]> {
  const all = await idbGetAll<TransactionRow>('transactions');
  return all.filter((t) => t.ledger_id === ledgerId && t.deleted_at);
}

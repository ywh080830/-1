/**
 * IndexedDB 封装（idb v8）· 离线本地数据层（本地即真相）
 * stores：
 *   ledgers/accounts/categories/transactions/budgets/loans/templates/goals/merchants
 *   pending_ops（同步队列）/ meta（键值）/ sync_state（同步游标）
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PendingOp } from '@/types/sync';

export const DB_NAME = 'smart_bookkeeping';
export const DB_VERSION = 1;

/** 显式 store 名联合（idb 的 DBSchema 索引签名导致 keyof 退化为 string） */
export type StoreName =
  | 'ledgers'
  | 'accounts'
  | 'categories'
  | 'transactions'
  | 'budgets'
  | 'loans'
  | 'templates'
  | 'goals'
  | 'merchants'
  | 'pending_ops'
  | 'meta'
  | 'sync_state';

interface SbDB extends DBSchema {
  ledgers: { key: string; value: Record<string, unknown>; indexes: { owner_id: string } };
  accounts: { key: string; value: Record<string, unknown>; indexes: { ledger_id: string } };
  categories: { key: string; value: Record<string, unknown>; indexes: { ledger_id: string; parent_id: string } };
  transactions: {
    key: string;
    value: Record<string, unknown>;
    indexes: { ledger_id: string; txn_date: string; deleted_at: string };
  };
  budgets: { key: string; value: Record<string, unknown>; indexes: { ledger_id: string } };
  loans: { key: string; value: Record<string, unknown>; indexes: { ledger_id: string } };
  templates: { key: string; value: Record<string, unknown>; indexes: { ledger_id: string } };
  goals: { key: string; value: Record<string, unknown>; indexes: { ledger_id: string } };
  merchants: { key: string; value: Record<string, unknown>; indexes: { owner_id: string; name: string } };
  pending_ops: { key: string; value: PendingOp; indexes: { ledger_id: string } };
  meta: { key: string; value: unknown };
  sync_state: { key: string; value: { ledger_id: string; last_version: number; updated_at: number } };
}

let dbPromise: Promise<IDBPDatabase<SbDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SbDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SbDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('ledgers')) {
          const s = db.createObjectStore('ledgers', { keyPath: 'id' });
          s.createIndex('owner_id', 'owner_id');
        }
        if (!db.objectStoreNames.contains('accounts')) {
          const s = db.createObjectStore('accounts', { keyPath: 'id' });
          s.createIndex('ledger_id', 'ledger_id');
        }
        if (!db.objectStoreNames.contains('categories')) {
          const s = db.createObjectStore('categories', { keyPath: 'id' });
          s.createIndex('ledger_id', 'ledger_id');
          s.createIndex('parent_id', 'parent_id');
        }
        if (!db.objectStoreNames.contains('transactions')) {
          const s = db.createObjectStore('transactions', { keyPath: 'id' });
          s.createIndex('ledger_id', 'ledger_id');
          s.createIndex('txn_date', 'txn_date');
          s.createIndex('deleted_at', 'deleted_at');
        }
        if (!db.objectStoreNames.contains('budgets')) {
          const s = db.createObjectStore('budgets', { keyPath: 'id' });
          s.createIndex('ledger_id', 'ledger_id');
        }
        if (!db.objectStoreNames.contains('loans')) {
          const s = db.createObjectStore('loans', { keyPath: 'id' });
          s.createIndex('ledger_id', 'ledger_id');
        }
        if (!db.objectStoreNames.contains('templates')) {
          const s = db.createObjectStore('templates', { keyPath: 'id' });
          s.createIndex('ledger_id', 'ledger_id');
        }
        if (!db.objectStoreNames.contains('goals')) {
          const s = db.createObjectStore('goals', { keyPath: 'id' });
          s.createIndex('ledger_id', 'ledger_id');
        }
        if (!db.objectStoreNames.contains('merchants')) {
          const s = db.createObjectStore('merchants', { keyPath: 'id' });
          s.createIndex('owner_id', 'owner_id');
          s.createIndex('name', 'name');
        }
        if (!db.objectStoreNames.contains('pending_ops')) {
          const s = db.createObjectStore('pending_ops', { keyPath: 'local_id' });
          s.createIndex('ledger_id', 'ledger_id');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
        if (!db.objectStoreNames.contains('sync_state')) {
          db.createObjectStore('sync_state', { keyPath: 'ledger_id' });
        }
      },
    });
  }
  return dbPromise;
}

/* ---------- 通用 CRUD ---------- */
export async function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get(store, key)) as T | undefined;
}

export async function idbPut<T>(store: StoreName, value: T): Promise<string> {
  const db = await getDB();
  return (await db.put(store, value)) as string;
}

export async function idbBulkPut<T>(store: StoreName, values: T[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  await Promise.all(values.map((v) => tx.store.put(v)));
  await tx.done;
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
  const db = await getDB();
  await db.delete(store, key);
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await getDB();
  return (await db.getAll(store)) as T[];
}

export async function idbClear(store: StoreName): Promise<void> {
  const db = await getDB();
  await db.clear(store);
}

export async function idbGetAllByIndex<T>(
  store: StoreName,
  index: string,
  value: IDBValidKey,
): Promise<T[]> {
  const db = await getDB();
  return (await db.getAllFromIndex(store as never, index as never, value as never)) as T[];
}

/* ---------- meta 键值 ---------- */
export async function metaGet<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('meta', key)) as T | undefined;
}

export async function metaSet(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('meta', value, key);
}

/* ---------- 同步游标 ---------- */
export async function getSyncState(ledgerId: string): Promise<number> {
  const db = await getDB();
  const row = await db.get('sync_state', ledgerId);
  return row?.last_version ?? 0;
}

export async function setSyncState(ledgerId: string, lastVersion: number): Promise<void> {
  const db = await getDB();
  await db.put('sync_state', { ledger_id: ledgerId, last_version: lastVersion, updated_at: Date.now() });
}

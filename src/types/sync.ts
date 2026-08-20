/**
 * 同步协议类型（对齐 06-系统设计 §1.2 / 03-API文档 §13）。
 */

export type SyncEntity =
  | 'transaction'
  | 'category'
  | 'account'
  | 'budget'
  | 'template'
  | 'goal'
  | 'loan'
  | 'merchant';

export type SyncOpType = 'upsert' | 'delete';

export interface SyncOp {
  entity: SyncEntity;
  entity_id: string;
  op: SyncOpType;
  payload: Record<string, unknown>;
  /** 服务端分配的全局版本号（sync_op_log.id）；本地生成时无 */
  version?: number;
}

/** 本地 pending op（带本地唯一键与账本归属） */
export interface PendingOp extends SyncOp {
  local_id: string;
  ledger_id: string;
  queued_at: number;
}

export interface SyncPushResult {
  pushed: number;
  latest_version: number;
}

export interface SyncPullResult {
  ops: SyncOp[];
  latest_version: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline' | 'error';

/** 实体 → IndexedDB store 名映射 */
export const ENTITY_STORE: Record<SyncEntity, string> = {
  transaction: 'transactions',
  category: 'categories',
  account: 'accounts',
  budget: 'budgets',
  template: 'templates',
  goal: 'goals',
  loan: 'loans',
  merchant: 'merchants',
};

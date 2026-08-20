/**
 * 同步引擎 · 06-系统设计 §1.2 / §4.6
 * - 本地即真相：写操作先落 IndexedDB + 入 pending_ops 队列
 * - push：≤200 条/批，指数退避；pull：id > last_version 增量
 * - 冲突 LWW（payload 携带客户端 version，服务端 version <= payload.version 才覆盖）
 * - Realtime 仅提示，一致性以 sync_pull 全量拉取为准
 */
import { api } from './api';
import {
  idbDelete,
  idbGetAll,
  idbGetAllByIndex,
  idbPut,
  metaGet,
  metaSet,
} from './idb';
import { useSyncStore } from '@/stores/syncStore';
import { useTxStore } from '@/stores/txStore';
import { useLedgerStore } from '@/stores/ledgerStore';
import type { StoreName } from './idb';
import { ENTITY_STORE, type PendingOp, type SyncEntity, type SyncOp, type SyncPushResult, type SyncPullResult } from '@/types/sync';

const PUSH_BATCH = 200;
const PENDING_KEY = 'pending_ops';
const MAX_RETRY = 5;

export class SyncEngine {
  private syncing = false;

  /** 写操作入队（幂等：同 entity+entity_id+op 已存在则跳过） */
  async enqueue(op: Omit<SyncOp, 'version'>, ledgerId: string): Promise<void> {
    const existing = await idbGetAll<PendingOp>(PENDING_KEY);
    const dup = existing.find((o) => o.ledger_id === ledgerId && o.entity === op.entity && o.entity_id === op.entity_id && o.op === op.op);
    if (dup) return;

    const pending: PendingOp = {
      ...op,
      local_id: crypto.randomUUID(),
      ledger_id: ledgerId,
      queued_at: Date.now(),
    };
    await idbPut(PENDING_KEY, pending);
    useSyncStore.getState().setPendingCount(await this.pendingCount());

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      void this.sync(ledgerId);
    }
  }

  async pendingCount(): Promise<number> {
    const all = await idbGetAll<PendingOp>(PENDING_KEY);
    return all.length;
  }

  /** 一次完整同步：push 本地 ops → pull 远端增量 → 应用到本地 */
  async sync(ledgerId: string): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    useSyncStore.getState().setStatus('syncing');
    try {
      await this.push(ledgerId);
      await this.pull(ledgerId);
      useSyncStore.getState().setStatus('online');
      useSyncStore.getState().setLastSyncAt(Date.now());
    } catch (err) {
      console.warn('[syncEngine] sync failed', err);
      useSyncStore.getState().setStatus('error');
    } finally {
      this.syncing = false;
    }
  }

  /** push 本地 pending ops（≤200/批，失败指数退避重试） */
  private async push(ledgerId: string): Promise<void> {
    const ops = await idbGetAllByIndex<PendingOp>(PENDING_KEY, 'ledger_id', ledgerId);
    if (!ops.length) return;

    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      try {
        for (let i = 0; i < ops.length; i += PUSH_BATCH) {
          const batch = ops.slice(i, i + PUSH_BATCH);
          const payload = batch.map((o) => ({ entity: o.entity, entity_id: o.entity_id, op: o.op, payload: o.payload }));
          const res = await api.rpc<SyncPushResult>('sync_push', { p_ledger: ledgerId, p_ops: payload }, true);
          if (res.latest_version > 0) {
            useSyncStore.getState().setLastVersion(res.latest_version);
          }
          for (const o of batch) {
            await idbDelete(PENDING_KEY, o.local_id);
          }
        }
        useSyncStore.getState().setPendingCount(await this.pendingCount());
        return;
      } catch (err) {
        if (attempt >= MAX_RETRY) throw err;
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  /** pull 远端增量（id > after，每批 ≤200，循环至拉完） */
  private async pull(ledgerId: string): Promise<void> {
    const after = await metaGet<number>(`last_version_${ledgerId}`) ?? 0;
    let cursor = after;
    let latest = after;

    for (;;) {
      const res = await api.rpc<SyncPullResult>('sync_pull', { p_ledger: ledgerId, p_after: cursor, p_limit: PUSH_BATCH }, true);
      await this.applyRemoteOps(res.ops, ledgerId);
      latest = res.latest_version;
      if (!res.ops.length || res.ops.length < PUSH_BATCH) break;
      cursor = latest;
    }

    if (latest > after) {
      await metaSet(`last_version_${ledgerId}`, latest);
      useSyncStore.getState().setLastVersion(latest);
    }
  }

  /** 应用远端 ops 到本地（软删除优先 / LWW 合并） */
  async applyRemoteOps(ops: SyncOp[], ledgerId: string): Promise<void> {
    if (!ops.length) return;
    for (const op of ops) {
      const store = (ENTITY_STORE[op.entity as SyncEntity] ?? op.entity) as StoreName;
      if (op.op === 'delete') {
        await idbDelete(store, op.entity_id);
      } else {
        const existing = await this.getLocal(store, op.entity_id);
        const payload = op.payload as Record<string, unknown>;
        // LWW：本地已有且本地版本更新则跳过
        if (existing && (existing as { version?: number }).version !== undefined && payload.version !== undefined) {
          const localVer = Number((existing as { version?: number }).version ?? 0);
          const remoteVer = Number(payload.version ?? 0);
          if (localVer > remoteVer) continue;
        }
        await idbPut(store, { ...(existing ?? {}), ...payload, ledger_id: ledgerId });
      }
    }
    // 刷新 UI 层缓存
    if (ops.some((o) => o.entity === 'transaction')) {
      useTxStore.getState().invalidate();
    }
    if (ops.some((o) => o.entity === 'account' || o.entity === 'category')) {
      void useLedgerStore.getState().refreshMeta();
    }
  }

  private async getLocal(store: string, key: string): Promise<unknown | undefined> {
    const { getDB } = await import('./idb');
    const db = await getDB();
    try {
      return await db.get(store as never, key);
    } catch {
      return undefined;
    }
  }

  /** 重置某账本同步游标（换端/全量重拉） */
  async resetCursor(ledgerId: string): Promise<void> {
    await metaSet(`last_version_${ledgerId}`, 0);
    useSyncStore.getState().setLastVersion(0);
  }
}

export const syncEngine = new SyncEngine();

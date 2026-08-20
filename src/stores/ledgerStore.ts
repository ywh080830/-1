/**
 * ledgerStore · 账本列表/当前账本/角色/成员（06-系统设计 §4.5）
 */
import { create } from 'zustand';
import { api } from '@/lib/api';
import { idbGetAll, idbPut } from '@/lib/idb';
import { useAuthStore } from './authStore';
import { useUiStore } from './uiStore';
import type { LedgerMemberRow, LedgerRow } from '@/types/database';
import type { LedgerRole } from '@/types/database';

interface LedgerState {
  ledgers: LedgerRow[];
  current: LedgerRow | null;
  role: LedgerRole | null;
  members: LedgerMemberRow[];
  loading: boolean;

  loadLedgers: () => Promise<void>;
  setCurrent: (id: string) => Promise<void>;
  ensureDefaultLedger: () => Promise<void>;
  createLedger: (name: string, type?: string, currency?: string) => Promise<LedgerRow | null>;
  archiveLedger: (id: string, archived: boolean) => Promise<void>;
  loadMembers: (ledgerId: string) => Promise<void>;
  addMember: (userId: string, role: 'editor' | 'viewer') => Promise<void>;
  updateMemberRole: (userId: string, role: 'editor' | 'viewer') => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  refreshMeta: () => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  ledgers: [],
  current: null,
  role: null,
  members: [],
  loading: false,

  async loadLedgers() {
    if (!useAuthStore.getState().user) return;
    set({ loading: true });
    try {
      const remote = await api.listLedgers();
      // 写本地缓存（离线可用）
      await Promise.all(remote.map((l) => idbPut('ledgers', l)));
      set({ ledgers: remote });
      const currentId = localStorage.getItem('sb-current-ledger');
      if (remote.length > 0) {
        const target = remote.find((l) => l.id === currentId && !l.is_archived) ?? remote.find((l) => !l.is_archived) ?? remote[0];
        await get().setCurrent(target.id);
      } else {
        await get().ensureDefaultLedger();
      }
    } catch (err) {
      // 离线：使用本地缓存
      const local = await idbGetAll<LedgerRow>('ledgers');
      set({ ledgers: local });
      if (local.length > 0) await get().setCurrent(local[0].id);
    } finally {
      set({ loading: false });
    }
  },

  async setCurrent(id) {
    const ledger = get().ledgers.find((l) => l.id === id);
    if (!ledger) return;
    localStorage.setItem('sb-current-ledger', id);
    set({ current: ledger, role: ledger.owner_id === useAuthStore.getState().user?.id ? 'owner' : null });
    // 尝试加载成员确定角色
    try {
      const members = await api.listMembers(id);
      const me = members.find((m) => m.user_id === useAuthStore.getState().user?.id);
      set({ members, role: me?.role ?? (ledger.owner_id === useAuthStore.getState().user?.id ? 'owner' : null) });
    } catch {
      // 忽略（离线）
    }
  },

  async ensureDefaultLedger() {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const created = await api.createLedger('我的账本', 'personal', 'CNY');
      await get().loadLedgers();
      useUiStore.getState().showToast('success', '已创建默认账本');
      void created;
    } catch (err) {
      console.warn('[ledgerStore] ensureDefaultLedger failed', err);
    }
  },

  async createLedger(name, type = 'family', currency = 'CNY') {
    try {
      const created = await api.createLedger(name, type, currency);
      await get().loadLedgers();
      useUiStore.getState().showToast('success', '账本创建成功');
      return created as unknown as LedgerRow;
    } catch (err) {
      useUiStore.getState().showToast('error', '创建账本失败');
      return null;
    }
  },

  async archiveLedger(id, archived) {
    await api.updateLedger(id, { is_archived: archived });
    await get().loadLedgers();
  },

  async loadMembers(ledgerId) {
    const members = await api.listMembers(ledgerId);
    set({ members });
  },

  async addMember(userId, role) {
    const cur = get().current;
    if (!cur) return;
    await api.addMember(cur.id, userId, role);
    await get().loadMembers(cur.id);
    useUiStore.getState().showToast('success', '已添加成员');
  },

  async updateMemberRole(userId, role) {
    const cur = get().current;
    if (!cur) return;
    await api.updateMemberRole(cur.id, userId, role);
    await get().loadMembers(cur.id);
  },

  async removeMember(userId) {
    const cur = get().current;
    if (!cur) return;
    await api.removeMember(cur.id, userId);
    await get().loadMembers(cur.id);
  },

  async refreshMeta() {
    // 账户/分类变更后刷新本地缓存（供同步引擎合并使用）
  },
}));

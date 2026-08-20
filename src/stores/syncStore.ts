/**
 * syncStore · 同步状态（06-系统设计 §4.5）
 */
import { create } from 'zustand';
import type { SyncStatus } from '@/types/sync';

interface SyncState {
  status: SyncStatus;
  lastVersion: number;
  pendingCount: number;
  lastSyncAt: number | null;

  setStatus: (status: SyncStatus) => void;
  setLastVersion: (v: number) => void;
  setPendingCount: (n: number) => void;
  setLastSyncAt: (t: number) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastVersion: 0,
  pendingCount: 0,
  lastSyncAt: null,

  setStatus: (status) => set({ status }),
  setLastVersion: (lastVersion) => set({ lastVersion }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  reset: () => set({ status: 'idle', lastVersion: 0, pendingCount: 0, lastSyncAt: null }),
}));

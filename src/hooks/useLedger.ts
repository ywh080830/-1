/**
 * useLedger · 当前账本 + 角色能力
 */
import { useEffect } from 'react';
import { useLedgerStore } from '@/stores/ledgerStore';
import { useAuthStore } from '@/stores/authStore';

export function useLedger() {
  const { ledgers, current, role, members, loading } = useLedgerStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && !loading && !current) {
      void useLedgerStore.getState().loadLedgers();
    }
  }, [user, loading, current]);

  const isOwner = role === 'owner' || (current ? current.owner_id === user?.id : false);
  const canWrite = role === 'owner' || role === 'editor' || isOwner;
  const canRead = Boolean(current);

  return {
    ledgers,
    current,
    role: isOwner ? 'owner' : role,
    members,
    loading,
    isOwner,
    canWrite,
    canRead,
    loadLedgers: () => useLedgerStore.getState().loadLedgers(),
    setCurrent: (id: string) => useLedgerStore.getState().setCurrent(id),
  };
}

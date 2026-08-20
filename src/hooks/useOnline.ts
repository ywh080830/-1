/**
 * useOnline · 网络状态 + 联网触发 syncEngine
 */
import { useEffect, useState } from 'react';
import { syncEngine } from '@/lib/syncEngine';
import { useSyncStore } from '@/stores/syncStore';
import { useLedgerStore } from '@/stores/ledgerStore';

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      useSyncStore.getState().setStatus('online');
      const cur = useLedgerStore.getState().current;
      if (cur) void syncEngine.sync(cur.id);
    };
    const handleOffline = () => {
      setOnline(false);
      useSyncStore.getState().setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

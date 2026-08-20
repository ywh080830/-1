/**
 * useRealtime · 订阅 tx/sync/support，失败自动降级 30s 轮询
 * Realtime 事件仅作提示，数据一致性以 sync_pull 全量拉取为准
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { syncEngine } from '@/lib/syncEngine';
import { useTxStore } from '@/stores/txStore';
import { useUiStore } from '@/stores/uiStore';

const POLL_INTERVAL = 30_000;

export function useRealtime(ledgerId?: string) {
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ledgerId) return;

    let degraded = false;
    const channel = supabase
      .channel(`realtime-${ledgerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `ledger_id=eq.${ledgerId}` },
        () => {
          useTxStore.getState().invalidate();
          void useTxStore.getState().load(ledgerId, true);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sync_op_log', filter: `ledger_id=eq.${ledgerId}` },
        () => {
          // 收到他人 op → 以 sync_pull 全量为准
          void syncEngine.sync(ledgerId);
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        useUiStore.getState().showToast('info', '收到新消息');
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        degraded = false;
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        degraded = true;
        if (!pollRef.current) {
          // 降级轮询：30s 拉一次增量
          pollRef.current = window.setInterval(() => {
            void syncEngine.sync(ledgerId);
          }, POLL_INTERVAL);
        }
      }
    });

    return () => {
      channel.unsubscribe();
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [ledgerId]);

  return { degraded: pollRef.current !== null };
}

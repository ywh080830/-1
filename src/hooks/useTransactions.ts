/**
 * useTransactions · 交易列表（在线拉取 + 离线本地兜底）
 */
import { useEffect } from 'react';
import { useTxStore } from '@/stores/txStore';

export function useTransactions(ledgerId?: string) {
  const { transactions, filter, loading, loaded, load, loadLocal, save, softDelete, restore, setFilter } = useTxStore();

  useEffect(() => {
    if (!ledgerId) return;
    if (!loaded) {
      void load(ledgerId);
    }
  }, [ledgerId, loaded, load]);

  const filtered = transactions.filter((t) => {
    if (filter.type !== 'all' && t.type !== filter.type) return false;
    if (filter.categoryId && t.category_id !== filter.categoryId) return false;
    if (filter.accountId && t.account_id !== filter.accountId) return false;
    if (filter.start && t.txn_date < filter.start) return false;
    if (filter.end && t.txn_date > filter.end) return false;
    return true;
  });

  return {
    transactions: filtered,
    all: transactions,
    filter,
    loading,
    loaded,
    refresh: () => (ledgerId ? load(ledgerId, true) : Promise.resolve()),
    save,
    softDelete,
    restore,
    setFilter,
  };
}

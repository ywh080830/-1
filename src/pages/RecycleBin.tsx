/**
 * RecycleBin · 回收站（软删除恢复 / 永久删除）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { RotateCcw, Trash2, Archive, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Empty } from '@/components/common/Empty';
import { AmountText } from '@/components/tx/AmountText';
import { useLedger } from '@/hooks/useLedger';
import { useTxStore } from '@/stores/txStore';
import { api } from '@/lib/api';
import { idbDelete, idbGetAll } from '@/lib/idb';
import { syncEngine } from '@/lib/syncEngine';
import { useUiStore } from '@/stores/uiStore';
import { Confirm } from '@/components/common/Confirm';
import type { TransactionRow } from '@/types/database';

/* ---------- 进场动画 keyframes ---------- */
const animationStyles = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}
.animate-delay-1 { animation-delay: 0.1s; }
.animate-delay-2 { animation-delay: 0.2s; }
.animate-delay-3 { animation-delay: 0.3s; }
`;

export default function RecycleBin() {
  const { current } = useLedger();
  const restore = useTxStore((s) => s.restore);
  const [items, setItems] = useState<TransactionRow[]>([]);
  const [deleting, setDeleting] = useState<TransactionRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const refresh = async () => {
    if (!current) return;
    try {
      const remote = await api.listDeleted(current.id);
      setItems(remote);
    } catch {
      const all = await idbGetAll<TransactionRow>('transactions');
      setItems(all.filter((t) => t.ledger_id === current.id && t.deleted_at));
    }
  };

  useEffect(() => {
    void refresh();
  }, [current]);

  const permanentDelete = async (tx: TransactionRow) => {
    if (!current) return;
    setRemoving(true);
    try {
      await api.rpc('delete_transaction_permanent', { p_id: tx.id }).catch(() => undefined);
      await idbDelete('transactions', tx.id);
      await syncEngine.enqueue({ entity: 'transaction', entity_id: tx.id, op: 'delete', payload: { id: tx.id, deleted_at: tx.deleted_at } }, current.id);
      useUiStore.getState().showToast('success', '已永久删除');
      void refresh();
      setDeleting(null);
    } catch (err) {
      if (err instanceof Error) {
        useUiStore.getState().showToast('error', err.message || '删除失败');
      }
      setDeleting(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="page">
      <style>{animationStyles}</style>

      <PageHeader title="回收站" />

      {items.length === 0 ? (
        <div className="animate-fade-in" style={{ animationFillMode: 'both' }}>
          <Empty title="回收站为空" description="误删的账目可以在这里恢复" />
        </div>
      ) : (
        <div className="animate-fade-in-up glass overflow-hidden transition-all duration-slow hover:shadow-glass-lg">
          {/* 头部装饰 */}
          <div className="relative px-4 pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                <Archive size={16} aria-hidden />
              </span>
              <span className="overline-label font-semibold tracking-wider text-muted">
                已删除的账目
              </span>
              <span className="text-caption text-muted/60">· {items.length}</span>
            </div>
          </div>

          <div className="divide-y divide-[var(--glass-border)]">
            {items.map((tx, idx) => {
              const typeLabel = tx.type === 'income' ? '收入' : tx.type === 'expense' ? '支出' : '转账';
              return (
                <div
                  key={tx.id}
                  className="flex min-h-[60px] items-center gap-3 px-4 py-3 transition-all duration-fast hover:bg-surface-2/30"
                  style={{ animationDelay: `${0.15 + idx * 0.04}s` }}
                >
                  {/* 类型标记 */}
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                    tx.type === 'income'
                      ? 'from-income/20 to-income/5 text-income'
                      : tx.type === 'expense'
                        ? 'from-expense/20 to-expense/5 text-expense'
                        : 'from-primary/20 to-primary/5 text-primary'
                  }`}>
                    <Archive size={16} aria-hidden />
                  </span>

                  {/* 描述 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-body font-medium text-text">
                        {tx.note || typeLabel}
                      </span>
                      <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-overline text-muted">
                        已删除
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-caption text-muted">
                      <Sparkles size={12} aria-hidden />
                      {tx.txn_date}
                    </div>
                  </div>

                  {/* 金额 */}
                  <AmountText amount={tx.amount} type={tx.type} size="sm" />

                  {/* 恢复 */}
                  <button
                    type="button"
                    onClick={() => restore(tx.id)}
                    aria-label="恢复"
                    className="touch-target rounded-lg glass-sm text-income transition-all duration-base hover:bg-income/10 hover:scale-105"
                  >
                    <RotateCcw size={18} aria-hidden />
                  </button>

                  {/* 永久删除 */}
                  <button
                    type="button"
                    onClick={() => setDeleting(tx)}
                    aria-label="永久删除"
                    className="touch-target rounded-lg glass-sm text-muted transition-all duration-base hover:bg-error/10 hover:text-error hover:scale-105"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 永久删除确认弹窗 */}
      <Confirm
        open={deleting !== null}
        title="永久删除"
        description={`永久删除后不可恢复，确定删除该笔账目吗？${deleting?.note ? `（${deleting.note}）` : ''}`}
        confirmText="永久删除"
        tone="danger"
        loading={removing}
        onConfirm={() => {
          if (deleting) void permanentDelete(deleting);
        }}
        onCancel={() => {
          if (!removing) setDeleting(null);
        }}
      />
    </div>
  );
}
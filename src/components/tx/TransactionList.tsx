/**
 * TransactionList · 流水列表（按日分组 + Glassmorphism 卡片日期标签）
 */
import dayjs from 'dayjs';
import { TransactionRow } from './TransactionRow';
import { Empty } from '@/components/common/Empty';
import { useMemo } from 'react';
import type { Category, Transaction } from '@/types/models';
import type { TransactionRow as TransactionRowType } from '@/types/database';

interface TransactionListProps {
  transactions: TransactionRowType[];
  categories: Category[];
  onRowClick?: (tx: TransactionRowType) => void;
}

export function TransactionList({ transactions, categories, onRowClick }: TransactionListProps) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const groups = useMemo(() => {
    const map = new Map<string, TransactionRowType[]>();
    for (const tx of transactions) {
      const key = tx.txn_date;
      const list = map.get(key) ?? [];
      list.push(tx);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [transactions]);

  if (!transactions.length) {
    return <Empty title="暂无流水" description="点击右下角 ⊕ 记一笔" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([date, list]) => {
        const total = list.reduce((s, t) => {
          if (t.type === 'transfer') return s;
          return t.type === 'income' ? s + t.amount : s - t.amount;
        }, 0);
        return (
          <div key={date} className="glass overflow-hidden">
            {/* 日期标签 */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--glass-border)]">
              <span className="overline-label">
                {dayjs(date).isSame(dayjs(), 'day') ? '今天' : dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day') ? '昨天' : date}
              </span>
              <span className={`num text-caption font-semibold ${
                total >= 0 ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
              }`}>
                {total >= 0 ? '+' : ''}{total.toFixed(2)}
              </span>
            </div>
            {/* 流水行 */}
            <div className="divide-y divide-[var(--glass-border)]">
              {list.map((tx) => {
                const cat = tx.category_id ? catMap.get(tx.category_id) : undefined;
                return (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    categoryName={cat?.name}
                    categoryIcon={cat?.icon}
                    categoryColor={cat?.color}
                    onClick={onRowClick}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { Transaction };
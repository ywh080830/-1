/**
 * TransactionRow · 流水行（Glassmorphism 行 + 高级视觉层次）
 */
import { ArrowLeftRight } from 'lucide-react';
import { AmountText } from './AmountText';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import type { TransactionRow } from '@/types/database';

interface TransactionRowProps {
  tx: TransactionRow;
  categoryName?: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  onClick?: (tx: TransactionRow) => void;
}

export function TransactionRow({ tx, categoryName, categoryIcon, categoryColor, onClick }: TransactionRowProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(tx)}
      className="flex w-full min-h-[60px] items-center gap-3 px-4 py-2.5 text-left transition-all duration-fast hover:bg-[var(--color-surface-2)] active:scale-[0.99]"
    >
      {tx.type === 'transfer' ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)] text-[var(--color-primary)]">
          <ArrowLeftRight size={20} aria-hidden />
        </span>
      ) : (
        <CategoryIcon name={categoryIcon} color={categoryColor} size={20} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-semibold text-[var(--color-text)]">
            {tx.type === 'transfer' ? '转账' : categoryName ?? '未分类'}
          </span>
          {tx.merchant_id && (
            <span className="shrink-0 rounded-full bg-[var(--color-primary-50)] px-1.5 py-0.5 text-overline font-medium text-[var(--color-primary)]">
              商户
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-caption text-muted">
          {tx.note || '—'}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <AmountText amount={tx.amount} type={tx.type} size="sm" />
        {tx.type !== 'transfer' && (
          <span className={`text-overline font-medium ${
            tx.type === 'income' ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
          }`}>
            {tx.type === 'income' ? '收入' : '支出'}
          </span>
        )}
      </div>
    </button>
  );
}
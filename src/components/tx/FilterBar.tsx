/**
 * FilterBar · 流水筛选（Glassmorphism 容器 + 高级胶囊按钮）
 */
import { X } from 'lucide-react';
import type { TxFilter } from '@/stores/txStore';
import type { TxType } from '@/types/database';

interface FilterBarProps {
  filter: TxFilter;
  onChange: (patch: Partial<TxFilter>) => void;
  onReset: () => void;
}

const TYPE_OPTIONS: Array<{ value: TxType | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' },
  { value: 'transfer', label: '转账' },
];

export function FilterBar({ filter, onChange, onReset }: FilterBarProps) {
  const active = filter.type !== 'all' || filter.categoryId || filter.accountId || filter.start || filter.end;
  return (
    <div className="glass-sm flex flex-wrap items-center gap-2 px-3 py-2.5 mx-4">
      <div className="flex gap-1.5">
        {TYPE_OPTIONS.map((opt) => {
          const isActive = filter.type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ type: opt.value })}
              className={`min-h-[36px] rounded-full px-3.5 text-caption font-semibold transition-all duration-fast ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-glass'
                  : 'bg-[var(--color-surface-2)] text-text-secondary hover:bg-[var(--color-border)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {active && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium text-muted transition-all duration-fast hover:bg-[var(--color-surface-2)] hover:text-[var(--color-expense)]"
        >
          <X size={14} aria-hidden /> 清除筛选
        </button>
      )}
    </div>
  );
}
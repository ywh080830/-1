/**
 * AmountText · 金额展示（Premium 渐变文字 + 高级视觉层次）
 */
import { formatSigned } from '@/lib/money';
import type { TxType } from '@/types/database';

interface AmountTextProps {
  amount: string | number;
  type?: TxType;
  size?: 'sm' | 'md' | 'lg';
  showSign?: boolean;
}

const SIZES = {
  sm: 'text-body font-semibold',
  md: 'text-h3 font-bold',
  lg: 'font-display text-display font-bold',
};

export function AmountText({ amount, type = 'expense', size = 'md', showSign = true }: AmountTextProps) {
  const text = showSign ? formatSigned(amount, type) : formatSigned(amount, type).replace(/^[+-]/, '');

  const colorClass =
    type === 'income'
      ? 'text-[var(--color-income)]'
      : type === 'expense'
        ? 'text-[var(--color-expense)]'
        : 'text-[var(--color-text)]';

  return (
    <span className={`num ${SIZES[size]} ${colorClass} transition-all duration-fast`}>
      {text}
    </span>
  );
}
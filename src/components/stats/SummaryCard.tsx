/**
 * SummaryCard · 本月收支结余英雄卡（参考知名记账 App：结余居中 · 收支联排 · 环形占比）
 * - 顶部渐变英雄区：大额结余 + 环形收支占比 + 日均
 * - 底部联排：收入 / 支出 / 记笔数
 * - Glassmorphism + 渐变边框
 */
import { AmountText } from '@/components/tx/AmountText';

interface SummaryCardProps {
  income: number;
  expense: number;
  balance: number;
  /** 可选：本自然月已过去的天数（用于日均） */
  dayCount?: number;
}

export function SummaryCard({ income, expense, balance, dayCount }: SummaryCardProps) {
  const total = income + expense;
  const incomeRatio = total > 0 ? (income / total) * 100 : 0;
  const expenseRatio = total > 0 ? (expense / total) * 100 : 50;
  const days = dayCount && dayCount > 0 ? dayCount : 1;

  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <div className="card-gradient shadow-glass-lg overflow-hidden">
      {/* 顶部渐变装饰条 */}
      <div className="top-glow" />

      {/* ===== 英雄区：结余 + 环形 ===== */}
      <div className="relative flex items-center gap-5 p-5">
        {/* 装饰光晕 */}
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-primary/15 to-secondary/10 blur-2xl" />

        {/* 左：大额结余 */}
        <div className="min-w-0 flex-1">
          <span className="overline-label">本月结余</span>
          <div className="mt-2">
            <AmountText amount={balance} type={balance >= 0 ? 'income' : 'expense'} size="lg" showSign />
          </div>
          <div className="mt-1 flex items-center gap-2 text-caption text-muted">
            <span>日均支出</span>
            <span className="num font-display font-semibold text-text-secondary">
              ¥{(expense / days).toFixed(0)}
            </span>
          </div>
        </div>

        {/* 右：环形占比 */}
        <div className="relative h-[110px] w-[110px] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {/* 背景轨道 */}
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
            {/* 收入弧 */}
            <circle
              cx="50" cy="50" r={R} fill="none"
              stroke="var(--color-income)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${(incomeRatio / 100) * C} ${C}`}
            />
            {/* 支出弧 */}
            <circle
              cx="50" cy="50" r={R} fill="none"
              stroke="var(--color-expense)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${(expenseRatio / 100) * C} ${C}`}
              strokeDashoffset={`-${(incomeRatio / 100) * C}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-overline text-muted">总收支</span>
            <span className="num font-display text-h3 font-bold text-text">¥{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* ===== 底部联排 ===== */}
      <div className="grid grid-cols-3 divide-x divide-[var(--glass-border)] border-t border-[var(--glass-border)] bg-black/[0.015] py-3">
        <div className="flex flex-col items-center gap-0.5">
          <span className="overline-label flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-income" />收入
          </span>
          <AmountText amount={income} type="income" size="md" showSign={false} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="overline-label flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-expense" />支出
          </span>
          <AmountText amount={expense} type="expense" size="md" showSign={false} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="overline-label">节省率</span>
          <span className={`num font-display text-h3 font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
            {total > 0 ? `${Math.max(-100, Math.min(100, (balance / income) * 100)).toFixed(0)}%` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
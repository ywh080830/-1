/**
 * CalculatorDisplay · 计算器显示屏（Glassmorphism 显示 + 高级排版）
 */
interface CalculatorDisplayProps {
  expression: string;
  display: string;
}

export function CalculatorDisplay({ expression, display }: CalculatorDisplayProps) {
  return (
    <div className="glass-sm flex flex-col items-end gap-1.5 rounded-2xl px-5 py-4">
      <div className="h-5 truncate text-caption font-medium text-muted/70" aria-hidden>
        {expression || ' '}
      </div>
      <div className="num font-display text-display leading-none tracking-tight text-text" aria-label={`金额 ${display}`}>
        {display}
      </div>
    </div>
  );
}
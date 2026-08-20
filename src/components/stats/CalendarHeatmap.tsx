/**
 * CalendarHeatmap · 日历现金流热力（Glassmorphism 容器 + 高级单元格样式）
 */
import dayjs from 'dayjs';
import { useMemo } from 'react';
import type { CalendarDay } from '@/types/api';

interface CalendarHeatmapProps {
  data: CalendarDay[];
  month: string; // YYYY-MM
  onDayClick?: (day: string) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function netColor(net: number, maxAbs: number): string {
  if (net === 0) return 'var(--color-surface-2)';
  const t = Math.min(1, Math.abs(net) / maxAbs);
  if (net > 0) {
    return `color-mix(in srgb, var(--color-income) ${Math.round(15 + t * 70)}%, var(--color-surface))`;
  }
  return `color-mix(in srgb, var(--color-expense) ${Math.round(15 + t * 70)}%, var(--color-surface))`;
}

export function CalendarHeatmap({ data, month, onDayClick }: CalendarHeatmapProps) {
  const cells = useMemo(() => {
    const map = new Map(data.map((d) => [d.day, d]));
    const daysInMonth = dayjs(month).daysInMonth();
    const firstDay = dayjs(`${month}-01`).day();
    const list: Array<{ day: string; num: number; net: number; income: number; expense: number; empty?: boolean }> = [];
    for (let w = 0; w < firstDay; w++) list.push({ day: '', num: 0, net: 0, income: 0, expense: 0, empty: true });
    for (let i = 1; i <= daysInMonth; i++) {
      const key = `${month}-${String(i).padStart(2, '0')}`;
      const d = map.get(key);
      list.push({ day: key, num: i, net: d?.net ?? 0, income: d?.income ?? 0, expense: d?.expense ?? 0 });
    }
    return list;
  }, [data, month]);

  const maxAbs = useMemo(() => Math.max(1, ...cells.map((c) => Math.abs(c.net))), [cells]);

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div className="glass p-4">
      <h3 className="card-title mb-3">每日收支</h3>
      <div className="mb-2 grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-overline text-muted">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, idx) =>
          c.empty ? (
            <div key={`e${idx}`} className="aspect-square rounded-lg" />
          ) : (
            <button
              key={c.day}
              type="button"
              onClick={() => onDayClick?.(c.day)}
              className={`group relative flex aspect-square flex-col items-center justify-center rounded-lg border transition-all duration-fast active:scale-90 ${
                c.day === today
                  ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                  : 'border-transparent hover:border-[var(--glass-border)]'
              }`}
              style={{ backgroundColor: netColor(c.net, maxAbs) }}
              aria-label={`${c.day} 净额 ${c.net.toFixed(2)}`}
            >
              <span className={`text-caption font-semibold leading-tight ${
                c.day === today ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
              }`}>
                {c.num}
              </span>
              {c.net !== 0 && (
                <span className={`num text-[9px] leading-none font-medium ${
                  c.net > 0 ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
                }`}>
                  {c.net > 0 ? '+' : ''}{c.net.toFixed(0)}
                </span>
              )}
              {/* 悬浮提示 */}
              <div className="pointer-events-none absolute -top-8 left-1/2 z-sticky -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-text)] px-2 py-1 text-caption text-[var(--color-bg)] opacity-0 shadow-pop transition-opacity duration-fast group-hover:opacity-100">
                ¥{c.net.toFixed(2)}
              </div>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
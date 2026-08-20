/**
 * Stats · 统计（汇总英雄 / 分类占比 / 趋势 / 排行）
 * 参考知名记账 App（随手记 / 鲨鱼记账 / 蓝本记账）链路重构：
 * 顶部月份导航 → 结余英雄卡 → 日均合计条 → 分类占比(含分类 Top 进度) → 收支趋势 → 支出排行
 * Premium Glassmorphism + Minimalism 风格
 */
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SummaryCard } from '@/components/stats/SummaryCard';
import { DonutChart } from '@/components/stats/DonutChart';
import { TrendChart } from '@/components/stats/TrendChart';
import { RankList } from '@/components/stats/RankList';
import { Skeleton } from '@/components/common/Skeleton';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import type { CalendarDay, StatsSummary, TrendPoint } from '@/types/api';

type Range = '3m' | '6m' | '12m';

/** 格式化货币，千分位 + 两位小数 */
const fmtMoney = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Stats() {
  const { current } = useLedger();
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [range, setRange] = useState<Range>('6m');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    const monthDate = `${month}-01`;
    Promise.all([
      api.statsSummary(current.id, monthDate),
      api.statsTrend(current.id, range),
      api.statsCalendar(current.id, monthDate),
    ])
      .then(([s, t, c]) => {
        setSummary(s);
        setTrend(t);
        setCalendar(c);
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [current, month, range]);

  const isCurrentMonth = month === dayjs().format('YYYY-MM');
  /** 日均分母：当月取已过天数（含今天），否则取该月总天数 */
  const dayCount = isCurrentMonth ? dayjs().date() : dayjs(`${month}-01`).daysInMonth();
  /** 本月已记账天数（来自日历数据） */
  const recordedDays = useMemo(
    () => calendar.filter((d) => d.expense > 0 || d.income > 0).length,
    [calendar],
  );
  /** 支出分类 Top 3（按金额降序） */
  const topCategories = useMemo(
    () => [...(summary?.by_category ?? [])].sort((a, b) => b.amount - a.amount).slice(0, 3),
    [summary],
  );

  const dailyExpense = summary && dayCount > 0 ? summary.expense / dayCount : 0;

  return (
    <div className="page">
      <PageHeader title="统计" back={false} />

      {/* 月份导航 — glassmorphism 控件 */}
      <div className="glass-sm mb-4 flex items-center justify-between px-4 py-2.5 animate-fade-in">
        <button
          type="button"
          onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))}
          aria-label="上一月"
          className="touch-target rounded-lg text-text-secondary transition-all duration-fast hover:bg-surface-2/80 active:scale-90"
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <span className="text-h3 font-display font-semibold tracking-wide">{month}</span>
        <button
          type="button"
          onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))}
          disabled={month >= dayjs().format('YYYY-MM')}
          aria-label="下一月"
          className="touch-target rounded-lg text-text-secondary transition-all duration-fast hover:bg-surface-2/80 active:scale-90 disabled:is-disabled"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : summary ? (
        <>
          {/* 2. 汇总英雄卡 — 结余居中，slide-up */}
          <div className="animate-slide-up animate-delay-1">
            {/* 便捷概览说明行 */}
            <div className="mb-2 flex items-center gap-2 px-1">
              <CalendarDays size={14} className="text-primary" aria-hidden />
              <span className="text-caption text-muted">
                本月概览 · 本月已记账 {recordedDays} 天，快捷查看收支与分类明细
              </span>
            </div>
            <SummaryCard
              income={summary.income}
              expense={summary.expense}
              balance={summary.balance}
              dayCount={dayCount}
            />
          </div>

          {/* 6. 日均 / 合计摘要条（玻璃小卡） */}
          <div className="mt-4 grid grid-cols-3 gap-2.5 animate-slide-up animate-delay-2">
            <div className="glass-sm flex flex-col items-center gap-0.5 rounded-xl px-2 py-3">
              <span className="overline-label text-muted">本月支出</span>
              <span className="num font-display text-h3 font-bold text-expense">¥{fmtMoney(summary.expense)}</span>
            </div>
            <div className="glass-sm flex flex-col items-center gap-0.5 rounded-xl px-2 py-3">
              <span className="overline-label text-muted">日均支出</span>
              <span className="num font-display text-h3 font-bold">{fmtMoney(dailyExpense)}</span>
            </div>
            <div className="glass-sm flex flex-col items-center gap-0.5 rounded-xl px-2 py-3">
              <span className="overline-label text-muted">记账天数</span>
              <span className="num font-display text-h3 font-bold text-secondary">{recordedDays} 天</span>
            </div>
          </div>

          {/* 3. 支出分类占比 — 分类 Top 进度 + 环形 */}
          <div className="mt-5 animate-slide-up animate-delay-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="card-title flex items-center gap-2">
                <PieChart size={16} className="text-primary" aria-hidden />
                支出分类占比
              </h2>
              <span className="num font-display text-h3 font-bold text-expense">¥{fmtMoney(summary.expense)}</span>
            </div>

            {summary.by_category.length ? (
              <>
                {/* 分类 Top 进度条（迷你列表，复刻鲨鱼记账分类拆解） */}
                <div className="mb-3 flex flex-col gap-2.5">
                  {topCategories.map((c, i) => {
                    const w = c.ratio
                      ? Math.min(100, Math.max(2, c.ratio * 100))
                      : summary.expense > 0
                        ? Math.min(100, Math.max(2, (c.amount / summary.expense) * 100))
                        : 0;
                    const color = c.color ?? 'var(--color-primary)';
                    return (
                      <div key={c.category_id ?? i} className="flex items-center gap-3">
                        <span className="num w-4 shrink-0 text-center text-caption font-bold text-muted">{i + 1}</span>
                        <span className="w-16 shrink-0 truncate text-caption font-medium text-text-secondary">
                          {c.category_name ?? '未分类'}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                          <div
                            className="h-full rounded-full transition-all duration-slow"
                            style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}, ${color}33)` }}
                          />
                        </div>
                        <span className="num w-14 shrink-0 text-right text-caption font-semibold">¥{fmtMoney(c.amount)}</span>
                      </div>
                    );
                  })}
                </div>
                <DonutChart data={summary.by_category} />
              </>
            ) : (
              <div className="glass p-4 text-center">
                <p className="py-6 text-caption text-muted">本月暂无支出</p>
              </div>
            )}
          </div>

          {/* 4. 收支趋势 — 范围切换 + TrendChart */}
          <div className="mt-5 animate-slide-up animate-delay-4">
            <div className="mb-3 flex items-center justify-end px-1">
              <div className="glass-sm flex gap-1 p-0.5">
                {(['3m', '6m', '12m'] as Range[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`min-h-[32px] rounded-[10px] px-3.5 text-caption font-semibold transition-all duration-fast ${
                      range === r
                        ? 'bg-gradient-to-r from-primary to-primary-deep text-white shadow-glass'
                        : 'text-text-secondary hover:text-text hover:bg-surface-2/60'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart data={trend} />
          </div>

          {/* 5. 支出排行 Top 榜 — RankList */}
          <div className="mt-5 animate-slide-up animate-delay-5">
            {summary.by_category.length ? (
              <RankList data={summary.by_category} />
            ) : (
              <div className="glass p-4 text-center">
                <p className="py-6 text-caption text-muted">暂无排行数据</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="glass animate-fade-in p-8 text-center">
          <p className="py-8 text-caption text-muted">统计加载失败，请检查网络后重试</p>
        </div>
      )}
    </div>
  );
}
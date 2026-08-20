/**
 * Calendar · 日历现金流（点击某日查看当日流水）
 * Premium Glassmorphism + Minimalism Redesign
 * 参照随手记/蓝本记账的月度总览：月导航栏 + 本月收支结余速览条 + 日历热力 + 当日明细卡
 */
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  ReceiptText,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarHeatmap } from '@/components/stats/CalendarHeatmap';
import { TransactionList } from '@/components/tx/TransactionList';
import { Skeleton } from '@/components/common/Skeleton';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import type { CalendarDay } from '@/types/api';
import type { Category } from '@/types/models';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

const fmt = (v: number, sign = false) => `${sign && v > 0 ? '+' : ''}${v.toFixed(2)}`;

export default function Calendar() {
  const { current } = useLedger();
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [data, setData] = useState<CalendarDay[]>([]);
  const [dayTx, setDayTx] = useState([] as Parameters<typeof TransactionList>[0]['transactions']);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    Promise.all([api.statsCalendar(current.id, `${month}-01`), api.listCategories(current.id)])
      .then(([cal, cats]) => {
        setData(cal);
        setCategories(
          cats.map((c) => ({
            id: c.id,
            ledgerId: c.ledger_id,
            parentId: c.parent_id,
            name: c.name,
            kind: c.kind,
            icon: c.icon,
            color: c.color,
            sort: c.sort,
            createdAt: c.created_at,
          })),
        );
        setSelectedDay(null);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [current, month]);

  useEffect(() => {
    if (!current || !selectedDay) return;
    void api.listTransactions(current.id, { start: selectedDay, end: selectedDay, limit: 100 }).then(setDayTx).catch(() => setDayTx([]));
  }, [current, selectedDay]);

  /** 选中当天在日历中的汇总条目 */
  const dayTotal = useMemo(() => {
    const d = data.find((x) => x.day === selectedDay);
    return d;
  }, [data, selectedDay]);

  /** 本月汇总（收入 / 支出 / 净额） */
  const monthTotal = useMemo(() => {
    return data.reduce(
      (acc, d) => {
        acc.income += d.income;
        acc.expense += d.expense;
        acc.net += d.net;
        return acc;
      },
      { income: 0, expense: 0, net: 0 },
    );
  }, [data]);

  const isCurrentMonth = month >= dayjs().format('YYYY-MM');

  const dateTitle = dayjs(selectedDay).isSame(dayjs(), 'day')
    ? `今天 · ${dayjs(selectedDay).format('M月D日')}`
    : `${dayjs(selectedDay).format('M月D日')} 周${WEEKDAYS[dayjs(selectedDay).day()]}`;

  return (
    <div className="page">
      <PageHeader title="日历现金流" back={false} />

      {/* Month Navigation - Glassmorphism */}
      <div className="glass-sm mb-4 flex items-center justify-between p-2">
        <button
          type="button"
          onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))}
          aria-label="上一月"
          className="touch-target rounded-xl glass-sm text-text-secondary transition-all duration-base hover:text-primary hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-h3 font-semibold text-text">
            <CalendarDays size={18} className="text-primary" aria-hidden />
            {dayjs(month).format('YYYY 年 M 月')}
          </span>
          <span className="text-caption text-muted">{dayjs(month).daysInMonth()} 天</span>
        </div>
        <button
          type="button"
          onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))}
          disabled={isCurrentMonth}
          aria-label="下一月"
          className="touch-target rounded-xl glass-sm text-text-secondary transition-all duration-base hover:text-primary hover:scale-105 active:scale-95 disabled:is-disabled"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      {/* Month Summary Mini-strip - 本月收支结余速览 */}
      <div className="mb-4 grid grid-cols-3 gap-2 animate-fade-in">
        <div className="glass-sm flex flex-col gap-1 p-3">
          <span className="flex items-center gap-1.5 text-overline text-muted">
            <TrendingUp size={12} className="text-teal-500" aria-hidden />
            本月初入
          </span>
          <span className="num text-caption font-semibold text-teal-500">{fmt(monthTotal.income)}</span>
        </div>
        <div className="glass-sm flex flex-col gap-1 p-3">
          <span className="flex items-center gap-1.5 text-overline text-muted">
            <TrendingDown size={12} className="text-orange-500" aria-hidden />
            本月支出
          </span>
          <span className="num text-caption font-semibold text-orange-500">{fmt(monthTotal.expense)}</span>
        </div>
        <div className="glass-sm flex flex-col gap-1 p-3">
          <span className="flex items-center gap-1.5 text-overline text-muted">
            <Wallet size={12} className="text-primary" aria-hidden />
            结余
          </span>
          <span className={`num text-caption font-semibold ${monthTotal.net >= 0 ? 'text-primary' : 'text-expense'}`}>
            {fmt(monthTotal.net, true)}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <div className="transition-all duration-base animate-fade-in">
          <CalendarHeatmap data={data} month={month} onDayClick={setSelectedDay} />
        </div>
      )}

      {/* Selected Day Detail Card */}
      {selectedDay && (
        <section className="mt-5 animate-slide-up">
          <div className="glass overflow-hidden">
            <div className="border-b border-[var(--glass-border)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-h3 font-semibold text-text">
                  <ReceiptText size={18} className="text-primary" aria-hidden />
                  {dateTitle} 明细
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2">
                  <span className="text-caption text-muted">收入</span>
                  <span className="num text-caption font-semibold text-teal-500">{fmt(dayTotal?.income ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2">
                  <span className="text-caption text-muted">支出</span>
                  <span className="num text-caption font-semibold text-orange-500">{fmt(dayTotal?.expense ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3 py-2">
                  <span className="text-caption text-muted">净额</span>
                  <span className={`num text-caption font-semibold ${(dayTotal?.net ?? 0) >= 0 ? 'text-primary' : 'text-expense'}`}>
                    {fmt(dayTotal?.net ?? 0, true)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              <TransactionList transactions={dayTx} categories={categories} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
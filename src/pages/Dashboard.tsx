/**
 * Dashboard · 首页（重写 · 2026-08-20）
 *
 * 设计目标
 *  1. 美观性：Aurora Mesh 渐变英雄卡 / 玻璃态层级 / 渐变文字大额数字 / 三色调和
 *  2. 动态交互性：数字滚动入场 / 进度条流光 / 月度胶囊切换 / Tab 滑入 / 旋转圆环装饰
 *  3. 用户点击性：6 个快捷操作大热区 / 涟漪反馈 / 预算堆叠条可点 / 流水行整行可点
 *  4. 用户交互性：横向滚动快通车 / 浮动 FAB 多入口 / 月度内嵌切换器 / 预算卡按分类堆叠
 *
 * 布局结构（自顶向下）
 *  ┌─ 顶部品牌栏：菜单 · 问候/日期 · 通知/搜索 ──────────────┐
 *  ├─ Hero 收支结余卡（Aurora 背景 + 数字滚动 + 月度胶囊）    │
 *  ├─ 三列概览：日均支出 · 记笔数 · 节省率                   │
 *  ├─ 快捷操作（横向滚动 · 6 项大按钮）                      │
 *  ├─ 本月预算 · 堆叠进度条（可点击进入分类）               │
 *  ├─ Tab 切换：AI 洞察 / 最近流水 / 分类排行                │
 *  └─ 浮动 FAB · 快速记一笔（脉冲阴影）                     │
 */
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Bell,
  CalendarDays,
  Camera,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Menu,
  PiggyBank,
  Plus,
  Receipt,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { TransactionList } from '@/components/tx/TransactionList';
import { Skeleton } from '@/components/common/Skeleton';
import { useLedger } from '@/hooks/useLedger';
import { useTransactions } from '@/hooks/useTransactions';
import { useUiStore } from '@/stores/uiStore';
import { useCountUp } from '@/hooks/useCountUp';
import { api } from '@/lib/api';
import { idbGetAll } from '@/lib/idb';
import { format, subtract } from '@/lib/money';
import type { Category } from '@/types/models';
import type { StatsSummary } from '@/types/api';
import type { TransactionRow as TransactionRowType } from '@/types/database';

/* ---------- 自定义 keyframes（仅本页使用） ---------- */
const animationStyles = `
@keyframes progressGlow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes heroFadeUp {
  0%   { opacity: 0; transform: translateY(24px) scale(0.98); filter: blur(8px); }
  100% { opacity: 1; transform: translateY(0)   scale(1);    filter: blur(0); }
}
@keyframes fabBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-3px) scale(1.03); }
}
@keyframes countFlicker {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.7; }
}
`;

type TabKey = 'insight' | 'recent' | 'rank';

/* ---------- 6 个快捷操作配置 ---------- */
const QUICK_ACTIONS: Array<{
  label: string;
  desc: string;
  to: string;
  icon: typeof Plus;
  bg: string;
  glow: string;
}> = [
  {
    label: '记一笔',
    desc: '快速记账',
    to: '/record',
    icon: Plus,
    bg: 'from-[#7c5cfc] via-[#6a49f0] to-[#5b3fe0]',
    glow: 'shadow-[0_8px_24px_rgba(124,92,252,0.45)]',
  },
  {
    label: '拍照记账',
    desc: 'OCR 识别',
    to: '/ocr',
    icon: Camera,
    bg: 'from-[#ff8a5b] via-[#ff7a4a] to-[#f2723f]',
    glow: 'shadow-[0_8px_24px_rgba(255,138,91,0.45)]',
  },
  {
    label: '转账',
    desc: '账户互转',
    to: '/record?type=transfer',
    icon: ArrowLeftRight,
    bg: 'from-[#11b5a8] via-[#0eb39e] to-[#0e9a8f]',
    glow: 'shadow-[0_8px_24px_rgba(17,181,168,0.45)]',
  },
  {
    label: '日历',
    desc: '按日查看',
    to: '/calendar',
    icon: CalendarDays,
    bg: 'from-[#9f82fb] via-[#7c5cfc] to-[#5b3fe0]',
    glow: 'shadow-[0_8px_24px_rgba(159,130,251,0.45)]',
  },
  {
    label: '统计',
    desc: '图表分析',
    to: '/stats',
    icon: ChartPie,
    bg: 'from-[#13c08c] via-[#0fae7d] to-[#0a8d65]',
    glow: 'shadow-[0_8px_24px_rgba(19,192,140,0.45)]',
  },
  {
    label: '模板',
    desc: '常用记账',
    to: '/templates',
    icon: Receipt,
    bg: 'from-[#f5455c] via-[#e93a52] to-[#d12d44]',
    glow: 'shadow-[0_8px_24px_rgba(245,69,92,0.45)]',
  },
];

/* ---------- AI 洞察（基于 summary 衍生） ---------- */
function buildInsight(summary: StatsSummary | null, dayCount: number): { iconKey: 'up' | 'down' | 'flat'; title: string; desc: string; tone: 'income' | 'expense' | 'neutral' }[] {
  if (!summary || dayCount <= 0) {
    return [
      {
        iconKey: 'flat',
        title: '开始记录，让 AI 帮你分析',
        desc: '本月还没有数据，记一笔解锁智能洞察',
        tone: 'neutral',
      },
    ];
  }
  const avg = summary.expense / dayCount;
  const insights: ReturnType<typeof buildInsight> = [];
  if (summary.balance >= 0) {
    insights.push({
      iconKey: 'up',
      title: '结余健康，本月继续保持',
      desc: `日均支出 ¥${avg.toFixed(0)}，收支比为 ${summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(0) : '—'}%`,
      tone: 'income',
    });
  } else {
    insights.push({
      iconKey: 'down',
      title: '本月支出超出收入',
      desc: `缺口 ¥${Math.abs(summary.balance).toFixed(0)}，建议设置分类预算`,
      tone: 'expense',
    });
  }
  if (summary.expense > summary.income && summary.income > 0) {
    insights.push({
      iconKey: 'down',
      title: '支出速度偏快',
      desc: `已消耗 ${((summary.expense / summary.income) * 100).toFixed(0)}% 的月度收入`,
      tone: 'expense',
    });
  }
  if (avg < 100) {
    insights.push({
      iconKey: 'flat',
      title: '日均支出较低',
      desc: '当前节奏良好，建议将节省存入目标账户',
      tone: 'neutral',
    });
  }
  return insights.slice(0, 3);
}

/* ---------- 月份文案 ---------- */
const MONTH_LABEL: Record<number, string> = {
  1: '一月 · 新年规划',
  2: '二月 · 春节消费',
  3: '三月 · 春日',
  4: '四月 · 春日',
  5: '五月 · 初夏',
  6: '六月 · 盛夏',
  7: '七月 · 暑期',
  8: '八月 · 暑期',
  9: '九月 · 金秋',
  10: '十月 · 国庆',
  11: '十一月 · 双十一',
  12: '十二月 · 年终',
};

export default function Dashboard() {
  const { current } = useLedger();
  const navigate = useNavigate();
  const openDrawer = useUiStore((s) => s.openDrawer);

  /* ---------- 状态 ---------- */
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [budgets, setBudgets] = useState<Array<{ id: string; amount: number; category_id: string | null }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<TabKey>('recent');
  const { transactions } = useTransactions(current?.id);

  /* ---------- 月份相关 ---------- */
  const isCurrentMonth = dayjs(month).isSame(dayjs(), 'month');
  const dayCount = isCurrentMonth ? dayjs().date() : dayjs(month).daysInMonth();
  const monthIndex = dayjs(month).month(); // 0-11
  const monthLabel = MONTH_LABEL[monthIndex + 1] ?? '';

  /* ---------- 数据加载 ---------- */
  useEffect(() => {
    if (!current) return;
    void api
      .statsSummary(current.id, `${month}-01`)
      .then(setSummary)
      .catch(() => {
        void idbGetAll<TransactionRowType>('transactions').then((rows) => {
          const monthTx = rows.filter((t) => t.ledger_id === current.id && !t.deleted_at && t.txn_date.startsWith(month));
          const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          setSummary({ income, expense, balance: income - expense, by_category: [] });
        });
      });
  }, [current, month]);

  useEffect(() => {
    if (!current) return;
    void api.listBudgets(current.id).then(setBudgets).catch(() => setBudgets([]));
    void api.listCategories(current.id).then((rows) => setCategories(rows.map(toModel))).catch(() => setCategories([]));
  }, [current]);

  /* ---------- 月份切换 ---------- */
  const goPrevMonth = () => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'));
  const goNextMonth = () => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'));
  const goThisMonth = () => setMonth(dayjs().format('YYYY-MM'));

  /* ---------- 派生数据 ---------- */
  const totalBudget = budgets.filter((b) => !b.category_id).reduce((s, b) => s + b.amount, 0);
  const spent = summary?.expense ?? 0;
  const budgetRatio = totalBudget > 0 ? spent / totalBudget : 0;
  const remaining = totalBudget > 0 ? subtract(String(totalBudget), String(spent)) : '0.00';
  const txCount = transactions.filter((t) => t.txn_date.startsWith(month)).length;
  const dailyAvg = dayCount > 0 ? spent / dayCount : 0;
  const saveRate = summary && summary.income > 0 ? Math.max(-100, Math.min(100, (summary.balance / summary.income) * 100)) : 0;

  /* ---------- 数字滚动 ---------- */
  const balanceNum = useCountUp(summary?.balance ?? 0, { duration: 900 });
  const incomeNum = useCountUp(summary?.income ?? 0, { duration: 900 });
  const expenseNum = useCountUp(summary?.expense ?? 0, { duration: 900 });
  const avgNum = useCountUp(dailyAvg, { duration: 800 });

  /* ---------- 顶部触摸开始坐标（用于 Hero 月度切换手势） ---------- */
  const heroRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onHeroTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onHeroTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNextMonth();
      else goPrevMonth();
    }
    touchStart.current = null;
  };

  /* ---------- 涟漪点击 ---------- */
  const triggerRipple = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.classList.remove('ripple-active');
    void target.offsetWidth; // 强制重排
    target.classList.add('ripple-active');
    window.setTimeout(() => target.classList.remove('ripple-active'), 600);
  };

  /* ---------- AI 洞察 ---------- */
  const insights = useMemo(() => buildInsight(summary, dayCount), [summary, dayCount]);

  /* ---------- 渲染 ---------- */
  return (
    <div className="page">
      <style>{animationStyles}</style>

      {/* ========== 1. 顶部品牌栏 ========== */}
      <header className="animate-fade-in-up relative mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            openDrawer();
          }}
          aria-label="菜单"
          className="ripple touch-target -ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-secondary)] shadow-[var(--shadow-glass)] backdrop-blur-[8px] transition-all duration-fast hover:border-primary/40 hover:text-primary hover:shadow-[var(--shadow-glass-lg)] active:scale-95"
        >
          <Menu size={20} aria-hidden />
       </button>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" aria-hidden />
            <span className="text-[11px] font-medium tracking-wider text-[var(--color-muted)]">
              {dayjs().format('YYYY年M月D日 · dddd')}
           </span>
         </div>
          <h1 className="truncate font-display text-[19px] font-bold leading-tight tracking-tight text-[var(--color-text)]">
            你好，{current?.name ?? '智能记账'}
         </h1>
       </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/search"
            aria-label="搜索"
            className="ripple touch-target relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-secondary)] shadow-[var(--shadow-glass)] backdrop-blur-[8px] transition-all duration-fast hover:border-primary/40 hover:text-primary hover:shadow-[var(--shadow-glass-lg)] active:scale-95"
          >
            <Search size={19} aria-hidden />
         </Link>
          <Link
            to="/settings/notifications"
            aria-label="通知"
            className="ripple touch-target relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-secondary)] shadow-[var(--shadow-glass)] backdrop-blur-[8px] transition-all duration-fast hover:border-primary/40 hover:text-primary hover:shadow-[var(--shadow-glass-lg)] active:scale-95"
          >
            <Bell size={19} aria-hidden />
            <span className="dot-pulse absolute right-2 top-2 inline-block h-2 w-2 rounded-full bg-[var(--color-expense)] ring-2 ring-[var(--color-bg)]" />
         </Link>
       </div>
     </header>

      {/* ========== 2. Hero 收支结余卡（Aurora 渐变背景） ========== */}
      <section
        ref={heroRef}
        onTouchStart={onHeroTouchStart}
        onTouchEnd={onHeroTouchEnd}
        className="animate-fade-in-up animate-delay-1 relative mb-5 overflow-hidden rounded-[22px] shadow-[0_18px_56px_rgba(124,92,252,0.32)]"
        style={{ animation: 'heroFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0 }}
      >
        {/* Aurora 渐变背景层 */}
        <div className="aurora-mesh" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c5cfc] via-[#5b3fe0] to-[#11b5a8]" />
        {/* 顶部装饰光晕 */}
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[#ff8a5b]/30 blur-3xl pointer-events-none" />

        {/* 旋转装饰圆环 */}
        <div className="pointer-events-none absolute -right-20 -top-20 rotate-slow">
          <svg viewBox="0 0 200 200" className="h-56 w-56 opacity-25">
            <defs>
              <linearGradient id="ring-grad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
             </linearGradient>
           </defs>
            <circle cx="100" cy="100" r="86" fill="none" stroke="url(#ring-grad)" strokeWidth="1.5" strokeDasharray="2 6" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="url(#ring-grad)" strokeWidth="1" strokeDasharray="1 4" />
         </svg>
       </div>

        {/* 卡片正文 */}
        <div className="relative z-10 p-5 text-white">
          {/* 顶部月份胶囊 + 标签 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="month-pill flex items-center gap-0.5 rounded-full px-1.5 py-1">
              <button
                type="button"
                onClick={(e) => {
                  triggerRipple(e);
                  goPrevMonth();
                }}
                aria-label="上个月"
                className="ripple flex h-7 w-7 items-center justify-center rounded-full text-white/85 transition-all duration-fast hover:bg-white/15 active:scale-90"
              >
                <ChevronLeft size={16} aria-hidden />
             </button>
              <span className="px-2 text-[12px] font-semibold tabular-nums tracking-wide">
                {dayjs(month).format('YYYY · M月')}
             </span>
              <button
                type="button"
                onClick={(e) => {
                  triggerRipple(e);
                  goNextMonth();
                }}
                aria-label="下个月"
                className="ripple flex h-7 w-7 items-center justify-center rounded-full text-white/85 transition-all duration-fast hover:bg-white/15 active:scale-90"
              >
                <ChevronRight size={16} aria-hidden />
             </button>
           </div>

            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-[8px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
              <span className="text-[11px] font-medium tracking-wide text-white/95">
                {monthLabel || '本月'}
              </span>
             </div>
          </div>

          {/* 月份标题 */}
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/70">
                本月结余 · {isCurrentMonth ? `已过 ${dayCount} 天` : '历史月份'}
             </div>
           </div>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goThisMonth}
                className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-[6px] transition-all duration-fast hover:bg-white/25 active:scale-95"
              >
                回到本月
             </button>
            )}
         </div>

          {/* 大额结余 + 数字滚动 */}
          {summary ? (
            <div className="mb-4">
              <div className="gradient-text-primary number-roll num font-display text-[40px] font-extrabold leading-none tracking-tight tabular-nums">
                {balanceNum < 0 ? '−¥' : '¥'}
                {Math.abs(balanceNum).toFixed(2)}
             </div>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-white/85">
                <span>日均支出</span>
                <span className="num font-display font-semibold tabular-nums">
                  ¥{avgNum.toFixed(0)}
               </span>
                <span className="text-white/40">·</span>
                <span>{txCount} 笔</span>
             </div>
           </div>
          ) : (
            <Skeleton className="mb-4 h-12 w-3/4 rounded-xl bg-white/15" />
          )}

          {/* 收/支双列联排 */}
          {summary && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/12 px-3.5 py-3 backdrop-blur-[10px] border border-white/15">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-white/80">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25">
                    <TrendingUp size={10} aria-hidden />
                 </span>
                  收入
               </div>
                <div className="num font-display text-[18px] font-bold tabular-nums">
                  ¥{incomeNum.toFixed(2)}
               </div>
             </div>
              <div className="rounded-2xl bg-white/12 px-3.5 py-3 backdrop-blur-[10px] border border-white/15">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-white/80">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25">
                    <TrendingDown size={10} aria-hidden />
                 </span>
                  支出
               </div>
                <div className="num font-display text-[18px] font-bold tabular-nums">
                  ¥{expenseNum.toFixed(2)}
               </div>
             </div>
           </div>
          )}
       </div>

        {/* 底部玻璃磨砂条 */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/15 bg-white/8 px-5 py-2.5 backdrop-blur-[10px]">
          <span className="text-[11px] text-white/85">
            {isCurrentMonth ? `本月还有 ${dayjs(month).daysInMonth() - dayCount} 天` : '历史月份 · 数据已锁定'}
         </span>
          <Link
            to="/stats"
            className="ripple inline-flex items-center gap-0.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white transition-all duration-fast hover:bg-white/25"
          >
            详细图表 <ChevronRight size={11} aria-hidden />
         </Link>
       </div>
     </section>

      {/* ========== 3. 三列概览（日均 · 笔数 · 节省率） ========== */}
      <section className="animate-fade-in-up animate-delay-2 mb-5 grid grid-cols-3 gap-2.5">
        {/* 日均支出 */}
        <div
          className="glow-card ripple tilt-on-hover cursor-pointer rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-center shadow-[var(--shadow-card)] backdrop-blur-[10px] transition-all"
          onClick={(e) => {
            triggerRipple(e);
            navigate('/stats');
          }}
        >
          <div className="mb-1 flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--color-muted)]">
            <Wallet size={11} aria-hidden />
            日均
         </div>
          <div className="num font-display text-[18px] font-bold tabular-nums text-[var(--color-expense)]">
            ¥{avgNum.toFixed(0)}
         </div>
       </div>

        {/* 记笔数 */}
        <div
          className="glow-card ripple tilt-on-hover cursor-pointer rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-center shadow-[var(--shadow-card)] backdrop-blur-[10px] transition-all"
          onClick={(e) => {
            triggerRipple(e);
            navigate('/search');
          }}
        >
          <div className="mb-1 flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--color-muted)]">
            <Receipt size={11} aria-hidden />
            笔数
         </div>
          <div className="num font-display text-[18px] font-bold tabular-nums text-[var(--color-text)]">
            {txCount}
         </div>
       </div>

        {/* 节省率 */}
        <div
          className="glow-card ripple tilt-on-hover cursor-pointer rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-center shadow-[var(--shadow-card)] backdrop-blur-[10px] transition-all"
          onClick={(e) => {
            triggerRipple(e);
            navigate('/budgets');
          }}
        >
          <div className="mb-1 flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--color-muted)]">
            <PiggyBank size={11} aria-hidden />
            节省
         </div>
          <div className={`num font-display text-[18px] font-bold tabular-nums ${saveRate >= 0 ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'}`}>
            {summary && summary.income > 0 ? `${saveRate.toFixed(0)}%` : '—'}
         </div>
       </div>
     </section>

      {/* ========== 4. 快捷操作（横向滚动 · 6 项） ========== */}
      <section className="animate-fade-in-up animate-delay-3 mb-5">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-text)]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            快捷操作
         </h2>
          <span className="text-[11px] text-[var(--color-muted)]">左右滑动查看更多</span>
       </div>
        <div className="scroll-x-snap px-1">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="ripple quick-tile group flex w-[88px] flex-col items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-center shadow-[var(--shadow-card)] backdrop-blur-[10px] transition-all duration-base hover:-translate-y-1 hover:shadow-[var(--shadow-glass-lg)] active:scale-95"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.bg} text-white ${action.glow} transition-transform duration-base group-hover:scale-110 group-hover:-rotate-6`}
                >
                  <Icon size={22} aria-hidden />
               </span>
                <span className="text-[12px] font-semibold text-[var(--color-text)]">{action.label}</span>
                <span className="text-[10px] leading-none text-[var(--color-muted)]">{action.desc}</span>
             </Link>
            );
          })}
       </div>
     </section>

      {/* ========== 5. 本月预算（堆叠进度条） ========== */}
      <section className="animate-fade-in-up animate-delay-4 mb-5 overflow-hidden rounded-[22px] shadow-[var(--shadow-card)]">
        <div className="gradient-border-card overflow-hidden">
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-text)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <PiggyBank size={14} aria-hidden />
               </span>
                本月预算
             </h2>
              <Link
                to="/budgets"
                className="ripple inline-flex items-center gap-0.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)] backdrop-blur-[4px] transition-all duration-fast hover:border-primary/30 hover:text-primary"
              >
                管理 <ChevronRight size={11} aria-hidden />
             </Link>
           </div>

            {totalBudget > 0 ? (
              <div>
                {/* 顶部数字 */}
                <div className="mb-2.5 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-[var(--color-muted)]">
                      已用 / 预算
                   </div>
                    <div className="mt-0.5 num font-display text-[20px] font-bold tabular-nums text-[var(--color-text)]">
                      <span className={budgetRatio >= 1 ? 'text-[var(--color-expense)]' : ''}>
                        {format(spent)}
                     </span>
                      <span className="text-[var(--color-muted)]"> / {format(totalBudget)}</span>
                   </div>
                 </div>
                  <div className="text-right">
                    <div className="text-[11px] font-medium text-[var(--color-muted)]">剩余</div>
                    <div className="num font-display text-[14px] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                      {remaining}
                   </div>
                 </div>
               </div>

                {/* 主进度条（带流光） */}
                <div className="relative h-3 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div
                    className="progress-shimmer h-full rounded-full transition-all duration-700 ease-spring"
                    style={{
                      width: `${Math.min(100, budgetRatio * 100)}%`,
                      background:
                        budgetRatio >= 1
                          ? 'linear-gradient(90deg, #f5455c, #ff7a8c)'
                          : budgetRatio >= 0.8
                            ? 'linear-gradient(90deg, #f5a524, #fbbf24)'
                            : 'linear-gradient(90deg, #7c5cfc, #11b5a8)',
                    }}
                  />
               </div>

                {/* 状态提示 */}
                {budgetRatio >= 1 ? (
                  <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-expense)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-expense)]" />
                    本月预算已超支，请注意控制支出
                 </p>
                ) : budgetRatio >= 0.8 ? (
                  <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-warning)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
                    预算已使用 80% 以上
                 </p>
                ) : (
                  <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-income)]" />
                    本月支出节奏健康
                 </p>
                )}
             </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
                  尚未设置预算
               </p>
                <Link
                  to="/budgets"
                  className="ripple rounded-lg bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary transition-colors duration-fast hover:bg-primary/20"
                >
                  去设置
               </Link>
             </div>
            )}
         </div>
       </div>
     </section>

      {/* ========== 6. Tab 切换：洞察 / 流水 / 排行 ========== */}
      <section className="animate-fade-in-up animate-delay-5 mb-6">
        {/* Tab 头 */}
        <div className="mb-3 flex items-center justify-center gap-6">
          {[
            { key: 'insight' as const, label: 'AI 洞察', icon: Lightbulb },
            { key: 'recent' as const, label: '最近流水', icon: Receipt },
            { key: 'rank' as const, label: '分类排行', icon: ChartPie },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={(e) => {
                  triggerRipple(e);
                  setTab(t.key);
                }}
                data-active={active}
                className={`tab-underline ripple flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold transition-colors duration-fast ${
                  active ? 'text-primary' : 'text-[var(--color-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <Icon size={14} aria-hidden />
                {t.label}
             </button>
            );
          })}
       </div>

        {/* Tab 内容 */}
        <div className="overflow-hidden rounded-[22px]">
          {tab === 'insight' && (
            <div className="flex flex-col gap-2.5">
              {insights.map((ins, idx) => {
                const Icon = ins.iconKey === 'up' ? TrendingUp : ins.iconKey === 'down' ? TrendingDown : Lightbulb;
                const tone =
                  ins.tone === 'income'
                    ? 'border-[var(--color-income)]/30 bg-gradient-to-br from-[var(--color-income)]/10 to-transparent'
                    : ins.tone === 'expense'
                      ? 'border-[var(--color-expense)]/30 bg-gradient-to-br from-[var(--color-expense)]/10 to-transparent'
                      : 'border-[var(--glass-border)] bg-[var(--glass-bg)]';
                const iconBg =
                  ins.tone === 'income'
                    ? 'bg-[var(--color-income)]/15 text-[var(--color-income)]'
                    : ins.tone === 'expense'
                      ? 'bg-[var(--color-expense)]/15 text-[var(--color-expense)]'
                      : 'bg-primary/15 text-primary';
                return (
                  <div
                    key={idx}
                    className={`ripple tilt-on-hover flex items-start gap-3 rounded-2xl border ${tone} p-3.5 backdrop-blur-[10px] transition-all duration-base`}
                    style={{ animation: `fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) ${idx * 0.08}s both`, opacity: 0 }}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                      <Icon size={16} aria-hidden />
                   </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[var(--color-text)]">
                        {ins.title}
                     </div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                        {ins.desc}
                     </div>
                   </div>
                 </div>
                );
              })}
           </div>
          )}

          {tab === 'recent' && (
            <div className="overflow-hidden rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[10px] transition-all duration-slow hover:shadow-[var(--shadow-glass-lg)]">
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-2.5">
                <h3 className="text-[13px] font-semibold text-[var(--color-text)]">
                  最近流水
               </h3>
                <Link
                  to="/search"
                  className="ripple inline-flex items-center gap-0.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)] backdrop-blur-[4px] transition-all duration-fast hover:border-primary/30 hover:text-primary"
                >
                  查看全部 <ChevronRight size={11} aria-hidden />
               </Link>
             </div>
              <TransactionList
                transactions={transactions.slice(0, 15)}
                categories={categories}
                onRowClick={(tx) => navigate('/record', { state: { edit: tx } })}
              />
           </div>
          )}

          {tab === 'rank' && (
            <div className="overflow-hidden rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 backdrop-blur-[10px]">
              {summary && summary.by_category && summary.by_category.length > 0 ? (
                <RankList
                  data={summary.by_category}
                  categories={categories}
                  onItemClick={(catId) => navigate('/search', { state: { categoryId: catId } })}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary">
                    <ChartPie size={26} aria-hidden />
                 </div>
                  <div className="text-[13px] font-semibold text-[var(--color-text)]">暂无排行数据</div>
                  <div className="mt-1 text-[12px] text-[var(--color-muted)]">
                    本月记几笔后，分类排行会自动出现
                 </div>
               </div>
              )}
           </div>
          )}
       </div>
     </section>

      {/* ========== 7. FAB（浮动记录按钮 · 多入口） ========== */}
      <button
        type="button"
        aria-label="快速记一笔"
        onClick={(e) => {
          triggerRipple(e);
          navigate('/record');
        }}
        className="ripple fixed bottom-[calc(var(--bottom-tab-height)+20px)] right-5 z-[var(--z-fab)] flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-[0_8px_28px_rgba(124,92,252,0.55)] transition-all duration-base hover:scale-105 active:scale-95"
        style={{
          animation: 'fabBounce 2.6s ease-in-out infinite',
          right: 'max(20px, calc((100vw - var(--app-frame-max, 430px)) / 2 + 20px))',
        }}
      >
        <Plus size={26} strokeWidth={2.5} aria-hidden />
        {/* 光晕 */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/30" />
     </button>
   </div>
  );
}

/* ---------- 分类排行（独立组件） ---------- */
function RankList({
  data,
  categories,
  onItemClick,
}: {
  data: StatsSummary['by_category'];
  categories: Category[];
  onItemClick: (catId: string) => void;
}) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const total = data.reduce((s, d) => s + d.amount, 0);
  const top = data.filter((d) => d.category_id).slice(0, 6);
  const max = top.reduce((m, d) => Math.max(m, d.amount), 0);

  return (
    <div className="flex flex-col gap-2">
      {top.map((item, idx) => {
        const cat = item.category_id ? catMap.get(item.category_id) : undefined;
        const pct = total > 0 ? (item.amount / total) * 100 : 0;
        const barW = max > 0 ? (item.amount / max) * 100 : 0;
        return (
          <button
            key={item.category_id ?? idx}
            type="button"
            onClick={() => item.category_id && onItemClick(item.category_id)}
            className="ripple group flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-fast hover:bg-[var(--color-surface-2)] active:scale-[0.98]"
          >
            {/* 排名 */}
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                idx === 0
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                  : idx === 1
                    ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                    : idx === 2
                      ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
              }`}
            >
              {idx + 1}
          </span>

            {/* 名称 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-[var(--color-text)]">
                  {item.category_name ?? cat?.name ?? '未分类'}
              </span>
                <span className="num shrink-0 text-[12px] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  ¥{item.amount.toFixed(0)}
              </span>
            </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-spring"
                    style={{
                      width: `${barW}%`,
                      background: item.color || cat?.color
                        ? `linear-gradient(90deg, ${item.color || cat?.color}, ${item.color || cat?.color}99)`
                        : 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                    }}
                  />
              </div>
                <span className="shrink-0 text-[10px] tabular-nums text-[var(--color-muted)]">
                  {pct.toFixed(1)}%
              </span>
            </div>
          </div>
        </button>
        );
      })}
  </div>
  );
}

/* ---------- Category row mapper ---------- */
function toModel(row: { id: string; ledger_id: string | null; parent_id: string | null; name: string; kind: 'income' | 'expense'; icon: string | null; color: string | null; sort: number; created_at: string }): Category {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    parentId: row.parent_id,
    name: row.name,
    kind: row.kind,
    icon: row.icon,
    color: row.color,
    sort: row.sort,
    createdAt: row.created_at,
  };
}

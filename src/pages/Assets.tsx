/**
 * Assets · 资产/净资产（按类型汇总）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useMemo, useState } from 'react';
import { Landmark, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Empty } from '@/components/common/Empty';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { format } from '@/lib/money';
import type { AccountRow } from '@/types/database';

/* ---------- 进场动画 keyframes ---------- */
const animationStyles = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes numberPop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}
.animate-number-pop {
  animation: numberPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.animate-delay-1 { animation-delay: 0.1s; }
.animate-delay-2 { animation-delay: 0.2s; }
.animate-delay-3 { animation-delay: 0.3s; }
.animate-delay-4 { animation-delay: 0.4s; }
`;

const TYPE_LABELS: Record<string, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡',
  invest: '投资',
  stored: '储值卡',
  wallet: '电子钱包',
  loan: '贷款',
};

const TYPE_GRADIENTS: Record<string, string> = {
  cash: 'from-emerald-400 to-teal-500',
  bank: 'from-primary to-primary-deep',
  credit: 'from-violet-400 to-purple-500',
  invest: 'from-amber-400 to-orange-500',
  stored: 'from-sky-400 to-cyan-500',
  wallet: 'from-rose-400 to-pink-500',
  loan: 'from-slate-400 to-slate-600',
};

export default function Assets() {
  const { current } = useLedger();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);

  useEffect(() => {
    if (!current) return;
    void api.listAccounts(current.id).then(setAccounts).catch(() => setAccounts([]));
  }, [current]);

  const { assets, liabilities, net } = useMemo(() => {
    const assets = accounts.filter((a) => a.type !== 'credit' && a.type !== 'loan').reduce((s, a) => s + a.balance, 0);
    const liabilities = accounts.filter((a) => a.type === 'credit' || a.type === 'loan').reduce((s, a) => s + a.balance, 0);
    return { assets, liabilities, net: assets - liabilities };
  }, [accounts]);

  const groups = useMemo(() => {
    const map = new Map<string, AccountRow[]>();
    for (const a of accounts) {
      const list = map.get(a.type) ?? [];
      list.push(a);
      map.set(a.type, list);
    }
    return [...map.entries()];
  }, [accounts]);

  const netColor = net >= 0 ? 'text-success' : 'text-expense';
  const netIcon = net >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="page">
      <style>{animationStyles}</style>

      <PageHeader title="资产 / 净资产" />

      {/* ========== 净资产总览卡片 ========== */}
      <section className="animate-fade-in-up card-gradient mb-5 overflow-hidden">
        <div className="glass-sm relative m-[1px] p-5 text-center">
          {/* 装饰光晕 */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-bl from-primary/20 to-transparent blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-xl" />

          <div className="relative">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                <Wallet size={18} aria-hidden />
              </span>
              <span className="text-overline font-semibold tracking-widest text-muted">净资产</span>
            </div>

            <div className={`animate-number-pop num font-display text-[34px] font-bold leading-tight tracking-tight ${netColor}`}>
              {format(net)}
            </div>

            <div className="mt-4 flex items-center justify-center gap-5">
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-income/10 to-income/5 px-4 py-2">
                <TrendingUp size={16} className="text-income" aria-hidden />
                <div>
                  <span className="text-overline text-muted">资产</span>
                  <span className="num ml-2 text-body font-semibold text-income">{format(assets)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-expense/10 to-expense/5 px-4 py-2">
                <TrendingDown size={16} className="text-expense" aria-hidden />
                <div>
                  <span className="text-overline text-muted">负债</span>
                  <span className="num ml-2 text-body font-semibold text-expense">{format(liabilities)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 账户分组列表 ========== */}
      {groups.length === 0 ? (
        <div className="animate-fade-in animate-delay-2" style={{ animationFillMode: 'both' }}>
          <Empty title="暂无账户" />
        </div>
      ) : (
        groups.map(([type, list], groupIdx) => (
          <section
            key={type}
            className="animate-fade-in-up glass mb-4 overflow-hidden"
            style={{ animationDelay: `${0.2 + groupIdx * 0.1}s` }}
          >
            {/* 分组标签 */}
            <div className="relative px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <span className={`inline-block h-4 w-1 rounded-full bg-gradient-to-b ${TYPE_GRADIENTS[type] ?? 'from-primary to-secondary'}`} />
                <span className="overline-label font-semibold tracking-wider">
                  {TYPE_LABELS[type] ?? type}
                </span>
                <span className="text-caption text-muted/60">· {list.length}</span>
              </div>
            </div>

            {/* 账户条目 */}
            <div className="divide-y divide-[var(--glass-border)]">
              {list.map((a) => (
                <div key={a.id} className="flex min-h-[52px] items-center justify-between px-4 py-2.5 transition-all duration-fast hover:bg-surface-2/30">
                  <span className="text-body font-medium text-text">{a.name}</span>
                  <span className={`num text-body font-semibold tracking-tight ${a.balance >= 0 ? 'text-text' : 'text-expense'}`}>
                    {format(a.balance)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
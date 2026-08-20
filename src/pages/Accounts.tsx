/**
 * Accounts · 账户列表（按类型分组，含信用卡）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Empty } from '@/components/common/Empty';
import { Skeleton } from '@/components/common/Skeleton';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { format } from '@/lib/money';
import type { AccountRow } from '@/types/database';

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

function AccountRow({ account, index }: { account: AccountRow; index: number }) {
  const navigate = useNavigate();
  const gradient = TYPE_GRADIENTS[account.type] ?? 'from-primary to-secondary';

  return (
    <button
      type="button"
      onClick={() => navigate(`/accounts/${account.id}`)}
      className="group flex min-h-[64px] w-full items-center gap-4 px-4 py-3 text-left transition-all duration-fast hover:bg-surface-2/50 active:scale-[0.99]"
      style={{ animationDelay: `${0.35 + index * 0.04}s` }}
    >
      {/* 账户图标 — 渐变背景 + 首字母 */}
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-sm transition-transform duration-fast group-hover:scale-110 group-hover:shadow-md`}
      >
        {account.name.slice(0, 1)}
      </span>

      {/* 账户信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-semibold text-text">
            {account.name}
          </span>
          {account.hidden && (
            <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-overline text-muted">
              隐藏
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-caption text-muted">
          <span>{account.currency}</span>
          <span className="inline-block h-1 w-1 rounded-full bg-border-strong" />
          <span className="truncate">
            {account.type === 'credit' && account.credit_limit !== null
              ? `额度 ${format(account.credit_limit)}`
              : TYPE_LABELS[account.type] ?? account.type}
          </span>
        </div>
      </div>

      {/* 余额 */}
      <span
        className={`num text-right text-h3 font-bold tracking-tight transition-all duration-fast group-hover:scale-105 ${
          account.balance >= 0 ? 'text-text' : 'text-expense'
        }`}
      >
        {format(account.balance)}
      </span>

      <ChevronRight size={16} className="shrink-0 text-muted transition-all duration-fast group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}

export default function Accounts() {
  const { current, canWrite } = useLedger();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    void api.listAccounts(current.id).then(setAccounts).catch(() => setAccounts([])).finally(() => setLoading(false));
  }, [current]);

  const groups = Object.entries(
    accounts.reduce<Record<string, AccountRow[]>>((acc, a) => {
      (acc[a.type] ??= []).push(a);
      return acc;
    }, {}),
  );

  return (
    <div className="page">
      <PageHeader
        title="账户"
        right={
          canWrite ? (
            <Link to="/accounts/new" aria-label="新建账户" className="touch-target -mr-2 rounded-md text-primary transition-all duration-fast hover:scale-110 active:scale-95">
              <Plus size={22} aria-hidden />
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <div className="mt-4">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="mt-3 h-20 w-full" />
            <Skeleton className="mt-2 h-20 w-full" />
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="animate-fade-in" style={{ animationFillMode: 'both' }}>
          <Empty
            title="暂无账户"
            description="新建一个账户开始记账吧"
            action={
              <Link to="/accounts/new" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-deep px-5 text-body font-semibold text-white shadow-glass transition-all duration-fast hover:shadow-glass-lg active:scale-95">
                <Plus size={18} aria-hidden />
                新建账户
              </Link>
            }
          />
        </div>
      ) : (
        groups.map(([type, list], groupIdx) => (
          <section
            key={type}
            className="glass mt-4 overflow-hidden animate-slide-up"
            style={{ animationDelay: `${groupIdx * 0.08}s`, animationFillMode: 'both' }}
          >
            {/* 分组标签 — 带渐变装饰线 */}
            <div className="relative px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-block h-4 w-1 rounded-full bg-gradient-to-b from-primary to-secondary" />
                <span className="overline-label font-semibold tracking-wider">
                  {TYPE_LABELS[type] ?? type}
                </span>
                <span className="text-caption text-muted/60">· {list.length}</span>
              </div>
            </div>

            {/* 账户行列表 */}
            <div className="divide-y divide-[var(--glass-border)]">
              {list.map((a, idx) => (
                <AccountRow key={a.id} account={a} index={idx} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
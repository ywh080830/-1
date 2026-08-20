/**
 * Sidebar · 桌面左侧边栏（≥1200px 显示）
 * Premium Glassmorphism + Minimalism 风格
 */
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  HandCoins,
  Landmark,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  ReceiptText,
  Repeat,
  Settings,
  Shield,
  Store,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import { useLedger } from '@/hooks/useLedger';

const NAV_GROUPS: Array<{ title: string; items: Array<{ to: string; label: string; icon: typeof LayoutDashboard }> }> = [
  {
    title: '概览',
    items: [
      { to: '/', label: '首页', icon: LayoutDashboard },
      { to: '/record', label: '记一笔', icon: ReceiptText },
      { to: '/stats', label: '统计', icon: LineChart },
      { to: '/calendar', label: '日历', icon: CalendarDays },
    ],
  },
  {
    title: '管理',
    items: [
      { to: '/ledgers', label: '账本', icon: BookOpen },
      { to: '/accounts', label: '账户', icon: Wallet },
      { to: '/categories', label: '分类', icon: Target },
      { to: '/budgets', label: '预算', icon: PiggyBank },
      { to: '/assets', label: '资产', icon: Landmark },
      { to: '/loans', label: '借贷', icon: HandCoins },
      { to: '/merchants', label: '商户库', icon: Store },
      { to: '/templates', label: '模板', icon: Repeat },
      { to: '/goals', label: '目标', icon: Target },
    ],
  },
  {
    title: '服务',
    items: [
      { to: '/membership', label: '会员', icon: Shield },
      { to: '/support', label: '客服', icon: Users },
    ],
  },
];

export function Sidebar() {
  const { current, role } = useLedger();

  return (
    <aside className="fixed inset-y-0 left-0 z-sticky hidden w-[var(--sidebar-width)] flex-col border-r border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-glass)] lg:flex">
      {/* 品牌区域 - 渐变装饰 */}
      <div className="relative flex h-16 items-center gap-3 px-6">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary-400)] to-transparent opacity-60" />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-deep)] text-white shadow-[0_2px_12px_rgba(79,70,229,0.3)]">
          <Wallet size={20} aria-hidden />
        </span>
        <div className="leading-tight">
          <div className="font-display text-h3 font-semibold text-[var(--color-text)]">智能记账</div>
          <div className="text-overline text-muted tracking-wide">元答AI工作室</div>
        </div>
      </div>

      {/* 当前账本 */}
      {current && (
        <div className="mx-4 mb-3 mt-1 flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3.5 py-2.5 transition-all duration-[var(--duration-fast)] hover:bg-[var(--color-border)]">
          <div className="min-w-0">
            <div className="truncate text-body font-medium text-[var(--color-text)]">{current.name}</div>
            <div className="text-overline text-muted">
              {role === 'owner' ? '主理人' : role === 'editor' ? '编辑' : '只读'}
            </div>
          </div>
          <ChevronRight size={16} className="text-muted shrink-0" aria-hidden />
        </div>
      )}

      {/* 导航列表 */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="overline-label px-3 pb-1.5 pt-1">{group.title}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative flex min-h-[44px] items-center gap-3 rounded-[var(--radius-sm)] px-3 text-body transition-all duration-[var(--duration-fast)] ${
                    isActive
                      ? 'bg-[var(--color-primary-50)] font-medium text-[var(--color-primary)]'
                      : 'text-text-secondary hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                    )}
                    <item.icon
                      size={18}
                      className={isActive ? 'text-[var(--color-primary)]' : ''}
                      aria-hidden
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* 底部设置 */}
      <div className="border-t border-[var(--glass-border)] p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex min-h-[44px] items-center gap-3 rounded-[var(--radius-sm)] px-3 text-body transition-all duration-[var(--duration-fast)] ${
              isActive
                ? 'bg-[var(--color-primary-50)] font-medium text-[var(--color-primary)]'
                : 'text-text-secondary hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
            }`
          }
        >
          <Settings size={18} aria-hidden />
          设置
        </NavLink>
      </div>
    </aside>
  );
}
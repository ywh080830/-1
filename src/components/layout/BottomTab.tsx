/**
 * BottomTab · 移动底部 Tab（5 项：首页/统计/⊕记一笔/日历/我的）
 * Premium Glassmorphism + 微动效优化
 * 64px 高度 + safe-area-inset-bottom
 */
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, House, LineChart, Plus, UserRound } from 'lucide-react';

const TABS = [
  { to: '/', label: '首页', icon: House },
  { to: '/stats', label: '统计', icon: LineChart },
  { to: '/record', label: '记一笔', icon: Plus, fab: true },
  { to: '/calendar', label: '日历', icon: CalendarDays },
  { to: '/me', label: '我的', icon: UserRound },
];

export function BottomTab() {
  const location = useLocation();

  const isActive = (tab: (typeof TABS)[number]) => {
    if (tab.to === '/') return location.pathname === '/';
    if (tab.to === '/me') {
      return (
        location.pathname.startsWith('/me') ||
        ['/ledgers', '/accounts', '/categories', '/budgets', '/assets',
          '/loans', '/templates', '/goals', '/merchants', '/membership',
          '/support', '/settings', '/search', '/recycle-bin',
        ].some((p) => location.pathname.startsWith(p))
      );
    }
    return location.pathname.startsWith(tab.to);
  };

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-fab flex h-[var(--bottom-tab-height)] items-stretch border-t border-glass-border bg-glass-bg backdrop-blur-[var(--glass-blur)] shadow-glass"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="主导航"
    >
      {TABS.map((tab) => {
        if (tab.fab) {
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="relative flex flex-1 items-center justify-center"
              aria-label={tab.label}
            >
              <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-gradient-to-br from-cta to-cta-deep text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all duration-base ease-spring hover:shadow-[0_6px_28px_rgba(249,115,22,0.55)] hover:scale-110 active:scale-90 animate-pulse-shadow">
                <Plus size={26} aria-hidden />
              </span>
            </NavLink>
          );
        }

        const active = isActive(tab);

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-fast"
          >
            {active && (
              <span className="absolute top-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary transition-all duration-base" />
            )}
            <tab.icon
              size={22}
              className={`transition-all duration-fast ${
                active ? 'text-primary' : 'text-muted'
              }`}
              aria-hidden
            />
            <span
              className={`text-overline transition-all duration-fast ${
                active
                  ? 'font-semibold text-primary'
                  : 'text-muted'
              }`}
            >
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
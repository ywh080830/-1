/**
 * AppDrawer · 侧边抽屉菜单（app 端 ☰）
 * 取代桌面左侧固定 Sidebar，改为滑入式抽屉，所有二级导航集中于此。
 * 路由切换 / 点击遮罩 / Esc 均自动关闭。
 */
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  HandCoins,
  Landmark,
  LayoutDashboard,
  LayoutList,
  LineChart,
  PiggyBank,
  ReceiptText,
  Repeat,
  Search,
  Settings,
  Shield,
  Store,
  Target,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useLedger } from '@/hooks/useLedger';
import { useUiStore } from '@/stores/uiStore';

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
      { to: '/categories', label: '分类', icon: LayoutList },
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
  {
    title: '更多',
    items: [
      { to: '/search', label: '全局搜索', icon: Search },
      { to: '/recycle-bin', label: '回收站', icon: Trash2 },
      { to: '/settings', label: '设置', icon: Settings },
    ],
  },
];

export function AppDrawer() {
  const { current, role } = useLedger();
  const location = useLocation();
  const open = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);

  // 路由切换自动关闭
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeDrawer]);

  return (
    <>
      <div
        className="drawer-scrim"
        data-open={open}
        onClick={closeDrawer}
        aria-hidden={!open}
      />
      <aside
        className="drawer-panel"
        data-open={open}
        aria-hidden={!open}
        aria-label="主导航菜单"
      >
        {/* 品牌区域 */}
        <div className="relative flex h-16 items-center gap-3 px-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary-400)] to-transparent opacity-60" />
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-deep)] text-white shadow-[0_2px_12px_rgba(79,70,229,0.3)]">
            <Wallet size={20} aria-hidden />
          </span>
          <div className="leading-tight">
            <div className="font-display text-h3 font-semibold text-[var(--color-text)]">智能记账</div>
            <div className="text-overline text-muted tracking-wide">元答AI工作室</div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="关闭菜单"
            className="touch-target -mr-2 ml-auto rounded-[var(--radius-sm)] text-text-secondary transition-all duration-[var(--duration-fast)] hover:bg-[var(--color-surface-2)] active:scale-95"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* 当前账本 */}
        {current && (
          <div className="mx-4 mb-3 mt-1 flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-body font-medium text-[var(--color-text)]">{current.name}</div>
              <div className="text-overline text-muted">
                {role === 'owner' ? '主理人' : role === 'editor' ? '编辑' : '只读'}
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
          </div>
        )}

        {/* 导航列表 */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              <div className="overline-label px-3 pb-1.5 pt-1">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeDrawer}
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
      </aside>
    </>
  );
}

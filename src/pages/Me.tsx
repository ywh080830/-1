/**
 * Me · 我的（Aurora Silk 个人中心 · Profile Hub）
 * uupm-design-intelligence 重构：
 *   封面英雄区（渐变水洗 + 光晕头像）→ 竖排分组导航（高频常驻 + 低频折叠）→ 主题 · 退出
 * real-svg-icons：lucide-react 真实内联 SVG（24×24 currentColor 主题自适应），无 emoji
 * 排版：HarmonyOS Sans SC；圆角体系 radius-sm 10 / md 16 / lg 22 / xl 30
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Crown,
  HandCoins,
  Landmark,
  LayoutList,
  Moon,
  PiggyBank,
  LogOut,
  Search,
  Settings,
  Store,
  Sun,
  Target,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useLedger } from '@/hooks/useLedger';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

interface Tile {
  to: string;
  label: string;
  icon: typeof Wallet;
}

// 竖排分组导航 —— 高频功能常驻（2 组 7 项），低频功能收进「更多功能」折叠区
const PRIMARY_GROUPS: Array<{ title: string; items: Tile[] }> = [
  {
    title: '我的账本',
    items: [
      { to: '/ledgers', label: '账本管理', icon: BookOpen },
      { to: '/accounts', label: '我的账户', icon: Wallet },
      { to: '/categories', label: '分类管理', icon: LayoutList },
      { to: '/budgets', label: '预算', icon: PiggyBank },
    ],
  },
  {
    title: '财富中心',
    items: [
      { to: '/assets', label: '资产 · 净资产', icon: Landmark },
      { to: '/goals', label: '存钱目标', icon: Target },
      { to: '/settings', label: '设置', icon: Settings },
    ],
  },
];

// 低频 / 进阶功能 —— 默认折叠，避免首屏信息过载
const MORE_ITEMS: Tile[] = [
  { to: '/loans', label: '借贷', icon: HandCoins },
  { to: '/merchants', label: '商户库', icon: Store },
  { to: '/search', label: '全局搜索', icon: Search },
  { to: '/recycle-bin', label: '回收站', icon: Trash2 },
  { to: '/support', label: '帮助与反馈', icon: CircleHelp },
];

export default function Me() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { current, role } = useLedger();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const [moreOpen, setMoreOpen] = useState(false);

  const isMember = profile?.tier === 'member';
  const displayName = profile?.nickname || user?.email || '';
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : '';
  const roleLabel = role === 'owner' ? '主理人' : role === 'editor' ? '编辑' : '只读';

  const handleSignOut = async () => {
    await useAuthStore.getState().signOut();
    navigate('/login');
  };

  // 行式入口：图标渐变徽章（悬停实色化）+ 标签 + 箭头
  const renderRow = (item: Tile) => (
    <Link
      key={item.to}
      to={item.to}
      className="group flex min-h-[52px] items-center gap-4 rounded-xl px-3 text-body transition-all duration-base hover:glass-sm active:scale-[0.98]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary transition-all duration-base group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-fab">
        <item.icon size={20} aria-hidden />
      </div>
      <span className="flex-1 truncate text-text-secondary group-hover:text-text">{item.label}</span>
      <ChevronRight
        size={16}
        className="text-muted transition-transform duration-base group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );

  return (
    <div className="page">
      <PageHeader title="我的" menu />

      {/* 封面英雄区：渐变水洗 + 光晕头像 */}
      <section className="relative overflow-hidden rounded-xl glass p-5 transition-all duration-base hover:shadow-pop">
        {/* 装饰层：主色水洗 + 顶部光晕 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute -top-12 right-4 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative flex items-center gap-4">
          {/* 头像：渐变底 + 呼吸光晕环 */}
          <div className="relative shrink-0">
            <span className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-primary via-secondary to-cta opacity-60 blur-md" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white shadow-pop ring-2 ring-white/50">
              {initial ? <span className="drop-shadow">{initial}</span> : <UserRound size={34} aria-hidden />}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-h2 font-semibold text-text">{displayName || '未设置昵称'}</h2>
            <div className="mt-1.5 flex items-center gap-1.5 text-caption text-muted">
              {current ? current.name : '暂无账本'}
              {current && <span className="text-muted/70">· {roleLabel}</span>}
            </div>
          </div>

          {isMember ? (
            <Badge tone="member" className="px-2.5 py-1 text-primary border border-primary/30">
              <Crown size={12} className="mr-1 inline" aria-hidden /> 会员
            </Badge>
          ) : (
            <span className="shrink-0 rounded-full border border-border bg-surface-2/70 px-2.5 py-1 text-caption text-muted">
              体验版
            </span>
          )}
        </div>
      </section>

      {/* 会员权益条：非会员 → 渐变开通；会员 → 权益管理 */}
      {isMember ? (
        <Link
          to="/membership"
          className="group mt-3 flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-body transition-all duration-base hover:bg-primary/10 active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 font-medium text-primary">
            <Crown size={16} aria-hidden /> 尊享会员 · 管理权益
          </span>
          <ChevronRight size={16} className="text-primary/60 transition-transform duration-base group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ) : (
        <Link
          to="/membership"
          className="group mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-body shadow-fab transition-all duration-base hover:shadow-glass-lg active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 font-medium text-white">
            <Crown size={16} aria-hidden /> 开通会员 · 解锁记账特权
          </span>
          <ChevronRight size={16} className="text-white/70 transition-transform duration-base group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}

      {/* 竖排分组导航 —— 高频功能常驻 */}
      {PRIMARY_GROUPS.map((group) => (
        <section key={group.title} className="glass mt-4 overflow-hidden p-2 transition-all duration-base">
          <div className="overline-label px-3 pt-2 pb-1">{group.title}</div>
          <div className="space-y-0.5 p-1">{group.items.map(renderRow)}</div>
        </section>
      ))}

      {/* 折叠区：低频 / 进阶功能，默认收起 */}
      <section className="glass mt-4 overflow-hidden p-2 transition-all duration-base">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="group flex min-h-[52px] w-full items-center gap-4 rounded-xl px-3 text-body transition-all duration-base hover:glass-sm active:scale-[0.98]"
          aria-expanded={moreOpen}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary transition-all duration-base group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-fab">
            <CircleHelp size={20} aria-hidden />
          </div>
          <span className="flex-1 text-left text-text-secondary group-hover:text-text">更多功能</span>
          <ChevronDown
            size={16}
            className={`text-muted transition-transform duration-base ${moreOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {/* 折叠内容：展开时渲染，grid-rows 平滑动画 */}
        <div
          className={`grid transition-all duration-base ease-out ${moreOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className="overflow-hidden">
            <div className="space-y-0.5 p-1 pt-0.5">{MORE_ITEMS.map(renderRow)}</div>
          </div>
        </div>
      </section>

      {/* 主题切换 · 独立一行，保留 Switch */}
      <section className="glass mt-4 overflow-hidden p-2 transition-all duration-base">
        <button
          type="button"
          onClick={toggleTheme}
          className="group flex min-h-[52px] w-full items-center gap-4 rounded-xl px-3 text-body transition-all duration-base hover:glass-sm active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary transition-all duration-base group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-fab">
            {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
          </div>
          <span className="flex-1 text-left text-text-secondary group-hover:text-text">
            {theme === 'dark' ? '浅色模式' : '深色模式'}
          </span>
          <div
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-base ${
              theme === 'dark' ? 'bg-primary' : 'bg-surface-2'
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-base ${
                theme === 'dark' ? 'left-6' : 'left-1'
              }`}
            />
          </div>
        </button>
      </section>

      {/* 退出登录 */}
      {user && (
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full glass-sm px-4 py-3 text-body text-red-400 transition-all duration-base hover:scale-[1.01] hover:text-red-500 active:scale-95"
        >
          <LogOut size={18} aria-hidden /> 退出登录
        </button>
      )}

      {/* 署名 */}
      <footer className="mt-8 pb-4 text-center">
        <div className="inline-block rounded-full glass-sm px-6 py-2">
          <p className="text-caption text-muted">元答AI工作室 · 智能记账</p>
        </div>
      </footer>
    </div>
  );
}

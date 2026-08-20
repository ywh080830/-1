/**
 * AppShell · 应用骨架（app 端：手机设备外框 + 底部 Tab + 抽屉菜单 + FAB）
 * Premium Glassmorphism + Minimalism 风格
 */
import { Outlet, useNavigate } from 'react-router-dom';
import { AppDrawer } from './AppDrawer';
import { BottomTab } from './BottomTab';
import { FAB } from './FAB';
import { ToastHost } from '@/components/common/Toast';
import { useOnline } from '@/hooks/useOnline';
import { useLedger } from '@/hooks/useLedger';
import { useRealtime } from '@/hooks/useRealtime';
import { useSyncStore } from '@/stores/syncStore';
import { useAuthStore } from '@/stores/authStore';
import { Wifi, WifiOff, RefreshCw, Cloud, Sparkles, LogOut } from 'lucide-react';

export function AppShell() {
  useOnline();
  const navigate = useNavigate();
  const { current } = useLedger();
  const isDemo = useAuthStore((s) => s.isDemo);
  useRealtime(current?.id);

  const status = useSyncStore((s) => s.status);
  const pendingCount = useSyncStore((s) => s.pendingCount);

  const exitDemo = async () => {
    await useAuthStore.getState().signOut();
    navigate('/login', { replace: true });
  };

  const statusConfig = {
    offline: {
      icon: WifiOff,
      label: '离线',
      ring: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    },
    syncing: {
      icon: RefreshCw,
      label: '同步中',
      ring: 'shadow-[0_0_12px_rgba(79,70,229,0.25)]',
    },
    idle: {
      icon: Cloud,
      label: pendingCount > 0 ? `${pendingCount} 条待同步` : '已同步',
      ring: pendingCount > 0 ? 'shadow-[0_0_12px_rgba(245,158,11,0.25)]' : 'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    },
  };

  const cfg = statusConfig[status === 'offline' ? 'offline' : status === 'syncing' ? 'syncing' : 'idle'];
  const Icon = cfg.icon;

  const statusColor =
    status === 'offline'
      ? 'text-warning'
      : status === 'syncing'
        ? 'text-primary'
        : pendingCount > 0
          ? 'text-warning'
          : 'text-success';

  // 仅在有状态需要提示时显示（离线 / 同步中 / 有待同步），避免遮挡页面头部
  const showStatus = status === 'offline' || status === 'syncing' || pendingCount > 0;

  return (
    <div className="app-backdrop">
      <div className="app-frame">
        {/* 顶部状态栏安全区背景（华为/Oppo 刘海屏完整适配） */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-sticky h-[var(--safe-top)] bg-[var(--color-bg)]" />

        {/* 可滚动屏幕区域 */}
        <div className="app-screen">
          <Outlet />
        </div>

        {/* 侧边抽屉菜单 */}
        <AppDrawer />

        {/* 底部主导航 */}
        <BottomTab />

        {/* 记一笔悬浮按钮 */}
        <FAB />

        {/* 同步状态徽章（app 内 · 仅异常状态显示） */}
        {showStatus && (
          <div className="pointer-events-none absolute right-3 top-[calc(var(--safe-top)+8px)] z-sticky">
            <div
              className={`glass-sm flex items-center gap-2 px-3 py-1.5 ${statusColor} ${cfg.ring} transition-all duration-[var(--duration-base)]`}
            >
              <Icon
                size={14}
                className={status === 'syncing' ? 'animate-spin' : ''}
                aria-hidden
              />
              <span className="text-caption font-medium">{cfg.label}</span>
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${status === 'syncing' ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        )}

        {/* 体验模式横幅 */}
        {isDemo && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--bottom-tab-height)+var(--safe-bottom))] z-sticky flex items-center justify-center px-4">
            <div className="glass pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-caption text-primary shadow-glass">
              <Sparkles size={14} aria-hidden />
              体验模式 · 演示数据
              <button
                type="button"
                onClick={exitDemo}
                className="touch-target !h-auto min-h-0 rounded-full bg-primary/10 px-2 py-0.5 text-overline font-semibold text-primary transition-all duration-fast hover:bg-primary hover:text-white active:scale-95"
              >
                退出
              </button>
            </div>
          </div>
        )}

        <ToastHost />
      </div>
    </div>
  );
}

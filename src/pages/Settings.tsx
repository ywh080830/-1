/**
 * Settings · 设置（总）
 */
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Database,
  FileDown,
  FileUp,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUiStore } from '@/stores/uiStore';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const logout = async () => {
    await useAuthStore.getState().signOut();
    useUiStore.getState().showToast('success', '已退出登录');
    navigate('/login', { replace: true });
  };

  return (
    <div className="page">
      <PageHeader title="设置" />

      {/* 个人资料卡片 - 毛玻璃 */}
      <section className="glass-sm">
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-primary shadow-sm">
            <ShieldCheck size={22} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-medium">{user?.email ?? user?.phone ?? '未登录'}</div>
            <div className="mt-0.5 text-caption text-muted">账号安全</div>
          </div>
          <ChevronRight size={16} className="text-muted" aria-hidden />
        </div>
      </section>

      {/* 通用设置菜单 */}
      <section className="glass mt-4 overflow-hidden">
        <div className="px-4 pt-3">
          <span className="overline-label">通用</span>
        </div>
        <Link
          to="/settings/security"
          className="flex min-h-[52px] items-center gap-3 px-4 text-body transition-all duration-fast hover:bg-primary/5 active:scale-[0.99]"
        >
          <ShieldCheck size={20} className="text-primary" aria-hidden />
          <span className="flex-1">安全设置</span>
          <ChevronRight size={16} className="text-muted" aria-hidden />
        </Link>
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <button
          type="button"
          onClick={toggleTheme}
          className="flex min-h-[52px] w-full items-center gap-3 px-4 text-body transition-all duration-fast hover:bg-primary/5 active:scale-[0.99]"
        >
          {theme === 'dark' ? (
            <Sun size={20} className="text-amber-500" aria-hidden />
          ) : (
            <Moon size={20} className="text-indigo-400" aria-hidden />
          )}
          <span className="flex-1">{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-overline text-primary">
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <Link
          to="/settings/notifications"
          className="flex min-h-[52px] items-center gap-3 px-4 text-body transition-all duration-fast hover:bg-primary/5 active:scale-[0.99]"
        >
          <Bell size={20} className="text-secondary" aria-hidden />
          <span className="flex-1">提醒设置</span>
          <ChevronRight size={16} className="text-muted" aria-hidden />
        </Link>
      </section>

      {/* 数据管理菜单 */}
      <section className="glass mt-4 overflow-hidden">
        <div className="px-4 pt-3">
          <span className="overline-label">数据</span>
        </div>
        <Link
          to="/settings/data"
          className="flex min-h-[52px] items-center gap-3 px-4 text-body transition-all duration-fast hover:bg-primary/5 active:scale-[0.99]"
        >
          <Database size={20} className="text-primary" aria-hidden />
          <span className="flex-1">数据管理（备份 / 导出）</span>
          <ChevronRight size={16} className="text-muted" aria-hidden />
        </Link>
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <Link
          to="/settings/import"
          className="flex min-h-[52px] items-center gap-3 px-4 text-body transition-all duration-fast hover:bg-primary/5 active:scale-[0.99]"
        >
          <FileUp size={20} className="text-secondary" aria-hidden />
          <span className="flex-1">CSV 导入（迁移）</span>
          <ChevronRight size={16} className="text-muted" aria-hidden />
        </Link>
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <Link
          to="/settings/data"
          className="flex min-h-[52px] items-center gap-3 px-4 text-body transition-all duration-fast hover:bg-primary/5 active:scale-[0.99]"
        >
          <FileDown size={20} className="text-amber-500" aria-hidden />
          <span className="flex-1">导出 Excel / CSV</span>
          <ChevronRight size={16} className="text-muted" aria-hidden />
        </Link>
      </section>

      <Button variant="danger" block className="mt-5" onClick={logout} icon={<LogOut size={18} aria-hidden />}>
        退出登录
      </Button>
    </div>
  );
}
/**
 * PageHeader · 页面头部（返回 / 菜单 + 标题 + 右侧操作）
 * Premium Glassmorphism + Minimalism 风格
 * 粘性定位 + 毛玻璃效果 + 安全区适配
 */
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Menu } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  menu?: boolean;
  left?: ReactNode;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, back = true, menu = false, left, right }: PageHeaderProps) {
  const navigate = useNavigate();
  const openDrawer = useUiStore((s) => s.openDrawer);
  return (
    <header className="sticky top-[var(--safe-top)] z-sticky border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-card)]">
      <div className="mx-auto flex h-14 max-w-[var(--page-max-width)] items-center gap-2 px-4">
        {left ?? (menu ? (
          <button
            type="button"
            onClick={openDrawer}
            aria-label="菜单"
            className="touch-target -ml-2 rounded-[var(--radius-sm)] text-text-secondary transition-all duration-[var(--duration-fast)] hover:bg-[var(--color-surface-2)] active:scale-95"
          >
            <Menu size={22} aria-hidden />
          </button>
        ) : back ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="touch-target -ml-2 rounded-[var(--radius-sm)] text-text-secondary transition-all duration-[var(--duration-fast)] hover:bg-[var(--color-surface-2)] active:scale-95"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
        ) : (
          <div className="w-6" />
        ))}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-h3 font-semibold text-[var(--color-text)]">{title}</h1>
          {subtitle && <div className="truncate text-caption text-muted">{subtitle}</div>}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
/**
 * Empty · 空态（Premium Glassmorphism + Minimalism）
 * 更干净的空白状态，更好的插图区域，glassmorphism 容器
 */
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function Empty({ title = '暂无数据', description, icon, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      {/* 图标容器 — glassmorphism 圆形区域 */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/40 bg-glass-bg text-muted shadow-glass backdrop-blur-[8px] transition-all duration-slow hover:shadow-glass-lg hover:border-primary/20 hover:text-primary/60">
        {icon ?? <Inbox size={32} aria-hidden />}
      </div>
      {/* 装饰性光晕 */}
      <div
        className="pointer-events-none -mt-16 h-20 w-20 rounded-full opacity-30 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(79,70,229,0.2), transparent 70%)',
        }}
      />
      <div className="flex flex-col gap-1">
        <div className="text-body font-medium text-text-secondary">{title}</div>
        {description && (
          <div className="text-caption text-muted max-w-[240px] leading-relaxed">
            {description}
          </div>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
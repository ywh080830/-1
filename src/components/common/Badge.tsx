/**
 * Badge · 徽标（Premium Glassmorphism + Minimalism）
 * glassmorphism 风格，语义色 + 文字，不只靠颜色传达状态
 */
import type { ReactNode } from 'react';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'member';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  label?: string;
  className?: string;
}

const TONES: Record<Tone, string> = {
  default:
    'bg-glass-bg backdrop-blur-[8px] border border-border/40 text-text-secondary shadow-glass',
  primary:
    'bg-primary/10 backdrop-blur-[8px] border border-primary/20 text-primary shadow-[0_2px_8px_rgba(79,70,229,0.08)]',
  success:
    'bg-success/10 backdrop-blur-[8px] border border-success/20 text-success shadow-[0_2px_8px_rgba(16,185,129,0.08)]',
  warning:
    'bg-warning/10 backdrop-blur-[8px] border border-warning/20 text-warning shadow-[0_2px_8px_rgba(245,158,11,0.08)]',
  danger:
    'bg-error/10 backdrop-blur-[8px] border border-error/20 text-error shadow-[0_2px_8px_rgba(239,68,68,0.08)]',
  member:
    'bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-[8px] border border-white/20 text-white shadow-[0_2px_12px_rgba(79,70,229,0.2)]',
};

export function Badge({ tone = 'default', children, label, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-overline font-medium tracking-wide ${TONES[tone]} ${className}`}
      aria-label={label}
    >
      {/* 状态指示点 */}
      {tone !== 'default' && tone !== 'member' && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {children}
    </span>
  );
}
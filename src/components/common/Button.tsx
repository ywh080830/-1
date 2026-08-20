/**
 * Button · 通用按钮（Premium Glassmorphism + Minimalism）
 * 设计 token 驱动，触控 ≥44px，spring 动效，含 glass 变体与渐变选项
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'cta' | 'outline' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  gradient?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-[0_2px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:bg-primary-hover active:bg-primary-pressed',
  secondary:
    'bg-secondary text-white shadow-[0_2px_12px_rgba(13,148,136,0.25)] hover:shadow-[0_4px_20px_rgba(13,148,136,0.35)] hover:bg-secondary-hover',
  ghost:
    'bg-transparent text-text-secondary hover:bg-white/50 hover:backdrop-blur-[8px] hover:shadow-glass',
  danger:
    'bg-error text-white shadow-[0_2px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.35)] hover:opacity-90',
  cta: 'bg-cta text-white shadow-fab hover:shadow-[0_6px_24px_rgba(249,115,22,0.45)] hover:bg-cta-hover',
  outline:
    'border border-border/60 bg-glass-bg text-text backdrop-blur-[4px] hover:border-primary/50 hover:bg-primary/5 hover:text-primary',
  glass:
    'bg-glass-bg backdrop-blur-[12px] border border-glass-border text-text shadow-glass hover:shadow-glass-lg hover:bg-white/70 active:bg-white/80',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'min-h-[36px] px-3 text-caption gap-1.5 rounded-lg',
  md: 'min-h-[44px] px-5 text-body gap-2 rounded-xl',
  lg: 'min-h-[52px] px-6 text-h3 gap-2.5 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  gradient = false,
  ...rest
}: ButtonProps) {
  const gradientClass = gradient
    ? 'bg-gradient-to-r from-primary to-secondary border-none text-white shadow-[0_2px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.4)]'
    : '';

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center font-medium transition-all duration-slow ease-spring active:scale-[0.97] disabled:is-disabled ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${gradientClass} ${block ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
      role="status"
      aria-label="加载中"
    />
  );
}
/**
 * Toast · 全局提示（Premium Glassmorphism + Minimalism）
 * glassmorphism 通知，右侧滑入动画，更精致的定位
 */
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import { useUiStore, type ToastType } from '@/stores/uiStore';

const ICONS: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

const COLORS: Record<ToastType, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-primary',
  warning: 'text-warning',
};

const BG_BORDERS: Record<ToastType, string> = {
  success: 'border-success/20',
  error: 'border-error/20',
  info: 'border-primary/20',
  warning: 'border-warning/20',
};

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const hideToast = useUiStore((s) => s.hideToast);

  return (
    <div className="pointer-events-none absolute right-3 top-[calc(var(--safe-top)+8px)] z-toast flex w-full max-w-sm flex-col gap-2.5">
      {toasts.map((t, i) => {
        const Icon = ICONS[t.type];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => hideToast(t.id)}
            style={{ animationDelay: `${i * 0.06}s` }}
            className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-glass-bg px-4 py-3.5 shadow-glass-lg backdrop-blur-[16px] transition-all duration-slow ease-spring hover:scale-[1.02] hover:shadow-glass-lg active:scale-[0.98] animate-slide-in-right ${BG_BORDERS[t.type]}`}
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${COLORS[t.type]}`} aria-hidden />
            <span className="flex-1 text-left text-text-secondary text-body leading-snug">
              {t.message}
            </span>
          </button>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
}
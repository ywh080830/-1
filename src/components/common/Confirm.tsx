/**
 * Confirm · 操作确认弹窗（对标主流记账 App：随手记/鲨鱼记账）
 * - 手机端底部弹起、桌面端居中
 * - danger / info 双主题，图标 + 文案 + 双按钮
 * - 玻璃拟态 + spring 进出动画 + 遮罩点击/Esc 关闭
 */
import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';

type ConfirmTone = 'danger' | 'info' | 'success';

interface ConfirmProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  /** 确认时触发 loading（如异步删除），期间禁用 */
  loading?: boolean;
}

const TONE_STYLE: Record<ConfirmTone, { bar: string; iconWrap: string; iconColor: string; btn: string }> = {
  danger: {
    bar: 'from-error/25 via-error/5 to-transparent',
    iconWrap: 'from-error/20 to-error/5',
    iconColor: 'text-error',
    btn: 'bg-error text-white shadow-[0_2px_12px_rgba(239,68,68,0.3)] hover:opacity-90',
  },
  info: {
    bar: 'from-primary/25 via-primary/5 to-transparent',
    iconWrap: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
    btn: 'bg-primary text-white shadow-[0_2px_12px_rgba(79,70,229,0.3)]',
  },
  success: {
    bar: 'from-secondary/25 via-secondary/5 to-transparent',
    iconWrap: 'from-secondary/20 to-secondary/5',
    iconColor: 'text-secondary',
    btn: 'bg-secondary text-white shadow-[0_2px_12px_rgba(13,148,136,0.3)]',
  },
};

export function Confirm({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  tone = 'danger',
  icon,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!mounted) return null;

  const toneSt = TONE_STYLE[tone];

  return (
    <div
      className={`fixed inset-0 z-modal flex items-end justify-center sm:items-center transition-all duration-slow ease-out ${
        visible ? 'bg-black/45 backdrop-blur-[3px]' : 'bg-transparent backdrop-blur-none'
      }`}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-t-3xl border border-glass-border bg-glass-bg p-5 pb-6 shadow-glass-lg backdrop-blur-[20px] transition-all duration-slow ease-spring sm:rounded-3xl ${
          visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-6 opacity-0 scale-[0.98] sm:translate-y-0 sm:scale-[0.95]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部渐变装饰条 */}
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b ${toneSt.bar}`} />

        {/* 关闭（桌面端小关闭钮） */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="关闭"
          className="touch-target absolute right-2 top-2 hidden rounded-lg p-1.5 text-muted transition-colors duration-fast hover:bg-white/60 hover:text-text sm:block"
        >
          <X size={16} aria-hidden />
        </button>

        <div className="relative flex flex-col items-center gap-4 pt-2 text-center">
          {/* 图标 */}
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${toneSt.iconWrap}`}>
            {icon ?? (tone === 'danger' ? (
              <TriangleAlert size={30} className={toneSt.iconColor} aria-hidden />
            ) : (
              <CheckCircle2 size={30} className={toneSt.iconColor} aria-hidden />
            ))}
          </div>

          {/* 文案 */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-h3 font-semibold text-text">{title}</h3>
            {description && (
              <p className="mx-auto max-w-[280px] text-caption leading-relaxed text-muted">{description}</p>
            )}
          </div>
        </div>

        {/* 按钮 */}
        <div className="relative mt-6 grid grid-cols-[1fr_1.4fr] gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[48px] cursor-pointer rounded-xl border border-glass-border bg-glass-bg text-text-secondary backdrop-blur-[8px] transition-all duration-fast hover:bg-white/70 hover:text-text active:scale-[0.97] disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-[48px] cursor-pointer rounded-xl font-medium transition-all duration-fast active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 ${toneSt.btn}`}
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="处理中" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Confirm;
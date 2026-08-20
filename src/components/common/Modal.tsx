/**
 * Modal · 弹窗（Premium Glassmorphism + Minimalism）
 * glassmorphism 模态框，背景模糊，spring 进出动画
 */
import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-modal flex items-end justify-center sm:items-center transition-all duration-slow ease-out
        ${visible ? 'bg-black/40 backdrop-blur-[2px]' : 'bg-transparent backdrop-blur-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border border-glass-border bg-glass-bg p-5 shadow-glass-lg backdrop-blur-[16px] transition-all duration-slow ease-spring sm:rounded-2xl
          ${visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-[0.97] sm:translate-y-0 sm:scale-[0.95]'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          {title ? (
            <h2 className="text-h3 text-text">{title}</h2>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="touch-target -mr-2 rounded-lg text-muted transition-all duration-base hover:bg-white/60 hover:text-text hover:backdrop-blur-[8px]"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto text-text-secondary">
          {children}
        </div>
        {footer && (
          <div className="mt-5 flex justify-end gap-2 border-t border-glass-border pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
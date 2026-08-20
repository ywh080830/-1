/**
 * ActionSheet · 底部操作面板（对标主流记账 App：长按/更多操作弹底部菜单）
 * - 手机端底部滑出，桌面端居中
 * - 选项列表：图标 + 主文案 + 可选子文案 + 危险色高亮
 * - 玻璃拟态 + spring 进出动画 + 遮罩/Esc 关闭
 */
import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface SheetAction {
  key: string;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  /** 危险操作（删除等）红色样式 */
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
  /** 底部取消按钮文字（默认“取消”） */
  cancelText?: string;
}

export function ActionSheet({ open, onClose, title, actions, cancelText = '取消' }: ActionSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 260);
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
      className={`fixed inset-0 z-modal flex items-end justify-center transition-all duration-slow ease-out ${
        visible ? 'bg-black/45 backdrop-blur-[3px]' : 'bg-transparent backdrop-blur-none'
      }`}
      role="menu"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-t-3xl border border-glass-border bg-glass-bg shadow-glass-lg backdrop-blur-[24px] transition-all duration-slow ease-spring ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部把手 */}
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-border/60" aria-hidden />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 pt-3">
            <h3 className="text-h3 font-semibold text-text">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="touch-target rounded-lg p-1.5 text-muted transition-colors duration-fast hover:bg-white/60 hover:text-text"
            >
              <X size={17} aria-hidden />
            </button>
          </div>
        )}

        {/* 选项列表 */}
        <div className="px-3 py-3">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              role="menuitem"
              disabled={a.disabled}
              onClick={a.onClick}
              className={`group flex w-full cursor-pointer items-center gap-3.5 rounded-xl px-3 py-3.5 text-left transition-all duration-fast active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                a.danger
                  ? 'hover:bg-error/10'
                  : 'hover:bg-white/60 hover:backdrop-blur-[8px] hover:shadow-glass'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-fast group-hover:scale-105 ${
                  a.danger ? 'bg-error/10 text-error' : 'bg-glass-bg text-primary backdrop-blur-[4px]'
                }`}
              >
                {a.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={`text-body font-medium ${a.danger ? 'text-error' : 'text-text-secondary group-hover:text-text'}`}
                >
                  {a.label}
                </span>
                {a.sublabel && <span className="text-overline text-muted">{a.sublabel}</span>}
              </span>
            </button>
          ))}
        </div>

        {/* 取消 */}
        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full cursor-pointer rounded-xl bg-glass-bg text-body font-medium text-text-secondary backdrop-blur-[8px] transition-all duration-fast hover:bg-white/70 active:scale-[0.98]"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionSheet;
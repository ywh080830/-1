/**
 * FAB · 记一笔 悬浮按钮（移动端与桌面均展示）
 * Premium Glassmorphism + Minimalism 风格
 * 渐变背景 + 脉冲阴影动画
 */
import { Link } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';

export function FAB() {
  return (
    <Link
      to="/record"
      aria-label="记一笔"
      className="absolute bottom-[calc(var(--bottom-tab-height)+var(--safe-bottom)+12px)] right-4 z-fab hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-deep)] text-white shadow-[0_4px_20px_rgba(124,92,252,0.45)] transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:shadow-[0_6px_28px_rgba(124,92,252,0.6)] hover:scale-110 active:scale-90 animate-[pulse-shadow_2s_ease-in-out_infinite] min-[600px]:flex"
    >
      <ReceiptText size={26} aria-hidden />
    </Link>
  );
}
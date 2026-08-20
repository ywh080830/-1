/**
 * CategoryIcon · 分类图标（Glassmorphism 图标容器 + 渐变背景）
 */
import { getIcon } from '@/lib/icons';

interface CategoryIconProps {
  name: string | null | undefined;
  color?: string | null;
  size?: number;
  selected?: boolean;
}

export function CategoryIcon({ name, color, size = 24, selected }: CategoryIconProps) {
  const Icon = getIcon(name);
  const bgColor = color ?? 'var(--color-primary)';
  return (
    <span
      className={`relative flex items-center justify-center rounded-2xl transition-all duration-300 ${
        selected ? 'scale-110 shadow-lg' : 'group-hover:scale-105'
      }`}
      style={{
        width: size + 20,
        height: size + 20,
        background: selected
          ? `linear-gradient(135deg, ${bgColor}30, ${bgColor}10)`
          : `linear-gradient(135deg, ${bgColor}20, ${bgColor}08)`,
        color: bgColor,
        boxShadow: selected
          ? `0 0 0 2px ${bgColor}80, 0 4px 12px ${bgColor}30`
          : 'none',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <Icon size={size} aria-hidden />
    </span>
  );
}
/**
 * CategoryGrid · 5 列分类栅格（Glassmorphism 网格）
 */
import { CategoryIcon } from './CategoryIcon';
import type { Category } from '@/types/models';

interface CategoryGridProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (c: Category) => void;
}

export function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c)}
          className={`group flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl p-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
            selectedId === c.id
              ? 'glass-sm ring-2 ring-primary/60 shadow-lg shadow-primary/10'
              : 'glass-sm hover:bg-white/20 hover:shadow-md'
          }`}
          aria-pressed={selectedId === c.id}
        >
          <CategoryIcon name={c.icon} color={c.color} selected={selectedId === c.id} />
          <span
            className={`w-full truncate text-center text-caption font-medium transition-colors duration-200 ${
              selectedId === c.id ? 'text-primary' : 'text-text-secondary group-hover:text-text'
            }`}
          >
            {c.name}
          </span>
        </button>
      ))}
    </div>
  );
}
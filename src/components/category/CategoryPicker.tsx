/**
 * CategoryPicker · 分类选择器（Glassmorphism 联动选择）
 */
import { useMemo, useState } from 'react';
import { CategoryGrid } from './CategoryGrid';
import { Empty } from '@/components/common/Empty';
import { ChevronLeft } from 'lucide-react';
import type { Category } from '@/types/models';

interface CategoryPickerProps {
  categories: Category[];
  kind: 'income' | 'expense';
  selectedId: string | null;
  onSelect: (c: Category) => void;
}

export function CategoryPicker({ categories, kind, selectedId, onSelect }: CategoryPickerProps) {
  const roots = useMemo(
    () => categories.filter((c) => c.kind === kind && !c.parentId).sort((a, b) => a.sort - b.sort),
    [categories, kind],
  );
  const [parentId, setParentId] = useState<string | null>(null);

  const selectedRoot = roots.find((r) => r.id === (parentId ?? selectedId));
  const children = useMemo(
    () => categories.filter((c) => c.parentId === (parentId ?? selectedRoot?.id ?? selectedId)).sort((a, b) => a.sort - b.sort),
    [categories, parentId, selectedRoot, selectedId],
  );

  // 当前层级显示：未进入二级时显示一级；选中一级后显示其二级
  const showRoots = !children.length || !parentId;

  return (
    <div className="flex flex-col gap-4">
      {showRoots ? (
        roots.length ? (
          <CategoryGrid
            categories={roots}
            selectedId={selectedId}
            onSelect={(c) => {
              const hasChildren = categories.some((x) => x.parentId === c.id);
              if (hasChildren) {
                setParentId(c.id);
              } else {
                onSelect(c);
              }
            }}
          />
        ) : (
          <Empty title="暂无分类" />
        )
      ) : (
        <>
          <button
            type="button"
            onClick={() => setParentId(null)}
            className="group glass-sm self-start flex items-center gap-1.5 rounded-xl px-4 py-2 text-caption font-medium text-text-secondary transition-all duration-300 hover:scale-105 hover:text-primary active:scale-95"
          >
            <ChevronLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            {selectedRoot?.name ?? '返回'}
          </button>
          <CategoryGrid categories={children} selectedId={selectedId} onSelect={onSelect} />
        </>
      )}
    </div>
  );
}
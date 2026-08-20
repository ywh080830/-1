/**
 * TagChips · 标签展示
 */
import { X } from 'lucide-react';

interface TagChipsProps {
  tags?: string[];
  onRemove?: (tag: string) => void;
}

export function TagChips({ tags = [], onRemove }: TagChipsProps) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-caption text-text-secondary">
          {tag}
          {onRemove && (
            <button type="button" onClick={() => onRemove(tag)} aria-label={`移除标签 ${tag}`} className="text-muted hover:text-error">
              <X size={12} aria-hidden />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

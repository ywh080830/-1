/**
 * LedgerSwitcher · 账本切换器（Glassmorphism 下拉菜单）
 */
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { LedgerRow } from '@/types/database';

interface LedgerSwitcherProps {
  ledgers: LedgerRow[];
  currentId: string | null;
  onSelect: (id: string) => void;
}

export function LedgerSwitcher({ ledgers, currentId, onSelect }: LedgerSwitcherProps) {
  const [open, setOpen] = useState(false);
  const current = ledgers.find((l) => l.id === currentId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="glass-sm flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-body font-medium text-text transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-95"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="max-w-[160px] truncate">{current?.name ?? '选择账本'}</span>
        <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="glass absolute left-0 top-full z-modal mt-2 w-56 overflow-hidden rounded-2xl shadow-xl shadow-black/10 animate-fade-in" role="listbox">
          {ledgers.map((l) => (
            <button
              key={l.id}
              type="button"
              role="option"
              aria-selected={l.id === currentId}
              onClick={() => {
                onSelect(l.id);
                setOpen(false);
              }}
              className={`flex min-h-[44px] w-full items-center gap-2 px-4 text-body transition-all duration-200 hover:bg-white/20 ${
                l.id === currentId ? 'text-primary font-medium' : 'text-text'
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{l.name}</span>
              {l.is_archived && <span className="text-caption text-muted">已归档</span>}
              {l.id === currentId && <Check size={16} className="text-primary shrink-0" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
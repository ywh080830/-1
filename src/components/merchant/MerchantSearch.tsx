/**
 * MerchantSearch · 商户搜索框（Glassmorphism 搜索栏）
 */
import { Search } from 'lucide-react';

interface MerchantSearchProps {
  q: string;
  onChange: (q: string) => void;
}

export function MerchantSearch({ q, onChange }: MerchantSearchProps) {
  return (
    <div className="glass-sm flex items-center gap-3 rounded-2xl px-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-lg focus-within:shadow-primary/10">
      <Search size={18} className="text-muted/60 shrink-0" aria-hidden />
      <input
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索商户名称"
        className="min-h-[48px] w-full bg-transparent text-body text-text outline-none placeholder:text-muted/50"
        aria-label="搜索商户"
      />
    </div>
  );
}
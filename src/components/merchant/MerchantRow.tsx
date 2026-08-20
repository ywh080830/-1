/**
 * MerchantRow · 商户行（Glassmorphism 行 + 渐变图标）
 */
import { Store } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { LearnedBadge } from '@/components/ocr/LearnedBadge';
import type { Merchant } from '@/types/models';

interface MerchantRowProps {
  merchant: Merchant;
  onClick?: (m: Merchant) => void;
}

export function MerchantRow({ merchant, onClick }: MerchantRowProps) {
  const sourceLabel = merchant.ownerId ? (merchant.id.startsWith('loc_') ? '本地' : '个人') : '公共';
  return (
    <button
      type="button"
      onClick={() => onClick?.(merchant)}
      className="glass-sm flex min-h-[60px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.98]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
        <Store size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-medium text-text">{merchant.name}</span>
          {merchant.learned && <LearnedBadge />}
        </div>
        <div className="text-caption text-muted/70">
          {merchant.id} · {sourceLabel} · 命中 {merchant.hitCount} 次
        </div>
      </div>
    </button>
  );
}
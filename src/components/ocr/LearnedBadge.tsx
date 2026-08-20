/**
 * LearnedBadge · 「已学习」徽标（Glassmorphism 徽标）
 */
import { Badge } from '@/components/common/Badge';
import { GraduationCap } from 'lucide-react';

export function LearnedBadge() {
  return (
    <Badge tone="success" label="该商户已自动学习归类" className="glass-sm !rounded-xl !px-2.5 !py-1">
      <GraduationCap size={11} aria-hidden /> 已学习
    </Badge>
  );
}
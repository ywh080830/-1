/**
 * PlanCard · 会员套餐卡（Glassmorphism 高级定价卡 + 渐变强调）
 */
import { Check } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import type { MembershipPlanRow } from '@/types/database';

interface PlanCardProps {
  plan: MembershipPlanRow;
  selected: boolean;
  onSelect: () => void;
  isCurrent?: boolean;
}

export function PlanCard({ plan, selected, onSelect, isCurrent }: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
        selected
          ? 'glass-sm ring-2 ring-primary/60 shadow-xl shadow-primary/20'
          : 'glass-sm hover:shadow-lg hover:ring-1 hover:ring-white/20'
      }`}
      aria-pressed={selected}
    >
      {/* 选中态渐变装饰条 */}
      {selected && (
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-cta" />
      )}

      <div className="flex items-center justify-between">
        <span className="text-h3 font-bold text-text">{plan.name}</span>
        {isCurrent && <Badge tone="member">当前</Badge>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="num font-display text-h1 font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
          ¥{plan.price.toFixed(2)}
        </span>
      </div>
      <div className="text-caption font-medium text-muted/70">
        {plan.period === 'month' ? '每月' : plan.period === 'quarter' ? '每季度' : plan.period === 'year' ? '每年' : '终身'}
      </div>
      {selected && (
        <ul className="mt-1 flex flex-col gap-1.5">
          {(plan.benefits ?? []).slice(0, 6).map((b) => (
            <li key={b} className="flex items-center gap-2 text-caption text-text-secondary">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                <Check size={12} className="text-success" aria-hidden />
              </span>
              {benefitLabel(b)}
            </li>
          ))}
          {(plan.benefits ?? []).length > 6 && (
            <li className="text-caption text-muted/60">…共 {(plan.benefits ?? []).length} 项权益</li>
          )}
        </ul>
      )}
    </button>
  );
}

const BENEFIT_LABELS: Record<string, string> = {
  unlimited_ledger: '无限账本',
  category_budget: '分类预算',
  shared_members: '共享成员扩容',
  advanced_stats: '高级统计',
  pdf_report: 'PDF 报告',
  bill_attachment: '账单图片附件',
  period_automation: '无限周期记账',
  voice_input: '语音记账',
  ocr_advanced: 'OCR 批量/离线',
  cloud_expand: '云空间扩容',
  data_recovery: '误删恢复',
  no_ads: '永久无广告',
  custom_theme: '专属主题',
  priority_support: '优先客服',
};

export function benefitLabel(key: string): string {
  return BENEFIT_LABELS[key] ?? key;
}
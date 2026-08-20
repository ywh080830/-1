/**
 * BenefitTable · 权益对照表（Glassmorphism 表格）
 */
import { Check, Minus } from 'lucide-react';

interface BenefitRow {
  label: string;
  free: boolean;
  member: boolean;
}

const ROWS: BenefitRow[] = [
  { label: '快速记账 / 转账', free: true, member: true },
  { label: '分类 / 账户 / 基础预算', free: true, member: true },
  { label: '基础统计（环形/趋势/日历）', free: true, member: true },
  { label: '云同步（≤200 条/批）', free: true, member: true },
  { label: 'OCR 基础识别', free: true, member: true },
  { label: 'Excel / CSV 导出', free: true, member: true },
  { label: '永久无广告', free: true, member: true },
  { label: '无限账本', free: false, member: true },
  { label: '分类预算', free: false, member: true },
  { label: '共享成员', free: false, member: true },
  { label: '高级统计 / PDF 报告', free: false, member: true },
  { label: 'OCR 批量 / 离线', free: false, member: true },
  { label: '专属主题 / 优先客服', free: false, member: true },
];

export function BenefitTable() {
  return (
    <div className="glass-sm overflow-hidden rounded-2xl shadow-lg">
      <div className="grid grid-cols-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-overline font-semibold uppercase tracking-wider">
        <div className="px-4 py-3 text-text">功能</div>
        <div className="px-4 py-3 text-center text-text">免费版</div>
        <div className="px-4 py-3 text-center text-primary">会员</div>
      </div>
      {ROWS.map((row, i) => (
        <div
          key={row.label}
          className={`grid grid-cols-3 border-t border-white/10 transition-colors duration-200 hover:bg-white/5 ${
            i % 2 === 0 ? 'bg-white/5' : ''
          }`}
        >
          <div className="px-4 py-2.5 text-caption font-medium text-text">{row.label}</div>
          <div className="flex items-center justify-center px-4 py-2.5">
            {row.free ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
                <Check size={14} className="text-success" />
              </span>
            ) : (
              <Minus size={16} className="text-muted/40" />
            )}
          </div>
          <div className="flex items-center justify-center px-4 py-2.5">
            {row.member ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Check size={14} className="text-primary" />
              </span>
            ) : (
              <Minus size={16} className="text-muted/40" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
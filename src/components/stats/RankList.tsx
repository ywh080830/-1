/**
 * RankList · 分类支出排行（Glassmorphism 行 + 高级排名指示器）
 */
import { Award, Medal, Trophy } from 'lucide-react';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import type { StatsSummary } from '@/types/api';

interface RankListProps {
  data: StatsSummary['by_category'];
}

const MEDAL_ICONS = [Trophy, Medal, Award];
const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'];

export function RankList({ data }: RankListProps) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="glass p-4">
      <h3 className="card-title mb-3">支出排行</h3>
      <div className="flex flex-col gap-2">
        {data.map((d, idx) => {
          const ratio = total > 0 ? (d.amount / total) * 100 : 0;
          const isTop3 = idx < 3;
          const MedalIcon = isTop3 ? MEDAL_ICONS[idx] : null;
          const medalColor = isTop3 ? MEDAL_COLORS[idx] : undefined;

          return (
            <div
              key={d.category_id ?? idx}
              className="glass-sm flex items-center gap-3 px-3 py-2.5 transition-all duration-fast hover:shadow-glass active:scale-[0.99]"
            >
              {/* 排名徽章 */}
              <div className="flex w-6 items-center justify-center">
                {isTop3 && MedalIcon ? (
                  <MedalIcon size={18} color={medalColor} aria-label={`第${idx + 1}名`} />
                ) : (
                  <span className="text-caption font-semibold text-muted">{idx + 1}</span>
                )}
              </div>

              <CategoryIcon name={d.icon} color={d.color} size={18} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-body font-semibold text-[var(--color-text)]">{d.category_name ?? '未分类'}</span>
                  <span className="num text-body font-semibold">¥{d.amount.toFixed(2)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div
                    className="h-full rounded-full transition-all duration-slow"
                    style={{
                      width: `${Math.min(100, ratio)}%`,
                      backgroundColor: d.color ?? 'var(--color-primary)',
                      boxShadow: isTop3 ? `0 0 6px ${d.color ?? 'var(--color-primary)'}` : 'none',
                    }}
                  />
                </div>
              </div>

              {/* 百分比标签 */}
              <span className="num text-caption font-medium text-muted">{ratio.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
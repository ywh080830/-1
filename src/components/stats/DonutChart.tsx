/**
 * DonutChart · 支出分类环形图（Glassmorphism 容器 + 高级图例）
 */
import ReactECharts from 'echarts-for-react';
import type { StatsSummary } from '@/types/api';

interface DonutChartProps {
  data: StatsSummary['by_category'];
  height?: number;
}

export function DonutChart({ data, height = 260 }: DonutChartProps) {
  const option = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: 'var(--glass-bg)',
      borderColor: 'var(--glass-border)',
      borderWidth: 1,
      backdropFilter: 'blur(12px)',
      textStyle: { color: 'var(--color-text)', fontSize: 13 },
      extraCssText: 'border-radius: 12px; box-shadow: var(--shadow-pop); backdrop-filter: blur(12px);',
    },
    legend: {
      type: 'scroll' as const,
      orient: 'vertical' as const,
      right: 0,
      top: 'center',
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 10,
      textStyle: { fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 },
      formatter: (name: string) => {
        const item = data.find((d) => d.category_name === name);
        return item ? `${name}  ${(Number(item.ratio ?? 0) * 100).toFixed(1)}%` : name;
      },
    },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['44%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--color-bg)',
          borderWidth: 3,
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 2,
          shadowColor: 'rgba(0,0,0,0.1)',
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' as const, formatter: '{b}\n¥{c}' },
          itemStyle: { shadowBlur: 12, shadowOffsetX: 0, shadowOffsetY: 4, shadowColor: 'rgba(0,0,0,0.15)' },
        },
        data: data.map((d) => ({
          name: d.category_name ?? '未分类',
          value: d.amount,
          itemStyle: { color: d.color ?? 'var(--color-muted)' },
        })),
      },
    ],
  };

  return (
    <div className="glass p-4">
      <h3 className="card-title mb-3">支出分类</h3>
      <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
    </div>
  );
}
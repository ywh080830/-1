/**
 * TrendChart · 收支趋势折线（Glassmorphism 容器 + 高级轴样式）
 */
import ReactECharts from 'echarts-for-react';
import type { TrendPoint } from '@/types/api';

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export function TrendChart({ data, height = 280 }: TrendChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'var(--glass-bg)',
      borderColor: 'var(--glass-border)',
      borderWidth: 1,
      textStyle: { color: 'var(--color-text)', fontSize: 13 },
      extraCssText: 'border-radius: 12px; box-shadow: var(--shadow-pop); backdrop-filter: blur(12px);',
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 },
    },
    grid: { left: 12, right: 12, top: 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: data.map((d) => d.month),
      axisLine: { lineStyle: { color: 'var(--color-border)', width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: 'var(--color-muted)', fontSize: 11, fontWeight: 500 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      splitLine: {
        lineStyle: { color: 'var(--color-border)', type: 'dashed' as const, opacity: 0.5 },
      },
      axisLabel: { color: 'var(--color-muted)', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 8,
        showSymbol: true,
        data: data.map((d) => d.income),
        itemStyle: { color: 'var(--color-income)' },
        lineStyle: { width: 2.5, color: 'var(--color-income)' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
            ],
          },
        },
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 8,
        showSymbol: true,
        data: data.map((d) => d.expense),
        itemStyle: { color: 'var(--color-expense)' },
        lineStyle: { width: 2.5, color: 'var(--color-expense)' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="glass p-4">
      <h3 className="card-title mb-3">收支趋势</h3>
      <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
    </div>
  );
}
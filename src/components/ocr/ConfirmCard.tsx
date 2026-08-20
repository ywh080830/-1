/**
 * ConfirmCard · OCR 确认卡片（Glassmorphism 可编辑字段 + 渐变确认按钮）
 */
import { Check, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ConfidenceField } from './ConfidenceField';
import { LearnedBadge } from './LearnedBadge';
import type { OcrResponse } from '@/types/api';

interface ConfirmCardProps {
  data: OcrResponse;
  saving: boolean;
  onConfirm: () => void;
}

export function ConfirmCard({ data, saving, onConfirm }: ConfirmCardProps) {
  const r = data.result;
  const lowAmount = r.amount === null || Number(r.amount) <= 0;

  return (
    <div className="flex flex-col gap-4">
      {r.merchant && r.merchant_id?.startsWith('loc_') && <LearnedBadge />}
      <ConfidenceField label="商户" value={r.merchant ?? ''} confidence={0.9} />
      <ConfidenceField label="金额" value={r.amount ?? ''} confidence={lowAmount ? 0.4 : 0.97} />
      <ConfidenceField label="日期" value={r.date ?? ''} confidence={0.95} />
      <ConfidenceField label="发票号" value={r.invoice_no ?? ''} confidence={0.6} />
      {r.items.length > 0 && (
        <div className="glass-sm rounded-2xl p-4">
          <div className="mb-2 text-caption font-medium text-muted/70">明细</div>
          {r.items.map((it, i) => (
            <div key={i} className="flex justify-between py-1 text-body text-text">
              <span>{it.name} × {it.qty}</span>
              <span className="num font-medium">¥{it.price}</span>
            </div>
          ))}
        </div>
      )}
      {data.suggest.by === 'merchant' && (
        <p className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-caption font-medium text-success">
          <Check size={14} className="shrink-0" />
          已匹配商户默认分类（置信度 {(data.suggest.confidence * 100).toFixed(0)}%）
        </p>
      )}
      {data.suggest.by === 'ner' && (
        <p className="flex items-center gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-caption font-medium text-warning">
          <TriangleAlert size={14} className="shrink-0" />
          分类为规则推断，请核对
        </p>
      )}
      <Button variant="cta" block size="lg" loading={saving} onClick={onConfirm}>
        确认入账
      </Button>
    </div>
  );
}
/**
 * ConfidenceField · OCR 置信字段（Glassmorphism 字段 + 低置信标黄）
 */
interface ConfidenceFieldProps {
  label: string;
  value: string;
  confidence?: number | null;
  editable?: boolean;
  onChange?: (v: string) => void;
}

export function ConfidenceField({ label, value, confidence, editable, onChange }: ConfidenceFieldProps) {
  const low = confidence !== undefined && confidence !== null && confidence < 0.7;
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
        low
          ? 'glass-sm ring-2 ring-warning/50 shadow-lg shadow-warning/10'
          : 'glass-sm hover:shadow-md'
      }`}
    >
      <span className="w-16 shrink-0 text-caption font-medium text-muted/70">{label}</span>
      {editable ? (
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="min-h-[36px] w-full bg-transparent text-body text-text outline-none"
        />
      ) : (
        <span className={`flex-1 text-body ${low ? 'font-medium text-warning' : 'text-text'}`}>{value || '—'}</span>
      )}
      {confidence !== undefined && confidence !== null && (
        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-overline font-medium ${
          low ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
        }`}>
          {low ? '需核对' : `${(confidence * 100).toFixed(0)}%`}
        </span>
      )}
    </label>
  );
}
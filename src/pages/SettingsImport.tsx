/**
 * SettingsImport · CSV 导入（钱迹/随手记/鲨鱼映射）
 */
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { useUiStore } from '@/stores/uiStore';

interface Preset {
  key: string;
  label: string;
}

const PRESETS: Preset[] = [
  { key: 'qianji', label: '钱迹' },
  { key: 'suishouji', label: '随手记' },
  { key: 'shayu', label: '鲨鱼记账' },
];

// 与 Edge import-csv PRESETS 对齐的映射
const MAPPINGS: Record<string, Record<string, string>> = {
  qianji: { date: '日期', type: '类型', amount: '金额', category: '分类', account: '账户', note: '备注', merchant: '商家' },
  suishouji: { date: '日期', type: '收支', amount: '金额', category: '分类', account: '账户', note: '备注', merchant: '商家' },
  shayu: { date: '时间', type: '类型', amount: '金额', category: '分类', account: '账户', note: '备注', merchant: '商户' },
};

export default function SettingsImport() {
  const { current } = useLedger();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preset, setPreset] = useState('qianji');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const onFile = async (file: File) => {
    if (!current) return;
    setImporting(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('ledger_id', current.id);
      form.append('mapping', JSON.stringify(MAPPINGS[preset]));
      const res = await api.importCsv(form);
      setResult({ success: res.success, failed: res.failed, errors: res.errors });
      useUiStore.getState().showToast('success', `导入完成：成功 ${res.success} 条`);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="CSV 导入" />

      <section className="glass card-gradient mb-4 p-5 transition-transform duration-fast hover:translate-y-[-1px]">
        <h2 className="mb-3 text-h3">选择数据来源</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              className={`min-h-[36px] rounded-full px-4 text-caption transition-all duration-fast hover:scale-105 ${
                preset === p.key ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-text-secondary hover:bg-primary/15'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-caption text-muted">将自动按模板映射字段（日期/类型/金额/分类/账户/备注/商户）</p>
      </section>

      <section className="glass-sm p-5">
        <Button block loading={importing} onClick={() => fileRef.current?.click()} icon={<Upload size={18} aria-hidden />}>
          选择 CSV 文件
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
      </section>

      {result && (
        <section className="glass mt-4 p-5">
          <h2 className="mb-3 text-h3">导入结果</h2>
          <p className="text-body">
            成功 <span className="font-bold text-success">{result.success}</span> 条 · 失败{' '}
            <span className="font-bold text-error">{result.failed}</span> 条
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 max-h-40 list-inside list-disc space-y-0.5 overflow-y-auto text-caption text-error">
              {result.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
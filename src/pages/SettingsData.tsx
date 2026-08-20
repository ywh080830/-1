/**
 * SettingsData · 数据管理（导出 / 备份信息 / 注销）
 */
import { useState } from 'react';
import { Cloud, FileDown, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { useLedger } from '@/hooks/useLedger';
import { exportLedger, currentMonthRange } from '@/lib/export';
import { useUiStore } from '@/stores/uiStore';

export default function SettingsData() {
  const { current } = useLedger();
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const range = currentMonthRange();

  const doExport = async () => {
    if (!current) return;
    setExporting(true);
    try {
      const res = await exportLedger({ ledgerId: current.id, start: range.start, end: range.end, format });
      useUiStore.getState().showToast('success', `已导出 ${res.count} 条记录`);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="数据管理" />

      <section className="glass card-gradient mb-4 p-5 transition-transform duration-fast hover:translate-y-[-1px]">
        <h2 className="mb-3 flex items-center gap-2 text-h3">
          <FileDown size={18} className="text-primary" aria-hidden /> 导出数据
        </h2>
        <p className="mb-4 text-caption text-muted">
          导出 {range.start} 至 {range.end} 的流水（免费，数据与系统 100% 一致）
        </p>
        <div className="mb-4 flex gap-2">
          {(['xlsx', 'csv'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`min-h-[36px] rounded-full px-4 text-caption transition-all duration-fast hover:scale-105 ${
                format === f ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-text-secondary hover:bg-primary/15'
              }`}
            >
              {f === 'xlsx' ? 'Excel (.xlsx)' : 'CSV'}
            </button>
          ))}
        </div>
        <Button block loading={exporting} onClick={doExport} variant="primary">
          导出并下载
        </Button>
      </section>

      <section className="glass-sm mb-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-h3">
          <Cloud size={18} className="text-secondary" aria-hidden /> 云端存储
        </h2>
        <p className="text-caption leading-relaxed text-text-secondary">
          你的云端数据加密存储于符合行业安全标准的云端环境，传输全程 TLS 加密，
          并按最小权限原则访问保护。详见《隐私政策》。
        </p>
      </section>

      <section className="glass-sm mb-4 p-5">
        <h2 className="mb-3 text-h3">备份说明</h2>
        <ul className="list-inside list-disc space-y-1.5 text-caption text-muted">
          <li>数据实时云端同步，换设备登录同一账号即可恢复</li>
          <li>离线数据保存在本地浏览器 IndexedDB，联网自动合并</li>
          <li>回收站中的软删除数据可随时恢复</li>
        </ul>
      </section>

      <section className="glass card-gradient p-5">
        <h2 className="mb-3 flex items-center gap-2 text-h3 text-error">
          <Trash2 size={18} aria-hidden /> 注销账户
        </h2>
        <p className="mb-4 text-caption text-muted">注销将删除全部云端数据且不可恢复，请先导出备份。</p>
        <Button variant="danger" onClick={() => useUiStore.getState().showToast('warning', '注销功能即将开放，请联系客服处理')}>
          申请注销
        </Button>
      </section>
    </div>
  );
}
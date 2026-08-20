/**
 * 导出触发 + 下载 · Edge export-excel
 * Excel/CSV 导出免费可用（红线：不进会员墙）
 */
import { api } from './api';

export interface ExportOptions {
  ledgerId: string;
  start?: string;
  end?: string;
  format: 'xlsx' | 'csv';
}

/** 触发导出并下载（生成签名 URL → 前端触发浏览器下载） */
export async function exportLedger(opts: ExportOptions): Promise<{ filename: string; count: number }> {
  const res = await api.exportExcel({
    ledger_id: opts.ledgerId,
    start: opts.start,
    end: opts.end,
    format: opts.format,
  });
  if (res.url) {
    const a = document.createElement('a');
    a.href = res.url;
    a.download = res.filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  return { filename: res.filename, count: res.count };
}

/** 本月默认区间 */
export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const days = new Date(y, now.getMonth() + 1, 0).getDate();
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(days).padStart(2, '0')}` };
}

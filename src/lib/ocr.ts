/**
 * OCR 前端流程 · 06-系统设计 §3 / sequence-diagram 场景C
 * 上传 → 识别（Edge ocr-recognize）→ 轮询 job → confirm（RPC ocr_confirm）
 */
import { api } from './api';
import type { OcrResponse } from '@/types/api';

/** 上传图片识别（multipart） */
export async function recognizeImage(file: File, ledgerId: string, docType = 'receipt'): Promise<OcrResponse> {
  const form = new FormData();
  form.append('image', file);
  form.append('ledger_id', ledgerId);
  form.append('doc_type', docType);
  return api.recognize(form);
}

/** 批量识别（多张顺序处理，返回结果数组） */
export async function recognizeBatch(files: File[], ledgerId: string): Promise<OcrResponse[]> {
  const results: OcrResponse[] = [];
  for (const file of files) {
    results.push(await recognizeImage(file, ledgerId, 'receipt'));
  }
  return results;
}

/** 确认入账（写交易 + 可选加入商户库） */
export async function confirmJob(args: {
  job: string;
  ledger: string;
  category: string;
  account: string;
  amount: string;
  merchant: string | null;
  happenedAt: string;
  note: string | null;
  addToLibrary: boolean;
}) {
  return api.ocrConfirm({
    job: args.job,
    ledger: args.ledger,
    category: args.category,
    account: args.account,
    amount: Number(args.amount),
    merchant: args.merchant,
    happenedAt: args.happenedAt,
    note: args.note,
    addToLibrary: args.addToLibrary,
  });
}

/** OCR 限流提示（默认 20 次/分钟，取自 .env） */
export function getOcrLimit(): number {
  const raw = Number(import.meta.env.VITE_OCR_LIMIT ?? 20);
  return Number.isFinite(raw) && raw > 0 ? raw : 20;
}

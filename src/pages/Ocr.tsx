/**
 * Ocr · 拍照识别（上传 → 识别 → 跳确认页）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { ScanView } from '@/components/ocr/ScanView';
import { useLedger } from '@/hooks/useLedger';
import { recognizeImage } from '@/lib/ocr';
import { useUiStore } from '@/stores/uiStore';
import { getOcrLimit } from '@/lib/ocr';

export default function Ocr() {
  const navigate = useNavigate();
  const { current } = useLedger();
  const [scanning, setScanning] = useState(false);

  const onFile = async (file: File) => {
    if (!current) return;
    if (!/^image\//.test(file.type)) {
      useUiStore.getState().showToast('warning', '请选择图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      useUiStore.getState().showToast('warning', '图片过大（限 10MB）');
      return;
    }
    setScanning(true);
    try {
      const res = await recognizeImage(file, current.id);
      useUiStore.getState().showToast('success', '识别完成');
      navigate(`/ocr/confirm?job=${res.job_id}`);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '识别失败');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="拍照识别" subtitle={`基础 OCR 免费 · 每分钟限 ${getOcrLimit()} 次`} />

      {/* 扫描卡片 */}
      <div className="glass animate-[slideUp_0.35s_ease-out] p-5">
        <ScanView scanning={scanning} onFile={onFile} />
      </div>

      <p className="mt-4 text-center text-caption text-muted">识别结果可在确认页编辑，低置信度字段会标黄提示</p>
    </div>
  );
}
/**
 * ScanView · OCR 扫描视图（Glassmorphism 扫描区 + 渐变按钮）
 */
import { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';

interface ScanViewProps {
  scanning: boolean;
  onFile: (file: File) => void;
}

export function ScanView({ scanning, onFile }: ScanViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-5 py-8">
      {/* 扫描区 */}
      <div className="glass-sm relative flex h-64 w-full items-center justify-center overflow-hidden rounded-2xl shadow-lg">
        {scanning ? (
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-20 animate-scanline bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0" />
            <p className="flex h-full items-center justify-center text-caption font-medium text-muted">正在识别中…</p>
          </div>
        ) : (
          <p className="flex flex-col items-center gap-3 text-caption text-muted/70">
            <Camera size={44} className="text-muted/40" aria-hidden />
            <span className="font-medium">支持发票 / 小票 / 截图</span>
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={scanning}
          className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-cta to-orange-500 px-6 text-body font-medium text-white shadow-lg shadow-cta/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-cta/40 active:scale-95 disabled:is-disabled"
        >
          <Camera size={18} aria-hidden /> 拍照
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="glass-sm flex min-h-[48px] items-center gap-2 rounded-2xl px-6 text-body font-medium text-text transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 disabled:is-disabled"
        >
          <ImagePlus size={18} aria-hidden /> 从相册选择
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
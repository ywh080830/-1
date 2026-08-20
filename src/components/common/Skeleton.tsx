/**
 * Skeleton · 骨架屏（Premium Glassmorphism + Minimalism）
 * 更流畅的 shimmer 动画，柔和渐变
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-2/60 backdrop-blur-[2px] ${className}`}
      aria-hidden
    >
      {/* 更柔和的光泽扫描线 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerPremium 1.8s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes shimmerPremium {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function AppSkeleton() {
  return (
    <div className="flex min-h-screen flex-col gap-4 bg-bg p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
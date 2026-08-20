/**
 * EntitlementGate · 权益门禁（Glassmorphism 升级引导卡片）
 * 免费用户触发敏感操作时显示升级引导
 */
import type { ReactNode } from 'react';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';

interface EntitlementGateProps {
  requires: string;
  entitlements: string[];
  children: ReactNode;
  /** 免费用户提示文案 */
  fallback?: string;
}

export function EntitlementGate({ requires, entitlements, children, fallback }: EntitlementGateProps) {
  const navigate = useNavigate();
  const granted = entitlements.includes('*') || entitlements.includes(requires);

  if (granted) return <>{children}</>;

  return (
    <div className="glass-sm flex flex-col items-center gap-4 rounded-2xl p-8 text-center shadow-xl">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-lg shadow-primary/10">
        <Lock size={28} aria-hidden />
      </span>
      <div>
        <div className="text-h3 font-bold text-text">会员专属功能</div>
        <p className="mt-1.5 text-caption text-muted/70">{fallback ?? '升级会员即可解锁该能力'}</p>
      </div>
      <Button onClick={() => navigate('/membership')} icon={<Crown size={18} aria-hidden />}>
        查看会员
      </Button>
    </div>
  );
}
/**
 * UpgradeButton · 升级/开通按钮（渐变按钮）
 */
import { Button } from '@/components/common/Button';
import { Crown } from 'lucide-react';

interface UpgradeButtonProps {
  loading?: boolean;
  onClick: () => void;
}

export function UpgradeButton({ loading, onClick }: UpgradeButtonProps) {
  return (
    <Button
      variant="cta"
      block
      size="lg"
      loading={loading}
      onClick={onClick}
      icon={<Crown size={18} aria-hidden />}
      className="!bg-gradient-to-r !from-cta !to-orange-500 !shadow-lg !shadow-cta/30 hover:!shadow-xl hover:!shadow-cta/40"
    >
      模拟支付开通
    </Button>
  );
}
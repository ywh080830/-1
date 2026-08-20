/**
 * Membership · 会员中心（4 档套餐 / 模拟支付 / 权益对照）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { Crown, Sparkles, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PlanCard } from '@/components/membership/PlanCard';
import { BenefitTable } from '@/components/membership/BenefitTable';
import { UpgradeButton } from '@/components/membership/UpgradeButton';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useUiStore } from '@/stores/uiStore';
import type { Entitlements } from '@/types/api';
import type { MembershipPlanRow } from '@/types/database';

export default function Membership() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<MembershipPlanRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    void api.listPlans().then((rows) => {
      setPlans(rows);
      if (rows.length) setSelected(rows[0].id);
    });
    void api.getEntitlements().then(setEntitlements).catch(() => setEntitlements(null));
  }, []);

  const pay = async () => {
    if (!selected) return;
    setPaying(true);
    try {
      const res = await api.verifyMembership({
        plan_id: selected,
        provider: 'mock',
        txn: `mock_${Date.now()}`,
        action: 'subscribe',
      });
      setEntitlements({ tier: res.tier, plan_id: selected, expires_at: res.expires_at, entitlements: res.entitlements });
      useUiStore.getState().showToast('success', '开通成功，权益已生效');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '开通失败');
    } finally {
      setPaying(false);
    }
  };

  const cancel = async () => {
    setPaying(true);
    try {
      await api.verifyMembership({ plan_id: '', provider: 'mock', txn: `cancel_${Date.now()}`, action: 'cancel' });
      useUiStore.getState().showToast('success', '已取消自动续费（权益保留至到期日）');
      void api.getEntitlements().then(setEntitlements);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '取消失败');
    } finally {
      setPaying(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selected);
  const isMember = profile?.tier === 'member';

  return (
    <div className="page">
      <PageHeader title="会员中心" />

      {/* 会员状态卡片 */}
      <section className="glass mb-4 animate-[slideUp_0.35s_ease-out] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-glass">
            <Crown size={26} className="text-white" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="text-h3 text-text">{isMember ? '会员已生效' : '免费版'}</div>
            <div className="mt-0.5 text-caption text-muted">
              {entitlements?.expires_at ? `有效期至 ${entitlements.expires_at.slice(0, 10)}` : '核心功能永久免费，无广告'}
            </div>
          </div>
          {isMember && (
            <Badge tone="member">
              <Crown size={11} aria-hidden /> 会员
            </Badge>
          )}
        </div>
      </section>

      {/* 套餐卡片网格 */}
      <div className="grid grid-cols-2 gap-3">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} selected={selected === p.id} onSelect={() => setSelected(p.id)} isCurrent={profile?.plan_id === p.id} />
        ))}
      </div>

      {/* 开通区域 */}
      <div className="glass mt-4 animate-[slideUp_0.4s_ease-out] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-primary" aria-hidden />
          <h2 className="text-h3 text-text">开通「{selectedPlan?.name ?? ''}」</h2>
        </div>
        <UpgradeButton loading={paying} onClick={pay} />
        {isMember && (
          <button type="button" onClick={cancel} disabled={paying} className="mt-3 w-full text-center text-caption text-muted transition-colors duration-fast hover:text-error disabled:is-disabled">
            取消自动续费（权益保留至到期日）
          </button>
        )}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-caption text-muted">
          <Shield size={14} aria-hidden />
          <span>当前为模拟支付（provider=mock），真实支付渠道即将上线</span>
        </div>
      </div>

      {/* 权益对照 */}
      <section className="mt-5">
        <h2 className="mb-3 text-h2 text-text">权益对照</h2>
        <BenefitTable />
      </section>
    </div>
  );
}
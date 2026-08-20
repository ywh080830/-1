/**
 * Merchants · 商户库（公共 + 个人 / 搜索）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { Store, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MerchantSearch } from '@/components/merchant/MerchantSearch';
import { MerchantRow } from '@/components/merchant/MerchantRow';
import { Empty } from '@/components/common/Empty';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { toMerchant } from '@/types/models';
import type { Merchant } from '@/types/models';

/* ---------- 进场动画 keyframes ---------- */
const animationStyles = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}
.animate-delay-1 { animation-delay: 0.1s; }
.animate-delay-2 { animation-delay: 0.2s; }
.animate-delay-3 { animation-delay: 0.3s; }
`;

export default function Merchants() {
  const { current } = useLedger();
  const [q, setQ] = useState('');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    void api
      .listMerchants(q || undefined)
      .then((rows) => setMerchants(rows.map(toMerchant)))
      .catch(() => setMerchants([]))
      .finally(() => setLoading(false));
  }, [current, q]);

  return (
    <div className="page">
      <style>{animationStyles}</style>

      <PageHeader title="商户库" />

      {/* 搜索栏 */}
      <div className="animate-fade-in-up mb-4">
        <MerchantSearch q={q} onChange={setQ} />
      </div>

      {loading ? (
        <div className="animate-fade-in" style={{ animationFillMode: 'both' }}>
          <Empty title="加载中…" />
        </div>
      ) : merchants.length === 0 ? (
        <div className="animate-fade-in animate-delay-1" style={{ animationFillMode: 'both' }}>
          <Empty
            title="暂无商户"
            description="拍照识别时会自动建立商户档案"
          />
        </div>
      ) : (
        <div className="animate-fade-in-up animate-delay-1 glass overflow-hidden transition-all duration-slow hover:shadow-glass-lg">
          {/* 头部装饰 */}
          <div className="relative px-4 pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                <Store size={16} aria-hidden />
              </span>
              <span className="overline-label font-semibold tracking-wider text-muted">
                商户列表
              </span>
              <span className="text-caption text-muted/60">· {merchants.length}</span>
            </div>
          </div>

          <div className="divide-y divide-[var(--glass-border)]">
            {merchants.map((m) => (
              <MerchantRow key={m.id} merchant={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
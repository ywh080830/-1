/**
 * Templates · 模板 / 周期记账
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { Plus, Repeat, Trash2, Sparkles, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Switch } from '@/components/common/Switch';
import { Empty } from '@/components/common/Empty';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { format } from '@/lib/money';
import { useUiStore } from '@/stores/uiStore';
import type { TemplateRow } from '@/types/database';

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
.animate-delay-4 { animation-delay: 0.4s; }
`;

export default function Templates() {
  const { current, canWrite } = useLedger();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('month');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!current) return;
    void api.listTemplates(current.id).then(setTemplates).catch(() => setTemplates([]));
  }, [current]);

  const create = async () => {
    if (!current) return;
    if (!name.trim() || !amount || Number(amount) <= 0) {
      useUiStore.getState().showToast('warning', '请填写名称与金额');
      return;
    }
    try {
      await api.saveTemplate({
        ledger_id: current.id,
        name: name.trim(),
        type: 'expense',
        amount: Number(amount),
        period,
        enabled,
      });
      setModal(false);
      setName('');
      setAmount('');
      useUiStore.getState().showToast('success', '模板已创建');
      void api.listTemplates(current.id).then(setTemplates);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '保存失败');
    }
  };

  const toggle = async (t: TemplateRow) => {
    if (!current) return;
    await api.saveTemplate({ ...t, enabled: !t.enabled });
    void api.listTemplates(current.id).then(setTemplates);
  };

  const remove = async (id: string) => {
    if (!current) return;
    await api.deleteTemplate(id);
    useUiStore.getState().showToast('success', '已删除');
    void api.listTemplates(current.id).then(setTemplates);
  };

  return (
    <div className="page">
      <style>{animationStyles}</style>

      <PageHeader
        title="模板 / 周期记账"
        right={
          canWrite ? (
            <button
              type="button"
              onClick={() => setModal(true)}
              aria-label="新建模板"
              className="touch-target rounded-xl glass-sm text-primary transition-all duration-base hover:scale-105 active:scale-95"
            >
              <Plus size={22} aria-hidden />
            </button>
          ) : undefined
        }
      />

      {templates.length === 0 ? (
        <div className="animate-fade-in" style={{ animationFillMode: 'both' }}>
          <Empty title="暂无模板" description="创建周期模板，到期自动提醒记账" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t, idx) => {
            const delay = `animate-delay-${Math.min(idx + 1, 4)}`;
            return (
              <div
                key={t.id}
                className={`animate-fade-in-up ${delay} glass relative overflow-hidden p-4 transition-all duration-slow hover:shadow-glass-lg active:scale-[0.99]`}
              >
                {/* 装饰光晕 */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-xl" />

                <div className="relative flex items-center gap-3">
                  {/* 图标 */}
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-fast ${
                    t.enabled
                      ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary'
                      : 'bg-surface-2 text-muted'
                  }`}>
                    <Repeat size={22} aria-hidden />
                  </span>

                  {/* 信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-body font-semibold ${t.enabled ? 'text-text' : 'text-muted'}`}>
                        {t.name}
                      </span>
                      <span className="shrink-0 rounded-md bg-secondary/10 px-2 py-0.5 text-overline font-medium text-secondary">
                        每{periodLabel(t.period)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-caption text-muted">
                      <Clock size={12} aria-hidden />
                      金额 <span className="num font-semibold text-text-secondary">{format(t.amount)}</span>
                    </div>
                  </div>

                  {/* 开关 */}
                  <Switch checked={t.enabled} onChange={() => toggle(t)} label={`启用模板 ${t.name}`} />

                  {/* 删除 */}
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      aria-label="删除"
                      className="touch-target rounded-lg glass-sm text-muted transition-all duration-base hover:bg-error/10 hover:text-error hover:scale-105"
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="新建模板">
        <div className="flex flex-col gap-4">
          <Input label="名称" name="name" placeholder="如：房租" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="金额" name="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div>
            <label className="mb-2 block text-caption font-semibold tracking-wide text-text-secondary">周期</label>
            <div className="inline-flex gap-1 rounded-xl bg-surface-2/50 p-1">
              {(['month', 'week', 'year'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`min-h-[36px] rounded-lg px-4 text-caption font-medium transition-all duration-base ${
                    period === p
                      ? 'glass-sm text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {periodLabel(p)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-2/50 p-4">
            <div>
              <span className="text-body font-medium">启用</span>
              <p className="text-caption text-muted">到期自动提醒记账</p>
            </div>
            <Switch checked={enabled} onChange={setEnabled} label="启用模板" />
          </div>
          <Button block onClick={create}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function periodLabel(p: string): string {
  return p === 'month' ? '月' : p === 'week' ? '周' : '年';
}
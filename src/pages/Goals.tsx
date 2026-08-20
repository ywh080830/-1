/**
 * Goals · 存钱目标
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { Plus, Target, Trash2, Sparkles, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/common/Modal';
import { Confirm } from '@/components/common/Confirm';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Empty } from '@/components/common/Empty';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { format } from '@/lib/money';
import { useUiStore } from '@/stores/uiStore';
import type { GoalRow } from '@/types/database';

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
@keyframes progressGlow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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

export default function Goals() {
  const { current, canWrite } = useLedger();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [deleting, setDeleting] = useState<GoalRow | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!current) return;
    void api.listGoals(current.id).then(setGoals).catch(() => setGoals([]));
  }, [current]);

  const create = async () => {
    if (!current) return;
    if (!name.trim() || !target || Number(target) <= 0) {
      useUiStore.getState().showToast('warning', '请填写名称与目标金额');
      return;
    }
    try {
      await api.saveGoal({
        ledger_id: current.id,
        name: name.trim(),
        target_amount: Number(target),
        current: Number(currentAmount) || 0,
        deadline: deadline || null,
      });
      setModal(false);
      setName('');
      setTarget('');
      useUiStore.getState().showToast('success', '目标已创建');
      void api.listGoals(current.id).then(setGoals);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '保存失败');
    }
  };

  const remove = async (id: string) => {
    if (!current) return;
    setRemoving(true);
    try {
      await api.deleteGoal(id);
      useUiStore.getState().showToast('success', '已删除');
      void api.listGoals(current.id).then(setGoals);
      setDeleting(null);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '删除失败');
      setDeleting(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="page">
      <style>{animationStyles}</style>

      <PageHeader
        title="存钱目标"
        right={
          canWrite ? (
            <button
              type="button"
              onClick={() => setModal(true)}
              aria-label="新建目标"
              className="touch-target rounded-xl glass-sm text-primary transition-all duration-base hover:scale-105 active:scale-95"
            >
              <Plus size={22} aria-hidden />
            </button>
          ) : undefined
        }
      />

      {goals.length === 0 ? (
        <div className="animate-fade-in" style={{ animationFillMode: 'both' }}>
          <Empty title="暂无目标" description="设定存钱目标，一步步实现" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((g, idx) => {
            const ratio = Number(g.target_amount) > 0 ? Number(g.current) / Number(g.target_amount) : 0;
            const pct = Math.min(100, ratio * 100);
            const isCompleted = pct >= 100;
            const delay = `animate-delay-${Math.min(idx + 1, 4)}`;

            return (
              <div
                key={g.id}
                className={`animate-fade-in-up ${delay} card-gradient overflow-hidden transition-all duration-slow hover:shadow-glass-lg active:scale-[0.99]`}
              >
                <div className="glass-sm relative m-[1px] p-4">
                  {/* 装饰 */}
                  <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-bl from-secondary/15 to-transparent blur-xl" />

                  <div className="relative">
                    {/* 头部 */}
                    <div className="flex items-center gap-3">
                      {/* 图标 */}
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-fast ${
                        isCompleted
                          ? 'bg-gradient-to-br from-income/20 to-income/5 text-income'
                          : 'bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary'
                      }`}>
                        {isCompleted ? <Trophy size={22} aria-hidden /> : <Target size={22} aria-hidden />}
                      </span>

                      {/* 名称 & 期限 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-body font-semibold text-text">{g.name}</span>
                          {isCompleted && (
                            <span className="shrink-0 rounded-md bg-income/10 px-2 py-0.5 text-overline font-medium text-income">
                              已完成
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-caption text-muted">
                          <Sparkles size={12} aria-hidden />
                          {g.deadline ? `截止 ${g.deadline}` : '无期限'}
                        </div>
                      </div>

                      {/* 当前金额 */}
                      <div className="text-right">
                        <div className={`num text-h3 font-bold tracking-tight ${isCompleted ? 'text-income' : 'text-text'}`}>
                          {format(g.current)}
                        </div>
                        <div className="text-caption text-muted">/ {format(g.target_amount)}</div>
                      </div>

                      {/* 删除 */}
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => setDeleting(g)}
                          aria-label="删除"
                          className="touch-target rounded-lg glass-sm text-muted transition-all duration-base hover:bg-error/10 hover:text-error hover:scale-105"
                        >
                          <Trash2 size={18} aria-hidden />
                        </button>
                      )}
                    </div>

                    {/* 进度条 */}
                    <div className="mt-3">
                      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-2/60 backdrop-blur-[2px]">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-spring"
                          style={{
                            width: `${pct}%`,
                            background: isCompleted
                              ? 'linear-gradient(90deg, var(--color-income), var(--color-income-deep))'
                              : 'linear-gradient(90deg, var(--color-secondary), var(--color-secondary-deep))',
                            backgroundSize: '200% 100%',
                            animation: pct > 0 && pct < 100 ? 'progressGlow 2s linear infinite' : 'none',
                          }}
                        />
                        {/* 光泽扫描 */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'progressGlow 2.5s ease-in-out infinite',
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-caption text-muted">
                        <span className="font-medium">进度 {pct.toFixed(0)}%</span>
                        <span>目标 {format(g.target_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="新建存钱目标">
        <div className="flex flex-col gap-4">
          <Input label="名称" name="name" placeholder="如：旅行基金" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="目标金额" name="target" type="number" step="0.01" placeholder="10000.00" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Input label="已存金额" name="current" type="number" step="0.01" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
          <Input label="截止日期" name="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Button block onClick={create}>
            保存
          </Button>
        </div>
      </Modal>

      {/* 删除目标确认弹窗 */}
      <Confirm
        open={deleting !== null}
        title="删除目标"
        description={`删除后不可恢复，确定删除「${deleting?.name ?? ''}」吗？`}
        confirmText="删除"
        tone="danger"
        loading={removing}
        onConfirm={() => {
          if (deleting) void remove(deleting.id);
        }}
        onCancel={() => {
          if (!removing) setDeleting(null);
        }}
      />
    </div>
  );
}
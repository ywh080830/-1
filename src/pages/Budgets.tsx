/**
 * Budgets · 预算（总预算 / 分类预算）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, PiggyBank, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/common/Modal';
import { Confirm } from '@/components/common/Confirm';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Empty } from '@/components/common/Empty';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { format } from '@/lib/money';
import { useUiStore } from '@/stores/uiStore';
import type { BudgetRow, CategoryRow } from '@/types/database';

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

export default function Budgets() {
  const { current, canWrite } = useLedger();
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [deleting, setDeleting] = useState<BudgetRow | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!current) return;
    void api.listBudgets(current.id).then(setBudgets).catch(() => setBudgets([]));
    void api.listCategories(current.id).then(setCategories).catch(() => setCategories([]));
  }, [current]);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const openNew = () => {
    setEditId(null);
    setCategoryId(null);
    setAmount('');
    setModal(true);
  };

  const submit = async () => {
    if (!current) return;
    if (!amount || Number(amount) <= 0) {
      useUiStore.getState().showToast('warning', '请输入有效预算金额');
      return;
    }
    try {
      if (editId) {
        await api.saveBudget({ id: editId, amount: Number(amount) });
      } else {
        await api.saveBudget({
          ledger_id: current.id,
          category_id: categoryId,
          period: 'month',
          amount: Number(amount),
        });
      }
      setModal(false);
      useUiStore.getState().showToast('success', '预算已保存');
      void api.listBudgets(current.id).then(setBudgets);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '保存失败');
    }
  };

  const remove = async (id: string) => {
    if (!current) return;
    setRemoving(true);
    try {
      await api.deleteBudget(id);
      useUiStore.getState().showToast('success', '已删除');
      void api.listBudgets(current.id).then(setBudgets);
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
        title="预算"
        right={
          canWrite ? (
            <button
              type="button"
              onClick={openNew}
              aria-label="新建预算"
              className="touch-target rounded-xl glass-sm text-primary transition-all duration-base hover:scale-105 active:scale-95"
            >
              <Plus size={22} aria-hidden />
            </button>
          ) : undefined
        }
      />

      {budgets.length === 0 ? (
        <div className="animate-fade-in" style={{ animationFillMode: 'both' }}>
          <Empty title="暂无预算" description="设置月度预算，首页实时展示进度" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {budgets.map((b, idx) => {
            const cat = b.category_id ? catMap.get(b.category_id) : undefined;
            const delay = `animate-delay-${Math.min(idx + 1, 4)}`;
            return (
              <div
                key={b.id}
                className={`animate-fade-in-up ${delay} glass relative overflow-hidden p-4 transition-all duration-slow hover:shadow-glass-lg active:scale-[0.99]`}
              >
                {/* 装饰 */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-xl" />

                <div className="relative flex items-center gap-3">
                  {/* 图标 */}
                  {cat ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-transform duration-fast hover:scale-110">
                      <CategoryIcon name={cat.icon} color={cat.color} size={22} />
                    </span>
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <PiggyBank size={22} aria-hidden />
                    </span>
                  )}

                  {/* 信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-body font-semibold text-text">
                        {cat?.name ?? '总预算'}
                      </span>
                      <span className="shrink-0 rounded-md bg-secondary/10 px-2 py-0.5 text-overline font-medium text-secondary">
                        每月
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-caption text-muted">
                      <Sparkles size={12} aria-hidden />
                      额度 <span className="num font-semibold text-text-secondary">{format(b.amount)}</span>
                    </div>
                  </div>

                  {/* 删除 */}
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setDeleting(b)}
                      aria-label="删除预算"
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
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? '编辑预算' : '新建预算'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-caption font-semibold tracking-wide text-text-secondary">类型</label>
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`min-h-[40px] rounded-xl px-4 text-body font-medium transition-all duration-base ${
                categoryId === null
                  ? 'bg-gradient-to-r from-primary to-primary-deep text-white shadow-sm'
                  : 'glass-sm text-text-secondary hover:text-text'
              }`}
            >
              总预算
            </button>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {categories
                .filter((c) => c.kind === 'expense' && !c.parent_id)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-xl transition-all duration-base ${
                      categoryId === c.id
                        ? 'glass-sm text-primary shadow-sm ring-1 ring-primary/30'
                        : 'glass-sm text-text-secondary opacity-70 hover:opacity-100'
                    }`}
                  >
                    <CategoryIcon name={c.icon} color={c.color} size={18} />
                    <span className="text-overline font-medium">{c.name}</span>
                  </button>
                ))}
            </div>
          </div>
          <Input label="月度额度（元）" name="amount" type="number" step="0.01" placeholder="2000.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button block onClick={submit}>
            保存
          </Button>
        </div>
      </Modal>

      {/* 删除预算确认弹窗 */}
      <Confirm
        open={deleting !== null}
        title="删除预算"
        description={
          deleting
            ? `删除后不可恢复，确定删除「${deleting.category_id ? catMap.get(deleting.category_id)?.name ?? '分类预算' : '总预算'}」吗？`
            : undefined
        }
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
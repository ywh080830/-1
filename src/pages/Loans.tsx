/**
 * Loans · 借贷管理（应收/应付）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { HandCoins, Plus, Trash2, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/common/Modal';
import { Confirm } from '@/components/common/Confirm';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Empty } from '@/components/common/Empty';
import { Badge } from '@/components/common/Badge';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { format } from '@/lib/money';
import { useUiStore } from '@/stores/uiStore';
import type { LoanRow } from '@/types/database';

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

export default function Loans() {
  const { current, canWrite } = useLedger();
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [modal, setModal] = useState(false);
  const [direction, setDirection] = useState<'receivable' | 'payable'>('receivable');
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [note, setNote] = useState('');
  const [deleting, setDeleting] = useState<LoanRow | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!current) return;
    void api.listLoans(current.id).then(setLoans).catch(() => setLoans([]));
  }, [current]);

  const create = async () => {
    if (!current) return;
    if (!counterparty.trim() || !amount || Number(amount) <= 0) {
      useUiStore.getState().showToast('warning', '请填写对方与金额');
      return;
    }
    try {
      await api.saveLoan({
        ledger_id: current.id,
        direction,
        counterparty: counterparty.trim(),
        amount: Number(amount),
        due_at: dueAt || null,
        note: note.trim() || null,
        status: 'open',
      });
      setModal(false);
      setCounterparty('');
      setAmount('');
      setNote('');
      useUiStore.getState().showToast('success', '借贷已记录');
      void api.listLoans(current.id).then(setLoans);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '保存失败');
    }
  };

  const remove = async (id: string) => {
    if (!current) return;
    setRemoving(true);
    try {
      await api.deleteLoan(id);
      useUiStore.getState().showToast('success', '已删除');
      void api.listLoans(current.id).then(setLoans);
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
        title="借贷"
        right={
          canWrite ? (
            <button
              type="button"
              onClick={() => setModal(true)}
              aria-label="新建借贷"
              className="touch-target rounded-xl glass-sm text-primary transition-all duration-base hover:scale-105 active:scale-95"
            >
              <Plus size={22} aria-hidden />
            </button>
          ) : undefined
        }
      />

      {loans.length === 0 ? (
        <div className="animate-fade-in" style={{ animationFillMode: 'both' }}>
          <Empty title="暂无借贷记录" description="记录借出/借入，到期自动提醒" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {loans.map((l, idx) => {
            const delay = `animate-delay-${Math.min(idx + 1, 4)}`;
            const isReceivable = l.direction === 'receivable';
            return (
              <div
                key={l.id}
                className={`animate-fade-in-up ${delay} glass relative overflow-hidden p-4 transition-all duration-slow hover:shadow-glass-lg active:scale-[0.99]`}
              >
                {/* 装饰光晕 */}
                <div className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full blur-xl ${
                  isReceivable ? 'bg-gradient-to-bl from-income/15 to-transparent' : 'bg-gradient-to-bl from-warning/15 to-transparent'
                }`} />

                <div className="relative flex items-center gap-3">
                  {/* 图标 */}
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-fast hover:scale-110 ${
                    isReceivable
                      ? 'bg-gradient-to-br from-income/20 to-income/5 text-income'
                      : 'bg-gradient-to-br from-warning/20 to-warning/5 text-warning'
                  }`}>
                    {isReceivable ? <ArrowUpRight size={22} aria-hidden /> : <ArrowDownRight size={22} aria-hidden />}
                  </span>

                  {/* 信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-body font-semibold text-text">{l.counterparty}</span>
                      <Badge tone={isReceivable ? 'success' : 'warning'}>
                        {isReceivable ? '应收' : '应付'}
                      </Badge>
                      {l.status !== 'open' && <Badge tone="default">{l.status}</Badge>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-caption text-muted">
                      <Sparkles size={12} aria-hidden />
                      {l.due_at ? `到期 ${l.due_at}` : '无到期日'}
                      {l.note ? ` · ${l.note}` : ''}
                    </div>
                  </div>

                  {/* 金额 */}
                  <span className={`num text-h3 font-bold tracking-tight ${isReceivable ? 'text-income' : 'text-warning'}`}>
                    {format(l.amount)}
                  </span>

                  {/* 删除 */}
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setDeleting(l)}
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
      <Modal open={modal} onClose={() => setModal(false)} title="新建借贷">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection('receivable')}
              className={`min-h-[44px] flex-1 rounded-xl text-body font-medium transition-all duration-base ${
                direction === 'receivable'
                  ? 'bg-gradient-to-r from-income to-income-deep text-white shadow-sm'
                  : 'glass-sm text-text-secondary hover:text-text'
              }`}
            >
              借出（应收）
            </button>
            <button
              type="button"
              onClick={() => setDirection('payable')}
              className={`min-h-[44px] flex-1 rounded-xl text-body font-medium transition-all duration-base ${
                direction === 'payable'
                  ? 'bg-gradient-to-r from-warning to-amber-400 text-white shadow-sm'
                  : 'glass-sm text-text-secondary hover:text-text'
              }`}
            >
              借入（应付）
            </button>
          </div>
          <Input label="对方" name="counterparty" placeholder="姓名/昵称" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
          <Input label="金额" name="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="到期日" name="dueAt" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <Input label="备注" name="note" placeholder="可选" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button block onClick={create}>
            保存
          </Button>
        </div>
      </Modal>

      {/* 删除借贷确认弹窗 */}
      <Confirm
        open={deleting !== null}
        title="删除借贷"
        description={`删除后不可恢复，确定删除「${deleting?.counterparty ?? ''}」这笔借贷吗？`}
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
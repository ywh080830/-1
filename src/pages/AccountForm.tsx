/**
 * AccountForm · 新建/编辑账户
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { Confirm } from '@/components/common/Confirm';
import { Input } from '@/components/common/Input';
import { Switch } from '@/components/common/Switch';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { useUiStore } from '@/stores/uiStore';
import type { AccountType } from '@/types/database';

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

const TYPES: Array<{ value: AccountType; label: string }> = [
  { value: 'cash', label: '现金' },
  { value: 'bank', label: '银行卡' },
  { value: 'credit', label: '信用卡' },
  { value: 'invest', label: '投资' },
  { value: 'stored', label: '储值卡' },
  { value: 'wallet', label: '电子钱包' },
  { value: 'loan', label: '贷款' },
];

const TYPE_GRADIENTS: Record<string, string> = {
  cash: 'from-emerald-400 to-teal-500',
  bank: 'from-primary to-primary-deep',
  credit: 'from-violet-400 to-purple-500',
  invest: 'from-amber-400 to-orange-500',
  stored: 'from-sky-400 to-cyan-500',
  wallet: 'from-rose-400 to-pink-500',
  loan: 'from-slate-400 to-slate-600',
};

export default function AccountForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current, canWrite } = useLedger();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('0.00');
  const [currency, setCurrency] = useState('CNY');
  const [creditLimit, setCreditLimit] = useState('');
  const [billDay, setBillDay] = useState('');
  const [hidden, setHidden] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!id || !current) return;
    void api.listAccounts(current.id).then((list) => {
      const row = list.find((a) => a.id === id);
      if (row) {
        setName(row.name);
        setType(row.type);
        setBalance(row.balance.toFixed(2));
        setCurrency(row.currency);
        setCreditLimit(row.credit_limit === null ? '' : String(row.credit_limit));
        setBillDay(row.bill_day === null ? '' : String(row.bill_day));
        setHidden(row.hidden);
        setIsDefault(row.is_default);
      }
    });
  }, [id, current]);

  if (!canWrite) {
    return (
      <div className="page">
        <PageHeader title="账户" />
        <p className="py-16 text-center text-caption text-muted">当前角色无编辑权限</p>
      </div>
    );
  }

  const submit = async () => {
    if (!current) return;
    if (!name.trim()) {
      useUiStore.getState().showToast('warning', '请输入账户名称');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: isEdit ? id : undefined,
        ledger_id: current.id,
        name: name.trim(),
        type,
        balance: Number(balance) || 0,
        currency,
        credit_limit: type === 'credit' && creditLimit ? Number(creditLimit) : null,
        bill_day: type === 'credit' && billDay ? Number(billDay) : null,
        hidden,
        is_default: isDefault,
        sort: 0,
      };
      await api.saveAccount(payload);
      useUiStore.getState().showToast('success', isEdit ? '账户已更新' : '账户已创建');
      navigate('/accounts');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    if (!current || !id) return;
    setRemoving(true);
    try {
      await api.deleteAccount(id);
      useUiStore.getState().showToast('success', '账户已删除');
      navigate('/accounts');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '删除失败');
      setDeleting(false);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="page">
      <style>{animationStyles}</style>

      <PageHeader
        title={isEdit ? '编辑账户' : '新建账户'}
        left={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="touch-target rounded-xl text-text-secondary transition-all duration-fast hover:bg-surface-2/50 active:scale-95"
          >
            <ArrowLeft size={22} aria-hidden />
          </button>
        }
      />

      {/* 表单卡片 */}
      <div className="animate-fade-in-up glass relative overflow-hidden p-5">
        {/* 装饰光晕 */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-bl from-primary/20 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-xl" />

        <div className="relative flex flex-col gap-5">
          {/* 账户名称 */}
          <div className="animate-fade-in-up animate-delay-1">
            <Input label="账户名称" name="name" placeholder="如：招行储蓄卡" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* 类型选择 */}
          <div className="animate-fade-in-up animate-delay-1">
            <label className="mb-2 block text-caption font-semibold tracking-wide text-text-secondary">类型</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`min-h-[36px] rounded-full px-4 text-caption font-medium transition-all duration-base ${
                    type === t.value
                      ? `bg-gradient-to-r ${TYPE_GRADIENTS[t.value] ?? 'from-primary to-primary-deep'} text-white shadow-sm`
                      : 'glass-sm text-text-secondary hover:text-text'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 余额 & 币种 */}
          <div className="animate-fade-in-up animate-delay-2 grid grid-cols-2 gap-3">
            <Input label="余额" name="balance" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
            <Input label="币种" name="currency" placeholder="CNY" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
          </div>

          {/* 信用卡专属 */}
          {type === 'credit' && (
            <div className="animate-fade-in-up animate-delay-2 flex flex-col gap-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4 border border-violet-500/10">
              <span className="text-overline font-semibold tracking-wider text-muted">信用卡信息</span>
              <Input label="信用额度" name="creditLimit" type="number" step="0.01" placeholder="50000.00" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              <Input label="账单日" name="billDay" type="number" min={1} max={28} placeholder="5" value={billDay} onChange={(e) => setBillDay(e.target.value)} hint="每月几号出账单" />
            </div>
          )}

          {/* 开关项 */}
          <div className="animate-fade-in-up animate-delay-3 flex flex-col gap-4 rounded-xl bg-surface-2/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-body font-medium">隐藏账户</span>
                <p className="text-caption text-muted">在首页隐藏此账户余额</p>
              </div>
              <Switch checked={hidden} onChange={setHidden} label="隐藏账户" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-body font-medium">设为默认账户</span>
                <p className="text-caption text-muted">新建账目时自动选中</p>
              </div>
              <Switch checked={isDefault} onChange={setIsDefault} label="设为默认账户" />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="animate-fade-in-up animate-delay-3">
            <Button block loading={saving} onClick={submit}>
              保存
            </Button>
          </div>

          {/* 编辑模式：删除账户（危险操作，需确认） */}
          {isEdit && (
            <div className="animate-fade-in-up animate-delay-3">
              <button
                type="button"
                onClick={() => setDeleting(true)}
                className="touch-target flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-error/25 bg-error/5 text-body font-medium text-error transition-all duration-fast hover:bg-error/10 active:scale-[0.97]"
              >
                <Trash2 size={18} aria-hidden />
                删除账户
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 删除账户确认弹窗 */}
      <Confirm
        open={deleting}
        title="删除账户"
        description="删除后不可恢复，账户及关联余额将一并清除，确定删除该账户吗？"
        confirmText="删除"
        tone="danger"
        loading={removing}
        onConfirm={() => void removeAccount()}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
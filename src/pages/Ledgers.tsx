/**
 * Ledgers · 账本列表/切换/新建/归档
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, BookOpen, Check, Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Empty } from '@/components/common/Empty';
import { useLedger } from '@/hooks/useLedger';
import { useLedgerStore } from '@/stores/ledgerStore';
import { useUiStore } from '@/stores/uiStore';

const SCENARIOS = [
  { value: 'daily', label: '日常' },
  { value: 'family', label: '家庭' },
  { value: 'travel', label: '旅行' },
  { value: 'business', label: '生意' },
];

export default function Ledgers() {
  const navigate = useNavigate();
  const { ledgers, current, isOwner } = useLedger();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [scenario, setScenario] = useState('family');
  const [currency, setCurrency] = useState('CNY');
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) {
      useUiStore.getState().showToast('warning', '请输入账本名称');
      return;
    }
    setCreating(true);
    try {
      await useLedgerStore.getState().createLedger(name.trim(), scenario, currency);
      setModal(false);
      setName('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="账本"
        right={
          <button
            type="button"
            onClick={() => setModal(true)}
            aria-label="新建账本"
            className="touch-target -mr-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-fast hover:bg-primary/20 hover:scale-105"
          >
            <Plus size={22} aria-hidden />
          </button>
        }
      />

      {ledgers.length === 0 ? (
        <div className="glass-sm mt-4">
          <Empty title="暂无账本" description="创建你的第一个账本" />
        </div>
      ) : (
        ledgers.map((l) => (
          <div
            key={l.id}
            className={`glass mt-4 flex items-center gap-3 p-4 transition-all duration-fast hover:translate-y-[-1px] hover:bg-primary/5 ${
              l.id === current?.id ? 'card-gradient border-primary/30' : ''
            }`}
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                l.id === current?.id
                  ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              <BookOpen size={22} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`truncate text-body font-medium ${l.id === current?.id ? 'text-primary' : ''}`}>
                  {l.name}
                </span>
                {l.id === current?.id && (
                  <span className="flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-overline text-success">
                    <Check size={10} aria-hidden /> 当前
                  </span>
                )}
                {l.is_archived && (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-overline text-muted">已归档</span>
                )}
              </div>
              <div className="mt-0.5 text-caption text-muted">
                {l.currency} · {l.scenario ?? '日常'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => useLedgerStore.getState().setCurrent(l.id)}
              className={`min-h-[36px] rounded-md px-3 text-caption transition-all duration-fast ${
                l.id === current?.id
                  ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                  : 'bg-primary/10 text-text-secondary hover:bg-primary/15 active:scale-95'
              }`}
            >
              切换
            </button>
            <button
              type="button"
              onClick={() => navigate(`/ledgers/${l.id}/members`)}
              aria-label="成员管理"
              className="touch-target rounded-md text-muted transition-colors hover:text-primary"
            >
              <Users size={20} aria-hidden />
            </button>
            {isOwner && !l.is_archived && (
              <button
                type="button"
                onClick={() => useLedgerStore.getState().archiveLedger(l.id, true)}
                aria-label="归档"
                className="touch-target rounded-md text-muted transition-colors hover:text-warning"
              >
                <Archive size={20} aria-hidden />
              </button>
            )}
          </div>
        ))
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="新建账本">
        <div className="flex flex-col gap-4">
          <Input label="名称" name="name" placeholder="如：家庭账本" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-caption font-medium text-text-secondary">场景</label>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setScenario(s.value)}
                  className={`min-h-[36px] rounded-full px-3 text-caption transition-all duration-fast hover:scale-105 ${
                    scenario === s.value ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-text-secondary hover:bg-primary/15'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="币种"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
          />
          <Button block loading={creating} onClick={create} variant="primary">
            创建
          </Button>
        </div>
      </Modal>
    </div>
  );
}
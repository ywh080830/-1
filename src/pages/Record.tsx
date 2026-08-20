/**
 * Record · 记一笔（对标随手记/鲨鱼记账 全屏录入）
 * - 顶部大型分段控制器（支出/收入/转账），滑动背景用 spring 动画
 * - 参考关键字 chips：点击自动填入备注
 * - 金额大号数字 + number-pop 高亮动画，底部磁力键盘固定
 * - 账户 / 日期 / 备注 辅助行常驻 + 「展开更多」收纳次要选项
 * - 编辑态：从流水列表回填，可删除已有流水（Confirm 确认）
 * 业务逻辑保持原样：分类/账户加载、useLedger 权限、离线 txStore.save
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Camera, ChevronDown, ChevronUp, MoreHorizontal, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalculatorDisplay } from '@/components/keypad/CalculatorDisplay';
import { NumberKeypad } from '@/components/keypad/NumberKeypad';
import { CategoryPicker } from '@/components/category/CategoryPicker';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Confirm } from '@/components/common/Confirm';
import { Skeleton } from '@/components/common/Skeleton';
import { useKeypad } from '@/hooks/useKeypad';
import { useLedger } from '@/hooks/useLedger';
import { useTxStore } from '@/stores/txStore';
import { useUiStore } from '@/stores/uiStore';
import { api } from '@/lib/api';
import { idbGetAll } from '@/lib/idb';
import type { AccountRow, CategoryRow, TransactionRow, TxType } from '@/types/database';
import type { Category } from '@/types/models';

type RecordType = TxType; // 'expense' | 'income' | 'transfer'

const TYPES: Array<{ value: RecordType; label: string }> = [
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' },
  { value: 'transfer', label: '转账' },
];

/** 参考关键字（硬编码）：类型切换时展示，点击填入备注 */
const REFERENCE_KEYWORDS: Record<'expense' | 'income', string[]> = {
  expense: ['餐饮', '交通', '购物', '日用品', '娱乐', '医疗', '房租', '通讯'],
  income: ['工资', '奖金', '红包', '报销', '退款', '兼职', '理财', '归还'],
};

/* ---------- 类型切换滑块配色 ---------- */
const SLIDER_GRADIENT: Record<RecordType, string> = {
  expense: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))',
  income: 'linear-gradient(135deg, var(--color-income), var(--color-income-deep))',
  transfer: 'linear-gradient(135deg, var(--color-expense), var(--color-expense-deep))',
};

function toModel(row: CategoryRow): Category {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    parentId: row.parent_id,
    name: row.name,
    kind: row.kind,
    icon: row.icon,
    color: row.color,
    sort: row.sort,
    createdAt: row.created_at,
  };
}

export default function Record() {
  const navigate = useNavigate();
  const location = useLocation();
  const { current, canWrite } = useLedger();
  const save = useTxStore((s) => s.save);
  const softDelete = useTxStore((s) => s.softDelete);

  // 编辑态：从列表带入（路由 state.edit 即 TransactionRow）
  const editTx = useMemo<TransactionRow | null>(
    () => (location.state as { edit?: TransactionRow } | null)?.edit ?? null,
    [location.state],
  );

  const [type, setType] = useState<RecordType>(editTx?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState<string | null>(editTx?.category_id ?? null);
  const [accountId, setAccountId] = useState<string | null>(editTx?.account_id ?? null);
  const [transferTo, setTransferTo] = useState<string | null>(editTx?.transfer_to ?? null);
  const [note, setNote] = useState(editTx?.note ?? '');
  const [date, setDate] = useState<string>(editTx?.txn_date ?? new Date().toISOString().slice(0, 10));
  const [merchantId, setMerchantId] = useState<string | null>(editTx?.merchant_id ?? null);
  const [merchantSource, setMerchantSource] = useState<string | null>(editTx?.merchant_source ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const keypad = useKeypad();

  // 编辑态：回填金额
  useEffect(() => {
    if (editTx) keypad.setValue(editTx.amount.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!current) return;
    setLoadingData(true);
    void api
      .listCategories(current.id)
      .then((rows) => setCategories(rows.map(toModel)))
      .catch(() => {
        void idbGetAll<CategoryRow>('categories').then((rows) =>
          setCategories(rows.filter((c) => !c.ledger_id || c.ledger_id === current.id).map(toModel)),
        );
      })
      .finally(() => setLoadingData(false));
    void api
      .listAccounts(current.id)
      .then(setAccounts)
      .catch(() => {
        void idbGetAll<AccountRow>('accounts').then((rows) =>
          setAccounts(rows.filter((a) => a.ledger_id === current.id)),
        );
      });
  }, [current]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const kindCategories = useMemo(
    () => (type === 'income' ? categories.filter((c) => c.kind === 'income') : categories.filter((c) => c.kind === 'expense')),
    [categories, type],
  );

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const activeTone = `${type}`;

  const submit = async () => {
    if (!current) return;
    if (!canWrite) {
      useUiStore.getState().showToast('error', '当前角色无编辑权限');
      return;
    }
    const amount = Number(keypad.display);
    if (!Number.isFinite(amount) || amount <= 0) {
      useUiStore.getState().showToast('warning', '请输入有效金额');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      useUiStore.getState().showToast('warning', '请选择分类');
      return;
    }
    if (!accountId) {
      useUiStore.getState().showToast('warning', '请选择账户');
      return;
    }
    if (type === 'transfer' && (!transferTo || transferTo === accountId)) {
      useUiStore.getState().showToast('warning', '请选择不同的转入账户');
      return;
    }

    setSaving(true);
    try {
      const happenedAt = new Date().toISOString();
      await save({
        id: editTx?.id,
        ledger_id: current.id,
        type,
        amount,
        account_id: accountId,
        transfer_to: type === 'transfer' ? transferTo : null,
        category_id: type === 'transfer' ? null : categoryId,
        note: note.trim() || null,
        merchant_id: merchantId,
        merchant_source: merchantSource,
        txn_date: date,
        happened_at: editTx?.happened_at ?? happenedAt,
        created_at: editTx?.created_at,
      });
      useUiStore.getState().showToast('success', editTx ? '已更新' : type === 'transfer' ? '转账已记录' : '已记账');
      if (editTx) {
        navigate(-1);
        return;
      }
      keypad.setValue('0');
      setNote('');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editTx) return;
    setConfirmDelete(false);
    try {
      await softDelete(editTx.id);
      navigate(-1);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '删除失败');
    }
  };

  const selectClass =
    'h-11 appearance-none rounded-xl border border-glass-border bg-glass-bg pl-3 pr-8 text-caption font-medium text-text outline-none backdrop-blur-[8px] transition-all duration-fast focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)] cursor-pointer';

  return (
    <div className="flex h-[100dvh] flex-col bg-bg">
      <PageHeader
        title="记一笔"
        subtitle={editTx ? '编辑流水' : undefined}
        right={<CameraButton onPress={() => navigate('/ocr')} />}
      />

      {/* ========== 可滚动内容区 ========== */}
      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {/* 类型切换：大型分段控制器（滑动背景 + spring） */}
        <div className="animate-fade-in-up relative mt-4 flex rounded-full glass-sm p-1.5">
          <div
            className="absolute top-1.5 bottom-1.5 rounded-full transition-transform duration-500 ease-spring"
            style={{
              width: `${100 / TYPES.length}%`,
              transform: `translateX(${TYPES.findIndex((t) => t.value === activeTone) * 100}%)`,
              background: SLIDER_GRADIENT[type],
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            }}
          />
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`relative z-10 flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-h3 font-semibold transition-all duration-fast active:scale-95 ${
                type === t.value ? 'text-white' : 'text-text-secondary hover:text-text'
              }`}
              aria-pressed={type === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 参考关键字 chips：点击填入备注 */}
        {type !== 'transfer' && (
          <div className="animate-fade-in-up animate-delay-1 no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
            {REFERENCE_KEYWORDS[type].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setNote(note === k ? '' : k)}
                className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-caption font-medium transition-all duration-fast active:scale-95 ${
                  note === k
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-glass-border bg-glass-bg text-text-secondary hover:border-primary/30 hover:text-text'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        )}

        {/* 分类网格（保留 CategoryPicker） */}
        {type !== 'transfer' && (
          <div className="animate-fade-in-up animate-delay-2 glass-sm mt-3 overflow-hidden p-1">
            <div className="rounded-xl bg-glass-bg p-3 backdrop-blur-[4px]">
              {loadingData && !categories.length ? (
                <div className="grid grid-cols-5 gap-3" aria-busy="true">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px]" />
                  ))}
                </div>
              ) : (
                <CategoryPicker
                  categories={kindCategories}
                  kind={type}
                  selectedId={categoryId}
                  onSelect={(c) => setCategoryId(c.id)}
                />
              )}
            </div>
          </div>
        )}

        {/* 转账转入账户 */}
        {type === 'transfer' && (
          <div className="animate-fade-in-up animate-delay-2 glass-sm mt-3 space-y-2 p-4">
            <label className="block text-overline font-medium tracking-wider text-muted">转入账户</label>
            <div className="relative">
              <select
                value={transferTo ?? ''}
                onChange={(e) => setTransferTo(e.target.value)}
                className={`${selectClass} w-full`}
              >
                <option value="">选择转入账户</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            </div>
            {!accounts.length && <p className="text-caption text-muted/70">暂无账户，请先创建账户</p>}
          </div>
        )}
      </main>

      {/* ========== 底部保存区（固定） ========== */}
      <footer className="shrink-0 border-t border-glass-border bg-bg/95 px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-3 backdrop-blur-[16px] shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
        {/* 账户 / 日期 / 备注 辅助行 + 右上角「展开更多」 */}
        <div className="animate-fade-in-up animate-delay-3 flex flex-wrap items-end gap-2">
          {/* 账户 */}
          <div className="relative min-w-[132px] flex-1">
            <label className="mb-1 block text-overline font-medium tracking-wider text-muted">账户</label>
            <div className="relative">
              <select
                value={accountId ?? ''}
                onChange={(e) => setAccountId(e.target.value)}
                className={`${selectClass} w-full`}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            </div>
          </div>

          {/* 日期 */}
          <div className="min-w-[116px] flex-1">
            <label className="mb-1 block text-overline font-medium tracking-wider text-muted">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-glass-border bg-glass-bg px-3 text-caption font-medium text-text outline-none backdrop-blur-[8px] transition-all duration-fast focus:border-primary/50"
            />
          </div>

          {/* 备注 */}
          <div className="min-w-[150px] flex-[1.4]">
            <label className="mb-1 block text-overline font-medium tracking-wider text-muted">备注</label>
            <Input
              name="note"
              placeholder="写点什么（可选）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* 右上角「展开更多」 */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`touch-target flex h-11 cursor-pointer items-center gap-1 rounded-xl px-3 text-caption font-medium transition-all duration-fast active:scale-95 ${
              moreOpen ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-white/50 hover:text-text'
            }`}
          >
            {moreOpen ? <ChevronUp size={15} aria-hidden /> : <MoreHorizontal size={16} aria-hidden />}
            更多
          </button>
        </div>

        {/* 展开更多面板 */}
        <div
          className={`grid transition-all duration-300 ease-spring ${moreOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          aria-hidden={!moreOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-2 rounded-xl border border-glass-border bg-glass-bg p-3">
              {editTx && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-error/10 text-body font-medium text-error transition-all duration-fast hover:bg-error/15 active:scale-[0.98]"
                >
                  <Trash2 size={16} aria-hidden />
                  删除此笔流水
                </button>
              )}
              {!editTx && type !== 'transfer' && (
                <p className="flex items-center gap-1.5 text-caption text-muted/80">
                  <Calendar size={13} className="shrink-0" aria-hidden />
                  保存后可在列表长按/点击任意流水回填编辑
                </p>
              )}
              {!editTx && type === 'transfer' && (
                <p className="text-caption text-muted/80">转账不会重复计入收支统计</p>
              )}
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up animate-delay-4 mt-3">
          {/* 金额展示 */}
          <div className="glass-sm overflow-hidden p-1">
            <div className="relative rounded-xl bg-glass-bg px-4 py-3 backdrop-blur-[4px]">
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-2xl" />
              {/* key={keypad.display} 触发 number-pop 高亮 */}
              <div key={keypad.display} className="number-pop">
                <CalculatorDisplay expression={keypad.expression} display={keypad.display} />
              </div>
              {selectedCategory && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-overline font-semibold text-primary backdrop-blur-[4px]">
                  {selectedCategory.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 数字键盘 */}
        <div className="animate-fade-in-up animate-delay-5 mt-3">
          <NumberKeypad
            onDigit={keypad.inputDigit}
            onDot={keypad.inputDot}
            onBackspace={keypad.backspace}
            onClear={keypad.clear}
            onEquals={keypad.equals}
            onOperator={keypad.inputOperator}
          />
        </div>

        {/* 保存按钮 */}
        <div className="mt-3">
          <Button
            variant={type === 'income' ? 'secondary' : type === 'expense' ? 'cta' : 'primary'}
            block
            size="lg"
            className={`relative overflow-hidden ${
              type === 'income'
                ? 'animate-glow-pulse shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : type === 'expense'
                  ? 'animate-glow-pulse shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                  : 'animate-glow-pulse shadow-[0_0_20px_rgba(79,70,229,0.3)]'
            }`}
            loading={saving}
            onClick={submit}
          >
            <div className="pointer-events-none absolute -inset-4 bg-gradient-to-r from-white/10 to-transparent opacity-50 blur-xl" />
            <span className="relative">{editTx ? '保存修改' : type === 'transfer' ? '保存转账' : '保存'}</span>
          </Button>
          {!editTx && <p className="mt-2 text-center text-caption text-muted/70">保存后可继续录入下一笔</p>}
        </div>
      </footer>

      {/* 删除确认 */}
      <Confirm
        open={confirmDelete}
        title="删除这笔流水？"
        description="删除后将移入回收站，可在回收站内恢复。"
        confirmText="删除"
        cancelText="取消"
        tone="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function CameraButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label="拍照识别"
      className="touch-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-glass-border bg-glass-bg text-text-secondary shadow-glass backdrop-blur-[8px] transition-all duration-fast hover:border-primary/40 hover:text-primary hover:shadow-glass-lg active:scale-95"
    >
      <Camera size={18} aria-hidden />
    </button>
  );
}
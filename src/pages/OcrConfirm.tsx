/**
 * OcrConfirm · 识别结果确认（标黄/高亮可编辑/保存 → ocr_confirm RPC）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmCard } from '@/components/ocr/ConfirmCard';
import { CategoryPicker } from '@/components/category/CategoryPicker';
import { Skeleton } from '@/components/common/Skeleton';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import { confirmJob } from '@/lib/ocr';
import { useUiStore } from '@/stores/uiStore';
import type { Category } from '@/types/models';
import type { OcrResponse } from '@/types/api';

export default function OcrConfirm() {
  const [params] = useSearchParams();
  const jobId = params.get('job');
  const navigate = useNavigate();
  const { current } = useLedger();

  const [data, setData] = useState<OcrResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!jobId || !current) return;
    void api.getOcrJob(jobId).then((job) => {
      if (job?.result) {
        const stored = job.result as unknown as OcrResponse['result'] & { suggest?: OcrResponse['suggest'] };
        setData({
          job_id: job.id,
          status: job.status,
          doc_type: job.doc_type,
          confidence: job.confidence,
          result: stored,
          suggest: stored.suggest ?? { category_id: null, account_id: null, confidence: 0.5, by: 'ner', learned: false },
        });
        if (stored.suggest?.category_id) {
          setCategoryId(stored.suggest.category_id);
        }
      }
    });
    void api.listCategories(current.id).then((rows) =>
      setCategories(
        rows.map((c) => ({
          id: c.id,
          ledgerId: c.ledger_id,
          parentId: c.parent_id,
          name: c.name,
          kind: c.kind,
          icon: c.icon,
          color: c.color,
          sort: c.sort,
          createdAt: c.created_at,
        })),
      ),
    );
    void api.listAccounts(current.id).then(setAccounts);
  }, [jobId, current]);

  // 建议分类回填
  useEffect(() => {
    if (!data?.suggest?.category_id || categoryId) return;
    setCategoryId(data.suggest.category_id);
  }, [data, categoryId]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const expenseCategories = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories]);

  if (!data) {
    return (
      <div className="page">
        <PageHeader title="识别结果" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const submit = async () => {
    if (!current || !jobId) return;
    if (!data.result.amount || Number(data.result.amount) <= 0) {
      useUiStore.getState().showToast('warning', '金额无效，请修改');
      return;
    }
    if (!categoryId) {
      useUiStore.getState().showToast('warning', '请选择分类');
      return;
    }
    if (!accountId) {
      useUiStore.getState().showToast('warning', '请选择账户');
      return;
    }
    setSaving(true);
    try {
      await confirmJob({
        job: jobId,
        ledger: current.id,
        category: categoryId,
        account: accountId,
        amount: data.result.amount,
        merchant: data.result.merchant_id,
        happenedAt: data.result.date ? `${data.result.date}T12:00:00+08:00` : new Date().toISOString(),
        note: data.result.merchant,
        addToLibrary: true,
      });
      useUiStore.getState().showToast('success', '入账成功');
      navigate('/record', { replace: true });
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '入账失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="确认入账" />

      {/* 识别结果卡片 */}
      <div className="glass mb-4 animate-[slideUp_0.35s_ease-out] p-5">
        <ConfirmCard data={data} saving={saving} onConfirm={submit} />
      </div>

      {/* 分类选择 */}
      <section className="glass mb-4 animate-[slideUp_0.4s_ease-out] p-5">
        <h2 className="mb-3 text-h3 text-text">分类</h2>
        <CategoryPicker categories={expenseCategories} kind="expense" selectedId={categoryId} onSelect={(c) => setCategoryId(c.id)} />
      </section>

      {/* 账户选择 */}
      <section className="glass mb-4 animate-[slideUp_0.45s_ease-out] p-5">
        <h2 className="mb-3 text-h3 text-text">账户</h2>
        <select
          value={accountId ?? ''}
          onChange={(e) => setAccountId(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-border bg-surface/80 px-4 text-body text-text outline-none backdrop-blur-sm transition-all duration-fast focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]"
        >
          {accounts.length === 0 && <option value="">暂无可用账户</option>}
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </section>

      <p className="text-center text-caption text-muted">保存后交易将携带商户 ID，同一商户再次识别将自动归类</p>
    </div>
  );
}
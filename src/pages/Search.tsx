/**
 * Search · 全局搜索（备注/金额/商户/分类/日期）
 */
import { useEffect, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TransactionList } from '@/components/tx/TransactionList';
import { Empty } from '@/components/common/Empty';
import { Skeleton } from '@/components/common/Skeleton';
import { useLedger } from '@/hooks/useLedger';
import { api } from '@/lib/api';
import type { SearchHit } from '@/types/api';
import type { Category } from '@/types/models';
import type { TransactionRow } from '@/types/database';

export default function Search() {
  const { current } = useLedger();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!current) return;
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
        }))
      )
    );
  }, [current]);

  const doSearch = async () => {
    if (!current || !q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.search(current.id, q.trim());
      setHits(res);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="全局搜索" back={false} />
      <div className="glass card-gradient mb-4 flex items-center gap-3 p-2 transition-transform duration-fast hover:translate-y-[-1px]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          placeholder="搜索备注、金额、商户、分类、日期"
          className="min-h-[44px] flex-1 rounded-lg bg-transparent px-3 text-body outline-none placeholder:text-muted focus:ring-1 focus:ring-primary/50"
          aria-label="搜索关键词"
        />
        <button
          type="button"
          onClick={doSearch}
          className="touch-target min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-primary px-4 text-white transition-all duration-fast hover:opacity-90 active:scale-95"
        >
          <SearchIcon size={20} aria-hidden />
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : searched ? (
        hits.length ? (
          <div className="glass overflow-hidden">
            <TransactionList
              transactions={hits.map((h) => ({
                id: h.id,
                ledger_id: current?.id ?? '',
                account_id: null,
                category_id: null,
                type: h.type as TransactionRow['type'],
                amount: h.amount,
                currency: 'CNY',
                rate: 1,
                note: h.note,
                merchant_id: null,
                merchant_source: null,
                txn_date: h.txn_date,
                transfer_to: null,
                version: 0,
                created_at: '',
                deleted_at: null,
                happened_at: h.txn_date,
                created_by: null,
              }))}
              categories={categories}
            />
          </div>
        ) : (
          <div className="glass-sm">
            <Empty title="未找到相关记录" description="换个关键词试试" />
          </div>
        )
      ) : (
        <div className="glass-sm">
          <Empty title="输入关键词开始搜索" description="支持备注 / 金额 / 商户 / 分类 / 日期" />
        </div>
      )}
    </div>
  );
}
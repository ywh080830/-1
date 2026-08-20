/**
 * SupportTickets · 我的工单列表
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { Plus, Ticket, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Empty } from '@/components/common/Empty';
import { api } from '@/lib/api';
import type { SupportTicketRow } from '@/types/database';

const STATUS: Record<string, { label: string; tone: 'default' | 'primary' | 'success' | 'warning' }> = {
  pending: { label: '待处理', tone: 'warning' },
  processing: { label: '处理中', tone: 'primary' },
  resolved: { label: '已解决', tone: 'success' },
  closed: { label: '已关闭', tone: 'default' },
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);

  useEffect(() => {
    void api.listTickets().then(setTickets).catch(() => setTickets([]));
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="我的工单"
        right={
          <Link to="/support/tickets/new" aria-label="新建工单" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-sm transition-all duration-fast active:scale-95">
            <Plus size={20} aria-hidden />
          </Link>
        }
      />

      {tickets.length === 0 ? (
        <div className="mt-8 animate-[slideUp_0.35s_ease-out]">
          <Empty title="暂无工单" description="遇到问题提交工单，48 小时内处理" />
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {tickets.map((t, i) => {
            const st = STATUS[t.status] ?? STATUS.pending;
            return (
              <div
                key={t.id}
                className="glass animate-[slideUp_0.3s_ease-out] p-4 transition-all duration-fast hover:shadow-glass-lg"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Ticket size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-body font-medium text-text">{t.subject}</span>
                      <Badge tone={st.tone} className="shrink-0">{st.label}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-caption text-muted">{t.description}</p>
                    <div className="mt-1.5 text-overline text-muted">{new Date(t.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                  <ArrowRight size={16} className="mt-2 shrink-0 text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
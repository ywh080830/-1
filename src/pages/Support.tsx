/**
 * Support · 客服中心（FAQ 智能客服 / 会话 / 工单入口）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, MessageCircle, Send, Ticket, Sparkles, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SessionList } from '@/components/support/SessionList';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { useUiStore } from '@/stores/uiStore';
import type { FaqResult } from '@/types/api';
import type { SupportSessionRow } from '@/types/database';

export default function Support() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<FaqResult | null>(null);
  const [sessions, setSessions] = useState<SupportSessionRow[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    void api.listSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const ask = async () => {
    if (!q.trim()) return;
    setAsking(true);
    try {
      const res = await api.faq(q.trim());
      setAnswer(res);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '客服繁忙，请稍后再试');
    } finally {
      setAsking(false);
    }
  };

  const openBotSession = async () => {
    const session = await api.createSession('bot', { source: 'support' });
    navigate(`/support/session/${session.id}`);
  };

  return (
    <div className="page">
      <PageHeader title="客服中心" />

      {/* FAQ 智能客服 */}
      <section className="glass mb-4 animate-[slideUp_0.35s_ease-out] p-5">
        <h2 className="mb-3 flex items-center gap-2 text-h3 text-text">
          <Sparkles size={18} className="text-primary" aria-hidden /> 智能客服
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="输入问题，如：怎么导出？"
              className="min-h-[44px] w-full rounded-xl border border-border bg-surface/80 px-4 text-body text-text outline-none backdrop-blur-sm placeholder:text-muted transition-all duration-fast focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]"
              aria-label="客服问题"
            />
          </div>
          <button
            type="button"
            onClick={ask}
            disabled={asking}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-sm transition-all duration-fast active:scale-95 disabled:is-disabled"
          >
            <Send size={18} aria-hidden />
          </button>
        </div>
        {answer && (
          <div className="mt-4 animate-[slideUp_0.2s_ease-out] rounded-xl bg-primary-50/80 p-4 dark:bg-primary-900/20">
            <p className="text-body text-text">{answer.answer}</p>
            {answer.suggest_human && (
              <button type="button" onClick={openBotSession} className="group mt-2 inline-flex items-center gap-1 text-caption text-primary transition-all duration-fast hover:text-primary-hover">
                转人工客服
                <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* 会话入口 */}
      <section className="glass mb-4 animate-[slideUp_0.4s_ease-out] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3">
          <MessageCircle size={16} className="text-primary" aria-hidden />
          <span className="text-overline text-muted">在线会话</span>
        </div>
        <SessionList sessions={sessions} onOpen={(id) => navigate(`/support/session/${id}`)} />
        <button
          type="button"
          onClick={openBotSession}
          className="group flex min-h-[52px] w-full items-center gap-3 px-5 text-body text-text transition-all duration-fast hover:bg-surface-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageCircle size={18} aria-hidden />
          </span>
          <span className="flex-1 text-left">开启新会话</span>
          <ArrowRight size={16} className="text-muted transition-transform duration-fast group-hover:translate-x-0.5" />
        </button>
      </section>

      {/* 工单入口 */}
      <section className="glass animate-[slideUp_0.45s_ease-out] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3">
          <Ticket size={16} className="text-primary" aria-hidden />
          <span className="text-overline text-muted">工单服务</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/support/tickets/new')}
          className="group flex min-h-[52px] w-full items-center gap-3 px-5 text-body text-text transition-all duration-fast hover:bg-surface-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Ticket size={18} aria-hidden />
          </span>
          <span className="flex-1 text-left">提交工单</span>
          <ArrowRight size={16} className="text-muted transition-transform duration-fast group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/support/tickets')}
          className="group flex min-h-[52px] w-full items-center gap-3 px-5 text-body text-text transition-all duration-fast hover:bg-surface-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Ticket size={18} aria-hidden />
          </span>
          <span className="flex-1 text-left">我的工单</span>
          <ArrowRight size={16} className="text-muted transition-transform duration-fast group-hover:translate-x-0.5" />
        </button>
      </section>

      <p className="mt-4 text-center text-caption text-muted">会话记录保留 180 天；非工作时间提交工单 48 小时内处理</p>
    </div>
  );
}
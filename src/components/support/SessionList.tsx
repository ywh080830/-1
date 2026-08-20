/**
 * SessionList · 会话列表（Glassmorphism 列表项）
 */
import { MessageCircle } from 'lucide-react';
import type { SupportSessionRow } from '@/types/database';

interface SessionListProps {
  sessions: SupportSessionRow[];
  onOpen: (id: string) => void;
}

export function SessionList({ sessions, onOpen }: SessionListProps) {
  if (!sessions.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s.id)}
          className="glass-sm flex min-h-[60px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
            <MessageCircle size={20} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-medium text-text">
              {s.channel === 'bot' ? '智能客服' : s.channel === 'human' ? '人工客服' : '工单'}
            </div>
            <div className="text-caption text-muted/70">{new Date(s.started_at).toLocaleString('zh-CN')}</div>
          </div>
          <span className="glass-sm rounded-xl px-2.5 py-1 text-overline font-medium text-muted">{s.status}</span>
        </button>
      ))}
    </div>
  );
}
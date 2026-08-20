/**
 * SupportSession · 客服会话（消息列表 + 发送 + 评价）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChatBubble } from '@/components/support/ChatBubble';
import { RatingStars } from '@/components/support/RatingStars';
import { api } from '@/lib/api';
import { useUiStore } from '@/stores/uiStore';
import type { SupportMessageRow } from '@/types/database';

export default function SupportSession() {
  const { id } = useParams();
  const [messages, setMessages] = useState<SupportMessageRow[]>([]);
  const [text, setText] = useState('');
  const [showRating, setShowRating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    void api.listMessages(id).then(setMessages).catch(() => setMessages([]));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!id || !text.trim()) return;
    try {
      await api.sendMessage(id, text.trim(), crypto.randomUUID());
      setText('');
      void api.listMessages(id).then(setMessages);
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '发送失败');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-bg via-bg to-[#eef2ff]/30 dark:via-bg dark:to-[#0f111a]">
      <PageHeader title="客服会话" />

      <div className="relative mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 pb-[calc(60px+env(safe-area-inset-bottom)+24px)]">
        {/* 消息列表 */}
        <div className="flex-1 space-y-3 overflow-y-auto py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <MessageCircle size={28} className="text-primary" aria-hidden />
              </div>
              <p className="text-body text-muted">开始对话，客服将为你解答问题</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="animate-[slideUp_0.2s_ease-out]">
              <ChatBubble msg={m} />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 评价 */}
        {messages.length > 2 && !showRating && (
          <button
            type="button"
            onClick={() => setShowRating(true)}
            className="mb-3 self-center rounded-full bg-surface/80 px-4 py-1.5 text-caption text-muted backdrop-blur-sm transition-all duration-fast hover:bg-surface-2 hover:text-primary"
          >
            评价本次服务
          </button>
        )}
        {showRating && id && (
          <div className="mb-3 animate-[slideUp_0.2s_ease-out]">
            <RatingStars onSubmit={async (score, comment) => {
              await api.rateSession(id, score, comment);
              useUiStore.getState().showToast('success', '感谢您的评价');
              setShowRating(false);
            }} />
          </div>
        )}

        {/* 输入栏 */}
        <div className="glass-sm flex items-center gap-2 p-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="输入消息…"
            className="min-h-[44px] flex-1 bg-transparent px-3 text-body text-text outline-none placeholder:text-muted"
            aria-label="消息内容"
          />
          <button
            type="button"
            onClick={send}
            aria-label="发送"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-sm transition-all duration-fast active:scale-95"
          >
            <Send size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
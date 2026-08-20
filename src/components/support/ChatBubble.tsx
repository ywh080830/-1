/**
 * ChatBubble · 会话消息气泡（Glassmorphism 气泡）
 */
import type { SupportMessageRow } from '@/types/database';

interface ChatBubbleProps {
  msg: SupportMessageRow;
}

export function ChatBubble({ msg }: ChatBubbleProps) {
  const isUser = msg.sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-body leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg shadow-primary/30'
            : msg.sender === 'system'
              ? 'glass-sm text-muted'
              : 'glass-sm text-text shadow-md'
        }`}
      >
        {msg.content}
        <div className={`mt-1 text-overline opacity-60 ${isUser ? 'text-white/60' : 'text-muted/60'}`}>
          {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
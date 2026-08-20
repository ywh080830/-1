/**
 * MemberList · 账本成员列表（Glassmorphism 列表项）
 */
import { UserRound } from 'lucide-react';
import { MemberRoleSelect } from './MemberRoleSelect';
import type { LedgerMemberRow } from '@/types/database';

interface MemberListProps {
  members: LedgerMemberRow[];
  isOwner: boolean;
  onRoleChange: (userId: string, role: 'editor' | 'viewer') => void;
  onRemove: (userId: string) => void;
}

export function MemberList({ members, isOwner, onRoleChange, onRemove }: MemberListProps) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => (
        <div key={m.id} className="glass-sm flex min-h-[60px] items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
            <UserRound size={20} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-medium text-text">{m.user_id.slice(0, 8)}</div>
            <div className="text-caption text-muted/70">{m.user_id}</div>
          </div>
          {m.role === 'owner' ? (
            <span className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 px-3 py-1.5 text-overline font-medium text-primary">主理人</span>
          ) : isOwner ? (
            <div className="flex items-center gap-2">
              <MemberRoleSelect value={m.role === 'editor' ? 'editor' : 'viewer'} onChange={(r) => onRoleChange(m.user_id, r)} />
              <button type="button" onClick={() => onRemove(m.user_id)} className="glass-sm touch-target rounded-xl px-3 py-1.5 text-caption text-muted transition-all duration-200 hover:scale-105 hover:text-error active:scale-95" aria-label="移除成员">
                移除
              </button>
            </div>
          ) : (
            <span className="glass-sm rounded-xl px-3 py-1.5 text-overline font-medium text-text-secondary">
              {m.role === 'editor' ? '编辑' : '只读'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
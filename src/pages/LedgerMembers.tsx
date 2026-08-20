/**
 * LedgerMembers · 成员管理（owner 邀请/角色/移除）
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MemberList } from '@/components/ledger/MemberList';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useLedger } from '@/hooks/useLedger';
import { useLedgerStore } from '@/stores/ledgerStore';
import { useUiStore } from '@/stores/uiStore';

export default function LedgerMembers() {
  const { id } = useParams();
  const { members, isOwner } = useLedger();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');

  useEffect(() => {
    if (id) void useLedgerStore.getState().loadMembers(id);
  }, [id]);

  const add = async () => {
    if (!id) return;
    if (!userId.trim()) {
      useUiStore.getState().showToast('warning', '请输入用户 ID');
      return;
    }
    try {
      await useLedgerStore.getState().addMember(userId.trim(), role);
      setUserId('');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '添加失败');
    }
  };

  return (
    <div className="page">
      <PageHeader title="成员管理" />

      {isOwner && (
        <section className="glass card-gradient mb-4 flex flex-col gap-4 p-5 transition-transform duration-fast hover:translate-y-[-1px]">
          <h2 className="text-h3">邀请成员</h2>
          <Input
            label="用户 ID"
            name="userId"
            placeholder="粘贴对方用户 ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="min-h-[44px] flex-1 rounded-lg border border-border bg-transparent px-3 text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/50"
              aria-label="角色"
            >
              <option value="editor">编辑（可记账）</option>
              <option value="viewer">只读</option>
            </select>
            <Button onClick={add} icon={<UserPlus size={18} aria-hidden />} variant="primary">
              添加
            </Button>
          </div>
          <p className="text-caption text-muted">提示：可在「我的」页复制自己的用户 ID 给朋友</p>
        </section>
      )}

      <section className="glass overflow-hidden">
        <div className="overline-label px-4 pt-3">成员列表（{members.length}）</div>
        <MemberList
          members={members}
          isOwner={isOwner}
          onRoleChange={(uid, r) => id && useLedgerStore.getState().updateMemberRole(uid, r)}
          onRemove={(uid) => id && useLedgerStore.getState().removeMember(uid)}
        />
      </section>
    </div>
  );
}
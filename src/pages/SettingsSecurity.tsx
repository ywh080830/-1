/**
 * SettingsSecurity · 安全设置（修改密码 / 会话管理）
 */
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { api } from '@/lib/api';

export default function SettingsSecurity() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sending, setSending] = useState(false);

  const sendReset = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      useUiStore.getState().showToast('warning', '请输入有效邮箱');
      return;
    }
    setSending(true);
    try {
      await useAuthStore.getState().resetPassword(email);
      useUiStore.getState().showToast('success', '重置链接已发送');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '发送失败');
    } finally {
      setSending(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      useUiStore.getState().showToast('warning', '新密码至少 6 位');
      return;
    }
    if (newPassword !== confirm) {
      useUiStore.getState().showToast('warning', '两次密码不一致');
      return;
    }
    try {
      await api.auth.updatePassword(newPassword);
      useUiStore.getState().showToast('success', '密码已更新');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      useUiStore.getState().showToast('error', err instanceof Error ? err.message : '更新失败');
    }
  };

  return (
    <div className="page">
      <PageHeader title="安全设置" />

      <section className="glass card-gradient mt-4 p-5 transition-transform duration-fast hover:translate-y-[-1px]">
        <h2 className="mb-4 text-h3">修改密码</h2>
        <div className="flex flex-col gap-4">
          <Input
            label="新密码"
            name="newPassword"
            type="password"
            placeholder="至少 6 位"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="确认新密码"
            name="confirm"
            type="password"
            placeholder="再次输入"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button onClick={updatePassword} variant="primary">
            更新密码
          </Button>
        </div>
      </section>

      <section className="glass-sm mt-4 p-5">
        <h2 className="mb-4 text-h3">邮箱重置</h2>
        <div className="flex flex-col gap-4">
          <Input
            label="邮箱"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="发送密码重置链接到邮箱"
          />
          <Button variant="outline" onClick={sendReset} loading={sending}>
            发送重置链接
          </Button>
        </div>
      </section>

      <p className="mt-5 px-1 text-caption text-muted">安全提示：请勿与他人共享账号；所有数据受 RLS 行级安全保护。</p>
    </div>
  );
}
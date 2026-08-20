/**
 * ForgotPassword · 忘记密码（发送重置邮件）
 * Premium Glassmorphism + Minimalism 风格
 */
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { TurnstileWidget, TURNSTILE_ENABLED, type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget';
import { useAuthStore } from '@/stores/authStore';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('请输入有效邮箱');
      return;
    }
    // 人机验证：已配置 site key 时必须持有有效 token
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('请先完成人机验证');
      return;
    }
    try {
      await useAuthStore.getState().resetPassword(email, turnstileToken);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
      // Turnstile token 单次有效：失败后重置，要求重新验证
      turnstileRef.current?.reset();
      setTurnstileToken('');
    }
  };

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f0f2f5] to-[#e6f7f5] px-6 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] dark:from-[#0a0a0f] dark:via-[#0f111a] dark:to-[#0a1211]">
      {/* 背景装饰光晕 */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-glass">
            <Mail size={30} className="text-white" aria-hidden />
          </div>
          <h1 className="font-display text-display text-text">重置密码</h1>
          <p className="mt-1 text-body text-muted">找回你的账号访问权限</p>
        </div>

        {sent ? (
          <div className="glass animate-[slideUp_0.4s_ease-out] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle size={28} className="text-success" aria-hidden />
            </div>
            <h2 className="text-h2 text-text">邮件已发送</h2>
            <p className="mt-2 text-body text-muted">
              重置链接已发送至 <strong className="text-text">{email}</strong>
            </p>
            <p className="mt-1 text-caption text-muted">请查收邮件并按提示设置新密码</p>
            <Link to="/login" className="mt-5 inline-flex items-center gap-1 text-caption text-primary transition-all duration-fast hover:text-primary-hover">
              <ArrowLeft size={14} />
              返回登录
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="glass animate-[slideUp_0.4s_ease-out] flex flex-col gap-5 p-6">
            <div className="text-center">
              <h2 className="text-h2 text-text">忘记密码</h2>
              <p className="mt-1 text-caption text-muted">输入注册邮箱，我们将发送密码重置链接</p>
            </div>

            <Input
              label="邮箱"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              left={<Mail size={18} className="text-muted" aria-hidden />}
            />
            {error && (
              <p className="text-caption text-error" role="alert">
                {error}
              </p>
            )}
            {/* Cloudflare Turnstile 人机验证 */}
            <TurnstileWidget
              ref={turnstileRef}
              action="reset_password"
              onToken={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
            />
            <Button type="submit" block>
              发送重置链接
            </Button>
            <div className="text-center text-caption">
              <Link to="/login" className="group inline-flex items-center gap-1 text-primary transition-all duration-fast hover:text-primary-hover">
                <ArrowLeft size={14} />
                返回登录
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
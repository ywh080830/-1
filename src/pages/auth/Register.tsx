/**
 * Register · 注册（邮箱 + 密码）
 * Aurora Silk 风格 · 复用 AgreementCheckbox 协议勾选
 */
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, UserRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AgreementCheckbox } from '@/components/auth/AgreementCheckbox';
import { AgreementSheet } from '@/components/auth/AgreementSheet';
import { TurnstileWidget, TURNSTILE_ENABLED, type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [agreementError, setAgreementError] = useState('');
  const [sheet, setSheet] = useState<'user' | 'privacy' | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const loading = useAuthStore((s) => s.loading);
  const toast = useUiStore.getState().showToast;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAgreementError('');

    if (!agreed) {
      setAgreementError('请先勾选并同意《用户协议》与《隐私政策》');
      toast('warning', '请先同意用户协议与隐私政策');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('请输入有效邮箱');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    // 人机验证：已配置 site key 时必须持有有效 token
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('请先完成人机验证');
      return;
    }
    try {
      await useAuthStore.getState().signUp(email, password, nickname || undefined, turnstileToken);
      toast('success', '注册成功');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
      // Turnstile token 单次有效：失败后重置，要求重新验证
      turnstileRef.current?.reset();
      setTurnstileToken('');
    }
  };

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f0f2f5] to-[#e6f7f5] px-6 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] dark:from-[#0a0a0f] dark:via-[#0f111a] dark:to-[#0a1211]">
      {/* Aurora Mesh 极光动效背景 */}
      <div className="aurora-mesh" aria-hidden />

      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="relative mx-auto mb-3">
            <div className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-br from-primary to-secondary opacity-25 blur-2xl" aria-hidden />
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary via-primary to-secondary shadow-[0_8px_24px_rgba(124,92,252,0.4)]">
              <UserRound size={26} className="text-white" aria-hidden />
          </div>
        </div>
          <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight text-text">
            创建账号
        </h1>
          <p className="mt-1.5 text-caption text-muted">开启你的智能记账之旅</p>
      </div>

        <form onSubmit={submit} className="glass animate-[slideUp_0.4s_ease-out] flex flex-col gap-4 p-6">
          <Input
            label="邮箱"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            left={<Mail size={18} className="text-muted" aria-hidden />}
          />
          <Input
            label="昵称（可选）"
            name="nickname"
            type="text"
            placeholder="怎么称呼你"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            left={<UserRound size={18} className="text-muted" aria-hidden />}
          />
          <Input
            label="密码"
            name="password"
            type="password"
            placeholder="至少 6 位"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            left={<Lock size={18} className="text-muted" aria-hidden />}
          />
          <Input
            label="确认密码"
            name="confirm"
            type="password"
            placeholder="再次输入密码"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            left={<Lock size={18} className="text-muted" aria-hidden />}
          />

          {error && (
            <p className="flex items-center gap-1.5 rounded-lg bg-error/[0.08] px-2.5 py-1.5 text-caption text-error" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
            </svg>
              {error}
          </p>
          )}

          <div className="-mx-1">
            <AgreementCheckbox
              checked={agreed}
              onChange={(v) => {
                setAgreed(v);
                if (v) setAgreementError('');
              }}
              onOpenAgreement={() => setSheet('user')}
              onOpenPrivacy={() => setSheet('privacy')}
              error={agreementError}
            />
        </div>

          {/* Cloudflare Turnstile 人机验证 */}
          <TurnstileWidget
            ref={turnstileRef}
            action="register"
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken('')}
          />

          <Button type="submit" block loading={loading} gradient className="mt-1">
            注册
        </Button>

          <div className="text-center text-caption">
            已有账号？{' '}
            <Link to="/login" className="group inline-flex items-center gap-1 text-primary transition-all duration-fast hover:text-primary-hover">
              去登录
              <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" />
          </Link>
        </div>
      </form>
    </div>

      <AgreementSheet
        open={sheet !== null}
        type={sheet}
        onClose={() => setSheet(null)}
      />
  </div>
  );
}

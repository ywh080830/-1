/**
 * Login · 登录页（Aurora Silk · 重新设计）
 *
 * 视觉/交互设计要点：
 * 1. 顶部品牌区：渐变 Logo 玻璃徽标 + Aurora Mesh 极光动效背景（继承全局 .aurora-mesh）
 * 2. 主登录卡片：双字段（账号 + 密码）+ 真实 SVG 图标（lock/user/eye）
 * 3. 协议勾选（AgreementCheckbox）：必须勾选《用户协议》与《隐私政策》才能登录
 *    - 未勾选：登录按钮 disabled，hover 时浮出原因
 *    - 勾选状态实时反馈：spring 动效 + 主色实心 + 内联 ✓ SVG
 * 4. 体验模式：保留作为备选入口（无需勾选协议）
 * 5. 协议详情：底部抽屉（AgreementSheet），主色渐变按钮"我已知晓"
 * 6. 微交互：输入框 focus 光晕、按钮按下缩放、Aurora 漂移、ripple 涟漪预备（与全局一致）
 */
import { useState, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, UserRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AgreementCheckbox } from '@/components/auth/AgreementCheckbox';
import { AgreementSheet } from '@/components/auth/AgreementSheet';
import { TurnstileWidget, TURNSTILE_ENABLED, type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [agreementError, setAgreementError] = useState('');
  const [sheet, setSheet] = useState<'user' | 'privacy' | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const loading = useAuthStore((s) => s.loading);
  const toast = useUiStore.getState().showToast;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAgreementError('');

    if (!agreed) {
      setAgreementError('请先勾选并同意《用户协议》与《隐私政策》');
      // 轻提示
      toast('warning', '请先同意用户协议与隐私政策');
      return;
    }
    if (!identifier.trim() || !password) {
      setError('请输入账号与密码');
      return;
    }
    // 人机验证：已配置 site key 时必须持有有效 token
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('请先完成人机验证');
      return;
    }
    try {
      await useAuthStore.getState().signIn(identifier.trim(), password, turnstileToken);
      toast('success', '登录成功');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      // Turnstile token 单次有效：失败后重置，要求重新验证
      turnstileRef.current?.reset();
      setTurnstileToken('');
    }
  };

  const handleDemo = async () => {
    setError('');
    setAgreementError('');
    toast('info', '正在进入体验模式…');
    await useAuthStore.getState().enterDemo();
    toast('success', '欢迎体验智能记账（演示数据）');
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f0f2f5] to-[#e6f7f5] px-6 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] dark:from-[#0a0a0f] dark:via-[#0f111a] dark:to-[#0a1211]">
      {/* Aurora Mesh 极光动效背景（主色 + 辅色 + CTA + 收/支语义色） */}
      <div className="aurora-mesh" aria-hidden />

      {/* 静态装饰光晕（兼容 prefers-reduced-motion） */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-15%] top-[40%] h-60 w-60 rounded-full bg-cta/[0.08] blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm">
        {/* ---------- 品牌区 ---------- */}
        <div className="mb-7 flex flex-col items-center text-center animate-fade-in-up">
          <div className="relative mb-3.5">
            {/* 外圈光晕 */}
            <div className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-br from-primary to-secondary opacity-25 blur-2xl" aria-hidden />
            {/* Logo 主容器 */}
            <div className="relative flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-gradient-to-br from-primary via-primary to-secondary shadow-[0_8px_24px_rgba(124,92,252,0.4)]">
              {/* 内嵌装饰：记账本抽象 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4z" opacity="0.4" />
                <path d="M4 4v16a2 2 0 0 0 2 2h12" />
                <path d="M8 10h6" />
                <path d="M8 14h4" />
                <circle cx="17" cy="17" r="2.5" fill="white" stroke="none" />
             </svg>
              {/* 角标 sparkle */}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cta shadow-[0_2px_8px_rgba(255,138,91,0.45)]">
                <Sparkles size={11} className="text-white" aria-hidden />
             </span>
           </div>
         </div>
          <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight text-text">
            智能记账
         </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-caption text-muted">
            <span className="inline-block h-1 w-1 rounded-full bg-primary" />
            元答AI工作室 · 离线优先 · 云同步
            <span className="inline-block h-1 w-1 rounded-full bg-secondary" />
         </p>
       </div>

        {/* ---------- 登录卡片 ---------- */}
        <div className="glass animate-[slideUp_0.4s_ease-out] p-6">
          <div className="mb-5 text-center">
            <h2 className="text-h2 text-text">欢迎回来</h2>
            <p className="mt-1 text-caption text-muted">登录以继续使用智能记账</p>
         </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              label="账号"
              name="identifier"
              type="text"
              placeholder="邮箱或手机号"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              left={<UserRound size={18} className="text-muted" aria-hidden />}
            />

            <Input
              label="密码"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              left={<Lock size={18} className="text-muted" aria-hidden />}
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-all duration-fast hover:bg-primary/10 hover:text-primary active:scale-90"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden />
                  ) : (
                    <Eye size={18} aria-hidden />
                  )}
               </button>
              }
            />

            {error && (
              <p className="flex items-center gap-1.5 rounded-lg bg-error/[0.08] px-2.5 py-1.5 text-caption text-error" role="alert">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
               </svg>
                {error}
             </p>
            )}

            {/* 协议勾选（必须勾选才能登录） */}
            <div className="-mx-1 mt-1">
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
              action="login"
              onToken={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
            />

            <Button
              type="submit"
              block
              loading={loading}
              gradient
              className="mt-1"
            >
              登录
           </Button>

            <div className="flex items-center justify-between text-caption">
              <Link
                to="/register"
                className="group inline-flex items-center gap-1 text-primary transition-all duration-fast hover:text-primary-hover"
              >
                注册账号
                <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" />
             </Link>
              <Link to="/forgot-password" className="text-muted transition-colors duration-fast hover:text-primary">
                忘记密码？
             </Link>
           </div>
         </form>

          {/* 分隔线 */}
          <div className="my-5 flex items-center gap-3 text-overline text-muted/80">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
            或
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
         </div>

          {/* 体验模式入口 */}
          <button
            type="button"
            onClick={handleDemo}
            className="group mx-auto flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-caption text-muted transition-all duration-fast hover:text-primary"
          >
            <Eye size={15} aria-hidden className="transition-transform duration-fast group-hover:scale-110" />
            体验模式（无需注册，直接使用）
         </button>
       </div>

        {/* 底部免责声明 */}
        <p className="mt-5 text-center text-overline text-muted/70">
          登录即代表你已年满 14 周岁，并同意我们的服务条款
       </p>
     </div>

      {/* 协议详情底部抽屉 */}
      <AgreementSheet
        open={sheet !== null}
        type={sheet}
        onClose={() => setSheet(null)}
      />
   </div>
  );
}

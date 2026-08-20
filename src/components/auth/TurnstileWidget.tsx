/**
 * TurnstileWidget · Cloudflare Turnstile 人机验证组件
 *
 * 设计要点：
 * 1. 显式渲染模式：等待 api.js 加载完成后 render，避免 async/defer 时序问题
 * 2. 主题跟随系统（theme: 'auto'），size: 'flexible'（移动端自适应宽度）
 * 3. 暴露 ref.reset()：登录/注册失败后重置 widget（Turnstile token 单次有效）
 * 4. 未配置 VITE_TURNSTILE_SITE_KEY 时降级：渲染「未启用人机验证」占位，
 *    不阻塞本地开发调试（生产必须配置）
 * 5. 卸载时 remove widget，避免内存泄漏
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ?? '';
export const TURNSTILE_ENABLED = TURNSTILE_SITE_KEY.length > 0;

/** 等待 Turnstile SDK 就绪（脚本 async defer 加载时序不确定） */
function waitForTurnstile(timeoutMs = 10000): Promise<boolean> {
  if (typeof window !== 'undefined' && window.turnstile) return Promise.resolve(true);
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(timer);
        resolve(true);
      } else if (Date.now() - started > timeoutMs) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, 50);
  });
}

export interface TurnstileWidgetHandle {
  /** 重置 widget（token 失效后调用，例如登录失败） */
  reset: () => void;
}

interface TurnstileWidgetProps {
  /** 场景标识：与后端 action 校验一致 */
  action: 'login' | 'register' | 'reset_password';
  /** token 就绪回调（挑战成功后携带一次性 token） */
  onToken: (token: string) => void;
  /** 挑战失败回调 */
  onError?: (code: string) => void;
  /** token 过期回调 */
  onExpire?: () => void;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ action, onToken, onError, onExpire }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'error' | 'disabled'>(
      TURNSTILE_ENABLED ? 'loading' : 'disabled',
    );

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;
      let widgetId: string | null = null;

      (async () => {
        if (!TURNSTILE_ENABLED) return;
        const ok = await waitForTurnstile();
        if (cancelled || !ok || !containerRef.current) {
          if (!cancelled && !ok) setState('error');
          return;
        }
        try {
          widgetId = window.turnstile!.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            action,
            theme: 'auto',
            size: 'flexible',
            callback: (token: string) => {
              if (!cancelled) onToken(token);
            },
            'error-callback': (code: string) => {
              if (!cancelled) onError?.(code);
            },
            'expired-callback': () => {
              if (!cancelled) {
                onExpire?.();
                onToken('');
              }
            },
          });
          widgetIdRef.current = widgetId;
          if (!cancelled) setState('ready');
        } catch {
          if (!cancelled) setState('error');
        }
      })();

      return () => {
        cancelled = true;
        if (widgetId && window.turnstile) {
          try {
            window.turnstile.remove(widgetId);
          } catch {
            /* 忽略卸载异常 */
          }
        }
        widgetIdRef.current = null;
      };
    }, [action, onToken, onError, onExpire]);

    // 未配置 site key：降级占位（开发调试不阻塞）
    if (state === 'disabled') {
      return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border/70 bg-glass-bg px-3 py-2.5 text-caption text-muted">
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            未启用人机验证（本地调试模式）
          </span>
        </div>
      );
    }

    if (state === 'loading') {
      return (
        <div className="flex h-[65px] items-center justify-center rounded-lg bg-glass-bg text-caption text-muted">
          人机验证加载中…
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-error/30 bg-error/[0.06] px-3 py-2.5 text-caption text-error">
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            人机验证加载失败，请刷新重试
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-md px-2 py-0.5 font-medium text-primary transition-colors hover:bg-primary/10"
          >
            刷新
          </button>
        </div>
      );
    }

    return <div ref={containerRef} className="min-h-[65px] w-full" />;
  },
);

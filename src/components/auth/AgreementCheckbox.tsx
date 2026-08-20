/**
 * AgreementCheckbox · 协议勾选（用户协议 + 隐私政策）
 *
 * 设计要点：
 * - 玻璃态胶囊 + 未勾选时主色 30% 透明 / 勾选后主色实心 + spring 动效
 * - 内联真实 SVG check 图标（currentColor 主题自适应）
 * - 协议文案用主色下划线，点击触发回调由父级打开协议详情
 * - 错误态：边框转 error 色、右侧提示文案
 */
import type { ReactNode } from 'react';

interface AgreementCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  onOpenAgreement?: () => void;
  onOpenPrivacy?: () => void;
  error?: string;
}

export function AgreementCheckbox({
  checked,
  onChange,
  onOpenAgreement,
  onOpenPrivacy,
  error,
}: AgreementCheckboxProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`group flex cursor-pointer items-start gap-2.5 rounded-xl px-2 py-2 transition-all duration-base ease-spring
          ${error
            ? 'bg-error/[0.06] ring-1 ring-error/30'
            : 'hover:bg-primary/[0.04]'
          }`}
      >
        <span
          className={`mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-all duration-base ease-spring
            ${checked
              ? 'border-primary bg-primary shadow-[0_2px_8px_rgba(124,92,252,0.35)]'
              : error
                ? 'border-error/60 bg-white/60'
                : 'border-border bg-white/70 group-hover:border-primary/50'
            }`}
        >
          {checked && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[fadeIn_0.18s_ease-out]"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
           </svg>
          )}
       </span>

        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? 'agreement-error' : undefined}
        />

        <span className="select-none text-caption leading-[1.6] text-text-secondary">
          我已阅读并同意{' '}
          <AgreementLink onClick={onOpenAgreement}>《用户协议》</AgreementLink>
          {' '}与{' '}
          <AgreementLink onClick={onOpenPrivacy}>《隐私政策》</AgreementLink>
       </span>
     </label>

      {error && (
        <p
          id="agreement-error"
          role="alert"
          className="flex items-center gap-1 pl-8 text-caption text-error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
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
   </div>
  );
}

function AgreementLink({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center font-medium text-primary transition-colors duration-fast hover:text-primary-hover
        after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-current after:opacity-40"
    >
      {children}
   </button>
  );
}

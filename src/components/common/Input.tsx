/**
 * Input · 表单输入（Premium Glassmorphism + Minimalism）
 * glassmorphism 输入框，焦点发光效果，更精致的标签与提示
 */
import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  left?: ReactNode;
  right?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, left, right, className = '', id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  const hasError = !!error;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-caption font-medium text-text-secondary tracking-wide"
        >
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 transition-all duration-slow ease-spring
          ${hasError
            ? 'border-error/60 bg-error/5 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : 'border-border/60 bg-glass-bg backdrop-blur-[8px] shadow-glass focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.12),0_4px_16px_rgba(79,70,229,0.08)]'
          }`}
      >
        {left && (
          <span className="shrink-0 text-muted [&>svg]:h-4 [&>svg]:w-4">{left}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`min-h-[44px] w-full bg-transparent text-body outline-none placeholder:text-muted/60 ${className}`}
          {...rest}
        />
        {right && (
          <span className="shrink-0 text-muted [&>svg]:h-4 [&>svg]:w-4">{right}</span>
        )}
      </div>
      {error ? (
        <p className="flex items-center gap-1 text-caption text-error" role="alert">
          <span className="inline-block h-1 w-1 rounded-full bg-error" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption text-muted/80">{hint}</p>
      ) : null}
    </div>
  );
});
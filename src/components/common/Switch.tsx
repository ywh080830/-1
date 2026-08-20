/**
 * Switch · 开关（Premium Glassmorphism + Minimalism）
 * glassmorphism 轨道，spring 过渡，更精致的触控反馈
 */
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative flex h-7 w-12 items-center rounded-full p-1 transition-all duration-slow ease-spring
        ${checked
          ? 'bg-primary/80 shadow-[0_0_0_1px_rgba(79,70,229,0.2),inset_0_1px_2px_rgba(255,255,255,0.15)]'
          : 'bg-border-strong/60 shadow-glass backdrop-blur-[4px]'
        }
        ${disabled ? 'is-disabled' : 'hover:scale-105 active:scale-95'}`}
    >
      {/* 轨道内部光晕 */}
      <span
        className={`absolute inset-0 rounded-full transition-opacity duration-slow
          ${checked ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background:
            'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(99,102,241,0.05))',
        }}
      />
      <span
        className={`relative h-5 w-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-all duration-slow ease-spring
          ${checked ? 'translate-x-5' : 'translate-x-0'}
          ${checked ? 'shadow-[0_2px_8px_rgba(79,70,229,0.3)]' : ''}`}
      >
        {/* 开关钮上的小光点 */}
        <span
          className={`absolute inset-1.5 rounded-full transition-all duration-slow
            ${checked ? 'bg-primary/40 scale-100' : 'bg-border-strong/30 scale-0'}`}
        />
      </span>
    </button>
  );
}
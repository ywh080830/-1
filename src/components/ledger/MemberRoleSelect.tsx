/**
 * MemberRoleSelect · 成员角色选择（Glassmorphism 选择器）
 */
interface MemberRoleSelectProps {
  value: 'editor' | 'viewer';
  onChange: (role: 'editor' | 'viewer') => void;
  disabled?: boolean;
}

export function MemberRoleSelect({ value, onChange, disabled }: MemberRoleSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'editor' | 'viewer')}
      disabled={disabled}
      className="glass-sm min-h-[40px] rounded-xl border border-white/10 px-3 text-caption font-medium text-text outline-none transition-all duration-200 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10 disabled:is-disabled"
      aria-label="成员角色"
    >
      <option value="editor" className="bg-surface text-text">编辑</option>
      <option value="viewer" className="bg-surface text-text">只读</option>
    </select>
  );
}
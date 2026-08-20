/**
 * NumberKeypad · 3 列数字键盘（Glassmorphism 按键 + 渐变确认/运算符键）
 */
import { Delete } from 'lucide-react';

interface NumberKeypadProps {
  onDigit: (d: string) => void;
  onDot: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onEquals: () => void;
  onOperator: (op: '+' | '-' | '×' | '÷') => void;
}

const KEYS: Array<{ label: string; type: 'digit' | 'dot' | 'op' | 'clear' | 'back' | 'eq'; value?: string }> = [
  { label: '1', type: 'digit', value: '1' },
  { label: '2', type: 'digit', value: '2' },
  { label: '3', type: 'digit', value: '3' },
  { label: '÷', type: 'op', value: '÷' },
  { label: '4', type: 'digit', value: '4' },
  { label: '5', type: 'digit', value: '5' },
  { label: '6', type: 'digit', value: '6' },
  { label: '×', type: 'op', value: '×' },
  { label: '7', type: 'digit', value: '7' },
  { label: '8', type: 'digit', value: '8' },
  { label: '9', type: 'digit', value: '9' },
  { label: '-', type: 'op', value: '-' },
  { label: 'C', type: 'clear' },
  { label: '0', type: 'digit', value: '0' },
  { label: '.', type: 'dot' },
  { label: '+', type: 'op', value: '+' },
];

export function NumberKeypad({ onDigit, onDot, onBackspace, onClear, onEquals, onOperator }: NumberKeypadProps) {
  const handle = (key: (typeof KEYS)[number]) => {
    switch (key.type) {
      case 'digit':
        onDigit(key.value!);
        break;
      case 'dot':
        onDot();
        break;
      case 'op':
        onOperator(key.value as '+' | '-' | '×' | '÷');
        break;
      case 'clear':
        onClear();
        break;
      case 'back':
        onBackspace();
        break;
      case 'eq':
        onEquals();
        break;
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="数字键盘">
      {KEYS.map((key) => (
        <button
          key={key.label}
          type="button"
          onClick={() => handle(key)}
          className={`glass-sm flex h-[56px] items-center justify-center rounded-xl text-h3 font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 ${
            key.type === 'op'
              ? 'bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary hover:from-secondary/30 hover:to-secondary/10'
              : key.type === 'clear'
                ? 'text-text-secondary hover:bg-white/20'
                : 'text-text hover:bg-white/20'
          }`}
          aria-label={key.label === 'C' ? '清空' : key.label}
        >
          {key.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="glass-sm flex h-[56px] items-center justify-center rounded-xl text-text-secondary transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
        aria-label="退格"
      >
        <Delete size={20} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onEquals}
        className="flex h-[56px] items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
        aria-label="计算"
      >
        =
      </button>
    </div>
  );
}
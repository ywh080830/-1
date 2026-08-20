/**
 * useKeypad · 磁力键盘/计算器逻辑（金额表达式状态机）
 * 支持：数字、小数点、+ - × ÷、C 清空、⌫ 退格、= 计算
 */
import { useCallback, useState } from 'react';

const SAFE_RE = /^[\d+\-*/().\s]*$/;

function safeEval(expr: string): string | null {
  const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!SAFE_RE.test(cleaned)) return null;
  try {
    const result = new Function(`"use strict"; return (${cleaned});`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return String(Math.round(result * 100) / 100);
  } catch {
    return null;
  }
}

export interface KeypadApi {
  display: string;
  expression: string;
  inputDigit: (d: string) => void;
  inputDot: () => void;
  inputOperator: (op: '+' | '-' | '×' | '÷') => void;
  clear: () => void;
  backspace: () => void;
  equals: () => void;
  setValue: (v: string) => void;
}

export function useKeypad(): KeypadApi {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');

  const inputDigit = useCallback((d: string) => {
    if (!/^\d$/.test(d)) return;
    setDisplay((prev) => {
      if (prev === '0') return d;
      if (prev.includes('.')) {
        const [, dec] = prev.split('.');
        if (dec.length >= 2) return prev; // 最多两位小数
      }
      if (prev.replace('-', '').replace('.', '').length >= 10) return prev;
      return prev + d;
    });
  }, []);

  const inputDot = useCallback(() => {
    setDisplay((prev) => (prev.includes('.') ? prev : prev + '.'));
  }, []);

  const inputOperator = useCallback((op: '+' | '-' | '×' | '÷') => {
    setExpression((prev) => {
      const base = prev ? `${prev}${display}` : display;
      const trimmed = base.replace(/[+\-×÷]$/, '');
      return `${trimmed}${op}`;
    });
    setDisplay('0');
  }, [display]);

  const clear = useCallback(() => {
    setDisplay('0');
    setExpression('');
  }, []);

  const backspace = useCallback(() => {
    setDisplay((prev) => (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-')) ? '0' : prev.slice(0, -1)));
  }, []);

  const equals = useCallback(() => {
    const full = `${expression}${display}`;
    const result = safeEval(full);
    if (result !== null) {
      setDisplay(result);
      setExpression('');
    }
  }, [expression, display]);

  const setValue = useCallback((v: string) => {
    setDisplay(v === '' ? '0' : v);
    setExpression('');
  }, []);

  return { display, expression, inputDigit, inputDot, inputOperator, clear, backspace, equals, setValue };
}

/**
 * useCountUp · 数字滚动动画 hook
 * - 从 0 / from 平滑过渡到 target，时长可控
 * - 支持 format 回调（¥ 符号、千分位等）
 */
import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  /** 起始值（默认 0） */
  from?: number;
  /** 动画时长 ms（默认 900） */
  duration?: number;
  /** 缓动函数（默认 easeOutCubic） */
  easing?: (t: number) => number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export function useCountUp(target: number, options: UseCountUpOptions = {}) {
  const { from = 0, duration = 900, easing = easeOutQuart } = options;
  const [value, setValue] = useState<number>(from);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef<number>(from);
  const targetRef = useRef<number>(target);

  useEffect(() => {
    fromRef.current = value;
    targetRef.current = target;
    startRef.current = null;
    let raf = 0;
    const step = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easing(t);
      const next = fromRef.current + (targetRef.current - fromRef.current) * eased;
      setValue(next);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setValue(targetRef.current);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // 仅当 target 变化触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

export const countUpEasings = { easeOutCubic, easeOutQuart };

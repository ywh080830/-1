/**
 * 金额工具 · 技术文档 §7.1 / 03-API文档 §1.4
 * - API/前端传输一律 string decimal（如 "38.50"）
 * - 计算一律转整数分（×100 后整数运算）避免浮点误差
 * - 展示经 format() → toFixed(2)
 */

/** 解析 string/number 为整数分（安全整数，避开浮点） */
export function toCents(value: string | number): number {
  if (value === null || value === undefined || value === '') return 0;
  const s = String(value).trim();
  if (s === '' || s === '-') return 0;
  const neg = s.startsWith('-');
  const clean = s.replace('-', '');
  const [intPart, decPart = ''] = clean.split('.');
  const int = Number.parseInt(intPart || '0', 10);
  const dec = Number.parseInt((decPart + '00').slice(0, 2), 10);
  if (Number.isNaN(int) || Number.isNaN(dec)) return 0;
  return (int * 100 + dec) * (neg ? -1 : 1);
}

/** 整数分 → string decimal（"38.50"） */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100);
  const dec = abs % 100;
  return `${sign}${int}.${String(dec).padStart(2, '0')}`;
}

/** 格式化展示：输入 string/number → "1,234.56"（千分位 + 两位小数） */
export function format(value: string | number): string {
  const cents = toCents(value);
  const raw = centsToDecimal(cents);
  const [int, dec] = raw.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}.${dec}`;
}

/** 不带千分位展示（表单输入场景） */
export function formatPlain(value: string | number): string {
  return centsToDecimal(toCents(value));
}

/** 金额是否有效：非负且 > 0 */
export function isValidAmount(value: string): boolean {
  const cents = toCents(value);
  return Number.isFinite(cents) && cents > 0;
}

/** 加 */
export function add(a: string | number, b: string | number): string {
  return centsToDecimal(toCents(a) + toCents(b));
}

/** 减 */
export function subtract(a: string | number, b: string | number): string {
  return centsToDecimal(toCents(a) - toCents(b));
}

/** 乘（结果保留两位小数，整数分运算） */
export function multiply(a: string | number, b: string | number): string {
  // a/b 均转分相乘 → 结果单位是"万分"，再换算回分并四舍五入
  const ca = toCents(a);
  const cb = toCents(b);
  const tenThousand = ca * cb;
  const cents = Math.round(tenThousand / 100);
  return centsToDecimal(cents);
}

/** 除（结果保留两位小数） */
export function divide(a: string | number, b: string | number): string {
  const cb = toCents(b);
  if (cb === 0) return '0.00';
  const ca = toCents(a);
  const cents = Math.round((ca / cb) * 100);
  return centsToDecimal(cents);
}

/** 取绝对值（decimal string） */
export function abs(value: string | number): string {
  const cents = Math.abs(toCents(value));
  return centsToDecimal(cents);
}

/** 收支带符号展示：收入 "+1,234.56"，支出 "-1,234.56" */
export function formatSigned(value: string | number, type: 'income' | 'expense' | 'transfer'): string {
  if (type === 'transfer') return format(value);
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${format(abs(value))}`;
}

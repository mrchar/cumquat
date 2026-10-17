/**
 * 日期模型共享的纯函数工具（无响应式、无副作用）。
 */

export const pad2 = (value: number): string => String(value).padStart(2, '0');

/** 解析字符串（yyyy-MM-dd / yyyy-MM/yyyy）或时间值为本地日期；非法返回 null */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/.exec(trimmed);
  if (match) {
    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month ?? 1) - 1, Number(day ?? 1));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** 按 pattern（yyyy / MM / dd）格式化日期 */
export function formatDate(date: Date | null, pattern = 'yyyy-MM-dd'): string {
  if (!date) return '';
  return pattern
    .replace('yyyy', String(date.getFullYear()))
    .replace('MM', pad2(date.getMonth() + 1))
    .replace('dd', pad2(date.getDate()));
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  const maxDay = getDaysInMonth(next.getFullYear(), next.getMonth());
  next.setDate(Math.min(day, maxDay));
  return next;
}

export function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * 12);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** 某天所属周的第一天（firstDayOfWeek: 0=周日 1=周一） */
export function startOfWeek(date: Date, firstDayOfWeek = 1): Date {
  const day = date.getDay();
  const diff = (day - firstDayOfWeek + 7) % 7;
  return addDays(startOfDay(date), -diff);
}

/** 比较两个日期零点的先后：a < b → -1 */
export function compareDay(a: Date, b: Date): number {
  const za = startOfDay(a).getTime();
  const zb = startOfDay(b).getTime();
  return Math.sign(za - zb);
}

/** 解析 HH:mm:ss / HH:mm 时间串 */
export function parseTime(value: string | null | undefined): {
  hour: number;
  minute: number;
  second: number;
} | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, hour, minute, second] = match;
  return {
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second ?? 0),
  };
}

export function formatTime(
  hour: number,
  minute: number,
  second: number,
  useSeconds = true,
): string {
  const base = `${pad2(hour)}:${pad2(minute)}`;
  return useSeconds ? `${base}:${pad2(second)}` : base;
}

/** 将时间串换算为当天秒数，便于范围比较 */
export function timeToSeconds(value: string | null | undefined): number | null {
  const parsed = parseTime(value);
  if (!parsed) return null;
  return parsed.hour * 3600 + parsed.minute * 60 + parsed.second;
}

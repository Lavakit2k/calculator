// Datumshilfen auf Basis von 'YYYY-MM-DD'-Strings (lokale Zeit, keine Zeitzonenfallen).

const pad = (n: number) => String(n).padStart(2, '0');

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const today = () => toIso(new Date());

export function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function addMonths(s: string, n: number): string {
  const d = parseIso(s);
  return toIso(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** 0 = Montag … 6 = Sonntag */
export function weekday(s: string): number {
  return (parseIso(s).getDay() + 6) % 7;
}

export const monthStart = (s: string) => s.slice(0, 8) + '01';

export function monthEnd(s: string): string {
  const d = parseIso(s);
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export const weekStart = (s: string) => addDays(s, -weekday(s));
export const weekEnd = (s: string) => addDays(weekStart(s), 6);

export function daysBetween(a: string, b: string): number {
  return Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / 86_400_000);
}

/** Alle Tage von a bis b (inklusive). */
export function eachDay(a: string, b: string): string[] {
  const out: string[] = [];
  for (let d = a; d <= b; d = addDays(d, 1)) out.push(d);
  return out;
}

export type RangeKind = 'day' | 'week' | 'month' | 'year';

export interface Range {
  from: string;
  to: string;
}

export function rangeOf(kind: RangeKind, ref: string): Range {
  switch (kind) {
    case 'day':
      return { from: ref, to: ref };
    case 'week':
      return { from: weekStart(ref), to: weekEnd(ref) };
    case 'month':
      return { from: monthStart(ref), to: monthEnd(ref) };
    case 'year':
      return { from: ref.slice(0, 4) + '-01-01', to: ref.slice(0, 4) + '-12-31' };
  }
}

/** Verschiebt ein Referenzdatum um n Tage/Wochen/Monate/Jahre. */
export function shift(kind: RangeKind, ref: string, n: number): string {
  switch (kind) {
    case 'day':
      return addDays(ref, n);
    case 'week':
      return addDays(ref, 7 * n);
    case 'month':
      return addMonths(ref, n);
    case 'year':
      return addMonths(ref, 12 * n);
  }
}

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function fmtDate(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}.${m}.${y}`;
}

export function fmtShort(s: string): string {
  const [, m, d] = s.split('-');
  return `${d}.${m}.`;
}

export const monthLabel = (s: string, long = false) =>
  `${(long ? MONTHS_LONG : MONTHS)[Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}`;

/** ISO-Kalenderwoche */
export function isoWeek(s: string): number {
  const thu = parseIso(addDays(weekStart(s), 3));
  const jan1 = new Date(thu.getFullYear(), 0, 1);
  return Math.floor((thu.getTime() - jan1.getTime()) / 86_400_000 / 7) + 1;
}

export function rangeLabel(kind: RangeKind, ref: string): string {
  const r = rangeOf(kind, ref);
  switch (kind) {
    case 'day':
      return `${WEEKDAYS[weekday(ref)]}, ${fmtDate(ref)}`;
    case 'week':
      return `KW ${isoWeek(ref)} · ${fmtShort(r.from)}–${fmtShort(r.to)}`;
    case 'month':
      return monthLabel(ref, true);
    case 'year':
      return ref.slice(0, 4);
  }
}

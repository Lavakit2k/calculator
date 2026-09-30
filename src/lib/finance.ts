// Reine Umrechnungsfunktionen für das Finanzmodul.
//
// Regeln:
// - Wiederkehrende Einträge zählen in jedem Monat, in dem sie aktiv sind (Start ≤ Monatsende, Ende ≥ Monatsanfang),
//   mit ihrem Monatswert: wöchentlich × 52/12, monatlich × 1, vierteljährlich ÷ 3, jährlich ÷ 12.
// - Einmalige Einträge zählen voll im Monat ihres Startdatums.
// - Ein Jahr ist die Summe seiner zwölf Monate (120 € jährlich, ganzjährig aktiv = 120 €/Jahr = 10 €/Monat).
import { addMonths, monthEnd, monthStart } from './dates';
import type { Category, FinEntry, Interval } from './types';

export type FinMode = 'month' | 'year';

export const PER_MONTH: Record<Exclude<Interval, 'once'>, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export const INTERVAL_LABEL: Record<Interval, string> = {
  once: 'einmalig',
  weekly: 'wöchentlich',
  monthly: 'monatlich',
  quarterly: 'vierteljährlich',
  yearly: 'jährlich',
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Rechnet einen wiederkehrenden Betrag auf Monat oder Jahr um (ohne Datumsbezug). */
export function convert(amount: number, interval: Exclude<Interval, 'once'>, mode: FinMode): number {
  const perMonth = amount * PER_MONTH[interval];
  return mode === 'month' ? perMonth : perMonth * 12;
}

export function isActiveInMonth(e: FinEntry, month: string): boolean {
  const from = monthStart(month);
  const to = monthEnd(month);
  if (e.interval === 'once') return e.start >= from && e.start <= to;
  return e.start <= to && (!e.end || e.end >= from);
}

/** Betrag, den ein Eintrag zu einem Monat beiträgt (ohne Vorzeichen). */
export function amountInMonth(e: FinEntry, month: string): number {
  if (!isActiveInMonth(e, month)) return 0;
  return e.interval === 'once' ? e.amount : e.amount * PER_MONTH[e.interval];
}

/** Betrag im gewählten Zeitraum: Monat von `ref` bzw. Summe aller Monate des Jahres von `ref`. */
export function amountInPeriod(e: FinEntry, mode: FinMode, ref: string): number {
  if (mode === 'month') return amountInMonth(e, ref);
  let sum = 0;
  for (let m = ref.slice(0, 4) + '-01-01', i = 0; i < 12; i++, m = addMonths(m, 1)) sum += amountInMonth(e, m);
  return sum;
}

export interface Slice {
  id: string;
  name: string;
  color: string;
  value: number;
}

export interface FinSummary {
  income: number;
  expense: number;
  rest: number;
  expenseByCategory: Slice[];
}

export function summarize(entries: FinEntry[], categories: Category[], mode: FinMode, ref: string): FinSummary {
  let income = 0;
  let expense = 0;
  const byCat = new Map<string, number>();
  for (const e of entries) {
    const v = amountInPeriod(e, mode, ref);
    if (!v) continue;
    if (e.type === 'income') income += v;
    else {
      expense += v;
      byCat.set(e.categoryId, (byCat.get(e.categoryId) ?? 0) + v);
    }
  }
  const expenseByCategory = [...byCat].map(([id, value]) => {
    const c = categories.find((x) => x.id === id);
    return { id, name: c?.name ?? 'Ohne Kategorie', color: c?.color ?? '#888888', value: round2(value) };
  });
  expenseByCategory.sort((a, b) => b.value - a.value);
  return { income: round2(income), expense: round2(expense), rest: round2(income - expense), expenseByCategory };
}

/** Ausgaben einer Kategorie in einem Monat (für Soll-Plan und Ziele). */
export function categoryExpenseInMonth(entries: FinEntry[], categoryId: string, month: string): number {
  let sum = 0;
  for (const e of entries) if (e.type === 'expense' && e.categoryId === categoryId) sum += amountInMonth(e, month);
  return round2(sum);
}

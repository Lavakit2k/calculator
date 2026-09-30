import { describe, expect, it } from 'vitest';
import { amountInMonth, amountInPeriod, categoryExpenseInMonth, convert, isActiveInMonth, summarize } from './finance';
import type { Category, FinEntry } from './types';

const entry = (p: Partial<FinEntry>): FinEntry => ({
  id: Math.random().toString(36),
  name: 'x',
  amount: 100,
  type: 'expense',
  categoryId: 'c1',
  interval: 'monthly',
  start: '2026-01-01',
  ...p,
});

describe('convert', () => {
  it('jährlich → Monat', () => expect(convert(120, 'yearly', 'month')).toBe(10));
  it('monatlich → Jahr', () => expect(convert(10, 'monthly', 'year')).toBe(120));
  it('vierteljährlich → Monat', () => expect(convert(30, 'quarterly', 'month')).toBe(10));
  it('wöchentlich → Jahr = 52 Wochen', () => expect(convert(10, 'weekly', 'year')).toBeCloseTo(520));
  it('wöchentlich → Monat', () => expect(convert(12, 'weekly', 'month')).toBeCloseTo(52));
});

describe('isActiveInMonth', () => {
  it('berücksichtigt Start und Ende', () => {
    const e = entry({ start: '2026-03-15', end: '2026-06-10' });
    expect(isActiveInMonth(e, '2026-02-01')).toBe(false);
    expect(isActiveInMonth(e, '2026-03-01')).toBe(true);
    expect(isActiveInMonth(e, '2026-06-01')).toBe(true);
    expect(isActiveInMonth(e, '2026-07-01')).toBe(false);
  });
  it('ohne Ende läuft unbegrenzt', () => expect(isActiveInMonth(entry({}), '2030-12-01')).toBe(true));
  it('einmalig nur im Monat des Datums', () => {
    const e = entry({ interval: 'once', start: '2026-05-20' });
    expect(isActiveInMonth(e, '2026-05-01')).toBe(true);
    expect(isActiveInMonth(e, '2026-06-01')).toBe(false);
  });
});

describe('amountInPeriod', () => {
  it('120 € jährlich = 10 €/Monat', () => {
    const e = entry({ amount: 120, interval: 'yearly' });
    expect(amountInMonth(e, '2026-04-01')).toBe(10);
    expect(amountInPeriod(e, 'year', '2026-04-01')).toBeCloseTo(120);
  });
  it('Jahr zählt nur aktive Monate', () => {
    const e = entry({ amount: 50, start: '2026-07-01' });
    expect(amountInPeriod(e, 'year', '2026-01-01')).toBe(300);
    expect(amountInPeriod(e, 'year', '2025-01-01')).toBe(0);
  });
  it('einmalig zählt im Jahr voll', () => {
    const e = entry({ amount: 500, interval: 'once', start: '2026-11-03' });
    expect(amountInPeriod(e, 'year', '2026-02-01')).toBe(500);
    expect(amountInPeriod(e, 'month', '2026-11-01')).toBe(500);
    expect(amountInPeriod(e, 'month', '2026-10-01')).toBe(0);
  });
});

describe('summarize', () => {
  const cats: Category[] = [
    { id: 'c1', name: 'Wohnen', color: '#111' },
    { id: 'c2', name: 'Essen', color: '#222' },
  ];
  const entries = [
    entry({ type: 'income', amount: 2000, categoryId: 'inc' }),
    entry({ amount: 800, categoryId: 'c1' }),
    entry({ amount: 1200, interval: 'yearly', categoryId: 'c2' }),
    entry({ amount: 50, interval: 'weekly', categoryId: 'c2', start: '2027-01-01' }),
  ];

  it('Monat: Einnahmen, Ausgaben, Übrig und Kategorien', () => {
    const s = summarize(entries, cats, 'month', '2026-09-01');
    expect(s.income).toBe(2000);
    expect(s.expense).toBe(900);
    expect(s.rest).toBe(1100);
    expect(s.expenseByCategory.map((x) => [x.name, x.value])).toEqual([
      ['Wohnen', 800],
      ['Essen', 100],
    ]);
  });

  it('Jahr = zwölf Monate', () => {
    const s = summarize(entries, cats, 'year', '2026-09-01');
    expect(s.income).toBe(24000);
    expect(s.expense).toBe(9600 + 1200);
  });

  it('negativer Rest', () => {
    const s = summarize([entry({ amount: 10 })], cats, 'month', '2026-09-01');
    expect(s.rest).toBe(-10);
  });
});

describe('categoryExpenseInMonth', () => {
  it('summiert nur Ausgaben der Kategorie', () => {
    const list = [
      entry({ amount: 200, categoryId: 'food' }),
      entry({ amount: 60, interval: 'quarterly', categoryId: 'food' }),
      entry({ amount: 999, categoryId: 'food', type: 'income' }),
      entry({ amount: 5, categoryId: 'other' }),
    ];
    expect(categoryExpenseInMonth(list, 'food', '2026-03-01')).toBe(220);
  });
});

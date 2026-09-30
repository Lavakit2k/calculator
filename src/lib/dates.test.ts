import { describe, expect, it } from 'vitest';
import { addMonths, eachDay, isoWeek, monthEnd, rangeOf, weekday, weekStart } from './dates';

describe('dates', () => {
  it('Wochentag mit Montag = 0', () => {
    expect(weekday('2026-09-28')).toBe(0); // Montag
    expect(weekday('2026-10-04')).toBe(6); // Sonntag
  });
  it('Wochenbeginn', () => expect(weekStart('2026-10-01')).toBe('2026-09-28'));
  it('Monatsende inkl. Schaltjahr', () => {
    expect(monthEnd('2024-02-10')).toBe('2024-02-29');
    expect(monthEnd('2026-02-10')).toBe('2026-02-28');
  });
  it('Monate addieren über Jahresgrenze', () => expect(addMonths('2026-11-15', 3)).toBe('2027-02-01'));
  it('Tage über Zeitumstellung zählen', () => expect(eachDay('2026-10-24', '2026-10-27')).toHaveLength(4));
  it('Bereiche', () => {
    expect(rangeOf('month', '2026-09-30')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(rangeOf('year', '2026-09-30')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
  it('ISO-Kalenderwoche', () => {
    expect(isoWeek('2026-01-01')).toBe(1);
    expect(isoWeek('2027-01-01')).toBe(53);
  });
});

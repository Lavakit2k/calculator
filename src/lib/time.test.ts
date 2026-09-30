import { describe, expect, it } from 'vitest';
import { blockAppliesOn, blockMinutes, minutesByCategory, timeSlices, UNTRACKED_ID } from './time';
import type { Activity, TimeBlock } from './types';

const block = (p: Partial<TimeBlock>): TimeBlock => ({
  id: 'b',
  label: 'Schule',
  categoryId: 'school',
  weekdays: [0, 1, 2, 3, 4],
  from: '08:00',
  to: '13:00',
  validFrom: '2026-01-01',
  ...p,
});

const act = (date: string, categoryId: string, minutes: number): Activity => ({ id: date + categoryId, date, categoryId, minutes });

describe('blockMinutes', () => {
  it('normal', () => expect(blockMinutes({ from: '08:00', to: '13:15' })).toBe(315));
  it('über Mitternacht', () => expect(blockMinutes({ from: '22:30', to: '06:30' })).toBe(480));
  it('gleiche Zeit = 24 h', () => expect(blockMinutes({ from: '00:00', to: '00:00' })).toBe(1440));
});

describe('blockAppliesOn', () => {
  const b = block({ validTo: '2026-12-31' });
  it('an Werktagen', () => {
    expect(blockAppliesOn(b, '2026-09-28')).toBe(true); // Mo
    expect(blockAppliesOn(b, '2026-10-03')).toBe(false); // Sa
  });
  it('außerhalb der Gültigkeit', () => {
    expect(blockAppliesOn(b, '2025-12-29')).toBe(false);
    expect(blockAppliesOn(b, '2027-01-04')).toBe(false);
  });
});

describe('minutesByCategory', () => {
  it('kombiniert Aktivitäten und Blöcke in einer Woche', () => {
    const m = minutesByCategory(
      [act('2026-09-29', 'sport', 60), act('2026-10-05', 'sport', 90), act('2026-10-01', 'school', 30)],
      [block({}), block({ id: 's', categoryId: 'sleep', weekdays: [0, 1, 2, 3, 4, 5, 6], from: '23:00', to: '07:00' })],
      { from: '2026-09-28', to: '2026-10-04' },
    );
    expect(m.get('sport')).toBe(60);
    expect(m.get('school')).toBe(5 * 300 + 30);
    expect(m.get('sleep')).toBe(7 * 480);
  });
});

describe('timeSlices', () => {
  const range = { from: '2026-09-28', to: '2026-09-28' };
  it('Rest des Tages ist „nicht erfasst“', () => {
    const { slices, tracked, total } = timeSlices([act('2026-09-28', 'sport', 120)], [], [{ id: 'sport', name: 'Sport', color: '#f00' }], range);
    expect(total).toBe(1440);
    expect(tracked).toBe(120);
    expect(slices.find((s) => s.id === UNTRACKED_ID)?.value).toBe(1320);
  });
  it('Extra-Anteile zählen mit, Überbuchung ergibt keinen negativen Rest', () => {
    const { slices } = timeSlices([act('2026-09-28', 'x', 1400)], [], [], range, [
      { id: 'screen', name: 'Bildschirm', color: '#000', value: 100 },
    ]);
    expect(slices.map((s) => s.id)).toEqual(['x', 'screen']);
  });
});

// Reine Funktionen für das Zeitmodul.
// Wiederkehrende Blöcke zählen mit ihrer vollen Dauer an dem Wochentag, an dem sie beginnen
// (Schlaf So 22:30–06:30 zählt also 8 h zum Sonntag).
import { eachDay, weekday, type Range } from './dates';
import type { Slice } from './finance';
import type { Activity, Category, TimeBlock } from './types';

export const DAY_MIN = 24 * 60;
export const UNTRACKED_ID = 'untracked';

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Dauer eines Blocks in Minuten; Ende vor Beginn heißt über Mitternacht. */
export function blockMinutes(b: Pick<TimeBlock, 'from' | 'to'>): number {
  const d = toMin(b.to) - toMin(b.from);
  return d > 0 ? d : d + DAY_MIN;
}

export function blockAppliesOn(b: TimeBlock, date: string): boolean {
  return b.weekdays.includes(weekday(date)) && date >= b.validFrom && (!b.validTo || date <= b.validTo);
}

/** Erfasste Minuten je Kategorie im Zeitraum (Aktivitäten + Blöcke). */
export function minutesByCategory(activities: Activity[], blocks: TimeBlock[], range: Range): Map<string, number> {
  const out = new Map<string, number>();
  const add = (id: string, m: number) => out.set(id, (out.get(id) ?? 0) + m);
  for (const a of activities) if (a.date >= range.from && a.date <= range.to) add(a.categoryId, a.minutes);
  for (const day of eachDay(range.from, range.to)) {
    for (const b of blocks) if (blockAppliesOn(b, day)) add(b.categoryId, blockMinutes(b));
  }
  return out;
}

export const categoryMinutes = (activities: Activity[], blocks: TimeBlock[], categoryId: string, range: Range) =>
  minutesByCategory(activities, blocks, range).get(categoryId) ?? 0;

/**
 * Anteile für das Zeit-Kreisdiagramm inkl. „nicht erfasst“.
 * `extra` sind zusätzliche Anteile (z. B. Bildschirmzeit), die ebenfalls vom Rest abgezogen werden.
 */
export function timeSlices(
  activities: Activity[],
  blocks: TimeBlock[],
  categories: Category[],
  range: Range,
  extra: Slice[] = [],
): { slices: Slice[]; tracked: number; total: number } {
  const byCat = minutesByCategory(activities, blocks, range);
  const slices: Slice[] = [...byCat].map(([id, value]) => {
    const c = categories.find((x) => x.id === id);
    return { id, name: c?.name ?? 'Ohne Kategorie', color: c?.color ?? '#888888', value };
  });
  slices.sort((a, b) => b.value - a.value);
  slices.push(...extra.filter((e) => e.value > 0));
  const total = eachDay(range.from, range.to).length * DAY_MIN;
  const tracked = slices.reduce((s, x) => s + x.value, 0);
  const untracked = Math.max(0, total - tracked);
  if (untracked > 0) slices.push({ id: UNTRACKED_ID, name: 'Nicht erfasst', color: 'var(--untracked)', value: untracked });
  return { slices, tracked, total };
}

import type { AppData, Category, Settings } from './types';
import { emptyData } from './db';

export const PALETTE = [
  '#4f7cff', '#2bb3a3', '#f2a93b', '#e5566b', '#8e6cef', '#3fa9f5',
  '#6cbf4f', '#d9679f', '#9a7b5f', '#7d8a99', '#f07a3c', '#20c0d0',
];

const cats = (prefix: string, names: string[]): Category[] =>
  names.map((name, i) => ({ id: `${prefix}-${i}`, name, color: PALETTE[i % PALETTE.length] }));

export const DEFAULT_SETTINGS: Settings = { id: 'settings', autoLockMinutes: 5, screenInTime: false };

export function defaultData(): AppData {
  return {
    ...emptyData(),
    finCategories: cats('fc', [
      'Wohnen', 'Lebensmittel', 'Essen gehen', 'Mobilität', 'Abos & Handy',
      'Freizeit', 'Kleidung', 'Sparen', 'Gehalt', 'Sonstiges',
    ]),
    timeCategories: cats('tc', ['Schule', 'Schlaf', 'Projekte', 'Sport', 'Freizeit', 'Haushalt']),
    settings: [DEFAULT_SETTINGS],
  };
}

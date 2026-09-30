// Datenmodell der App. Datumsangaben immer als 'YYYY-MM-DD', Dauern in Minuten, Beträge in EUR.

export type ID = string;

export interface Category {
  id: ID;
  name: string;
  color: string;
}

export type FinType = 'income' | 'expense';
export type Interval = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface FinEntry {
  id: ID;
  name: string;
  amount: number;
  type: FinType;
  categoryId: ID;
  interval: Interval;
  start: string;
  end?: string;
}

export interface Activity {
  id: ID;
  date: string;
  categoryId: ID;
  minutes: number;
  note?: string;
}

/** Wiederkehrender Block, z. B. Schule Mo–Fr 08:00–13:00 oder Schlaf 22:30–06:30. */
export interface TimeBlock {
  id: ID;
  label: string;
  categoryId: ID;
  weekdays: number[]; // 0 = Montag … 6 = Sonntag
  from: string; // 'HH:MM'
  to: string; // 'HH:MM', kleiner als from = über Mitternacht
  validFrom: string;
  validTo?: string;
}

export type Device = 'phone' | 'pc';
export type ScreenCat = 'useful' | 'entertainment' | 'youtube' | 'other';
export type ScreenValues = Record<ScreenCat, number>;

export interface ScreenDay {
  id: string; // Datum 'YYYY-MM-DD'
  phone: ScreenValues;
  pc: ScreenValues;
}

export type Domain = 'finance' | 'time' | 'screen';
export type Period = 'week' | 'month';

/**
 * Referenz auf eine Kategorie:
 * finance/time: Kategorie-ID, screen: '<gerät>:<kategorie>' mit gerät = phone | pc | all.
 */
export interface Target {
  id: ID;
  domain: Domain;
  ref: string;
  period: Period;
  kind: 'max' | 'min';
  value: number; // EUR bzw. Minuten
}

export interface Goal {
  id: ID;
  name: string;
  domain: Domain;
  ref: string;
  period: Period;
  startValue: number;
  targetValue: number;
  from: string;
  to: string;
}

export interface Settings {
  id: 'settings';
  autoLockMinutes: number;
  screenInTime: boolean;
}

export interface AppData {
  finCategories: Category[];
  finEntries: FinEntry[];
  timeCategories: Category[];
  activities: Activity[];
  blocks: TimeBlock[];
  screenDays: ScreenDay[];
  targets: Target[];
  goals: Goal[];
  settings: Settings[];
}

export type Collection = keyof AppData;
export type Item<C extends Collection> = AppData[C][number];

export const COLLECTIONS: Collection[] = [
  'finCategories',
  'finEntries',
  'timeCategories',
  'activities',
  'blocks',
  'screenDays',
  'targets',
  'goals',
  'settings',
];

const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export const fmtEur = (n: number) => eur.format(n);

/** 95 → '1:35 h', 30 → '30 min' */
export function fmtMin(min: number): string {
  const m = Math.round(min);
  if (Math.abs(m) < 60) return `${m} min`;
  const sign = m < 0 ? '-' : '';
  const a = Math.abs(m);
  return `${sign}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')} h`;
}

/** Minuten als h:mm für Eingabefelder, 0 → '' */
export function minToInput(min: number): string {
  if (!min) return '';
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Liest eine Dauer: '90' → 90 min, '1:30' → 90, '1,5h' → 90, '2h 15' → 135, '45m' → 45.
 * Leere Eingabe → 0, ungültig → null.
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase().replace(',', '.');
  if (!s) return 0;
  let m = s.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null;
  m = s.match(/^(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*(?:m|min)?)?$/);
  if (m) return Math.round(Number(m[1]) * 60 + Number(m[2] ?? 0));
  m = s.match(/^(\d+)\s*(?:m|min)?$/);
  if (m) return Number(m[1]);
  return null;
}

/** '12,50' oder '12.50' → 12.5, ungültig → null */
export function parseAmount(input: string): number | null {
  const s = input.trim().replace(/\s|€/g, '');
  if (!s) return null;
  const norm = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(norm);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export const uid = () => crypto.randomUUID();

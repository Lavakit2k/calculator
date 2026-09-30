// Theme ist nicht sensibel und wird schon vor dem Entsperren gebraucht → localStorage.
export type Theme = 'system' | 'light' | 'dark';

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(t: Theme = getTheme()) {
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem('theme', t);
  } catch {
    /* privater Modus */
  }
  applyTheme(t);
}

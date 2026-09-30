// Minimaler Hash-Router (funktioniert ohne Server-Konfiguration auf GitHub Pages).
import { useEffect, useState } from 'react';

export type Route = 'overview' | 'finance' | 'time' | 'screen' | 'goals' | 'settings';
export const ROUTES: Route[] = ['overview', 'finance', 'time', 'screen', 'goals', 'settings'];

function current(): Route {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'overview';
}

export function useRoute(): Route {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const on = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (r: Route) => `#/${r}`;

import { Icon, type IconName } from './components/Icon';
import { href, useRoute, type Route } from './lib/router';
import { useStore } from './lib/store';
import { Finance } from './pages/Finance';
import { Setup, Unlock } from './pages/Lock';
import { Time } from './pages/Time';
import { Placeholder } from './pages/Placeholder';

// [Route, Bezeichnung, Kurzform für die Bottom-Navigation, Icon]
const NAV: [Route, string, string, IconName][] = [
  ['overview', 'Übersicht', 'Übersicht', 'overview'],
  ['finance', 'Finanzen', 'Finanzen', 'finance'],
  ['time', 'Zeit', 'Zeit', 'time'],
  ['screen', 'Bildschirmzeit', 'Bildschirm', 'screen'],
  ['goals', 'Ziele', 'Ziele', 'goals'],
  ['settings', 'Einstellungen', 'Optionen', 'settings'],
];

const PAGES: Record<Route, () => React.JSX.Element> = {
  overview: () => <Placeholder title="Übersicht" />,
  finance: Finance,
  time: Time,
  screen: () => <Placeholder title="Bildschirmzeit" />,
  goals: () => <Placeholder title="Ziele" />,
  settings: () => <Placeholder title="Einstellungen" />,
};

export default function App() {
  const { status, lock } = useStore();
  const route = useRoute();

  if (status === 'loading') return <div className="lock" />;
  if (status === 'setup') return <Setup />;
  if (status === 'locked') return <Unlock />;

  const Page = PAGES[route];
  return (
    <div className="layout">
      <nav className="nav" aria-label="Hauptnavigation">
        <div className="nav-brand">Finanz &amp; Zeit</div>
        {NAV.map(([r, label, short, icon]) => (
          <a key={r} href={href(r)} className={r === route ? 'active' : ''} aria-current={r === route ? 'page' : undefined}>
            <Icon name={icon} />
            <span className="long">{label}</span>
            <span className="short">{short}</span>
          </a>
        ))}
        <button className="nav-lock" onClick={lock}>
          <Icon name="lock" />
          <span>Sperren</span>
        </button>
      </nav>
      <main className="main">
        <Page />
      </main>
    </div>
  );
}

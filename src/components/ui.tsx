// Wiederverwendbare Bausteine: Karte, Modal, Segment-Umschalter, Zeitraum-Navigation, Leerzustand.
import { useEffect, type ReactNode } from 'react';
import { rangeLabel, shift, today, type RangeKind } from '../lib/dates';
import { Icon } from './Icon';

export function Card({ title, action, children }: { title?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      {(title || action) && (
        <header className="card-head">
          {title && <h2>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="card-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Schließen">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={v === value} className={v === value ? 'active' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function PeriodNav({ kind, value, onChange }: { kind: RangeKind; value: string; onChange: (v: string) => void }) {
  return (
    <div className="period-nav">
      <button className="icon-btn" onClick={() => onChange(shift(kind, value, -1))} aria-label="Zurück">
        <Icon name="left" />
      </button>
      <button className="period-label" onClick={() => onChange(today())} title="Zu heute springen">
        {rangeLabel(kind, value)}
      </button>
      <button className="icon-btn" onClick={() => onChange(shift(kind, value, 1))} aria-label="Weiter">
        <Icon name="right" />
      </button>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Dot({ color }: { color: string }) {
  return <span className="dot" style={{ background: color }} />;
}

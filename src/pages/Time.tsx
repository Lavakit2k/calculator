import { useMemo, useState } from 'react';
import { CategoryManager } from '../components/CategoryManager';
import { Donut } from '../components/Donut';
import { Icon } from '../components/Icon';
import { Card, Dot, Empty, Modal, PeriodNav, Segmented } from '../components/ui';
import { fmtDate, rangeOf, today, WEEKDAYS, type RangeKind } from '../lib/dates';
import { fmtMin, minToInput, parseDuration, uid } from '../lib/format';
import { useStore } from '../lib/store';
import { blockMinutes, timeSlices } from '../lib/time';
import type { Activity, TimeBlock } from '../lib/types';

export type TimeKind = Extract<RangeKind, 'day' | 'week' | 'month'>;
export const TIME_KINDS: [TimeKind, string][] = [['day', 'Tag'], ['week', 'Woche'], ['month', 'Monat']];

export function TimeDonut({ kind, refDate }: { kind: TimeKind; refDate: string }) {
  const { data } = useStore();
  const { slices, tracked } = useMemo(
    () => timeSlices(data.activities, data.blocks, data.timeCategories, rangeOf(kind, refDate)),
    [data, kind, refDate],
  );
  return <Donut data={slices} format={fmtMin} center={`${fmtMin(tracked)} erfasst`} />;
}

export function Time() {
  const { data } = useStore();
  const [kind, setKind] = useState<TimeKind>('day');
  const [refDate, setRefDate] = useState(today);
  const [editAct, setEditAct] = useState<Activity | null>(null);
  const [editBlock, setEditBlock] = useState<TimeBlock | null>(null);

  const range = rangeOf(kind, refDate);
  const cat = (id: string) => data.timeCategories.find((c) => c.id === id);
  const acts = data.activities
    .filter((a) => a.date >= range.from && a.date <= range.to)
    .sort((a, b) => b.date.localeCompare(a.date));
  const firstCat = data.timeCategories[0]?.id ?? '';

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Zeit</h1>
        <Segmented value={kind} onChange={setKind} options={TIME_KINDS} />
      </div>
      <PeriodNav kind={kind} value={refDate} onChange={setRefDate} />
      <div className="grid two">
        <Card title="Verteilung">
          <TimeDonut kind={kind} refDate={refDate} />
        </Card>
        <Card
          title="Aktivitäten"
          action={
            <button className="btn small primary"
              onClick={() => setEditAct({ id: uid(), date: kind === 'day' ? refDate : today(), categoryId: firstCat, minutes: 0 })}>
              <Icon name="plus" size={16} /> Neu
            </button>
          }
        >
          {acts.length === 0 ? (
            <Empty>Keine Aktivitäten in diesem Zeitraum.</Empty>
          ) : (
            <ul className="list">
              {acts.map((a) => (
                <li key={a.id} className="clickable" onClick={() => setEditAct(a)}>
                  <Dot color={cat(a.categoryId)?.color ?? '#888'} />
                  <div className="grow">
                    <div className="title">{cat(a.categoryId)?.name ?? '–'}</div>
                    <div className="sub">{fmtDate(a.date)}{a.note ? ` · ${a.note}` : ''}</div>
                  </div>
                  <span className="amount">{fmtMin(a.minutes)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card
        title="Wiederkehrende Blöcke"
        action={
          <button className="btn small"
            onClick={() => setEditBlock({ id: uid(), label: '', categoryId: firstCat, weekdays: [0, 1, 2, 3, 4], from: '08:00', to: '13:00', validFrom: today() })}>
            <Icon name="plus" size={16} /> Neu
          </button>
        }
      >
        <p className="muted small" style={{ marginTop: 0 }}>z. B. Stundenplan oder Schlaf – werden an den gewählten Wochentagen automatisch gezählt.</p>
        {data.blocks.length === 0 ? (
          <Empty>Noch keine Blöcke.</Empty>
        ) : (
          <ul className="list">
            {data.blocks.map((b) => (
              <li key={b.id} className="clickable" onClick={() => setEditBlock(b)}>
                <Dot color={cat(b.categoryId)?.color ?? '#888'} />
                <div className="grow">
                  <div className="title">{b.label || cat(b.categoryId)?.name}</div>
                  <div className="sub">
                    {b.weekdays.map((d) => WEEKDAYS[d]).join(', ')} · {b.from}–{b.to}
                    {b.validTo ? ` · bis ${fmtDate(b.validTo)}` : ''}
                  </div>
                </div>
                <span className="amount">{fmtMin(blockMinutes(b))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <CategoryManager
        col="timeCategories"
        isUsed={(id) => data.activities.some((a) => a.categoryId === id) || data.blocks.some((b) => b.categoryId === id)}
      />
      {editAct && <ActivityForm value={editAct} onClose={() => setEditAct(null)} />}
      {editBlock && <BlockForm value={editBlock} onClose={() => setEditBlock(null)} />}
    </>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useStore();
  return (
    <label>Kategorie
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {data.timeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </label>
  );
}

function DeleteButton({ label, onDelete }: { label: string; onDelete: () => void }) {
  return (
    <button type="button" className="btn danger" onClick={() => confirm(`„${label}“ löschen?`) && onDelete()}>
      <Icon name="trash" size={16} /> Löschen
    </button>
  );
}

function ActivityForm({ value, onClose }: { value: Activity; onClose: () => void }) {
  const { data, save, remove } = useStore();
  const isNew = !data.activities.some((a) => a.id === value.id);
  const [f, setF] = useState(value);
  const [dur, setDur] = useState(minToInput(value.minutes));
  const [err, setErr] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const minutes = parseDuration(dur);
    if (!minutes || minutes > 1440) return setErr('Bitte eine Dauer zwischen 1 min und 24 h eingeben (z. B. 90 oder 1:30).');
    if (!f.categoryId) return setErr('Bitte eine Kategorie wählen.');
    save('activities', { ...f, minutes, note: f.note?.trim() || undefined });
    onClose();
  }

  return (
    <Modal title={isNew ? 'Neue Aktivität' : 'Aktivität bearbeiten'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="row">
          <label>Datum<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value || today() })} /></label>
          <label>Dauer (min oder h:mm)<input value={dur} onChange={(e) => setDur(e.target.value)} placeholder="1:30" inputMode="text" autoFocus /></label>
        </div>
        <CategorySelect value={f.categoryId} onChange={(categoryId) => setF({ ...f, categoryId })} />
        <label>Notiz (optional)<input value={f.note ?? ''} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
        {err && <p className="error">{err}</p>}
        <div className="row end">
          {!isNew && <DeleteButton label="Aktivität" onDelete={() => { remove('activities', value.id); onClose(); }} />}
          <button className="btn primary">Speichern</button>
        </div>
      </form>
    </Modal>
  );
}

function BlockForm({ value, onClose }: { value: TimeBlock; onClose: () => void }) {
  const { data, save, remove } = useStore();
  const isNew = !data.blocks.some((b) => b.id === value.id);
  const [f, setF] = useState(value);
  const [err, setErr] = useState('');
  const set = (p: Partial<TimeBlock>) => setF((x) => ({ ...x, ...p }));
  const toggleDay = (d: number) =>
    set({ weekdays: f.weekdays.includes(d) ? f.weekdays.filter((x) => x !== d) : [...f.weekdays, d].sort((a, b) => a - b) });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.weekdays.length) return setErr('Bitte mindestens einen Wochentag wählen.');
    if (!f.from || !f.to) return setErr('Bitte Beginn und Ende angeben.');
    if (f.validTo && f.validTo < f.validFrom) return setErr('„Gültig bis“ liegt vor „Gültig ab“.');
    save('blocks', { ...f, label: f.label.trim(), validTo: f.validTo || undefined });
    onClose();
  }

  return (
    <Modal title={isNew ? 'Neuer Block' : 'Block bearbeiten'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>Bezeichnung<input value={f.label} onChange={(e) => set({ label: e.target.value })} placeholder="z. B. Schule oder Schlaf" /></label>
        <CategorySelect value={f.categoryId} onChange={(categoryId) => set({ categoryId })} />
        <div className="field">Wochentage
          <div className="weekdays">
            {WEEKDAYS.map((w, i) => (
              <button type="button" key={w} className={f.weekdays.includes(i) ? 'active' : ''} onClick={() => toggleDay(i)}>{w}</button>
            ))}
          </div>
        </div>
        <div className="row">
          <label>Beginn<input type="time" value={f.from} onChange={(e) => set({ from: e.target.value })} /></label>
          <label>Ende<input type="time" value={f.to} onChange={(e) => set({ to: e.target.value })} /></label>
        </div>
        {f.from && f.to && <p className="muted small" style={{ margin: 0 }}>Dauer: {fmtMin(blockMinutes(f))} pro Tag</p>}
        <div className="row">
          <label>Gültig ab<input type="date" value={f.validFrom} onChange={(e) => set({ validFrom: e.target.value || today() })} /></label>
          <label>Gültig bis (optional)<input type="date" value={f.validTo ?? ''} onChange={(e) => set({ validTo: e.target.value || undefined })} /></label>
        </div>
        {err && <p className="error">{err}</p>}
        <div className="row end">
          {!isNew && <DeleteButton label={value.label || 'Block'} onDelete={() => { remove('blocks', value.id); onClose(); }} />}
          <button className="btn primary">Speichern</button>
        </div>
      </form>
    </Modal>
  );
}

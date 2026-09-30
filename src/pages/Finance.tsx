import { useMemo, useState } from 'react';
import { CategoryManager } from '../components/CategoryManager';
import { Donut } from '../components/Donut';
import { Icon } from '../components/Icon';
import { Card, Dot, Empty, Modal, PeriodNav, Segmented, Stat } from '../components/ui';
import { today } from '../lib/dates';
import { amountInPeriod, convert, INTERVAL_LABEL, summarize, type FinMode } from '../lib/finance';
import { fmtEur, parseAmount, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { FinEntry, Interval } from '../lib/types';

export function FinanceSummary({ mode, refDate }: { mode: FinMode; refDate: string }) {
  const { data } = useStore();
  const s = useMemo(() => summarize(data.finEntries, data.finCategories, mode, refDate), [data, mode, refDate]);
  return (
    <>
      <div className="stats">
        <Stat label="Einnahmen" value={fmtEur(s.income)} tone="pos" />
        <Stat label="Ausgaben" value={fmtEur(s.expense)} tone="neg" />
        <Stat label="Übrig" value={fmtEur(s.rest)} tone={s.rest >= 0 ? 'pos' : 'neg'} />
      </div>
      <Donut data={s.expenseByCategory} format={fmtEur} emptyText="Keine Ausgaben in diesem Zeitraum." />
    </>
  );
}

export function Finance() {
  const { data } = useStore();
  const [mode, setMode] = useState<FinMode>('month');
  const [refDate, setRefDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [edit, setEdit] = useState<FinEntry | null>(null);

  const cat = (id: string) => data.finCategories.find((c) => c.id === id);
  const rows = data.finEntries
    .map((e) => ({ e, value: amountInPeriod(e, mode, refDate) }))
    .filter((r) => showAll || r.value > 0)
    .sort((a, b) => (a.e.type === b.e.type ? b.value - a.value : a.e.type === 'income' ? -1 : 1));

  const newEntry = () =>
    setEdit({ id: uid(), name: '', amount: 0, type: 'expense', categoryId: data.finCategories[0]?.id ?? '', interval: 'monthly', start: today() });

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Finanzen</h1>
        <Segmented value={mode} onChange={setMode} options={[['month', 'Monat'], ['year', 'Jahr']]} />
      </div>
      <PeriodNav kind={mode} value={refDate} onChange={setRefDate} />
      <div className="grid two">
        <Card title={mode === 'month' ? 'Monatsübersicht' : 'Jahresübersicht'}>
          <FinanceSummary mode={mode} refDate={refDate} />
        </Card>
        <Card
          title="Einträge"
          action={<button className="btn small primary" onClick={newEntry}><Icon name="plus" size={16} /> Neu</button>}
        >
          <label className="check small">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Auch Einträge außerhalb des Zeitraums zeigen
          </label>
          {rows.length === 0 ? (
            <Empty>Noch keine Einträge. Lege deine Einnahmen und Ausgaben an.</Empty>
          ) : (
            <ul className="list">
              {rows.map(({ e, value }) => (
                <li key={e.id} className="clickable" onClick={() => setEdit(e)}>
                  <Dot color={cat(e.categoryId)?.color ?? '#888'} />
                  <div className="grow">
                    <div className="title">{e.name}</div>
                    <div className="sub">
                      {cat(e.categoryId)?.name ?? '–'} · {fmtEur(e.amount)} {INTERVAL_LABEL[e.interval]}
                    </div>
                  </div>
                  <span className="amount" style={{ color: e.type === 'income' ? 'var(--pos)' : undefined }}>
                    {e.type === 'income' ? '+' : '−'}{fmtEur(value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <CategoryManager col="finCategories" isUsed={(id) => data.finEntries.some((e) => e.categoryId === id)} />
      {edit && <EntryForm value={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function EntryForm({ value, onClose }: { value: FinEntry; onClose: () => void }) {
  const { data, save, remove } = useStore();
  const isNew = !data.finEntries.some((e) => e.id === value.id);
  const [f, setF] = useState({ ...value, amountText: value.amount ? String(value.amount).replace('.', ',') : '' });
  const [err, setErr] = useState('');
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const amount = parseAmount(f.amountText);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Bitte einen Namen eingeben.');
    if (amount === null || amount <= 0) return setErr('Bitte einen gültigen Betrag eingeben.');
    if (!f.categoryId) return setErr('Bitte eine Kategorie wählen.');
    if (f.end && f.end < f.start) return setErr('Das Enddatum liegt vor dem Startdatum.');
    const { amountText: _, ...rest } = f;
    save('finEntries', { ...rest, name: f.name.trim(), amount, end: f.interval === 'once' ? undefined : f.end || undefined });
    onClose();
  }

  return (
    <Modal title={isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Segmented value={f.type} onChange={(type) => set({ type })} options={[['expense', 'Ausgabe'], ['income', 'Einnahme']]} />
        <label>Name<input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="z. B. Miete" autoFocus /></label>
        <div className="row">
          <label>Betrag (€)<input inputMode="decimal" value={f.amountText} onChange={(e) => set({ amountText: e.target.value })} placeholder="0,00" /></label>
          <label>Intervall
            <select value={f.interval} onChange={(e) => set({ interval: e.target.value as Interval })}>
              {Object.entries(INTERVAL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
        {amount && f.interval !== 'once' ? (
          <p className="muted small" style={{ margin: 0 }}>
            = {fmtEur(convert(amount, f.interval, 'month'))} pro Monat · {fmtEur(convert(amount, f.interval, 'year'))} pro Jahr
          </p>
        ) : null}
        <label>Kategorie
          <select value={f.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
            {data.finCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="row">
          <label>{f.interval === 'once' ? 'Datum' : 'Startdatum'}<input type="date" value={f.start} onChange={(e) => set({ start: e.target.value || today() })} /></label>
          {f.interval !== 'once' && (
            <label>Enddatum (optional)<input type="date" value={f.end ?? ''} onChange={(e) => set({ end: e.target.value || undefined })} /></label>
          )}
        </div>
        {err && <p className="error">{err}</p>}
        <div className="row end">
          {!isNew && (
            <button type="button" className="btn danger" onClick={() => {
              if (confirm(`„${value.name}“ löschen?`)) {
                remove('finEntries', value.id);
                onClose();
              }
            }}><Icon name="trash" size={16} /> Löschen</button>
          )}
          <button className="btn primary">Speichern</button>
        </div>
      </form>
    </Modal>
  );
}

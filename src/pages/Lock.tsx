import { useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { useStore } from '../lib/store';

type Mode = 'pin' | 'password';

export const secretError = (secret: string, mode: Mode): string | null =>
  mode === 'pin'
    ? /^\d{4,}$/.test(secret) ? null : 'Die PIN braucht mindestens 4 Ziffern (besser 6).'
    : secret.length >= 8 ? null : 'Das Passwort braucht mindestens 8 Zeichen.';

/** Erstes Einrichten: PIN oder Passwort festlegen. */
export function Setup() {
  const { setup } = useStore();
  const [mode, setMode] = useState<Mode>('pin');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = secretError(a, mode) ?? (a !== b ? 'Die Eingaben stimmen nicht überein.' : null);
    if (problem) return setErr(problem);
    setBusy(true);
    await setup(a, mode);
  }

  return (
    <form className="lock" onSubmit={submit}>
      <div className="lock-icon"><Icon name="lock" size={40} /></div>
      <h1>Willkommen</h1>
      <p className="muted">
        Deine Daten bleiben nur auf diesem Gerät und werden mit {mode === 'pin' ? 'deiner PIN' : 'deinem Passwort'} verschlüsselt.
        Ohne {mode === 'pin' ? 'sie' : 'es'} kann niemand – auch du nicht – die Daten wiederherstellen.
      </p>
      <div className="segmented">
        <button type="button" className={mode === 'pin' ? 'active' : ''} onClick={() => setMode('pin')}>PIN</button>
        <button type="button" className={mode === 'password' ? 'active' : ''} onClick={() => setMode('password')}>Passwort</button>
      </div>
      <SecretInput mode={mode} value={a} onChange={setA} placeholder={mode === 'pin' ? 'Neue PIN' : 'Neues Passwort'} autoFocus />
      <SecretInput mode={mode} value={b} onChange={setB} placeholder="Wiederholen" />
      {err && <p className="error">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Einrichten …' : 'Einrichten'}</button>
    </form>
  );
}

export function Unlock() {
  const { unlock, lockMode } = useStore();
  const [secret, setSecret] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!secret) return;
    setBusy(true);
    setErr('');
    const ok = await unlock(secret);
    if (!ok) {
      setBusy(false);
      setSecret('');
      setErr(lockMode === 'pin' ? 'Falsche PIN.' : 'Falsches Passwort.');
    }
  }

  return (
    <form className="lock" onSubmit={submit}>
      <div className="lock-icon"><Icon name="lock" size={40} /></div>
      <h1>Gesperrt</h1>
      <SecretInput mode={lockMode} value={secret} onChange={setSecret} placeholder={lockMode === 'pin' ? 'PIN' : 'Passwort'} autoFocus />
      {err && <p className="error">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Entsperren …' : 'Entsperren'}</button>
    </form>
  );
}

export function SecretInput({ mode, value, onChange, placeholder, autoFocus }: {
  mode: Mode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      className="secret"
      type="password"
      inputMode={mode === 'pin' ? 'numeric' : 'text'}
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(mode === 'pin' ? e.target.value.replace(/\D/g, '') : e.target.value)}
      autoFocus={autoFocus}
    />
  );
}

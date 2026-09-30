// Zentraler App-Zustand: Sperre, Schlüssel (nur im Speicher) und entschlüsselte Daten.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as dbApi from './db';
import { DEFAULT_SETTINGS, defaultData } from './defaults';
import type { AppData, Collection, Item, Settings } from './types';

type Status = 'loading' | 'setup' | 'locked' | 'unlocked';

interface Store {
  status: Status;
  lockMode: dbApi.LockMeta['mode'];
  data: AppData;
  settings: Settings;
  setup(secret: string, mode: dbApi.LockMeta['mode']): Promise<void>;
  unlock(secret: string): Promise<boolean>;
  lock(): void;
  save<C extends Collection>(col: C, item: Item<C>): void;
  remove(col: Collection, id: string): void;
  replaceData(data: AppData): Promise<void>;
  changeSecret(secret: string, mode: dbApi.LockMeta['mode']): Promise<void>;
  wipe(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider fehlt');
  return s;
}

export const useData = () => useStore().data;

function reportError(e: unknown) {
  console.error(e);
  alert('Speichern fehlgeschlagen: ' + (e instanceof Error ? e.message : String(e)));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [lockMode, setLockMode] = useState<dbApi.LockMeta['mode']>('pin');
  const [data, setData] = useState<AppData>(dbApi.emptyData);
  const keyRef = useRef<CryptoKey | null>(null);

  useEffect(() => {
    dbApi.getLockMeta().then((m) => {
      if (m) setLockMode(m.mode);
      setStatus(m ? 'locked' : 'setup');
    });
  }, []);

  const open = useCallback(async (key: CryptoKey) => {
    const loaded = await dbApi.loadAll(key);
    keyRef.current = key;
    setData(loaded);
    setStatus('unlocked');
  }, []);

  const setup = useCallback(
    async (secret: string, mode: dbApi.LockMeta['mode']) => {
      const key = await dbApi.setupLock(secret, mode);
      await dbApi.replaceAll(key, defaultData());
      setLockMode(mode);
      await open(key);
    },
    [open],
  );

  const unlock = useCallback(
    async (secret: string) => {
      const key = await dbApi.unlock(secret);
      if (!key) return false;
      await open(key);
      return true;
    },
    [open],
  );

  const lock = useCallback(() => {
    keyRef.current = null;
    setData(dbApi.emptyData());
    setStatus('locked');
  }, []);

  const save = useCallback(<C extends Collection>(col: C, item: Item<C>) => {
    const key = keyRef.current;
    if (!key) return;
    setData((d) => {
      const list = d[col] as Item<C>[];
      const idx = list.findIndex((x) => x.id === item.id);
      const next = idx < 0 ? [...list, item] : list.map((x, i) => (i === idx ? item : x));
      return { ...d, [col]: next };
    });
    dbApi.putItem(key, col, item).catch(reportError);
  }, []);

  const remove = useCallback((col: Collection, id: string) => {
    setData((d) => ({ ...d, [col]: (d[col] as { id: string }[]).filter((x) => x.id !== id) }));
    dbApi.deleteItem(col, id).catch(reportError);
  }, []);

  const replaceData = useCallback(async (next: AppData) => {
    const key = keyRef.current;
    if (!key) return;
    await dbApi.replaceAll(key, next);
    setData(next);
  }, []);

  const changeSecret = useCallback(
    async (secret: string, mode: dbApi.LockMeta['mode']) => {
      keyRef.current = await dbApi.changeSecret(data, secret, mode);
      setLockMode(mode);
    },
    [data],
  );

  const wipe = useCallback(async () => {
    await dbApi.wipeAll();
    keyRef.current = null;
    setData(dbApi.emptyData());
    setStatus('setup');
  }, []);

  const settings = data.settings[0] ?? DEFAULT_SETTINGS;
  useAutoLock(status === 'unlocked', settings.autoLockMinutes, lock);

  const value = useMemo<Store>(
    () => ({ status, lockMode, data, settings, setup, unlock, lock, save, remove, replaceData, changeSecret, wipe }),
    [status, lockMode, data, settings, setup, unlock, lock, save, remove, replaceData, changeSecret, wipe],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Sperrt nach `minutes` ohne Eingabe. Prüft auch beim Zurückkehren in die App (Handy im Hintergrund). */
function useAutoLock(active: boolean, minutes: number, lock: () => void) {
  useEffect(() => {
    if (!active || minutes <= 0) return;
    const limit = minutes * 60_000;
    let last = Date.now();
    const touch = () => (last = Date.now());
    const check = () => {
      if (Date.now() - last >= limit) lock();
    };
    const onVisible = () => (document.visibilityState === 'visible' ? check() : undefined);
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(check, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [active, minutes, lock]);
}

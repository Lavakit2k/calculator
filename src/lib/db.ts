// IndexedDB über Dexie. Jeder Datensatz wird einzeln AES-GCM-verschlüsselt gespeichert;
// unverschlüsselt liegen nur Salt, Iterationen und ein Prüfwert zum Testen des Passworts.
import Dexie, { type Table } from 'dexie';
import { decryptJson, deriveKey, encryptJson, PBKDF2_ITERATIONS, randomBytes } from './crypto';
import { COLLECTIONS, type AppData, type Collection } from './types';

export interface LockMeta {
  id: 'lock';
  mode: 'pin' | 'password';
  salt: Uint8Array<ArrayBuffer>;
  iterations: number;
  checkIv: Uint8Array<ArrayBuffer>;
  checkCt: ArrayBuffer;
}

interface EncRecord {
  col: Collection;
  id: string;
  iv: Uint8Array<ArrayBuffer>;
  ct: ArrayBuffer;
}

class AppDb extends Dexie {
  meta!: Table<LockMeta, string>;
  records!: Table<EncRecord, [Collection, string]>;
  constructor() {
    super('finanz-zeit');
    this.version(1).stores({ meta: 'id', records: '[col+id], col' });
  }
}

export const db = new AppDb();
const CHECK = 'finanz-zeit-ok';

export const getLockMeta = () => db.meta.get('lock');

export async function setupLock(secret: string, mode: LockMeta['mode']): Promise<CryptoKey> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, PBKDF2_ITERATIONS);
  const check = await encryptJson(key, CHECK);
  await db.meta.put({ id: 'lock', mode, salt, iterations: PBKDF2_ITERATIONS, checkIv: check.iv, checkCt: check.ct });
  return key;
}

/** Liefert den Schlüssel oder null bei falschem PIN/Passwort. */
export async function unlock(secret: string): Promise<CryptoKey | null> {
  const meta = await getLockMeta();
  if (!meta) return null;
  const key = await deriveKey(secret, meta.salt, meta.iterations);
  try {
    const ok = await decryptJson<string>(key, { iv: meta.checkIv, ct: meta.checkCt });
    return ok === CHECK ? key : null;
  } catch {
    return null;
  }
}

export function emptyData(): AppData {
  return Object.fromEntries(COLLECTIONS.map((c) => [c, []])) as unknown as AppData;
}

export async function loadAll(key: CryptoKey): Promise<AppData> {
  const data = emptyData();
  const rows = await db.records.toArray();
  for (const r of rows) {
    const item = await decryptJson<{ id: string }>(key, r);
    (data[r.col] as { id: string }[]).push(item);
  }
  return data;
}

export async function putItem(key: CryptoKey, col: Collection, item: { id: string }) {
  const { iv, ct } = await encryptJson(key, item);
  await db.records.put({ col, id: item.id, iv, ct });
}

export const deleteItem = (col: Collection, id: string) => db.records.delete([col, id]);

async function encryptRows(key: CryptoKey, data: AppData): Promise<EncRecord[]> {
  const rows: EncRecord[] = [];
  for (const col of COLLECTIONS) {
    for (const item of data[col] ?? []) rows.push({ col, id: item.id, ...(await encryptJson(key, item)) });
  }
  return rows;
}

// Verschlüsselung passiert vor der Transaktion, weil WebCrypto-Promises IndexedDB-Transaktionen beenden.
async function writeAll(rows: EncRecord[], meta?: LockMeta) {
  await db.transaction('rw', db.records, db.meta, async () => {
    await db.records.clear();
    await db.records.bulkPut(rows);
    if (meta) await db.meta.put(meta);
  });
}

/** Ersetzt alle Daten (Import). */
export async function replaceAll(key: CryptoKey, data: AppData) {
  await writeAll(await encryptRows(key, data));
}

/** Neuer PIN/Passwort: neuer Salt, alle Datensätze neu verschlüsseln. */
export async function changeSecret(data: AppData, secret: string, mode: LockMeta['mode']): Promise<CryptoKey> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, PBKDF2_ITERATIONS);
  const check = await encryptJson(key, CHECK);
  const rows = await encryptRows(key, data);
  await writeAll(rows, { id: 'lock', mode, salt, iterations: PBKDF2_ITERATIONS, checkIv: check.iv, checkCt: check.ct });
  return key;
}

export async function wipeAll() {
  await db.transaction('rw', db.records, db.meta, async () => {
    await db.records.clear();
    await db.meta.clear();
  });
}

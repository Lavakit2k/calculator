import { describe, expect, it } from 'vitest';
import { decryptJson, deriveKey, encryptJson, fromBase64, randomBytes, toBase64 } from './crypto';

describe('crypto', () => {
  it('verschlüsselt und entschlüsselt mit demselben Schlüssel', async () => {
    const salt = randomBytes(16);
    const key = await deriveKey('1234', salt, 1000);
    const sealed = await encryptJson(key, { a: 1, b: 'ä' });
    expect(await decryptJson(key, sealed)).toEqual({ a: 1, b: 'ä' });
  });

  it('scheitert mit falschem Passwort', async () => {
    const salt = randomBytes(16);
    const sealed = await encryptJson(await deriveKey('richtig', salt, 1000), 'geheim');
    await expect(decryptJson(await deriveKey('falsch', salt, 1000), sealed)).rejects.toThrow();
  });

  it('Base64 hin und zurück', () => {
    const bytes = randomBytes(60_000);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });
});

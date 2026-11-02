// Kleine Ausgangsdatensätze im vorhandenen Mandanten-Tresor. Keine Originalkopien im Ausgang.
import { openDb, getActiveDbName, kvGet } from './db.js';
import { proHash } from '../domain/proUebergabe.js';
const KEY = 'pro-verbund-ausgang-v1';
async function aendern(dbName, id, fn) {
  const db = await openDb();
  if (db.name !== dbName || getActiveDbName() !== dbName) throw new Error('Der aktive Mandant hat gewechselt. Bitte die Übergabe dort erneut öffnen.');
  return new Promise((resolve, reject) => {
    const t = db.transaction('kv', 'readwrite'), s = t.objectStore('kv'), r = s.get(KEY); let ergebnis, fehler;
    t.oncomplete = () => resolve(ergebnis);
    t.onabort = () => reject(fehler || t.error || new Error('Der Ausgang wurde nicht gespeichert.'));
    r.onsuccess = () => { try { const alle = r.result || {}; ergebnis = fn(alle[id]); alle[id] = ergebnis; s.put(alle, KEY); } catch (e) { fehler = e; t.abort(); } };
  });
}
export async function proAusgaenge(vaultId) { return Object.values(await kvGet(KEY) || {}).filter(x => x.vaultId === vaultId); }
export async function proSenden(tresor, file, dokumentId, ziel, bezug) {
  const dbName = getActiveDbName(), z = await tresor.zustand();
  if (!z?.offen || !z.kennung || !z.uebergaben) throw new Error('Bitte den gemeinsamen Pro-Tresor in der aktuellen App entsperren.');
  if (!['familienakte', 'workflow-pdf-pro', 'private-brain'].includes(ziel) || !file.size || file.size > 20 * 1024 * 1024) throw new Error('Unzulässiges Ziel oder Dateigröße (höchstens 20 MiB).');
  if (ziel === 'workflow-pdf-pro' && !/^image\//.test(file.type) && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) throw new Error('Workflow PDF Pro nimmt PDF und Bilder an.');
  const sha256 = await proHash(await file.arrayBuffer());
  const id = 'blp-' + await proHash(new TextEncoder().encode(JSON.stringify([z.kennung, dokumentId, ziel, file.name, file.type, sha256, bezug || ''])));
  const m = { vertrag: 'familienakte-uebergabe/1', id, quelle: 'bookledgerpro', ziel, dokumentId, name: file.name, mime: file.type, groesse: file.size, sha256, ...(bezug ? { bezug } : {}) };
  const a = await aendern(dbName, id, alt => alt || { id, vaultId: z.kennung, vertrag: m, stand: 'offen' });
  const e = await tresor.uebergabeSenden(z.kennung, a.vertrag, file);
  if (!e || !/^[a-z0-9-]{1,80}$/.test(e.id) || e.groesse !== file.size || e.sha256 !== sha256 || e.name !== file.name || e.art !== file.type || e.schreiber !== 'bookledgerpro') throw new Error('Die Weitergabe wurde nicht passend bestätigt. Bitte erneut versuchen.');
  return aendern(dbName, id, alt => ({ ...alt, entryId: e.id, stand: alt.stand === 'im-eingang' ? 'im-eingang' : 'weitergegeben' }));
}
export async function proBestaetigung(tresor, a) {
  const dbName = getActiveDbName(), z = await tresor.zustand();
  if (!z?.offen || z.kennung !== a.vaultId || !z.uebergaben || !a.entryId) throw new Error('Bitte den zur Übergabe gehörenden Pro-Tresor öffnen.');
  const r = await tresor.uebergabeStand(a.vaultId, a.vertrag.ziel, a.entryId);
  if (r?.bestaetigt !== true) return a;
  return aendern(dbName, a.id, alt => {
    if (!alt || alt.entryId !== a.entryId) throw new Error('Die gemerkte Übergabe hat sich geändert.');
    return { ...alt, stand: 'im-eingang' };
  });
}

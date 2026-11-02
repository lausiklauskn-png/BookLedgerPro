// Echte IndexedDB, AES-GCM und Belegmodule. Nur erfundene Originale; kein nativer Dialog.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright-core'); } catch { pw = require('playwright'); }
const root = process.env.PRO_PROBE_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '..');
const server = createServer(async (req, res) => {
  const name = new URL(req.url, 'http://test').pathname;
  if (name === '/') { res.setHeader('content-type', 'text/html'); return res.end('<!doctype html><html><body>Pro-Verbund-Probe</body></html>'); }
  const path = resolve(root, '.' + name);
  if (!path.startsWith(root + '/')) { res.writeHead(403); return res.end(); }
  try { const bytes = await readFile(path); res.setHeader('content-type', extname(path) === '.js' ? 'text/javascript' : 'application/octet-stream'); res.end(bytes); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const browser = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let gruen = 0;
try {
  const page = await browser.newPage(); await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async () => {
    window.db = await import('/src/core/db.js'); window.vault = await import('/src/core/vault.js');
    window.docs = await import('/src/domain/documents.js'); window.pro = await import('/src/domain/proUebergabe.js');
    await vault.setupVault('Nur-erfundenes-Probenpasswort-17');
  });
  async function probe(name, fn) { assert.equal(await page.evaluate(fn), true, name); gruen++; console.log('PASS ' + name); }
  await probe('Request-Erfolg mit anschließendem Transaktionsabbruch wird nicht bestätigt', async () => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) { const r = put.apply(this, args); if (this.name === 'files') r.addEventListener('success', () => r.transaction.abort(), { once: true }); return r; };
    let abbruch = false;
    try { await db.filePut({ id: 'abbruch', data: 'nur-probe' }); } catch { abbruch = true; } finally { IDBObjectStore.prototype.put = put; }
    return abbruch && !await db.fileGet('abbruch');
  });
  await probe('Parallele Wiederholung speichert genau ein verschlüsseltes Original', async () => {
    const f = new File(['%PDF-1.4\nErfundener Beleg 17'], 'Beleg.pdf', { type: 'application/pdf' });
    window.m = { vertrag: 'familienakte-uebergabe/1', id: 'erfunden-17', quelle: 'familienakte', ziel: 'bookledgerpro', dokumentId: 'akte-17',
      name: f.name, mime: f.type, groesse: f.size, sha256: await pro.proHash(await f.arrayBuffer()), bezug: 'quelle-9' };
    const [a, b] = await Promise.all([docs.saveBeleg(f, { uebergabe: m }), docs.saveBeleg(f, { uebergabe: m })]);
    window.belegId = a.id;
    const rec = await db.fileGet(a.id), alle = await docs.listBelege();
    return a.id === b.id && alle.length === 1 && !!rec.data?.ct && JSON.stringify(rec.data).indexOf('Erfundener') < 0
      && new TextDecoder().decode(await docs.getBelegBytes(a.id)) === await f.text();
  });
  await probe('Veränderte Bytes und falsches Ziel werden vor der Ablage abgewiesen', async () => {
    const { proDateiAufnehmen } = await import('/src/ui/views/documents.js');
    const f = new File(['%PDF-1.4 Andere Bytes'], m.name, { type: m.mime });
    let hashFehler = false, zielFehler = false;
    try { await proDateiAufnehmen(f, { ...m, id: 'falsche-bytes', groesse: f.size }); } catch { hashFehler = true; }
    try { await proDateiAufnehmen(f, { ...m, id: 'falsches-ziel', groesse: f.size, sha256: await pro.proHash(await f.arrayBuffer()), ziel: 'private-brain' }); } catch { zielFehler = true; }
    return hashFehler && zielFehler && (await docs.listBelege()).length === 1;
  });
  await probe('Wiederholung erhält Buchungsverknüpfung und weist gleichen Schlüssel mit anderem Inhalt ab', async () => {
    await docs.linkBeleg(belegId, 'buchung-erfunden');
    const bytes = await docs.getBelegBytes(belegId), f = new File([bytes], m.name, { type: m.mime });
    const wieder = await docs.saveBeleg(f, { uebergabe: m });
    const anders = new File(['anderer Inhalt'], m.name, { type: m.mime }); let konflikt = false;
    try { await docs.saveBeleg(anders, { uebergabe: { ...m, groesse: anders.size, sha256: await pro.proHash(await anders.arrayBuffer()) } }); } catch { konflikt = true; }
    let bezugKonflikt = false;
    try { await docs.saveBeleg(f, { uebergabe: { ...m, bezug: 'fremde-herkunft' } }); } catch { bezugKonflikt = true; }
    return wieder.buchungId === 'buchung-erfunden' && konflikt && bezugKonflikt && (await docs.listBelege()).length === 1;
  });
  await page.reload();
  await page.evaluate(async () => {
    window.db = await import('/src/core/db.js'); window.vault = await import('/src/core/vault.js');
    window.docs = await import('/src/domain/documents.js'); window.pro = await import('/src/domain/proUebergabe.js');
    await vault.unlockVault('Nur-erfundenes-Probenpasswort-17');
  });
  await probe('Neustart und Entsperren erhalten Herkunft, Verknüpfung und Originalbytes', async () => {
    const [a] = await docs.listBelege();
    return a.proUebergabe.id === 'erfunden-17' && a.proUebergabe.bezug === 'quelle-9' && a.buchungId === 'buchung-erfunden'
      && new TextDecoder().decode(await docs.getBelegBytes(a.id)).includes('Erfundener Beleg 17');
  });
  await probe('Der normale Mailweg wiederholt Original und Anhänge ohne doppelte Belege', async () => {
    const { proDateiAufnehmen } = await import('/src/ui/views/documents.js');
    const text = 'From: Probe <probe@example.invalid>\r\nSubject: Erfundene Rechnung\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="teil"\r\n\r\n--teil\r\nContent-Type: text/plain\r\n\r\nErfundene Nachricht\r\n--teil\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename="Anhang.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\n' + btoa('%PDF-1.4\nErfundene Anlage') + '\r\n--teil--\r\n';
    const file = new File([text], 'Probe.eml', { type: 'message/rfc822' });
    const m = { vertrag: 'familienakte-uebergabe/1', id: 'mail-17', quelle: 'familienakte', ziel: 'bookledgerpro', dokumentId: 'mail-doc-17', name: file.name, mime: file.type, groesse: file.size, sha256: await pro.proHash(await file.arrayBuffer()) };
    const a = await proDateiAufnehmen(file, m), b = await proDateiAufnehmen(file, m);
    const alle = await docs.listBelege(), mail = alle.find(x => x.proUebergabe?.id === 'mail-17');
    return a.belegId === b.belegId && alle.length === 3 && alle.filter(x => x.mail?.mailId === mail.id).length === 1
      && new TextDecoder().decode(await docs.getBelegBytes(mail.id)) === text;
  });
  await probe('Ausgang bleibt nach Abbruch wiederholbar; Zustellung wird erst durch die Zielmarke bestätigt', async () => {
    const api = await import('/src/core/proVerbund.js');
    let fail = true, bestaetigt = false; const ids = [];
    const native = {
      zustand: async () => ({ offen: true, kennung: 'pro-tresor-17', uebergaben: true }),
      uebergabeSenden: async (vaultId, m, file) => {
        ids.push(m.id); if (fail) { fail = false; throw new Error('Erfundener Abbruch'); }
        return { id: 'eintrag-17', name: file.name, art: file.type, groesse: file.size, sha256: m.sha256, schreiber: 'bookledgerpro' };
      },
      uebergabeStand: async () => ({ bestaetigt }),
    };
    const f = new File(['%PDF-1.4 Original'], 'Weitergabe.pdf', { type: 'application/pdf' }); let abbruch = false;
    try { await api.proSenden(native, f, 'beleg:17', 'familienakte', 'quelle-17'); } catch { abbruch = true; }
    const a = await api.proSenden(native, f, 'beleg:17', 'familienakte', 'quelle-17');
    if (!abbruch || ids.length !== 2 || ids[0] !== ids[1] || a.stand !== 'weitergegeben' || (await api.proBestaetigung(native, a)).stand !== 'weitergegeben') return false;
    bestaetigt = true; await api.proBestaetigung(native, a);
    const [saved] = await api.proAusgaenge('pro-tresor-17');
    return saved.stand === 'im-eingang' && saved.vertrag.bezug === 'quelle-17';
  });
  await probe('Mandantenwechsel während des Lesens schreibt keinen Beleg in den anderen Tresor', async () => {
    const ursprung = db.getActiveDbName(), f = new File(['Erfundener Kontext'], 'Kontext.pdf', { type: 'application/pdf' });
    const m = { vertrag: 'familienakte-uebergabe/1', id: 'kontext-17', quelle: 'familienakte', ziel: 'bookledgerpro', dokumentId: 'kontext', name: f.name, mime: f.type, groesse: f.size, sha256: await pro.proHash(await f.arrayBuffer()) };
    const read = f.arrayBuffer.bind(f); f.arrayBuffer = async () => { db.setActiveDbName('anderer-bookledgerpro'); return read(); };
    let abbruch = false;
    try { await docs.saveBeleg(f, { uebergabe: m }); } catch { abbruch = true; }
    const andereLeer = (await db.fileAllMeta()).length === 0;
    db.setActiveDbName(ursprung);
    return abbruch && andereLeer && !(await docs.listBelege()).some(x => x.proUebergabe?.id === m.id);
  });
  await probe('Mandantenwechsel während der Mailtextergänzung überschreibt keinen fremden Beleg', async () => {
    const ursprung = db.getActiveDbName(), [b] = await docs.listBelege();
    const kontext = { db: ursprung, key: vault.getSessionKey() };
    const encrypt = crypto.subtle.encrypt.bind(crypto.subtle);
    crypto.subtle.encrypt = async (...args) => { const r = await encrypt(...args); db.setActiveDbName('anderer-bookledgerpro'); return r; };
    let abbruch = false;
    try { await docs.setBelegText(b.id, 'Nur erfundener Zusatztext', kontext); } catch { abbruch = true; }
    finally { crypto.subtle.encrypt = encrypt; }
    const andereLeer = (await db.fileAllMeta()).length === 0;
    db.setActiveDbName(ursprung);
    return abbruch && andereLeer;
  });
  console.log(`Pro-Übergabe: ${gruen} grün, 0 rot`);
} finally { await browser.close(); await new Promise(ok => server.close(ok)); }

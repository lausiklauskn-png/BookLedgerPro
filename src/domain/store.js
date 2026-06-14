// src/domain/store.js
// Persistenz-Brücke Domäne ↔ IndexedDB. Buchungen werden mit dem Sitzungs-Key
// verschlüsselt abgelegt (AES-GCM). Konten liegen als normale Records (kein
// Geheimnis). Hier sitzt die GoBD-Festschreibung: lückenloser Nummernkreis +
// Hash-Kette; gebuchte Sätze sind unveränderlich, Korrektur nur per Storno.

import { recAll, recGet, recPut, recDel, kvGet, kvSet } from '../core/db.js';
import { encryptWithKey, decryptWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { seedAccounts } from './accounts.js';
import { validateBuchung, istAusgeglichen, stornoZeilen, BUCHUNG_STATUS } from './journal.js';
import { hashBuchung, verifyChain, GENESIS } from './audit.js';

const SEQ_KEY = 'buchungSeq';
const LASTHASH_KEY = 'buchungLastHash';

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

// ---- Konten ----------------------------------------------------------------

export async function ensureAccountsSeeded() {
  const existing = await recAll('konto');
  if (existing.length) return existing;
  for (const k of seedAccounts()) await recPut(k);
  return recAll('konto');
}

export async function loadAccounts() {
  const a = await recAll('konto');
  a.sort((x, y) => x.nummer.localeCompare(y.nummer));
  return a;
}

export async function accountIndex() {
  const a = await loadAccounts();
  const idx = {};
  for (const k of a) idx[k.nummer] = k;
  return idx;
}

// ---- Buchungen (verschlüsselt) ---------------------------------------------

async function encodeBuchung(b) {
  const enc = await encryptWithKey(key(), JSON.stringify(b));
  return { id: b.id, type: 'buchung', enc };
}

async function decodeBuchung(rec) {
  if (!rec || !rec.enc) return null;
  return JSON.parse(await decryptWithKey(key(), rec.enc));
}

export async function listBuchungen() {
  const recs = await recAll('buchung');
  const out = [];
  for (const r of recs) out.push(await decodeBuchung(r));
  // Festgeschriebene nach seq, Entwürfe danach nach Datum/Anlage.
  out.sort((a, b) => {
    const sa = a.seq == null ? Infinity : a.seq;
    const sb = b.seq == null ? Infinity : b.seq;
    if (sa !== sb) return sa - sb;
    return (a.datum + (a.createdAt || '')).localeCompare(b.datum + (b.createdAt || ''));
  });
  return out;
}

export async function getBuchung(id) {
  return decodeBuchung(await recGet(id));
}

function neueId() {
  return 'buchung:' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 8);
}

/** Speichert/aktualisiert einen Buchungs-Entwurf (nur solange nicht festgeschrieben). */
export async function saveEntwurf(buchung) {
  if (buchung.id) {
    const vorhanden = await getBuchung(buchung.id);
    if (vorhanden && vorhanden.status !== BUCHUNG_STATUS.ENTWURF) {
      throw new Error('Festgeschriebene Buchung kann nicht geändert werden (nur Storno).');
    }
  }
  const b = {
    id: buchung.id || neueId(),
    datum: buchung.datum,
    beschreibung: buchung.beschreibung || '',
    begruendung: buchung.begruendung || '',
    zeilen: buchung.zeilen || [],
    belegRef: buchung.belegRef || null,
    kostenstelle: buchung.kostenstelle || null,
    status: BUCHUNG_STATUS.ENTWURF,
    seq: null, prevHash: null, hash: null,
    stornoVon: buchung.stornoVon || null,
    storniertDurch: null,
    createdAt: buchung.createdAt || new Date().toISOString(),
  };
  await recPut(await encodeBuchung(b));
  return b;
}

/** Löscht einen Buchungs-Entwurf. Festgeschriebene Buchungen NICHT löschbar (nur Storno). */
export async function deleteEntwurf(id) {
  const b = await getBuchung(id);
  if (!b) return;
  if (b.status !== BUCHUNG_STATUS.ENTWURF) {
    throw new Error('Nur Entwürfe können gelöscht werden — festgeschriebene Buchungen nur per Storno.');
  }
  await recDel(id);
}

/** Schreibt eine Buchung fest: vergibt lückenlose seq + Hash, macht sie unveränderlich. */
export async function festschreiben(id) {
  const b = await getBuchung(id);
  if (!b) throw new Error('Buchung nicht gefunden');
  if (b.status === BUCHUNG_STATUS.FESTGESCHRIEBEN) throw new Error('Bereits festgeschrieben');
  const idx = await accountIndex();
  const fehler = validateBuchung(b, idx);
  if (fehler.length) throw new Error('Nicht festschreibbar: ' + fehler.join(' '));

  const seq = (Number(await kvGet(SEQ_KEY)) || 0) + 1;
  const prevHash = (await kvGet(LASTHASH_KEY)) || GENESIS;
  b.seq = seq;
  b.prevHash = prevHash;
  b.hash = await hashBuchung(b, prevHash);
  b.status = BUCHUNG_STATUS.FESTGESCHRIEBEN;
  b.festgeschriebenAt = new Date().toISOString();

  await recPut(await encodeBuchung(b));
  await kvSet(SEQ_KEY, seq);
  await kvSet(LASTHASH_KEY, b.hash);
  return b;
}

/** Storniert eine festgeschriebene Buchung durch eine festgeschriebene Gegenbuchung. */
export async function storno(id) {
  const orig = await getBuchung(id);
  if (!orig) throw new Error('Buchung nicht gefunden');
  if (orig.status !== BUCHUNG_STATUS.FESTGESCHRIEBEN) throw new Error('Nur festgeschriebene Buchungen können storniert werden');

  const entwurf = await saveEntwurf({
    datum: new Date().toISOString().slice(0, 10),
    beschreibung: `Storno zu #${orig.seq}` + (orig.beschreibung ? ` (${orig.beschreibung})` : ''),
    zeilen: stornoZeilen(orig.zeilen),
    stornoVon: orig.id,
  });
  const stornoBuchung = await festschreiben(entwurf.id);

  // Original-Status aktualisieren (Status/Zeiger fließen NICHT in den Hash ein → Kette bleibt gültig).
  orig.status = BUCHUNG_STATUS.STORNIERT;
  orig.storniertDurch = stornoBuchung.id;
  await recPut(await encodeBuchung(orig));
  return stornoBuchung;
}

// ---- Audit -----------------------------------------------------------------

export async function verifyAuditChain() {
  const alle = await listBuchungen();
  const festgeschrieben = alle.filter((b) => b.seq != null);
  return verifyChain(festgeschrieben);
}

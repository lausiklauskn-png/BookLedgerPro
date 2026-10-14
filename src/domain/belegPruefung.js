// src/domain/belegPruefung.js — Prüfung eines Belegs auf Knopfdruck und der Vermerk
// „vor dem Senden an eine KI entfernt" (Klaus 2026-10-14).
//
// Der Prüfkern ist der des Auslieferungsprüfers, byte-1:1 aus Workflow PDF kopiert und in
// tests/run.mjs per SHA-256 gepinnt — dort pflegen, hier neu kopieren:
//   assets/eingang.js · assets/pruefer-anhang.js · assets/pruefer-mail.js ·
//   assets/pruefer-formate.js · assets/reinigung.js
// pdf.js und die Texterkennung liegen LOKAL unter vendor/ (Klaus' Wahl: BookLedgerPro bleibt
// unabhängig und offline) — nicht im Installations-Vorrat, der Worker legt sie beim ersten
// Gebrauch ab.
//
// ⚠ KRYPTO-DISZIPLIN: der Prüfbericht zitiert Text aus dem Beleg (eine gefundene Zeile, eine
//   markierte Kopie, Angaben wie Verfasser). Er liegt deshalb VERSCHLÜSSELT am Beleg
//   (`pruefDaten`), ebenso der Vermerk (`kiDaten`). Unverschlüsselt steht nur, was die Liste
//   braucht: `pruefung = {stand, zeit, funde}` und `kiEntfernt = {anzahl}`.
// ⚠ Das ORIGINAL bleibt unverändert (GoBD). Markiert wird eine Kopie, gereinigt wird nur, was
//   hinausgeht.

import { fileGet, filePut } from '../core/db.js';
import { encryptWithKey, decryptWithKey, decryptBytesWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { PRUEF_STAND } from './kiReinigung.js';

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

const _skripte = new Map();
/** Lädt ein klassisches Skript (relativ zur Seite) genau einmal. */
export function skriptLaden(src) {
  if (_skripte.has(src)) return _skripte.get(src);
  const p = new Promise((ok, nein) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = () => ok();
    s.onerror = () => nein(new Error('lädt nicht: ' + src.split('?')[0]));
    document.head.appendChild(s);
  });
  _skripte.set(src, p);
  p.catch(() => _skripte.delete(src));
  return p;
}

export const VENDOR_PDFJS = 'vendor/pdfjs/';
export const VENDOR_TESSERACT = 'vendor/tesseract/';

/** Der Prüfkern (WFP.Eingang) — erst bei Bedarf geladen. */
export async function pruefKern() {
  if (!(window.WFP && window.WFP.Eingang)) await skriptLaden('assets/eingang.js?v=5');
  const E = window.WFP && window.WFP.Eingang;
  if (!E) throw new Error('Prüfkern fehlt');
  const A = await E.bereit();
  A.pfade({ pdfjs: new URL(VENDOR_PDFJS, location.href).href, tesseract: new URL(VENDOR_TESSERACT, location.href).href });
  return E;
}

/** Die Liste der Anweisungs-Wendungen (pruefer-mail.js), für den OCR-Text vor der Kontierung. */
export async function prueferMail() {
  if (!window.PrueferMail) await skriptLaden('assets/pruefer-mail.js?v=2');
  if (!window.PrueferMail) throw new Error('Prüfliste fehlt');
  return window.PrueferMail;
}

/** Die Rechnung der Reinigung (WFP.Reinigung). */
export async function reinigung() {
  if (!(window.WFP && window.WFP.Reinigung)) await skriptLaden('assets/reinigung.js?v=1');
  if (!(window.WFP && window.WFP.Reinigung)) throw new Error('Reinigung fehlt');
  return window.WFP.Reinigung;
}

/**
 * Prüft einen Beleg (die ORIGINALDATEI) und legt das Ergebnis am Beleg ab.
 * Wirft nie wegen der Prüfung selbst: was schiefgeht, heißt „ungeprueft" mit Grund.
 * @returns {Promise<object>} der Prüfbericht (stand, funde, hinweise, markiert, herkunft, angaben, zeit)
 */
export async function pruefeBeleg(id) {
  const rec = await fileGet(id);
  if (!rec) throw new Error('Beleg nicht gefunden');
  // Bei einem Scan wird das ORIGINALFOTO geprüft (wie in Workflow PDF): es kommt von außen und
  // trägt Metadaten, blassen Text und Bildpunkte, die im neu gezeichneten Scan nicht mehr stehen.
  const ausFoto = !!(rec.originalDaten && rec.original);
  const bytes = await decryptBytesWithKey(key(), ausFoto ? rec.originalDaten : rec.data);
  let p;
  try {
    const E = await pruefKern();
    p = await E.pruefen(ausFoto ? (rec.original.name || 'foto') : (rec.name || 'beleg'), bytes);
    if (ausFoto) p.geprueftWurde = 'original';
  } catch (e) {
    p = { stand: PRUEF_STAND.UNGEPRUEFT, funde: [], hinweise: ['Die Prüfung lief nicht: ' + ((e && e.message) || e)],
      markiert: null, art: '', zeit: new Date().toISOString(), herkunft: [], angaben: [] };
  }
  const neu = await fileGet(id);           // während der Prüfung kann der Beleg verknüpft worden sein
  if (!neu) return p;
  neu.pruefung = { stand: p.stand, zeit: p.zeit, funde: (p.funde || []).length };
  neu.pruefDaten = await encryptWithKey(key(), JSON.stringify(p));
  await filePut(neu);
  if (typeof window !== 'undefined') window.__blpPruefung = p;   // Probe
  return p;
}

/** Der gespeicherte Prüfbericht (entschlüsselt) oder null. */
export async function pruefBericht(id) {
  const rec = await fileGet(id);
  if (!rec || !rec.pruefDaten) return null;
  try { return JSON.parse(await decryptWithKey(key(), rec.pruefDaten)); } catch { return null; }
}

/** Die Vermerke „vor dem Senden an eine KI entfernt" (entschlüsselt), [] wenn keine. */
export async function kiVermerke(id) {
  const rec = await fileGet(id);
  if (!rec || !rec.kiDaten) return [];
  try { const l = JSON.parse(await decryptWithKey(key(), rec.kiDaten)); return Array.isArray(l) ? l : []; } catch { return []; }
}

/**
 * Vermerkt am Beleg, was vor dem Senden entfernt wurde — erst NACH „Ohne ihn senden",
 * denn ohne Senden ist nichts entfernt. @returns Zahl der neuen Vermerke.
 */
export async function vermerkeKiEntfernt(id, liste, weg) {
  if (!id || !liste || !liste.length) return 0;
  const RE = await reinigung();
  const d = { kiEntfernt: await kiVermerke(id) };
  const n = RE.vermerken(d, liste, weg);
  if (!n) return 0;
  const rec = await fileGet(id);
  if (!rec) return 0;
  rec.kiDaten = await encryptWithKey(key(), JSON.stringify(d.kiEntfernt));
  rec.kiEntfernt = { anzahl: d.kiEntfernt.length };
  await filePut(rec);
  return n;
}

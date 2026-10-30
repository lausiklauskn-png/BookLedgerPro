// src/sbkim/netz.js — App-Seite des Mycels (Pro-Umbau 11, Klaus 2026-10-30). Ein dünner Zugang zu den Kanon-Modulen
// (window.SbkimRendezvous = Modul 23, window.SbkimRendezvousUI = dessen Fenster, window.SbkimEmbedding = Modul 03). Die Module
// selbst bleiben byte-1:1 aus Sage; hier steht nur, was BookLedgerPro ihnen gibt:
//   • antwortenAn(): BookLedgerPro beantwortet Fragen anderer Knoten — mit Titel, Datum und Betrag seiner Belege, NIE mit deren
//     Inhalt (Klaus m3). Der Korpus wird nur auf Wunsch gebaut (Sprachmodell, wie die Bedeutungssuche) und lebt nur im Speicher.
//   • netzFragen(): „Überall suchen“ fragt die anderen Knoten im Raum (nutzer-ausgelöst, Modul 23 askNode).
// Alles fail-soft: fehlt ein Modul, sagt die Antwort warum (reason), nichts wirft bis in die Ansicht.

import { netzKorpusEintraege } from '../domain/ueberall.js';

const W = () => (typeof window !== 'undefined' ? window : {});
const rdv = () => W().SbkimRendezvous || null;
let _an = false;   // eigener Merker: Antworten in dieser Sitzung eingeschaltet

/** Zustand für die Anzeige: geladen · antwortet · Anzahl beantworteter Fragen · Name im Raum. */
export function netzStand() {
  const r = rdv();
  const m = (r && r._meta) || {};
  return { geladen: !!r, antwortet: !!m.answering || _an, beantwortet: Number(m.answeredCount) || 0, name: m.nodeName || '', fenster: !!W().SbkimRendezvousUI };
}

/** Öffnet das Mycel-Fenster (Kanon-UI von Modul 23): Verbinden, Wer ist im Raum, eigenes Netz. */
export function mycelFensterOeffnen() {
  const ui = W().SbkimRendezvousUI;
  if (ui && typeof ui.show === 'function') { try { ui.show(); return true; } catch { /* fail-soft */ } }
  return false;
}

/**
 * Baut den Netz-Korpus (nur Titel · Datum · Betrag) mit Vektoren aus Modul 03.
 * @param {{belege:object[], buchungen?:Map|object, onStatus?:(s:string,i?:number,n?:number)=>void}} p
 */
export async function netzKorpusBauen({ belege, buchungen, onStatus } = {}) {
  const emb = W().SbkimEmbedding;
  if (!emb || typeof emb.embedPassage !== 'function') throw new Error('Modul 03 (Sprachmodell) ist nicht geladen.');
  if (typeof emb.init === 'function') await emb.init();
  const eintraege = netzKorpusEintraege(belege, buchungen);
  const aus = [];
  for (let i = 0; i < eintraege.length; i++) {
    if (onStatus) onStatus('korpus', i + 1, eintraege.length);
    const v = await emb.embedPassage(eintraege[i].text);
    aus.push({ ...eintraege[i], passageVec: Array.from(v) });
  }
  return aus;
}

/** Schaltet das Antwortrecht an: Korpus übergeben, anmelden (Identität bei Bedarf), lauschen. */
export async function antwortenAn({ belege, buchungen, onStatus } = {}) {
  const r = rdv();
  if (!r || typeof r.enableAnswering !== 'function') return { ok: false, reason: 'Mycel nicht geladen.' };
  let korpus;
  try { korpus = await netzKorpusBauen({ belege, buchungen, onStatus }); }
  catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
  try { r.configure({ prepareCorpus: async () => korpus }); } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
  if (onStatus) onStatus('anmelden');
  const an = typeof r.connectAndAnnounce === 'function' ? await r.connectAndAnnounce({}).catch((e) => ({ ok: false, reason: String(e && e.message || e) })) : { ok: true };
  if (an && an.ok === false) return { ok: false, reason: an.reason || 'Anmelden fehlgeschlagen.', anzahl: korpus.length };
  const res = await r.enableAnswering({}).catch((e) => ({ ok: false, reason: String(e && e.message || e) }));
  _an = !!(res && res.ok);
  return { ok: _an, reason: res && res.reason, anzahl: korpus.length };
}

/** Schaltet das Antwortrecht ab (idempotent). */
export function antwortenAus() {
  const r = rdv();
  _an = false;
  try { if (r && typeof r.disableAnswering === 'function') r.disableAnswering(); } catch { /* fail-soft */ }
  try { if (r && typeof r.configure === 'function') r.configure({ prepareCorpus: null }); } catch { /* fail-soft */ }
  return { ok: true };
}

/**
 * Fragt die Knoten im Raum (höchstens `max`, parallel). Nutzer-ausgelöst; ohne Verbindung eine ruhige Begründung.
 * @returns {Promise<{ok:boolean, reason?:string, antworten:object[], knoten:number}>}
 */
export async function netzFragen(text, { max = 5, listenMs = 2500 } = {}) {
  const r = rdv();
  if (!r || typeof r.discover !== 'function' || typeof r.askNode !== 'function') return { ok: false, reason: 'nicht-geladen', antworten: [], knoten: 0 };
  const d = await r.discover({ listenMs }).catch((e) => ({ ok: false, reason: String(e && e.message || e), cards: [] }));
  if (!d || !d.ok) return { ok: false, reason: (d && d.reason) || 'nicht-verbunden', antworten: [], knoten: 0 };
  const karten = (d.cards || []).slice(0, max);
  if (!karten.length) return { ok: true, antworten: [], knoten: 0 };
  const antworten = await Promise.all(karten.map((c) => Promise.resolve(r.askNode(c, text))
    .then((a) => ({ ...(a || {}), nodeName: c.nodeName || '' }))
    .catch((e) => ({ ok: false, reason: String(e && e.message || e), nodeName: c.nodeName || '' }))));
  return { ok: true, antworten, knoten: karten.length };
}

// src/sbkim/netz.js — App-Seite des Mycels (Pro-Umbau 11, Klaus 2026-10-30). Ein dünner Zugang zu den Kanon-Modulen
// (window.SbkimRendezvous = Modul 23, window.SbkimRendezvousUI = dessen Fenster, window.SbkimEmbedding = Modul 03). Die Module
// selbst bleiben byte-1:1 aus Sage; hier steht nur, was BookLedgerPro ihnen gibt:
//   • antwortenAn(): BookLedgerPro beantwortet Fragen anderer Knoten — mit Titel, Datum und Betrag seiner Belege, NIE mit deren
//     Inhalt (Klaus m3). Der Korpus wird nur auf Wunsch gebaut (Sprachmodell, wie die Bedeutungssuche) und lebt nur im Speicher.
//   • netzFragen(): „Überall suchen“ fragt die anderen Knoten im Raum (nutzer-ausgelöst, Modul 23 askNode).
// Alles fail-soft: fehlt ein Modul, sagt die Antwort warum (reason), nichts wirft bis in die Ansicht.

import { netzKorpusEintraege, antwortFilter } from '../domain/ueberall.js';

const W = () => (typeof window !== 'undefined' ? window : {});
const rdv = () => W().SbkimRendezvous || null;
let _an = false;   // eigener Merker: Antworten in dieser Sitzung eingeschaltet
let _mitAusschnitt = false;   // Pro-Umbau 13: Antworten mit Ausschnitt (nur im eigenen Netz, Chefcode)
let _vecCache = new Map();    // Pro-Umbau 14 A2: eingebetteter Text → Float32Array (nur im Speicher; ein Neubau rechnet nur Neues)
let _laden = null;            // async () => {belege, buchungen, texte} — Quelle für den Neubau bei geänderten Belegen
let _neuUhr = null;
let _neuLauf = Promise.resolve();
const _stand = { anzahl: 0, am: 0 };   // Größe und Zeit des letzten Korpus (Anzeige)
const _texteLive = new Map();          // Belegtexte für den Antwort-Filter; ein Neubau tauscht den Inhalt, der Filter bleibt derselbe
/** So lange wartet der Neubau nach der letzten Beleg-Änderung (mehrere Belege auf einmal = ein Neubau). */
export const KORPUS_NEU_MS = 3000;
/** Ereignis, das src/domain/documents.js nach jeder Beleg-Änderung schickt. */
export const BELEGE_GEAENDERT = 'blp-belege-geaendert';

/** Steht Modul 23 gerade in einem eigenen Netz (Chefcode oder eigenes Netz aus dem Mycel-Fenster)? Bei jeder Frage neu gelesen. */
export function imEigenenNetz() {
  const r = rdv();
  return !!(r && r._meta && r._meta.network === 'eigen');
}

/** Zustand für die Anzeige: geladen · antwortet · Anzahl beantworteter Fragen · Name im Raum. */
export function netzStand() {
  const r = rdv();
  const m = (r && r._meta) || {};
  return { geladen: !!r, antwortet: !!m.answering || _an, beantwortet: Number(m.answeredCount) || 0, name: m.nodeName || '', fenster: !!W().SbkimRendezvousUI,
    eigen: m.network === 'eigen', mitAusschnitt: _mitAusschnitt, korpusAnzahl: _stand.anzahl, korpusAm: _stand.am };
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
export async function netzKorpusBauen({ belege, buchungen, texte = null, onStatus } = {}) {
  const emb = W().SbkimEmbedding;
  if (!emb || typeof emb.embedPassage !== 'function') throw new Error('Modul 03 (Sprachmodell) ist nicht geladen.');
  if (typeof emb.init === 'function') await emb.init();
  const eintraege = netzKorpusEintraege(belege, buchungen, { texte });
  const aus = [];
  const neu = new Map();
  for (let i = 0; i < eintraege.length; i++) {
    if (onStatus) onStatus('korpus', i + 1, eintraege.length);
    const { abschnitt, ...e } = eintraege[i];
    // Gleicher Text wie beim letzten Bau → derselbe Vektor (Pro-Umbau 14 A2: ein neuer Beleg rechnet nur seine eigenen Abschnitte).
    let v = _vecCache.get(e.text);
    if (!v) {
      const roh = await emb.embedPassage(e.text);
      // Modul 04 (queryLocal → validateCorpus) verlangt Float32Array; eine gewöhnliche Liste ließ jede Antwort still leer (Fund Pro-Umbau 13).
      v = roh instanceof Float32Array ? roh : Float32Array.from(roh);
    }
    neu.set(e.text, v);
    aus.push({ ...e, passageVec: v });
  }
  _vecCache = neu;   // nur, was im Korpus steht, bleibt im Speicher
  return aus;
}

/** Baut den Korpus aus der gemerkten Quelle neu und gibt ihn Modul 04 (ohne Aus/An). Läuft hintereinander, nie doppelt. */
export function korpusNeuBauen() {
  _neuLauf = _neuLauf.then(async () => {
    const r = rdv();
    if (!_an || typeof _laden !== 'function' || !r) return { ok: false };
    const quelle = await _laden();
    if (!_an) return { ok: false };
    const korpus = await netzKorpusBauen(quelle);
    if (!_an) return { ok: false };
    if (_mitAusschnitt && quelle && quelle.texte) { _texteLive.clear(); for (const [id, t] of (quelle.texte instanceof Map ? quelle.texte : Object.entries(quelle.texte))) _texteLive.set(id, t); }
    const m = W().SbkimMatch;   // der Antwort-Filter erbt setLocalCorpus von Modul 04
    try { r.configure({ prepareCorpus: async () => korpus }); } catch { /* fail-soft */ }
    if (m && typeof m.setLocalCorpus === 'function') m.setLocalCorpus(korpus);
    _stand.anzahl = korpus.length; _stand.am = Date.now();
    return { ok: true, anzahl: korpus.length };
  }).catch((e) => ({ ok: false, reason: String((e && e.message) || e) }));
  return _neuLauf;
}

function _beiAenderung() {
  if (!_an) return;
  clearTimeout(_neuUhr);
  _neuUhr = setTimeout(() => { korpusNeuBauen(); }, KORPUS_NEU_MS);
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener(BELEGE_GEAENDERT, _beiAenderung);

/**
 * Schaltet das Antwortrecht an: Korpus übergeben, anmelden (Identität bei Bedarf), lauschen.
 * `texte` (Belegkennung → erkannter Text) heißt „mit Ausschnitt“ (Pro-Umbau 13): nur im eigenen Netz erlaubt; der Antwort-Filter
 * (antwortFilter) prüft das zusätzlich bei jeder einzelnen Frage und antwortet außerhalb eines eigenen Netzes gar nicht.
 */
export async function antwortenAn({ belege, buchungen, texte = null, laden = null, onStatus } = {}) {
  const r = rdv();
  if (!r || typeof r.enableAnswering !== 'function') return { ok: false, reason: 'Mycel nicht geladen.' };
  // laden (Pro-Umbau 14 A2): dieselbe Quelle dient später dem Neubau, wenn Belege dazukommen oder sich ändern.
  if (typeof laden === 'function') { try { ({ belege, buchungen, texte = null } = await laden()); } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; } }
  if (texte && !imEigenenNetz()) return { ok: false, reason: 'Ausschnitte nur im eigenen Netz (Chefcode).' };
  // Läuft das Antworten schon, erst sauber aus: der neue Korpus (mit oder ohne Ausschnitt) soll die alte Fassung ersetzen.
  if (r._meta && r._meta.answering) antwortenAus();
  let korpus;
  try { korpus = await netzKorpusBauen({ belege, buchungen, texte, onStatus }); }
  catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
  const echt = W().SbkimMatch;
  if (texte && (!echt || typeof echt.queryLocal !== 'function')) return { ok: false, reason: 'Modul 04 (Treffer) ist nicht geladen.' };
  _texteLive.clear();
  if (texte) for (const [id, t] of (texte instanceof Map ? texte : Object.entries(texte))) _texteLive.set(id, t);
  try {
    r.configure({ prepareCorpus: async () => korpus, match: texte ? antwortFilter(echt, { eigen: imEigenenNetz, texte: _texteLive }) : null });
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
  _mitAusschnitt = !!texte;
  if (onStatus) onStatus('anmelden');
  const an = typeof r.connectAndAnnounce === 'function' ? await r.connectAndAnnounce({}).catch((e) => ({ ok: false, reason: String(e && e.message || e) })) : { ok: true };
  if (an && an.ok === false) return { ok: false, reason: an.reason || 'Anmelden fehlgeschlagen.', anzahl: korpus.length };
  const res = await r.enableAnswering({}).catch((e) => ({ ok: false, reason: String(e && e.message || e) }));
  _an = !!(res && res.ok);
  _laden = _an && typeof laden === 'function' ? laden : null;
  _stand.anzahl = korpus.length; _stand.am = Date.now();
  return { ok: _an, reason: res && res.reason, anzahl: new Set(korpus.map((e) => e.anchorId)).size, abschnitte: korpus.length };
}

/** Schaltet das Antwortrecht ab (idempotent). */
export function antwortenAus() {
  const r = rdv();
  _an = false;
  _laden = null; clearTimeout(_neuUhr); _vecCache = new Map(); _texteLive.clear();
  try { if (r && typeof r.disableAnswering === 'function') r.disableAnswering(); } catch { /* fail-soft */ }
  try { if (r && typeof r.configure === 'function') r.configure({ prepareCorpus: null, match: null }); } catch { /* fail-soft */ }
  _mitAusschnitt = false;
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

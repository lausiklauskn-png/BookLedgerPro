// src/ai/belegRichter.js — die fehlende Brücke „Beleg-OCR → Embedding → Richter".
//
// Bislang lief OCR-Text nur in den Heuristik-/Mistral-Kontierungspfad (ai/extract →
// ai/categorize|ai/mistral → ai/suggest). Der SBKIM-Vorfilter+Richter (embed.js + match.js)
// war für die KONTEN-Suche zwar fertig, aber NIE mit einem Beleg verbunden. Dieses Modul
// schließt die Lücke: es destilliert aus dem rohen, verrauschten OCR-Text eine knappe
// semantische Anfrage und reicht sie durch den vorhandenen Drei-Schichten-/Hybrid-Pfad an
// die SKR03-Konten (On-Device-Einbettung, EU-Richter opt-in, fail-soft).
//
// Ehrlichkeit: KEIN Fake. Die Einbettung selbst lebt im Browser (transformers.js, opt-in —
// kein Betriebs-CDN). Für Node-Tests werden `embedQuery`/`embedPassage` injiziert; die reine
// Anfrage-Destillation (`buildBelegQuery`) ist ohne Modell voll testbar.

import { accountCorpusEntries, embedCorpus } from '../sbkim/searchCorpus.js';
import { sbkimHybridSearch } from '../sbkim/hybridSearch.js';
import { loadEmbedder } from '../sbkim/embed.js';

// Beleg-Floskeln/Boilerplate, die für die Kontierung NICHTS aussagen (rein Anfrage-seitig;
// die Konten-Texte bleiben unangetastet). Klein geschrieben, Vergleich case-insensitiv.
const STOPWORDS = new Set([
  'rechnung', 'rechnungsnummer', 'rechnungsdatum', 'belegnummer', 'beleg', 'quittung',
  'datum', 'betrag', 'summe', 'gesamt', 'gesamtbetrag', 'zwischensumme', 'netto', 'brutto',
  'mwst', 'ust', 'umsatzsteuer', 'vorsteuer', 'steuer', 'eur', 'euro',
  'seite', 'nummer', 'nr', 'pos', 'menge', 'anzahl', 'stück', 'stk', 'einzelpreis',
  'kunde', 'kundennummer', 'lieferung', 'lieferdatum', 'zahlbar', 'zahlung', 'zahlungsziel',
  'iban', 'bic', 'konto', 'bank', 'ust-idnr', 'ustidnr', 'steuernummer',
  'telefon', 'tel', 'fax', 'mail', 'email', 'www', 'http', 'https',
  'straße', 'strasse', 'str', 'platz', 'weg', 'haus', 'stadt', 'land',
  'gmbh', 'kg', 'ohg', 'mbh', 'co', 'ag', 'ek', 'gbr', 'ug',
  'und', 'oder', 'für', 'der', 'die', 'das', 'den', 'dem', 'von', 'mit', 'bei', 'aus',
  'sehr', 'geehrte', 'geehrter', 'damen', 'herren', 'vielen', 'dank',
  'davon', 'inkl', 'incl', 'zzgl', 'enthalten', 'rechnungsbetrag', 'gesamtsumme',
]);

/** Anteil Ziffern in einem Token (zum Aussortieren von Beträgen/Daten/IBAN-Fragmenten). */
function digitRatio(tok) {
  if (!tok) return 1;
  let d = 0;
  for (const ch of tok) if (ch >= '0' && ch <= '9') d++;
  return d / tok.length;
}

/** Reines Token-Sieb: behält bedeutungstragende Wörter, wirft Rauschen (rein, testbar). */
function keepToken(raw) {
  // Randzeichen abstreifen, aber Bindestrich-Komposita (Kfz-Kosten) erhalten.
  const tok = String(raw || '').replace(/^[^0-9A-Za-zÄÖÜäöüß]+|[^0-9A-Za-zÄÖÜäöüß]+$/g, '');
  if (tok.length < 3) return null;
  if (tok.includes('@')) return null;                 // E-Mail
  if (/^https?:/i.test(tok)) return null;             // URL
  if (digitRatio(tok) > 0.3) return null;             // Beträge, Daten, IBAN, PLZ, Telefon …
  if (!/[A-Za-zÄÖÜäöüß]/.test(tok)) return null;      // keine Buchstaben → raus
  if (STOPWORDS.has(tok.toLowerCase())) return null;
  return tok;
}

/**
 * Destilliert aus rohem Beleg-OCR-Text + extrahierten Feldern eine knappe semantische
 * Anfrage für die Kontierung. Der Lieferant (stärkstes Kontierungs-Signal) führt; danach
 * bedeutungstragende Belegwörter (entrauscht, dedupliziert, Reihenfolge erhalten); zum
 * Schluss ein USt-Hinweis in Worten. REIN — ohne Modell, voll testbar.
 * @param {string} ocrText
 * @param {{vendor?:string, ustSatz?:number}} [extracted]
 * @param {{maxTokens?:number, maxChars?:number}} [opts]
 * @returns {string} z. B. "ARAL Tankstelle Kraftstoff Diesel 19% USt"
 */
export function buildBelegQuery(ocrText, extracted = {}, opts = {}) {
  const maxTokens = Number.isInteger(opts.maxTokens) && opts.maxTokens > 0 ? opts.maxTokens : 40;
  const maxChars = Number.isInteger(opts.maxChars) && opts.maxChars > 0 ? opts.maxChars : 240;

  const seen = new Set();
  const parts = [];
  const push = (tok) => {
    const key = tok.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(tok);
  };

  // 1. Lieferant zuerst (führendes Signal). Eigene Wörter ins seen-Set, damit OCR sie nicht doppelt bringt.
  const vendor = String((extracted && extracted.vendor) || '').trim();
  if (vendor) {
    push(vendor);
    for (const w of vendor.split(/\s+/)) { const k = keepToken(w); if (k) seen.add(k.toLowerCase()); }
  }

  // 2. Bedeutungstragende Belegwörter (entrauscht).
  for (const raw of String(ocrText || '').split(/\s+/)) {
    if (parts.length >= maxTokens) break;
    const tok = keepToken(raw);
    if (tok) push(tok);
  }

  // 3. USt-Hinweis in Worten (hilft, Vorsteuer-/Erlös-nahe Konten zu treffen).
  const satz = Number(extracted && extracted.ustSatz);
  if (Number.isFinite(satz) && satz > 0) push(`${satz}% USt`);

  let q = parts.join(' ').trim();
  if (q.length > maxChars) q = q.slice(0, maxChars).trim();
  return q;
}

/**
 * Schließt die Kette: Beleg-OCR → Anfrage (buildBelegQuery) → On-Device-Einbettung →
 * SBKIM-Vorfilter + Richter (opt-in) gegen die SKR03-Konten. Liefert Konten-Kandidaten,
 * nach Eignung sortiert, plus die tatsächlich genutzte Anfrage (Transparenz).
 *
 * NODE-TESTBAR: werden `opts.embedQuery`/`opts.embedPassage` übergeben, wird KEIN Modell
 * geladen (kein CDN). Im Browser lädt sich der Embedder einmalig opt-in über loadEmbedder.
 *
 * @param {string} ocrText  roher OCR-Text des Belegs
 * @param {{vendor?:string, ustSatz?:number}} extracted  Felder aus ai/extract
 * @param {Array<{nummer:string,name?:string,art?:string}>} konten  Kontenrahmen (SKR03)
 * @param {{embedQuery?:Function, embedPassage?:Function, apiKey?:string, k?:number,
 *          minScore?:number, transformersUrl?:string, onStatus?:Function,
 *          onProgress?:Function, queryLabel?:string, _chat?:Function}} [opts]
 * @returns {Promise<{query:string, mode:string, treffer:Array, reason?:string, attestation?:object}>}
 */
export async function belegKontierung(ocrText, extracted, konten, opts = {}) {
  opts = opts || {};
  const query = buildBelegQuery(ocrText, extracted, opts);
  if (!query) return { query: '', mode: 'leer', treffer: [] };

  const entries = accountCorpusEntries(konten);
  if (entries.length === 0) return { query, mode: 'vorfilter-leer', treffer: [] };

  // Embedder: injiziert (Node-Test) oder einmalig opt-in geladen (Browser).
  let embedQuery = opts.embedQuery;
  let embedPassage = opts.embedPassage;
  if (typeof embedQuery !== 'function' || typeof embedPassage !== 'function') {
    const e = await loadEmbedder(opts);
    embedQuery = embedQuery || e.embedQuery;
    embedPassage = embedPassage || e.embedPassage;
  }

  const corpus = await embedCorpus(entries, embedPassage, opts.onProgress);

  // minScore=0: der Vorfilter ist nie eine Sackgasse — er reicht IMMER die besten Top-k
  // durch; die eigentliche Auswahl trifft (bei opt-in) der Richter, nicht eine starre Schwelle.
  const res = await sbkimHybridSearch(query, corpus, {
    apiKey: opts.apiKey,
    provider: opts.provider,
    model: opts.model,
    queryLabel: opts.queryLabel || (extracted && extracted.vendor) || null,
    k: opts.k || 5,
    minScore: typeof opts.minScore === 'number' ? opts.minScore : 0,
    embedQuery,
    _chat: opts._chat,
  });

  return { query, ...res };
}

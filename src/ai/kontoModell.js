// src/ai/kontoModell.js
// Kontovorschlag ohne KI, zweite Stufe: ein kleines gelerntes Wortmodell neben den Regeln aus categorize.js.
//
// Stand 2026-11-12 (Klaus: „Kontovorschlag mit Lehrer“): Die Regeln allein trafen an fremden Belegen 56–73 % der Konten.
// Das Modell hier hat aus 1600 erfundenen Belegen acht verschiedener Gewerbe gelernt, welche Wörter und Wortpaare zu
// welchem Konto gehören. Es rechnet auf dem Gerät (Naive Bayes, rund 300 KB Gewichte); es läuft kein Sprachmodell und
// kein Beleg verlässt das Gerät. Maßstab und Messung: Repo Datei-Organizer, docs/PRUEFSTAPEL-BLP-REGELN.md (Punkte 23–29).
// Die Rechnung ist dieselbe wie dort in scripts/lehrer-modell.mjs und scripts/lehrer-kombination.mjs (geprüft in tests/run.mjs).

import { categorize, istEigenerBeleg } from './categorize.js';
import { SKR03_SEED, KONTOART } from '../domain/accounts.js';

const STOPP = new Set('der die das und oder für von vom mit bei den dem des ein eine einer eines einem einen ist sind wird wurde werden auf aus zum zur nach bis über unter ihre ihr ihrem ihren ihres wir sie uns unser unsere unserer bitte danke vielen dank gmbh kg ohg ag mbh inh inhaber inhaberin tel telefon fax mail www http https iban bic bank konto blz str straße strasse weg platz allee ring nr no seite datum eur euro betrag summe gesamt netto brutto mwst ust umsatzsteuer steuernummer ustidnr idnr usb'.split(' '));
const ERLOESE = new Set(['8120', '8125', '8300', '8400', '8500']);
/** Ab diesem Abstand zwischen bestem und zweitbestem Konto gilt das Modell vor den Regeln (abgestimmt, nicht mehr ändern ohne neue Messung). */
export const MODELL_SCHWELLE = 2;
/** Kennen die Regeln nur das Sammelkonto, genügt dem Modell dieser kleinere Abstand – aber nicht ein einzelnes Zufallswort. */
export const MODELL_SCHWELLE_OHNE_HINWEIS = 1;

/** Wörter eines Belegs: klein, nur Buchstaben, ab drei Zeichen; der eigene Betriebsname zählt nicht mit. */
export function woerter(text, eigenerName = '') {
  const eigen = new Set(String(eigenerName).toLowerCase().match(/[a-zäöüß]{3,}/g) || []);
  return (String(text).toLowerCase().match(/[a-zäöüß]{3,}/g) || []).filter((w) => !STOPP.has(w) && !eigen.has(w));
}

/** Merkmale: jedes Wort einmal, dazu benachbarte Wortpaare und der erkennbare Steuersatz. */
export function merkmale(text, eigenerName = '') {
  const w = woerter(text, eigenerName), m = new Set(w);
  for (let i = 0; i + 1 < w.length; i++) m.add(w[i] + ' ' + w[i + 1]);
  const t = String(text);
  if (/(?<![\d,.])19(?:[.,]0{1,2})?\s?%/.test(t)) m.add('§satz19');
  if (/(?<![\d,.])7(?:[.,]0{1,2})?\s?%/.test(t)) m.add('§satz7');
  return [...m];
}

/** Vorhersage: bestes Konto, Abstand zum zweitbesten (Maß für Sicherheit) und die drei stärksten Merkmale als Begründung. */
export function vorhersage(modell, merkmaleDesBelegs) {
  const s = modell.vorab.slice(), treffer = [];
  for (const f of merkmaleDesBelegs) { const g = modell.gewichte[f]; if (!g) continue; treffer.push(f); for (let i = 0; i < g.length; i += 2) s[g[i]] += g[i + 1]; }
  let a = 0; for (let i = 1; i < s.length; i++) if (s[i] > s[a]) a = i;
  let b = -1; for (let i = 0; i < s.length; i++) if (i !== a && (b < 0 || s[i] > s[b])) b = i;
  const wert = (f) => { const g = modell.gewichte[f]; for (let i = 0; i < g.length; i += 2) if (g[i] === a) return g[i + 1]; return 0; };
  const grund = treffer.map((f) => [f, wert(f)]).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([f]) => f);
  return { konto: modell.konten[a], zweites: modell.konten[b], abstand: treffer.length ? s[a] - s[b] : 0, merkmale: treffer.length, grund };
}

/**
 * Regeln und Modell zusammen. regel = Ergebnis von categorize, modell = Ergebnis von vorhersage.
 * eigen: der eigene Firmenname steht im Briefkopf (Ausgangsbeleg). nameBekannt: ein Firmenname ist hinterlegt.
 */
export function kombiniere(regel, modell, { schwelle = MODELL_SCHWELLE, schwelleOhneHinweis = MODELL_SCHWELLE_OHNE_HINWEIS, eigen = false, nameBekannt = false } = {}) {
  const mErloes = ERLOESE.has(modell.konto);
  // 1. Die Richtung entscheidet der Briefkopf, wenn der Firmenname bekannt ist: ein eigener Beleg ist nie ein Aufwand und umgekehrt.
  if (nameBekannt) {
    if (eigen && !mErloes && regel.richtung === 'einnahme') return { ...regel, quelle: 'regeln (eigener Beleg)' };
    if (!eigen && mErloes && regel.richtung !== 'einnahme') return { ...regel, quelle: 'regeln (fremder Beleg)' };
  }
  // 2. Das Modell gilt, wenn es etwas erkannt hat und sein Abstand zum zweiten Konto groß genug ist …
  if (modell.merkmale > 0 && modell.abstand >= schwelle) return { konto: modell.konto, richtung: mErloes || modell.konto === '1890' ? 'einnahme' : 'ausgabe', quelle: 'modell' };
  // 3. … sonst die Regeln, außer sie wissen selbst nichts (Sammelkonto) – dann doch das Modell, wenn es mehr als ein Zufallswort hat.
  if (regel.konto === '4980' && modell.merkmale > 0 && modell.abstand >= schwelleOhneHinweis) return { konto: modell.konto, richtung: mErloes || modell.konto === '1890' ? 'einnahme' : 'ausgabe', quelle: 'modell (Regeln ohne Hinweis)' };
  return { ...regel, quelle: 'regeln' };
}

let _modell = null;
/** Lädt die Gewichte erst beim ersten Vorschlag (rund 300 KB). */
export async function ladeKontoModell() {
  if (!_modell) _modell = (await import('./kontoModellDaten.js')).KONTO_MODELL;
  return _modell;
}

const SEED = new Map(SKR03_SEED.map((k) => [k.nummer, k]));
const istName = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '').length >= 4;

/**
 * Kontovorschlag ohne KI: Regeln und gelerntes Wortmodell zusammen.
 * Fällt auf die Regeln zurück, wenn das Modell nicht geladen werden kann (nie ein toter Vorschlag).
 * @param {string} text
 * @param {{eigenerName?: string}} [opts]
 * @returns {Promise<{konto:string, art:string, label:string, richtung:'einnahme'|'ausgabe', confidence:number, grund:string, herkunft:string}>}
 */
export async function kontoVorschlag(text, opts = {}) {
  const regel = categorize(text, opts);
  let modell;
  try { modell = await ladeKontoModell(); } catch { return { ...regel, herkunft: 'regeln (Modell nicht geladen)' }; }
  const name = istName(opts.eigenerName) ? opts.eigenerName : '';
  const m = vorhersage(modell, merkmale(text, name));
  const k = kombiniere(regel, m, { eigen: !!name && istEigenerBeleg(text, name), nameBekannt: !!name });
  if (k.quelle.startsWith('regeln')) return { ...regel, herkunft: k.quelle };
  const konto = SEED.get(k.konto);
  if (!konto) return { ...regel, herkunft: 'regeln (Konto des Modells unbekannt)' };
  return {
    konto: k.konto, art: konto.art || (k.richtung === 'einnahme' ? KONTOART.ERTRAG : KONTOART.AUFWAND), label: konto.name, richtung: k.richtung,
    confidence: m.abstand >= 6 ? 0.8 : m.abstand >= MODELL_SCHWELLE ? 0.6 : 0.4,
    grund: m.grund.length ? `gelernte Wörter: ${m.grund.join(', ')}` : 'gelerntes Wortmodell', herkunft: k.quelle,
  };
}

// src/ai/categorize.js
// On-Device-Kategorisierung von Belegen → Kontovorschlag (rein, testbar).
//
// EHRLICHER HINWEIS: Dies ist eine Schlüsselwort-Heuristik, KEINE semantischen
// Embeddings. Der geplante Ausbau (Transformers.js, Xenova/multilingual-e5-small,
// 384-dim — wie Sage) ist nicht eingebunden (große Bibliothek, build-frei zu
// vendorn). Bis dahin liefert diese Heuristik nachvollziehbare Vorschläge.

import { KONTOART } from '../domain/accounts.js';

// Ausgaben-Schlüsselwörter → SKR03-Aufwandskonto.
const AUSGABE_REGELN = [
  { re: /\b(miete|mietzins|pacht)\b/i, konto: '4210', label: 'Miete' },
  { re: /\b(gehalt|gehälter|lohn|löhne|personal)\b/i, konto: '4120', label: 'Gehälter' },
  { re: /\b(büro|buero|bürobedarf|papier|toner|drucker|porto)\b/i, konto: '4930', label: 'Bürobedarf' },
  { re: /\b(zeitschrift|fachbuch|fachbücher|buch|bücher|abo|abonnement)\b/i, konto: '4940', label: 'Zeitschriften, Bücher' },
  { re: /\b(wareneingang|warenkauf|einkauf|material|großhandel)\b/i, konto: '3400', label: 'Wareneingang' },
];

// Einnahmen-Schlüsselwörter → Ertragskonto.
const EINNAHME_REGELN = [
  { re: /\b(honorar|dienstleistung|beratung|erlös|erlöse|umsatz|leistung)\b/i, konto: '8400', label: 'Erlöse 19% USt' },
];

const EINNAHME_HINWEIS = /\b(ausgangsrechnung|wir berechnen|honorar|unsere leistung|rechnungssteller)\b/i;

/**
 * Schlägt anhand des Beleg-Texts ein Konto + Richtung vor.
 * @returns {{konto:string, art:string, label:string, richtung:'einnahme'|'ausgabe', confidence:number}}
 */
export function categorize(text) {
  const safe = String(text || '');
  const istEinnahme = EINNAHME_HINWEIS.test(safe) || EINNAHME_REGELN.some((r) => r.re.test(safe));

  if (istEinnahme) {
    const treffer = EINNAHME_REGELN.find((r) => r.re.test(safe));
    return {
      konto: treffer ? treffer.konto : '8400',
      art: KONTOART.ERTRAG,
      label: treffer ? treffer.label : 'Erlöse 19% USt',
      richtung: 'einnahme',
      confidence: treffer ? 0.7 : 0.4,
    };
  }

  const treffer = AUSGABE_REGELN.find((r) => r.re.test(safe));
  if (treffer) {
    return { konto: treffer.konto, art: KONTOART.AUFWAND, label: treffer.label, richtung: 'ausgabe', confidence: 0.7 };
  }
  // Fallback: sonstige betriebliche Aufwendungen.
  return { konto: '4980', art: KONTOART.AUFWAND, label: 'Sonstige betriebliche Aufwendungen', richtung: 'ausgabe', confidence: 0.3 };
}

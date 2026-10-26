// src/domain/rechnungsstelle.js
// BAUPLAN Block 2 / Schritt 4 — Setting `rechnungsstelle`: Nummernkreis-Hoheit.
// REINE, node-getestete Logik. Grundlage: docs/KALKULATION_KATALOG.md §7a.
//
// Kontext (GoBD-Lückenlosigkeit): Genau EIN System vergibt die verbindliche
// §14-Rechnungsnummer — entweder BookLedgerPro selbst (`blp`) oder ein externes
// Programm / der Steuerberater (`extern`). NIE beide Kreise gleichzeitig.
//   - blp    : BLP vergibt echte §14-Nummern (lückenlos, naechsteRechnungsnummer);
//              Rechnung geht so zum Kunden, DATEV verbucht nur (EXTF-Export).
//   - extern : BLP erzeugt nur eine VORLÄUFIGE Vorlage mit interner Nummer
//              (ENT-JJJJ-NNNN), vergibt KEINE §14-Nummer; die endgültige Nummer
//              vergibt das externe System.
//
// Diese Schicht liefert NUR Normalisierung + Politik (Default, Prädikate, vorläufige
// Nummer, Wechsel-Hinweis). Konsumiert wird sie von den Angebots-/Rechnungs-Schritten
// (Block 2 / Schritte 7+8): Nummernvergabe, Dokument-Beschriftung, Export.
//
// EHRLICHE GRENZE: Das Setting steuert NUR BLP — es zwingt das externe Programm nicht;
// es ist eine reine Koordinations-Weiche gegen doppelte Nummernkreise.

/** Wer stellt die Rechnungen aus? Default `blp` (additiv/sicher; Bestand unverändert). */
export const RECHNUNGSSTELLE = Object.freeze({
  BLP: 'blp',       // BookLedgerPro vergibt echte §14-Nummern
  EXTERN: 'extern', // externes Programm/Steuerberater stellt aus → BLP nur Vorlage
});

export const RECHNUNGSSTELLE_LISTE = [RECHNUNGSSTELLE.BLP, RECHNUNGSSTELLE.EXTERN];

/** Default: `blp` — fehlt das Setting, vergibt BLP wie bisher echte Nummern. */
export const RECHNUNGSSTELLE_DEFAULT = RECHNUNGSSTELLE.BLP;

/** Ist der Wert eine gültige Rechnungsstelle? */
export function istRechnungsstelle(wert) {
  return RECHNUNGSSTELLE_LISTE.includes(wert);
}

/** Normalisiert auf eine gültige Rechnungsstelle (Fallback: blp). */
export function normalizeRechnungsstelle(wert) {
  return istRechnungsstelle(wert) ? wert : RECHNUNGSSTELLE_DEFAULT;
}

/** Liest die Rechnungsstelle aus den Settings (normalisiert). */
export function rechnungsstelleVon(settings) {
  return normalizeRechnungsstelle(settings && settings.rechnungsstelle);
}

export function istBlpRechnungsstelle(settings) {
  return rechnungsstelleVon(settings) === RECHNUNGSSTELLE.BLP;
}
export function istExternRechnungsstelle(settings) {
  return rechnungsstelleVon(settings) === RECHNUNGSSTELLE.EXTERN;
}

/**
 * Vergibt BLP im aktuellen Modus echte §14-Nummern? (= blp). Semantischer Helfer
 * für die Angebots-/Rechnungs-Schritte (7/8): nur bei `blp` wird der lückenlose
 * §14-Kreis fortgeschrieben; bei `extern` bleibt es bei einer internen Vorlage.
 */
export function vergibtBlpNummern(settings) {
  return istBlpRechnungsstelle(settings);
}

/** Präfix der vorläufigen, internen Nummer im extern-Modus (kein §14-Kreis). */
export const VORLAEUFIG_PREFIX = 'ENT';

/**
 * Vorläufige, INTERNE Rechnungsnummer für den extern-Modus (z. B. ENT-2026-0007).
 * KEINE §14-Nummer — kennzeichnet eine Vorlage/einen Entwurf, dessen endgültige
 * Nummer das externe System vergibt. Format an formatRechnungsnummer angelehnt
 * (Jahr + vierstellige laufende Zahl), mit klarem Präfix.
 */
export function vorlaeufigeRechnungsnummer(seq, jahr) {
  return `${VORLAEUFIG_PREFIX}-${jahr}-${String(seq).padStart(4, '0')}`;
}

/** Ist `nummer` eine vorläufige interne Nummer (kein verbindlicher §14-Kreis)? */
export function istVorlaeufigeNummer(nummer) {
  return typeof nummer === 'string' && nummer.startsWith(`${VORLAEUFIG_PREFIX}-`);
}

/**
 * Politik für den WECHSEL der Rechnungsstelle (Katalog §7a, ehrliche Grenze 1).
 * Heikel ist NUR der Wechsel blp→extern, wenn BLP im laufenden Betrieb bereits
 * §14-Nummern vergeben hat: die bereits vergebenen Nummern bleiben gültig, BLP
 * vergibt aber keine neuen mehr → GoBD-Lückenlosigkeit. Daher: erlaubt, aber
 * WARNEN (die UI verlangt eine Bestätigung). Alle anderen Wechsel sind unkritisch.
 *
 * @param {string} aktuell aktuelle Rechnungsstelle
 * @param {string} ziel    gewünschte Rechnungsstelle
 * @param {{vergebeneNummern?:number}} [opts] Anzahl bereits vergebener §14-Nummern
 * @returns {{erlaubt:boolean, warnen:boolean, code:string}}
 */
export function rechnungsstelleWechselHinweis(aktuell, ziel, opts = {}) {
  const von = normalizeRechnungsstelle(aktuell);
  const nach = normalizeRechnungsstelle(ziel);
  const vergebeneNummern = Number(opts.vergebeneNummern) || 0;
  if (von === nach) return { erlaubt: true, warnen: false, code: 'unveraendert' };
  if (von === RECHNUNGSSTELLE.BLP && nach === RECHNUNGSSTELLE.EXTERN && vergebeneNummern > 0) {
    // Wechsel weg von BLP, obwohl BLP schon einen §14-Kreis führt → Warnung/Bestätigung.
    return { erlaubt: true, warnen: true, code: 'blp-nummern-vergeben' };
  }
  return { erlaubt: true, warnen: false, code: 'ok' };
}

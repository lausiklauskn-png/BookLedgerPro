// src/domain/bilanzierung.js
// B1 — Grundlage der zweiten Gewinnermittlungsart: Betriebsvermögensvergleich
// (Bilanzierung, §4 Abs.1 / §5 EStG) neben der EÜR (§4 Abs.3 EStG).
//
// Diese Datei ist REINE, node-getestete Logik: der Modus-Wert + die Klassifikation
// der Konten in Bilanz-Bereich (Bestandskonten → Aktiva/Passiva) und GuV-Bereich
// (Erfolgskonten → Aufwand/Ertrag). Die eigentliche GuV (B2) und Bilanz (B3) bauen
// hierauf auf — sie sind NICHT Teil von B1.
//
// EHRLICHE GRENZE: Dies legt nur die Grundlage. Es gibt (noch) keine GuV-/Bilanz-
// Auswertung, keinen Konzernabschluss und keine E-Bilanz-Taxonomie.

import { KONTOART, mehrungsSeite } from './accounts.js';

/** Gewinnermittlungsart. Default `euer` → Bestandsnutzer bleiben unverändert. */
export const GEWINNERMITTLUNG = Object.freeze({
  EUER: 'euer',     // Einnahmen-Überschuss-Rechnung (§4 Abs.3 EStG)
  BILANZ: 'bilanz', // Betriebsvermögensvergleich (§4 Abs.1 / §5 EStG) → GuV + Bilanz
});

export const GEWINNERMITTLUNG_LISTE = [GEWINNERMITTLUNG.EUER, GEWINNERMITTLUNG.BILANZ];

/** Ist der Wert eine gültige Gewinnermittlungsart? */
export function istGewinnermittlung(wert) {
  return GEWINNERMITTLUNG_LISTE.includes(wert);
}

/** Normalisiert auf eine gültige Gewinnermittlungsart (Fallback: EÜR). */
export function normalizeGewinnermittlung(wert) {
  return istGewinnermittlung(wert) ? wert : GEWINNERMITTLUNG.EUER;
}

/** Bilanziert der Mandant (Betriebsvermögensvergleich)? */
export function istBilanzierung(settings) {
  return normalizeGewinnermittlung(settings && settings.gewinnermittlung) === GEWINNERMITTLUNG.BILANZ;
}

// ---- Konten-Klassifikation -------------------------------------------------

/** Bilanz-Bestandskonto (Aktiv/Passiv) → erscheint in der Bilanz. */
export function istBestandskonto(art) {
  return art === KONTOART.AKTIV || art === KONTOART.PASSIV;
}

/** GuV-Erfolgskonto (Aufwand/Ertrag) → erscheint in der GuV. */
export function istErfolgskonto(art) {
  return art === KONTOART.AUFWAND || art === KONTOART.ERTRAG;
}

/** Abschluss-Bereiche: Bestandskonten → Bilanz, Erfolgskonten → GuV. */
export const BEREICH = Object.freeze({ BILANZ: 'bilanz', GUV: 'guv' });

/** In welchen Abschlussteil gehört ein Konto dieser Kontoart? */
export function abschlussBereich(art) {
  return istBestandskonto(art) ? BEREICH.BILANZ : BEREICH.GUV;
}

/** Bilanzseite eines Bestandskontos: 'aktiva' | 'passiva'; null für Erfolgskonten. */
export function bilanzSeite(art) {
  if (art === KONTOART.AKTIV) return 'aktiva';
  if (art === KONTOART.PASSIV) return 'passiva';
  return null;
}

/** GuV-Seite eines Erfolgskontos: 'aufwand' | 'ertrag'; null für Bestandskonten. */
export function guvSeite(art) {
  if (art === KONTOART.AUFWAND) return 'aufwand';
  if (art === KONTOART.ERTRAG) return 'ertrag';
  return null;
}

/**
 * Klassifiziert ein Konto für den Abschluss (rein, ohne Salden).
 * @param {{art:string}} konto
 * @returns {{bereich:string, bilanzSeite:?string, guvSeite:?string, mehrung:string}}
 */
export function klassifiziereKonto(konto) {
  const art = konto && konto.art;
  return {
    bereich: abschlussBereich(art),
    bilanzSeite: bilanzSeite(art),
    guvSeite: guvSeite(art),
    mehrung: mehrungsSeite(art),
  };
}

// ---- Konten-Grundlage für die Bilanzierung ---------------------------------
// Konten, die ein Betriebsvermögensvergleich braucht, die der schlanke EÜR-Seed
// aber nicht enthält. Sie sind im SKR03-Seed (accounts.js) definiert; beim Wechsel
// in den Bilanz-Modus werden sie über store.ensureSeedKonten() nachgezogen, damit
// auch ältere Tresore die Grundlage erhalten. Der Saldenvortrag (9000) ist bereits
// im Basis-Seed enthalten und dient als Eröffnungs-/Anfangsbestands-Konto.
export const BILANZ_GRUNDKONTO_NUMMERN = Object.freeze(['0800', '0840', '0860', '0970']);

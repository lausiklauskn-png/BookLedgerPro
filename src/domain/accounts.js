// src/domain/accounts.js
// Kontenplan (SKR03-Auswahl, "light"). Konto-Typen bestimmen die Soll/Haben-Logik
// für Salden und Auswertungen.

export const KONTOART = {
  AKTIV: 'aktiv',       // Bestandskonto Aktiva (Soll mehrt) — z.B. Bank, Kasse, Vorsteuer
  PASSIV: 'passiv',     // Bestandskonto Passiva (Haben mehrt) — z.B. Umsatzsteuer, Verbindlichkeiten
  AUFWAND: 'aufwand',   // Erfolgskonto Aufwand (Soll mehrt)
  ERTRAG: 'ertrag',     // Erfolgskonto Ertrag (Haben mehrt)
};

/** Auf welcher Seite mehrt sich das Konto? 'S' (Soll) für Aktiv/Aufwand, 'H' für Passiv/Ertrag. */
export function mehrungsSeite(kontoart) {
  return (kontoart === KONTOART.AKTIV || kontoart === KONTOART.AUFWAND) ? 'S' : 'H';
}

/**
 * Saldo eines Kontos aus seinen Zeilen-Bewegungen.
 * @param {{soll:number, haben:number}} bewegung - Summen in Cent
 * @returns {number} Saldo in Cent im Sinne der Mehrungsseite (positiv = übliches Vorzeichen)
 */
export function saldo(kontoart, bewegung) {
  const diff = (bewegung.soll || 0) - (bewegung.haben || 0);
  return mehrungsSeite(kontoart) === 'S' ? diff : -diff;
}

// SKR03-Auswahl. Bewusst klein gehalten; in Phase 4 erweiterbar / SKR04-Profil.
// ustSatz/vorsteuerSatz nur informativ für Standard-Buchungen.
export const SKR03_SEED = [
  // Aktiva
  { nummer: '1000', name: 'Kasse', art: KONTOART.AKTIV, rolle: 'geld' },
  { nummer: '1200', name: 'Bank', art: KONTOART.AKTIV, rolle: 'geld' },
  { nummer: '1400', name: 'Forderungen aus Lieferungen und Leistungen', art: KONTOART.AKTIV },
  { nummer: '1576', name: 'Abziehbare Vorsteuer 19%', art: KONTOART.AKTIV, ust: 19, rolle: 'vorsteuer' },
  { nummer: '1571', name: 'Abziehbare Vorsteuer 7%', art: KONTOART.AKTIV, ust: 7, rolle: 'vorsteuer' },
  // Passiva
  { nummer: '1600', name: 'Verbindlichkeiten aus Lieferungen und Leistungen', art: KONTOART.PASSIV },
  { nummer: '1776', name: 'Umsatzsteuer 19%', art: KONTOART.PASSIV, ust: 19, rolle: 'umsatzsteuer' },
  { nummer: '1771', name: 'Umsatzsteuer 7%', art: KONTOART.PASSIV, ust: 7, rolle: 'umsatzsteuer' },
  { nummer: '0880', name: 'Eigenkapital', art: KONTOART.PASSIV, rolle: 'eigenkapital' },
  // Aufwand
  { nummer: '3400', name: 'Wareneingang 19% Vorsteuer', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4120', name: 'Gehälter', art: KONTOART.AUFWAND },
  { nummer: '4210', name: 'Miete', art: KONTOART.AUFWAND },
  { nummer: '4930', name: 'Bürobedarf', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4940', name: 'Zeitschriften, Bücher', art: KONTOART.AUFWAND, ust: 7 },
  { nummer: '4980', name: 'Sonstige betriebliche Aufwendungen', art: KONTOART.AUFWAND },
  // Ertrag
  { nummer: '8400', name: 'Erlöse 19% USt', art: KONTOART.ERTRAG, ust: 19 },
  { nummer: '8300', name: 'Erlöse 7% USt', art: KONTOART.ERTRAG, ust: 7 },
  { nummer: '8200', name: 'Erlöse', art: KONTOART.ERTRAG, ust: 0 },
];

export function seedAccounts() {
  return SKR03_SEED.map((k) => ({ id: `konto:${k.nummer}`, type: 'konto', ...k }));
}

export function isVorsteuerKonto(konto) { return konto && konto.rolle === 'vorsteuer'; }
export function isUmsatzsteuerKonto(konto) { return konto && konto.rolle === 'umsatzsteuer'; }
/** Geldkonto (Kasse/Bank) — Zahlungsmittel für die Ist-Versteuerung (Zufluss/Abfluss). */
export function isGeldKonto(konto) { return konto && konto.rolle === 'geld'; }
/** Eigenkapital/Privat — erfolgsneutral, zählt NICHT als Betriebseinnahme/-ausgabe (EÜR). */
export function isEigenkapitalKonto(konto) { return konto && konto.rolle === 'eigenkapital'; }

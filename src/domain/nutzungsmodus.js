// src/domain/nutzungsmodus.js
// R6/P1 — Privat-/Bürger-Modus: Grundlage für einen vereinfachten Nutzungskontext
// neben dem vollen Firmen-Modus.
//
// Diese Datei ist REINE, node-getestete Logik. Sie unterscheidet sich bewusst vom
// bestehenden `mode` (einfach/profi/berater) in state.js: jener steuert die
// UI-KOMPLEXITÄT, dieser hier den fachlichen NUTZUNGSKONTEXT:
//   - firma  : Unternehmen/Freiberufler (voller Funktionsumfang, Default, unverändert)
//   - privat : Privatperson / Haushaltsbuch (Einnahmen/Ausgaben + Belege, ohne USt/
//              Mahnwesen/Rechnungen/Anlagen/Lohn)
//   - verein : gemeinnütziger Verein (EÜR-nah, Kassenbuch wichtig; ohne Rechnungs-/
//              Mahnwesen/Lohn — Mitglieder statt Kunden)
//
// Was diese Schicht TUT: sie liefert (a) die gültigen Modi + Normalisierung und
// (b) eine reine Gating-Politik — welche NAV-Ansichten und welche fachlichen
// Features im jeweiligen Modus relevant sind. Die Shell konsumiert `zeigeAnsicht`
// für die Navigation; `zeigeFeature` ist die Grundlage für späteres Ansichts-
// internes Ausblenden (P2 ff.).
//
// EHRLICHE GRENZE: Das Gating ist eine KURATIERTE Auswahl zum Entrümpeln, KEINE
// rechtliche Einschränkung. Im Zweifel den Firmen-Modus wählen (zeigt alles).
// Der Default `firma` lässt Bestandsnutzer unverändert.

/** Nutzungskontext. Default `firma` → Bestandsnutzer bleiben unverändert. */
export const NUTZUNGSMODUS = Object.freeze({
  FIRMA: 'firma',   // Unternehmen/Freiberufler — voller Funktionsumfang
  PRIVAT: 'privat', // Privatperson / Haushaltsbuch
  VEREIN: 'verein', // gemeinnütziger Verein
});

export const NUTZUNGSMODUS_LISTE = [NUTZUNGSMODUS.FIRMA, NUTZUNGSMODUS.PRIVAT, NUTZUNGSMODUS.VEREIN];

/** Ist der Wert ein gültiger Nutzungsmodus? */
export function istNutzungsmodus(wert) {
  return NUTZUNGSMODUS_LISTE.includes(wert);
}

/** Normalisiert auf einen gültigen Nutzungsmodus (Fallback: firma). */
export function normalizeNutzungsmodus(wert) {
  return istNutzungsmodus(wert) ? wert : NUTZUNGSMODUS.FIRMA;
}

/** Liest den Nutzungsmodus aus den Settings (normalisiert). */
export function nutzungsmodusVon(settings) {
  return normalizeNutzungsmodus(settings && settings.nutzungsmodus);
}

export function istFirmenmodus(settings) { return nutzungsmodusVon(settings) === NUTZUNGSMODUS.FIRMA; }
export function istPrivatmodus(settings) { return nutzungsmodusVon(settings) === NUTZUNGSMODUS.PRIVAT; }
export function istVereinsmodus(settings) { return nutzungsmodusVon(settings) === NUTZUNGSMODUS.VEREIN; }

// ---- NAV-Ansichten-Gating --------------------------------------------------
// Allowlist-Komplement: je Modus die NAV-Schlüssel, die AUSGEBLENDET werden.
// Firma blendet nichts aus (voller Umfang). Die Schlüssel entsprechen den NAV-Keys
// in ui/shell.js (dashboard/journal/kassenbuch/accounts/anlagen/documents/payables/
// orders/customers/employees/reports/berichte/network/legal/anleitung/selbsttest/
// about/settings). Unbekannte Schlüssel werden NICHT ausgeblendet (sicher additiv).
const ANSICHT_AUSGEBLENDET = Object.freeze({
  // Privatperson: nur Buchen/Belege/einfache Auswertung. Kein Anlagevermögen, keine
  // Kreditoren-OP, keine Aufträge/Kunden/Mitarbeiter, keine Berater-Berichte, kein Mycel.
  privat: new Set(['anlagen', 'payables', 'orders', 'angebote', 'nachkalkulation', 'customers', 'employees', 'lohn', 'berichte', 'network']),
  // Verein: wie Privat, aber MIT Berichten (SuSa/EÜR), „Kunden" als Mitglieder/Spender
  // und Mycel-Anbindung. Ohne Anlagevermögen-AfA, Kreditoren-OP, Aufträge/Angebote, Lohn/Mitarbeiter.
  verein: new Set(['anlagen', 'payables', 'orders', 'angebote', 'nachkalkulation', 'employees', 'lohn']),
});

/** Soll die NAV-Ansicht `key` im Modus der Settings sichtbar sein? */
export function zeigeAnsicht(settings, key) {
  const modus = nutzungsmodusVon(settings);
  if (modus === NUTZUNGSMODUS.FIRMA) return true;
  const aus = ANSICHT_AUSGEBLENDET[modus];
  return aus ? !aus.has(key) : true;
}

/** Filtert eine Liste von NAV-Schlüsseln auf die im Modus sichtbaren. */
export function sichtbareAnsichten(settings, keys) {
  return (keys || []).filter((k) => zeigeAnsicht(settings, k));
}

// ---- Fachliche Feature-Gates (Grundlage für P2 ff.) ------------------------
// Konzeptuelle Features, die einzelne Ansichten intern ein-/ausblenden können
// (z. B. USt-Felder im Journal, Rechnungs-Knöpfe). In diesem Schritt definiert +
// node-getestet; konsumiert wird das schrittweise in den Folge-PRs.
export const FEATURE = Object.freeze({
  UMSATZSTEUER: 'umsatzsteuer',     // USt-Ausweis / Voranmeldung / Vorsteuer
  RECHNUNGEN: 'rechnungen',         // Ausgangsrechnungen / Aufträge / Forderungen
  MAHNWESEN: 'mahnwesen',           // Mahnungen / Verzugszinsen
  ANLAGEN: 'anlagen',               // Anlagevermögen / AfA
  MITARBEITER: 'mitarbeiter',       // Mitarbeiter / Zeiterfassung
  KOSTENSTELLEN: 'kostenstellen',   // Kostenstellen-Auswertung
  VERBINDLICHKEITEN: 'verbindlichkeiten', // Kreditoren-OP / Eingangsrechnungen auf Ziel
  BERATER_EXPORT: 'beraterExport',  // DATEV-EXTF / GDPdU / Übergabe-Berichte
});

export const FEATURE_LISTE = Object.freeze(Object.values(FEATURE));

// Je Modus die ausgeblendeten Features (Firma = keine).
const FEATURE_AUSGEBLENDET = Object.freeze({
  privat: new Set([
    FEATURE.UMSATZSTEUER, FEATURE.RECHNUNGEN, FEATURE.MAHNWESEN, FEATURE.ANLAGEN,
    FEATURE.MITARBEITER, FEATURE.KOSTENSTELLEN, FEATURE.VERBINDLICHKEITEN, FEATURE.BERATER_EXPORT,
  ]),
  verein: new Set([
    FEATURE.RECHNUNGEN, FEATURE.MAHNWESEN, FEATURE.MITARBEITER,
  ]),
});

/** Ist das fachliche Feature im Modus der Settings relevant/sichtbar? */
export function zeigeFeature(settings, feature) {
  const modus = nutzungsmodusVon(settings);
  if (modus === NUTZUNGSMODUS.FIRMA) return true;
  const aus = FEATURE_AUSGEBLENDET[modus];
  return aus ? !aus.has(feature) : true;
}

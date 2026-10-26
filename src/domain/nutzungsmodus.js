// src/domain/nutzungsmodus.js
// Modus nach Nutzerart (Klaus 2026-10-26, Sammlung F): Privat · Kleinunternehmer · Selbstständig · Berater.
// Ersetzt die zwei alten Schalter „Einfach/Profi/Berater" (`mode`, wirkte nirgends) und
// „Firma/Privat/Verein" (`nutzungsmodus`). Der Schlüssel in den Einstellungen bleibt `nutzungsmodus`;
// alte Werte zieht `modusNachziehen` beim Laden nach (Daten bleiben, nichts wird gelöscht — F2).
//
// Diese Datei ist REINE, node-getestete Logik:
//   (a) gültige Modi + Normalisierung + Migration alter Einstellungen
//   (b) Gating: welche NAV-Ansichten, fachlichen Features und Einstellungs-Abschnitte im Modus sichtbar sind
//   (c) Wirkung auf § 19 UStG (`kleinunternehmer`) beim Moduswechsel
// Die Shell fragt `zeigeAnsicht` (Navigation), `zeigeFeature` (Formularfelder/Kacheln) und
// `zeigeEinstellung` (Einstellungs-Abschnitte); F3 „Alle Einstellungen zeigen" hebt das Ausblenden der
// Einstellungen auf.
//
// EHRLICHE GRENZE: Das Gating ist eine kuratierte Auswahl zum Entrümpeln, keine rechtliche Einschränkung.
// Was der Modus Privat FACHLICH braucht (Haushaltsbuch, Steuer-Anlagen), ist ein eigener Bauabschnitt
// (Brief 2026-10-26, Schritte 3 und 4) — hier wird nur ausgeblendet, was nicht privat ist.
// „Verein" (Sammlung D13) ist noch nicht entschieden: ein gespeicherter alter Wert bleibt erhalten und
// sichtbar wählbar, solange er gesetzt ist; neu anbieten tut ihn der Schalter nicht.

export const NUTZUNGSMODUS = Object.freeze({
  PRIVAT: 'privat',                     // Arbeitnehmer, Arbeitslose, Rentner, Vermieter, Ehrenamt — private Einkommensteuer
  KLEINUNTERNEHMER: 'kleinunternehmer', // § 19 UStG — Nebengewerbe, kleine Selbstständige
  SELBSTSTAENDIG: 'selbststaendig',     // regelbesteuert — Freiberufler, kleine Unternehmen
  BERATER: 'berater',                   // betreut mehrere Mandanten, alles sichtbar
  VEREIN: 'verein',                     // nur als Altwert erhalten (D13 offen)
});

/** Die vier Modi des Schalters (Reihenfolge wie bei Klaus). */
export const NUTZUNGSMODUS_LISTE = [NUTZUNGSMODUS.PRIVAT, NUTZUNGSMODUS.KLEINUNTERNEHMER, NUTZUNGSMODUS.SELBSTSTAENDIG, NUTZUNGSMODUS.BERATER];
/** Alle gültigen Werte (mit dem Altwert verein). */
export const NUTZUNGSMODUS_ALLE = [...NUTZUNGSMODUS_LISTE, NUTZUNGSMODUS.VEREIN];
/** Startwert ohne Wahl: voller Umfang wie der frühere Default „firma" (Bestand unverändert). */
export const NUTZUNGSMODUS_DEFAULT = NUTZUNGSMODUS.SELBSTSTAENDIG;

export function istNutzungsmodus(wert) { return NUTZUNGSMODUS_ALLE.includes(wert); }

/** Normalisiert auf einen gültigen Modus (Fallback: selbststaendig). */
export function normalizeNutzungsmodus(wert) {
  return istNutzungsmodus(wert) ? wert : NUTZUNGSMODUS_DEFAULT;
}

/** Liest den Modus aus den Settings; alte Werte werden dabei nachgezogen (ohne zu speichern). */
export function nutzungsmodusVon(settings) {
  return normalizeNutzungsmodus(modusNachziehen(settings || {}).nutzungsmodus);
}

export function istPrivatmodus(settings) { return nutzungsmodusVon(settings) === NUTZUNGSMODUS.PRIVAT; }
export function istKleinunternehmermodus(settings) { return nutzungsmodusVon(settings) === NUTZUNGSMODUS.KLEINUNTERNEHMER; }
export function istBeratermodus(settings) { return nutzungsmodusVon(settings) === NUTZUNGSMODUS.BERATER; }
export function istVereinsmodus(settings) { return nutzungsmodusVon(settings) === NUTZUNGSMODUS.VEREIN; }
/** Unternehmerisch = alles außer Privat (Journal, USt, Rechnungen …). */
export function istUnternehmermodus(settings) { return !istPrivatmodus(settings); }

// ---- Migration alter Einstellungen ----------------------------------------
// Alt: nutzungsmodus firma|privat|verein, mode einfach|profi|berater, kleinunternehmer true|false.
//   privat → privat · verein → verein (Altwert) · firma + mode berater → berater ·
//   firma + kleinunternehmer → kleinunternehmer · sonst → selbststaendig.
// Ein schon neuer Wert bleibt. Gibt ein NEUES Objekt zurück; das Feld `mode` wird entfernt.
export function modusNachziehen(settings) {
  const s = { ...(settings || {}) };
  const alt = s.nutzungsmodus;
  if (NUTZUNGSMODUS_ALLE.includes(alt) && alt !== NUTZUNGSMODUS.VEREIN) { delete s.mode; return s; }
  if (alt === NUTZUNGSMODUS.VEREIN) { delete s.mode; return s; }
  if (alt === 'privat') s.nutzungsmodus = NUTZUNGSMODUS.PRIVAT;
  else if (s.mode === 'berater') s.nutzungsmodus = NUTZUNGSMODUS.BERATER;
  else if (s.kleinunternehmer === true) s.nutzungsmodus = NUTZUNGSMODUS.KLEINUNTERNEHMER;
  else s.nutzungsmodus = NUTZUNGSMODUS.SELBSTSTAENDIG;
  delete s.mode;
  return s;
}

// ---- Wirkung auf § 19 beim Moduswechsel (F4/F6) ---------------------------
// Kleinunternehmer → kleinunternehmer:true (fest). Selbstständig → false. Privat → unverändert
// (irrelevant, ausgeblendet). Berater → unverändert (§ 19 bleibt als eigene Einstellung sichtbar).
// `rueckfrage` = true, wenn der Wechsel Steuerliches ändert (F4: kurze Rückfrage).
export function moduswechsel(settings, neu) {
  const modus = normalizeNutzungsmodus(neu);
  const alt = nutzungsmodusVon(settings);
  const patch = { nutzungsmodus: modus };
  const war = !!(settings && settings.kleinunternehmer);
  if (modus === NUTZUNGSMODUS.KLEINUNTERNEHMER) patch.kleinunternehmer = true;
  else if (modus === NUTZUNGSMODUS.SELBSTSTAENDIG) patch.kleinunternehmer = false;
  const aendertSteuer = (modus === NUTZUNGSMODUS.KLEINUNTERNEHMER && !war) || (modus === NUTZUNGSMODUS.SELBSTSTAENDIG && war);
  return { patch, rueckfrage: alt !== modus && aendertSteuer };
}

// ---- NAV-Ansichten-Gating --------------------------------------------------
// Allowlist-Komplement: je Modus die NAV-Schlüssel, die AUSGEBLENDET werden. Berater blendet nichts aus.
// Unbekannte Schlüssel werden NICHT ausgeblendet (sicher additiv).
const UNTERNEHMERISCH = ['journal', 'kassenbuch', 'accounts', 'anlagen', 'payables', 'orders', 'angebote', 'calculate', 'needs', 'shopbuchung',
  'nachkalkulation', 'customers', 'employees', 'lohn', 'reports', 'berichte'];
const ANSICHT_AUSGEBLENDET = Object.freeze({
  // Privat (F, Tabelle): alles Unternehmerische weg — Journal/Soll-Haben, Kontenrahmen, Aufträge, Kunden,
  // Mitarbeiter, EÜR/USt-Auswertung, DATEV. Es bleiben Übersicht, Belege, Geheim-Fach, Recht & Doku, Anleitung,
  // Selbsttest, Über, Einstellungen (Haushaltsbuch/Steuer folgen in Schritt 3/4) — UND das Netz: Klaus (2026-10-26)
  // „im Privatmodus soll noch die SBKIM-Suche mit drin sein … auch das Mycel, inklusive des Siegels. Wenn man nämlich
  // privat seine Apps verbinden will …" → 'network' und 'sbkimsuche' sind in keinem Modus ausgeblendet.
  privat: new Set(UNTERNEHMERISCH),
  // Kleinunternehmer: ohne Mitarbeiter/Lohn (Kostenstellen stecken in Mitarbeiter/Auswertung → Feature-Gate).
  kleinunternehmer: new Set(['employees', 'lohn']),
  // Selbstständig: alles außer Berater-Dingen (Mandantenwechsel/Export sind Features, keine Ansichten).
  selbststaendig: new Set([]),
  berater: new Set([]),
  // Altwert Verein (unverändert aus P1): ohne Anlagen, Kreditoren-OP, Aufträge/Angebote, Lohn/Mitarbeiter.
  verein: new Set(['anlagen', 'payables', 'orders', 'angebote', 'calculate', 'needs', 'shopbuchung', 'nachkalkulation', 'employees', 'lohn']),
});

/** Soll die NAV-Ansicht `key` im Modus der Settings sichtbar sein? */
export function zeigeAnsicht(settings, key) {
  // BLPs eigene Angebote sind durch Workflow Calculate ersetzt (Klaus 2026-10-26, D15b): nur noch sichtbar, wenn
  // alte Angebote angesehen werden sollen (angeboteAlt, Knopf im Calculate-Rahmen); die Übergabe-Route bleibt erreichbar.
  if (key === 'angebote' && !(settings && settings.angeboteAlt)) return false;
  const aus = ANSICHT_AUSGEBLENDET[nutzungsmodusVon(settings)];
  return aus ? !aus.has(key) : true;
}

/** Filtert eine Liste von NAV-Schlüsseln auf die im Modus sichtbaren. */
export function sichtbareAnsichten(settings, keys) {
  return (keys || []).filter((k) => zeigeAnsicht(settings, k));
}

// ---- Fachliche Feature-Gates -------------------------------------------------
export const FEATURE = Object.freeze({
  UMSATZSTEUER: 'umsatzsteuer',     // USt-Ausweis / Voranmeldung / Vorsteuer / Zahllast-Kachel
  RECHNUNGEN: 'rechnungen',         // Ausgangsrechnungen / Aufträge / Forderungen
  MAHNWESEN: 'mahnwesen',           // Mahnungen / Verzugszinsen
  ANLAGEN: 'anlagen',               // Anlagevermögen / AfA
  MITARBEITER: 'mitarbeiter',       // Mitarbeiter / Zeiterfassung
  KOSTENSTELLEN: 'kostenstellen',   // Kostenstellen-Auswertung
  VERBINDLICHKEITEN: 'verbindlichkeiten', // Kreditoren-OP / Eingangsrechnungen auf Ziel
  BERATER_EXPORT: 'beraterExport',  // DATEV-EXTF / GDPdU / Übergabe-Berichte
  MANDANTEN: 'mandanten',           // Mandantenwechsel / -verwaltung
  JOURNAL: 'journal',               // Soll/Haben-Buchen (Privat: nein)
});

export const FEATURE_LISTE = Object.freeze(Object.values(FEATURE));

const FEATURE_AUSGEBLENDET = Object.freeze({
  privat: new Set([
    FEATURE.UMSATZSTEUER, FEATURE.RECHNUNGEN, FEATURE.MAHNWESEN, FEATURE.ANLAGEN, FEATURE.MITARBEITER,
    FEATURE.KOSTENSTELLEN, FEATURE.VERBINDLICHKEITEN, FEATURE.BERATER_EXPORT, FEATURE.MANDANTEN, FEATURE.JOURNAL,
  ]),
  // § 19: kein USt-Ausweis, keine Voranmeldung, keine Zahllast; keine Mitarbeiter/Kostenstellen (F, Tabelle).
  kleinunternehmer: new Set([FEATURE.UMSATZSTEUER, FEATURE.MITARBEITER, FEATURE.KOSTENSTELLEN, FEATURE.BERATER_EXPORT, FEATURE.MANDANTEN]),
  selbststaendig: new Set([FEATURE.BERATER_EXPORT, FEATURE.MANDANTEN]),
  berater: new Set([]),
  verein: new Set([FEATURE.RECHNUNGEN, FEATURE.MAHNWESEN, FEATURE.MITARBEITER]),
});

/** Ist das fachliche Feature im Modus der Settings relevant/sichtbar? */
export function zeigeFeature(settings, feature) {
  const aus = FEATURE_AUSGEBLENDET[nutzungsmodusVon(settings)];
  return aus ? !aus.has(feature) : true;
}

// ---- Einstellungs-Abschnitte (F1/F3/F5) ---------------------------------------
// Schlüssel = Abschnitte der Einstellungen in ui/shell.js. Was nicht genannt ist, bleibt sichtbar.
export const EINSTELLUNG = Object.freeze({
  KLEINUNTERNEHMER: 'kleinunternehmer', GEWINNERMITTLUNG: 'gewinnermittlung', RECHNUNGSSTELLE: 'rechnungsstelle',
  FIRMA: 'firma', DATEV: 'datev', GESCHAEFTSJAHR: 'geschaeftsjahr', PARTNER: 'partner',
  BUCHUNGSSPERRE: 'buchungssperre', MANDANTEN: 'mandanten', KI: 'ki', DATENSCHUTZ: 'datenschutz',
});
export const EINSTELLUNG_LISTE = Object.freeze(Object.values(EINSTELLUNG));

const EINSTELLUNG_AUSGEBLENDET = Object.freeze({
  privat: new Set([EINSTELLUNG.KLEINUNTERNEHMER, EINSTELLUNG.GEWINNERMITTLUNG, EINSTELLUNG.RECHNUNGSSTELLE,
    EINSTELLUNG.FIRMA, EINSTELLUNG.DATEV, EINSTELLUNG.GESCHAEFTSJAHR, EINSTELLUNG.PARTNER, EINSTELLUNG.BUCHUNGSSPERRE,
    EINSTELLUNG.MANDANTEN]),
  // § 19 ist im Modus fest (kein eigener Schalter); EÜR ist die Regel; DATEV/Mandanten sind Berater-Sache.
  kleinunternehmer: new Set([EINSTELLUNG.KLEINUNTERNEHMER, EINSTELLUNG.GEWINNERMITTLUNG, EINSTELLUNG.DATEV, EINSTELLUNG.MANDANTEN]),
  // Regelbesteuert ist im Modus fest; DATEV/Mandanten sind Berater-Sache.
  selbststaendig: new Set([EINSTELLUNG.KLEINUNTERNEHMER, EINSTELLUNG.DATEV, EINSTELLUNG.MANDANTEN]),
  berater: new Set([]),
  verein: new Set([EINSTELLUNG.RECHNUNGSSTELLE, EINSTELLUNG.DATEV]),
});

/** Soll der Einstellungs-Abschnitt sichtbar sein? F3 (`alleEinstellungen`) zeigt alles. */
export function zeigeEinstellung(settings, abschnitt) {
  if (settings && settings.alleEinstellungen === true) return true;
  const aus = EINSTELLUNG_AUSGEBLENDET[nutzungsmodusVon(settings)];
  return aus ? !aus.has(abschnitt) : true;
}

/** Gibt es im Modus überhaupt ausgeblendete Einstellungen (dann lohnt der F3-Schalter)? */
export function hatAusgeblendeteEinstellungen(settings) {
  const aus = EINSTELLUNG_AUSGEBLENDET[nutzungsmodusVon(settings)];
  return !!(aus && aus.size);
}

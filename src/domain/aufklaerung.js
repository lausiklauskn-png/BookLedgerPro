// src/domain/aufklaerung.js — Aufklärungstexte als reine Daten + Selektoren (keine
// DOM-/IndexedDB-Abhängigkeit, daher node-testbar). Genutzt von der Ansicht
// „Recht & Dokumentation" (src/ui/views/legal.js).
//
// Inhalt:
//  • P3 — KI-Autonomiestufen: was jede Stufe (suggest/draft/auto) bedeutet und wo die
//    Grenze liegt (GoBD: Festschreiben bleibt IMMER ein bewusster, manueller Schritt).
//  • P4 — Kleinunternehmer-Pflichten bei Drittdaten: §19 UStG befreit NUR von der
//    Umsatzsteuer, nicht von DSGVO/GoBD-Pflichten beim Verarbeiten fremder Daten.

// Reihenfolge entspricht state.AI_LEVELS = ['suggest','draft','auto'].
export const AUTONOMIE_STUFEN = [
  {
    id: 'suggest',
    titel: 'Nur Vorschläge',
    kurz: 'Die KI schlägt vor — übernehmen tust du.',
    punkte: [
      'Die KI liest Belegtext (EU-OCR) und schlägt Konto, Betrag, USt und Buchungsdatum vor.',
      'Nichts wird ohne deinen Klick angelegt: du prüfst jeden Vorschlag und übernimmst ihn bewusst.',
      'Empfohlen für den Einstieg und für ungewohnte Belege — volle Kontrolle, geringstes Fehlerrisiko.',
    ],
  },
  {
    id: 'draft',
    titel: 'Auto-Entwurf + Review',
    kurz: 'Die KI legt einen Entwurf an — du prüfst und gibst frei.',
    punkte: [
      'Aus dem Vorschlag wird automatisch ein Buchungs-Entwurf erzeugt (noch nicht festgeschrieben).',
      'Der Entwurf landet im Journal als prüfbarer, jederzeit korrigierbarer Zwischenstand.',
      'Du behältst die Review-Pflicht: erst dein Festschreiben macht die Buchung GoBD-wirksam.',
    ],
  },
  {
    id: 'auto',
    titel: 'Autonom bei hoher Konfidenz',
    kurz: 'Sichere Fälle als Entwurf — unsichere kommen zu dir.',
    punkte: [
      'Nur wenn die KI sehr sicher ist, legt sie selbstständig einen Entwurf an; unsichere Fälle bleiben Vorschlag.',
      'Auch hier gilt: erzeugt wird höchstens ein Entwurf, nie eine festgeschriebene Buchung.',
      'Spart Klicks bei Routinebelegen — die Endverantwortung und das Festschreiben bleiben bei dir.',
    ],
  },
];

// Was die KI in KEINER Stufe tut — die harte Grenze (GoBD/Krypto-Disziplin).
export const AUTONOMIE_GRENZEN = [
  'Festschreiben ist immer manuell: Keine Stufe schreibt eine Buchung GoBD-wirksam fest. Das bleibt dein bewusster Schritt.',
  'Keine stille Korrektur: Festgeschriebenes wird nie überschrieben oder gelöscht — Korrekturen laufen ausschließlich über Storno (Gegenbuchung).',
  'Kein Datenabfluss ohne Bestätigung: Externe EU-KI ist opt-in; Klartext verlässt das Gerät erst nach deiner ausdrücklichen Freigabe.',
  'Du bleibst verantwortlich: Die KI ist Assistenz, kein Steuerberater. Die Richtigkeit der Buchführung verantwortest du.',
];

// P4 — Kleinunternehmer & Drittdaten. „Drittdaten" = personenbezogene Daten Dritter, die
// durch deine Buchhaltung laufen (Kunden-Stammdaten, Namen/IBAN auf fremden Belegen,
// Mitarbeiterdaten, importierte Kontakte aus CSV/vCard/WorkFloh).
export const KLEINUNTERNEHMER_DRITTDATEN = {
  einleitung:
    'Der Kleinunternehmer-Status nach § 19 UStG befreit dich allein von der Umsatzsteuer — '
    + 'nicht von Datenschutz- oder Aufbewahrungspflichten. Sobald du Daten anderer Personen '
    + 'verarbeitest (Kunden, Lieferanten, Mitarbeiter), bist du DSGVO-Verantwortliche/r, ganz '
    + 'gleich wie klein dein Betrieb ist.',
  punkte: [
    'Kein „Kleinunternehmer-Rabatt" bei der DSGVO: Sie gilt unabhängig von der Betriebsgröße. Die einzige größenabhängige Erleichterung (kein Verarbeitungsverzeichnis nach Art. 30 Abs. 5 DSGVO unter 250 Beschäftigten) entfällt bereits bei regelmäßiger Verarbeitung oder besonderen Datenkategorien — also praktisch immer in der Buchhaltung.',
    'Rechtsgrundlage & Zweckbindung: Drittdaten nur für den Buchhaltungs-/Vertragszweck verarbeiten (Art. 6 DSGVO), nicht zweckfremd weiternutzen. Beim Import aus CSV/vCard/WorkFloh nur übernehmen, was du wirklich brauchst (Datenminimierung).',
    'Aufbewahren statt löschen — wo das Gesetz es verlangt: Belege und Buchungen unterliegen der gesetzlichen Aufbewahrung (i. d. R. 10 Jahre, § 147 AO / § 257 HGB). Diese Pflicht geht einem Löschverlangen für genau diese Unterlagen vor; lösche personenbezogene Drittdaten erst nach Ablauf der Frist.',
    'Belege Dritter sind sensibel: Eingangsrechnungen und Quittungen enthalten fremde Namen, Adressen, ggf. IBAN. In dieser App liegen sie verschlüsselt (AES-GCM) und lokal — gib sie nicht unverschlüsselt weiter und sichere deine Backups entsprechend.',
    'Externe EU-KI = Auftragsverarbeitung: Aktivierst du Google Vision (EU) oder Mistral (EU), verarbeiten diese in deinem Auftrag Daten. Schließe vor produktiver Nutzung mit Drittdaten den AVV/DPA des Anbieters ab (Art. 28 DSGVO) — Links findest du oben unter „Auftragsverarbeitung".',
    'Informationspflicht & Betroffenenrechte: Betroffene dürfen wissen, dass und wie du ihre Daten verarbeitest (Art. 13/14), und Auskunft, Berichtigung oder — nach Ablauf der Aufbewahrungsfristen — Löschung verlangen. Export und Löschung leistet diese App über „Ihre Daten" weiter unten.',
  ],
};

// Selektoren — node-testbar.

// Liefert die Stufen-Definition zu einer id ('suggest'|'draft'|'auto'), sonst null.
export function autonomieStufe(id) {
  return AUTONOMIE_STUFEN.find((s) => s.id === id) || null;
}

// Liefert die aktuell eingestellte Stufe aus den Settings; fällt auf 'suggest' zurück,
// wenn der Wert fehlt oder unbekannt ist (sichere, konservativste Voreinstellung).
export function aktiveAutonomieStufe(settings) {
  const id = settings && settings.aiAutonomy;
  return autonomieStufe(id) || autonomieStufe('suggest');
}

// Sind die Drittdaten-Hinweise für diese Einstellung besonders relevant? True, sobald
// externe EU-KI konfiguriert ist (dann greift zusätzlich die Auftragsverarbeitung).
export function drittdatenHinweisRelevant(aiConfig) {
  if (!aiConfig) return false;
  return Boolean(aiConfig.visionKey || aiConfig.mistralKey);
}

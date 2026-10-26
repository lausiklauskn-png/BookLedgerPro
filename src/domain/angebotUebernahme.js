// src/domain/angebotUebernahme.js
// BAUPLAN Block 2 / Schritt 8 — Angebot → Rechnung-Übernahme (REIN, node-getestet).
// Grundlage: docs/KALKULATION_KATALOG.md §4 (Nummernkreise & Angebot→Rechnung) + §7a
// (Rechnungsstelle-Hoheit).
//
// WAS DIESER SCHRITT TUT
//   Ein ANGENOMMENES Angebot (domain/angebote.js, ANGEBOT_STATUS.ANGENOMMEN) wird in den
//   bestehenden Rechnungs-/Buchungspfad (domain/invoicing.js → rechnungZeilen) überführt.
//   Je nach Setting `rechnungsstelle` (Schritt 4, domain/rechnungsstelle.js):
//     - blp    : echte, lückenlose §14-Nummer (formatRechnungsnummer)         → vorlaeufig=false
//     - extern : vorläufige interne Vorlage (vorlaeufigeRechnungsnummer, ENT-) → vorlaeufig=true
//
// ZWEI GETRENNTE KREISE (GoBD-Lückenlosigkeit, Katalog §4):
//   Der Übernahme-Entwurf REFERENZIERT die Angebotsnummer (`angebotsnummer`), benutzt sie
//   aber NIE als Rechnungs-/Vorlagen-Nummer wieder. Der freie Angebotskreis (AN-JJJJ-NNNN)
//   und der strikte §14-Kreis (JJJJ-NNNN) bleiben strikt getrennt.
//
// PRIME DIRECTIVE (Katalog §0): die Übernahme baut ausschließlich auf der EXTERNEN Schicht
//   des Angebots (externesAngebot → Whitelist). Die interne Kalkulation (Marge, Verschnitt,
//   Maschinensatz, Selbstkosten, Deckungsbeitrag) gelangt NIE in den Buchungs-/Rechnungs-
//   Entwurf. Buchungszeilen entstehen über rechnungZeilen (Soll Forderung / Haben Erlöse+USt),
//   denselben Kern wie rechnungAusAuftrag.
//
// EHRLICHE GRENZE: reine Logik. Die laufende Nummer (`seq`) kommt aus einem Zähler (I/O,
//   crm-store) — diese Schicht ist davon entkoppelt und bekommt `seq`/`jahr` hereingereicht.
//   Store-Glue (Zähler je Kreis, saveEntwurf, Angebot→archiviert) + UI sind ein eigener
//   Folgeschritt. Festschreiben bleibt manuell (GoBD).

import { ANGEBOT_STATUS, externesAngebot, istAngebotsnummer } from './angebote.js';
import { vergibtBlpNummern, vorlaeufigeRechnungsnummer } from './rechnungsstelle.js';
import { rechnungZeilen } from './invoicing.js';
import { formatRechnungsnummer } from './rechnung.js';

/** Welcher Nummernkreis fließt in den Übernahme-Entwurf? */
export const UEBERNAHME_KREIS = Object.freeze({
  PARAGRAF14: 'paragraph14', // verbindliche, lückenlose §14-Nummer (blp)
  VORLAEUFIG: 'vorlaeufig',  // interne Vorlage, endgültige Nummer vom externen System (extern)
});

/**
 * Darf das Angebot in eine Rechnung übernommen werden? Liefert die Liste fehlender/
 * blockierender Bedingungen (leer = übernehmbar). Bewusst nicht-werfend, damit die spätere
 * UI die Gründe als Hinweis zeigen kann.
 *   - Status MUSS `angenommen` sein (nur zugesagte Angebote werden zur Rechnung).
 *   - Eine gültige Angebotsnummer (AN-JJJJ-NNNN) MUSS vorhanden sein (Referenz, Katalog §4).
 *   - Mindestens eine Position.
 * @returns {string[]}
 */
export function validateAngebotUebernahme(angebot) {
  if (!angebot || typeof angebot !== 'object') return ['Kein Angebot.'];
  const errors = [];
  if (angebot.status !== ANGEBOT_STATUS.ANGENOMMEN) {
    errors.push('Nur angenommene Angebote können in eine Rechnung übernommen werden.');
  }
  if (!istAngebotsnummer(angebot.nummer)) {
    errors.push('Angebot hat keine gültige Angebotsnummer (Referenz).');
  }
  if (!angebot.positionen || !angebot.positionen.length) {
    errors.push('Angebot hat keine Positionen.');
  }
  return errors;
}

/** Bequemes Prädikat zu validateAngebotUebernahme. */
export function darfAngebotUebernehmen(angebot) {
  return validateAngebotUebernahme(angebot).length === 0;
}

/**
 * Nummern-Politik der Übernahme: bestimmt aus dem Setting `rechnungsstelle`, welche Nummer
 * der Übernahme-Entwurf trägt — eine echte §14-Nummer (blp) oder eine vorläufige interne
 * Vorlage (extern). Rein: die laufende Zahl `seq` (aus dem jeweiligen Zähler) wird übergeben.
 * @param {{settings?:object, seq:number, jahr:number}} p
 * @returns {{nummer:string, vorlaeufig:boolean, kreis:string}}
 */
export function uebernahmeNummer({ settings, seq, jahr } = {}) {
  if (vergibtBlpNummern(settings)) {
    return { nummer: formatRechnungsnummer(seq, jahr), vorlaeufig: false, kreis: UEBERNAHME_KREIS.PARAGRAF14 };
  }
  return { nummer: vorlaeufigeRechnungsnummer(seq, jahr), vorlaeufig: true, kreis: UEBERNAHME_KREIS.VORLAEUFIG };
}

/**
 * Baut aus einem angenommenen Angebot den Buchungs-/Rechnungs-ENTWURF für die Übernahme.
 * Ausschließlich aus der EXTERNEN Schicht (externesAngebot → Prime Directive); die interne
 * Kalkulation bleibt im Haus. Buchungszeilen entstehen über rechnungZeilen (Soll Forderung /
 * Haben Erlöse + USt), denselben Kern wie rechnungAusAuftrag. Die Nummer folgt der Nummern-
 * Politik (uebernahmeNummer); die Angebotsnummer wird NUR referenziert, nicht wiederverwendet.
 *
 * @param {object} angebot  angenommenes Angebot (mit gültiger AN-Nummer)
 * @param {{settings?:object, seq:number, jahr?:number, datum?:string, leistungsdatum?:string}} p
 *   `seq`  laufende Zahl aus dem Zähler des passenden Kreises (I/O-Schicht).
 *   `jahr` Default: Jahr aus `datum`, sonst aktuelles Jahr.
 * @returns {{nummer, vorlaeufig, kreis, angebotsnummer, datum, leistungsdatum, beschreibung,
 *   zeilen, summen, kostenstelle, kundeId}}
 */
export function angebotUebernahmeEntwurf(angebot = {}, { settings, seq, jahr, datum = '', leistungsdatum = '' } = {}) {
  // Prime Directive: NUR die externe Schicht — nichts Internes kann lecken.
  const extern = externesAngebot(angebot);
  const j = jahr != null ? Number(jahr)
    : (datum ? Number(String(datum).slice(0, 4)) : new Date().getFullYear());
  const { nummer, vorlaeufig, kreis } = uebernahmeNummer({ settings, seq, jahr: j });

  // Buchungszeilen aus den neutralen Positionen (gleicher Kern wie rechnungAusAuftrag).
  const { zeilen, summen } = rechnungZeilen({ positionen: extern.positionen });

  const angebotsnummer = angebot.nummer || '';
  const ref = angebotsnummer ? ` (aus Angebot ${angebotsnummer})` : '';
  const titelTeil = extern.titel ? `: ${extern.titel}` : '';
  // Klartext-Kennzeichnung: „Vorlage … vorläufig" im extern-Modus (Katalog §7a), sonst „Rechnung".
  const beschreibung = vorlaeufig
    ? `Vorlage ${nummer} (vorläufig)${ref}${titelTeil}`
    : `Rechnung ${nummer}${ref}${titelTeil}`;

  return {
    nummer,
    vorlaeufig,
    kreis,
    angebotsnummer,           // Referenz auf den Angebotskreis — NICHT wiederverwendet
    datum: datum || '',
    leistungsdatum: leistungsdatum || datum || '',
    beschreibung,
    zeilen,
    summen,
    kostenstelle: angebot.kostenstelle || null,
    kundeId: angebot.kundeId ?? null,
  };
}

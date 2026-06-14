// src/domain/pruefung.js
// Plausibilitäts-Prüfung einer Buchung — wie ein Berater drüberschaut.
// BEWUSST ZWEISTUFIG (Spielraum-Prinzip):
//   • fehler[]     = harte Mängel, die einer FESTSCHREIBUNG entgegenstehen
//                    (kommt 1:1 aus validateBuchung). Entwürfe dürfen sie haben.
//   • warnungen[]  = nicht-blockierende Hinweise. Sie verhindern NIE das Speichern
//                    eines Entwurfs und NIE das Festschreiben — sie informieren nur.
// So bleibt das Eintragen bedienerfreundlich (keine „eine Prüfung nach der anderen"),
// die fachliche Substanz (GoBD/USt) ist aber sichtbar.

import { validateBuchung } from './journal.js';
import { KONTOART } from './accounts.js';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Prüft eine Buchung und trennt harte Fehler von weichen Hinweisen.
 * @param buchung - {datum, beschreibung, zeilen:[{konto,seite,betrag}]}
 * @param kontoIndex - Map Kontonummer → Konto (mit art, ust, rolle)
 * @param opts.heute - Referenzdatum (YYYY-MM-DD), Default: heute
 * @param opts.letztesFestDatum - Datum der zuletzt festgeschriebenen Buchung (für Zeitnähe)
 * @param opts.kleinunternehmer - true unterdrückt USt-Hinweise (§19 UStG)
 * @returns {{fehler:string[], warnungen:string[]}}
 */
export function pruefeBuchung(buchung, kontoIndex, opts = {}) {
  const fehler = validateBuchung(buchung, kontoIndex);
  const warnungen = [];
  const zeilen = (buchung && buchung.zeilen) || [];
  const heute = opts.heute || new Date().toISOString().slice(0, 10);
  const datum = buchung && buchung.datum;

  if (datum && ISO.test(datum) && datum > heute) {
    warnungen.push('Buchungsdatum liegt in der Zukunft.');
  }
  if (opts.letztesFestDatum && datum && ISO.test(datum) && datum < opts.letztesFestDatum) {
    warnungen.push(`Datum liegt vor der zuletzt festgeschriebenen Buchung (${opts.letztesFestDatum}) — Buchungen sollten zeitgerecht erfolgen.`);
  }
  if (!String((buchung && buchung.beschreibung) || '').trim()) {
    warnungen.push('Kein Buchungstext — für die Nachvollziehbarkeit empfohlen.');
  }
  if (zeilen.length === 2 && zeilen[0].konto === zeilen[1].konto) {
    warnungen.push('Soll- und Habenkonto sind identisch.');
  }

  // USt-Plausibilität (nur output-VAT, low-noise): Erlöskonto mit USt-Pflicht,
  // aber keine Umsatzsteuer-Zeile → fast immer ein Versehen (USt wird geschuldet).
  if (kontoIndex && !opts.kleinunternehmer) {
    const hatUStZeile = zeilen.some((z) => {
      const k = kontoIndex[z.konto];
      return k && k.rolle === 'umsatzsteuer';
    });
    const erloesMitUSt = zeilen.some((z) => {
      const k = kontoIndex[z.konto];
      return k && k.art === KONTOART.ERTRAG && Number(k.ust) > 0;
    });
    if (erloesMitUSt && !hatUStZeile) {
      warnungen.push('Erlöskonto ist USt-pflichtig, aber keine Umsatzsteuer gebucht — bitte USt-Satz prüfen.');
    }
  }

  return { fehler, warnungen };
}

/** Kurzbilanz für die UI: ist die Buchung festschreibbar? (harte Fehler = nein) */
export function istFestschreibbar(pruefung) {
  return !pruefung.fehler.length;
}

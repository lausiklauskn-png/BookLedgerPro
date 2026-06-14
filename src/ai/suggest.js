// src/ai/suggest.js
// Setzt Extraktion (ai/extract) + Kategorisierung (ai/categorize) zu einem
// fertigen Buchungsvorschlag zusammen (rein, testbar). Kennt die Kontenrichtung
// und baut korrekte Soll/Haben-Zeilen samt USt-Aufteilung.

import { baueBuchungZeilen } from '../domain/journal.js';
import { pruefeBuchung } from '../domain/pruefung.js';

/** Findet ein Steuer-Konto (Rolle vorsteuer/umsatzsteuer) zum Satz. */
function findeSteuerKonto(accountIndex, rolle, satz) {
  for (const k of Object.values(accountIndex)) {
    if (k.rolle === rolle && k.ust === satz) return k.nummer;
  }
  return null;
}

/**
 * Baut einen Buchungsvorschlag.
 * @param extracted - Ergebnis von extractFromText
 * @param kategorie - Ergebnis von categorize
 * @param accountIndex - Map Kontonummer → Konto
 * @param opts.gegenkonto - Bank/Kasse/Forderung/Verbindlichkeit (Default 1200 Bank)
 * @returns {{ok:boolean, fehler?:string, vorschlag?:object}}
 */
export function buildVorschlag(extracted, kategorie, accountIndex, opts = {}) {
  const brutto = extracted.betragBrutto;
  if (!Number.isInteger(brutto) || brutto <= 0) {
    return { ok: false, fehler: 'Kein Betrag im Beleg erkannt — bitte manuell ergänzen.' };
  }
  const gegenkonto = opts.gegenkonto || '1200';
  const sachkonto = kategorie.konto;
  // USt-Satz: erkannt > am Sachkonto hinterlegt > 0
  const sachkontoObj = accountIndex[sachkonto];
  const satz = extracted.ustSatz != null ? extracted.ustSatz
    : (sachkontoObj && sachkontoObj.ust != null ? sachkontoObj.ust : 0);

  let sollKonto, habenKonto, steuerKonto = null, steuerSeite = null;
  if (kategorie.richtung === 'einnahme') {
    sollKonto = gegenkonto;            // z.B. Bank
    habenKonto = sachkonto;            // Erlöse
    if (satz > 0) { steuerKonto = findeSteuerKonto(accountIndex, 'umsatzsteuer', satz); steuerSeite = 'H'; }
  } else {
    sollKonto = sachkonto;            // Aufwand
    habenKonto = gegenkonto;          // Bank/Verbindlichkeit
    if (satz > 0) { steuerKonto = findeSteuerKonto(accountIndex, 'vorsteuer', satz); steuerSeite = 'S'; }
  }

  const built = baueBuchungZeilen({
    sollKonto, habenKonto, bruttoCents: brutto, ustSatz: steuerKonto ? satz : 0,
    steuerKonto, steuerSeite,
  });

  const datum = extracted.datum || new Date().toISOString().slice(0, 10);
  const beschreibung = extracted.vendor || kategorie.label;

  // Spielraum-Prinzip: der Vorschlag wird IMMER zurückgegeben (sofern ein Betrag
  // da ist), damit der Nutzer ihn als Entwurf sehen und anpassen kann. Harte
  // Mängel (fehler) und Hinweise (warnungen) werden mitgeliefert — blockiert wird
  // erst beim Festschreiben (store.festschreiben), nicht beim Erfassen.
  const { fehler, warnungen } = pruefeBuchung(
    { datum, beschreibung, zeilen: built.zeilen }, accountIndex,
  );

  return {
    ok: true,
    fehler, warnungen,
    vorschlag: {
      datum,
      beschreibung,
      zeilen: built.zeilen,
      netto: built.netto, steuer: built.steuer, brutto: built.brutto,
      ustSatz: steuerKonto ? satz : 0,
      richtung: kategorie.richtung,
      gegenkonto, sachkonto,
      fehler, warnungen,
      confidence: Math.round(((extracted.confidence + kategorie.confidence) / 2) * 100) / 100,
    },
  };
}

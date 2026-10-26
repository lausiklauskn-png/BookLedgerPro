// src/domain/umsatzsteuer.js
// USt-Voranmeldung: Voranmeldungszeitraum (monatlich/vierteljährlich/jährlich),
// Dauerfristverlängerung-Sondervorauszahlung (1/11) und Perioden-Hilfen.
// Reine, testbare Funktionen. Die Kennzahlen selbst liefert export.buildUstVa.
//
// EHRLICHER HINWEIS: Das exportierte „ELSTER-Datenpaket" ist eine strukturierte
// Aufbereitung der amtlichen Kennzahlen — KEIN ERiC-XML und KEIN Direktversand an ELSTER.
// Zeitraum-Codes folgen der ELSTER-Konvention (01–12 Monate, 41–44 Quartale).

import { buildUstVa } from './export.js';

export const VA_ZEITRAUM = {
  MONATLICH: 'monatlich',
  VIERTELJAEHRLICH: 'vierteljaehrlich',
  JAEHRLICH: 'jaehrlich',
};

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const pad2 = (n) => String(n).padStart(2, '0');
const letzterTag = (jahr, monat) => new Date(jahr, monat, 0).getDate(); // monat 1..12

/**
 * Liste der Voranmeldungsperioden eines Jahres je Zeitraumtyp.
 * @returns {Array<{code:string,label:string,von:string,bis:string}>}
 */
export function voranmeldungsperioden(typ, jahr) {
  const j = Number(jahr);
  if (typ === VA_ZEITRAUM.JAEHRLICH) {
    return [{ code: '00', label: `Jahr ${j}`, von: `${j}-01-01`, bis: `${j}-12-31` }];
  }
  if (typ === VA_ZEITRAUM.VIERTELJAEHRLICH) {
    return [1, 2, 3, 4].map((q) => {
      const m1 = (q - 1) * 3 + 1, m3 = q * 3;
      return { code: String(40 + q), label: `Q${q} ${j}`, von: `${j}-${pad2(m1)}-01`, bis: `${j}-${pad2(m3)}-${pad2(letzterTag(j, m3))}` };
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { code: pad2(m), label: `${MONATE[i]} ${j}`, von: `${j}-${pad2(m)}-01`, bis: `${j}-${pad2(m)}-${pad2(letzterTag(j, m))}` };
  });
}

/** Index der Periode, in die ein Datum (YYYY-MM-DD) fällt (für Vorbelegung). */
export function periodeIndexFuer(typ, datum) {
  const m = /^(\d{4})-(\d{2})-/.exec(datum || '');
  const monat = m ? Number(m[2]) : 1;
  if (typ === VA_ZEITRAUM.JAEHRLICH) return 0;
  if (typ === VA_ZEITRAUM.VIERTELJAEHRLICH) return Math.floor((monat - 1) / 3);
  return monat - 1;
}

/**
 * Dauerfristverlängerung-Sondervorauszahlung = 1/11 der Summe der Vorauszahlungen
 * des Vorjahres (üblicherweise = USt-Zahllast des Vorjahres). Nur bei Zahllast > 0.
 */
export function sondervorauszahlung(vorjahresZahllastCent) {
  const z = Number(vorjahresZahllastCent) || 0;
  return z > 0 ? Math.round(z / 11) : 0;
}

/** USt-Zahllast (Kz 83) eines ganzen Jahres — Basis für die Sondervorauszahlung. */
export function jahresZahllast(buchungen, kontoIndex, jahr) {
  const va = buildUstVa(buchungen, kontoIndex, { von: `${jahr}-01-01`, bis: `${jahr}-12-31` });
  return va.kz83;
}

// src/domain/startKacheln.js
// Drei Kacheln oben auf der Startseite für Betriebe (Klaus 2026-11-09: „sieht eher aus wie … ein Haushaltsbuch …
// ich sehe gar nicht, dass da irgendwie etwas für kleine Unternehmen mit 19 % [ist]“). Rein, node-getestet.
//
// 1. Umsatzsteuer im laufenden Voranmeldungszeitraum, mit Fälligkeit (10. des Folgemonats; mit Dauerfristverlängerung
//    einen Monat später). Nur wenn der Modus Umsatzsteuer ausweist.
// 2. Rücklage für Steuern: offene Umsatzsteuer dieses Zeitraums + Faustregel-Anteil vom Gewinn des Jahres für die
//    Einkommensteuer. Ausdrücklich eine FAUSTREGEL, kein Steuerbescheid – der Satz ist einstellbar.
// 3. Tagesabschluss heute: offen oder erledigt (nur wenn es die Kasse im Modus gibt).

import { computeUStVoranmeldung, computeEUR } from './taxes.js';
import { voranmeldungsperioden, periodeIndexFuer, VA_ZEITRAUM } from './umsatzsteuer.js';
import { wjPeriode, wirtschaftsjahrVon } from './geschaeftsjahr.js';

export const RUECKLAGE_PROZENT_DEFAULT = 25;

/** Fälligkeit der Voranmeldung: 10. des Monats nach Zeitraumende, bei Dauerfristverlängerung ein Monat später. */
export function ustFaelligkeit(bisDatum, dauerfrist = false) {
  const [y, m] = bisDatum.split('-').map(Number);
  const plus = dauerfrist ? 2 : 1;
  const d = new Date(Date.UTC(y, m - 1 + plus, 10));
  return d.toISOString().slice(0, 10);
}

export function normalizeRuecklageProzent(p) {
  const n = Number(p);
  if (!Number.isFinite(n) || n < 0 || n > 60) return RUECKLAGE_PROZENT_DEFAULT;
  return Math.round(n);
}

/**
 * @param buchungen alle Buchungen (Entwürfe werden von den Auswertungen ignoriert)
 * @param kontoIndex {nummer: konto}
 * @param heute 'YYYY-MM-DD'
 * @param opt {{ ustAn:boolean, vaZeitraum?:string, dauerfrist?:boolean, wjBeginn?:string, ruecklageProzent?:number }}
 * @returns {{ ust: null|{label, von, bis, zahllastCent, faelligAm, erstattung:boolean},
 *             ruecklage: {ustCent, gewinnCent, prozent, estCent, summeCent} }}
 */
export function startKacheln(buchungen, kontoIndex, heute, opt = {}) {
  let ust = null;
  if (opt.ustAn) {
    const typ = Object.values(VA_ZEITRAUM).includes(opt.vaZeitraum) ? opt.vaZeitraum : VA_ZEITRAUM.VIERTELJAEHRLICH;
    const p = voranmeldungsperioden(typ, Number(heute.slice(0, 4)))[periodeIndexFuer(typ, heute)];
    const z = computeUStVoranmeldung(buchungen, kontoIndex, { von: p.von, bis: p.bis }).zahllast;
    ust = { label: p.label, von: p.von, bis: p.bis, zahllastCent: z,
      // Jährlich gibt es keine Voranmeldung, nur die Jahreserklärung (Frist je nach Beratung) → kein Datum.
      faelligAm: typ === VA_ZEITRAUM.JAEHRLICH ? null : ustFaelligkeit(p.bis, !!opt.dauerfrist), erstattung: z < 0 };
  }
  const wjBeginn = opt.wjBeginn || '01-01';
  const wj = wjPeriode(wirtschaftsjahrVon(heute, wjBeginn), wjBeginn);
  const gewinnCent = computeEUR(buchungen, kontoIndex, wj).ueberschuss;
  const prozent = normalizeRuecklageProzent(opt.ruecklageProzent ?? RUECKLAGE_PROZENT_DEFAULT);
  const estCent = gewinnCent > 0 ? Math.round(gewinnCent * prozent / 100) : 0;
  const ustCent = ust && ust.zahllastCent > 0 ? ust.zahllastCent : 0;
  return { ust, ruecklage: { ustCent, gewinnCent, prozent, estCent, summeCent: ustCent + estCent } };
}

// src/domain/taxes.js
// Auswertungen: Kontensalden, USt-Voranmeldung, EÜR. Reine Funktionen über
// festgeschriebenen Buchungen (seq != null). Storno-Buchungen heben ihre
// Originale rechnerisch wieder auf, daher werden sie mitgezählt.
//
// EHRLICHER HINWEIS: Die EÜR hier ist eine vereinfachte, periodengerechte
// Auswertung aus den Erfolgskonten (Aufwand/Ertrag). Die strenge Zufluss-/
// Abfluss-EÜR nach §4 Abs.3 EStG (Ist-Prinzip) folgt in Phase 4.

import { KONTOART, isVorsteuerKonto, isUmsatzsteuerKonto } from './accounts.js';

export const UST_SAETZE = [0, 7, 19];

function inPeriode(datum, periode) {
  if (!periode) return true;
  if (periode.von && datum < periode.von) return false;
  if (periode.bis && datum > periode.bis) return false;
  return true;
}

/** Bewegungssummen je Konto (Soll/Haben in Cent) über die festgeschriebenen Buchungen. */
export function kontoBewegungen(buchungen, periode) {
  const map = {};
  for (const b of buchungen) {
    if (b.seq == null) continue;            // nur festgeschriebene
    if (!inPeriode(b.datum, periode)) continue;
    for (const z of b.zeilen || []) {
      const m = map[z.konto] || (map[z.konto] = { soll: 0, haben: 0 });
      if (z.seite === 'S') m.soll += z.betrag; else m.haben += z.betrag;
    }
  }
  return map;
}

/** Saldenliste: je Konto Soll/Haben/Saldo (im Sinne der Mehrungsseite). */
export function saldenliste(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  const out = [];
  for (const [nr, m] of Object.entries(bew)) {
    const konto = kontoIndex[nr];
    const art = konto ? konto.art : null;
    const diff = m.soll - m.haben;
    const saldo = (art === KONTOART.AKTIV || art === KONTOART.AUFWAND) ? diff : -diff;
    out.push({ nummer: nr, name: konto ? konto.name : '(unbekannt)', art, soll: m.soll, haben: m.haben, saldo });
  }
  out.sort((a, b) => a.nummer.localeCompare(b.nummer));
  return out;
}

/** USt-Voranmeldung: Umsatzsteuer (Schuld), Vorsteuer, Zahllast — alles in Cent. */
export function computeUStVoranmeldung(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  let umsatzsteuer = 0, vorsteuer = 0;
  const perKonto = [];
  for (const [nr, m] of Object.entries(bew)) {
    const konto = kontoIndex[nr];
    if (isUmsatzsteuerKonto(konto)) {
      const wert = m.haben - m.soll;
      umsatzsteuer += wert;
      perKonto.push({ nummer: nr, name: konto.name, wert });
    } else if (isVorsteuerKonto(konto)) {
      const wert = m.soll - m.haben;
      vorsteuer += wert;
      perKonto.push({ nummer: nr, name: konto.name, wert });
    }
  }
  return { umsatzsteuer, vorsteuer, zahllast: umsatzsteuer - vorsteuer, perKonto };
}

/**
 * USt-Verprobung: vergleicht die GEBUCHTE Vor-/Umsatzsteuer mit der aus den
 * Netto-Beträgen der Erfolgskonten ERWARTETEN Steuer (Netto × Satz). Reine
 * Funktion über festgeschriebenen Buchungen — ein klassischer Berater-Check, der
 * vergessene oder falsch gerechnete USt aufdeckt. Nicht-blockierend (Hinweis).
 *
 * Die Erwartung wird je Buchung und Satz gerundet (wie beim Buchen), damit normale
 * Rundung KEINE Fehlalarme erzeugt; eine Abweichung ≠ 0 ist ein echtes Signal.
 * @returns {{umsatzsteuer:{erwartet,gebucht,diff}, vorsteuer:{erwartet,gebucht,diff}, ok:boolean}}
 */
export function verprobeUSt(buchungen, kontoIndex, periode) {
  let ustErwartet = 0, ustGebucht = 0, vstErwartet = 0, vstGebucht = 0;
  for (const b of buchungen) {
    if (b.seq == null) continue;                 // nur festgeschriebene
    if (!inPeriode(b.datum, periode)) continue;
    const netErtrag = {}, netAufwand = {};       // Satz → Netto (Cent)
    for (const z of b.zeilen || []) {
      const k = kontoIndex[z.konto];
      if (!k) continue;
      if (isUmsatzsteuerKonto(k)) { ustGebucht += (z.seite === 'H' ? z.betrag : -z.betrag); continue; }
      if (isVorsteuerKonto(k)) { vstGebucht += (z.seite === 'S' ? z.betrag : -z.betrag); continue; }
      const satz = Number(k.ust) || 0;
      if (satz <= 0) continue;
      if (k.art === KONTOART.ERTRAG) netErtrag[satz] = (netErtrag[satz] || 0) + (z.seite === 'H' ? z.betrag : -z.betrag);
      else if (k.art === KONTOART.AUFWAND) netAufwand[satz] = (netAufwand[satz] || 0) + (z.seite === 'S' ? z.betrag : -z.betrag);
    }
    for (const [satz, net] of Object.entries(netErtrag)) ustErwartet += Math.round((net * Number(satz)) / 100);
    for (const [satz, net] of Object.entries(netAufwand)) vstErwartet += Math.round((net * Number(satz)) / 100);
  }
  const ustDiff = ustGebucht - ustErwartet;
  const vstDiff = vstGebucht - vstErwartet;
  return {
    umsatzsteuer: { erwartet: ustErwartet, gebucht: ustGebucht, diff: ustDiff },
    vorsteuer: { erwartet: vstErwartet, gebucht: vstGebucht, diff: vstDiff },
    ok: ustDiff === 0 && vstDiff === 0,
  };
}

/** EÜR (vereinfacht): Einnahmen (Ertrag) − Ausgaben (Aufwand) = Überschuss. */
export function computeEUR(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  let einnahmen = 0, ausgaben = 0;
  const einnahmenKonten = [], ausgabenKonten = [];
  for (const [nr, m] of Object.entries(bew)) {
    const konto = kontoIndex[nr];
    if (!konto) continue;
    if (konto.art === KONTOART.ERTRAG) {
      const wert = m.haben - m.soll;
      einnahmen += wert;
      einnahmenKonten.push({ nummer: nr, name: konto.name, wert });
    } else if (konto.art === KONTOART.AUFWAND) {
      const wert = m.soll - m.haben;
      ausgaben += wert;
      ausgabenKonten.push({ nummer: nr, name: konto.name, wert });
    }
  }
  return { einnahmen, ausgaben, ueberschuss: einnahmen - ausgaben, einnahmenKonten, ausgabenKonten };
}

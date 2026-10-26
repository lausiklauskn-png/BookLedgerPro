// src/domain/berichte.js
// Berichte: Summen- und Saldenliste (SuSa), Kontenblatt (Kontoauszug je Konto) und
// Anlage-EÜR-Gruppierung (Erfolgskonten → Formular-Kategorien). Reine, testbare Funktionen.
//
// EHRLICHER HINWEIS: Die Anlage-EÜR-Gruppierung ist an der Formularstruktur ORIENTIERT —
// die exakten amtlichen Zeilennummern ändern sich jährlich und sind vor Übergabe an den
// Steuerberater bzw. am amtlichen Formular zu verifizieren. Der Überschuss entspricht der
// netto-Erfolgskonten-EÜR (`taxes.computeEUR`).

import { KONTOART } from './accounts.js';
import { kontoBewegungen, saldenliste } from './taxes.js';

function inPeriode(datum, periode) {
  if (!periode) return true;
  if (periode.von && datum < periode.von) return false;
  if (periode.bis && datum > periode.bis) return false;
  return true;
}

/** Summen- und Saldenliste (SuSa): je Konto Soll/Haben/Saldo + Gesamtsummen. */
export function summenSaldenliste(buchungen, kontoIndex, periode) {
  const zeilen = saldenliste(buchungen, kontoIndex, periode);
  const summen = zeilen.reduce((s, z) => ({ soll: s.soll + z.soll, haben: s.haben + z.haben }), { soll: 0, haben: 0 });
  return { zeilen, summen };
}

/**
 * Kontenblatt (Kontoauszug): alle festgeschriebenen Buchungszeilen eines Kontos
 * chronologisch mit laufendem Saldo (Soll-Sicht: Soll mehrt, Haben mindert).
 */
export function kontenblatt(buchungen, kontoNr, kontoIndex, periode, anfangssaldo = 0) {
  const fest = (buchungen || []).filter((b) => b.seq != null && inPeriode(b.datum, periode));
  fest.sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : a.seq - b.seq));
  let saldo = anfangssaldo;
  const eintraege = [];
  for (const b of fest) {
    for (const z of b.zeilen || []) {
      if (z.konto !== kontoNr) continue;
      const soll = z.seite === 'S' ? z.betrag : 0;
      const haben = z.seite === 'H' ? z.betrag : 0;
      saldo += soll - haben;
      eintraege.push({ datum: b.datum, seq: b.seq, beschreibung: b.beschreibung || '', soll, haben, saldo });
    }
  }
  const k = kontoIndex[kontoNr];
  const summeSoll = eintraege.reduce((s, e) => s + e.soll, 0);
  const summeHaben = eintraege.reduce((s, e) => s + e.haben, 0);
  return { nummer: kontoNr, name: k ? k.name : '', anfangssaldo, eintraege, summeSoll, summeHaben, endsaldo: saldo };
}

// Anlage-EÜR-Gruppen (orientierend an der Formularstruktur).
export const EUR_GRUPPE = {
  EINN_UST: 'Umsatzsteuerpflichtige Betriebseinnahmen',
  EINN_FREI: 'Steuerfreie/nicht steuerbare Betriebseinnahmen',
  EINN_SONST: 'Sonstige Betriebseinnahmen',
  AUS_WAREN: 'Wareneinkauf / Roh-, Hilfs- und Betriebsstoffe',
  AUS_PERSONAL: 'Personalkosten',
  AUS_AFA: 'Abschreibungen (AfA / GWG)',
  AUS_RAUM: 'Raumkosten',
  AUS_KFZ: 'Fahrzeugkosten',
  AUS_WERBE: 'Werbe- und Reisekosten',
  AUS_BUERO: 'Porto, Telefon, Bürobedarf',
  AUS_BERATUNG: 'Fortbildung, Rechts-/Beratungs-/Buchführungskosten',
  AUS_VERSICH: 'Versicherungen und Beiträge',
  AUS_ZINS: 'Schuldzinsen',
  AUS_SONST: 'Sonstige Betriebsausgaben',
};

// Zuordnung der SKR03-Auswahl-Konten zu Anlage-EÜR-Gruppen (Fallback: Sonstige je Art).
const KONTO_GRUPPE = {
  '8400': EUR_GRUPPE.EINN_UST, '8300': EUR_GRUPPE.EINN_UST, '8500': EUR_GRUPPE.EINN_UST,
  '8100': EUR_GRUPPE.EINN_FREI, '8120': EUR_GRUPPE.EINN_FREI, '8125': EUR_GRUPPE.EINN_FREI, '8200': EUR_GRUPPE.EINN_FREI,
  '2700': EUR_GRUPPE.EINN_SONST, '2650': EUR_GRUPPE.EINN_SONST,
  '3300': EUR_GRUPPE.AUS_WAREN, '3400': EUR_GRUPPE.AUS_WAREN,
  '4100': EUR_GRUPPE.AUS_PERSONAL, '4120': EUR_GRUPPE.AUS_PERSONAL, '4130': EUR_GRUPPE.AUS_PERSONAL,
  '4830': EUR_GRUPPE.AUS_AFA, '4855': EUR_GRUPPE.AUS_AFA,
  '4210': EUR_GRUPPE.AUS_RAUM, '4240': EUR_GRUPPE.AUS_RAUM, '4250': EUR_GRUPPE.AUS_RAUM, '4260': EUR_GRUPPE.AUS_RAUM,
  '4500': EUR_GRUPPE.AUS_KFZ, '4530': EUR_GRUPPE.AUS_KFZ, '4540': EUR_GRUPPE.AUS_KFZ,
  '4600': EUR_GRUPPE.AUS_WERBE, '4630': EUR_GRUPPE.AUS_WERBE, '4650': EUR_GRUPPE.AUS_WERBE, '4660': EUR_GRUPPE.AUS_WERBE, '4670': EUR_GRUPPE.AUS_WERBE,
  '4910': EUR_GRUPPE.AUS_BUERO, '4920': EUR_GRUPPE.AUS_BUERO, '4930': EUR_GRUPPE.AUS_BUERO, '4940': EUR_GRUPPE.AUS_BUERO,
  '4945': EUR_GRUPPE.AUS_BERATUNG, '4950': EUR_GRUPPE.AUS_BERATUNG, '4955': EUR_GRUPPE.AUS_BERATUNG,
  '4360': EUR_GRUPPE.AUS_VERSICH, '4380': EUR_GRUPPE.AUS_VERSICH,
  '2100': EUR_GRUPPE.AUS_ZINS,
};

/** Ordnet ein Konto seiner Anlage-EÜR-Gruppe zu (mit Fallback je Kontoart). */
export function eurGruppeFuer(konto) {
  if (!konto) return null;
  if (KONTO_GRUPPE[konto.nummer]) return KONTO_GRUPPE[konto.nummer];
  if (konto.art === KONTOART.ERTRAG) return EUR_GRUPPE.EINN_SONST;
  if (konto.art === KONTOART.AUFWAND) return EUR_GRUPPE.AUS_SONST;
  return null;
}

/**
 * Anlage-EÜR-Gruppierung: Erfolgskonten zu Formular-Gruppen verdichtet (netto), je Gruppe
 * mit beteiligten Konten. Überschuss = Σ Einnahmen − Σ Ausgaben (wie computeEUR).
 */
export function anlageEUR(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  const einnahmen = new Map(), ausgaben = new Map();
  for (const [nr, m] of Object.entries(bew)) {
    const k = kontoIndex[nr];
    if (!k) continue;
    const gruppe = eurGruppeFuer(k);
    if (!gruppe) continue;
    if (k.art === KONTOART.ERTRAG) {
      const wert = m.haben - m.soll;
      const e = einnahmen.get(gruppe) || { gruppe, wert: 0, konten: [] };
      e.wert += wert; e.konten.push(nr); einnahmen.set(gruppe, e);
    } else if (k.art === KONTOART.AUFWAND) {
      const wert = m.soll - m.haben;
      const a = ausgaben.get(gruppe) || { gruppe, wert: 0, konten: [] };
      a.wert += wert; a.konten.push(nr); ausgaben.set(gruppe, a);
    }
  }
  const rows = (map) => [...map.values()].filter((r) => r.wert !== 0);
  const einnahmenRows = rows(einnahmen), ausgabenRows = rows(ausgaben);
  const summeEinnahmen = einnahmenRows.reduce((s, r) => s + r.wert, 0);
  const summeAusgaben = ausgabenRows.reduce((s, r) => s + r.wert, 0);
  return { einnahmen: einnahmenRows, ausgaben: ausgabenRows, summeEinnahmen, summeAusgaben, ueberschuss: summeEinnahmen - summeAusgaben };
}

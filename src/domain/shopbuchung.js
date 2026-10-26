// src/domain/shopbuchung.js
// Shop-Summen → Buchungs-ENTWÜRFE. Vertrag: docs/UEBERNAHME_SHOP.md (art:"buchhaltung-summen").
// REINE Logik, node-getestet — KEIN I/O, KEIN Auto-Festschreiben.
//
// WAS DAS IST: Eine Shop-Warenwirtschaft (z.B. Alis-Moderaum `warehouse.html`) übergibt die
// Perioden-Summen (Umsatz aus Verkäufen minus Retouren, Wareneinkauf) per
// `?uebernahme=<base64url>` an BLP. Diese Schicht macht daraus zwei Buchungs-Entwürfe
// (Umsatz, Wareneinkauf) über den bestehenden Kontenrahmen. Der Mensch prüft, korrigiert und
// schreibt fest — GoBD-Pfade (Nummern, Festschreibung, Hash-Kette) bleiben unberührt.
//
// ANNAHMEN (im Entwurf sichtbar, korrigierbar): VK = Brutto-Kundenpreis; EK = Netto-Einkauf;
// Umsatz-Gegenkonto = Bank (Online-Shop); Einkaufs-Gegenkonto = Verbindlichkeiten (später per
// Zahlungsabgleich ausgeglichen). Diese Annahmen sind bewusst konservativ und werden im
// Entwurfs-Text benannt.

import { baueBuchungZeilen } from './journal.js';

// Kontenzuordnung je USt-Satz (SKR03). 0 % = Kleinunternehmer §19 / steuerfrei → keine
// USt-/Vorsteuer-Zeile.
export const SHOP_KONTEN = Object.freeze({
  19: { erloes: '8400', umsatzsteuer: '1776', wareneingang: '3400', vorsteuer: '1576' },
  7: { erloes: '8300', umsatzsteuer: '1771', wareneingang: '3300', vorsteuer: '1571' },
  0: { erloes: '8200', umsatzsteuer: null, wareneingang: '3400', vorsteuer: null },
});
// Gegenkonten (Annahme, im Entwurf korrigierbar).
export const SHOP_GEGENKONTO = Object.freeze({ umsatz: '1200', einkauf: '1600' });

const normSatz = (s) => ([0, 7, 19].includes(Number(s)) ? Number(s) : 19);

export function shopKonten(ustSatz) {
  return SHOP_KONTEN[normSatz(ustSatz)];
}

/** Alle Konten-Nummern, die ein Summen-Satz berühren kann (für ensureSeedKonten). */
export function benoetigteKonten(ustSatz) {
  const k = shopKonten(ustSatz);
  const out = [SHOP_GEGENKONTO.umsatz, SHOP_GEGENKONTO.einkauf, k.erloes, k.wareneingang];
  if (k.umsatzsteuer) out.push(k.umsatzsteuer);
  if (k.vorsteuer) out.push(k.vorsteuer);
  return Array.from(new Set(out));
}

// Wareneinkauf (EK = netto): Soll Wareneingang(netto) [+ Soll Vorsteuer(steuer)] an
// Haben Verbindlichkeiten(brutto). Cent-genau, Integer.
function baueEinkaufZeilen({ nettoCents, ustSatz, wareneingangKonto, vorsteuerKonto, gegenKonto }) {
  const netto = Math.max(0, Math.round(nettoCents));
  const satz = normSatz(ustSatz);
  const steuer = satz > 0 ? Math.round((netto * satz) / 100) : 0;
  const brutto = netto + steuer;
  const zeilen = [{ konto: wareneingangKonto, seite: 'S', betrag: netto }];
  if (steuer > 0 && vorsteuerKonto) zeilen.push({ konto: vorsteuerKonto, seite: 'S', betrag: steuer });
  zeilen.push({ konto: gegenKonto, seite: 'H', betrag: brutto });
  return { netto, steuer, brutto, zeilen };
}

/**
 * Baut aus den Shop-Summen bis zu zwei Buchungs-ENTWÜRFE (Umsatz, Wareneinkauf).
 * @param daten {{shop,periode:{von,bis},umsatzBruttoCent,wareneinkaufCent,ustSatz,geschaetzt}}
 * @returns {{buchungen:Array<{art:'umsatz'|'einkauf',datum:string,beschreibung:string,
 *   begruendung:string,zeilen:Array,bruttoCent:number,nettoCent:number,steuerCent:number}>,
 *   konten:string[], hinweise:string[], ustSatz:number, shop:string, zeitraum:string,
 *   datum:string}}
 */
export function baueShopBuchungen(daten) {
  const d = daten || {};
  const ustSatz = normSatz(d.ustSatz);
  const k = shopKonten(ustSatz);
  const shop = String(d.shop || 'Shop');
  const von = (d.periode && d.periode.von) || '';
  const bis = (d.periode && d.periode.bis) || '';
  const datum = bis || von || '';
  const zeitraum = von && bis ? `${von}…${bis}` : von || bis || '';
  const gesch = !!d.geschaetzt;
  const buchungen = [];
  const hinweise = [];

  const umsatz = Math.max(0, Math.round(d.umsatzBruttoCent || 0));
  if (umsatz > 0) {
    const r = baueBuchungZeilen({
      bruttoCents: umsatz,
      ustSatz,
      sollKonto: SHOP_GEGENKONTO.umsatz,
      habenKonto: k.erloes,
      steuerKonto: k.umsatzsteuer || undefined,
      steuerSeite: 'H',
    });
    buchungen.push({
      art: 'umsatz',
      datum,
      beschreibung: `Shop-Umsatz ${shop} ${zeitraum}`.trim(),
      begruendung:
        `Summen-Übernahme aus der Warenwirtschaft (${shop}). VK als Brutto behandelt.` +
        (gesch ? ' Enthält geschätzte Preise.' : '') +
        ' Vor dem Festschreiben prüfen.',
      zeilen: r.zeilen,
      bruttoCent: r.brutto,
      nettoCent: r.netto,
      steuerCent: r.steuer,
    });
  }

  const einkauf = Math.max(0, Math.round(d.wareneinkaufCent || 0));
  if (einkauf > 0) {
    const r = baueEinkaufZeilen({
      nettoCents: einkauf,
      ustSatz,
      wareneingangKonto: k.wareneingang,
      vorsteuerKonto: k.vorsteuer,
      gegenKonto: SHOP_GEGENKONTO.einkauf,
    });
    buchungen.push({
      art: 'einkauf',
      datum,
      beschreibung: `Wareneinkauf ${shop} ${zeitraum}`.trim(),
      begruendung:
        `Summen-Übernahme aus der Warenwirtschaft (${shop}). EK als Netto behandelt.` +
        (gesch ? ' Enthält geschätzte Preise.' : '') +
        ' Gegenkonto Verbindlichkeiten — später per Zahlungsabgleich ausgleichen.' +
        ' Vor dem Festschreiben prüfen.',
      zeilen: r.zeilen,
      bruttoCent: r.brutto,
      nettoCent: r.netto,
      steuerCent: r.steuer,
    });
  }

  if (!buchungen.length) hinweise.push('Keine verwertbaren Summen (Umsatz und Wareneinkauf sind 0).');
  if (gesch) hinweise.push('Der Shop meldet geschätzte Preise (ältere Bewegungen ohne gespeicherten Preis).');
  return { buchungen, konten: benoetigteKonten(ustSatz), hinweise, ustSatz, shop, zeitraum, datum };
}

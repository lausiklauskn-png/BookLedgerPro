// src/domain/zahlungsabgleich.js
// Zahlungsabgleich: ordnet Bank-Umsätze (aus bankimport) offenen Posten zu und schlägt
// die Ausgleichsbuchung vor (Bank gegen Forderung/Verbindlichkeit statt Erlös/Aufwand).
// Erst dadurch wird die Ist-EÜR (§4 Abs.3 EStG) + „offene Posten" wirklich belastbar.
// Reine, testbare Funktionen — kein Netz, kein DOM.
//
// EHRLICHER HINWEIS: offene Forderungen werden aus Aufträgen abgeleitet, die als
// „berechnet" (Rechnung gestellt), aber noch nicht „bezahlt" markiert sind. Eingehende
// Lieferantenrechnungen (Verbindlichkeiten) sind als Posten-Quelle noch nicht erfasst —
// die Matching-/Buchungslogik ist aber richtungsneutral und dafür vorbereitet.

import { auftragSummen } from './orders.js';
import { AUFTRAG_STATUS } from './orders.js';

// Tagesabstand zwischen zwei ISO-Daten (oder null).
function tageDiff(a, b) {
  if (!a || !b) return null;
  const da = Date.parse(a), db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.abs(da - db) / 86400000;
}

/**
 * Leitet offene Forderungs-Posten aus Aufträgen ab (Status „berechnet").
 * @param {Array} auftraege
 * @param {{nameById?:Record<string,string>}} [opts] Kunden-Namen je kundeId (für Matching).
 * @returns {{id, betragCent, datum, referenz, name, kundeId, richtung:'einnahme'}[]}
 */
export function offenePosten(auftraege = [], opts = {}) {
  const nameById = opts.nameById || {};
  const out = [];
  for (const a of auftraege) {
    if (a.status !== AUFTRAG_STATUS.BERECHNET) continue;
    const brutto = auftragSummen(a.positionen).brutto;
    if (brutto <= 0) continue;
    out.push({
      id: a.id,
      betragCent: brutto,
      datum: a.rechnungDatum || (a.createdAt || '').slice(0, 10) || '',
      referenz: a.rechnungNummer || '',
      name: nameById[a.kundeId] || '',
      kundeId: a.kundeId || null,
      richtung: 'einnahme',
    });
  }
  return out;
}

/**
 * Findet den am besten passenden offenen Posten zu einem Bank-Umsatz.
 * Bedingung: gleiche Richtung UND exakt gleicher Betrag (konservativ — lieber kein
 * Treffer als ein falscher). Bewertung: Rechnungsnummer im Verwendungszweck (+3),
 * Name in Gegenpartei/Zweck (+2), Datumsnähe als Tiebreaker.
 * @returns {{posten:object, score:number}|null}
 */
export function findeOffenePosten(umsatz, posten = [], opts = {}) {
  const u = umsatz || {};
  const kandidaten = posten.filter((p) => p.richtung === u.richtung && p.betragCent === u.betragCent);
  if (!kandidaten.length) return null;
  const zweck = String(u.zweck || '').toLowerCase();
  const gegen = String(u.gegen || '').toLowerCase();
  const bewerten = (p) => {
    let s = 1; // exakter Betrag + Richtung
    const ref = String(p.referenz || '').toLowerCase();
    const nm = String(p.name || '').toLowerCase();
    if (ref && zweck.includes(ref)) s += 3;
    if (nm && (gegen.includes(nm) || zweck.includes(nm))) s += 2;
    const dd = tageDiff(p.datum, u.valuta);
    if (dd != null) s += Math.max(0, 1 - dd / 60);
    return s;
  };
  let best = null;
  for (const p of kandidaten) {
    const score = bewerten(p);
    if (!best || score > best.score) best = { posten: p, score };
  }
  return best;
}

/**
 * Baut die Ausgleichs-Buchungszeilen für einen Bank-Umsatz.
 *  - Einnahme (Kunde zahlt Rechnung): Soll Bank / Haben Forderung.
 *  - Ausgabe (wir zahlen Lieferant):   Soll Verbindlichkeit / Haben Bank.
 * @returns {{zeilen:Array, beschreibung:string, datum:string}}
 */
export function zahlungsBuchungZeilen(umsatz, posten = null, opts = {}) {
  const bank = opts.bankKonto || '1200';
  const forderung = opts.forderungKonto || '1400';
  const verbindlichkeit = opts.verbindlichkeitKonto || '1600';
  const betrag = (umsatz || {}).betragCent || 0;
  const ref = posten && posten.referenz ? ` Rechnung ${posten.referenz}` : '';
  if ((umsatz || {}).richtung === 'einnahme') {
    return {
      zeilen: [{ konto: bank, seite: 'S', betrag }, { konto: forderung, seite: 'H', betrag }],
      beschreibung: `Zahlungseingang${ref}`.trim(),
      datum: (umsatz || {}).valuta || '',
    };
  }
  return {
    zeilen: [{ konto: verbindlichkeit, seite: 'S', betrag }, { konto: bank, seite: 'H', betrag }],
    beschreibung: `Zahlungsausgang${ref}`.trim(),
    datum: (umsatz || {}).valuta || '',
  };
}

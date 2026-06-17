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

import { auftragOffen, auftragSummen } from './orders.js';
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
    // Offener Rest (Brutto − geleistete Teilzahlungen) — so passt das Matching auch
    // auf eine Restzahlung; vollständig bezahlte „berechnet"-Aufträge fallen heraus.
    const offen = auftragOffen(a);
    if (offen <= 0) continue;
    // Brutto-Anteile je USt-Satz (für die spätere § 17-Skonto-Korrektur mit gemischten Sätzen).
    const summen = auftragSummen(a.positionen);
    const saetze = Object.entries(summen.perSatz)
      .map(([satz, g]) => ({ ustProzent: Number(satz), bruttoCent: g.netto + g.ust }))
      .filter((s) => s.bruttoCent > 0);
    out.push({
      id: a.id,
      betragCent: offen,
      datum: a.rechnungDatum || (a.createdAt || '').slice(0, 10) || '',
      referenz: a.rechnungNummer || '',
      name: nameById[a.kundeId] || '',
      kundeId: a.kundeId || null,
      richtung: 'einnahme',
      saetze,
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
 * Findet die besten passenden offenen Posten zu einem Bank-Umsatz — inklusive
 * Teilzahlungen und kleiner Rundungs-Toleranzen (A3). Konservativ: gleiche Richtung
 * Pflicht; Überzahlungen (mehr als offen) werden NICHT zugeordnet.
 * Art je Kandidat:
 *  - 'exakt'      gezahlt == offen
 *  - 'toleranz'   |offen − gezahlt| ≤ toleranzCent (Rundungs-Cent)
 *  - 'skonto'     gezahlt < offen, Differenz ≤ skontoProzent (mögliches Skonto — Hinweis;
 *                 USt/VSt-Korrektur §17 UStG bleibt manuell, daher KEIN Auto-Skonto-Buchen)
 *  - 'teilzahlung' gezahlt < offen, Differenz > Skonto-Schwelle (Rest bleibt offen)
 * @returns {{posten,score,art,gezahltCent,offenCent,restCent,skontoCent}[]} bis maxKandidaten, score-sortiert.
 */
export function findeKandidaten(umsatz, posten = [], opts = {}) {
  const u = umsatz || {};
  const toleranzCent = opts.toleranzCent != null ? opts.toleranzCent : 2;
  const skontoProzent = opts.skontoProzent != null ? opts.skontoProzent : 3;
  const max = opts.maxKandidaten || 3;
  const zahlung = Math.abs(Math.round(Number(u.betragCent) || 0));
  const zweck = String(u.zweck || '').toLowerCase();
  const gegen = String(u.gegen || '').toLowerCase();
  const out = [];
  for (const p of posten) {
    if (p.richtung !== u.richtung) continue;
    const offen = p.betragCent || 0;
    if (offen <= 0 || zahlung <= 0) continue;
    const diff = offen - zahlung; // > 0: weniger gezahlt als offen
    let art = null, skontoCent = 0, restCent = 0, basis;
    if (diff === 0) { art = 'exakt'; basis = 100; }
    else if (Math.abs(diff) <= toleranzCent) { art = 'toleranz'; basis = 80; }
    else if (diff < 0) { continue; } // Überzahlung — konservativ überspringen
    else if (diff <= Math.round(offen * skontoProzent / 100)) { art = 'skonto'; skontoCent = diff; basis = 60; }
    else { art = 'teilzahlung'; restCent = diff; basis = 40; }
    let score = basis;
    const ref = String(p.referenz || '').toLowerCase();
    const nm = String(p.name || '').toLowerCase();
    if (ref && zweck.includes(ref)) score += 30;
    if (nm && (gegen.includes(nm) || zweck.includes(nm))) score += 15;
    const dd = tageDiff(p.datum, u.valuta);
    if (dd != null) score += Math.max(0, 1 - dd / 60);
    out.push({ posten: p, score, art, gezahltCent: zahlung, offenCent: offen, restCent, skontoCent });
  }
  out.sort((a, b) => (b.score - a.score)
    || ((a.posten.faelligAm || a.posten.datum || '').localeCompare(b.posten.faelligAm || b.posten.datum || '')));
  return out.slice(0, max);
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

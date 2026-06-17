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
 * Sammelzahlung (R2b): findet Kombinationen offener Posten, deren Summe einem
 * Bank-Umsatz entspricht (eine Zahlung deckt mehrere Rechnungen ab). Konservativ:
 * gleiche Richtung Pflicht, mindestens **zwei** Posten je Kombination (Einzeltreffer
 * deckt `findeKandidaten` ab), Summe == Zahlung ± `toleranzCent` (Rundungs-Cent).
 * Tiefen-/Kandidatenbeschränkung verhindert eine kombinatorische Explosion.
 * Bewertung: exakte Summe und Referenz/Name im Verwendungszweck heben den Score,
 * weniger Teile werden bevorzugt. UI nutzt den Score als Schwelle und lässt den
 * Nutzer die Kombination **explizit** bestätigen.
 * @returns {{posten:object[], summeCent:number, differenzCent:number, score:number}[]}
 */
export function findeSammelzuordnung(umsatz, posten = [], opts = {}) {
  const u = umsatz || {};
  const toleranzCent = opts.toleranzCent != null ? opts.toleranzCent : 2;
  const maxTeile = opts.maxTeile || 4;
  const maxKombinationen = opts.maxKombinationen || 5;
  const maxKandidaten = opts.maxKandidaten || 12;
  const zahlung = Math.abs(Math.round(Number(u.betragCent) || 0));
  if (zahlung <= 0) return [];
  const zweck = String(u.zweck || '').toLowerCase();
  const gegen = String(u.gegen || '').toLowerCase();

  const relevanz = (p) => {
    let s = 0;
    const ref = String(p.referenz || '').toLowerCase();
    const nm = String(p.name || '').toLowerCase();
    if (ref && zweck.includes(ref)) s += 3;
    if (nm && (gegen.includes(nm) || zweck.includes(nm))) s += 2;
    return s;
  };

  // Kandidaten: gleiche Richtung, offener Betrag > 0 und einzeln nicht größer als die
  // Zahlung (+Toleranz). Nach Relevanz vorsortieren und auf `maxKandidaten` begrenzen.
  const kandidaten = posten
    .filter((p) => p.richtung === u.richtung && (p.betragCent || 0) > 0 && (p.betragCent || 0) <= zahlung + toleranzCent)
    .map((p) => ({ p, r: relevanz(p) }))
    .sort((a, b) => b.r - a.r)
    .slice(0, maxKandidaten)
    .map((x) => x.p);

  const bewerteKombi = (parts, summe) => {
    let score = 100 - Math.abs(summe - zahlung) * 10; // exakte Summe bevorzugt
    score -= (parts.length - 2) * 5;                  // weniger Teile bevorzugt
    let dd = 0, nd = 0;
    for (const p of parts) {
      score += relevanz(p) * 5;
      const d = tageDiff(p.datum, u.valuta);
      if (d != null) { dd += d; nd++; }
    }
    if (nd) score += Math.max(0, 1 - dd / nd / 60); // Datumsnähe als Tiebreaker
    return { posten: parts, summeCent: summe, differenzCent: summe - zahlung, score };
  };

  const treffer = [];
  const n = kandidaten.length;
  const combo = [];
  const rec = (start, summe) => {
    if (combo.length >= 2 && Math.abs(summe - zahlung) <= toleranzCent) {
      treffer.push(bewerteKombi(combo.slice(), summe));
    }
    if (combo.length >= maxTeile) return;
    for (let i = start; i < n; i++) {
      const naechste = summe + (kandidaten[i].betragCent || 0);
      if (naechste > zahlung + toleranzCent) continue; // Überschuss: diesen Posten überspringen
      combo.push(kandidaten[i]);
      rec(i + 1, naechste);
      combo.pop();
    }
  };
  rec(0, 0);

  treffer.sort((a, b) => (b.score - a.score) || (a.posten.length - b.posten.length));
  return treffer.slice(0, maxKombinationen);
}

/**
 * Verteilt einen Zahlbetrag der Reihe nach auf eine **explizit gewählte** Liste offener
 * Posten (R2b): jeder Posten erhält `min(verbleibende Zahlung, offener Betrag)`; der letzte
 * kann teilbezahlt werden (Rest bleibt offen). Übersteigt die Zahlung die Summe der Posten,
 * bleibt der Überschuss `unverteiltCent` (UI warnt — Überzahlung wird nicht erzwungen).
 * @returns {{zuordnung:{posten,betragCent,offenCent,restCent,voll:boolean}[], verteiltCent:number, unverteiltCent:number}}
 */
export function verteileSammelzahlung(zahlungCent, postenListe = []) {
  let rest = Math.abs(Math.round(Number(zahlungCent) || 0));
  const gesamt = rest;
  const zuordnung = [];
  for (const p of postenListe) {
    const offen = p.betragCent || 0;
    if (offen <= 0 || rest <= 0) continue;
    const betrag = Math.min(rest, offen);
    rest -= betrag;
    zuordnung.push({ posten: p, betragCent: betrag, offenCent: offen, restCent: offen - betrag, voll: betrag === offen });
  }
  return { zuordnung, verteiltCent: gesamt - rest, unverteiltCent: rest };
}

/**
 * Baut die Ausgleichs-Buchungszeilen einer Sammelzahlung (R2b) — **eine Zeile je Rechnung**:
 *  - Einnahme: Soll Bank (Summe) / je Posten Haben Forderung (Teilbetrag).
 *  - Ausgabe:  je Posten Soll Verbindlichkeit (Teilbetrag) / Haben Bank (Summe).
 * Erwartet die Zuordnung aus `verteileSammelzahlung` (`{posten, betragCent}`). Posten mit
 * Betrag 0 fallen heraus. Gibt `null` zurück, wenn nichts zu buchen ist.
 * @returns {{zeilen:Array, beschreibung:string, datum:string, summeCent:number}|null}
 */
export function sammelBuchungZeilen(umsatz, zuordnung = [], opts = {}) {
  const bank = opts.bankKonto || '1200';
  const forderung = opts.forderungKonto || '1400';
  const verbindlichkeit = opts.verbindlichkeitKonto || '1600';
  const u = umsatz || {};
  const datum = u.valuta || '';
  const eintraege = zuordnung.filter((z) => (z.betragCent || 0) > 0);
  const summe = eintraege.reduce((s, z) => s + z.betragCent, 0);
  if (!eintraege.length || summe <= 0) return null;
  const refs = eintraege.map((z) => z.posten && z.posten.referenz).filter(Boolean);
  const refText = refs.length ? ` Rechnungen ${refs.join(', ')}` : '';
  if (u.richtung === 'einnahme') {
    const zeilen = [{ konto: bank, seite: 'S', betrag: summe }];
    for (const z of eintraege) zeilen.push({ konto: forderung, seite: 'H', betrag: z.betragCent });
    return { zeilen, beschreibung: `Sammel-Zahlungseingang${refText}`.trim(), datum, summeCent: summe };
  }
  const zeilen = [];
  for (const z of eintraege) zeilen.push({ konto: verbindlichkeit, seite: 'S', betrag: z.betragCent });
  zeilen.push({ konto: bank, seite: 'H', betrag: summe });
  return { zeilen, beschreibung: `Sammel-Zahlungsausgang${refText}`.trim(), datum, summeCent: summe };
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

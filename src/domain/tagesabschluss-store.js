// src/domain/tagesabschluss-store.js
// Tagesabschlüsse der offenen Ladenkasse speichern und festschreiben (Klaus 2026-11-09).
// Verschlüsselt wie Buchungen (encstore). Ein Abschluss je Tag; festgeschrieben heißt: die Buchungen
// sind festgeschrieben (seq + Hash-Kette) und der Abschluss ist nicht mehr änderbar — Korrektur nur per
// Storno der Buchungen (GoBD), nie Löschen.

import { encPut, encGet, encList } from './encstore.js';
import { saveEntwurf, festschreiben, accountIndex, ensureSeedKonten, listBuchungen } from './store.js';
import { validateBuchung } from './journal.js';
import { saveBeleg, linkBeleg } from './documents.js';
import { rueckrechnung, tagesabschlussBuchungen, benoetigteKontenTA, KONTEN_TA } from './tagesabschluss.js';
import { kassenbuchEintraege, kassenbericht } from './kassenbuch.js';
import { getAnfangsbestand } from './anfangsbestand-store.js';

const id = (datum) => `tagesabschluss:${datum}`;

export async function listTagesabschluesse() {
  return (await encList('tagesabschluss')).sort((a, b) => (a.datum < b.datum ? -1 : 1));
}
export async function getTagesabschluss(datum) { return encGet(id(datum)); }

/** Anfangsbestand des Tages (Kassenbuch bis Vortag) und Saldo schon gebuchter Kassenbewegungen am Tag. */
export async function kassenStandFuer(datum) {
  const jahr = Number(datum.slice(0, 4));
  const buchungen = await listBuchungen();
  const anfangJahr = await getAnfangsbestand(KONTEN_TA.kasse, jahr);
  const vor = kassenbuchEintraege(buchungen, KONTEN_TA.kasse, { von: `${jahr}-01-01`, bis: vortag(datum) });
  const heute = kassenbuchEintraege(buchungen, KONTEN_TA.kasse, { von: datum, bis: datum });
  const offen = buchungen.filter((b) => b.seq == null && b.datum === datum
    && (b.zeilen || []).some((z) => z.konto === KONTEN_TA.kasse)).length;
  return {
    anfangCent: kassenbericht(vor, anfangJahr).endbestand,
    gebuchtCent: heute.reduce((n, e) => n + e.einnahme - e.ausgabe, 0),
    gebuchtAnzahl: heute.length, offeneEntwuerfe: offen,
  };
}

function vortag(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/**
 * Schreibt einen Tagesabschluss fest: Foto als Beleg, Buchungen festgeschrieben, Abschluss gespeichert.
 * Erst wird ALLES geprüft (Rechnung, Konten), dann geschrieben — kein halber Abschluss bei falschen Angaben.
 * @param eingabe {{datum, endCent, ausgaben, bankCent, entnahmeCent, einlageCent, ustSatz, satz?}}
 * @param opt {{foto?: File}}
 */
export async function tagesabschlussFestschreiben(eingabe, opt = {}) {
  const datum = String(eingabe.datum || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error('Datum fehlt.');
  if (await getTagesabschluss(datum)) throw new Error(`Für ${datum} gibt es schon einen festgeschriebenen Tagesabschluss.`);
  await ensureSeedKonten(benoetigteKontenTA());
  const stand = await kassenStandFuer(datum);
  const e = { ...eingabe, anfangCent: stand.anfangCent, gebuchtCent: stand.gebuchtCent };
  const r = rueckrechnung(e);
  if (r.fehler.length) throw new Error(r.fehler.join(' '));
  const entwuerfe = tagesabschlussBuchungen(datum, e, r);
  const idx = await accountIndex();
  for (const b of entwuerfe) {
    const f = validateBuchung({ ...b }, idx);
    if (f.length) throw new Error('Buchung nicht möglich: ' + f.join(' '));
  }
  let beleg = null;
  if (opt.foto) beleg = await saveBeleg(opt.foto, { quelle: 'tagesabschluss' });
  const buchungIds = [];
  for (const b of entwuerfe) {
    const ent = await saveEntwurf({ datum, beschreibung: b.beschreibung,
      begruendung: 'Tagesabschluss offene Ladenkasse: Tageseinnahme aus gezähltem Endbestand zurückgerechnet.',
      zeilen: b.zeilen, belegRef: beleg ? beleg.id : null });
    const fest = await festschreiben(ent.id);
    buchungIds.push(fest.id);
  }
  if (beleg && buchungIds.length) await linkBeleg(beleg.id, buchungIds[0]);
  const rec = {
    id: id(datum), type: 'tagesabschluss', datum,
    anfangCent: e.anfangCent, endCent: Math.round(e.endCent), gebuchtCent: e.gebuchtCent,
    ausgaben: (e.ausgaben || []).filter((a) => a.betragCent > 0).map((a) => ({ betragCent: Math.round(a.betragCent), text: String(a.text || ''), ustSatz: a.ustSatz ?? null })),
    bankCent: Math.round(e.bankCent || 0), entnahmeCent: Math.round(e.entnahmeCent || 0), einlageCent: Math.round(e.einlageCent || 0),
    einnahmeCent: r.einnahmeCent, nettoCent: r.nettoCent, ustCent: r.ustCent, satz: r.satz,
    belegId: beleg ? beleg.id : null, buchungIds, satzText: String(eingabe.satz || '').slice(0, 400),
    festgeschriebenAt: new Date().toISOString(),
  };
  await encPut(rec);
  return rec;
}

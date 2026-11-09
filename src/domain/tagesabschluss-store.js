// src/domain/tagesabschluss-store.js
// Tagesabschlüsse der offenen Ladenkasse speichern und festschreiben (Klaus 2026-11-09).
// Verschlüsselt wie Buchungen (encstore). Ein Abschluss je Tag; festgeschrieben heißt: die Buchungen
// sind festgeschrieben (seq + Hash-Kette) und der Abschluss ist nicht mehr änderbar — Korrektur nur per
// Storno der Buchungen (GoBD), nie Löschen.

import { encPut, encGet, encList, encDel, neueId } from './encstore.js';
import { saveEntwurf, festschreiben, storno, getBuchung, accountIndex, ensureSeedKonten, listBuchungen } from './store.js';
import { validateBuchung } from './journal.js';
import { saveBeleg, linkBeleg } from './documents.js';
import { rueckrechnung, tagesabschlussBuchungen, benoetigteKontenTA, KONTEN_TA, einnahmeAuffaellig, quittungenSumme } from './tagesabschluss.js';
import { kassenbuchEintraege, kassenbericht } from './kassenbuch.js';
import { getAnfangsbestand } from './anfangsbestand-store.js';

const id = (datum) => `tagesabschluss:${datum}`;

export async function listTagesabschluesse() {
  return (await encList('tagesabschluss')).sort((a, b) => (a.datum < b.datum ? -1 : 1));
}
export async function getTagesabschluss(datum) { return encGet(id(datum)); }

/** Tageseinnahmen früherer Abschlüsse (vor `datum`, höchstens 30) für die Nachfrage bei auffällig hoher Einnahme. */
export async function frueherEinnahmen(datum) {
  return (await listTagesabschluesse()).filter((a) => a.datum < datum).slice(-30).map((a) => a.einnahmeCent);
}

// ---- Quittungen (Klaus 2026-11-09: „die Quittung selber muss doch dann … eingelesen werden“) -------------------
// Eine in der App gedruckte Quittung wird als PDF-Beleg abgelegt und als Datensatz gemerkt (verschlüsselt). Gebucht
// wird sie nie – das Geld steckt in der Tageseinnahme; der Tagesabschluss verknüpft sie mit seiner Einnahme-Buchung.

/** @param q {{datum, bruttoCent, ustSatz, leistung}} @param pdfBytes Uint8Array der Quittung */
export async function quittungAblegen(q, pdfBytes) {
  const datum = String(q.datum || '');
  const datei = new File([pdfBytes], `Quittung-${datum}-${Date.now().toString(36)}.pdf`, { type: 'application/pdf' });
  const beleg = await saveBeleg(datei, { quelle: 'quittung' });
  const rec = { id: neueId('quittung'), type: 'quittung', datum, bruttoCent: Math.round(q.bruttoCent || 0),
    ustSatz: Number(q.ustSatz) || 0, leistung: String(q.leistung || '').slice(0, 200), belegId: beleg.id, angelegtAm: new Date().toISOString() };
  await encPut(rec);
  return rec;
}
export async function listQuittungen(datum) {
  const alle = await encList('quittung');
  return (datum ? alle.filter((q) => q.datum === datum) : alle).sort((a, b) => (a.angelegtAm < b.angelegtAm ? -1 : 1));
}

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
 * @param opt {{foto?: File, quittungFotos?: File[], auffaelligBestaetigt?: boolean}}
 *   quittungFotos = Durchschläge aus dem Quittungsblock (nur aufbewahrt, nicht gebucht);
 *   auffaelligBestaetigt = bei auffällig hoher Einnahme hat der Mensch „stimmt so, kein Privatgeld“ gesagt.
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
  const auff = einnahmeAuffaellig(r.einnahmeCent, await frueherEinnahmen(datum));
  if (auff.auffaellig && !opt.auffaelligBestaetigt) {
    throw new Error('Ungewöhnlich hohe Einnahme – bitte erst beantworten, ob Privatgeld in der Kasse war.');
  }
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
  // Quittungen: Durchschläge (Fotos) ablegen und mit der Einnahme-Buchung verknüpfen; App-Quittungen des Tages ebenso.
  const einnahmeId = entwuerfe[0] && entwuerfe[0].art === 'einnahme' ? buchungIds[0] : (buchungIds[0] || null);
  const quittungBelegIds = [];
  for (const f of opt.quittungFotos || []) {
    const qb = await saveBeleg(f, { quelle: 'quittung-durchschlag' });
    quittungBelegIds.push(qb.id);
  }
  const appQuittungen = await listQuittungen(datum);
  for (const q of appQuittungen) if (q.belegId) quittungBelegIds.push(q.belegId);
  if (einnahmeId) for (const bid of quittungBelegIds) await linkBeleg(bid, einnahmeId);
  const rec = {
    id: id(datum), type: 'tagesabschluss', datum,
    anfangCent: e.anfangCent, endCent: Math.round(e.endCent), gebuchtCent: e.gebuchtCent,
    ausgaben: (e.ausgaben || []).filter((a) => a.betragCent > 0).map((a) => ({ betragCent: Math.round(a.betragCent), text: String(a.text || ''), ustSatz: a.ustSatz ?? null })),
    bankCent: Math.round(e.bankCent || 0), entnahmeCent: Math.round(e.entnahmeCent || 0), einlageCent: Math.round(e.einlageCent || 0),
    einnahmeCent: r.einnahmeCent, nettoCent: r.nettoCent, ustCent: r.ustCent, satz: r.satz,
    belegId: beleg ? beleg.id : null, buchungIds, quittungBelegIds,
    quittungen: { ...quittungenSumme(appQuittungen), durchschlaege: (opt.quittungFotos || []).length },
    auffaellig: auff.auffaellig ? { ueblichCent: auff.ueblichCent, antwort: 'kein-privatgeld' } : null, satzText: String(eingabe.satz || '').slice(0, 400),
    festgeschriebenAt: new Date().toISOString(),
  };
  await encPut(rec);
  return rec;
}

// ---- Abschluss stornieren (Klaus 2026-11-09, K2: „Ja“) ----------------------------------------------------------
// Jede Buchung des Abschlusses bekommt eine festgeschriebene Gegenbuchung (store.storno, Datum heute) — nichts wird
// gelöscht. Der Abschluss wird als „storniert“ aufbewahrt (eigener Datensatz mit Zeitpunkt und Grund), der Tag ist
// danach wieder offen und kann neu gezählt werden. Zählprotokoll und Quittungen bleiben als Belege erhalten.

export async function listStornierteAbschluesse(datum) {
  const alle = await encList('tagesabschluss-storniert');
  return datum ? alle.filter((a) => a.datum === datum) : alle;
}

/** @returns {Promise<{datum, stornoIds:string[]}>} */
export async function tagesabschlussStornieren(datum, grund = '') {
  const rec = await getTagesabschluss(datum);
  if (!rec) throw new Error(`Für ${datum} gibt es keinen festgeschriebenen Tagesabschluss.`);
  const stornoIds = [];
  for (const bid of rec.buchungIds || []) {
    const b = await getBuchung(bid);
    if (!b || b.storniertDurch) continue;          // schon storniert (z. B. von Hand unter „Buchungen“)
    const s = await storno(bid);
    stornoIds.push(s.id);
  }
  const archiv = { ...rec, id: neueId('tagesabschluss-storniert'), type: 'tagesabschluss-storniert',
    storniertAm: new Date().toISOString(), stornoIds, grund: String(grund || '').slice(0, 300) };
  await encPut(archiv);
  await encDel(rec.id);
  return { datum, stornoIds };
}

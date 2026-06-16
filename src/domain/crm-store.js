// src/domain/crm-store.js
// Persistenz für Kunden, Aufträge, Mitarbeiter, Zeiten, Kostenstellen.
// Personenbezogene Daten verschlüsselt (encstore). Rechnung → Buchungs-Entwurf.

import { encPut, encGet, encList, encDel, neueId } from './encstore.js';
import { recAll, recPut, recDel, kvGet, kvSet } from '../core/db.js';
import { AUFTRAG_STATUS, auftragOffen } from './orders.js';
import { rechnungZeilen } from './invoicing.js';
import { formatRechnungsnummer } from './rechnung.js';
import { saveEntwurf } from './store.js';

const RECHNUNG_SEQ_KEY = 'rechnungSeq';

/** Vergibt die nächste fortlaufende Rechnungsnummer (§14(4) Nr.4) — Format JAHR-NNNN. */
export async function naechsteRechnungsnummer() {
  const seq = (Number(await kvGet(RECHNUNG_SEQ_KEY)) || 0) + 1;
  await kvSet(RECHNUNG_SEQ_KEY, seq);
  return formatRechnungsnummer(seq, new Date().getFullYear());
}

// ---- Kunden ----------------------------------------------------------------

export async function saveKunde(k) {
  const kunde = { id: k.id || neueId('kunde'), type: 'kunde', name: k.name || '', email: k.email || '',
    adresse: k.adresse || '', ustId: k.ustId || '', istVerbraucher: !!k.istVerbraucher,
    externId: k.externId || null, createdAt: k.createdAt || new Date().toISOString() };
  return encPut(kunde);
}
export const listKunden = () => encList('kunde');
export const getKunde = (id) => encGet(id);
export const deleteKunde = (id) => encDel(id);

// ---- Aufträge --------------------------------------------------------------

export async function saveAuftrag(a) {
  const auftrag = {
    id: a.id || neueId('auftrag'), type: 'auftrag',
    kundeId: a.kundeId || null, titel: a.titel || '',
    status: a.status || AUFTRAG_STATUS.ANGELEGT,
    positionen: a.positionen || [], kostenstelle: a.kostenstelle || null,
    rechnungBuchungId: a.rechnungBuchungId || null,
    rechnungNummer: a.rechnungNummer || null,
    rechnungDatum: a.rechnungDatum || null,
    zahlungen: a.zahlungen || [],
    mahnungen: a.mahnungen || [],
    externNummer: a.externNummer || null,
    createdAt: a.createdAt || new Date().toISOString(),
  };
  return encPut(auftrag);
}

/**
 * Erfasst eine (Teil-)Zahlung auf eine Forderung (berechneter Auftrag). Ist die Forderung
 * danach vollständig ausgeglichen, wird der Auftrag automatisch als „bezahlt" markiert.
 */
export async function auftragZahlungHinzufuegen(id, zahlung) {
  const a = await getAuftrag(id);
  if (!a) throw new Error('Auftrag nicht gefunden');
  const betrag = Math.round(Number(zahlung.betragCent) || 0);
  if (!(betrag > 0)) throw new Error('Zahlbetrag muss positiv sein');
  a.zahlungen = [...(a.zahlungen || []), {
    datum: zahlung.datum || new Date().toISOString().slice(0, 10),
    betragCent: betrag,
    ref: zahlung.ref || null,
  }];
  if (auftragOffen(a) <= 0) a.status = AUFTRAG_STATUS.BEZAHLT;
  return encPut(a);
}
export const listAuftraege = () => encList('auftrag');
export const getAuftrag = (id) => encGet(id);
export const deleteAuftrag = (id) => encDel(id);

/**
 * Importiert normalisierte WorkFloh-Daten ({kunden, auftraege} aus normalizeImport).
 * Dedupe: Kunden über externId bzw. Name, Aufträge über externNummer. Aufträge kommen
 * als „angelegt" herein (Rechnung/USt-Buchung erfolgt in BookLedgerPro).
 * @returns {Promise<{kundenNeu:number, auftraegeNeu:number, auftraegeUebersprungen:number}>}
 */
export async function importWorkFloh(parsed) {
  const vorhandeneKunden = await listKunden();
  const byExtern = new Map();
  const byName = new Map();
  for (const k of vorhandeneKunden) {
    if (k.externId) byExtern.set(k.externId, k.id);
    if (k.name) byName.set(k.name, k.id);
  }
  let kundenNeu = 0;
  const externIdToId = {};
  for (const k of (parsed.kunden || [])) {
    let id = (k.externId && byExtern.get(k.externId)) || byName.get(k.name);
    if (!id) {
      const saved = await saveKunde(k);
      id = saved.id; kundenNeu++;
      if (k.externId) byExtern.set(k.externId, id);
      byName.set(k.name, id);
    }
    if (k.externId) externIdToId[k.externId] = id;
  }

  const vorhandeneAuftraege = await listAuftraege();
  const externNummern = new Set(vorhandeneAuftraege.filter((a) => a.externNummer).map((a) => a.externNummer));
  let auftraegeNeu = 0, auftraegeUebersprungen = 0;
  for (const a of (parsed.auftraege || [])) {
    if (a.externNummer && externNummern.has(a.externNummer)) { auftraegeUebersprungen++; continue; }
    const kundeId = a.kundeExternId ? (externIdToId[a.kundeExternId] || null) : null;
    await saveAuftrag({
      titel: a.titel, kundeId, positionen: a.positionen,
      status: AUFTRAG_STATUS.ANGELEGT, externNummer: a.externNummer,
    });
    auftraegeNeu++;
    if (a.externNummer) externNummern.add(a.externNummer);
  }
  return { kundenNeu, auftraegeNeu, auftraegeUebersprungen };
}

export async function setAuftragStatus(id, status) {
  const a = await getAuftrag(id);
  if (!a) throw new Error('Auftrag nicht gefunden');
  a.status = status;
  return encPut(a);
}

/**
 * Vermerkt eine tatsächlich gesendete Mahnung (persistenter Verlauf) mit erfassten
 * Verzugszinsen/Mahngebühren. Diese werden bewusst MANUELL erfasst (keine automatische
 * USt-/Buchungslogik) — die Buchung von Zinsen/Gebühren bleibt ein separater Schritt.
 */
export async function mahnungErfassen(id, m) {
  const a = await getAuftrag(id);
  if (!a) throw new Error('Auftrag nicht gefunden');
  a.mahnungen = [...(a.mahnungen || []), {
    datum: m.datum || new Date().toISOString().slice(0, 10),
    stufe: Math.max(1, Math.min(4, Number(m.stufe) || 1)),
    zinsenCent: Math.round(Number(m.zinsenCent) || 0),
    gebuehrenCent: Math.round(Number(m.gebuehrenCent) || 0),
  }];
  return encPut(a);
}

/**
 * Erzeugt aus einem Auftrag eine Ausgangsrechnung als Buchungs-ENTWURF und
 * markiert den Auftrag als berechnet. Festschreiben bleibt manuell (GoBD).
 */
export async function rechnungAusAuftrag(id) {
  const a = await getAuftrag(id);
  if (!a) throw new Error('Auftrag nicht gefunden');
  if (a.rechnungBuchungId) throw new Error('Auftrag wurde bereits berechnet');
  const { zeilen } = rechnungZeilen(a);
  const datum = new Date().toISOString().slice(0, 10);
  const nummer = await naechsteRechnungsnummer();
  const entwurf = await saveEntwurf({
    datum,
    beschreibung: `Rechnung ${nummer}: ${a.titel}`,
    zeilen,
    kostenstelle: a.kostenstelle || null,
  });
  a.rechnungBuchungId = entwurf.id;
  a.rechnungNummer = nummer;
  a.rechnungDatum = datum;
  a.status = AUFTRAG_STATUS.BERECHNET;
  await encPut(a);
  return entwurf;
}

// ---- Mitarbeiter + Zeiten --------------------------------------------------

export async function saveMitarbeiter(m) {
  const ma = { id: m.id || neueId('ma'), type: 'mitarbeiter', name: m.name || '',
    stundenlohnCent: Number.isInteger(m.stundenlohnCent) ? m.stundenlohnCent : null,
    createdAt: m.createdAt || new Date().toISOString() };
  return encPut(ma);
}
export const listMitarbeiter = () => encList('mitarbeiter');
export const getMitarbeiter = (id) => encGet(id);
export const deleteMitarbeiter = (id) => encDel(id);

export async function saveZeit(z) {
  const zeit = { id: z.id || neueId('zeit'), type: 'zeit', mitarbeiterId: z.mitarbeiterId || null,
    auftragId: z.auftragId || null, datum: z.datum, dauerMin: Number(z.dauerMin) || 0,
    beschreibung: z.beschreibung || '', createdAt: z.createdAt || new Date().toISOString() };
  return encPut(zeit);
}
export const listZeiten = () => encList('zeit');
export const deleteZeit = (id) => encDel(id);

// ---- Kostenstellen (nicht personenbezogen → Klartext-Records) --------------

const KS_SEED = [
  { id: 'ks:1000', type: 'kostenstelle', nummer: '1000', name: 'Allgemein' },
  { id: 'ks:2000', type: 'kostenstelle', nummer: '2000', name: 'Vertrieb' },
  { id: 'ks:3000', type: 'kostenstelle', nummer: '3000', name: 'Produktion' },
];

export async function ensureKostenstellenSeeded() {
  const existing = await recAll('kostenstelle');
  if (existing.length) return existing;
  for (const k of KS_SEED) await recPut(k);
  return recAll('kostenstelle');
}
export async function listKostenstellen() {
  const ks = await recAll('kostenstelle');
  ks.sort((a, b) => a.nummer.localeCompare(b.nummer));
  return ks;
}
export async function saveKostenstelle(k) {
  const rec = { id: k.id || `ks:${k.nummer}`, type: 'kostenstelle', nummer: k.nummer, name: k.name || '' };
  await recPut(rec);
  return rec;
}
export const deleteKostenstelle = (id) => recDel(id);

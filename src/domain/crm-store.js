// src/domain/crm-store.js
// Persistenz für Kunden, Aufträge, Mitarbeiter, Zeiten, Kostenstellen.
// Personenbezogene Daten verschlüsselt (encstore). Rechnung → Buchungs-Entwurf.

import { encPut, encGet, encList, encDel, neueId } from './encstore.js';
import { recAll, recPut, recDel, kvGet, kvSet } from '../core/db.js';
import { AUFTRAG_STATUS, auftragOffen, darfAuftragBearbeiten, anwendeAuftragEdit, validateAuftrag } from './orders.js';
import { rechnungZeilen, rechnungsUebernahmeEntwurf, validateRechnungsUebernahme,
  zahlungsUebernahmeEntwurf, validateZahlungsUebernahme } from './invoicing.js';
import { formatRechnungsnummer } from './rechnung.js';
import { saveEntwurf } from './store.js';

const RECHNUNG_SEQ_KEY = 'rechnungSeq';
// Eigener Zähler für VORLÄUFIGE Vorlagen-Nummern (ENT-JJJJ-NNNN) im extern-Modus
// (rechnungsstelle === 'extern'). STRIKT getrennt vom lückenlosen §14-Kreis: eine
// vorläufige Vorlage ist KEINE §14-Rechnung, also darf sie den GoBD-Kreis nicht antasten.
const VORLAEUFIG_SEQ_KEY = 'vorlaeufigRechnungSeq';

/**
 * Reserviert die nächste laufende Zahl im lückenlosen §14-Kreis (ein einziger Zähler für
 * BookLedgerPro). Beide Wege — `rechnungAusAuftrag` und „Rechnung aus Angebot" (blp) —
 * ziehen aus DIESEM Zähler, damit der §14-Nummernkreis lückenlos und kollisionsfrei bleibt.
 * @returns {Promise<number>} die reservierte laufende Zahl (1-basiert)
 */
export async function naechsteRechnungSeq() {
  const seq = (Number(await kvGet(RECHNUNG_SEQ_KEY)) || 0) + 1;
  await kvSet(RECHNUNG_SEQ_KEY, seq);
  return seq;
}

/** Vergibt die nächste fortlaufende Rechnungsnummer (§14(4) Nr.4) — Format JAHR-NNNN. */
export async function naechsteRechnungsnummer() {
  const seq = await naechsteRechnungSeq();
  return formatRechnungsnummer(seq, new Date().getFullYear());
}

/**
 * Reserviert die nächste laufende Zahl im VORLÄUFIGEN Vorlagen-Kreis (ENT-JJJJ-NNNN,
 * extern-Modus). Eigener Zähler — der §14-Kreis bleibt unberührt. Frei (kein GoBD-Zwang),
 * dient nur der internen Unterscheidbarkeit der Vorlagen.
 * @returns {Promise<number>} die reservierte laufende Zahl (1-basiert)
 */
export async function naechsteVorlaeufigeSeq() {
  const seq = (Number(await kvGet(VORLAEUFIG_SEQ_KEY)) || 0) + 1;
  await kvSet(VORLAEUFIG_SEQ_KEY, seq);
  return seq;
}

/**
 * Anzahl der bereits von BLP vergebenen §14-Nummern (Stand des Zählers).
 * Grundlage für den Rechnungsstelle-Wechsel-Hinweis (Katalog §7a): ein Wechsel
 * blp→extern ist heikel, sobald BLP schon einen lückenlosen Kreis führt.
 */
export async function vergebeneRechnungsnummern() {
  return Number(await kvGet(RECHNUNG_SEQ_KEY)) || 0;
}

// ---- Kunden ----------------------------------------------------------------

export async function saveKunde(k) {
  const kunde = { id: k.id || neueId('kunde'), type: 'kunde', name: k.name || '', email: k.email || '',
    adresse: k.adresse || '', ustId: k.ustId || '', telefon: k.telefon || '', istVerbraucher: !!k.istVerbraucher,
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
    // Zahlungsziel je Forderung (A1-Rest): MUSS persistiert werden, sonst fällt das
    // Mahnwesen (offenePosten/faelligAmVon) und die gedruckte „zahlbar bis"-Zeile immer
    // auf den globalen Default zurück. Ganze Tage ≥ 0 oder null (kein eigenes Ziel).
    zahlungszielTage: a.zahlungszielTage != null ? a.zahlungszielTage : null,
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
 * Bearbeitet einen bestehenden Auftrag — nur die freigegebenen Felder (AUFTRAG_EDIT_FELDER:
 * Titel, Kunde, Kostenstelle, Zahlungsziel, Positionen). GoBD: ein bereits berechneter
 * Auftrag (Rechnung gebucht) bzw. einer mit erfassten (Teil-)Zahlungen ist gesperrt —
 * sonst würde die gebuchte Forderung verfälscht. Validiert wie beim Anlegen.
 */
export async function updateAuftrag(id, patch) {
  const a = await getAuftrag(id);
  if (!a) throw new Error('Auftrag nicht gefunden');
  if (!darfAuftragBearbeiten(a)) throw new Error('Berechneter Auftrag kann nicht mehr bearbeitet werden (GoBD).');
  const next = anwendeAuftragEdit(a, patch);
  const fehler = validateAuftrag(next);
  if (fehler.length) throw new Error(fehler.join(' '));
  return encPut(next);
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
 *
 * R4 Stufe 2 — RECHNUNGS-ÜBERNAHME: Trägt ein Auftrag ein gültiges `rechnung`-Objekt
 * (bereits in WorkFloh gestellt), wird daraus direkt ein Buchungs-ENTWURF (Forderung an
 * Erlöse + USt) erzeugt und der Auftrag als „berechnet" markiert. Nummer/Datum stammen aus
 * WorkFloh — es wird KEINE neue BLP-Rechnungsnummer vergeben. Festschreiben bleibt manuell
 * (GoBD). Ist die Rechnung ungültig, wird der Auftrag normal als „angelegt" übernommen.
 *
 * R4-Rest — ZAHLUNGS-/TEILZAHLUNGS-ÜBERNAHME (v3): Trägt die übernommene Rechnung ein gültiges
 * `zahlungen`-Array, wird je Zahlung ein Zahlungseingang als Buchungs-ENTWURF (Bank an Forderung)
 * erzeugt und am Auftrag als (Teil-)Zahlung vermerkt. Ist die Forderung danach ausgeglichen, wird
 * der Auftrag „bezahlt". Festschreiben bleibt manuell (GoBD).
 * @returns {Promise<{kundenNeu:number, auftraegeNeu:number, auftraegeUebersprungen:number, rechnungenUebernommen:number, zahlungenUebernommen:number}>}
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
  let auftraegeNeu = 0, auftraegeUebersprungen = 0, rechnungenUebernommen = 0, zahlungenUebernommen = 0;
  for (const a of (parsed.auftraege || [])) {
    if (a.externNummer && externNummern.has(a.externNummer)) { auftraegeUebersprungen++; continue; }
    const kundeId = a.kundeExternId ? (externIdToId[a.kundeExternId] || null) : null;
    const auftrag = await saveAuftrag({
      titel: a.titel, kundeId, positionen: a.positionen,
      status: AUFTRAG_STATUS.ANGELEGT, externNummer: a.externNummer,
      // v4: auftragseigenes Zahlungsziel aus dem rechnung-Block übernehmen → Fälligkeit/
      // Mahnwesen der Gegenstelle entsprechen der Ausgangsseite (kein globaler Default-Bruch).
      zahlungszielTage: a.rechnung && a.rechnung.zahlungszielTage != null ? a.rechnung.zahlungszielTage : null,
    });
    auftraegeNeu++;
    if (a.externNummer) externNummern.add(a.externNummer);

    // R4 Stufe 2: bereits gestellte Rechnung → Forderung/Buchung übernehmen (kein neuer Nr.-Lauf).
    if (a.rechnung && a.positionen.length && !validateRechnungsUebernahme(a.rechnung).length) {
      const entwurf = rechnungsUebernahmeEntwurf(auftrag, a.rechnung);
      const buchung = await saveEntwurf({
        datum: entwurf.datum,
        beschreibung: entwurf.beschreibung,
        zeilen: entwurf.zeilen,
        kostenstelle: entwurf.kostenstelle,
      });
      auftrag.rechnungBuchungId = buchung.id;
      auftrag.rechnungNummer = entwurf.nummer;
      auftrag.rechnungDatum = entwurf.datum;
      auftrag.status = AUFTRAG_STATUS.BERECHNET;

      // R4-Rest: bereits in WorkFloh erfasste (Teil-)Zahlungen mit übernehmen — je Zahlung ein
      // Zahlungseingang-Entwurf (Bank an Forderung) + (Teil-)Zahlung am Auftrag. Festschreiben manuell (GoBD).
      for (const z of (Array.isArray(a.rechnung.zahlungen) ? a.rechnung.zahlungen : [])) {
        if (validateZahlungsUebernahme(z).length) continue;
        const zEntwurf = zahlungsUebernahmeEntwurf(a.rechnung, z);
        await saveEntwurf({ datum: zEntwurf.datum, beschreibung: zEntwurf.beschreibung, zeilen: zEntwurf.zeilen });
        auftrag.zahlungen = [...(auftrag.zahlungen || []), { datum: z.datum, betragCent: z.betragCent, ref: z.ref || zEntwurf.ref }];
        zahlungenUebernommen++;
      }
      if ((auftrag.zahlungen || []).length && auftragOffen(auftrag) <= 0) auftrag.status = AUFTRAG_STATUS.BEZAHLT;

      await encPut(auftrag);
      rechnungenUebernommen++;
    }
  }
  return { kundenNeu, auftraegeNeu, auftraegeUebersprungen, rechnungenUebernommen, zahlungenUebernommen };
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
    // EXPLIZITE Kostenträger-Zuordnung (Zeit-Zuordnungs-UI in der Nachkalkulation). Gewinnt
    // vor der Ableitung aus dem Auftrag; null = nicht explizit zugeordnet (→ Auftrags-Ableitung).
    kostenstelle: z.kostenstelle || null,
    beschreibung: z.beschreibung || '', createdAt: z.createdAt || new Date().toISOString() };
  return encPut(zeit);
}
export const listZeiten = () => encList('zeit');
export const deleteZeit = (id) => encDel(id);

/**
 * Ordnet einen vorhandenen Zeiteintrag EXPLIZIT einem Kostenträger (Kostenstelle) zu —
 * unabhängig vom Auftrag. `kostenstelle` = der Kostenträger-Schlüssel (z. B. die Kostenstelle
 * des Angebots) oder leer/null für „keine explizite Zuordnung" (fällt dann auf die Ableitung
 * aus dem Auftrag zurück). Zeiteinträge sind mutable, NICHT GoBD-festgeschriebene CRM-Records
 * → eine nachträgliche (Neu-)Zuordnung ist hier sauber erlaubt (anders als bei Buchungen, deren
 * `kostenstelle` Teil der festgeschriebenen Hash-Kette ist und sich nicht ändern lässt).
 * @param {string} id  Zeit-Record-Id
 * @param {?string} kostenstelle  Kostenträger-Schlüssel oder null/'' (= nicht zugeordnet)
 * @returns {Promise<object>} der gespeicherte Zeiteintrag
 */
export async function setZeitKostenstelle(id, kostenstelle) {
  const z = await encGet(id);
  if (!z) throw new Error('Zeiteintrag nicht gefunden.');
  z.kostenstelle = kostenstelle || null;
  await encPut(z);
  return z;
}

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

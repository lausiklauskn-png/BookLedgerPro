// src/domain/rechnung.js
// Rechnungs-DOKUMENT (Ausgangsrechnung) — reine Aufbereitung + Prüfung der
// Pflichtangaben nach § 14 Abs. 4 UStG. Trennt das DOKUMENT (für Kunde/Druck) von
// der BUCHUNG (invoicing.js → Soll/Haben). Reine, testbare Funktionen.

import { auftragSummen, positionNetto } from './orders.js';
import { faelligAmVon } from './mahnwesen.js';
import { normalizeBesteller } from './besteller.js';

/**
 * Baut ein strukturiertes Rechnungs-Dokument aus Auftrag + Stammdaten.
 * @param p.auftrag  {titel, positionen:[{beschreibung?,menge,einzelpreisCent,ustSatz}], zahlungszielTage?, besteller?}
 * @param p.kunde    {name, adresse, ustId, email}
 * @param p.firma    {name, anschrift, steuernummer, ustId, iban}
 * @param p.nummer   fortlaufende Rechnungsnummer (oder leer = Entwurf)
 * @param p.datum    Rechnungsdatum YYYY-MM-DD
 * @param p.leistungsdatum  Liefer-/Leistungsdatum (Default: Rechnungsdatum)
 * @param p.kleinunternehmer  §19 UStG (kein USt-Ausweis)
 * @param p.defaultZielTage  Standard-Zahlungsziel (Tage) aus den Einstellungen, falls
 *   der Auftrag kein eigenes `zahlungszielTage` trägt (Default 14). Steuert „zahlbar bis".
 */
export function baueRechnung({ auftrag = {}, kunde = {}, firma = {}, nummer = '', datum = '', leistungsdatum = '', kleinunternehmer = false, defaultZielTage = 14 } = {}) {
  const summen = auftragSummen(auftrag.positionen);
  const saetze = Object.keys(summen.perSatz).map(Number).sort((a, b) => b - a);
  const steuerzeilen = saetze
    .filter((s) => summen.perSatz[s].netto > 0)
    .map((s) => ({ satz: s, netto: summen.perSatz[s].netto, ust: kleinunternehmer ? 0 : summen.perSatz[s].ust }));
  const ust = kleinunternehmer ? 0 : summen.ust;
  // Fälligkeit „zahlbar bis": auftragseigenes Zahlungsziel (A1-Rest) vor globalem Default.
  // Spiegelt mahnwesen.faelligAmVon — ohne Rechnungsdatum bleibt das Feld leer.
  const zielTage = auftrag.zahlungszielTage != null && auftrag.zahlungszielTage !== ''
    ? auftrag.zahlungszielTage : null;
  const zahlbarBis = faelligAmVon({ datum: datum || '', zahlungszielTage: zielTage }, defaultZielTage);
  return {
    nummer: nummer || '',
    datum: datum || '',
    leistungsdatum: leistungsdatum || datum || '',
    zahlbarBis,
    zahlungszielTage: zielTage,
    firma, kunde,
    // Handelnde Person als Besteller (P10): Ansprechpartner beim Empfänger. Erscheint
    // auf dem Dokument als knappe „z. Hd."-Zeile (Name + Funktion); null = ohne.
    besteller: normalizeBesteller(auftrag.besteller),
    titel: auftrag.titel || '',
    positionen: (auftrag.positionen || []).map((p) => ({
      beschreibung: p.beschreibung || '',
      menge: Number(p.menge) || 0,
      einzelpreisCent: Number(p.einzelpreisCent) || 0,
      ustSatz: Number(p.ustSatz) || 0,
      netto: positionNetto(p),
    })),
    steuerzeilen,
    netto: summen.netto,
    ust,
    brutto: summen.netto + ust,
    kleinunternehmer: !!kleinunternehmer,
  };
}

/**
 * Prüft die Pflichtangaben nach § 14 Abs. 4 UStG (nicht-blockierend gedacht — die
 * UI zeigt Lücken als Hinweis, GoBD-/USt-konforme Rechnung liegt beim Aussteller).
 * @returns {string[]} fehlende Angaben
 */
export function pflichtangaben(rechnung) {
  const fehlt = [];
  const f = rechnung.firma || {};
  const k = rechnung.kunde || {};
  if (!String(f.name || '').trim()) fehlt.push('Vollständiger Name des Ausstellers (§14(4) Nr.1)');
  if (!String(f.anschrift || '').trim()) fehlt.push('Anschrift des Ausstellers (§14(4) Nr.1)');
  if (!String(f.steuernummer || '').trim() && !String(f.ustId || '').trim()) fehlt.push('Steuernummer oder USt-IdNr. des Ausstellers (§14(4) Nr.2)');
  if (!String(k.name || '').trim()) fehlt.push('Name des Leistungsempfängers (§14(4) Nr.1)');
  if (!rechnung.datum) fehlt.push('Ausstellungsdatum (§14(4) Nr.3)');
  if (!rechnung.nummer) fehlt.push('Fortlaufende Rechnungsnummer (§14(4) Nr.4)');
  if (!rechnung.positionen.length) fehlt.push('Menge und Art der Leistung (§14(4) Nr.5)');
  if (!rechnung.leistungsdatum) fehlt.push('Liefer-/Leistungszeitpunkt (§14(4) Nr.6)');
  if (!rechnung.kleinunternehmer && rechnung.ust <= 0) fehlt.push('Steuersatz und Steuerbetrag bzw. Hinweis auf Steuerbefreiung (§14(4) Nr.8)');
  return fehlt;
}

/** Erzeugt eine Rechnungsnummer aus laufender Zahl + Jahr (z. B. 2026-0007). */
export function formatRechnungsnummer(seq, jahr) {
  return `${jahr}-${String(seq).padStart(4, '0')}`;
}

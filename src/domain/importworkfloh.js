// src/domain/importworkfloh.js
// Import aus Mein-WorkFloh (oder kompatiblen Quellen) — DEFINIERTES Zielformat,
// auf das WorkFloh seine „Verknüpfung mit Buchhaltungssoftware" exportiert.
// Reine, testbare Aufbereitung; Persistenz liegt in crm-store.importWorkFloh().
//
// Erwartetes JSON:
// {
//   "kunden":    [{ externId, name, adresse?, email?, ustId? }],
//   "auftraege": [{ externNummer, kundeExternId?, titel, positionen:
//                   [{ beschreibung?, menge, einzelpreisCent|einzelpreis, ustSatz? }],
//                   rechnung?: { nummer, datum, leistungsdatum? } }]
// }
// Fehlt ein USt-Satz, wird er in BookLedgerPro ergänzt (Default, editierbar).
//
// R4 Stufe 2 — RECHNUNGS-ÜBERNAHME: Trägt ein Auftrag ein `rechnung`-Objekt (bereits in
// WorkFloh gestellte Rechnung), wird es hier normalisiert. Die Übernahme als Forderung/
// Buchung erfolgt in crm-store.importWorkFloh (Nummer/Datum stammen aus WorkFloh, es wird
// KEINE neue BLP-Rechnungsnummer vergeben). Unvollständige Rechnungsangaben werden verworfen
// (der Auftrag kommt dann als „angelegt" herein) und als Warnung gezählt — nichts wird erfunden.
//
// R4-Rest — ZAHLUNGS-/TEILZAHLUNGS-ÜBERNAHME (Austauschformat v3): Eine `rechnung` darf ein
// optionales `zahlungen`-Array `[{ datum, betragCent|betrag, ref? }]` tragen (in WorkFloh bereits
// erfasste Zahlungseingänge). Hier wird es konservativ normalisiert; die eigentliche Übernahme als
// (Teil-)Zahlung am Auftrag + Zahlungseingang-Buchungsentwurf (Bank an Forderung) erfolgt in
// crm-store.importWorkFloh. Unvollständige Zahlungen (Datum/Betrag) werden verworfen + als Warnung
// gezählt — nichts wird erfunden, der Festschreibe-Schritt bleibt manuell (GoBD).

import { parseEuroToCents } from './money.js';

const SAETZE = new Set([0, 7, 19]);

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function centsOf(pos) {
  if (Number.isInteger(pos.einzelpreisCent)) return pos.einzelpreisCent;
  if (pos.einzelpreis != null) return parseEuroToCents(String(pos.einzelpreis)) || 0;
  return 0;
}

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalisiert ein optionales Rechnungs-Objekt eines Auftrags (R4 Stufe 2). Fehlen Nummer
 * oder ein gültiges Datum, wird `null` zurückgegeben und eine Warnung erzeugt — der Auftrag
 * wird dann als reiner „angelegt"-Auftrag (ohne Rechnung) übernommen. Nichts wird erfunden.
 * @returns {{nummer:string, datum:string, leistungsdatum?:string}|null}
 */
function normalizeRechnung(raw, label, warnungen) {
  if (!raw || typeof raw !== 'object') return null;
  const nummer = String(raw.nummer || '').trim();
  const datum = String(raw.datum || '').trim();
  if (!nummer || !ISO_DATUM.test(datum)) {
    warnungen.push(`Auftrag „${label || '?'}": Rechnungsangaben unvollständig (Nummer/Datum) → als Auftrag ohne Rechnung übernommen.`);
    return null;
  }
  const r = { nummer, datum };
  const ld = String(raw.leistungsdatum || '').trim();
  if (ld && ISO_DATUM.test(ld)) r.leistungsdatum = ld;
  const zahlungen = normalizeZahlungen(raw.zahlungen, nummer, warnungen);
  if (zahlungen.length) r.zahlungen = zahlungen;
  return r;
}

/**
 * Normalisiert das optionale `zahlungen`-Array einer übernommenen Rechnung (R4-Rest, v3).
 * Jede Zahlung braucht ein gültiges ISO-Datum und einen positiven Betrag (Cent oder Euro-String).
 * Unvollständige Einträge werden verworfen + als Warnung gezählt (nichts wird erfunden).
 * @returns {{datum:string, betragCent:number, ref?:string}[]}
 */
function normalizeZahlungen(raw, label, warnungen) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  raw.forEach((z, i) => {
    if (!z || typeof z !== 'object') { warnungen.push(`Rechnung „${label || '?'}": Zahlung ${i + 1} ungültig → übersprungen.`); return; }
    const datum = String(z.datum || '').trim();
    const betrag = Number.isInteger(z.betragCent) ? z.betragCent : (z.betrag != null ? parseEuroToCents(String(z.betrag)) : 0);
    const betragCent = Math.round(Number(betrag) || 0);
    if (!ISO_DATUM.test(datum) || !(betragCent > 0)) {
      warnungen.push(`Rechnung „${label || '?'}": Zahlung ${i + 1} unvollständig (Datum/Betrag) → übersprungen.`);
      return;
    }
    const eintrag = { datum, betragCent };
    const ref = String(z.ref || '').trim();
    if (ref) eintrag.ref = ref;
    out.push(eintrag);
  });
  return out;
}

/** Parst den Import-Text zu einem Objekt (wirft bei ungültigem JSON). */
export function parseImportText(text) {
  const obj = JSON.parse(String(text || ''));
  if (!obj || typeof obj !== 'object') throw new Error('Kein gültiges JSON-Objekt.');
  return obj;
}

/**
 * Normalisiert ein Import-Objekt zu {kunden, auftraege, warnungen} (rein, testbar).
 * Tolerant: ergänzt fehlende USt-Sätze (Default) und akzeptiert Euro- oder Cent-Preise.
 */
export function normalizeImport(obj, { defaultUstSatz = 19 } = {}) {
  const o = obj || {};
  const warnungen = [];

  const kunden = [];
  for (const k of (Array.isArray(o.kunden) ? o.kunden : [])) {
    const name = String((k && k.name) || '').trim();
    if (!name) { warnungen.push('Ein Kunde ohne Name wurde übersprungen.'); continue; }
    kunden.push({
      externId: k.externId != null ? String(k.externId) : null,
      name,
      adresse: String(k.adresse || ''),
      email: String(k.email || ''),
      ustId: String(k.ustId || ''),
    });
  }

  const auftraege = [];
  for (const a of (Array.isArray(o.auftraege) ? o.auftraege : [])) {
    const titel = String((a && a.titel) || '').trim();
    const posRaw = Array.isArray(a && a.positionen) ? a.positionen : [];
    if (!titel && !posRaw.length) { warnungen.push('Ein Auftrag ohne Titel/Positionen wurde übersprungen.'); continue; }
    const positionen = posRaw.map((p) => {
      // „fehlend" (null/undefined/"") von explizit 0 unterscheiden: 0 ist ein gültiger Satz.
      let satz;
      if (p.ustSatz == null || p.ustSatz === '') {
        satz = defaultUstSatz;
        warnungen.push(`Auftrag „${titel || a.externNummer || '?'}": fehlender USt-Satz → ${defaultUstSatz} % ergänzt.`);
      } else {
        satz = num(p.ustSatz);
        if (!SAETZE.has(satz)) { satz = defaultUstSatz; warnungen.push(`Auftrag „${titel || a.externNummer || '?'}": ungültiger USt-Satz → ${defaultUstSatz} % ergänzt.`); }
      }
      return {
        beschreibung: String(p.beschreibung || ''),
        menge: num(p.menge) || 0,
        einzelpreisCent: centsOf(p),
        ustSatz: satz,
      };
    });
    auftraege.push({
      externNummer: a.externNummer != null ? String(a.externNummer) : null,
      kundeExternId: a.kundeExternId != null ? String(a.kundeExternId) : null,
      titel: titel || `Import ${a.externNummer || ''}`.trim(),
      positionen,
      rechnung: normalizeRechnung(a.rechnung, titel || a.externNummer, warnungen),
    });
  }

  return { kunden, auftraege, warnungen };
}

// src/domain/importworkfloh.js
// Import aus Mein-WorkFloh (oder kompatiblen Quellen) — DEFINIERTES Zielformat,
// auf das WorkFloh seine „Verknüpfung mit Buchhaltungssoftware" exportiert.
// Reine, testbare Aufbereitung; Persistenz liegt in crm-store.importWorkFloh().
//
// Erwartetes JSON:
// {
//   "kunden":    [{ externId, name, adresse?, email?, ustId? }],
//   "auftraege": [{ externNummer, kundeExternId?, titel, positionen:
//                   [{ beschreibung?, menge, einzelpreisCent|einzelpreis, ustSatz? }] }]
// }
// Fehlt ein USt-Satz, wird er in BookLedgerPro ergänzt (Default, editierbar).

import { parseEuroToCents } from './money.js';

const SAETZE = new Set([0, 7, 19]);

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function centsOf(pos) {
  if (Number.isInteger(pos.einzelpreisCent)) return pos.einzelpreisCent;
  if (pos.einzelpreis != null) return parseEuroToCents(String(pos.einzelpreis)) || 0;
  return 0;
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
    });
  }

  return { kunden, auftraege, warnungen };
}

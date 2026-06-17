// src/domain/connect.js
// Offene Anbindung an ANDERE Buchhaltungssoftware (nicht nur WorkFloh): ein versioniertes,
// dokumentiertes Austauschformat (JSON) zum EXPORT (BLP-Daten herausgeben) und IMPORT
// (Fremddaten einlesen). Reine, testbare Funktionen. Persistenz via crm-store.importWorkFloh.
//
// Das Format ist abwärtskompatibel zum bisherigen WorkFloh-Schema (siehe docs/WORKFLOH_IMPORT.md
// und docs/CONNECT.md): „bare" {kunden, auftraege} wird ebenso akzeptiert wie das gewrappte Paket.

export const AUSTAUSCH_FORMAT = 'bookledgerpro-austausch';
// v2 (R4 Stufe 2): Aufträge dürfen optional eine bereits gestellte `rechnung` tragen
// (Rechnungs-Übernahme). v3 (R4-Rest): die `rechnung` darf zusätzlich ein `zahlungen`-Array
// `[{datum, betragCent, ref?}]` tragen (Zahlungs-/Teilzahlungs-Übernahme). Abwärtskompatibel —
// v1/v2-Pakete ohne `zahlungen` bleiben gültig.
export const AUSTAUSCH_VERSION = 3;

/** BLP-Daten → offenes Austauschpaket (für Fremdsoftware / WorkFloh). */
export function buildAustauschPaket({ kunden = [], auftraege = [] } = {}) {
  return {
    format: AUSTAUSCH_FORMAT,
    version: AUSTAUSCH_VERSION,
    erzeugt: new Date().toISOString(),
    kunden: kunden.map((k) => ({
      externId: k.externId || k.id || null,
      name: k.name || '',
      adresse: k.adresse || k.anschrift || '',
      email: k.email || '',
      ustId: k.ustId || '',
    })),
    auftraege: auftraege.map((a) => {
      const out = {
        externNummer: a.externNummer || a.nummer || a.id || null,
        kundeExternId: a.kundeExternId || a.kundeId || null,
        titel: a.titel || a.beschreibung || '',
        positionen: (a.positionen || []).map((p) => ({
          beschreibung: p.beschreibung || '',
          menge: p.menge != null ? p.menge : 1,
          einzelpreisCent: Number.isInteger(p.einzelpreisCent) ? p.einzelpreisCent : 0,
          ustSatz: p.ustSatz != null ? p.ustSatz : null,
        })),
      };
      // Reziprozität: bereits berechnete Aufträge tragen ihre Rechnung mit (Nummer/Datum),
      // damit eine Gegenstelle sie als Rechnung statt nur als Auftrag übernehmen kann.
      if (a.rechnungNummer && a.rechnungDatum) {
        out.rechnung = {
          nummer: a.rechnungNummer,
          datum: a.rechnungDatum,
          leistungsdatum: a.leistungsdatum || a.rechnungDatum,
        };
        // v3: bereits erfasste (Teil-)Zahlungen reziprok mitgeben (gültige Einträge).
        const zahlungen = (a.zahlungen || [])
          .filter((z) => z && Math.round(Number(z.betragCent) || 0) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(z.datum || '')))
          .map((z) => {
            const e = { datum: z.datum, betragCent: Math.round(Number(z.betragCent) || 0) };
            if (z.ref) e.ref = String(z.ref);
            return e;
          });
        if (zahlungen.length) out.rechnung.zahlungen = zahlungen;
      }
      return out;
    }),
  };
}

/**
 * Austausch-Datei (JSON-Text) → {ok, version, obj, fehler}. Akzeptiert das gewrappte Paket
 * (format/version) UND das „bare" {kunden, auftraege}-Format (Abwärtskompatibilität).
 */
export function parseAustauschPaket(text) {
  let obj;
  try { obj = JSON.parse(String(text || '')); } catch { return { ok: false, fehler: 'Kein gültiges JSON.' }; }
  if (!obj || typeof obj !== 'object') return { ok: false, fehler: 'Kein JSON-Objekt.' };
  if (obj.format && obj.format !== AUSTAUSCH_FORMAT) return { ok: false, fehler: `Unbekanntes Format: ${obj.format}` };
  if (!obj.kunden && !obj.auftraege) return { ok: false, fehler: 'Weder Kunden noch Aufträge enthalten.' };
  return { ok: true, version: obj.version || null, obj: { kunden: obj.kunden || [], auftraege: obj.auftraege || [] } };
}

export function austauschDateiname() {
  return `bookledgerpro-austausch-${new Date().toISOString().slice(0, 10)}.json`;
}

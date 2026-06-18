// src/domain/angebote-store.js
// BAUPLAN Block 2 / Schritt 11b — verschlüsselte Store-Glue für Angebote.
// Persistenz-Schicht UNTER der Angebots-UI (ui/views/angebote.js), gebaut auf dem
// generischen verschlüsselten Record-Store (encstore) — exakt wie crm-store.js.
//
// PRIME DIRECTIVE (Katalog §0): Ein Angebot trägt zwei Schichten — die NEUTRALE
// Außenschicht (Positionen/Preise/USt) UND je Position eine optionale INTERNE
// `kalkulation` (Marge/Selbstkosten/Verschnitt …). Beide werden hier GEMEINSAM
// verschlüsselt at rest gespeichert (DSGVO-konform, gerätelokal). Nach außen gedruckt/
// exportiert wird ausschließlich `externesAngebot(angebot)` (Whitelist) — die interne
// Schicht verlässt das Haus nie. Diese Glue erzwingt das nicht selbst; sie bewahrt nur
// die reine angebote.js-Form (normalizeAngebotsposition reicht `kalkulation` unangetastet
// durch) und überlässt die Außen-Projektion der UI/dem Export.
//
// NICHT GoBD-relevant: Der Angebotsnummernkreis (`AN-JJJJ-NNNN`) ist FREI (ein Angebot ist
// keine Buchung) — getrennt vom strikten §14-Rechnungskreis (crm-store.naechsteRechnungsnummer).
// Die Nummer wird hier beim ersten Speichern vergeben, falls noch keine vorhanden ist.
//
// EHRLICHE GRENZE: IndexedDB/Krypto-Pfad → in der Build-Umgebung NICHT headless getestet
// (statisch geprüft). Die reine Angebots-Logik (Status-Flow, Nummernkreis, Aggregation,
// Whitelist) ist in domain/angebote.js node-getestet.

import { encPut, encGet, encList, encDel, neueId } from './encstore.js';
import {
  ANGEBOT_STATUS, normalizeAngebotsposition, setzeAngebotStatus,
  vergebeAngebotsnummer, istAngebotsnummer,
} from './angebote.js';

/** Jahr (Number) aus einem ISO-Datum `YYYY-…` — oder null, wenn nicht erkennbar. */
function jahrAus(datum) {
  const m = /^(\d{4})/.exec(String(datum || ''));
  return m ? Number(m[1]) : null;
}

/**
 * Baut den zu persistierenden Angebots-Record: stabile id/type/createdAt + die
 * normalisierten Felder aus angebote.js. Positionen behalten ihre interne `kalkulation`
 * (normalizeAngebotsposition reicht sie durch) — der Live-Deckungsbeitrag überlebt also
 * das Speichern/Laden. Idempotent (mehrfaches Anwenden ändert nichts).
 */
function baueAngebotRecord(a = {}) {
  return {
    id: a.id || neueId('angebot'),
    type: 'angebot',
    nummer: a.nummer || '',
    status: a.status || ANGEBOT_STATUS.ENTWURF,
    titel: String(a.titel || ''),
    kundeId: a.kundeId ?? null,
    kostenstelle: a.kostenstelle ?? null,
    datum: a.datum || '',
    gueltigBis: a.gueltigBis || '',
    positionen: (a.positionen || []).map(normalizeAngebotsposition),
    createdAt: a.createdAt || new Date().toISOString(),
  };
}

/**
 * Speichert ein Angebot (Neuanlage ODER Update). Hat es noch keine (gültige) Nummer,
 * wird die nächste freie Angebotsnummer für das (Datums-)Jahr vergeben — der Kreis ist
 * frei, kein Lückenlosigkeits-Zwang. Bereits nummerierte Angebote behalten ihre Nummer.
 */
export async function saveAngebot(a) {
  let rec = baueAngebotRecord(a);
  if (!istAngebotsnummer(rec.nummer)) {
    const jahr = jahrAus(rec.datum) || new Date().getFullYear();
    const bestehende = await listAngebote();
    rec = baueAngebotRecord(vergebeAngebotsnummer(rec, bestehende, jahr));
  }
  return encPut(rec);
}

export const listAngebote = () => encList('angebot');
export const getAngebot = (id) => encGet(id);
export const deleteAngebot = (id) => encDel(id);

/**
 * Wechselt den Status eines gespeicherten Angebots über den erlaubten Workflow
 * (angebote.setzeAngebotStatus). Wird ein Entwurf erstmals „offen" (verschickt) und hat
 * noch keine Nummer, wird sie hier nachgezogen. @throws bei unerlaubtem Übergang.
 */
export async function setzeAngebotStatusStore(id, nach) {
  const a = await getAngebot(id);
  if (!a) throw new Error('Angebot nicht gefunden');
  const r = setzeAngebotStatus(a, nach);
  if (!r.ok) throw new Error(r.fehler);
  return saveAngebot(r.angebot);
}

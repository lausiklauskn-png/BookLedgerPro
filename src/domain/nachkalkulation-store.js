// src/domain/nachkalkulation-store.js
// BAUPLAN Block 2 / Schritt „Nachkalkulation/Kostenträger + Kalibrierung — UI".
// I/O-/Verdrahtungs-Schicht UNTER der Auswertungs-Ansicht (ui/views/nachkalkulation.js).
// Sammelt die bereits vorhandenen Daten (festgeschriebene Buchungen/Belege, Zeiteinträge,
// angenommene/archivierte Angebote) und reicht sie an die fertige, node-getestete reine
// Logik durch:
//   - domain/nachkalkulation.js (#130): Soll/Ist je Kostenträger (Auftrag/Angebot über
//     seine `kostenstelle`).
//   - domain/kalibrierung.js   (#131): Korrekturfaktoren je Kostenart aus der Historie +
//     Angebots-Trefferquote je Preisniveau.
//
// PRIME DIRECTIVE (Katalog §0): Nachkalkulation, Soll/Ist, Faktoren, Margen, Trefferquoten
// sind REIN INTERN. Diese Schicht erzeugt KEIN Außendokument und SENDET NICHTS (auch nicht
// an eine KI — der `kalibrierungsDigest` bleibt ungenutzt, bis ein eigener, ausdrücklich zu
// bestätigender opt-in/BYOK-Schritt das tut, CLAUDE.md §8).
//
// KOSTENTRÄGER = ein Angebot mit einer `kostenstelle` (über die `kostenstelle` werden die
// IST-Buchungen/Zeiten zugeordnet). Angebote ohne `kostenstelle` lassen sich nicht zuordnen
// und werden ausgelassen.
//
// EHRLICHE GRENZE: IndexedDB/Krypto-Pfad → in der Build-Umgebung NICHT headless getestet
// (statisch geprüft). Die reine Logik (Soll/Ist, Faktoren, Trefferquote) ist node-getestet;
// der reine Zeit-Join (zeiteintraegeAusZeiten) ebenfalls.

import { loadAccounts, listBuchungen } from './store.js';
import { listAngebote } from './angebote-store.js';
import { listZeiten, listMitarbeiter, listAuftraege, setZeitKostenstelle } from './crm-store.js';
import {
  kostentraegerAnalyse, zeiteintraegeAusZeiten, standardKontoBlock, aufgeloesteKostenstelle,
} from './nachkalkulation.js';
import {
  korrekturFaktoren, faktorWerte, trefferquote, trefferquoteJePreisniveau,
} from './kalibrierung.js';

/** Index `schlüssel(x) → x` über eine Liste. */
function indexBy(liste, schluessel) {
  const idx = {};
  for (const x of liste || []) {
    const k = schluessel(x);
    if (k != null) idx[k] = x;
  }
  return idx;
}

/**
 * Lädt den gemeinsamen IST-Kontext einmal: festgeschriebene Buchungen + Konten-Index
 * (konto-Nr → Konto) + die Standard-konto→Kostenart-Zuordnung (`standardKontoBlock` nach
 * SKR03-Kontenklasse: Wareneingang→Material, Fremdleistungen→Zukauf, Personalaufwand→Arbeit;
 * alles übrige bleibt auf dem Default Material) + die in die istZeitkosten-Form gebrachten
 * Zeiteinträge (Kostenträger aus dem Auftrag, Stundenkostensatz aus dem Mitarbeiter — siehe
 * zeiteintraegeAusZeiten).
 * @returns {Promise<{buchungen:Array, kontoIndex:Object, kontoBlock:Object, zeiteintraege:Array}>}
 */
export async function ladeNachkalkulationKontext() {
  const [konten, buchungen, zeiten, mitarbeiter, auftraege] = await Promise.all([
    loadAccounts(), listBuchungen(), listZeiten(), listMitarbeiter(), listAuftraege(),
  ]);
  const kontoIndex = indexBy(konten, (k) => k.nummer);
  const kontoBlock = standardKontoBlock(konten);
  const auftragIndex = indexBy(auftraege, (a) => a.id);
  const mitarbeiterIndex = indexBy(mitarbeiter, (m) => m.id);
  const zeiteintraege = zeiteintraegeAusZeiten(zeiten, auftragIndex, mitarbeiterIndex);
  return { buchungen, kontoIndex, kontoBlock, zeiteintraege };
}

/**
 * Vollständige Nachkalkulations-/Kalibrierungs-Übersicht für die UI:
 *   - `traeger`: je Kostenträger (Angebot mit `kostenstelle`) der Soll/Ist-Vergleich
 *     (kostentraegerAnalyse: SOLL aus der internen Vorkalkulation, IST aus Buchungen/Zeit).
 *   - `faktoren`/`faktorWerte`: Korrekturfaktoren je Kostenart aus der Historie der Soll/Ist-
 *     Vergleiche (geldgewichtet, konservativ auf 0,5–2,0 gedeckelt) — Andockpunkt für die
 *     kalibrierte Vorwärtskalkulation (kalkuliereKalibriert).
 *   - `trefferquote`/`trefferquoteJePreisniveau`: Angebots-Erfolg insgesamt + je Preisniveau
 *     (über ALLE Angebote, nicht nur die Kostenträger).
 * @returns {Promise<{traeger:Array<{angebot:object, analyse:object}>, faktoren:object,
 *   faktorWerte:object, trefferquote:object, trefferquoteJePreisniveau:object,
 *   anzahlVergleiche:number, anzahlAngebote:number}>}
 */
export async function nachkalkulationUebersicht() {
  const [{ buchungen, kontoIndex, kontoBlock, zeiteintraege }, angebote] = await Promise.all([
    ladeNachkalkulationKontext(), listAngebote(),
  ]);

  const traeger = (angebote || [])
    .filter((a) => a.kostenstelle)
    .map((angebot) => ({
      angebot,
      analyse: kostentraegerAnalyse(angebot, { buchungen, kontoIndex, kontoBlock, zeiteintraege }),
    }));

  const vergleiche = traeger.map((t) => t.analyse.vergleich);
  const faktoren = korrekturFaktoren(vergleiche);

  return {
    traeger,
    faktoren,
    // Konservativ deckeln (0,5–2,0), damit ein Datenausreißer die Kalkulation nicht entgleisen lässt.
    faktorWerte: faktorWerte(faktoren, { min: 0.5, max: 2 }),
    trefferquote: trefferquote(angebote),
    trefferquoteJePreisniveau: trefferquoteJePreisniveau(angebote),
    anzahlVergleiche: vergleiche.length,
    anzahlAngebote: (angebote || []).length,
  };
}

/**
 * Lädt den Kontext für die ZEIT-ZUORDNUNGS-UI (BAUPLAN Block 2 / Folgeschritt „Zeiterfassung-/
 * Beleg-Zuordnung je Auftrag"): die gespeicherten Zeiteinträge + die Stamm-Indizes, um je
 * Eintrag Mitarbeiter/aufgelöster Kostenträger anzuzeigen, sowie die Liste der zuordbaren
 * Kostenträger (Angebote mit Kostenstelle — deduped nach Kostenstelle, da der Kostenträger
 * über die `kostenstelle` identifiziert wird).
 *   - `zeiten`: jeder Eintrag um seine `aufgeloesteKostenstelle` (explizit vor Auftrag) und
 *     ein `explizit`-Flag angereichert (zeigt, ob die Zuordnung explizit gesetzt ist).
 *   - `kostentraeger`: `{kostenstelle, nummer, titel}` je distinkter Kostenstelle.
 * @returns {Promise<{zeiten:Array, mitarbeiterIndex:Object, kostentraeger:Array}>}
 */
export async function ladeZeitZuordnung() {
  const [zeiten, mitarbeiter, auftraege, angebote] = await Promise.all([
    listZeiten(), listMitarbeiter(), listAuftraege(), listAngebote(),
  ]);
  const auftragIndex = indexBy(auftraege, (a) => a.id);
  const mitarbeiterIndex = indexBy(mitarbeiter, (m) => m.id);

  const kostentraeger = [];
  const gesehen = new Set();
  for (const a of angebote || []) {
    if (!a.kostenstelle || gesehen.has(a.kostenstelle)) continue;
    gesehen.add(a.kostenstelle);
    kostentraeger.push({ kostenstelle: a.kostenstelle, nummer: a.nummer || '', titel: a.titel || '' });
  }

  const angereichert = (zeiten || []).map((z) => ({
    ...z,
    aufgeloesteKostenstelle: aufgeloesteKostenstelle(z, auftragIndex),
    explizit: z.kostenstelle != null,
  }));
  angereichert.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));

  return { zeiten: angereichert, mitarbeiterIndex, kostentraeger };
}

/**
 * Ordnet einen Zeiteintrag EXPLIZIT einem Kostenträger zu (oder hebt die Zuordnung mit
 * null/'' auf → Ableitung aus dem Auftrag). Dünne Verdrahtung auf crm-store.setZeitKostenstelle;
 * Zeiteinträge sind mutable CRM-Records (kein GoBD-Hash) → sauber (neu) zuordbar.
 * @param {string} zeitId
 * @param {?string} kostenstelle
 * @returns {Promise<object>} der gespeicherte Zeiteintrag
 */
export function zuordneZeit(zeitId, kostenstelle) {
  return setZeitKostenstelle(zeitId, kostenstelle);
}

/**
 * Nur die Korrekturfaktoren je Kostenart — für die KALIBRIERTE Vorwärtskalkulation im
 * Angebots-Editor (domain/kalkulation.js `kalkuliereKalibriert`). Reicht die fertige
 * Übersicht durch und liefert die konservativ gedeckelten Multiplikatoren (`faktorWerte`,
 * 0,5–2,0) + die Stichprobengröße (`anzahlVergleiche` = wie viele Soll/Ist-Vergleiche
 * dahinterstehen). Die UI zeigt die Größe transparent an und blendet die Option ohne
 * Historie (anzahlVergleiche = 0) aus.
 * @returns {Promise<{faktorWerte:object, faktoren:object, anzahlVergleiche:number}>}
 */
export async function ladeKalibrierungFaktoren() {
  const { faktoren, faktorWerte, anzahlVergleiche } = await nachkalkulationUebersicht();
  return { faktoren, faktorWerte, anzahlVergleiche };
}

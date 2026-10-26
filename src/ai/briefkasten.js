// src/ai/briefkasten.js
// Datenschutz-Modi / CRM, Bau-Schritt R5c — DREISTUFIGER BRIEFKASTEN.
//
// Bisher liefert `ai/anker.js` eine FLACHE Anker-Liste: alle Identifikatoren (Firmen,
// Personen, IBAN, …) liegen gleichrangig nebeneinander → die erzeugten Token (`[[FIRMA_1]]`,
// `[[PERSON_1]]`) verraten der KI NICHT, wer zu wem gehört. Dieses Modul ordnet dieselben
// exakten Identifikatoren in die fachliche Hierarchie **Mandant ⊃ Firma ⊃ Person** ein und
// vergibt **scope-präfixierte** Anker-Typen, sodass `pseudonym.tokenize()` sprechende,
// gruppierende Token erzeugt:
//
//   [[MANDANT_1]]              die Mandanten-/Tenant-Bezeichnung
//   [[FIRMA_1_1]]              Name der 1. Firma (eigene Firma = FIRMA_1, „eigen")
//   [[FIRMA_1_IBAN_1]]         deren IBAN  (alle FIRMA_1_* gehören zu derselben Firma)
//   [[FIRMA_1_PERSON_1]]       eine Person dieser Firma (z.B. Mitarbeiter:in)
//   [[FIRMA_2_1]]              Name der 2. Firma (z.B. ein Firmenkunde)
//   [[MANDANT_PERSON_1]]       eine Person direkt am Mandanten (z.B. Privatkunde)
//
// Die Firmen-Nummer ist **deterministisch nach Daten-Reihenfolge** (eigene Firma zuerst),
// damit der Scope einer Person stabil zur richtigen Firma passt — unabhängig davon, in
// welcher Reihenfolge die Namen im Belegtext auftauchen. Die laufende Nummer am Token-Ende
// vergibt `tokenize()` nach erstem Auftreten (wie bei den flachen Ankern).
//
// ENTWURFS-PRINZIPIEN (verbindlich):
//  - „Anker = exakter Identifikator" bleibt gültig: KEINE Heuristik, nur bekannte Stammdaten.
//  - Reine, deterministische, build-freie Logik (kein Netz, keine Krypto) → node-testbar.
//  - Reuse statt Neubau: die Anker fließen unverändert in `pseudonym.tokenize()`; nur die
//    `typ`-Strings tragen die Hierarchie (tokenize/reidentify/maskierungsBericht bleiben gleich).
//  - Datenschutz-Richtung „im Zweifel maskieren"; Übertragung bleibt opt-in/bestätigungspflichtig.

import { ANKER_TYP, tokenize } from './pseudonym.js';

// Die drei Ebenen des Briefkastens.
export const EBENE = Object.freeze({ MANDANT: 'MANDANT', FIRMA: 'FIRMA', PERSON: 'PERSON' });

// Sehr kurze Werte (Initialen, „AG") richten mehr Lärm als Schutz an → verwerfen.
const MIN_LEN = 3;

function gueltig(wert) {
  return String(wert == null ? '' : wert).trim().length >= MIN_LEN;
}

// Hängt — wenn der Wert lang genug ist — einen scope-präfixierten Anker an einen Knoten.
// `unterTyp` leer → der Scope selbst ist der Typ (für den Namen des Knotens).
function pushAnker(knoten, wert, scope, unterTyp) {
  const w = String(wert == null ? '' : wert).trim();
  if (w.length < MIN_LEN) return;
  knoten.anker.push({ wert: w, typ: unterTyp ? `${scope}_${unterTyp}` : scope });
}

// Baut einen Firmen-Knoten mit Scope `FIRMA_<nr>` und hängt seine Identifikatoren an.
function firmaKnoten(nr, { name, email, iban, ustId, steuernummer, adresse } = {}, eigen = false) {
  const scope = `${EBENE.FIRMA}_${nr}`;
  const knoten = { ebene: EBENE.FIRMA, nr, scope, eigen, name: String(name || '').trim(), anker: [], personen: [] };
  pushAnker(knoten, name, scope, '');
  pushAnker(knoten, email, scope, 'EMAIL');
  pushAnker(knoten, iban, scope, 'IBAN');
  pushAnker(knoten, ustId, scope, 'USTID');
  pushAnker(knoten, steuernummer, scope, 'STEUERNR');
  pushAnker(knoten, adresse, scope, 'ADRESSE');
  return knoten;
}

// Baut einen Personen-Knoten unterhalb von `parent` (Firma oder Mandant). Die Person erhält
// einen eigenen Unter-Scope `<parentScope>_PERSON`, ihre Attribute hängen darunter
// (`…_PERSON_EMAIL`), sodass sie eindeutig der übergeordneten Firma/dem Mandanten zugeordnet
// bleiben, ohne mit den Firmen-eigenen Identifikatoren zu kollidieren.
function personKnoten(parentScope, { name, email, ustId, adresse } = {}) {
  const scope = `${parentScope}_${EBENE.PERSON}`;
  const knoten = { ebene: EBENE.PERSON, scope, name: String(name || '').trim(), anker: [] };
  pushAnker(knoten, name, scope, '');
  pushAnker(knoten, email, scope, 'EMAIL');
  pushAnker(knoten, ustId, scope, 'USTID');
  pushAnker(knoten, adresse, scope, 'ADRESSE');
  return knoten;
}

/**
 * Ordnet die Stammdaten in den dreistufigen Briefkasten ein (rein, testbar).
 *
 * Einordnung:
 *  - **Mandant** = Tenant/Tresor (1 Tresor = 1 Mandant); sein Name wird — falls aussagekräftig
 *    — als Anker geführt.
 *  - **eigene Firma** (aus dem Firmenprofil) = `FIRMA_1` (`eigen: true`); **Mitarbeiter** sind
 *    deren Personen. Gibt es kein Firmenprofil, hängen Mitarbeiter direkt am Mandanten.
 *  - **Kunden** mit `istVerbraucher !== true` werden als weitere **Firmen** geführt (mit ihren
 *    E-Mail/USt-IdNr./Adresse-Ankern); **Privatkunden** (`istVerbraucher === true`) als
 *    **Personen** direkt am Mandanten.
 *
 * @param {{mandant?:object, firma?:object, kunden?:Array, mitarbeiter?:Array}} quellen
 * @returns {{ebene:string,id:string,name:string,anker:Array,firmen:Array,personen:Array}}
 */
export function baueBriefkasten({ mandant = {}, firma = {}, kunden = [], mitarbeiter = [] } = {}) {
  const wurzel = {
    ebene: EBENE.MANDANT,
    id: mandant.id || 'standard',
    name: String(mandant.name || '').trim(),
    anker: [],
    firmen: [],
    personen: [],
  };
  if (gueltig(mandant.name)) wurzel.anker.push({ wert: wurzel.name, typ: EBENE.MANDANT });

  let firmaNr = 0;
  // Eigene Firma zuerst (FIRMA_1), wenn ein Firmenprofil mit verwertbaren Feldern existiert.
  let eigeneFirma = null;
  if (gueltig(firma.name) || gueltig(firma.iban) || gueltig(firma.ustId) || gueltig(firma.steuernummer)) {
    firmaNr += 1;
    eigeneFirma = firmaKnoten(firmaNr, {
      name: firma.name, email: firma.email, iban: firma.iban,
      ustId: firma.ustId, steuernummer: firma.steuernummer, adresse: firma.anschrift,
    }, true);
    wurzel.firmen.push(eigeneFirma);
  }

  // Mitarbeiter → Personen der eigenen Firma (sonst direkt am Mandanten).
  const maParent = eigeneFirma || wurzel;
  const maScope = eigeneFirma ? eigeneFirma.scope : EBENE.MANDANT;
  for (const m of mitarbeiter || []) {
    if (!m || !gueltig(m.name)) continue;
    maParent.personen.push(personKnoten(maScope, { name: m.name }));
  }

  // Kunden: Organisation → eigene Firma; Privatkunde → Person am Mandanten.
  for (const k of kunden || []) {
    if (!k) continue;
    if (k.istVerbraucher === true) {
      if (!gueltig(k.name) && !gueltig(k.email) && !gueltig(k.ustId) && !gueltig(k.adresse)) continue;
      wurzel.personen.push(personKnoten(EBENE.MANDANT, { name: k.name, email: k.email, ustId: k.ustId, adresse: k.adresse }));
    } else {
      if (!gueltig(k.name) && !gueltig(k.email) && !gueltig(k.ustId) && !gueltig(k.adresse)) continue;
      firmaNr += 1;
      wurzel.firmen.push(firmaKnoten(firmaNr, { name: k.name, email: k.email, ustId: k.ustId, adresse: k.adresse }));
    }
  }

  return wurzel;
}

/**
 * Plättet den Briefkasten in eine entdoppelte, geordnete Anker-Liste für `tokenize()`.
 * Reihenfolge: Mandant-Anker → je Firma (Firmen-Anker, dann deren Personen) → Mandant-Personen.
 * Bei gleichem Wert gewinnt das erste (spezifischste/zuerst eingeordnete) Vorkommen.
 * @param {ReturnType<typeof baueBriefkasten>} bk
 * @returns {{wert:string, typ:string}[]}
 */
export function briefkastenAnker(bk) {
  if (!bk) return [];
  const gesehen = new Set();
  const out = [];
  const nimm = (anker) => {
    for (const a of anker || []) {
      if (gesehen.has(a.wert)) continue;
      gesehen.add(a.wert);
      out.push({ wert: a.wert, typ: a.typ });
    }
  };
  nimm(bk.anker);
  for (const f of bk.firmen || []) {
    nimm(f.anker);
    for (const p of f.personen || []) nimm(p.anker);
  }
  for (const p of bk.personen || []) nimm(p.anker);
  return out;
}

/**
 * Transparenz-Übersicht des Briefkastens — nur Zähler, KEINE Klartextwerte, damit die
 * Übersicht selbst gefahrlos angezeigt/protokolliert werden kann.
 * @param {ReturnType<typeof baueBriefkasten>} bk
 * @returns {{mandanten:number, firmen:number, personen:number, anker:number}}
 */
export function briefkastenBericht(bk) {
  if (!bk) return { mandanten: 0, firmen: 0, personen: 0, anker: 0 };
  let personen = (bk.personen || []).length;
  for (const f of bk.firmen || []) personen += (f.personen || []).length;
  return {
    mandanten: 1,
    firmen: (bk.firmen || []).length,
    personen,
    anker: briefkastenAnker(bk).length,
  };
}

/**
 * Bequemlichkeit: baut die hierarchischen Anker und pseudonymisiert den Text in einem Schritt.
 * Reicht `options` (z.B. `wortgrenze`, `registry`) an `tokenize()` durch.
 * @param {string} text
 * @param {ReturnType<typeof baueBriefkasten>} bk
 * @param {object} [options]
 * @returns {{text:string, map:{token:string,wert:string,typ:string}[]}}
 */
export function tokenizeBriefkasten(text, bk, options = {}) {
  return tokenize(text, briefkastenAnker(bk), options);
}

// Re-Export, damit Aufrufer das Typ-Vokabular bei Bedarf von einer Stelle beziehen können.
export { ANKER_TYP };

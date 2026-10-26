// src/domain/angebote.js
// BAUPLAN Block 2 / Schritt 7 — Angebote-Kern in BLP (REIN, node-getestet).
// Grundlage: docs/KALKULATION_KATALOG.md §3 (Baukasten/Positionen) + §4 (Nummernkreise/
// Angebot→Rechnung) + §5 (USPs/Archiv).
//
// PRIME DIRECTIVE (Katalog §0 „intern vs. extern STRIKT trennen"):
//   - KALKULATION = rein intern. Verschnitt, Maschinensatz, interner Stundenkostensatz,
//     Marge, Gemeinkosten … verlassen das Haus NIE.
//   - ANGEBOTSDOKUMENT = neutral nach außen. Nur Positionen + Preise + USt.
//   - Das Datenmodell speichert BEIDE Schichten; gedruckt/exportiert wird NUR die externe.
// Diese Schicht setzt das durch: jede Position trägt die externen Felder (beschreibung/
// menge/einzelpreisCent/ustSatz) UND optional eine INTERNE `kalkulation`. `externesAngebot`/
// `externePosition` bauen das Außendokument per WHITELIST — selbst neu hinzugefügte interne
// Felder können so nie nach außen lecken.
//
// CENT-GENAU: Preise als ganzzahlige Cent (wie domain/money.js). Die Positions-Aggregation
// nutzt denselben Kern wie Aufträge/Rechnungen (orders.auftragSummen) → keine zweite
// Rundungslogik. Die interne Kalkulation kommt aus dem Kalkulations-Kern
// (domain/kalkulation.js) bzw. den Produkt-Schemata (domain/produktschemata.js).
//
// NICHT GoBD-relevant: der Angebotsnummernkreis (`AN-JJJJ-NNNN`) ist FREI — ein Angebot ist
// keine Buchung. Der strikte §14-Rechnungskreis bleibt davon getrennt (domain/rechnung.js;
// Hoheit über domain/rechnungsstelle.js). Angebot→Rechnung ist Schritt 8 (eigener PR): das
// angenommene Angebot referenziert die §14-Nummer, benutzt seine eigene Nummer NICHT wieder.
//
// EHRLICHE GRENZE: reine Logik, KEIN UI in diesem Schritt (eigener Folgeschritt). Persistenz
// (verschlüsselt, crm-store) und der adaptive Baukasten (Katalog §3) kommen später.

import { auftragSummen, positionNetto } from './orders.js';
import { schemaNach, kalkuliereSchema, kalkuliereSchemaKalibriert } from './produktschemata.js';

/** Endliche Zahl oder 0 (schützt vor NaN/undefined/null). */
function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

// ── Status (Katalog §5: Angebots-Lebenslauf + Archiv) ────────────────────────

/** Lebenslauf eines Angebots. */
export const ANGEBOT_STATUS = Object.freeze({
  ENTWURF: 'entwurf',         // in Arbeit, noch nicht verschickt
  OFFEN: 'offen',             // verschickt, wartet auf Antwort des Kunden
  ANGENOMMEN: 'angenommen',   // Kunde hat zugesagt → Grundlage für „Rechnung aus Angebot" (Schritt 8)
  ABGELEHNT: 'abgelehnt',     // Kunde hat abgesagt
  ARCHIVIERT: 'archiviert',   // aus dem aktiven Blick genommen (Archiv für Vergleich/Statistik)
});

export const ANGEBOT_STATUS_LISTE = [
  ANGEBOT_STATUS.ENTWURF, ANGEBOT_STATUS.OFFEN, ANGEBOT_STATUS.ANGENOMMEN,
  ANGEBOT_STATUS.ABGELEHNT, ANGEBOT_STATUS.ARCHIVIERT,
];

export const ANGEBOT_STATUS_DEFAULT = ANGEBOT_STATUS.ENTWURF;

export function istAngebotStatus(wert) {
  return ANGEBOT_STATUS_LISTE.includes(wert);
}

/**
 * Erlaubte Status-Übergänge (Workflow). Frei wählbar (Angebote sind NICHT GoBD-gebunden),
 * aber bewusst eng gehalten, damit der Lebenslauf nachvollziehbar bleibt:
 *   entwurf    → offen | archiviert
 *   offen      → angenommen | abgelehnt | archiviert
 *   angenommen → archiviert            (nach „Rechnung aus Angebot", Schritt 8)
 *   abgelehnt  → offen | archiviert    (Kunde überlegt es sich anders → reaktivierbar)
 *   archiviert → (terminal)
 */
export const ANGEBOT_STATUS_FLOW = Object.freeze({
  entwurf: ['offen', 'archiviert'],
  offen: ['angenommen', 'abgelehnt', 'archiviert'],
  angenommen: ['archiviert'],
  abgelehnt: ['offen', 'archiviert'],
  archiviert: [],
});

/** Darf von `von` nach `nach` gewechselt werden? */
export function darfAngebotWechseln(von, nach) {
  return (ANGEBOT_STATUS_FLOW[von] || []).includes(nach);
}

/**
 * Setzt den Status (rein, GoBD-neutral): liefert ein NEUES Angebot mit geändertem Status,
 * wenn der Übergang erlaubt ist — sonst `{ ok:false, fehler }` mit unverändertem Angebot.
 * @returns {{ok:boolean, angebot:object, fehler?:string}}
 */
export function setzeAngebotStatus(angebot, nach) {
  const von = angebot && angebot.status;
  if (!darfAngebotWechseln(von, nach)) {
    return { ok: false, angebot, fehler: `Übergang ${von} → ${nach} nicht erlaubt.` };
  }
  return { ok: true, angebot: { ...angebot, status: nach } };
}

/** Bequemer Helfer: ins Archiv legen (aus jedem nicht-archivierten Status erlaubt). */
export function archiviereAngebot(angebot) {
  return setzeAngebotStatus(angebot, ANGEBOT_STATUS.ARCHIVIERT);
}

export function istArchiviert(angebot) {
  return !!angebot && angebot.status === ANGEBOT_STATUS.ARCHIVIERT;
}
/** Aktiv = alles außer archiviert (für die „aktive" Angebotsliste). */
export function istAktivesAngebot(angebot) {
  return !!angebot && istAngebotStatus(angebot.status) && angebot.status !== ANGEBOT_STATUS.ARCHIVIERT;
}

export function aktiveAngebote(liste) {
  return (liste || []).filter(istAktivesAngebot);
}
export function archivierteAngebote(liste) {
  return (liste || []).filter(istArchiviert);
}
export function angeboteNachStatus(liste, status) {
  return (liste || []).filter((a) => a && a.status === status);
}

// ── Angebotsnummernkreis (Katalog §4 — FREI, nicht GoBD-relevant) ────────────

/** Präfix des Angebotskreises. Klar abgesetzt vom §14-Rechnungskreis (`JJJJ-NNNN`). */
export const ANGEBOT_PREFIX = 'AN';

/** Angebotsnummer aus laufender Zahl + Jahr (z. B. AN-2026-0007). */
export function formatAngebotsnummer(seq, jahr) {
  return `${ANGEBOT_PREFIX}-${jahr}-${String(seq).padStart(4, '0')}`;
}

/** Zerlegt eine Angebotsnummer in { jahr, seq } — oder null, wenn keine gültige. */
export function parseAngebotsnummer(nummer) {
  const m = /^AN-(\d{4})-(\d{3,})$/.exec(String(nummer || ''));
  return m ? { jahr: Number(m[1]), seq: Number(m[2]) } : null;
}

/** Ist `nummer` eine gültige Angebotsnummer (AN-JJJJ-NNNN)? */
export function istAngebotsnummer(nummer) {
  return parseAngebotsnummer(nummer) !== null;
}

/**
 * Nächste laufende Nummer im Angebotskreis für ein Jahr — pro Jahr fortlaufend (1-basiert).
 * `bestehende` darf eine Liste von Angeboten ODER von Nummernstrings sein. Nicht-`jahr`-
 * Nummern werden ignoriert; ungültige/leere ebenso. Frei (kein Lückenlosigkeits-Zwang).
 */
export function naechsteAngebotsSeq(bestehende, jahr) {
  let max = 0;
  for (const item of bestehende || []) {
    const nummer = typeof item === 'string' ? item : (item && item.nummer);
    const p = parseAngebotsnummer(nummer);
    if (p && p.jahr === Number(jahr)) max = Math.max(max, p.seq);
  }
  return max + 1;
}

/**
 * Vergibt einem Angebot die nächste freie Angebotsnummer für `jahr`. Liefert ein NEUES
 * Angebot mit gesetzter `nummer` (überschreibt eine ggf. vorhandene nicht — bereits
 * nummerierte bleiben unverändert). Rein.
 */
export function vergebeAngebotsnummer(angebot, bestehende, jahr) {
  if (angebot && istAngebotsnummer(angebot.nummer)) return angebot;
  const seq = naechsteAngebotsSeq(bestehende, jahr);
  return { ...angebot, nummer: formatAngebotsnummer(seq, jahr) };
}

// ── Positionen (externe Schicht + optionale interne Kalkulationsschicht) ──────

/** Externe (neutrale) Felder einer Position — WHITELIST fürs Außendokument. */
export const POSITION_EXTERNE_FELDER = ['beschreibung', 'menge', 'einzelpreisCent', 'ustSatz'];

/**
 * Normalisiert eine Position: externe Felder als saubere Zahlen/Strings; die interne
 * `kalkulation` (falls vorhanden) wird UNVERÄNDERT durchgereicht (bleibt im Haus).
 */
export function normalizeAngebotsposition(pos = {}) {
  const out = {
    beschreibung: String(pos.beschreibung || ''),
    menge: num(pos.menge),
    einzelpreisCent: Math.round(num(pos.einzelpreisCent)),
    ustSatz: num(pos.ustSatz),
  };
  if (pos.kalkulation != null) out.kalkulation = pos.kalkulation; // INTERN, unangetastet
  return out;
}

/**
 * Baut eine Angebotsposition aus einem Produkt-Schema (domain/produktschemata.js): die
 * interne Kalkulation (Werte/Zuschläge/Kalibrierung + Kern-Ergebnis) wird als `kalkulation`
 * gespeichert, NACH AUSSEN dringt aber NUR der neutrale Netto-Einzelpreis. Prime Directive
 * in einer Funktion: Marge/Maschinensatz/Verschnitt bleiben in `kalkulation`, der Kunde
 * sieht ausschließlich `einzelpreisCent`.
 *
 * @param {string|object} schemaOderId Schema-Objekt ODER Schema-ID
 * @param {{werte?:object, zuschlaege?:object, kalibrierung?:object, faktoren?:object,
 *          beschreibung?:string, menge?:number}} [opts]
 *   `zuschlaege.ustProzent` steuert sowohl die interne Kalkulation als auch den externen
 *   `ustSatz` der Position (eine Quelle der Wahrheit). `faktoren` (block → Multiplikator,
 *   aus der Historie via domain/kalibrierung.js `faktorWerte`): wenn gesetzt, wird die
 *   interne Kalkulation KALIBRIERT (kalkuliereSchemaKalibriert) — die gelernte Erfahrung
 *   fließt in den internen Stückpreis zurück; rein intern, das Außendokument bleibt neutral.
 * @returns {object} Angebotsposition mit interner `kalkulation`
 */
export function positionAusSchema(schemaOderId, opts = {}) {
  const schema = typeof schemaOderId === 'string' ? schemaNach(schemaOderId) : schemaOderId;
  const werte = opts.werte || {};
  const zuschlaege = opts.zuschlaege || {};
  const kalibrierung = opts.kalibrierung || {};
  const faktoren = opts.faktoren || null;     // gesetzt → kalibrierte Vorwärtskalkulation
  const ergebnis = faktoren
    ? kalkuliereSchemaKalibriert(schema, werte, zuschlaege, kalibrierung, faktoren)
    : kalkuliereSchema(schema, werte, zuschlaege, kalibrierung);
  return {
    beschreibung: opts.beschreibung || (schema ? schema.label : ''),
    menge: opts.menge != null ? num(opts.menge) : 1,
    einzelpreisCent: ergebnis.netto,        // NEUTRAL: nur der Netto-Stückpreis verlässt das Haus
    ustSatz: num(zuschlaege.ustProzent),    // konsistent mit der internen Kalkulation
    kalkulation: {                           // INTERN — bleibt im Haus (Prime Directive)
      schemaId: schema ? schema.id : null,
      werte, zuschlaege, kalibrierung,
      // Kalibrierung mitschreiben (nur wenn angewandt) → die UI kann die Position markieren,
      // und die interne Auswertung bleibt nachvollziehbar.
      ...(faktoren ? { faktoren, kalibriert: true } : {}),
      ergebnis,
    },
  };
}

// ── Positions-Aggregation (cent-genau, ein gemeinsamer Kern) ─────────────────

/**
 * Summen eines Angebots, gruppiert nach USt-Satz — nutzt denselben Kern wie Aufträge/
 * Rechnungen (orders.auftragSummen). @returns {{netto, ust, brutto, perSatz}}.
 */
export function angebotSummen(positionen) {
  return auftragSummen(positionen);
}

// ── Außendokument (Prime Directive: NUR externe Schicht) ─────────────────────

/** Reduziert eine Position auf ihre externen Felder (Whitelist) + den Zeilen-Netto. */
export function externePosition(pos = {}) {
  return {
    beschreibung: String(pos.beschreibung || ''),
    menge: num(pos.menge),
    einzelpreisCent: Math.round(num(pos.einzelpreisCent)),
    ustSatz: num(pos.ustSatz),
    netto: positionNetto(pos),
  };
}

/**
 * Baut das NEUTRALE Angebotsdokument (für Anzeige/Druck/Export). Enthält ausschließlich
 * externe Felder — KEINE Kalkulationsschicht, keine internen Notizen. Per Whitelist
 * aufgebaut, damit nichts Internes lecken kann (Prime Directive, DSGVO/GoBD-sauber).
 * @returns {{nummer, titel, datum, gueltigBis, status, kundeId, positionen, steuerzeilen,
 *   netto, ust, brutto}}
 */
export function externesAngebot(angebot = {}) {
  const positionen = (angebot.positionen || []).map(externePosition);
  const summen = angebotSummen(angebot.positionen);
  const steuerzeilen = Object.keys(summen.perSatz)
    .map(Number).sort((a, b) => b - a)
    .filter((s) => summen.perSatz[s].netto > 0)
    .map((s) => ({ satz: s, netto: summen.perSatz[s].netto, ust: summen.perSatz[s].ust }));
  return {
    nummer: angebot.nummer || '',
    titel: angebot.titel || '',
    datum: angebot.datum || '',
    gueltigBis: angebot.gueltigBis || '',
    status: angebot.status || '',
    kundeId: angebot.kundeId ?? null,
    positionen,
    steuerzeilen,
    netto: summen.netto,
    ust: summen.ust,
    brutto: summen.brutto,
  };
}

// ── Interne Auswertung (bleibt im Haus — Live-Deckungsbeitrag, Katalog §5.2) ──

/**
 * Aggregiert die INTERNE Kalkulationsschicht über alle Positionen (Selbstkosten, Netto,
 * Deckungsbeitrag) — Grundlage für den Live-Deckungsbeitrag/das Zeitbudget beim Erstellen.
 * Rein intern; gehört NIE ins Außendokument. Positionen ohne `kalkulation` zählen mit 0.
 * Pro Position wird das (stückbezogene) Kern-Ergebnis × Menge gerechnet.
 * @returns {{selbstkosten:number, netto:number, deckungsbeitrag:number}} in ganzen Cent
 */
export function interneAuswertung(angebot = {}) {
  let selbstkosten = 0, netto = 0, deckungsbeitrag = 0;
  for (const p of angebot.positionen || []) {
    const e = p && p.kalkulation && p.kalkulation.ergebnis;
    if (!e) continue;
    const menge = num(p.menge);
    selbstkosten += num(e.selbstkosten) * menge;
    netto += num(e.netto) * menge;
    deckungsbeitrag += num(e.deckungsbeitrag) * menge;
  }
  return { selbstkosten, netto, deckungsbeitrag };
}

// ── Factory + Validierung ────────────────────────────────────────────────────

/**
 * Baut ein neues Angebot (Status `entwurf`). Positionen werden normalisiert; eine
 * vorhandene interne `kalkulation` bleibt erhalten. Nummer bleibt leer, bis sie vergeben
 * wird (vergebeAngebotsnummer) — ein Entwurf braucht noch keine.
 */
export function neuesAngebot({
  titel = '', kundeId = null, kostenstelle = null, datum = '', gueltigBis = '',
  positionen = [], nummer = '',
} = {}) {
  return {
    type: 'angebot',
    nummer: nummer || '',
    status: ANGEBOT_STATUS.ENTWURF,
    titel: String(titel || ''),
    kundeId: kundeId ?? null,
    kostenstelle: kostenstelle ?? null,
    datum: datum || '',
    gueltigBis: gueltigBis || '',
    positionen: (positionen || []).map(normalizeAngebotsposition),
  };
}

/**
 * Prüft ein Angebot (nicht-blockierend gedacht — die UI zeigt Lücken als Hinweis).
 * Nummer wird nur geprüft, WENN vorhanden (ein Entwurf darf ohne Nummer existieren).
 * @returns {string[]} fehlende/ungültige Angaben
 */
export function validateAngebot(a) {
  if (!a || typeof a !== 'object') return ['Kein Angebot.'];
  const errors = [];
  if (!String(a.titel || '').trim()) errors.push('Titel fehlt.');
  if (!istAngebotStatus(a.status)) errors.push('Status ungültig.');
  if (a.nummer && !istAngebotsnummer(a.nummer)) errors.push('Angebotsnummer ungültig.');
  if (!a.positionen || !a.positionen.length) errors.push('Mindestens eine Position nötig.');
  for (const p of a.positionen || []) {
    if (!Number.isFinite(Number(p.menge)) || Number(p.menge) <= 0) errors.push('Menge muss positiv sein.');
    if (!Number.isInteger(p.einzelpreisCent) || p.einzelpreisCent < 0) errors.push('Einzelpreis ungültig.');
  }
  return errors;
}

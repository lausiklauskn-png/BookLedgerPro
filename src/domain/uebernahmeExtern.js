// src/domain/uebernahmeExtern.js
// Übergabe von außen (WorkFloh → BLP): Datenvertrag v1, Spec in
// docs/UEBERNAHME_TOMY.md. REINE Logik, node-getestet.
//
// WAS DAS IST: Der WorkFloh-Werkzeugverbund (gleicher GitHub-Pages-Origin) übergibt einen
// fertig bearbeiteten Werkstatt-Auftrag per URL-Parameter `?uebernahme=<base64url(JSON)>`
// an BLP. Absender sind Tomys WorkFloh (`tomy-workfloh`) UND Mein-WorkFloh (`isd-workfloh`,
// ISD⁺) — beide senden denselben v1-Vertrag; nur die `quelle` unterscheidet sich.
// Diese Schicht parst und HÄRTET die Daten (Whitelist-Quelle, Versions-Check,
// Längen-/Wertegrenzen) und hält sie im RAM bereit. Die UI (Angebote-View) befüllt damit
// NUR das Formular vor — nichts wird automatisch gespeichert, keine Nummer vergeben,
// GoBD-Pfade (Festschreiben, Nummernkreise) bleiben unberührt. Der Mensch prüft, legt an,
// nimmt an; die bestehende Angebot→Rechnungs-Entwurf-Strecke übernimmt den Rest.
//
// SICHERHEIT: Eingaben sind fremd (URL). Alles wird als Klartext behandelt und gekappt;
// es wird nie HTML daraus gebaut (Views rendern über el()/textContent). Unbekannte
// Quellen/Versionen → null (fail-soft, App startet normal).

// Quellen-Whitelist: WorkFloh-Sender (Angebots-Übernahme) + Shop-Warenwirtschaft
// (`alm-warehouse` = Alis-Moderaum; `sbkim-shop` = generischer Shop-Absender, damit ein
// künftiger zweiter Shop – z.B. Perfect-Skin-Beauty-Pflege – denselben Vertrag nutzt).
// `workflow-calculate` = der Angebotsplaner Workflow Calculate (2026-10-12): schickt dieselbe
// v1-Angebots-Nutzlast wie die WorkFlohs, nur aus der Kundenblatt-Whitelist (keine EK, keine Sätze).
import { parseVerweise } from './vorgang.js';

export const UEBERNAHME_QUELLEN = Object.freeze(['tomy-workfloh', 'isd-workfloh', 'alm-warehouse', 'sbkim-shop', 'workflow-calculate', 'workflow-needs']);
export const UEBERNAHME_MODI = Object.freeze(['angebot', 'rechnung']);
// Übergabe-Arten: 'angebot' = WorkFloh-Auftrag → Angebots-Formular; 'buchhaltung-summen'
// = Shop-Zeitraum-Summen (Umsatz/Wareneinkauf) → Buchungs-Entwürfe. Default 'angebot'
// (Rückwärtskompatibilität: bestehende WorkFloh-Payloads tragen kein `art`-Feld).
export const UEBERNAHME_ARTEN = Object.freeze(['angebot', 'buchhaltung-summen']);
export const UEBERNAHME_UST_SAETZE = Object.freeze([0, 7, 19]);
export const UEBERNAHME_MAX_POSITIONEN = 20;
// Betrags-Deckel für Perioden-Summen (Cent). 100 Mrd. Cent = 1 Mrd. € — großzügig über
// jedem realen Shop-Monat, aber endlich (fail-soft gegen Müll-Riesenwerte).
export const UEBERNAHME_MAX_SUMME_CENT = 100000000000;

const S = (v, max) => String(v ?? '').slice(0, max).trim();
const num = (v, min, max, dflt) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
const istIsoDatum = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** base64url → UTF-8-String (fail-soft: wirft bei Müll, Aufrufer fängt). */
function b64uDecode(raw) {
  const b64 = String(raw).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Liest den `uebernahme`-Parameter aus einem Query-String (location.search).
 * @returns {null|{quelle:string,modus:string,titel:string,kundeName:string,auftragNr:string,
 *   angebotsNr:string,positionen:Array<{beschreibung:string,menge:number,
 *   einzelpreisCent:number,ustSatz:number}>}}
 *
 * `modus` ('angebot'|'rechnung', Default 'angebot') sagt nur, WOFÜR der Absender die
 * Übergabe gedacht hat. Beide Modi befüllen denselben Angebots-Entwurf vor — eine Rechnung
 * wird NIE automatisch erzeugt (Rechnungsnummer + GoBD-Festschreibung entstehen erst durch
 * die bewusste, manuelle Angebot→Rechnung-Strecke). `modus` steuert nur den Hinweis-Text.
 */
export function parseUebernahmeParam(search) {
  try {
    const p = new URLSearchParams(search || '');
    const raw = p.get('uebernahme');
    if (!raw || raw.length > 20000) return null;
    const d = JSON.parse(b64uDecode(raw));
    if (!d || (d.v !== 1 && d.v !== 2) || !UEBERNAHME_QUELLEN.includes(d.quelle)) return null;
    // Neue Art: Shop-Zeitraum-Summen → eigener, klein gehaltener Vertrag.
    if (d.art === 'buchhaltung-summen') return parseBuchhaltungSummen(d);
    const positionen = (Array.isArray(d.positionen) ? d.positionen : [])
      .slice(0, UEBERNAHME_MAX_POSITIONEN)
      .map((x) => ({
        beschreibung: S(x && x.beschreibung, 140) || 'Position',
        menge: num(x && x.menge, 0, 100000, 1),
        einzelpreisCent: Math.round(num(x && x.einzelpreisCent, 0, 100000000, 0)),
        ustSatz: [0, 7, 19].includes(Number(x && x.ustSatz)) ? Number(x.ustSatz) : 19,
      }));
    return {
      art: 'angebot',
      quelle: d.quelle,
      modus: UEBERNAHME_MODI.includes(d.modus) ? d.modus : 'angebot',
      titel: S(d.titel, 140),
      kundeName: S(d.kundeName, 80),
      auftragNr: S(d.auftragNr, 32),
      angebotsNr: S(d.angebotsNr, 32),
      positionen,
      // R2 (Vertrag v2 „Vorgang", docs/UEBERNAHME_TOMY.md): Rückverweis auf das BLP-Angebot, aus dem der
      // WorkFloh-Auftrag entstand — BLP hängt die Rechnung dann an DASSELBE Angebot statt ein neues anzulegen.
      verweise: parseVerweise(d.verweise),
    };
  } catch {
    return null;
  }
}

/**
 * Parst/härtet die Shop-Buchhaltungs-Summen (art:"buchhaltung-summen"). Fremde Eingabe →
 * alle Werte gekappt/gewhitelistet. Beträge sind Perioden-Summen in Cent (Integer).
 * @returns {{art:'buchhaltung-summen',quelle:string,shop:string,
 *   periode:{von:string,bis:string},umsatzBruttoCent:number,wareneinkaufCent:number,
 *   ustSatz:number,geschaetzt:boolean,hinweis:string}}
 */
function parseBuchhaltungSummen(d) {
  const von = S(d.periode && d.periode.von, 10);
  const bis = S(d.periode && d.periode.bis, 10);
  return {
    art: 'buchhaltung-summen',
    quelle: d.quelle,
    shop: S(d.shop, 60) || 'Shop',
    periode: { von: istIsoDatum(von) ? von : '', bis: istIsoDatum(bis) ? bis : '' },
    umsatzBruttoCent: Math.round(num(d.umsatzBruttoCent, 0, UEBERNAHME_MAX_SUMME_CENT, 0)),
    wareneinkaufCent: Math.round(num(d.wareneinkaufCent, 0, UEBERNAHME_MAX_SUMME_CENT, 0)),
    ustSatz: UEBERNAHME_UST_SAETZE.includes(Number(d.ustSatz)) ? Number(d.ustSatz) : 19,
    geschaetzt: !!d.geschaetzt,
    hinweis: S(d.hinweis, 200),
  };
}

// RAM-Ablage mit Verbrauchs-Semantik: der Boot fängt die Übergabe EINMAL ein
// (URL wird sofort gesäubert), der Angebote-View holt sie EINMAL ab.
let _pending = null;
export function merkeUebernahme(u) { _pending = u || null; }
export function consumeUebernahme() { const u = _pending; _pending = null; return u; }
export function peekUebernahme() { return _pending; }

/* Der stille Fehlschlag — und warum es diesen zweiten Merker gibt.
 *
 * `parseUebernahmeParam` antwortet bei allem Unbekannten mit `null`. Das ist
 * richtig so (fail-soft, die App startet normal), hatte aber eine Kehrseite:
 * kam eine Übergabe mit unbekanntem Absender an, öffnete BLP ganz normal und
 * LEER — ohne ein Wort. Genau so blieb der Absender-Name von Mein-WorkFloh
 * (`workfloh` statt `isd-workfloh`) monatelang unbemerkt; niemand konnte sehen,
 * dass überhaupt etwas angekommen war.
 *
 * Deshalb merkt sich der Aufrufer jetzt zusätzlich, DASS eine Übergabe da war
 * und nicht verstanden wurde. Der Inhalt wird bewusst NICHT aufgehoben — er ist
 * fremde Eingabe aus der Adresse, und wir zeigen nie, was drinstand. */
let _pendingFehler = false;
export function merkeUebernahmeFehler() { _pendingFehler = true; }
export function consumeUebernahmeFehler() { const f = _pendingFehler; _pendingFehler = false; return f; }

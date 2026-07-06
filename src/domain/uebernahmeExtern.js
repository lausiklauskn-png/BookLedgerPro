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

export const UEBERNAHME_QUELLEN = Object.freeze(['tomy-workfloh', 'isd-workfloh']);
export const UEBERNAHME_MODI = Object.freeze(['angebot', 'rechnung']);
export const UEBERNAHME_MAX_POSITIONEN = 20;

const S = (v, max) => String(v ?? '').slice(0, max).trim();
const num = (v, min, max, dflt) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};

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
    if (!d || d.v !== 1 || !UEBERNAHME_QUELLEN.includes(d.quelle)) return null;
    const positionen = (Array.isArray(d.positionen) ? d.positionen : [])
      .slice(0, UEBERNAHME_MAX_POSITIONEN)
      .map((x) => ({
        beschreibung: S(x && x.beschreibung, 140) || 'Position',
        menge: num(x && x.menge, 0, 100000, 1),
        einzelpreisCent: Math.round(num(x && x.einzelpreisCent, 0, 100000000, 0)),
        ustSatz: [0, 7, 19].includes(Number(x && x.ustSatz)) ? Number(x.ustSatz) : 19,
      }));
    return {
      quelle: d.quelle,
      modus: UEBERNAHME_MODI.includes(d.modus) ? d.modus : 'angebot',
      titel: S(d.titel, 140),
      kundeName: S(d.kundeName, 80),
      auftragNr: S(d.auftragNr, 32),
      angebotsNr: S(d.angebotsNr, 32),
      positionen,
    };
  } catch {
    return null;
  }
}

// RAM-Ablage mit Verbrauchs-Semantik: der Boot fängt die Übergabe EINMAL ein
// (URL wird sofort gesäubert), der Angebote-View holt sie EINMAL ab.
let _pending = null;
export function merkeUebernahme(u) { _pending = u || null; }
export function consumeUebernahme() { const u = _pending; _pending = null; return u; }
export function peekUebernahme() { return _pending; }

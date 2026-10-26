// domain/vorgang.js — Datenvertrag v2 „Vorgang": BookLedgerPro ⇄ WorkFloh (Klaus 2026-10-26).
//
// R1: ein ANGENOMMENES Angebot geht als Auftrag an einen WorkFloh (`?vorgang=<base64url(JSON)>` an
//     dessen Adresse). WorkFloh legt den Auftrag ZUR PRÜFUNG an und speichert erst auf Tipp.
// R2: WorkFloh schickt beim „🧾 Rechnung in BLP" den Verweis `verweise.blpAngebotNr` zurück
//     (Vertrag v1 + `verweise`); BLP hängt die Rechnung an DASSELBE Angebot (uebernahmeExtern.js).
// R3: Stand zurück an WorkFloh (`art: 'status'`): Rechnung FESTGESCHRIEBEN (Nummer, Datum) oder BEZAHLT (Datum, Angabe von
//     Hand). WorkFloh zeigt ein Blatt und übernimmt erst auf Tipp (Notiz in der Akte, Felder, ggf. Status).
//
// Reine Rechnung, kein DOM, keine Speicherzugriffe — in Node prüfbar. Kanonischer Vertrag:
// docs/UEBERNAHME_TOMY.md (Abschnitt „v2 Vorgang"). Beide WorkFlohs parallel (Klaus' Regel 2026-07-06).

export const VORGANG_VERSION = 2;
export const VORGANG_QUELLE = 'bookledgerpro';
export const VORGANG_ARTEN = Object.freeze(['auftrag', 'status']);
export const VORGANG_MAX_POSITIONEN = 20;

/** Ziele: die zwei WorkFlohs unter demselben Ursprung (GitHub Pages). Nur diese Adressen werden geöffnet. */
export const WORKFLOH_ZIELE = Object.freeze({
  'mein-workfloh': Object.freeze({ name: 'Mein WorkFloh', url: 'https://lausiklauskn-png.github.io/Mein-WorkFloh/' }),
  'tomy-workfloh': Object.freeze({ name: 'Tomys WorkFloh', url: 'https://lausiklauskn-png.github.io/Tomys-Hub/workfloh/' }),
});
export const WORKFLOH_ZIEL_VORGABE = 'mein-workfloh';

const S = (v, max) => String(v ?? '').slice(0, max).trim();
const num = (v, min, max, dflt) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt; };

/** UTF-8-String → base64url (ohne Padding). Läuft in Browser und Node. */
export function b64uEncode(str) {
  const bytes = new TextEncoder().encode(String(str));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/** base64url → UTF-8-String; wirft bei Müll (Aufrufer fängt). */
export function b64uDecode(raw) {
  const b64 = String(raw).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Verweise härten (fremde Eingabe aus der Adresse): nur bekannte Felder, gekappt.
 * @returns {{blpAngebotNr:string, blpAngebotId:string, wfAuftragNr:string}|null}
 */
export function parseVerweise(v) {
  if (!v || typeof v !== 'object') return null;
  const out = {
    blpAngebotNr: S(v.blpAngebotNr, 32),
    blpAngebotId: S(v.blpAngebotId, 64),
    wfAuftragNr: S(v.wfAuftragNr, 32),
  };
  return (out.blpAngebotNr || out.blpAngebotId || out.wfAuftragNr) ? out : null;
}

/**
 * R1 — Nutzlast „Auftrag" aus einem Angebot (nur die externe Schicht: Positionen mit Netto-Einzelpreis
 * und USt, nie `kalkulation`). `kunde` ist der zugeordnete Stammkunde (oder null).
 */
export function vorgangAuftrag(angebot = {}, kunde = null, { datum = '' } = {}) {
  const positionen = (angebot.positionen || []).slice(0, VORGANG_MAX_POSITIONEN).map((p) => ({
    beschreibung: S(p && p.beschreibung, 140) || 'Position',
    menge: num(p && p.menge, 0, 100000, 1),
    einzelpreisCent: Math.round(num(p && p.einzelpreisCent, 0, 100000000, 0)),
    ustSatz: [0, 7, 19].includes(Number(p && p.ustSatz)) ? Number(p.ustSatz) : 19,
  }));
  return {
    v: VORGANG_VERSION,
    quelle: VORGANG_QUELLE,
    art: 'auftrag',
    verweise: { blpAngebotNr: S(angebot.nummer, 32), blpAngebotId: S(angebot.id, 64), wfAuftragNr: '' },
    titel: S(angebot.titel, 140),
    kundeName: S(kunde && kunde.name, 80),
    kunde: kunde ? { adresse: S(kunde.adresse, 200), email: S(kunde.email, 120), telefon: S(kunde.telefon, 40), ustId: S(kunde.ustId, 20) } : null,
    positionen,
    status: S(angebot.status, 20) || 'angenommen',
    datum: S(datum || angebot.datum, 10),
  };
}

/** Adresse des Ziels mit `?vorgang=<base64url(JSON)>`; unbekanntes Ziel → null. */
export function vorgangUrl(zielKey, payload) {
  const ziel = WORKFLOH_ZIELE[zielKey];
  if (!ziel || !payload) return null;
  return ziel.url + '?vorgang=' + b64uEncode(JSON.stringify(payload));
}

/** Nur die bekannten Ziele; alles andere fällt auf die Vorgabe. */
export function zielKey(wert) {
  return Object.prototype.hasOwnProperty.call(WORKFLOH_ZIELE, wert) ? wert : WORKFLOH_ZIEL_VORGABE;
}

/** R3 — die zwei Stände, die BLP an den WorkFloh-Auftrag melden kann. */
export const VORGANG_STAENDE = Object.freeze(['rechnung', 'bezahlt']);

/**
 * WorkFloh-Ziel aus den Verweisen am Angebot: das R1-Ziel zuerst, sonst die Quelle des R2-Rückwegs
 * (`isd-workfloh` → Mein WorkFloh, `tomy-workfloh` → Tomys WorkFloh), sonst die Einstellung.
 */
export function zielAusVerweisen(v, einstellung) {
  if (v && Object.prototype.hasOwnProperty.call(WORKFLOH_ZIELE, v.wfZiel)) return v.wfZiel;
  const q = v && v.wfQuelle;
  if (q === 'isd-workfloh') return 'mein-workfloh';
  if (q === 'tomy-workfloh') return 'tomy-workfloh';
  return zielKey(einstellung);
}

/**
 * R3 — Nutzlast „Stand": `stand` rechnung (festgeschrieben, mit Nummer und Datum) oder bezahlt (mit Datum).
 * Nur die Verweise und der Stand — keine Positionen, kein Kunde. Ohne WorkFloh-Auftrag am Angebot → null.
 */
export function vorgangStand(angebot = {}, { stand, rechnungNr = '', rechnungDatum = '', bezahltAm = '', datum = '' } = {}) {
  if (!VORGANG_STAENDE.includes(stand)) return null;
  const v = angebot.verweise || {};
  if (!v.wfAuftragNr) return null;
  return {
    v: VORGANG_VERSION,
    quelle: VORGANG_QUELLE,
    art: 'status',
    verweise: { blpAngebotNr: S(angebot.nummer, 32), blpAngebotId: S(angebot.id, 64), wfAuftragNr: S(v.wfAuftragNr, 32) },
    stand,
    rechnungNr: S(rechnungNr, 32),
    rechnungDatum: S(rechnungDatum, 10),
    bezahltAm: S(bezahltAm, 10),
    datum: S(datum, 10) || new Date().toISOString().slice(0, 10),
  };
}

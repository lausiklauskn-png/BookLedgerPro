// src/domain/uebernahme.js
// Intake: Übernahme aus einer Schwester-App (z. B. Mein-WorkFloh) über den
// URL-Parameter ?uebernahme=<base64url(JSON)>. Datenvertrag v1.
//
// Reine Logik (kein DOM) — der Parser ist per Node-Test abgedeckt. Die Übernahme
// füllt ausschließlich einen prüfbaren Auftrags-ENTWURF vor; die GoBD-relevante
// Festschreibung (Rechnung/Buchung) bleibt unverändert manuell (Nutzer prüft und
// bucht danach wie gewohnt). Kein Klartext verlässt das Gerät, nichts wird
// automatisch gebucht.

import { UST_SAETZE } from './taxes.js';

export const UEBERNAHME_VERTRAG = 1;

// Bekannte Absender — informativ (für die Herkunfts-Anzeige im Banner). Die
// Übernahme ist eine bewusste Nutzer-Aktion (Klick in der Schwester-App), kein
// Sicherheits-Grenzfall; entscheidend ist die strukturelle Prüfung unten.
export const BEKANNTE_QUELLEN = ['isd-workfloh'];

function b64uDecodeToString(b64u) {
  let s = String(b64u).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// USt-Satz auf einen in BookLedgerPro erlaubten Satz einrasten (0/7/19),
// sonst den Regelsatz 19 % annehmen.
function snapUst(v) {
  const n = Number(v);
  return UST_SAETZE.includes(n) ? n : 19;
}

function normPosition(p) {
  const mengeRaw = p && p.menge != null ? p.menge : 1;
  const menge = Number(String(mengeRaw).replace(',', '.'));
  const cent = Math.round(Number(p && p.einzelpreisCent) || 0);
  return {
    beschreibung: String((p && p.beschreibung) || '').slice(0, 200),
    menge: Number.isFinite(menge) && menge > 0 ? menge : 1,
    einzelpreisCent: Number.isInteger(cent) && cent >= 0 ? cent : 0,
    ustSatz: snapUst(p && p.ustSatz),
  };
}

// Bereits geparstes Roh-JSON → normalisierte Übernahme oder null (bei fehlendem
// Vertrag, falscher Version oder ohne verwertbare Positionen).
export function normalizeUebernahme(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Number(raw.v) !== UEBERNAHME_VERTRAG) return null;
  const positionenRaw = Array.isArray(raw.positionen) ? raw.positionen : [];
  const positionen = positionenRaw
    .map(normPosition)
    .filter((p) => p.beschreibung || p.einzelpreisCent > 0);
  if (!positionen.length) return null;
  const modus = raw.modus === 'rechnung' ? 'rechnung' : 'angebot';
  return {
    quelle: String(raw.quelle || '').slice(0, 60),
    modus,
    titel: String(raw.titel || '').slice(0, 200),
    kundeName: String(raw.kundeName || '').slice(0, 200),
    auftragNr: String(raw.auftragNr || '').slice(0, 60),
    angebotsNr: String(raw.angebotsNr || '').slice(0, 60),
    positionen,
  };
}

// URL-Query (z. B. location.search) → normalisierte Übernahme oder null.
// Wirft nie — defekter/fremder Input ergibt schlicht null.
export function parseUebernahmeQuery(search) {
  try {
    const q = new URLSearchParams(String(search || ''));
    const b64 = q.get('uebernahme');
    if (!b64) return null;
    const json = JSON.parse(b64uDecodeToString(b64));
    return normalizeUebernahme(json);
  } catch {
    return null;
  }
}

// ---- flüchtiger Übergabe-Puffer (RAM, genau ein Verbrauch) ------------------
// main.js legt die beim Start erkannte Übernahme hier ab; die Aufträge-Ansicht
// holt sie beim Öffnen genau einmal ab. Nichts wird persistiert.
let _pending = null;
export function setPendingUebernahme(u) { _pending = u || null; }
export function takePendingUebernahme() { const u = _pending; _pending = null; return u; }
export function hasPendingUebernahme() { return !!_pending; }

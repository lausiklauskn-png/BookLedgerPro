// src/domain/audit.js
// GoBD-Audit: kanonische Serialisierung + Hash-Kette über festgeschriebene
// Buchungen. Bewusst byte-kompatibel zur Sage-Signier-Norm (INTERFACES §11.1:
// rekursiv sortierte Objekt-Schlüssel, Arrays in Reihenfolge).

import { sha256B64u } from '../core/crypto.js';

export const GENESIS = 'GENESIS';

/** Rekursiv alphabetisch sortierte Objekt-Schlüssel; Arrays bleiben in Reihenfolge. */
export function canonicalize(v) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(canonicalize);
  const out = {};
  for (const k of Object.keys(v).sort()) out[k] = canonicalize(v[k]);
  return out;
}

/** Nur die unveränderlichen Buchungs-Inhalte (Status/Storno-Zeiger fließen NICHT ein). */
export function hashedFields(buchung) {
  return {
    datum: buchung.datum,
    beschreibung: buchung.beschreibung || '',
    belegRef: buchung.belegRef || null,
    kostenstelle: buchung.kostenstelle || null,
    seq: buchung.seq,
    zeilen: (buchung.zeilen || []).map((z) => ({
      konto: z.konto, seite: z.seite, betrag: z.betrag,
    })),
  };
}

/** Berechnet den Hash einer Buchung über ihre Inhalte + den Vorgänger-Hash. */
export async function hashBuchung(buchung, prevHash) {
  const payload = canonicalize({ ...hashedFields(buchung), prevHash });
  return sha256B64u(JSON.stringify(payload));
}

/**
 * Verifiziert die komplette Kette festgeschriebener Buchungen.
 * @param {Array} festgeschriebene - Buchungen mit seq, prevHash, hash
 * @returns {Promise<{ok:boolean, errors:string[], count:number}>}
 */
export async function verifyChain(festgeschriebene) {
  const errors = [];
  const sorted = [...festgeschriebene].sort((a, b) => a.seq - b.seq);

  let prevHash = GENESIS;
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    const erwartetSeq = i + 1;
    if (b.seq !== erwartetSeq) errors.push(`Lücke/Sprung im Nummernkreis: erwartet ${erwartetSeq}, gefunden ${b.seq}`);
    if (b.prevHash !== prevHash) errors.push(`Seq ${b.seq}: prevHash passt nicht zur Kette`);
    const recomputed = await hashBuchung(b, prevHash);
    if (recomputed !== b.hash) errors.push(`Seq ${b.seq}: Hash stimmt nicht (Inhalt nachträglich verändert?)`);
    prevHash = b.hash;
  }
  return { ok: errors.length === 0, errors, count: sorted.length };
}

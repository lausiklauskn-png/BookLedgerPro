// src/ai/mistral.js
// Textsortierung/Kategorisierung + Steuer-Assistent über Mistral (EU).
// OpenAI-kompatible Chat-API (api.mistral.ai/v1/chat/completions, Bearer-Key) —
// Vorgehen wie Mein-WorkFloh. Daten werden in der EU verarbeitet (DSGVO).
//
// EHRLICHER HINWEIS: korrekt implementierter Aufruf, in der Bau-Umgebung NICHT
// gegen die Live-API getestet. Reine Prompt-/Parser-Logik ist node-getestet, und
// es gibt einen On-Device-Heuristik-Fallback, falls Mistral nicht konfiguriert ist.

import { getAiConfig } from './aiConfig.js';
import { KONTOART } from '../domain/accounts.js';
import { categorize as heuristicCategorize } from './categorize.js';
import { tokenize } from './pseudonym.js';

export const MISTRAL_BASE = 'https://api.mistral.ai/v1';

// ---- reine Helfer (testbar) ------------------------------------------------

const CLASSIFY_SYSTEM =
  'Du bist ein Buchhaltungs-Assistent für SKR03. Ordne den Belegtext genau EINEM Konto ' +
  'aus der erlaubten Liste zu und bestimme die Richtung. Antworte AUSSCHLIESSLICH mit ' +
  'kompaktem JSON: {"konto":"<Kontonummer>","richtung":"einnahme"|"ausgabe"}.';

/** Baut die Chat-Messages für die Kontierung (nur erlaubte Konten). */
export function buildClassifyMessages(text, konten) {
  const liste = konten
    .filter((k) => k.art === KONTOART.AUFWAND || k.art === KONTOART.ERTRAG)
    .map((k) => `${k.nummer} ${k.name} (${k.art})`).join('; ');
  return [
    { role: 'system', content: CLASSIFY_SYSTEM },
    { role: 'user', content: `Erlaubte Konten: ${liste}\n\nBelegtext:\n${String(text || '').slice(0, 1500)}` },
  ];
}

/** Parst die Mistral-Antwort (Inhalt) zu {konto, richtung} oder null. */
export function parseClassify(content) {
  const m = String(content || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    if (!j.konto) return null;
    return { konto: String(j.konto).trim(), richtung: j.richtung === 'einnahme' ? 'einnahme' : 'ausgabe' };
  } catch { return null; }
}

/**
 * Bildet aus der geparsten Mistral-Antwort eine normalisierte Kategorie (rein,
 * testbar). Akzeptiert NUR Erfolgskonten (Aufwand/Ertrag) — das Modell darf laut
 * Prompt nichts anderes wählen — und leitet die Buchungs-Richtung VERBINDLICH aus
 * der Kontoart ab (ERTRAG → einnahme, AUFWAND → ausgabe). So kann eine
 * fehlerhafte Modell-Richtung (z.B. Erlöskonto als „ausgabe") keine falsche
 * Soll/Haben-Buchung erzeugen. Unbekanntes/ungeeignetes Konto → null (Heuristik).
 * @returns {{konto:string, art:string, label:string, richtung:'einnahme'|'ausgabe', confidence:number, quelle:'mistral'}|null}
 */
export function resolveKategorie(parsed, kontoIndex) {
  const k = parsed && kontoIndex && kontoIndex[parsed.konto];
  if (!k) return null;
  let richtung;
  if (k.art === KONTOART.ERTRAG) richtung = 'einnahme';
  else if (k.art === KONTOART.AUFWAND) richtung = 'ausgabe';
  else return null; // kein Erfolgskonto → nicht als Sachkonto verwenden
  return { konto: k.nummer, art: k.art, label: k.name, richtung, confidence: 0.8, quelle: 'mistral' };
}

// ---- Netzwerk --------------------------------------------------------------

/** Low-Level-Chat-Aufruf gegen Mistral EU. Gibt den Antworttext zurück. */
export async function chat(messages, { maxTokens = 400, temperature = 0 } = {}) {
  const cfg = await getAiConfig();
  if (!cfg.mistralKey) throw new Error('Kein Mistral-Schlüssel hinterlegt (EU)');
  const res = await fetch(`${MISTRAL_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.mistralKey },
    body: JSON.stringify({ model: cfg.mistralModel || 'mistral-small-latest', messages, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Mistral-API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return (((data.choices || [])[0] || {}).message || {}).content || '';
}

/**
 * Kategorisiert einen Belegtext über Mistral EU; fällt bei Nichtkonfiguration oder
 * Fehler auf die On-Device-Heuristik zurück.
 *
 * Datenschutz-Modus: ist `opts.anker` gesetzt (Datenschutz-Modus „pseudonym"), wird
 * der an Mistral GESENDETE Text vorher pseudonymisiert — die lokale Extraktion und
 * der Buchungsvorschlag laufen weiterhin auf dem ECHTEN Text des Aufrufers. Da die
 * Antwort nur `{konto,richtung}` ist (keine Personendaten), ist hier kein
 * reidentify nötig.
 * @returns {{konto, art, label, richtung, confidence, quelle:'mistral'|'heuristik'}}
 */
export async function categorize(text, kontoIndex, opts = {}) {
  let useMistral = false;
  try { const { nutzeMistralFuerKontierung } = await import('./aiConfig.js'); useMistral = await nutzeMistralFuerKontierung(); }
  catch { useMistral = false; }
  if (useMistral) {
    try {
      const konten = Object.values(kontoIndex);
      const sendeText = (opts.anker && opts.anker.length)
        ? tokenize(text, opts.anker, { wortgrenze: true }).text : text;
      const content = await chat(buildClassifyMessages(sendeText, konten), { maxTokens: 60 });
      const kat = resolveKategorie(parseClassify(content), kontoIndex);
      if (kat) return kat;
    } catch { /* Fallback unten */ }
  }
  return { ...heuristicCategorize(text), quelle: 'heuristik' };
}

/** Minimaler Verbindungstest. @returns {Promise<{ok:boolean, message:string}>} */
export async function testMistral() {
  const cfg = await getAiConfig();
  if (!cfg.mistralKey) return { ok: false, message: 'Kein Schlüssel' };
  try {
    const res = await fetch(`${MISTRAL_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.mistralKey },
      body: JSON.stringify({ model: cfg.mistralModel || 'mistral-small-latest', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
    });
    if (!res.ok) { const t = await res.text().catch(() => ''); return { ok: false, message: `${res.status} ${t.slice(0, 120)}` }; }
    return { ok: true, message: 'OK' };
  } catch (e) { return { ok: false, message: String(e.message || e) }; }
}

// ---- Steuer-Assistent (EU) -------------------------------------------------

const TAX_SYSTEM =
  'Du bist ein freundlicher Buchhaltungs-Erklärer für Kleinunternehmen in Deutschland. ' +
  'Erkläre die USt-Voranmeldungs- und EÜR-Kennzahlen in einfacher Sprache, weise auf ' +
  'Auffälligkeiten/Fristen hin, KEINE verbindliche Steuerberatung, am Ende kurzer Hinweis ' +
  'auf Steuerberater. Antworte auf Deutsch, höchstens ~150 Wörter.';

export async function erklaereSteuer(kennzahlenText) {
  return (await chat([
    { role: 'system', content: TAX_SYSTEM },
    { role: 'user', content: kennzahlenText },
  ], { maxTokens: 400 })).trim();
}

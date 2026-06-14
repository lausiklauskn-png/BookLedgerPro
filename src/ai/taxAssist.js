// src/ai/taxAssist.js
// Steuer-Assistent: erklärt/prüft die USt-Voranmeldung & EÜR in einfacher Sprache.
// STRIKT opt-in, BYOK (gleiche Config wie ai/provider.js). Es werden nur AGGREGIERTE
// Kennzahlen gesendet (keine Einzelbelege/Personendaten) — Datenminimierung.
//
// EHRLICHER HINWEIS: korrekt implementierter Anthropic-Aufruf, aber in der Bau-Umgebung
// NICHT gegen die Live-API getestet. Keine Steuerberatung — nur Erläuterung.

import { getAiConfig } from './provider.js';
import { formatEuro } from '../domain/money.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

const SYSTEM_PROMPT =
  'Du bist ein freundlicher Buchhaltungs-Erklärer für Kleinunternehmen in Deutschland. ' +
  'Erkläre die übergebenen USt-Voranmeldungs- und EÜR-Kennzahlen in einfacher, ruhiger ' +
  'Sprache, weise auf Auffälligkeiten/Plausibilität hin und nenne typische Fristen. ' +
  'Mache KEINE verbindliche Steuerberatung; weise am Ende kurz darauf hin, dass im Zweifel ' +
  'ein Steuerberater zu fragen ist. Antworte auf Deutsch, höchstens ~150 Wörter.';

/** Baut den nutzbaren Kennzahlen-Text (nur Aggregate). */
export function buildKennzahlenText(va, eur, periode) {
  const z = periode && (periode.von || periode.bis) ? `Zeitraum ${periode.von || '…'} bis ${periode.bis || '…'}. ` : '';
  return z +
    `USt-VA: Umsätze 19% (Kz81) ${formatEuro(va.kz81)}, USt darauf ${formatEuro(va.kz81Steuer)}; ` +
    `Umsätze 7% (Kz86) ${formatEuro(va.kz86)}, USt darauf ${formatEuro(va.kz86Steuer)}; ` +
    `Vorsteuer (Kz66) ${formatEuro(va.kz66)}; Zahllast (Kz83) ${formatEuro(va.kz83)}. ` +
    `EÜR: Einnahmen ${formatEuro(eur.einnahmen)}, Ausgaben ${formatEuro(eur.ausgaben)}, ` +
    `Überschuss ${formatEuro(eur.ueberschuss)}.`;
}

/** Fragt Claude um eine Erläuterung der Kennzahlen. Gibt den Antworttext zurück. */
export async function erklaereSteuer(va, eur, periode) {
  const cfg = await getAiConfig();
  if (!cfg.enabled || !cfg.apiKey) throw new Error('Externe KI ist nicht aktiviert');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildKennzahlenText(va, eur, periode) }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Claude-API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

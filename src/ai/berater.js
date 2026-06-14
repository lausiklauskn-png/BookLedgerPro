// src/ai/berater.js
// KI-Berater/Tippgeber: schlägt für eine Buchung eine kurze BEGRÜNDUNG mit
// §-Bezug vor — als Eigenbeleg/Notiz für den Nutzer („parat, falls das Finanzamt
// fragt"). Der Nutzer entscheidet und editiert selbst.
//
// GROUNDING (gegen Halluzination): die Begründung stützt sich auf das kuratierte
// lokale Regel-Set (domain/rechtsregeln.js), NICHT auf freie Modell-Rechtskenntnis.
// Über Mistral (EU, BYOK, opt-in) wird nur FORMULIERT; ohne Mistral greift die
// On-Device-Begründung direkt aus den Regeln. KEINE Steuerberatung.

import { chat } from './mistral.js';
import { isMistralConfigured } from './aiConfig.js';
import { findeRechtsregeln, onDeviceBegruendung } from '../domain/rechtsregeln.js';

const SYSTEM =
  'Du bist ein nüchterner Buchhaltungs-Erklärer für Kleinunternehmen in Deutschland. ' +
  'Formuliere eine KURZE Begründung (1–3 Sätze) für die Kontierung dieser Buchung, ' +
  'als interne Notiz/Eigenbeleg für den Unternehmer. Nutze AUSSCHLIESSLICH die unten ' +
  'gelieferten Rechtsregeln als Grundlage und nenne den/die Paragraphen. Erfinde KEINE ' +
  'weiteren Vorschriften. Wenn keine Regel passt, beschreibe nur sachlich die betriebliche ' +
  'Veranlassung. KEINE verbindliche Steuerberatung. Antworte auf Deutsch, ohne Anrede.';

/** Baut den Kontext-Text einer Buchung für den Prompt. */
function kontextText(kontext) {
  const teile = [];
  if (kontext.beschreibung) teile.push(`Beschreibung: ${kontext.beschreibung}`);
  if (kontext.konto) teile.push(`Konto: ${kontext.konto}`);
  if (kontext.text) teile.push(`Belegtext: ${String(kontext.text).slice(0, 800)}`);
  if (kontext.kleinunternehmer) teile.push('Hinweis: Nutzer ist Kleinunternehmer (§19 UStG).');
  return teile.join('\n');
}

/** Baut die Chat-Messages (rein, testbar) — inkl. der passenden Regeln als Grundlage. */
export function buildBegruendungMessages(kontext) {
  const regeln = findeRechtsregeln(kontext);
  const grundlage = regeln.length
    ? regeln.map((r) => `- ${r.paragraph}: ${r.kurz} ${r.dokumentation}`).join('\n')
    : '(keine spezifische Regel — nur allgemeine betriebliche Veranlassung)';
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `${kontextText(kontext)}\n\nRechtsregeln (Grundlage):\n${grundlage}` },
  ];
}

/** Säubert die Modell-Antwort zu einem kompakten Begründungstext (rein, testbar). */
export function parseBegruendung(content) {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, '')   // etwaige Code-Fences entfernen
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Schlägt eine Begründung mit §-Bezug vor. Mit Mistral (EU) formuliert, sonst
 * On-Device aus den Regeln. Wirft nie wegen fehlender KI — fällt sauber zurück.
 * @param {{beschreibung?:string, konto?:string, text?:string, betragCent?:number, kleinunternehmer?:boolean}} kontext
 * @returns {Promise<{text:string, quelle:'mistral'|'on-device', regeln:string[]}>}
 */
export async function begruendeBuchung(kontext) {
  const k = kontext || {};
  const regeln = findeRechtsregeln(k).map((r) => r.paragraph);
  let useMistral = false;
  try { useMistral = await isMistralConfigured(); } catch { useMistral = false; }
  if (useMistral) {
    try {
      const content = await chat(buildBegruendungMessages(k), { maxTokens: 220, temperature: 0.2 });
      const text = parseBegruendung(content);
      if (text) return { text, quelle: 'mistral', regeln };
    } catch { /* Fallback unten */ }
  }
  const fallback = onDeviceBegruendung(k);
  return {
    text: fallback || 'Betrieblich veranlasste Buchung — bitte Beleg und Anlass dokumentieren.',
    quelle: 'on-device',
    regeln,
  };
}

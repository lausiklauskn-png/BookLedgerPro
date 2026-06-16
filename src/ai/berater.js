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
import { tokenize, reidentify, createRegistry } from './pseudonym.js';

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
  // Bevorzugt die vollständige Kontierung (mit Kontonamen), damit das Modell den
  // Kontonamen NICHT raten muss; sonst zumindest Nummer (+ Name, falls vorhanden).
  if (kontext.kontierung) teile.push(`Kontierung: ${kontext.kontierung}`);
  else if (kontext.konto) teile.push(`Konto: ${kontext.konto}${kontext.kontoName ? ' ' + kontext.kontoName : ''}`);
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
 *
 * Datenschutz-Modus: ist `opts.anker` gesetzt, werden die personenbezogenen Felder
 * des Kontexts (Beschreibung, Belegtext) vor dem Senden pseudonymisiert und die
 * formulierte Antwort wieder re-identifiziert (die Antwort kann den Belegtext
 * zitieren) — die §-Grundlage bleibt unberührt.
 * @param {{beschreibung?:string, konto?:string, text?:string, betragCent?:number, kleinunternehmer?:boolean}} kontext
 * @param {{anker?:Array}} [opts]
 * @returns {Promise<{text:string, quelle:'mistral'|'on-device', regeln:string[]}>}
 */
export async function begruendeBuchung(kontext, opts = {}) {
  const k = kontext || {};
  const regeln = findeRechtsregeln(k).map((r) => r.paragraph);
  let useMistral = false;
  try { useMistral = await isMistralConfigured(); } catch { useMistral = false; }
  if (useMistral) {
    try {
      // Pseudonymisierung der personenbezogenen Kontextfelder (stabile Token über
      // ein gemeinsames Register, damit reidentify die Antwort verlustfrei umkehrt).
      let kSend = k, map = null;
      if (opts.anker && opts.anker.length) {
        const reg = createRegistry();
        const o = { registry: reg, wortgrenze: true };
        kSend = {
          ...k,
          beschreibung: k.beschreibung ? tokenize(k.beschreibung, opts.anker, o).text : k.beschreibung,
          text: k.text ? tokenize(k.text, opts.anker, o).text : k.text,
        };
        map = reg.entries;
      }
      const content = await chat(buildBegruendungMessages(kSend), { maxTokens: 220, temperature: 0.2 });
      const text = map ? reidentify(parseBegruendung(content), map) : parseBegruendung(content);
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

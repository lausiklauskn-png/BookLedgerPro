// src/ai/provider.js
// Externe KI: Claude (Anthropic) per BYOK (eigener API-Schlüssel). STRIKT opt-in.
// Datenschutz: ein Aufruf sendet Beleg-Bild/-Text an Anthropic — das verlässt das
// Gerät. Deshalb nur nach ausdrücklicher Bestätigung in der UI. Der Schlüssel wird
// verschlüsselt (Sitzungs-Key) lokal gespeichert, nie im Klartext exportiert.
//
// EHRLICHER HINWEIS: Dieser API-Pfad ist als korrekter Anthropic-Messages-Aufruf
// implementiert, in dieser Umgebung aber NICHT gegen die Live-API getestet
// (kein Schlüssel/Netz). Vor produktiver Nutzung einmal real verifizieren.

import { encryptWithKey, decryptWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { kvGet, kvSet } from '../core/db.js';

const CFG_KEY = 'aiConfig';
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

// Neueste Claude-Modelle (BYOK). Default: Sonnet (gutes Preis/Leistung); Opus für
// schwierige Belege; Haiku für günstige Massenklassifikation.
export const AI_MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (Standard)' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (höchste Genauigkeit)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (günstig)' },
];

const DEFAULT_CFG = { enabled: false, model: 'claude-sonnet-4-6', apiKey: '' };

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

export async function getAiConfig() {
  const enc = await kvGet(CFG_KEY);
  if (!enc) return { ...DEFAULT_CFG };
  try { return { ...DEFAULT_CFG, ...JSON.parse(await decryptWithKey(key(), enc)) }; }
  catch { return { ...DEFAULT_CFG }; }
}

export async function saveAiConfig(patch) {
  const cfg = { ...(await getAiConfig()), ...patch };
  await kvSet(CFG_KEY, await encryptWithKey(key(), JSON.stringify(cfg)));
  return cfg;
}

export async function isConfigured() {
  const cfg = await getAiConfig();
  return Boolean(cfg.enabled && cfg.apiKey);
}

const SYSTEM_PROMPT =
  'Du bist ein Buchhaltungs-Assistent. Extrahiere aus dem Beleg die Felder und ' +
  'antworte AUSSCHLIESSLICH mit kompaktem JSON ohne Erklärung: ' +
  '{"betragBruttoCent": <ganzzahl cent>, "datum": "YYYY-MM-DD"|null, ' +
  '"ustSatz": 0|7|19|null, "vendor": <string|null>, "beschreibung": <string|null>}.';

function parseJsonAntwort(textBlocks) {
  const text = textBlocks.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Keine JSON-Antwort vom Modell');
  return JSON.parse(m[0]);
}

/**
 * Schickt ein Beleg-Bild an Claude (Vision) und erhält strukturierte Felder.
 * @param {{base64:string, mediaType:string}} bild
 * @returns {Promise<{betragBrutto:?number, datum:?string, ustSatz:?number, vendor:?string}>}
 */
export async function extractFromImage(bild) {
  const cfg = await getAiConfig();
  if (!cfg.enabled || !cfg.apiKey) throw new Error('Externe KI ist nicht aktiviert');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': API_VERSION,
      // Erlaubt direkten Browser-Aufruf (CORS). Bewusst gesetzt, BYOK.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: bild.mediaType, data: bild.base64 } },
          { type: 'text', text: 'Extrahiere die Buchungs-Felder als JSON.' },
        ],
      }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Claude-API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const j = parseJsonAntwort(data.content || []);
  return {
    betragBrutto: Number.isInteger(j.betragBruttoCent) ? j.betragBruttoCent : null,
    datum: j.datum || null,
    ustSatz: [0, 7, 19].includes(j.ustSatz) ? j.ustSatz : null,
    vendor: j.vendor || j.beschreibung || null,
    confidence: 0.85, // Modell-Extraktion; Nutzer prüft dennoch
  };
}

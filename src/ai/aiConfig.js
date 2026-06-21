// src/ai/aiConfig.js
// Verschlüsselte BYOK-Konfiguration für die EU-KI-Dienste:
//   - Google Cloud Vision (EU-Endpoint) für die Beleg-Texterkennung (OCR)
//   - Mistral (EU) für Textsortierung/Kategorisierung + Steuer-Assistent
// Schlüssel bleiben verschlüsselt auf dem Gerät (Sitzungs-Key), nie im Klartext.

import { encryptWithKey, decryptWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { kvGet, kvSet } from '../core/db.js';
import { STANDARD_WAHL, normalizeAnbieterWahl, aktiverAnbieter } from './anbieter.js';

const CFG_KEY = 'aiConfigEU';

export const MISTRAL_MODELS = [
  { id: 'mistral-small-latest', label: 'Mistral Small (günstig, EU)' },
  { id: 'mistral-large-latest', label: 'Mistral Large (genau, EU)' },
];

const DEFAULT_CFG = {
  visionKey: '',                 // Google Cloud Vision API-Key (EU)
  mistralKey: '',                // Mistral API-Key (EU)
  speechKey: '',                 // Google Cloud Speech-to-Text API-Key (EU) — Spracheingabe (BYOK)
  mistralModel: 'mistral-small-latest',
  anbieterWahl: { ...STANDARD_WAHL }, // KI-Anbieter je Funktion (ocr|kontierung|steuer), strikt EU — ai/anbieter.js
};

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

export async function getAiConfig() {
  const enc = await kvGet(CFG_KEY);
  let cfg;
  if (!enc) cfg = { ...DEFAULT_CFG };
  else { try { cfg = { ...DEFAULT_CFG, ...JSON.parse(await decryptWithKey(key(), enc)) }; } catch { cfg = { ...DEFAULT_CFG }; } }
  // Anbieter-Wahl immer normalisieren: unzulässige/Nicht-EU-Werte → Standard (strikt EU).
  cfg.anbieterWahl = normalizeAnbieterWahl(cfg.anbieterWahl);
  return cfg;
}

export async function saveAiConfig(patch) {
  const cfg = { ...(await getAiConfig()), ...patch };
  if ('anbieterWahl' in (patch || {})) cfg.anbieterWahl = normalizeAnbieterWahl(cfg.anbieterWahl);
  await kvSet(CFG_KEY, await encryptWithKey(key(), JSON.stringify(cfg)));
  return cfg;
}

export async function isVisionConfigured() {
  return Boolean((await getAiConfig()).visionKey);
}
export async function isMistralConfigured() {
  return Boolean((await getAiConfig()).mistralKey);
}

/** Aktiver KI-Anbieter (Id) für eine Funktion (ocr|kontierung|steuer). */
export async function aktiverKiAnbieter(modus) {
  return aktiverAnbieter(modus, (await getAiConfig()).anbieterWahl);
}

/** True, wenn die Beleg-Texterkennung (OCR) aktiv ist: Vision gewählt UND Schlüssel hinterlegt. */
export async function isOcrAktiv() {
  const cfg = await getAiConfig();
  return Boolean(cfg.visionKey) && aktiverAnbieter('ocr', cfg.anbieterWahl) === 'vision';
}

/** True, wenn der Steuer-Assistent (Mistral EU) aktiv ist: Mistral gewählt UND Schlüssel hinterlegt. */
export async function isSteuerAssistentAktiv() {
  const cfg = await getAiConfig();
  return Boolean(cfg.mistralKey) && aktiverAnbieter('steuer', cfg.anbieterWahl) === 'mistral';
}

/**
 * True, wenn für die Kontierung/Text-Begründung der EU-Cloud-Dienst (Mistral) genutzt
 * werden soll: Mistral gewählt UND Schlüssel hinterlegt. Bei „heuristik" → false
 * (erzwingt On-Device, kein Versand).
 */
export async function nutzeMistralFuerKontierung() {
  const cfg = await getAiConfig();
  return Boolean(cfg.mistralKey) && aktiverAnbieter('kontierung', cfg.anbieterWahl) === 'mistral';
}

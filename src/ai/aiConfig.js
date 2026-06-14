// src/ai/aiConfig.js
// Verschlüsselte BYOK-Konfiguration für die EU-KI-Dienste:
//   - Google Cloud Vision (EU-Endpoint) für die Beleg-Texterkennung (OCR)
//   - Mistral (EU) für Textsortierung/Kategorisierung + Steuer-Assistent
// Schlüssel bleiben verschlüsselt auf dem Gerät (Sitzungs-Key), nie im Klartext.

import { encryptWithKey, decryptWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { kvGet, kvSet } from '../core/db.js';

const CFG_KEY = 'aiConfigEU';

export const MISTRAL_MODELS = [
  { id: 'mistral-small-latest', label: 'Mistral Small (günstig, EU)' },
  { id: 'mistral-large-latest', label: 'Mistral Large (genau, EU)' },
];

const DEFAULT_CFG = {
  visionKey: '',                 // Google Cloud Vision API-Key (EU)
  mistralKey: '',                // Mistral API-Key (EU)
  mistralModel: 'mistral-small-latest',
};

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

export async function isVisionConfigured() {
  return Boolean((await getAiConfig()).visionKey);
}
export async function isMistralConfigured() {
  return Boolean((await getAiConfig()).mistralKey);
}

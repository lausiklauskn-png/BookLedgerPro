// src/ai/mistralOcr.js
// Beleg-Texterkennung (OCR) über Mistral OCR (mistral-ocr-latest) — EU (Frankreich),
// als DSGVO-taugliche EU-Option NEBEN Google Cloud Vision. BYOK (mistralKey), opt-in.
// Daten werden in der EU verarbeitet. Vorgehen nach dem SBKIM-Modul-24-Vertrag
// (Sage-Protokol src/modules/24_ocr_eingabe.js): Bild/PDF als data-URL an /v1/ocr,
// Text aus pages[].markdown|text.
//
// EHRLICHER HINWEIS: korrekt implementierter EU-Mistral-OCR-Aufruf, in der Bau-Umgebung
// NICHT gegen die Live-API getestet (kein Schlüssel/Netz). Reine Body-/Parser-Logik
// ist node-getestet.

export const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr';
export const MISTRAL_OCR_MODEL = 'mistral-ocr-latest';

// 1×1-PNG für einen minimalen Verbindungstest.
const TEST_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** Baut den Mistral-OCR-Request-Body (Bild ODER PDF als data-URL). */
export function buildMistralOcrRequest(base64, mimeType) {
  const mime = mimeType || 'image/png';
  const isPdf = /pdf$/i.test(mime);
  const dataUrl = `data:${mime};base64,${base64}`;
  return {
    model: MISTRAL_OCR_MODEL,
    document: isPdf
      ? { type: 'document_url', document_url: dataUrl }
      : { type: 'image_url', image_url: dataUrl },
  };
}

/** Extrahiert den erkannten Text aus der Mistral-OCR-Antwort. */
export function parseMistralOcrText(json) {
  if (json && Array.isArray(json.pages)) {
    return json.pages
      .map((p) => (p && (p.markdown || p.text)) || '')
      .join('\n\n')
      .trim();
  }
  if (json && typeof json.text === 'string') return json.text.trim();
  return '';
}

/**
 * Führt OCR über Mistral OCR (EU) aus.
 * @param {{base64:string, mimeType:string}} input
 * @param {string} key Mistral-API-Schlüssel (BYOK)
 * @returns {Promise<string>} erkannter Text
 */
export async function ocrMistral(input, key) {
  if (!key) throw new Error('Kein Mistral-Schlüssel hinterlegt (EU)');
  const res = await fetch(MISTRAL_OCR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(buildMistralOcrRequest(input.base64, input.mimeType)),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Mistral-OCR ${res.status}: ${txt.slice(0, 200)}`);
  }
  return parseMistralOcrText(await res.json());
}

/** Minimaler Verbindungstest (1×1-Bild). @returns {Promise<{ok:boolean, message:string}>} */
export async function testMistralOcr(key) {
  if (!key) return { ok: false, message: 'Kein Schlüssel' };
  try {
    const res = await fetch(MISTRAL_OCR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(buildMistralOcrRequest(TEST_PIXEL, 'image/png')),
    });
    if (!res.ok) { const t = await res.text().catch(() => ''); return { ok: false, message: `${res.status} ${t.slice(0, 120)}` }; }
    return { ok: true, message: 'OK' };
  } catch (e) {
    return { ok: false, message: (e && e.message) || 'Netzfehler' };
  }
}

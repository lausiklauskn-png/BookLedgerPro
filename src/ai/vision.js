// src/ai/vision.js
// Beleg-Texterkennung (OCR) ausschließlich über Google Cloud Vision — EU-Endpoint
// (eu-vision.googleapis.com). Daten werden in der EU verarbeitet (DSGVO).
// Vorgehen 1:1 wie Mein-WorkFloh: Bild -> images:annotate, PDF -> files:annotate,
// Feature DOCUMENT_TEXT_DETECTION, Antwort aus fullTextAnnotation.text.
//
// EHRLICHER HINWEIS: korrekt implementierter EU-Vision-Aufruf, in der Bau-Umgebung
// NICHT gegen die Live-API getestet (kein Schlüssel/Netz). Reine Body-/Parser-Logik
// ist node-getestet.

import { getAiConfig } from './aiConfig.js';

export const VISION_BASE = 'https://eu-vision.googleapis.com/v1';

/** Baut Endpoint + Request-Body je nach Inhaltstyp (Bild oder PDF). */
export function buildVisionRequest(base64, mimeType) {
  const isPdf = /pdf$/i.test(mimeType || '');
  if (isPdf) {
    return {
      endpoint: 'files:annotate',
      body: { requests: [{ inputConfig: { content: base64, mimeType: 'application/pdf' }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] },
    };
  }
  return {
    endpoint: 'images:annotate',
    body: { requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] },
  };
}

/** Extrahiert den erkannten Text aus der Vision-Antwort (Bild ODER PDF). */
export function parseVisionText(json) {
  const reqs = (json && json.responses) || [];
  const texts = [];
  for (const r of reqs) {
    // Bild: r.fullTextAnnotation; PDF: r.responses[].fullTextAnnotation
    if (r.fullTextAnnotation && r.fullTextAnnotation.text) texts.push(r.fullTextAnnotation.text);
    if (Array.isArray(r.responses)) {
      for (const p of r.responses) if (p.fullTextAnnotation && p.fullTextAnnotation.text) texts.push(p.fullTextAnnotation.text);
    }
    if (r.error && r.error.message) throw new Error('Vision: ' + r.error.message);
  }
  return texts.join('\n').trim();
}

/**
 * Führt OCR über Google Vision EU aus.
 * @param {{base64:string, mimeType:string}} input
 * @returns {Promise<string>} erkannter Text
 */
export async function ocr(input) {
  const cfg = await getAiConfig();
  if (!cfg.visionKey) throw new Error('Kein Google-Vision-Schlüssel hinterlegt (EU)');
  const { endpoint, body } = buildVisionRequest(input.base64, input.mimeType);
  const res = await fetch(`${VISION_BASE}/${endpoint}?key=${encodeURIComponent(cfg.visionKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Vision-API ${res.status}: ${txt.slice(0, 200)}`);
  }
  return parseVisionText(await res.json());
}

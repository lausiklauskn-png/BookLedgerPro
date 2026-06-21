// src/ai/speech.js — Spracheingabe (Speech-to-Text) für die SBKIM-Suche. Zwei Wege:
//   1) Browser (Web Speech API) — sofort, kein Schlüssel, build-frei. HINWEIS: in manchen
//      Browsern (z. B. Chrome) wird die Audio an Google gesendet — NICHT garantiert EU.
//      Daher strikt opt-in (Nutzer drückt das Mikro) + sichtbarer Datenschutz-Hinweis.
//   2) EU (BYOK) — Google Cloud Speech-to-Text über den EU-Endpoint (eu-speech.googleapis.com),
//      genau wie Vision: Aufnahme im Browser → EU-API → Text. Daten in der EU (DSGVO, Regel #8).
//
// EHRLICHER HINWEIS: korrekt implementiert, in der Bau-Umgebung NICHT gegen Live-API/Mikrofon
// getestet (kein Netz/Gerät). Reine Body-/Parser-/Hinweis-Logik ist node-getestet.

export const SPEECH_BASE = 'https://eu-speech.googleapis.com/v1';

// ---- reine Helfer (testbar) ------------------------------------------------

/** MIME-Typ → Google-Speech-Encoding. */
export function encodingFor(mimeType) {
  const m = String(mimeType || '').toLowerCase();
  if (m.includes('ogg')) return 'OGG_OPUS';
  if (m.includes('webm')) return 'WEBM_OPUS';
  if (m.includes('wav') || m.includes('l16') || m.includes('pcm')) return 'LINEAR16';
  return 'ENCODING_UNSPECIFIED';
}

/** Baut den Recognize-Request-Body (rein). WEBM/OGG_OPUS: Sample-Rate wird von Google erkannt. */
export function buildSpeechRequest(base64, { mimeType, languageCode = 'de-DE' } = {}) {
  return {
    config: {
      encoding: encodingFor(mimeType),
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'latest_short',
    },
    audio: { content: base64 },
  };
}

/** Extrahiert den Transkript-Text aus der Speech-Antwort (rein). */
export function parseTranscript(json) {
  const results = (json && json.results) || [];
  const parts = [];
  for (const r of results) {
    const alt = (r && r.alternatives && r.alternatives[0]) || null;
    if (alt && alt.transcript) parts.push(alt.transcript);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Übersetzt typische Speech-Fehler in einen verständlichen Hinweis (oder ''). */
export function speechFehlerHinweis(msg) {
  const m = String(msg || '').toLowerCase();
  if (m.includes('api keys are not supported') || m.includes('expected oauth2'))
    return 'Kein normaler Cloud-Schlüssel (vermutlich Vertex/Agent). Bitte Speech-to-Text API aktivieren und einen STANDARD-API-Schlüssel erstellen.';
  if (m.includes('has not been used') || m.includes('service_disabled') || m.includes('is disabled') || m.includes('not been enabled'))
    return 'Cloud Speech-to-Text API ist im Projekt nicht aktiviert — bitte aktivieren.';
  if (m.includes('billing')) return 'Abrechnung für das Google-Cloud-Projekt aktivieren.';
  if (m.includes('api key not valid') || m.includes('api_key_invalid')) return 'API-Schlüssel ungültig — bitte prüfen.';
  if (m.includes('referer') || m.includes('referrer')) return 'Schlüssel ist auf eine andere Website beschränkt — diese URL freigeben.';
  return '';
}

// ---- Browser (Web Speech API) ----------------------------------------------

/** Ist die Browser-Spracherkennung verfügbar? (kein window in node → false) */
export function browserSpeechSupported() {
  return typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
}

/**
 * Einmal-Erkennung über die Web Speech API. Gibt das Recognition-Objekt zurück
 * (Aufrufer setzt onresult/onerror/onend und ruft .start()); null, wenn nicht unterstützt.
 */
export function makeBrowserRecognizer({ lang = 'de-DE' } = {}) {
  if (!browserSpeechSupported()) return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  return rec;
}

// ---- EU (BYOK) — Aufnahme + Google Cloud Speech-to-Text EU -----------------

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Audio-Lesefehler'));
    r.onload = () => {
      const s = String(r.result || '');
      const i = s.indexOf(',');
      resolve(i >= 0 ? s.slice(i + 1) : s); // data:-Präfix entfernen
    };
    r.readAsDataURL(blob);
  });
}

/**
 * Startet eine Mikrofon-Aufnahme (Browser). Rückgabe: { stop, done }.
 * `done` löst nach `stop()` mit { base64, mimeType } auf. Wirft, wenn kein Mikro/Erlaubnis.
 */
export async function startRecording() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !window.MediaRecorder)
    throw new Error('Mikrofon-Aufnahme im Browser nicht verfügbar');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mr = new MediaRecorder(stream);
  const chunks = [];
  mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise((resolve, reject) => {
    mr.onerror = () => { stream.getTracks().forEach((t) => t.stop()); reject(new Error('Aufnahmefehler')); };
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      try {
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        resolve({ base64: await blobToBase64(blob), mimeType: blob.type });
      } catch (e) { reject(e); }
    };
  });
  mr.start();
  return { stop: () => { if (mr.state !== 'inactive') mr.stop(); }, done };
}

/** Schickt Audio an Google Cloud Speech-to-Text (EU-Endpoint, BYOK). Gibt den Text zurück. */
export async function recognizeEU({ base64, mimeType }, { apiKey, languageCode = 'de-DE' } = {}) {
  if (!apiKey) throw new Error('Kein Speech-Schlüssel hinterlegt (EU)');
  const body = buildSpeechRequest(base64, { mimeType, languageCode });
  const res = await fetch(`${SPEECH_BASE}/speech:recognize?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Speech-API ${res.status}: ${t.slice(0, 200)}`); }
  return parseTranscript(await res.json());
}

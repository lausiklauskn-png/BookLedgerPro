// src/domain/teilenEmpfang.js — Dateien aus Androids Teilen-Liste abholen (Klaus 2026-10-26, Schritt 2 V1).
//
// Android schickt geteilte Dateien als POST an ./teilen-empfang (share_target im Manifest). sw.js fängt den
// POST ab, legt jede Datei im Vorrat GETEILT_VORRAT ab (Name in X-Name, URI-kodiert) und leitet auf
// ./?geteilt=1 weiter. Hier holt die App sie ab und leert den Vorrat — derselbe Weg wie in Workflow PDF
// (upstream sw.js/app.js geteiltUebernehmen). Browser-Teil (caches), statisch geprüft; der ganze Weg im
// Browser in tests/smoke_teilen.mjs.

import { GETEILT_VORRAT } from './workflowPdf.js';

/** Holt die geteilten Dateien aus dem Vorrat und leert ihn. Fail-soft: [] wenn nichts da ist. */
export async function geteilteDateienHolen() {
  const dateien = [];
  if (typeof caches === 'undefined') return dateien;
  try {
    const c = await caches.open(GETEILT_VORRAT);
    for (const k of await c.keys()) {
      const r = await c.match(k);
      if (!r) continue;
      const b = await r.blob();
      let name = 'Datei';
      try { name = decodeURIComponent(r.headers.get('X-Name') || 'Datei'); } catch { /* bleibt „Datei" */ }
      dateien.push(new File([b], name, { type: b.type || r.headers.get('Content-Type') || '' }));
      await c.delete(k);
    }
  } catch { /* Vorrat nicht lesbar: nichts da */ }
  return dateien;
}

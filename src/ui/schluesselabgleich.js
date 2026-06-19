// src/ui/schluesselabgleich.js
// UI für P9 — Datei-Import mit exaktem Schlüssel-Abgleich. Zwei Schritte:
//  1. Pseudonymisieren: Klartext → pseudonymes Dokument (außer Haus) + Schlüssel-Datei
//     (Anker-Tresor, bleibt gerätelokal — enthält Klartext).
//  2. Importieren & Abgleichen: Antwort-Dokument (mit Platzhaltern) + Schlüssel-Datei →
//     verlustfreie Re-Identifizierung, ehrlicher Bericht über fehlende/ungenutzte Schlüssel.
//
// Die reine Abgleichs-/Serialisierungs-Logik liegt in `ai/schluesselabgleich.js`
// (node-getestet). Dieser Glue-Pfad (DOM/Datei-Picker/Download) ist statisch geprüft
// (kein Headless-Browser). KEIN Netz — alles lokal.

import { el } from './dom.js';
import { t } from './i18n.js';
import { ladeAnker } from '../ai/anker.js';
import { tokenize, maskierungsBericht } from '../ai/pseudonym.js';
import {
  serialisiereSchluessel, parseSchluessel, gleicheAb, abgleichBericht,
} from '../ai/schluesselabgleich.js';
import { pickFile, readFileText, downloadText } from '../core/files.js';

function zeitstempelName(prefix, ext) {
  const d = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${prefix}-${d}.${ext}`;
}

// ---- Schritt 1: Pseudonymisieren & Schlüssel sichern -------------------------
function exportPanel() {
  const status = el('span', { class: 'muted small' });
  const ta = el('textarea', { class: 'mono', rows: '5', placeholder: t('schluessel.inputLabel') });
  let letzterSchlusselJson = null;   // JSON-String der Schlüssel-Datei
  let letztesPseudo = null;          // pseudonymer Text

  const dlDoc = el('button', { class: 'btn btn-sm', text: t('schluessel.downloadDoc'), disabled: true,
    onClick: () => { if (letztesPseudo != null) downloadText(zeitstempelName('pseudonym', 'txt'), letztesPseudo); } });
  const dlKey = el('button', { class: 'btn btn-sm', text: t('schluessel.downloadKey'), disabled: true,
    onClick: () => { if (letzterSchlusselJson != null) downloadText(zeitstempelName('schluessel', 'json'), letzterSchlusselJson, 'application/json'); } });

  const setBereit = (bereit) => {
    dlDoc.disabled = !bereit; dlKey.disabled = !bereit;
    if (bereit) { dlDoc.removeAttribute('disabled'); dlKey.removeAttribute('disabled'); }
    else { dlDoc.setAttribute('disabled', ''); dlKey.setAttribute('disabled', ''); }
  };

  const ladeBtn = el('button', { class: 'btn btn-sm', text: t('schluessel.loadFile'), onClick: async () => {
    const f = await pickFile('.txt,text/plain,.csv,.md,.json');
    if (!f) return;
    try { ta.value = await readFileText(f); status.textContent = t('schluessel.loaded').replace('{name}', f.name); } catch { /* ignore */ }
  } });

  const runBtn = el('button', { class: 'btn btn-sm btn-primary', text: t('schluessel.run'), onClick: async () => {
    const klartext = ta.value || '';
    if (!klartext.trim()) { setBereit(false); status.textContent = ''; return; }
    // Anker aus den Stammdaten (+ optional NER), unabhängig vom Live-Sendemodus.
    const anker = await ladeAnker(klartext);
    if (!anker || !anker.length) { setBereit(false); status.textContent = t('schluessel.noAnchors'); return; }
    const { text: pseudo, map } = tokenize(klartext, anker, { wortgrenze: true });
    letztesPseudo = pseudo;
    letzterSchlusselJson = serialisiereSchluessel(map, { titel: '' });
    const bericht = maskierungsBericht(map);
    setBereit(bericht.gesamt > 0);
    status.textContent = t('schluessel.masked').replace('{n}', String(bericht.gesamt));
  } });

  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('schluessel.exportTitle') }),
    ta,
    el('div', { class: 'btn-row' }, [ladeBtn, runBtn, status]),
    el('div', { class: 'btn-row' }, [dlDoc, dlKey]),
    el('p', { class: 'muted small', text: t('schluessel.keyWarn') }),
  ]);
}

// ---- Schritt 2: Datei importieren & abgleichen ------------------------------
function importPanel() {
  const docStatus = el('span', { class: 'muted small' });
  const keyStatus = el('span', { class: 'muted small' });
  const out = el('div', {});
  let docText = null;
  let schluessel = null;   // {token,wert,typ}[]
  let letztesErgebnis = null;

  const ladeDoc = el('button', { class: 'btn btn-sm', text: t('schluessel.importDocLabel'), onClick: async () => {
    const f = await pickFile('.txt,text/plain,.csv,.md,.json');
    if (!f) return;
    try { docText = await readFileText(f); docStatus.textContent = t('schluessel.loaded').replace('{name}', f.name); } catch { docText = null; }
  } });

  const ladeKey = el('button', { class: 'btn btn-sm', text: t('schluessel.importKeyLabel'), onClick: async () => {
    const f = await pickFile('.json,application/json,.txt');
    if (!f) return;
    let roh = '';
    try { roh = await readFileText(f); } catch { roh = ''; }
    const p = parseSchluessel(roh);
    if (!p.ok) { schluessel = null; keyStatus.textContent = t('schluessel.keyError').replace('{fehler}', p.fehler || ''); return; }
    schluessel = p.schluessel;
    keyStatus.textContent = t('schluessel.loaded').replace('{name}', f.name);
  } });

  const dlBtn = el('button', { class: 'btn btn-sm', text: t('schluessel.download'), onClick: () => {
    if (letztesErgebnis != null) downloadText(zeitstempelName('reidentifiziert', 'txt'), letztesErgebnis);
  } });

  const matchBtn = el('button', { class: 'btn btn-sm btn-primary', text: t('schluessel.match'), onClick: () => {
    out.replaceChildren();
    if (docText == null || !schluessel) { out.appendChild(el('p', { class: 'form-error', text: t('schluessel.needBoth') })); return; }
    const r = gleicheAb(docText, schluessel);
    letztesErgebnis = r.text;
    const b = abgleichBericht(r);

    const meldungen = [];
    if (b.vollstaendig) {
      meldungen.push(el('p', { class: 'muted small', text: t('schluessel.reportOk').replace('{n}', String(b.ersetzt)) }));
    } else {
      const tokens = r.fehlend.map((e) => e.token).join(', ');
      meldungen.push(el('p', { class: 'hint-error small', text: t('schluessel.reportMissing').replace('{n}', String(b.fehlend)).replace('{tokens}', tokens) }));
    }
    if (b.ungenutzt > 0) meldungen.push(el('p', { class: 'muted small', text: t('schluessel.reportUnused').replace('{n}', String(b.ungenutzt)) }));

    const ergebnisTa = el('textarea', { class: 'mono', rows: '5', readonly: 'readonly' });
    ergebnisTa.value = r.text;   // <textarea>-Inhalt via .value (Attribut greift nicht)
    out.append(
      el('div', { class: 'setting-label', text: t('schluessel.result') }),
      ergebnisTa,
      ...meldungen,
      el('div', { class: 'btn-row' }, [dlBtn]),
    );
  } });

  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('schluessel.importTitle') }),
    el('div', { class: 'btn-row' }, [ladeDoc, docStatus]),
    el('div', { class: 'btn-row' }, [ladeKey, keyStatus]),
    el('div', { class: 'btn-row' }, [matchBtn]),
    out,
  ]);
}

/**
 * Baut die zusammenklappbare Schlüssel-Abgleich-Karte für die Einstellungen.
 * @returns {HTMLElement}
 */
export function schluesselAbgleichSection() {
  // Bewusst modus-unabhängig (manueller Datei-Workflow) — die Anker kommen über
  // `ladeAnker` aus den Stammdaten, unabhängig vom Live-Sendemodus `datenschutzModus`.
  return el('details', { class: 'setting' }, [
    el('summary', { class: 'setting-label', text: t('schluessel.title') }),
    el('p', { class: 'muted small', text: t('schluessel.hint') }),
    exportPanel(),
    importPanel(),
  ]);
}

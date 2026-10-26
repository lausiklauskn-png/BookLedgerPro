// src/domain/kiReinigung.js — reine Helfer für Import, Prüfstand und Reinigung vor der KI
// (Klaus 2026-10-14: „PDFs in großem Umfang als Dateien importieren, Fotos, eingescannte
// Dokumente … die Erkennung von Schadsoftware oder Schadtexten muss fehlerfrei laufen …
// lesbar sein auf manuellen Befehl — genauso wie bei Workflow PDF.")
//
// Kein DOM, keine Datenbank, kein Netz — in Node geprüft (tests/run.mjs).
// Der Browser-Teil (Prüfkern laden, Seiten zeichnen, speichern) steht in
// src/domain/belegPruefung.js und src/ai/kiVorbereitung.js.

/** Die Lagen eines Belegs. `offen` = nie geprüft (Klaus: prüfen erst auf Knopfdruck). */
export const PRUEF_STAND = Object.freeze({
  OFFEN: 'offen', WARNUNG: 'warnung', SAUBER: 'sauber', UNGEPRUEFT: 'ungeprueft',
});

/** Prüfbar ist, was der Prüfkern lesen kann: PDF und Bilder. */
export function pruefbar(meta) {
  const t = String((meta && meta.mediaType) || '');
  return t === 'application/pdf' || t.startsWith('image/');
}

/** Lage eines Belegs aus seinen (unverschlüsselten) Metadaten; null = nicht prüfbar. */
export function pruefStandVon(meta) {
  if (!pruefbar(meta)) return null;
  const s = meta && meta.pruefung && meta.pruefung.stand;
  return s === PRUEF_STAND.WARNUNG || s === PRUEF_STAND.SAUBER || s === PRUEF_STAND.UNGEPRUEFT ? s : PRUEF_STAND.OFFEN;
}

/** Belege, die noch nie geprüft wurden — für „Alle ungeprüften prüfen". */
export function ungepruefte(belege) {
  return (belege || []).filter((b) => pruefStandVon(b) === PRUEF_STAND.OFFEN);
}

const ENDUNG_TYP = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif', tif: 'image/tiff', tiff: 'image/tiff',
};

/** Dateityp: was der Browser meldet, sonst aus der Endung (ein Ordner liefert oft ''). */
export function belegTyp(name, typ) {
  const t = String(typ || '');
  if (t === 'application/pdf' || t.startsWith('image/')) return t;
  const m = /\.([a-z0-9]+)$/i.exec(String(name || ''));
  return (m && ENDUNG_TYP[m[1].toLowerCase()]) || '';
}

/**
 * Aus vielen Dateien (Mehrfach-Auswahl oder ganzer Ordner) die Belege nehmen.
 * Übersprungen wird — und BENANNT — was kein PDF und kein Bild ist, was leer ist und
 * versteckte Systemdateien (.DS_Store, Thumbs.db, ._*). Nichts verschwindet still.
 * @param {Array<{name:string,type?:string,size?:number,webkitRelativePath?:string}>} files
 * @returns {{nehmen:Array<{file, typ, pfad}>, ueberspringen:Array<{pfad, grund}>}}
 */
export function belegDateienWaehlen(files) {
  const nehmen = [], ueberspringen = [];
  for (const f of Array.from(files || [])) {
    const name = String((f && f.name) || '');
    const pfad = String((f && f.webkitRelativePath) || name);
    if (/^\./.test(name) || /^thumbs\.db$/i.test(name) || /^desktop\.ini$/i.test(name)) {
      ueberspringen.push({ pfad, grund: 'system' }); continue;
    }
    if (!(f && f.size > 0)) { ueberspringen.push({ pfad, grund: 'leer' }); continue; }
    const typ = belegTyp(name, f.type);
    if (!typ) { ueberspringen.push({ pfad, grund: 'art' }); continue; }
    nehmen.push({ file: f, typ, pfad });
  }
  // Reihenfolge wie im Ordner, natürlich sortiert („Teil 2" vor „Teil 10").
  nehmen.sort((a, b) => a.pfad.localeCompare(b.pfad, 'de', { numeric: true, sensitivity: 'base' }));
  return { nehmen, ueberspringen };
}

// ---- Der OCR-Text vor der Kontierung (Klaus 2026-10-14: „Ja, einmal anhalten") ----------

/**
 * Die Zeilen, in denen der Prüfer eine Anweisung an eine KI fand — als Wortlaut.
 * `ergebnis` ist das, was PrueferMail.pruefeMail(text) liefert: die Zeilennummern
 * gelten für ergebnis.text, nicht unbedingt für den eingegebenen Text. Deshalb wird
 * der WORTLAUT der Zeile genommen, nicht die Nummer.
 * @returns {string[]} getrimmte, nicht leere Zeilen (ohne Doppel)
 */
export function kiAnweisungZeilen(ergebnis) {
  const r = ergebnis || {};
  const zeilen = String(r.text || '').split('\n');
  const aus = [];
  for (const s of r.stellen || []) {
    if (!s || s.kennung !== 'KI-ANWEISUNG') continue;
    const z = String(zeilen[(s.zeile || 0) - 1] || '').trim();
    if (z && !aus.includes(z)) aus.push(z);
  }
  return aus;
}

/** Den Text ohne genau diese Zeilen (verglichen getrimmt). Alles andere bleibt Zeichen für Zeichen. */
export function ohneZeilen(text, wegZeilen) {
  const weg = new Set((wegZeilen || []).map((z) => String(z).trim()).filter(Boolean));
  if (!weg.size) return String(text || '');
  return String(text || '').split('\n').filter((z) => !weg.has(z.trim())).join('\n');
}

/** Die drei Antworten des Halts — und was danach an eine KI darf. */
export const TEXT_WAHL = Object.freeze({ OHNE: 'ohne', TROTZDEM: 'trotzdem', LOKAL: 'lokal' });

/**
 * Was nach der Antwort an eine KI gehen darf.
 * @returns {{kiText:string, nurLokal:boolean}} kiText ist der Text für JEDEN späteren KI-Weg
 *   (Kontierung, Begründung, Richter); nurLokal: die Kontierung bleibt auf dem Gerät.
 */
export function textNachWahl(text, zeilen, wahl) {
  if (wahl === TEXT_WAHL.TROTZDEM) return { kiText: String(text || ''), nurLokal: false };
  const ohne = ohneZeilen(text, zeilen);
  return { kiText: ohne, nurLokal: wahl === TEXT_WAHL.LOKAL };
}

// ---- Prüfbericht als Textdatei (für die Akte, GoBD-freundlich nachvollziehbar) -----------

/**
 * @param {string} name  Dateiname des Belegs
 * @param {object} p     Ergebnis von WFP.Eingang.pruefen (stand, funde, hinweise, herkunft, angaben, zeit)
 * @param {{NAME?:object, ANGABE_NAME?:object, wasTun?:Function, kiEntfernt?:Array}} [opt]
 */
export function berichtText(name, p, opt = {}) {
  const N = opt.NAME || {}, AN = opt.ANGABE_NAME || {};
  const z = [];
  z.push('Prüfbericht — BookLedgerPro');
  z.push('Beleg: ' + String(name || ''));
  z.push('Geprüft: ' + String((p && p.zeit) || ''));
  const stand = p && p.stand;
  z.push('Ergebnis: ' + (stand === 'warnung' ? 'AUFFÄLLIG' : stand === 'sauber' ? 'nichts Auffälliges gefunden'
    : 'nicht vollständig geprüft („ungeprüft" heißt nicht „sauber")'));
  const funde = (p && p.funde) || [];
  if (funde.length) {
    z.push('', 'Funde:');
    for (const f of funde) z.push('- ' + (N[f.kennung] || f.kennung) + ': ' + (f.satz || ''));
    const schritte = [];
    for (const f of funde) for (const s of (opt.wasTun ? opt.wasTun(f.kennung) : []) || []) if (!schritte.includes(s)) schritte.push(s);
    if (schritte.length) { z.push('', 'Was jetzt tun:'); schritte.forEach((s, i) => z.push((i + 1) + '. ' + s)); }
  }
  const herkunft = (p && p.herkunft) || [];
  if (herkunft.length) {
    z.push('', 'Herkunftsnachweis (eigene Aussage des Programms, Unterschrift NICHT nachgerechnet):');
    for (const h of herkunft) {
      z.push('- ' + (h.satz || h.kennung));
      for (const [k, v] of h.daten || []) z.push('    ' + k + ': ' + v);
    }
  }
  const angaben = (p && p.angaben) || [];
  if (angaben.length) {
    z.push('', 'Was sonst in der Datei steht (keine Gefahr):');
    for (const a of angaben) z.push('- ' + (AN[a.kennung] || a.kennung) + ': ' + (a.satz || ''));
  }
  const hin = (p && p.hinweise) || [];
  if (hin.length) { z.push('', 'Hinweise:'); for (const h of hin) z.push('- ' + h); }
  const ki = opt.kiEntfernt || [];
  if (ki.length) {
    z.push('', 'Vor dem Senden an eine KI entfernt:');
    for (const v of ki) z.push('- ' + String(v.zeit || '').slice(0, 10) + ' · ' + (v.weg || '') + (v.seite ? ' · Seite ' + v.seite : '') + ' · ' + (v.grund || '') + ': „' + (v.text || '') + '"');
  }
  z.push('', 'Gesucht wird nach versteckten Anweisungen an eine KI und nach Tarnung. Das ist KEINE Virenprüfung.');
  return z.join('\n') + '\n';
}

// src/domain/documents.js
// Verschlüsselter Beleg-Store. Belege (Bild/PDF) liegen AES-GCM-verschlüsselt im
// IndexedDB-files-Store; Metadaten unverschlüsselt für Listenanzeige. Verknüpfung
// zu Buchungen über buchungId.

import { filePut, fileGet, fileDel, fileAllMeta } from '../core/db.js';
import { encryptBytesWithKey, decryptBytesWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { readFileBytes } from '../core/files.js';

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

// Pro-Umbau 14 A2: nach jeder Änderung an Belegen (neu, Text, Verknüpfung, gelöscht) ein Ereignis — das Mycel baut damit seinen
// Antwort-Korpus von selbst neu (src/sbkim/netz.js, entprellt). Ohne Fenster (Node-Proben) still.
export const BELEGE_GEAENDERT = 'blp-belege-geaendert';
function geaendert(id) {
  try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new CustomEvent(BELEGE_GEAENDERT, { detail: { id } })); } catch { /* fail-soft */ }
}

function neueId() {
  return 'beleg:' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 8);
}

/** Speichert eine Datei verschlüsselt als Beleg, gibt die Metadaten zurück.
 *  `opt.typ` ersetzt einen fehlenden Dateityp (aus einem Ordner kommt oft '').
 *  `opt.original` (File) ist das Originalfoto eines Scans (Klaus 2026-10-14: „Scan + Original
 *  behalten", GoBD): es liegt UNVERÄNDERT und verschlüsselt am selben Beleg (`originalDaten`),
 *  `opt.scan` = {sicher, grund, weg} sagt, wie der Scan entstand.
 *  Geprüft wird NICHT beim Ablegen (Klaus 2026-10-14: prüfen erst auf Knopfdruck). */
export async function saveBeleg(file, opt = {}) {
  const bytes = await readFileBytes(file);
  const data = await encryptBytesWithKey(key(), bytes);   // { v, iv, ct }
  const rec = {
    id: neueId(),
    name: file.name || 'Beleg',
    mediaType: file.type || opt.typ || 'application/octet-stream',
    size: bytes.length,
    createdAt: new Date().toISOString(),
    buchungId: null,
    data, // verschlüsselt — von fileAllMeta() ausgeblendet
  };
  // Herkunft (Klaus 2026-10-26): 'workflow-pdf' = eigener Scan aus Workflow PDF (Marke im PDF-Kopf) → keine
  // Datei-Prüfung nötig; 'teilen' = kam über Androids Teilen-Liste. Unverschlüsselt, denn die Liste braucht es.
  if (opt.herkunft) rec.herkunft = String(opt.herkunft);
  if (opt.quelle) rec.quelle = String(opt.quelle);
  // Aus einer geteilten Mail (Klaus 2026-10-26): Absender, Betreff, Datum und die Mail-Beleg-Kennung — unverschlüsselt,
  // weil die Liste sie zeigt (wie der Name); der Mailtext selbst liegt verschlüsselt am Mail-Beleg (textDaten).
  if (opt.mail && typeof opt.mail === 'object') {
    rec.mail = { von: String(opt.mail.von || '').slice(0, 120), betreff: String(opt.mail.betreff || '').slice(0, 160),
      datum: String(opt.mail.datum || '').slice(0, 10), anhaenge: Number(opt.mail.anhaenge) || 0, mailId: String(opt.mail.mailId || '') };
  }
  // Zurück aus Workflow PDF (Klaus 2026-10-26, Rundlauf): das unterschriebene Angebots-PDF trägt die Marke — Kennung und
  // Nummer des Angebots stehen offen am Beleg, damit die Liste „zu Angebot …" zeigen kann.
  if (opt.angebot && typeof opt.angebot === 'object') {
    rec.angebot = { id: String(opt.angebot.id || '').slice(0, 80), nummer: String(opt.angebot.nummer || '').slice(0, 40) };
  }
  if (opt.original) {
    const ob = await readFileBytes(opt.original);
    rec.originalDaten = await encryptBytesWithKey(key(), ob);   // verschlüsselt — von fileAllMeta() ausgeblendet
    rec.original = { name: opt.original.name || 'Foto', mediaType: opt.original.type || opt.originalTyp || 'application/octet-stream', size: ob.length };
    if (opt.scan) rec.scan = { sicher: !!opt.scan.sicher, grund: String(opt.scan.grund || ''), weg: String(opt.scan.weg || '') };
  }
  await filePut(rec);
  const { data: _, ...meta } = rec;
  geaendert(rec.id);
  return meta;
}

// ---- Erkannter Text und Bedeutungs-Vektoren am Beleg (Klaus 2026-10-26, Plan A1) -------------------------
// Der Text aus Textebene/OCR wird VERSCHLÜSSELT am Beleg gespeichert (textDaten, wie originalDaten); unverschlüsselt
// bleiben nur Zählwerte (textZeichen, textStand), damit die Liste weiß, was durchsuchbar ist. Die Vektoren der
// Abschnitte (e5-small, 384 Zahlen) liegen ebenso verschlüsselt (vektorDaten) mit Zerlegungs-Kennung und Anzahl.
const enc = new TextEncoder(), dec = new TextDecoder();

/** Speichert den erkannten Text verschlüsselt am Beleg; leerer Text löscht ihn. @returns Metadaten */
export async function setBelegText(id, text) {
  const rec = await fileGet(id);
  if (!rec) throw new Error('Beleg nicht gefunden');
  const s = String(text == null ? '' : text).trim();
  if (s) {
    rec.textDaten = await encryptBytesWithKey(key(), enc.encode(s));
    rec.textZeichen = s.length;
    rec.textStand = new Date().toISOString();
  } else { delete rec.textDaten; rec.textZeichen = 0; delete rec.textStand; }
  // Neuer Text → alte Vektoren gelten nicht mehr.
  delete rec.vektorDaten; delete rec.vektorAnzahl; delete rec.vektorZerlegung;
  await filePut(rec);
  const { data: _d, textDaten: _t, vektorDaten: _v, originalDaten: _o, pruefDaten: _p, kiDaten: _k, ...meta } = rec;
  geaendert(id);
  return meta;
}

/** Positionen einer Rechnung (domain/belegPositionen.js) verschlüsselt am Beleg; offen nur Anzahl und „stimmt". */
export async function setBelegPositionen(id, ergebnis) {
  const rec = await fileGet(id);
  if (!rec) throw new Error('Beleg nicht gefunden');
  const e = ergebnis && Array.isArray(ergebnis.positionen) ? ergebnis : null;
  if (e && e.positionen.length) {
    rec.positionenDaten = await encryptBytesWithKey(key(), enc.encode(JSON.stringify(e)));
    rec.positionenAnzahl = e.positionen.length;
    rec.positionenStimmt = e.stimmt == null ? null : !!e.stimmt;
  } else { delete rec.positionenDaten; rec.positionenAnzahl = 0; delete rec.positionenStimmt; }
  await filePut(rec);
  const { data: _d, textDaten: _t, vektorDaten: _v, originalDaten: _o, pruefDaten: _p, kiDaten: _k, positionenDaten: _q, ...meta } = rec;
  return meta;
}
/** Liest die Positionen (entschlüsselt) oder null. */
export async function getBelegPositionen(id) {
  const rec = await fileGet(id);
  if (!rec || !rec.positionenDaten) return null;
  try { return JSON.parse(dec.decode(await decryptBytesWithKey(key(), rec.positionenDaten))); } catch { return null; }
}

/** Liest den erkannten Text (entschlüsselt) oder ''. */
export async function getBelegText(id) {
  const rec = await fileGet(id);
  if (!rec || !rec.textDaten) return '';
  return dec.decode(await decryptBytesWithKey(key(), rec.textDaten));
}

/** Speichert die Abschnitts-Vektoren verschlüsselt. stuecke = [{text, vec:number[]}], zerlegung = Kennung der Zerlegung. */
export async function setBelegVektoren(id, stuecke, zerlegung) {
  const rec = await fileGet(id);
  if (!rec) throw new Error('Beleg nicht gefunden');
  const liste = (stuecke || []).map((s) => ({ text: String(s.text || ''), vec: Array.from(s.vec || []).map((x) => Math.round(x * 1e5) / 1e5) }));
  rec.vektorDaten = await encryptBytesWithKey(key(), enc.encode(JSON.stringify(liste)));
  rec.vektorAnzahl = liste.length;
  rec.vektorZerlegung = String(zerlegung || '');
  await filePut(rec);
  return { id, vektorAnzahl: liste.length, vektorZerlegung: rec.vektorZerlegung };
}

/** Liest die Abschnitts-Vektoren (entschlüsselt) oder []. */
export async function getBelegVektoren(id) {
  const rec = await fileGet(id);
  if (!rec || !rec.vektorDaten) return [];
  try { return JSON.parse(dec.decode(await decryptBytesWithKey(key(), rec.vektorDaten))); } catch { return []; }
}

/** Listet Beleg-Metadaten (ohne die verschlüsselten Inhalte). */
export async function listBelege() {
  const metas = await fileAllMeta();
  metas.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return metas;
}

/** Entschlüsselt und liefert die Roh-Bytes eines Belegs. */
export async function getBelegBytes(id) {
  const rec = await fileGet(id);
  if (!rec) return null;
  return decryptBytesWithKey(key(), rec.data);
}

/** Das Originalfoto eines Scans (entschlüsselt) oder null. */
export async function getOriginalBytes(id) {
  const rec = await fileGet(id);
  if (!rec || !rec.originalDaten) return null;
  return decryptBytesWithKey(key(), rec.originalDaten);
}

export async function linkBeleg(belegId, buchungId) {
  const rec = await fileGet(belegId);
  if (!rec) throw new Error('Beleg nicht gefunden');
  rec.buchungId = buchungId;
  await filePut(rec);
  geaendert(belegId);
}

export async function deleteBeleg(id) {
  await fileDel(id);
  geaendert(id);
}

// GoBD-Aufbewahrung: reine Helfer in aufbewahrung.js (ohne Speicher-Abhängigkeit), hier re-exportiert.
export { AUFBEWAHRUNG_JAHRE, aufbewahrungBis, istAufbewahrungspflichtig, darfBelegLoeschen } from './aufbewahrung.js';

/** Wandelt Bytes in Standard-Base64 (für die Vision-API). */
export function bytesToBase64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

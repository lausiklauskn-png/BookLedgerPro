// src/domain/xlsxZeilen.js
// Excel-Datei (.xlsx) → Zeilen aus Text, wie csvZeilen sie liefert; danach gilt dieselbe
// Spalten-Zuordnung wie für CSV (bankCsv.js). Kein fremdes Paket (BookLedgerPro ist
// build-frei): .xlsx ist ein ZIP mit XML; entpackt wird mit dem DecompressionStream des
// Browsers ('deflate-raw', auch in Node ≥ 18). Datumszellen (Zahl mit Datumsformat) kommen
// als JJJJ-MM-TT heraus, Zahlen mit Punkt als Dezimalzeichen.
//
// EHRLICHER HINWEIS: liest das erste (oder ein gewähltes) Tabellenblatt; Formeln zählen mit
// ihrem gespeicherten Ergebnis. Alte .xls-Dateien (kein ZIP) gehen nicht — dort „als CSV
// speichern“. Verschlüsselte .xlsx gehen nicht. Reine Funktionen bis auf das Entpacken.

/** Fängt die Datei wie ein ZIP an (PK\x03\x04)? */
export function istXlsx(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  return b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
}
/** Alte Excel-Datei (OLE2, .xls)? */
export function istAltesXls(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  return b.length > 8 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
}

/** Inhaltsverzeichnis des ZIP (zentrales Verzeichnis). @returns {Array<{name:string, methode:number, start:number, groesse:number}>} */
export function zipVerzeichnis(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Keine ZIP-Datei (Verzeichnis fehlt).');
  const anzahl = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const out = [];
  for (let n = 0; n < anzahl; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP-Verzeichnis beschädigt.');
    const methode = dv.getUint16(p + 10, true);
    const groesse = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), kommLen = dv.getUint16(p + 32, true);
    const lokal = dv.getUint32(p + 42, true);
    const name = dec.decode(b.subarray(p + 46, p + 46 + nameLen));
    // Daten beginnen hinter dem lokalen Kopf (dessen Namens-/Extralängen können abweichen).
    const start = lokal + 30 + dv.getUint16(lokal + 26, true) + dv.getUint16(lokal + 28, true);
    out.push({ name, methode, start, groesse });
    p += 46 + nameLen + extraLen + kommLen;
  }
  return out;
}

async function inflate(roh) {
  const ds = new DecompressionStream('deflate-raw');
  const strom = new Blob([roh]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(strom).arrayBuffer());
}

/** Eine Datei aus dem ZIP als Text (null, wenn es sie nicht gibt). Methoden 0 (gespeichert) und 8 (deflate). */
export async function zipText(bytes, verzeichnis, name) {
  const e = verzeichnis.find((x) => x.name === name);
  if (!e) return null;
  const roh = bytes.subarray(e.start, e.start + e.groesse);
  if (e.methode === 0) return new TextDecoder().decode(roh);
  if (e.methode === 8) return new TextDecoder().decode(await inflate(roh));
  throw new Error(`ZIP-Verfahren ${e.methode} wird nicht unterstützt.`);
}

function entXml(s) {
  return String(s).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
function texteIn(xml) {
  // Alle <t>…</t> (auch in Rich-Text-Läufen <r>), ohne die Lautschrift <rPh>.
  const ohne = String(xml).replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  const re = /<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g; let m;
  while ((m = re.exec(ohne))) out += m[1] ? entXml(m[1]) : '';
  return out;
}

/** sharedStrings.xml → Liste der Texte. */
export function geteilteTexte(xml) {
  const out = [];
  const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g; let m;
  while ((m = re.exec(String(xml || '')))) out.push(m[1] ? texteIn(m[1]) : '');
  return out;
}

const DATUM_FORMATE = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57]);
/** styles.xml → Menge der Zellstil-Nummern (cellXfs), die ein Datum zeigen. */
export function datumsStile(xml) {
  const s = String(xml || '');
  const eigene = new Set();
  const reF = /<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g; let m;
  while ((m = reF.exec(s))) {
    const code = entXml(m[2]).replace(/"[^"]*"|\[[^\]]*\]|\\./g, '').toLowerCase();
    if (/[dy]/.test(code)) eigene.add(Number(m[1])); // Tag oder Jahr im Format = Datum (Uhrzeit allein nicht)
  }
  const xfs = (s.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/) || [])[1] || '';
  const out = new Set();
  const reX = /<xf\b([^>]*)\/?>/g; let i = 0;
  while ((m = reX.exec(xfs))) {
    const id = Number((m[1].match(/numFmtId="(\d+)"/) || [])[1] || 0);
    if (DATUM_FORMATE.has(id) || eigene.has(id)) out.add(i);
    i++;
  }
  return out;
}

/** Excel-Seriennummer → JJJJ-MM-TT (System 1900, oder 1904 mit `s1904`). */
export function serienDatum(n, s1904 = false) {
  const z = Number(n) + (s1904 ? 1462 : 0);
  if (!Number.isFinite(z) || z < 1) return '';
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(z) * 86400000).toISOString().slice(0, 10);
}

function spaltenNr(ref) {
  const m = String(ref || '').match(/^([A-Z]+)/); if (!m) return -1;
  let n = 0; for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * Ein Tabellenblatt (XML) → Zeilen aus Text. Leere Zeilen fallen weg (wie bei csvZeilen).
 * @param {string} xml  xl/worksheets/sheetN.xml
 * @param {string[]} geteilt  aus geteilteTexte
 * @param {Set<number>} datum  aus datumsStile
 */
export function blattZeilen(xml, geteilt = [], datum = new Set(), s1904 = false) {
  const out = [];
  const reZ = /<row\b[^>]*>([\s\S]*?)<\/row>/g; let mz;
  while ((mz = reZ.exec(String(xml || '')))) {
    const zeile = [];
    const reC = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g; let mc;
    while ((mc = reC.exec(mz[1]))) {
      const attr = mc[1], innen = mc[2] || '';
      const j = spaltenNr((attr.match(/\br="([A-Z]+\d+)"/) || [])[1]);
      const typ = (attr.match(/\bt="(\w+)"/) || [])[1] || 'n';
      const stil = Number((attr.match(/\bs="(\d+)"/) || [])[1] || 0);
      const v = (innen.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      let wert = '';
      if (typ === 's') wert = geteilt[Number(v)] || '';
      else if (typ === 'inlineStr') wert = texteIn((innen.match(/<is>([\s\S]*?)<\/is>/) || [])[1] || '');
      else if (typ === 'str' || typ === 'e') wert = v != null ? entXml(v) : '';
      else if (typ === 'b') wert = v === '1' ? 'WAHR' : 'FALSCH';
      else if (v != null) wert = datum.has(stil) ? serienDatum(v, s1904) : String(Number(v));
      const pos = j >= 0 ? j : zeile.length;
      while (zeile.length < pos) zeile.push('');
      zeile[pos] = String(wert).trim();
    }
    if (zeile.some((x) => x !== '')) out.push(zeile);
  }
  return out;
}

/**
 * .xlsx-Bytes → { blaetter: Namen, blatt: gewählter Name, zeilen }.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @param {{blatt?: number|string}} opts  Nummer (ab 0) oder Name des Blatts; ab Werk das erste
 */
export async function xlsxZeilen(bytes, opts = {}) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (istAltesXls(b)) throw new Error('Alte Excel-Datei (.xls) – bitte in Excel „als CSV speichern“.');
  if (!istXlsx(b)) throw new Error('Keine Excel-Datei (.xlsx).');
  const vz = zipVerzeichnis(b);
  const wb = (await zipText(b, vz, 'xl/workbook.xml')) || '';
  const rels = (await zipText(b, vz, 'xl/_rels/workbook.xml.rels')) || '';
  const s1904 = /<workbookPr\b[^>]*date1904="(1|true)"/.test(wb);
  const blaetter = [];
  const reS = /<sheet\b([^>]*)\/?>/g; let m;
  while ((m = reS.exec(wb))) {
    const name = entXml((m[1].match(/\bname="([^"]*)"/) || [])[1] || '');
    const rid = (m[1].match(/\br:id="([^"]*)"/) || m[1].match(/\bid="([^"]*)"/) || [])[1];
    const rel = rels.match(new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*Target="([^"]*)"`)) || rels.match(new RegExp(`<Relationship\\b[^>]*Target="([^"]*)"[^>]*Id="${rid}"`));
    let ziel = rel ? rel[1] : '';
    ziel = ziel.startsWith('/') ? ziel.slice(1) : ziel ? 'xl/' + ziel.replace(/^\.\//, '') : '';
    blaetter.push({ name, ziel });
  }
  if (!blaetter.length) blaetter.push({ name: 'Tabelle1', ziel: 'xl/worksheets/sheet1.xml' });
  const w = typeof opts.blatt === 'string' ? blaetter.findIndex((x) => x.name === opts.blatt) : (opts.blatt || 0);
  const gewaehlt = blaetter[w >= 0 && w < blaetter.length ? w : 0];
  const xml = await zipText(b, vz, gewaehlt.ziel) ?? await zipText(b, vz, 'xl/worksheets/sheet1.xml');
  if (xml == null) throw new Error('Tabellenblatt nicht gefunden.');
  const geteilt = geteilteTexte((await zipText(b, vz, 'xl/sharedStrings.xml')) || '');
  const datum = datumsStile((await zipText(b, vz, 'xl/styles.xml')) || '');
  return { blaetter: blaetter.map((x) => x.name), blatt: gewaehlt.name, zeilen: blattZeilen(xml, geteilt, datum, s1904) };
}

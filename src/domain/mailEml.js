// domain/mailEml.js — eine Mail (.eml, RFC 822/MIME) lesen: Kopf, Text, Anhänge (Klaus 2026-10-26).
//
// Klaus: „Mail an BookLedgerPro teilen: ja, nur für die Ablage. Wenn ein Anhang eine Rechnung ist, muss sie
// differenziert ausgelesen und in der Buchhaltung eingepflegt werden können." Private Brain Pro teilt die Mail
// als .eml (message/rfc822); BookLedgerPro legt die Mail als Beleg ab (Text durchsuchbar) und jeden PDF-/Bild-Anhang
// als eigenen Beleg daneben. Reine Rechnung, kein DOM, keine Bibliothek — in Node prüfbar.
//
// Benannte Grenzen: kein S/MIME, keine verschlüsselten Mails; HTML wird zu schlichtem Text (Tags weg, Entities);
// Zeichensätze: UTF-8, ISO-8859-1/15, Windows-1252 (alles andere fällt auf UTF-8); höchstens 40 Anhänge.

export const MAIL_TYP = 'message/rfc822';
export const MAIL_MAX_ANHAENGE = 40;

const latin1 = new TextDecoder('iso-8859-1');

/** Ist das eine Mail-Datei? (Typ vom Browser oder Endung .eml) */
export function istMailDatei(name, typ) {
  return String(typ || '') === MAIL_TYP || /\.eml$/i.test(String(name || ''));
}

// ---- Kopfzeilen ----------------------------------------------------------------------------------------------

function unfold(kopfRoh) {
  // Fortsetzungszeilen (Leerzeichen/Tab am Anfang) an die vorige Zeile hängen.
  return kopfRoh.replace(/\r\n/g, '\n').replace(/\n[ \t]+/g, ' ');
}

/** Kopfzeilen → Map (Name klein → letzter Wert). */
export function parseHeaders(kopfRoh) {
  const m = new Map();
  for (const zeile of unfold(kopfRoh).split('\n')) {
    const i = zeile.indexOf(':');
    if (i <= 0) continue;
    m.set(zeile.slice(0, i).trim().toLowerCase(), zeile.slice(i + 1).trim());
  }
  return m;
}

/** „text/plain; charset=utf-8; name="x"" → { wert:'text/plain', params:{charset:'utf-8', name:'x'} } (RFC 2231 einfach). */
export function parseParamHeader(wert) {
  const teile = String(wert || '').split(';');
  const out = { wert: (teile.shift() || '').trim().toLowerCase(), params: {} };
  const stern = {};
  for (const t of teile) {
    const i = t.indexOf('='); if (i < 0) continue;
    let k = t.slice(0, i).trim().toLowerCase(), v = t.slice(i + 1).trim();
    if (/^".*"$/.test(v)) v = v.slice(1, -1).replace(/\\(.)/g, '$1');
    const m = /^([^*]+)\*(\d+)?\*?$/.exec(k);   // name*0*= name*1*= oder name*=
    if (m) {
      const basis = m[1], nr = Number(m[2] || 0);
      (stern[basis] = stern[basis] || [])[nr] = v;
    } else out.params[k] = v;
  }
  for (const [basis, stuecke] of Object.entries(stern)) {
    let ganz = stuecke.filter((x) => x != null).join('');
    const cm = /^([^']*)'[^']*'(.*)$/.exec(ganz);   // utf-8''Rechnung%20M%C3%A4rz.pdf
    if (cm) { try { ganz = decodeURIComponent(cm[2]); } catch { ganz = cm[2]; } }
    if (!out.params[basis]) out.params[basis] = ganz;
  }
  return out;
}

function zeichensatz(name) {
  const n = String(name || 'utf-8').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (/^(iso-?8859-?1|latin1|us-?ascii|ascii)$/.test(n)) return 'iso-8859-1';
  if (/^(iso-?8859-?15|latin9)$/.test(n)) return 'iso-8859-15';
  if (/^(windows-?1252|cp1252)$/.test(n)) return 'windows-1252';
  return 'utf-8';
}
function bytesZuText(bytes, charset) {
  try { return new TextDecoder(zeichensatz(charset)).decode(bytes); }
  catch { return new TextDecoder('utf-8').decode(bytes); }
}

/** =?utf-8?Q?Rechnung_M=C3=A4rz?= und =?utf-8?B?...?= in Kopfzeilen auflösen. */
export function decodeWords(s) {
  return String(s || '')
    .replace(/(=\?[^?]+\?[bBqQ]\?[^?]*\?=)\s+(?==\?)/g, '$1')   // Leerraum zwischen zwei Wörtern fällt weg
    .replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_, cs, art, text) => {
      try {
        const bytes = art.toUpperCase() === 'B' ? base64Bytes(text) : qpBytes(text.replace(/_/g, ' '), true);
        return bytesZuText(bytes, cs);
      } catch { return text; }
    });
}

// ---- Übertragungs-Kodierungen ----------------------------------------------------------------------------------

export function base64Bytes(s) {
  const sauber = String(s || '').replace(/[^A-Za-z0-9+/=]/g, '');
  const bin = atob(sauber);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function qpBytes(s, kopf = false) {
  const t = String(s || '').replace(/=\r?\n/g, '');          // weiche Zeilenumbrüche
  const out = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '=' && /^[0-9A-Fa-f]{2}$/.test(t.slice(i + 1, i + 3))) { out.push(parseInt(t.slice(i + 1, i + 3), 16)); i += 2; }
    else out.push(c.charCodeAt(0) & 0xff);
  }
  return Uint8Array.from(out);
}
function latin1Bytes(s) { const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff; return out; }

function koerperBytes(roh, encoding) {
  const e = String(encoding || '7bit').toLowerCase().trim();
  if (e === 'base64') return base64Bytes(roh);
  if (e === 'quoted-printable') return qpBytes(roh);
  return latin1Bytes(roh);
}

// ---- HTML → Text ------------------------------------------------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', euro: '€' };
export function htmlZuText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, '\n').replace(/<\/t[dh]>/gi, ' \t')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
      return ENTITIES[e] != null ? ENTITIES[e] : m;
    })
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---- MIME-Baum ------------------------------------------------------------------------------------------------

function teileKopfKoerper(roh) {
  const m = /\r?\n\r?\n/.exec(roh);
  if (!m) return { kopf: roh, koerper: '' };
  return { kopf: roh.slice(0, m.index), koerper: roh.slice(m.index + m[0].length) };
}

function multipartTeile(koerper, boundary) {
  const marke = '--' + boundary;
  const stuecke = koerper.split(new RegExp('(?:^|\\r?\\n)' + marke.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=--|\\r?\\n|$)'));
  // erstes Stück = Vorspann, letztes nach "--" = Nachspann
  const out = [];
  for (let i = 1; i < stuecke.length; i++) {
    let s = stuecke[i];
    if (s.startsWith('--')) break;
    s = s.replace(/^\r?\n/, '');
    if (s.trim()) out.push(s);
  }
  return out;
}

function dateiName(ct, cd) {
  return decodeWords((cd.params.filename || ct.params.name || '').trim());
}

function walk(roh, akk, tiefe) {
  if (tiefe > 12) return;
  const { kopf, koerper } = teileKopfKoerper(roh);
  const h = parseHeaders(kopf);
  const ct = parseParamHeader(h.get('content-type') || 'text/plain');
  const cd = parseParamHeader(h.get('content-disposition') || '');
  const cte = h.get('content-transfer-encoding') || '7bit';
  if (ct.wert.startsWith('multipart/') && ct.params.boundary) {
    for (const teil of multipartTeile(koerper, ct.params.boundary)) walk(teil, akk, tiefe + 1);
    return;
  }
  const name = dateiName(ct, cd);
  const istAnhang = cd.wert === 'attachment' || (!!name && !/^text\/(plain|html)$/.test(ct.wert));
  if (!istAnhang && ct.wert === 'text/plain') { akk.text.push(bytesZuText(koerperBytes(koerper, cte), ct.params.charset)); return; }
  if (!istAnhang && ct.wert === 'text/html') { akk.html.push(bytesZuText(koerperBytes(koerper, cte), ct.params.charset)); return; }
  if (ct.wert === 'message/rfc822') {
    // weitergeleitete Mail: als .eml-Anhang ablegen (die Belege darin holt sich der Nutzer beim Teilen dieser Datei)
    if (akk.anhaenge.length < MAIL_MAX_ANHAENGE) akk.anhaenge.push({ name: name || 'Weitergeleitete Mail.eml', typ: MAIL_TYP, bytes: latin1Bytes(koerper) });
    return;
  }
  if (akk.anhaenge.length >= MAIL_MAX_ANHAENGE) { akk.uebergangen++; return; }
  const bytes = koerperBytes(koerper, cte);
  if (!bytes.length) return;
  akk.anhaenge.push({ name: name || ('Anhang-' + (akk.anhaenge.length + 1)), typ: ct.wert || 'application/octet-stream', bytes, inline: cd.wert === 'inline' && !!(h.get('content-id')) });
}

/**
 * Liest eine Mail. `input`: Uint8Array | ArrayBuffer | string (Rohtext).
 * @returns {{kopf:{von:string,an:string,betreff:string,datum:string,messageId:string}, text:string, html:string,
 *   anhaenge:Array<{name:string,typ:string,bytes:Uint8Array,inline?:boolean}>, uebergangen:number}}
 */
export function parseEml(input) {
  const roh = typeof input === 'string' ? input : latin1.decode(input instanceof Uint8Array ? input : new Uint8Array(input));
  const { kopf } = teileKopfKoerper(roh);
  const h = parseHeaders(kopf);
  const akk = { text: [], html: [], anhaenge: [], uebergangen: 0 };
  walk(roh, akk, 0);
  let datum = '';
  try { const d = new Date(h.get('date') || ''); if (!isNaN(d)) datum = d.toISOString(); } catch { datum = ''; }
  return {
    kopf: {
      von: decodeWords(h.get('from') || ''),
      an: decodeWords(h.get('to') || ''),
      betreff: decodeWords(h.get('subject') || ''),
      datum,
      messageId: (h.get('message-id') || '').trim(),
    },
    text: akk.text.join('\n\n').replace(/\r\n?/g, '\n').trim(),
    html: akk.html.join('\n\n').replace(/\r\n?/g, '\n').trim(),
    anhaenge: akk.anhaenge,
    uebergangen: akk.uebergangen,
  };
}

/** Der Text, der am Mail-Beleg gemerkt wird (durchsuchbar): Kopf + Text (sonst HTML als Text). */
export function mailAlsText(m) {
  const k = m.kopf || {};
  const text = (m.text || '').trim() || htmlZuText(m.html || '');
  const kopf = [['Betreff', k.betreff], ['Von', k.von], ['An', k.an], ['Datum', k.datum ? k.datum.slice(0, 10) : '']]
    .filter(([, v]) => v).map(([n, v]) => `${n}: ${v}`).join('\n');
  const anh = (m.anhaenge || []).length ? '\nAnhänge: ' + m.anhaenge.map((a) => a.name).join(', ') : '';
  return (kopf + anh + '\n\n' + text).trim();
}

/** Beleg-Name der Mail: „Mail 2026-10-26 – Rechnung Oktober.eml" (Betreff gekappt, Dateinamen-sicher). */
export function mailBelegName(m) {
  const k = m.kopf || {};
  const betreff = (k.betreff || 'ohne Betreff').replace(/[\\/:*?"<>|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return `Mail${k.datum ? ' ' + k.datum.slice(0, 10) : ''} – ${betreff}.eml`;
}

/** Absender nur als Anzeigename („Max Muster" aus „Max Muster <max@…>"). */
export function absenderName(von) {
  const s = String(von || '').trim();
  const m = /^"?([^"<]+?)"?\s*<[^>]+>$/.exec(s);
  return (m ? m[1] : s.replace(/^<|>$/g, '')).trim();
}

// tools/messen-auszugtext.mjs — misst den Leser „Text eines Kontoauszugs → Umsätze“ (src/domain/auszugText.js)
// an einem Stapel-Bankordner mit Soll (UMSAETZE.json: auszuege[].{datei,saldoAlt,saldoNeu,umsaetze[].{buchung,wert,betrag,gegenpartei,rechnungsnummern}}).
// Je Umsatz „vollständig richtig“ = Tag (Buchung oder Wert) + Betrag mit Vorzeichen + Gegenpartei (normalisiert, eine enthält die andere;
// ist die Soll-Gegenpartei leer, zählt nur Tag und Betrag). Je Auszug: Saldo stimmt (Leser) und Saldo stimmt mit dem Soll.
// Aufruf: node tools/messen-auszugtext.mjs <stapel>/bank [--fehler] [--json datei]
globalThis.__BLP_VORSCHAU = { auszugText: true, rechnungsnummer: true }; // Messung: Vorschau-Funktionen an (src/domain/vorschau.js)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { leseAuszugText } from '../src/domain/auszugText.js';
import { parseBankauszug } from '../src/domain/bankimport.js';

const ordner = resolve(process.argv[2] || '.');
const zeigeFehler = process.argv.includes('--fehler');
const jsonZiel = (() => { const i = process.argv.indexOf('--json'); return i > 0 ? process.argv[i + 1] : ''; })();
const soll = JSON.parse(readFileSync(join(ordner, 'UMSAETZE.json'), 'utf8'));
const cent = (b) => Math.round(parseFloat(String(b).replace(/\./g, '').replace(',', '.')) * 100);
const fest = (t) => String(t || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
const gegenOk = (ist, s) => { const a = fest(ist), b = fest(s); if (!b) return true; return !!a && (a.includes(b) || b.includes(a)); };
const renrFest = (r) => String(r).replace(/\s/g, '').toUpperCase();

const z = { auszuege: 0, saldoStimmt: 0, saldoWieSoll: 0, ueberDreieinhalb: 0, weicheAus: 0,
  soll: 0, gelesen: 0, richtig: 0, falsch: 0, falschOhneWarnung: 0, fehlend: 0, unsicher: 0, richtigUnsicher: 0,
  renrSoll: 0, renrGefunden: 0, renrFalsch: 0 };
const fehler = [];
for (const a of soll.auszuege) {
  const p = join(ordner, a.datei);
  if (!existsSync(p)) continue;
  const text = readFileSync(p, 'utf8');
  const r = leseAuszugText(text);
  const weiche = parseBankauszug(text);
  if (weiche.format === 'text' && weiche.umsaetze.length === r.umsaetze.length) z.weicheAus++;
  z.auszuege++;
  if (r.saldoStimmt) z.saldoStimmt++;
  if (r.saldoStartCent === cent(a.saldoAlt) && r.saldoEndeCent === cent(a.saldoNeu)) z.saldoWieSoll++;
  z.soll += a.umsaetze.length; z.gelesen += r.umsaetze.length;
  z.unsicher += r.umsaetze.filter((u) => u.unsicher).length;
  const frei = new Set(r.umsaetze.map((_, i) => i));
  const passt = (u, s) => (u.valuta === s.buchung || u.valuta === s.wert || u.buchung === s.buchung || u.buchung === s.wert)
    && u.betragCent != null && (u.richtung === 'einnahme' ? 1 : -1) * u.betragCent === cent(s.betrag) && gegenOk(u.gegen, s.gegenpartei);
  const offenSoll = [];
  for (const s of a.umsaetze) {
    const i = [...frei].find((k) => passt(r.umsaetze[k], s));
    if (i == null) { offenSoll.push(s); continue; }
    frei.delete(i); z.richtig++;
    const u = r.umsaetze[i];
    if (u.unsicher) z.richtigUnsicher++;
    const ist = new Set(u.rechnungsnummern.map(renrFest));
    for (const n of s.rechnungsnummern || []) { z.renrSoll++; if (ist.has(renrFest(n))) z.renrGefunden++; }
    const sollSet = new Set((s.rechnungsnummern || []).map(renrFest));
    z.renrFalsch += [...ist].filter((n) => !sollSet.has(n)).length;
  }
  z.fehlend += offenSoll.length;
  for (const k of frei) {
    const u = r.umsaetze[k];
    z.falsch++;
    if (!u.unsicher) z.falschOhneWarnung++;
    fehler.push(`${a.datei}: falsch${u.unsicher ? '' : ' OHNE WARNUNG'}: ${u.valuta} ${u.richtung === 'einnahme' ? '+' : '-'}${u.betragCent} „${u.gegen}“ (${u.grund})`);
  }
  for (const s of offenSoll) fehler.push(`${a.datei}: fehlt/abweichend: ${s.buchung} ${s.betrag} „${s.gegenpartei || ''}“`);
  if (!r.saldoStimmt) fehler.push(`${a.datei}: Saldo stimmt nicht (${JSON.stringify(r.warnungen)})`);
}
const pz = (k, n) => (n ? `${(100 * k / n).toFixed(1)} % (${k}/${n})` : '–');
const aus = {
  ordner,
  auszuege: z.auszuege,
  saldoStimmt: `${z.saldoStimmt}/${z.auszuege}`,
  saldenGelesenWieSoll: `${z.saldoWieSoll}/${z.auszuege}`,
  weicheParseBankauszugText: `${z.weicheAus}/${z.auszuege}`,
  umsaetzeSoll: z.soll, umsaetzeGelesen: z.gelesen,
  vollstaendigRichtig: pz(z.richtig, z.soll),
  falsch: z.falsch, falschOhneWarnung: z.falschOhneWarnung, fehlend: z.fehlend,
  unsicherMarkiert: z.unsicher, davonRichtig: z.richtigUnsicher,
  rechnungsnummern: { soll: z.renrSoll, gefunden: pz(z.renrGefunden, z.renrSoll), zusaetzlich: z.renrFalsch },
};
console.log(JSON.stringify(aus, null, 1));
if (zeigeFehler) console.log(fehler.join('\n'));
if (jsonZiel) writeFileSync(jsonZiel, JSON.stringify({ ...aus, fehler }, null, 1));

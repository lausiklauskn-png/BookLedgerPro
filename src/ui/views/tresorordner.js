// src/ui/views/tresorordner.js — Ansicht „Tresorordner“ (Schritt C/C2, Klaus 2026-10-27).
// Nur in der Android-App sichtbar (window.BLPNative.tresor). Der gemeinsame Ordner aller Pro-Apps: eigenes Fach
// (automatische Sicherung, Belege), Eingangsfach (von Private Brain Pro / Workflow PDF Pro), fremde Fächer nur lesend.
// Passwörter tippt man im nativen Dialog, nie hier. Suche über die Inhaltsverzeichnisse: Wortsuche wie bei den Belegen,
// Bedeutungssuche nur, wenn sie in den Einstellungen an ist (Vektoren bleiben im Speicher dieser Sitzung, nie im Netz).
//
// DOM/Brücke: in tests/smoke_tresorordner.mjs mit gestellter Brücke im echten Browser geprüft; die reine Logik
// (Suche, Sicherungsformat, Fälligkeit) node-getestet in tests/run.mjs. Am Gerät nicht gemessen.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { getSettings, navigate } from '../../state.js';
import { FAECHER, eintraegeSuchen, oeffenbar, istSicherung, sicherungLesen, fehlerText, bedeutungsText } from '../../domain/tresorordner.js';
import { cosinus } from '../../domain/belegsuche.js';
import { importSnapshot } from '../../core/backup.js';
import { merkeGeteilteDateien } from './documents.js';
import { belegeInsFach } from '../../core/tresorBelege.js';

let _host = null, _zustand = null, _faecher = [], _frage = '', _meldung = '', _teile = null, _laeuft = false;
const _vektoren = new Map();   // Eintrags-Kennung → Vektor (nur RAM)

const brueckeVon = () => (typeof window !== 'undefined' && window.BLPNative && window.BLPNative.tresor) || null;
export function tresorordnerVerfuegbar() { return !!brueckeVon(); }

export async function mountTresorordner(host) {
  _host = host; _frage = ''; _meldung = ''; _teile = null;
  await neuLaden();
}

async function neuLaden() {
  const b = brueckeVon();
  if (!b) { _zustand = null; return zeichnen(); }
  try { _zustand = await b.zustand(); } catch (e) { _zustand = { problem: String(e && e.message || e) }; }
  _faecher = [];
  if (_zustand && _zustand.offen) {
    for (const f of FAECHER) {
      try {
        const r = await b.verzeichnis(f.fach);
        _faecher.push({ ...f, eintraege: r.eintraege || [], marken: new Set(r.marken || []) });
      } catch (e) { _faecher.push({ ...f, eintraege: [], marken: new Set(), problem: fehlerText(e) }); }
    }
  }
  zeichnen();
}

async function tun(fn) {
  if (_laeuft) return;
  _laeuft = true; _meldung = '';
  try { const r = await fn(); if (r && r.abgebrochen) _meldung = ''; }
  catch (e) { _meldung = fehlerText(e); }
  finally { _laeuft = false; }
  await neuLaden();
}

const knopf = (text, onClick, extra = {}) => el('button', { class: 'btn' + (extra.primaer ? ' btn-primary' : ''), text, onClick, ...(extra.attr || {}) });
const datum = (ms) => { try { return new Date(ms).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; } };
const groesse = (n) => n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

function merkenFeld() {
  const box = el('input', { type: 'checkbox', 'data-tresor-merken': '' });
  return { box, label: el('label', { class: 'small' }, [box, ' ', t('tresor.merken')]) };
}

function statusKarte() {
  const b = brueckeVon(), z = _zustand || {};
  const kinder = [el('h2', { class: 'card-title', text: t('tresor.titel') }), el('p', { class: 'muted small', text: t('tresor.intro') })];
  if (!z.gewaehlt) {
    kinder.push(el('div', { class: 'btn-row' }, [knopf(t('tresor.waehlen'), () => tun(() => b.ordnerWaehlen()), { primaer: true, attr: { 'data-tresor-waehlen': '' } })]));
  } else if (z.erreichbar === false) {
    kinder.push(el('p', { 'data-tresor-problem': '', text: fehlerText(z.problem) }),
      el('div', { class: 'btn-row' }, [knopf(t('tresor.nochmal'), () => tun(async () => null)), knopf(t('tresor.andererOrdner'), () => tun(() => b.ordnerWaehlen()))]));
  } else if (!z.vorhanden) {
    const m = merkenFeld();
    kinder.push(el('p', { text: t('tresor.ordner').replace('{ordner}', z.ordner || '') }));
    if (z.istFachOrdner) kinder.push(el('p', { 'data-tresor-problem': '', text: fehlerText('TRESOR_ORDNER_IST_FACH') }));
    kinder.push(el('p', { class: 'muted small', text: t('tresor.anlegenHinweis') }), m.label,
      el('div', { class: 'btn-row' }, [
        knopf(t('tresor.anlegen'), () => tun(() => b.anlegen(m.box.checked)), { primaer: true, attr: { 'data-tresor-anlegen': '' } }),
        knopf(t('tresor.andererOrdner'), () => tun(() => b.ordnerWaehlen())),
      ]));
  } else if (!z.offen) {
    const m = merkenFeld();
    const teile = el('textarea', { rows: '5', 'data-tresor-teile': '', 'data-kein-mikro': '', placeholder: 'FPT1-…' });
    kinder.push(el('p', { text: t('tresor.ordner').replace('{ordner}', z.ordner || '') }), m.label,
      el('div', { class: 'btn-row' }, [
        knopf(t('tresor.entsperren'), () => tun(() => b.entsperren(m.box.checked)), { primaer: true, attr: { 'data-tresor-entsperren': '' } }),
        knopf(t('tresor.andererOrdner'), () => tun(() => b.ordnerWaehlen())),
      ]),
      el('details', {}, [el('summary', { text: t('tresor.vergessen') }),
        el('p', { class: 'muted small', text: t('tresor.vergessenHinweis') }), teile,
        el('div', { class: 'btn-row' }, [knopf(t('tresor.wiederherstellen'), () => tun(() => b.wiederherstellen(teile.value.split(/\n+/).map((s) => s.trim()).filter(Boolean))), { attr: { 'data-tresor-wiederherstellen': '' } })])]));
  } else {
    const letzte = b.letzteSicherung() || {};
    const ersatz = z.ersatz || {};
    kinder.push(el('p', { 'data-tresor-offen': '', text: t('tresor.offen').replace('{ordner}', z.ordner || '') }),
      el('p', { class: 'muted small', 'data-tresor-letzte': '', text: letzte.zeit ? t('tresor.letzteSicherung').replace('{zeit}', datum(letzte.zeit)) : t('tresor.nochKeineSicherung') }),
      ersatz.vorhanden ? el('p', { class: 'muted small', text: t('tresor.ersatzDa').replace('{zeit}', datum(ersatz.angelegt)) })
        : el('p', { 'data-tresor-ohne-ersatz': '', text: t('tresor.ersatzFehlt') }),
      el('div', { class: 'btn-row' }, [
        knopf(t('tresor.jetztSichern'), () => tun(async () => { const r = await b.sichern(); _meldung = r && r.gesichert ? t('tresor.gesichert') : (r && r.grund === 'unveraendert' ? t('tresor.unveraendert') : fehlerText(r && r.fehler)); return { abgebrochen: false }; }), { primaer: true, attr: { 'data-tresor-sichern': '' } }),
        knopf(t('tresor.belegeKopieren'), () => tun(async () => {
          const r = await belegeInsFach(b);
          _meldung = r.gesperrt ? t('tresor.belegeGesperrt') : t('tresor.belegeErgebnis').replace('{neu}', String(r.neu)).replace('{schon}', String(r.schon)).replace('{fehler}', String(r.fehler));
        }), { attr: { 'data-tresor-belege': '' } }),
        knopf(t('tresor.ersatzErstellen'), () => tun(async () => { const r = await b.ersatzErstellen(); _teile = r.teile; }), { attr: { 'data-tresor-ersatz': '' } }),
        knopf(t('tresor.passwortAendern'), () => tun(() => b.passwortAendern())),
        knopf(t('tresor.sperren'), () => tun(() => b.sperren(false)), { attr: { 'data-tresor-sperren': '' } }),
        knopf(t('tresor.geraetVergessen'), () => tun(() => b.sperren(true))),
      ]));
  }
  if (_meldung) kinder.push(el('p', { role: 'status', 'data-tresor-meldung': '', text: _meldung }));
  if (_teile) kinder.push(ersatzKarte(_teile));
  return el('div', { class: 'card', 'data-tresor-status': '' }, kinder);
}

function ersatzKarte(teile) {
  const text = teile.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return el('div', { class: 'card', 'data-tresor-ersatz-teile': '' }, [
    el('h3', { text: t('tresor.ersatzTitel') }),
    el('p', { class: 'small', text: t('tresor.ersatzHinweis') }),
    el('pre', { class: 'small', style: 'white-space:pre-wrap;word-break:break-all', text }),
    el('div', { class: 'btn-row' }, [
      knopf(t('tresor.ersatzSpeichern'), () => {
        const a = el('a', { href: URL.createObjectURL(new Blob([text + '\n'], { type: 'text/plain' })), download: 'tresorordner-ersatzschluessel.txt' });
        document.body.appendChild(a); a.click(); a.remove();
      }),
      knopf(t('tresor.ersatzFertig'), () => { _teile = null; zeichnen(); }),
    ]),
  ]);
}

async function bedeutungsTreffer(frage) {
  if (getSettings().bedeutungssuche !== 'an' || !frage.trim()) return [];
  let emb = window.__blpEmbedderStub || null;
  if (!emb) { const m = await import('../../sbkim/embed.js'); emb = await m.loadEmbedder({}); }
  const q = await emb.embedQuery(frage);
  const aus = [];
  for (const f of _faecher) for (const e of f.eintraege) {
    const key = f.fach + '|' + e.id;
    if (!_vektoren.has(key)) _vektoren.set(key, await emb.embedPassage(bedeutungsText(e)));
    aus.push({ fach: f.fach, eintrag: e, naehe: cosinus(q, _vektoren.get(key)) });
  }
  aus.sort((a, b) => b.naehe - a.naehe);
  return aus.filter((x) => x.naehe >= 0.8).slice(0, 12);
}

async function uebernehmen(fach, e) {
  const b = brueckeVon();
  const datei = await b.lesen(fach, e.id);
  await b.markieren(fach, e.id);
  merkeGeteilteDateien([datei]);
  navigate('documents');
}

async function ansehen(fach, e) {
  const datei = await brueckeVon().lesen(fach, e.id);
  await navigator.share({ files: [datei], title: e.name });
}

async function einspielen(fach, e, mitEinstellungen) {
  if (!confirm(mitEinstellungen ? t('tresor.einspielenErsetzenFrage') : t('tresor.einspielenFrage'))) return;
  const datei = await brueckeVon().lesen(fach, e.id);
  const s = sicherungLesen(await datei.text());
  const r = await importSnapshot(s, mitEinstellungen ? 'replace' : 'merge');
  _meldung = t('tresor.eingespielt').replace('{records}', String(r.records)).replace('{files}', String(r.files));
}

function eintragZeile(f, e, ausschnittText) {
  const uebernommen = f.marken && f.marken.has(e.id);
  const knoepfe = [];
  if (oeffenbar(e) && istSicherung(e)) {
    knoepfe.push(knopf(t('tresor.einspielen'), () => tun(() => einspielen(f.fach, e, false)), { attr: { 'data-tresor-einspielen': '' } }));
    knoepfe.push(knopf(t('tresor.einspielenErsetzen'), () => tun(() => einspielen(f.fach, e, true))));
  } else if (oeffenbar(e)) {
    if (f.fach !== 'bookledgerpro') knoepfe.push(knopf(uebernommen ? t('tresor.nochmalUebernehmen') : t('tresor.uebernehmen'), () => tun(() => uebernehmen(f.fach, e)), { attr: { 'data-tresor-uebernehmen': e.id } }));
    if (navigator.share) knoepfe.push(knopf(t('tresor.ansehen'), () => tun(() => ansehen(f.fach, e))));
  } else {
    knoepfe.push(el('span', { class: 'muted small', text: t('tresor.nurInApp') }));
  }
  return el('li', { class: 'tresor-eintrag', style: 'overflow-wrap:anywhere;min-width:0', 'data-tresor-eintrag': e.id, 'data-fach': f.fach }, [
    el('div', {}, [el('strong', { text: e.name, style: 'overflow-wrap:anywhere' }), ' ', el('span', { class: 'muted small', text: `${datum(e.datum)} · ${groesse(e.groesse)}` }),
      uebernommen ? el('span', { class: 'badge', 'data-tresor-uebernommen': '', text: ' ✓ ' + t('tresor.uebernommen') }) : null]),
    ausschnittText ? el('div', { class: 'muted small', text: ausschnittText }) : null,
    knoepfe.length ? el('div', { class: 'btn-row' }, knoepfe) : null,
  ]);
}

function suchKarte(ergebnis) {
  const feld = el('input', { type: 'search', value: _frage, placeholder: t('tresor.suchen'), 'data-tresor-suche': '', 'aria-label': t('tresor.suchen') });
  const los = () => { _frage = feld.value; zeichnen(true); };
  feld.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') los(); });
  return el('div', { class: 'card' }, [
    el('div', { class: 'btn-row' }, [feld, knopf(t('tresor.suchenKnopf'), los)]),
    ergebnis,
  ]);
}

function zeichnen(suchen = false) {
  if (!_host) return;
  const b = brueckeVon();
  if (!b) return mount(_host, el('div', { class: 'card' }, [el('h2', { class: 'card-title', text: t('tresor.titel') }), el('p', { text: t('tresor.nurApp') })]));
  const teile = [statusKarte()];
  if (_zustand && _zustand.offen) {
    const ergebnis = el('div', { 'data-tresor-treffer': '' });
    teile.push(suchKarte(ergebnis));
    if (_frage.trim()) {
      const woerter = eintraegeSuchen(_faecher, _frage);
      const liste = el('ul', { class: 'tresor-liste' }, woerter.map((x) => eintragZeile(_faecher.find((f) => f.fach === x.fach), x.eintrag, x.ausschnitt)));
      ergebnis.appendChild(el('p', { class: 'muted small', text: t('tresor.treffer').replace('{n}', String(woerter.length)) }));
      ergebnis.appendChild(liste);
      if (suchen && getSettings().bedeutungssuche === 'an') {
        const bed = el('div', { 'data-tresor-bedeutung': '' }, [el('p', { class: 'muted small', text: t('tresor.bedeutungLaeuft') })]);
        ergebnis.appendChild(bed);
        bedeutungsTreffer(_frage).then((tr) => {
          const schon = new Set(woerter.map((x) => x.fach + '|' + x.eintrag.id));
          const neu = tr.filter((x) => !schon.has(x.fach + '|' + x.eintrag.id));
          mount(bed, el('div', {}, [el('p', { class: 'muted small', text: t('tresor.bedeutungTreffer').replace('{n}', String(neu.length)) }),
            el('ul', { class: 'tresor-liste' }, neu.map((x) => eintragZeile(_faecher.find((f) => f.fach === x.fach), x.eintrag, '🧠 ' + (x.eintrag.auszug || ''))))]));
        }).catch(() => mount(bed, el('p', { class: 'muted small', text: t('tresor.bedeutungFehlt') })));
      }
    }
    for (const f of _faecher) {
      const neueste = [...f.eintraege].sort((a, c) => (c.datum || 0) - (a.datum || 0));
      teile.push(el('details', { class: 'card', 'data-tresor-fach': f.fach, open: f.eingang ? true : null }, [
        el('summary', { text: `${f.ordner} · ${f.eintraege.length}` + (f.eigen ? ' · ' + t('tresor.eigenesFach') : f.eingang ? ' · ' + t('tresor.eingangFach') : ' · ' + t('tresor.nurLesen')) }),
        f.problem ? el('p', { 'data-tresor-problem': '', text: f.problem }) : null,
        el('ul', { class: 'tresor-liste' }, neueste.slice(0, 50).map((e) => eintragZeile(f, e, e.auszug))),
        neueste.length > 50 ? el('p', { class: 'muted small', text: t('tresor.mehr').replace('{n}', String(neueste.length - 50)) }) : null,
      ]));
    }
  }
  mount(_host, el('div', { class: 'tresorordner', 'data-tresorordner': '' }, teile));
}

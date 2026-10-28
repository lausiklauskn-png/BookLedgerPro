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
import { FAECHER, eintraegeSuchen, oeffenbar, istSicherung, sicherungLesen, fehlerText, bedeutungsText, uebernehmbar, neueEintraege, unterordnerGruppen, appFuer } from '../../domain/tresorordner.js';
import { cosinus } from '../../domain/belegsuche.js';
import { importSnapshot } from '../../core/backup.js';
import { merkeGeteilteDateien } from './documents.js';
import { belegeInsFach } from '../../core/tresorBelege.js';

let _host = null, _zustand = null, _faecher = [], _frage = '', _meldung = '', _teile = null, _laeuft = false;
const _wahl = new Map();          // 4 · Mehrfach-Übernahme: 'fach|id' → {fach, eintrag}
let _alleOffen = null;            // 2 · „Alle auf / Alle zu“: null = Vorgabe (Eingang offen)
const _vektoren = new Map();   // Eintrags-Kennung → Vektor (nur RAM)

const brueckeVon = () => (typeof window !== 'undefined' && window.BLPNative && window.BLPNative.tresor) || null;
export function tresorordnerVerfuegbar() { return !!brueckeVon(); }

export async function mountTresorordner(host) {
  _host = host; _frage = ''; _meldung = ''; _teile = null; _wahl.clear();
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

async function uebernehmen(fach, e) { return uebernehmenViele([{ fach, eintrag: e }]); }

// 4 · Mehrere auf einmal: alle lesen, dann markieren, dann gemeinsam an die Belege (derselbe Weg wie „Teilen“).
// Scheitert eine Datei, wird nichts markiert und nichts übergeben — die Meldung nennt sie.
async function uebernehmenViele(liste) {
  const b = brueckeVon(), dateien = [];
  for (const x of liste) {
    try { dateien.push(await b.lesen(x.fach, x.eintrag.id)); }
    catch (e) { throw new Error(t('tresor.uebernehmenFehler').replace('{name}', x.eintrag.name || '') + ' ' + fehlerText(e)); }
  }
  for (const x of liste) await b.markieren(x.fach, x.eintrag.id);
  _wahl.clear();
  merkeGeteilteDateien(dateien);
  navigate('documents');
}

// 3 · „In ‹App› öffnen“: startet die andere Pro-App (feste Liste in Java), übergeben wird nichts.
async function inAppOeffnen(app) {
  try { await brueckeVon().appOeffnen(app.app); }
  catch (e) { _meldung = /APP_FEHLT/.test(String((e && (e.code || e.message)) || e)) ? t('tresor.appFehlt').replace('{app}', app.name) : fehlerText(e); zeichnen(); }
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
    const app = appFuer(f, e);
    if (app && brueckeVon().appOeffnen) knoepfe.push(knopf(t('tresor.inAppOeffnen').replace('{app}', app.name), () => inAppOeffnen(app), { attr: { 'data-tresor-app': app.app } }));
    else knoepfe.push(el('span', { class: 'muted small', text: t('tresor.nurInApp') }));
  }
  // 4 · Auswahl für die Mehrfach-Übernahme (nur, was BookLedgerPro übernehmen kann).
  const key = f.fach + '|' + e.id;
  const wahl = uebernehmbar(f, e) ? el('input', { type: 'checkbox', 'data-tresor-wahl': e.id, 'aria-label': t('tresor.waehlenEintrag').replace('{name}', e.name || ''),
    checked: _wahl.has(key) ? true : null, onChange: (ev) => { if (ev.target.checked) _wahl.set(key, { fach: f.fach, eintrag: e }); else _wahl.delete(key); wahlLeiste(); } }) : null;
  return el('li', { class: 'tresor-eintrag', style: 'overflow-wrap:anywhere;min-width:0', 'data-tresor-eintrag': e.id, 'data-fach': f.fach }, [
    el('div', {}, [wahl, wahl ? ' ' : null, el('strong', { text: e.name, style: 'overflow-wrap:anywhere' }), ' ', el('span', { class: 'muted small', text: `${datum(e.datum)} · ${groesse(e.groesse)}` }),
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
    // 1 · Neu im Tresorordner: was BookLedgerPro übernehmen kann und noch nicht übernommen hat.
    const neu = neueEintraege(_faecher);
    if (neu.length) {
      teile.push(el('div', { class: 'card', 'data-tresor-neu': String(neu.length) }, [
        el('h3', { text: t('tresor.neuTitel').replace('{n}', String(neu.length)) }),
        el('ul', { class: 'tresor-liste' }, neu.slice(0, 20).map((x) => eintragZeile(_faecher.find((f) => f.fach === x.fach), x.eintrag, x.eintrag.auszug))),
        el('div', { class: 'btn-row' }, [knopf(t('tresor.alleNeuUebernehmen').replace('{n}', String(neu.length)), () => tun(() => uebernehmenViele(neu)), { primaer: true, attr: { 'data-tresor-alle-neu': '' } })]),
      ]));
    }
    // 2 · Fächer als Baum (Fach › Unterordner › Einträge), „Alle auf / Alle zu“.
    teile.push(el('div', { class: 'btn-row', 'data-tresor-baum-knoepfe': '' }, [
      knopf(t('tresor.alleAuf'), () => { _alleOffen = true; zeichnen(); }, { attr: { 'data-tresor-alle-auf': '' } }),
      knopf(t('tresor.alleZu'), () => { _alleOffen = false; zeichnen(); }, { attr: { 'data-tresor-alle-zu': '' } }),
    ]));
    const offenVorgabe = (f) => (_alleOffen === null ? (f.eingang ? true : null) : (_alleOffen ? true : null));
    for (const f of _faecher) {
      const gruppen = unterordnerGruppen(f.eintraege);
      const liste = (eintraege) => [el('ul', { class: 'tresor-liste' }, eintraege.slice(0, 50).map((e) => eintragZeile(f, e, e.auszug))),
        eintraege.length > 50 ? el('p', { class: 'muted small', text: t('tresor.mehr').replace('{n}', String(eintraege.length - 50)) }) : null];
      teile.push(el('details', { class: 'card', 'data-tresor-fach': f.fach, open: offenVorgabe(f) }, [
        el('summary', { text: `${f.ordner} · ${f.eintraege.length}` + (f.eigen ? ' · ' + t('tresor.eigenesFach') : f.eingang ? ' · ' + t('tresor.eingangFach') : ' · ' + t('tresor.nurLesen')) }),
        f.problem ? el('p', { 'data-tresor-problem': '', text: f.problem }) : null,
        ...gruppen.flatMap((g) => g.ordner === '' ? liste(g.eintraege)
          : [el('details', { class: 'tresor-unter', 'data-tresor-unter': g.ordner, open: _alleOffen === false ? null : true }, [
              el('summary', { text: `${g.ordner} · ${g.eintraege.length}` }), ...liste(g.eintraege)])]),
      ]));
    }
    // 4 · Leiste für die Auswahl: erscheint, sobald etwas gewählt ist.
    teile.push(el('div', { class: 'card tresor-wahl-leiste', 'data-tresor-wahl-leiste': '', hidden: true }));
  }
  mount(_host, el('div', { class: 'tresorordner', 'data-tresorordner': '' }, teile));
  wahlLeiste();
}

function wahlLeiste() {
  const leiste = _host && _host.querySelector('[data-tresor-wahl-leiste]');
  if (!leiste) return;
  leiste.hidden = _wahl.size === 0;
  leiste.replaceChildren(...(_wahl.size ? [el('div', { class: 'btn-row' }, [
    el('span', { class: 'small', text: t('tresor.ausgewaehlt').replace('{n}', String(_wahl.size)) }),
    knopf(t('tresor.auswahlUebernehmen').replace('{n}', String(_wahl.size)), () => tun(() => uebernehmenViele([..._wahl.values()])), { primaer: true, attr: { 'data-tresor-auswahl-uebernehmen': '' } }),
    knopf(t('tresor.auswahlAufheben'), () => { _wahl.clear(); zeichnen(); }),
  ])] : []));
  // Checkboxen in Such- und Fach-Liste gleich halten (derselbe Eintrag kann zweimal stehen).
  for (const box of _host.querySelectorAll('[data-tresor-wahl]')) {
    const li = box.closest('[data-tresor-eintrag]'); const key = li && (li.dataset.fach + '|' + li.dataset.tresorEintrag);
    if (key) box.checked = _wahl.has(key);
  }
}

/** 1 · Zahl der neuen Einträge im Tresorordner (für Belege und Einstellungen). 0 ohne Brücke, gesperrt oder bei Fehler. */
export async function neuImTresorordner() {
  const b = brueckeVon(); if (!b) return 0;
  try {
    const z = await b.zustand(); if (!z || !z.offen) return 0;
    const faecher = [];
    for (const f of FAECHER) {
      if (f.eigen) continue;
      try { const r = await b.verzeichnis(f.fach); faecher.push({ ...f, eintraege: r.eintraege || [], marken: new Set(r.marken || []) }); } catch { /* Fach fehlt */ }
    }
    return neueEintraege(faecher).length;
  } catch { return 0; }
}

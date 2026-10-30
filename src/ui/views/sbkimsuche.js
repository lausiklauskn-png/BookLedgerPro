// src/ui/views/sbkimsuche.js — „Überall suchen“ (Pro-Umbau 11, Klaus 2026-10-30, Ja zu m1/m4/m5/m7/m12).
// Die frühere Seite „SBKIM-Suche“ (Konten + drei feste Knoten-Sporen) ist weg: die Kontosuche ist ein Knopf „Passendes Konto
// finden“ in „Neue Buchung“ und bei den Konten (src/ui/kontoFinden.js), die Knoten findet man im Mycel-Fenster. Der Schlüssel der
// Ansicht bleibt `sbkimsuche` (Menü, Modi, alte Lesezeichen), Beschriftung „Überall suchen“.
//
// Eine Suche, eine Liste, jede Zeile mit Herkunft:
//   • diese App — Belege (Name + erkannter Text, verschlüsselt am Beleg), Buchungen, Kunden, Aufträge
//   • Angebotsplaner und Bedarfsanalyse — die eingebetteten Apps (gleicher Ursprung, ihre Datenbanken nur gelesen)
//   • Tresorordner — die Fächer aller Pro-Apps auf diesem Gerät (nur in der App, verschlüsselt, ohne Internet; Klaus m5)
//   • Netz — andere Arbeitsplätze im Mycel, nur wenn eingeschaltet und verbunden (Klaus m6: für alle da, jeder schaltet selbst)
// Die KI-Prüfung ist nur ein Schalter unter der Liste (m12, aus): mit Mistral-Schlüssel liest sie Titel und Fundstelle.
//
// Reine Logik in src/domain/ueberall.js (node-geprüft), Browser-Probe tests/smoke_umbau11.mjs.

import { el, mount } from '../dom.js';
import { t, tOpt } from '../i18n.js';
import { getSettings, navigate } from '../../state.js';
import { listBelege, getBelegText } from '../../domain/documents.js';
import { listBuchungen } from '../../domain/store.js';
import { listAuftraege, listKunden } from '../../domain/crm-store.js';
import { suchwoerter, wortTreffer, ausschnitt, eintragText } from '../../domain/belegsuche.js';
import { appsSuchen, gruppieren, netzZeilen, kiKandidaten } from '../../domain/ueberall.js';
import { FAECHER, eintraegeSuchen } from '../../domain/tresorordner.js';
import { netzFragen, mycelFensterOeffnen } from '../../sbkim/netz.js';
import { getAiConfig } from '../../ai/aiConfig.js';
import { hybridMatch } from '../../sbkim/match.js';
import { belegVorschau } from '../belegVorschau.js';

const MERK = 'blpr_ueberall_v1';   // gewählte Quellen (nur Komfort, localStorage)
let _host = null, _frage = '', _laeuft = false, _treffer = [], _netzInfo = '', _netzZu = false, _ki = null;

const tresor = () => (typeof window !== 'undefined' && window.BLPNative && window.BLPNative.tresor) || null;

function quellenLesen() {
  const v = { app: true, apps: true, tresor: true, netz: false };
  try { Object.assign(v, JSON.parse(localStorage.getItem(MERK) || '{}')); } catch { /* Vorgabe */ }
  return v;
}
function quellenMerken(q) { try { localStorage.setItem(MERK, JSON.stringify(q)); } catch { /* egal */ } }

export async function mountSbkimSuche(host) {
  _kiHost = null;
  _host = host; _frage = ''; _treffer = []; _netzInfo = ''; _netzZu = false; _ki = null;
  if (gemeinsamerKasten()) return;
  zeichnen();
}

// ── Pro-Umbau 13 (Brief 13, Aufgabe 3): in der App derselbe Kasten wie in Private Brain Pro und Workflow PDF Pro (gemeinsamer
// Baustein native/pro-ueberall.js, Quelle Private Brain Pro, Fassung 2). BookLedgerPro gibt nur seine Quellen dazu: Belege,
// Buchungen, Kunden, Aufträge (Gruppe „BookLedgerPro“) und Angebotsplaner/Bedarfsanalyse (eigene Gruppen über `gruppe`), die
// Tresor-Brücke (BLPNative.tresor) und das Öffnen. Die KI-Prüfung (Klaus m12) hängt über nachSuche unter der Liste.
// Ohne den Baustein (PWA, BookLedger Basic) bleibt die eigene Fassung unten.
function gemeinsamerKasten() {
  const U = typeof window !== 'undefined' ? window.ProUeberall : null;
  if (!U || !window.ProBedienung || typeof U.kasten !== 'function' || !(U.FASSUNG >= 2)) return false;
  const b = tresor();
  const k = U.kasten({
    appName: 'BookLedgerPro', appLabel: t('ue.q.app') + ' · ' + t('ue.q.apps'),
    app: async (frage) => [...await suchenApp(frage), ...(await suchenApps(frage)).map((z) => ({ ...z, herkunft: 'app', gruppe: t('ue.herkunft.' + z.herkunft), quelle: z.herkunft }))],
    tresor: b && typeof b.verzeichnis === 'function' ? () => ({ zustand: () => b.zustand(), fach: (fach) => b.verzeichnis(fach) }) : null,
    tresorOhne: ['bookledgerpro'],
    netz: () => window.SbkimRendezvous || null,
    mycelOeffnen: () => mycelFensterOeffnen(),
    kannOeffnen: (z) => z.herkunft === 'app' || (z.herkunft === 'tresor' && z.typ === 'eingang-bookledgerpro'),
    oeffnen: (z) => oeffnen(z.herkunft === 'app' && z.quelle ? { ...z, herkunft: z.quelle } : z),
    nachSuche: (erg, frage) => { _treffer = erg.treffer.filter((z) => z.herkunft !== 'netz'); _frage = frage; _ki = null; kiZeichnen(); },
  });
  k.element.id = 'blpUeberall'; k.element.classList.add('card');
  if (k.eingabe) { k.eingabe.setAttribute('data-mikro', ''); k.eingabe.setAttribute('data-mikro-key', 'ueberall'); k.eingabe.setAttribute('data-ue-frage', ''); }
  _kiHost = el('div', { 'data-ue-ki-bereich': '' });
  mount(_host, el('section', { class: 'view' }, [el('h1', { text: t('ue.titel') }), k.element, _kiHost]));
  return true;
}
let _kiHost = null;
function kiZeichnen() {
  if (!_kiHost) return zeichnen();
  if (!_treffer.length) { _kiHost.replaceChildren(); return; }
  const kiSchalter = el('input', { type: 'checkbox', role: 'switch', 'data-ue-ki-schalter': '' });
  kiSchalter.checked = !!_ki;
  kiSchalter.addEventListener('change', () => kiPruefen(kiSchalter));
  const passt = _ki && _ki.passt ? [..._ki.passt.values()] : [];
  _kiHost.replaceChildren(el('div', { class: 'card' }, [
    el('label', { class: 'ue-ki-zeile' }, [kiSchalter, el('span', { text: t('ue.kiSchalter') })]),
    _ki && _ki.laeuft ? el('p', { class: 'muted small', text: t('ue.kiLaeuft') }) : null,
    _ki && _ki.hinweis ? el('p', { class: 'muted small', 'data-ue-ki-hinweis': '', text: _ki.hinweis }) : null,
    _ki && _ki.passt ? el('p', { class: 'muted small', text: t('ue.kiErgebnis').replace('{n}', String(_ki.passt.size)) + (_ki.aus ? ' · ' + t('ue.kiAus').replace('{n}', String(_ki.aus)) : '') }) : null,
    passt.length ? el('ul', { class: 'ue-ul', 'data-ue-ki-liste': '' }, passt.map((v) => el('li', { class: 'ue-zeile', 'data-ue-ki': 'passt' }, [
      el('span', { class: 'ue-name', text: v.label || '' }), v.begruendung ? el('span', { class: 'small ue-ki', text: v.begruendung }) : null].filter(Boolean)))) : null,
  ].filter(Boolean)));
}

// ── Lesen der eingebetteten Apps (gleicher Ursprung). Öffnet die Datenbank NUR, wenn es sie schon gibt — ein onupgradeneeded
// bedeutet „neu“: dann bricht der Lauf ab, statt eine leere Datenbank für die App anzulegen.
function dbLesen(name, faecher) {
  return new Promise((ok) => {
    if (typeof indexedDB === 'undefined') return ok({});
    let neu = false;
    let r;
    try { r = indexedDB.open(name); } catch { return ok({}); }
    r.onupgradeneeded = () => { neu = true; try { r.transaction.abort(); } catch { /* egal */ } };
    r.onerror = () => ok({});
    r.onblocked = () => ok({});
    r.onsuccess = () => {
      const db = r.result;
      if (neu) { db.close(); return ok({}); }
      const da = faecher.filter((f) => db.objectStoreNames.contains(f));
      if (!da.length) { db.close(); return ok({}); }
      const aus = {};
      const tx = db.transaction(da, 'readonly');
      for (const f of da) { const q = tx.objectStore(f).getAll(); q.onsuccess = () => { aus[f] = q.result || []; }; }
      tx.oncomplete = () => { db.close(); ok(aus); };
      tx.onerror = () => { db.close(); ok(aus); };
    };
  });
}

async function suchenApp(frage) {
  const woerter = suchwoerter(frage);
  if (!woerter.length) return [];
  const aus = [];
  for (const b of await listBelege().catch(() => [])) {
    const text = (b.textZeichen || 0) > 0 ? await getBelegText(b.id).catch(() => '') : '';
    if (wortTreffer(b.name + ' ' + text, woerter)) aus.push({ herkunft: 'app', typ: 'beleg', id: b.id, name: b.name, stelle: ausschnitt(text || b.name, woerter), meta: b });
  }
  const [buchungen, kunden, auftraege] = await Promise.all([listBuchungen().catch(() => []), listKunden().catch(() => []), listAuftraege().catch(() => [])]);
  for (const [typ, liste] of [['buchung', buchungen], ['kunde', kunden], ['auftrag', auftraege]]) {
    for (const e of liste) {
      const text = eintragText(typ, e);
      if (wortTreffer(text, woerter)) aus.push({ herkunft: 'app', typ, id: e.id, name: (typ === 'buchung' ? (e.beschreibung || e.datum) : typ === 'kunde' ? e.name : (e.titel || e.nr)) || '', stelle: ausschnitt(text, woerter) });
    }
  }
  return aus;
}

async function suchenApps(frage) {
  const [c, n] = await Promise.all([dbLesen('WorkflowCalculate1', ['angebote', 'kunden']), dbLesen('WorkflowNeeds1', ['vorgaenge'])]);
  return appsSuchen({ angebote: c.angebote, kunden: c.kunden, vorgaenge: n.vorgaenge }, frage);
}

async function suchenTresor(frage) {
  const b = tresor();
  if (!b) return { treffer: [], hinweis: '' };
  let z = null;
  try { z = await b.zustand(); } catch { /* unten */ }
  if (!z || !z.offen) return { treffer: [], hinweis: t('ue.tresorZu') };
  const faecher = [];
  for (const f of FAECHER) { try { const r = await b.verzeichnis(f.fach); faecher.push({ ...f, eintraege: r.eintraege || [] }); } catch { /* Fach fehlt */ } }
  return { treffer: eintraegeSuchen(faecher, frage).map((x) => ({ herkunft: 'tresor', typ: x.fach, id: x.eintrag.id, name: x.eintrag.name || x.eintrag.id,
    stelle: (FAECHER.find((f) => f.fach === x.fach) || {}).ordner + (x.ausschnitt ? ' · ' + x.ausschnitt : '') })), hinweis: '' };
}

const zeichnenAlt = (...a) => zeichnen(...a);
async function suchen() {
  const frage = _frage.trim();
  if (!frage || _laeuft) return;
  const q = quellenLesen();
  _laeuft = true; _treffer = []; _netzInfo = ''; _netzZu = false; _ki = null;
  zeichnen(t('ue.sucht'));
  let status;
  try {
    const teile = await Promise.all([
      q.app ? suchenApp(frage) : [],
      q.apps ? suchenApps(frage) : [],
      q.tresor && tresor() ? suchenTresor(frage) : { treffer: [], hinweis: '' },
    ]);
    _treffer = [...teile[0], ...teile[1], ...teile[2].treffer];
    status = teile[2].hinweis || undefined;
    if (q.netz) {
      zeichnen(t('ue.fragtNetz'));
      const n = await netzFragen(frage);
      if (!n.ok) { _netzZu = n.reason !== 'nicht-geladen'; _netzInfo = _netzZu ? t('ue.netzZu') : t('ue.netzFehlt'); }
      else if (!n.knoten) _netzInfo = t('ue.netzLeer');
      else { const z = netzZeilen(n.antworten); _treffer.push(...z); _netzInfo = t('ue.netzAntworten').replace('{n}', String(n.knoten)).replace('{z}', String(z.length)); }
    }
  } catch (e) {
    status = t('ue.fehler').replace('{e}', String((e && e.message) || e));
  } finally { _laeuft = false; }
  zeichnen(status);
}

async function kiPruefen(schalter) {
  const zeichnen = _kiHost ? kiZeichnen : zeichnenAlt;
  if (!schalter.checked) { _ki = null; return zeichnen(); }
  const cfg = await getAiConfig().catch(() => ({}));
  if (!cfg.mistralKey) { _ki = { hinweis: t('ue.kiOhneSchluessel') }; return zeichnen(); }
  _ki = { laeuft: true }; zeichnen();
  const r = await hybridMatch({ text: _frage.trim(), label: 'BookLedgerPro' }, kiKandidaten(_treffer),
    { apiKey: cfg.mistralKey, provider: 'mistral', euOnly: true, model: cfg.mistralModel }).catch((e) => ({ available: false, reason: String(e && e.message || e) }));
  if (!r || !r.available) { _ki = { hinweis: t('ue.kiNichtDa').replace('{r}', (r && r.reason) || '') }; return zeichnen(); }
  const passt = new Map((r.verdicts || []).filter((v) => v.passt).map((v) => [v.anchorId || v.label, v]));
  _ki = { passt, aus: (r.verdicts || []).filter((v) => v.ausgeschlossen).length };
  zeichnen();
}

function oeffnen(z) {
  if (z.herkunft === 'app' && z.typ === 'beleg' && z.meta) return belegVorschau(z.meta);
  const ziel = { buchung: 'journal', kunde: 'customers', auftrag: 'orders' }[z.typ] || { calculate: 'calculate', needs: 'needs', tresor: 'tresorordner' }[z.herkunft];
  if (ziel) navigate(ziel);
}

function zeile(z) {
  const v = _ki && _ki.passt ? _ki.passt.get(z.herkunft + ':' + z.typ + ':' + z.id) : null;
  const kopf = z.herkunft === 'netz'
    ? el('span', { class: 'ue-name', text: z.name })
    : el('button', { class: 'btn-link ue-name', type: 'button', text: z.name || '—', onClick: () => oeffnen(z) });
  return el('li', { class: 'ue-zeile', 'data-ue-herkunft': z.herkunft, 'data-ue-typ': z.typ, ...(v ? { 'data-ue-ki': 'passt' } : {}) }, [
    kopf,
    el('span', { class: 'muted small ue-art', text: tOpt('ue.typ.' + z.typ) || '' }),
    z.stelle ? el('span', { class: 'muted small ue-stelle', text: z.herkunft === 'netz' ? t('ue.vonKnoten').replace('{k}', z.knoten || '?') + (z.bestaetigt ? '' : ' · ' + t('ue.unbestaetigt')) : z.stelle }) : null,
    v && v.begruendung ? el('span', { class: 'small ue-ki', text: v.begruendung }) : null,
  ].filter(Boolean));
}

function zeichnen(status) {
  const q = quellenLesen();
  const input = el('input', { type: 'search', class: 'beleg-text', 'data-ue-frage': '', placeholder: t('ue.platzhalter'), value: _frage, 'data-mikro': '', 'data-mikro-key': 'ueberall', 'aria-label': t('ue.titel') });
  input.addEventListener('input', () => { _frage = input.value; });
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); suchen(); } });
  const knopf = el('button', { class: 'btn btn-primary', type: 'button', 'data-ue-suchen': '', text: t('ue.suchen'), onClick: () => suchen() });
  if (_laeuft) knopf.setAttribute('disabled', '');

  const haken = (k, label, sichtbar = true) => {
    if (!sichtbar) return null;
    const cb = el('input', { type: 'checkbox', 'data-ue-quelle': k });
    cb.checked = !!q[k];
    cb.addEventListener('change', () => { const n = quellenLesen(); n[k] = cb.checked; quellenMerken(n); });
    return el('label', { class: 'ue-quelle' }, [cb, el('span', { text: label })]);
  };

  const gruppen = gruppieren(_treffer);
  const liste = el('div', { class: 'ue-liste', 'data-ue-liste': '' }, gruppen.map((g) => el('section', { class: 'ue-gruppe', 'data-ue-gruppe': g.herkunft }, [
    el('h3', { class: 'ue-gruppe-titel', text: t('ue.herkunft.' + g.herkunft) + ' · ' + g.liste.length }),
    el('ul', { class: 'ue-ul' }, g.liste.map(zeile)),
  ])));

  const kiSchalter = el('input', { type: 'checkbox', role: 'switch', 'data-ue-ki-schalter': '' });
  kiSchalter.checked = !!_ki;
  kiSchalter.addEventListener('change', () => kiPruefen(kiSchalter));

  const fertig = !_laeuft && _frage.trim() && (_treffer.length || _netzInfo || status === undefined);
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('ue.titel') }),
    el('div', { class: 'card', 'data-ue-karte': '' }, [
      el('h2', { class: 'card-title', text: t('ue.titel') }),
      el('p', { class: 'ue-kurz', 'data-ue-kurz': '', text: t('ue.kurz') }),
      el('details', { class: 'ue-mehr', 'data-ue-mehr': '' }, [el('summary', { text: t('ue.mehrDazu') }), el('p', { class: 'small', text: t('ue.mehrText') }), el('p', { class: 'small', text: t('ue.mehrNetz') })]),
      el('div', { class: 'ue-feld' }, [input, knopf]),
      el('div', { class: 'ue-quellen', 'data-ue-quellen': '' }, [
        haken('app', t('ue.q.app')),
        haken('apps', t('ue.q.apps')),
        haken('tresor', t('ue.q.tresor'), !!tresor()),
        haken('netz', t('ue.q.netz')),
      ].filter(Boolean)),
      status ? el('p', { class: 'muted small', 'data-ue-status': '', role: 'status', text: status }) : null,
      _netzInfo ? el('p', { class: 'muted small', 'data-ue-netzinfo': '' }, [el('span', { text: _netzInfo + ' ' }),
        _netzZu ? el('button', { class: 'btn btn-sm', type: 'button', text: t('ue.mycelOeffnen'), onClick: () => mycelFensterOeffnen() }) : null].filter(Boolean)) : null,
    ].filter(Boolean)),
    _frage.trim() && !_laeuft && _treffer.length === 0 && fertig ? el('p', { class: 'muted', 'data-ue-leer': '', text: t('ue.nichts') }) : null,
    _treffer.length ? el('div', { class: 'card' }, [
      el('h2', { class: 'card-title', text: t('ue.ergebnis').replace('{n}', String(_treffer.length)) }),
      liste,
      el('label', { class: 'ue-ki-zeile' }, [kiSchalter, el('span', { text: t('ue.kiSchalter') })]),
      _ki && _ki.laeuft ? el('p', { class: 'muted small', text: t('ue.kiLaeuft') }) : null,
      _ki && _ki.hinweis ? el('p', { class: 'muted small', 'data-ue-ki-hinweis': '', text: _ki.hinweis }) : null,
      _ki && _ki.passt ? el('p', { class: 'muted small', text: t('ue.kiErgebnis').replace('{n}', String(_ki.passt.size)) + (_ki.aus ? ' · ' + t('ue.kiAus').replace('{n}', String(_ki.aus)) : '') }) : null,
    ].filter(Boolean)) : null,
  ].filter(Boolean)));
}

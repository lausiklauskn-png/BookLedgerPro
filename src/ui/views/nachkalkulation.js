// src/ui/views/nachkalkulation.js
// BAUPLAN Block 2 / Schritt „Nachkalkulation/Kostenträger + Kalibrierung — UI".
// Grundlage: docs/KALKULATION_KATALOG.md §5.1 (USP „selbstlernende Kalkulation": Vor- gegen
// Nachkalkulation) + §5.3 (Trefferquote je Preisniveau) + §6 (Auftrags-Kostenträger).
//
// WAS DAS IST: die reine ANZEIGE über der bereits fertigen, node-getesteten Logik —
//   - domain/nachkalkulation.js (#130): Soll/Ist je Kostenträger.
//   - domain/kalibrierung.js   (#131): Korrekturfaktoren + Trefferquote.
//   - domain/nachkalkulation-store.js: gemeinsame Datensammlung (Buchungen/Zeit/Angebote).
//
// PRIME DIRECTIVE (Katalog §0): Soll/Ist, Selbstkosten, Faktoren, Margen und Trefferquoten
// sind REIN INTERN. Diese Ansicht zeigt sie nur an — sie druckt/exportiert/sendet NICHTS
// nach außen. (Auch keine KI: der pseudonyme Digest bleibt ungenutzt.)
//
// EHRLICHE GRENZE: DOM/IndexedDB → in der Build-Umgebung NICHT headless getestet
// (statisch geprüft). Die reine Logik darunter ist node-getestet.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { formatDauer } from '../../domain/employees.js';
import { KOSTENART_LISTE } from '../../domain/kalkulation.js';
import { PREISNIVEAU_LISTE } from '../../domain/kalibrierung.js';
import { nachkalkulationUebersicht, ladeZeitZuordnung, zuordneZeit } from '../../domain/nachkalkulation-store.js';
import { emptyState } from '../empty.js';

let _host = null;
let _daten = null;
let _zeit = null;    // { zeiten, mitarbeiterIndex, kostentraeger } für die Zeit-Zuordnung
let _selId = null;   // id des gewählten Kostenträgers (Angebot)

export async function mountNachkalkulation(host) {
  _host = host;
  [_daten, _zeit] = await Promise.all([nachkalkulationUebersicht(), ladeZeitZuordnung()]);
  if (_daten.traeger.length && !_daten.traeger.some((x) => x.angebot.id === _selId)) {
    _selId = _daten.traeger[0].angebot.id;
  }
  repaint();
}

function repaint() {
  const d = _daten;
  if (!d.traeger.length && !d.anzahlAngebote) {
    mount(_host, el('section', { class: 'view' }, [
      el('h1', { text: t('nachkalk.title') }),
      el('p', { class: 'muted small', text: t('nachkalk.intro') }),
      emptyState('empty-reports.png', t('nachkalk.empty')),
    ]));
    return;
  }
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('nachkalk.title') }),
    el('p', { class: 'muted small', text: t('nachkalk.intro') }),
    kostentraegerCard(),
    zeitZuordnungCard(),
    kalibrierungCard(),
  ]));
}

const kostenart = (k) => t('nachkalk.kostenart.' + k);

/** Cent-Differenz mit Vorzeichen + optional Prozent (positiv = teurer als kalkuliert). */
function abweichungText(cent, prozent) {
  const vz = cent > 0 ? '+' : '';
  const geld = `${vz}${formatEuro(cent)}`;
  return prozent != null ? `${geld} (${vz}${prozent} %)` : geld;
}

function abwClass(cent) {
  if (cent > 0) return 'abw-hoch';   // Kostenüberschreitung
  if (cent < 0) return 'abw-tief';   // unter Plan
  return '';
}

// ── Kostenträger (Soll/Ist je Auftrag/Angebot) ───────────────────────────────

function kostentraegerCard() {
  const d = _daten;
  if (!d.traeger.length) {
    return el('div', { class: 'card' }, [
      el('h2', { class: 'card-title', text: t('nachkalk.traegerTitle') }),
      el('p', { class: 'muted small', text: t('nachkalk.traegerEmpty') }),
    ]);
  }

  const sel = el('select', {}, d.traeger.map(({ angebot }) =>
    el('option', { value: angebot.id }, `${angebot.nummer || '—'} · ${angebot.titel || ''}`)));
  sel.value = _selId || '';
  sel.addEventListener('change', () => { _selId = sel.value; repaint(); });

  const aktiv = d.traeger.find((x) => x.angebot.id === _selId) || d.traeger[0];

  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('nachkalk.traegerTitle') }),
    el('p', { class: 'muted small', text: t('nachkalk.traegerHint') }),
    el('label', { class: 'field' }, [el('span', { text: t('nachkalk.traegerSelect') }), sel]),
    sollIstTabelle(aktiv.analyse),
    deckungsbeitragLinien(aktiv.analyse.vergleich),
    belegListe(aktiv.analyse.ist),
  ]);
}

function sollIstTabelle(analyse) {
  const v = analyse.vergleich;
  const byBlock = {};
  for (const b of v.perBlock) byBlock[b.block] = b;
  const rows = KOSTENART_LISTE.map((k) => {
    const b = byBlock[k] || { sollCent: 0, istCent: 0, abweichungCent: 0, abweichungProzent: null };
    return el('tr', {}, [
      el('td', { text: kostenart(k) }),
      el('td', { class: 'num', text: formatEuro(b.sollCent) }),
      el('td', { class: 'num', text: formatEuro(b.istCent) }),
      el('td', { class: 'num ' + abwClass(b.abweichungCent), text: abweichungText(b.abweichungCent, b.abweichungProzent) }),
    ]);
  });
  const summe = el('tr', { class: 'strong' }, [
    el('td', { text: t('nachkalk.selbstkosten') }),
    el('td', { class: 'num', text: formatEuro(v.sollSummeCent) }),
    el('td', { class: 'num', text: formatEuro(v.istSummeCent) }),
    el('td', { class: 'num ' + abwClass(v.abweichungCent), text: abweichungText(v.abweichungCent, v.abweichungProzent) }),
  ]);
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('nachkalk.kostenartCol') }),
      el('th', { class: 'num', text: t('nachkalk.soll') }),
      el('th', { class: 'num', text: t('nachkalk.ist') }),
      el('th', { class: 'num', text: t('nachkalk.abweichung') }),
    ])),
    el('tbody', {}, [...rows, summe]),
  ]);
}

function deckungsbeitragLinien(v) {
  const line = (label, wert, cls) => el('div', { class: 'report-line' + (cls ? ' ' + cls : '') }, [
    el('span', { text: label }), el('span', { class: 'num', text: wert })]);
  return el('div', { class: 'rech-summen' }, [
    line(t('nachkalk.erloes'), formatEuro(v.nettoCent)),
    line(t('nachkalk.dbSoll'), formatEuro(v.deckungsbeitragSollCent)),
    line(t('nachkalk.dbIst'), formatEuro(v.deckungsbeitragIstCent), 'strong'),
    line(t('nachkalk.dbAbweichung'),
      abweichungText(v.deckungsbeitragAbweichungCent, null),
      abwClass(-v.deckungsbeitragAbweichungCent)),
  ]);
}

function belegListe(ist) {
  const belege = ist.belege || [];
  const kinder = [
    el('h3', { class: 'card-subtitle', text: t('nachkalk.belegTitle') }),
    el('p', { class: 'muted small', text: t('nachkalk.belegHint').replace('{stunden}', (Math.round(ist.stunden * 10) / 10)) }),
    // Ehrlicher GoBD-Hinweis: festgeschriebene Buchungen lassen sich NICHT nachträglich
    // umhängen (die `kostenstelle` ist Teil der Hash-Kette). Zuordnung passiert beim Buchen.
    el('p', { class: 'muted small', text: t('nachkalk.belegGobd') }),
  ];
  if (!belege.length) {
    kinder.push(el('p', { class: 'muted small', text: t('nachkalk.belegEmpty') }));
    return el('div', {}, kinder);
  }
  kinder.push(el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('nachkalk.datum') }), el('th', { text: t('nachkalk.beschreibung') }),
      el('th', { class: 'num', text: t('nachkalk.betrag') }),
    ])),
    el('tbody', {}, belege.map((b) => el('tr', {}, [
      el('td', { class: 'mono small', text: b.datum || '—' }),
      el('td', { text: b.beschreibung || (b.belegRef ? '#' + b.belegRef : '—') }),
      el('td', { class: 'num', text: formatEuro(b.betragCent) }),
    ]))),
  ]));
  return el('div', {}, kinder);
}

// ── Zeit-Zuordnung (Zeiteinträge je Kostenträger zuordnen) ───────────────────
// Zeiteinträge sind mutable CRM-Records (kein GoBD-Hash) → sie lassen sich hier sauber
// (neu) einem Kostenträger zuordnen. Buchungen/Belege NICHT (siehe belegListe-Hinweis):
// deren `kostenstelle` ist beim Festschreiben in der Hash-Kette fixiert.

function zeitZuordnungCard() {
  const z = _zeit || { zeiten: [], mitarbeiterIndex: {}, kostentraeger: [] };
  const kinder = [
    el('h2', { class: 'card-title', text: t('nachkalk.zuordnungTitle') }),
    el('p', { class: 'muted small', text: t('nachkalk.zuordnungHint') }),
  ];
  if (!z.kostentraeger.length) {
    kinder.push(el('p', { class: 'muted small', text: t('nachkalk.zuordnungKeinKt') }));
    return el('div', { class: 'card' }, kinder);
  }
  if (!z.zeiten.length) {
    kinder.push(el('p', { class: 'muted small', text: t('nachkalk.zuordnungKeineZeit') }));
    return el('div', { class: 'card' }, kinder);
  }
  kinder.push(el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('nachkalk.datum') }),
      el('th', { text: t('nachkalk.zuordnungMitarbeiter') }),
      el('th', { class: 'num', text: t('nachkalk.zuordnungDauer') }),
      el('th', { text: t('nachkalk.beschreibung') }),
      el('th', { text: t('nachkalk.zuordnungKostentraeger') }),
    ])),
    el('tbody', {}, z.zeiten.map((zeile) => zeitZeile(zeile, z))),
  ]));
  return el('div', { class: 'card' }, kinder);
}

function ktLabel(kt) {
  return `${kt.nummer || '—'}${kt.titel ? ' · ' + kt.titel : ''}`;
}

function zeitZeile(zeile, z) {
  const ma = z.mitarbeiterIndex[zeile.mitarbeiterId];
  // Aktueller Wert = die aufgelöste Kostenstelle (explizit ODER aus dem Auftrag abgeleitet).
  const aktuell = zeile.aufgeloesteKostenstelle || '';
  const bekannt = z.kostentraeger.some((kt) => kt.kostenstelle === aktuell);

  const sel = el('select', {}, [
    el('option', { value: '' }, t('nachkalk.zuordnungKeine')),
    ...z.kostentraeger.map((kt) => el('option', { value: kt.kostenstelle }, ktLabel(kt))),
    // Aufgelöster Kostenträger, der (noch) zu keinem gelisteten Angebot passt → erhaltbar machen.
    ...(aktuell && !bekannt ? [el('option', { value: aktuell }, aktuell)] : []),
  ]);
  sel.value = aktuell;
  sel.addEventListener('change', async () => {
    await zuordneZeit(zeile.id, sel.value || null);
    _zeit = await ladeZeitZuordnung();
    repaint();
  });

  // Transparenz: zeigt, ob die aktuelle Zuordnung explizit gesetzt oder aus dem Auftrag
  // abgeleitet ist (damit „—" vs. abgeleitet nicht verwirrt).
  const herkunft = aktuell
    ? (zeile.explizit ? t('nachkalk.zuordnungExplizit') : t('nachkalk.zuordnungAusAuftrag'))
    : '';

  return el('tr', {}, [
    el('td', { class: 'mono small', text: zeile.datum || '—' }),
    el('td', { text: (ma && ma.name) || '—' }),
    el('td', { class: 'num', text: formatDauer(Number(zeile.dauerMin) || 0) }),
    el('td', { class: 'muted small', text: zeile.beschreibung || '' }),
    el('td', {}, [sel, herkunft ? el('div', { class: 'muted small', text: herkunft }) : null]),
  ]);
}

// ── Kalibrierung (Korrekturfaktoren + Trefferquote) ──────────────────────────

function kalibrierungCard() {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('nachkalk.kalibTitle') }),
    el('p', { class: 'muted small', text: t('nachkalk.kalibHint').replace('{n}', _daten.anzahlVergleiche) }),
    faktorenTabelle(),
    el('h3', { class: 'card-subtitle', text: t('nachkalk.trefferTitle') }),
    el('p', { class: 'muted small', text: t('nachkalk.trefferHint') }),
    trefferquoteTabelle(),
  ]);
}

function faktorenTabelle() {
  const { faktoren, faktorWerte } = _daten;
  const fmtF = (x) => (x == null ? '—' : String(x).replace('.', ','));
  const rows = KOSTENART_LISTE.map((k) => {
    const f = faktoren[k] || {};
    return el('tr', {}, [
      el('td', { text: kostenart(k) }),
      el('td', { class: 'num', text: fmtF(f.faktor) }),
      el('td', { class: 'num', text: fmtF(f.medianFaktor) }),
      el('td', { class: 'num', text: String(f.anzahl || 0) }),
      el('td', { class: 'num strong', text: fmtF(faktorWerte[k]) }),
    ]);
  });
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('nachkalk.kostenartCol') }),
      el('th', { class: 'num', text: t('nachkalk.faktor') }),
      el('th', { class: 'num', text: t('nachkalk.median') }),
      el('th', { class: 'num', text: t('nachkalk.anzahl') }),
      el('th', { class: 'num', text: t('nachkalk.multiplikator') }),
    ])),
    el('tbody', {}, rows),
  ]);
}

function trefferquoteTabelle() {
  const { trefferquote, trefferquoteJePreisniveau } = _daten;
  const quote = (q) => (q.quoteProzent == null ? '—' : `${String(q.quoteProzent).replace('.', ',')} %`);
  const row = (label, q) => el('tr', {}, [
    el('td', { text: label }),
    el('td', { class: 'num', text: String(q.gewonnen) }),
    el('td', { class: 'num', text: String(q.verloren) }),
    el('td', { class: 'num', text: String(q.offen) }),
    el('td', { class: 'num strong', text: quote(q) }),
  ]);
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('nachkalk.preisniveauCol') }),
      el('th', { class: 'num', text: t('nachkalk.gewonnen') }),
      el('th', { class: 'num', text: t('nachkalk.verloren') }),
      el('th', { class: 'num', text: t('nachkalk.offen') }),
      el('th', { class: 'num', text: t('nachkalk.quote') }),
    ])),
    el('tbody', {}, [
      row(t('nachkalk.gesamt'), trefferquote),
      ...PREISNIVEAU_LISTE.map((n) => row(t('nachkalk.preisniveau.' + n), trefferquoteJePreisniveau[n])),
    ]),
  ]);
}

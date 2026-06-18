// src/ui/views/angebote.js
// BAUPLAN Block 2 / Schritt 11b — Angebots-Ansicht mit adaptivem Baukasten.
// Grundlage: docs/KALKULATION_KATALOG.md §3 (UX — adaptiver Positions-Baukasten) +
// §4 (Nummernkreise/Status) + §5.2 (Live-Deckungsbeitrag).
//
// WAS DAS IST: die UI ÜBER der bereits fertigen, node-getesteten reinen Logik —
//   - domain/baukasten.js  (#132): Nutzungszähler + adaptive Palette + Umsortieren
//   - domain/angebote.js   (#128): Status-Flow, Nummernkreis, Aggregation, Whitelist
//   - domain/produktschemata.js (#127): kalibrierbare Leistungs-Schemata
//   - domain/angebote-store.js  (11b): verschlüsselte Persistenz (encstore)
//
// PRIME DIRECTIVE (Katalog §0): Die KALKULATION (Selbstkosten/Marge/Deckungsbeitrag)
// wird nur INTERN angezeigt („intern — nicht im Angebot") und je Position verschlüsselt
// mitgespeichert. Das ANGEBOTSDOKUMENT (Ansicht/Druck) baut ausschließlich über
// externesAngebot(angebot) (Whitelist) — Marge/Verschnitt/Maschinensatz sehen Kunden nie.
//
// EHRLICHE GRENZE: DOM/IndexedDB → in der Build-Umgebung NICHT headless getestet
// (statisch geprüft, kein Headless-Browser). Die reine Logik darunter ist node-getestet.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, formatCents, parseEuroToCents } from '../../domain/money.js';
import { UST_SAETZE } from '../../domain/taxes.js';
import { PRODUKT_SCHEMATA, schemaNach, FELD_TYP } from '../../domain/produktschemata.js';
import {
  ANGEBOT_STATUS, ANGEBOT_STATUS_FLOW, neuesAngebot, positionAusSchema, angebotSummen,
  externesAngebot, interneAuswertung, validateAngebot, istArchiviert,
} from '../../domain/angebote.js';
import {
  baukastenPalette, haeufigsteSchemata, zaehleNutzung, normalizeNutzung,
  verschiebePosition, verschiebeNachOben, verschiebeNachUnten,
} from '../../domain/baukasten.js';
import { listAngebote, saveAngebot, getAngebot, deleteAngebot, setzeAngebotStatusStore } from '../../domain/angebote-store.js';
import { listKunden, listKostenstellen, ensureKostenstellenSeeded } from '../../domain/crm-store.js';
import { getSettings, updateSettings } from '../../state.js';
import { emptyState } from '../empty.js';

let _host = null;
let _kunden = [];
let _kostenstellen = [];
let _entwurf = null;           // in Arbeit befindliches Angebot (Positionen tragen interne `kalkulation`)
let _editId = null;            // id des bearbeiteten gespeicherten Angebots (null = Neuanlage)
let _openSchemaId = null;      // welche Baukasten-Karte ihr Eingabe-Formular geöffnet hat
let _dragFrom = null;          // Quell-Index beim Drag-and-drop der Positionsliste
// Interne Zuschläge (Gemeinkosten/Gewinn) — gelten beim Hinzufügen einer Position. Reine
// INTERN-Größen (Prime Directive): sie steuern die Kalkulation, stehen NIE im Angebot.
let _zuschlaege = { gemeinkostenProzent: 15, gewinnProzent: 20 };

export async function mountAngebote(host) {
  _host = host;
  await ensureKostenstellenSeeded();
  // _entwurf über Re-Mounts hinweg behalten (updateSettings → Shell-paint → mountAngebote):
  // sonst ginge das in Arbeit befindliche Angebot beim Persistieren des Nutzungsprofils verloren.
  if (!_entwurf) _entwurf = neuesAngebot();
  await repaint();
}

// Nutzungsprofil (adaptive Sortierung) — gerätelokal in den (verschlüsselten) Settings.
function nutzungsprofil() {
  return normalizeNutzung(getSettings().baukastenNutzungsprofil);
}

async function repaint(banner) {
  [_kunden, _kostenstellen] = await Promise.all([listKunden(), listKostenstellen()]);
  const angebote = await listAngebote();
  angebote.sort((a, b) => String(b.nummer || b.createdAt || '').localeCompare(String(a.nummer || a.createdAt || '')));
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('angebote.title') }),
    el('p', { class: 'muted small', text: t('angebote.intro') }),
    banner || null,
    editorCard(),
    listeCard(angebote.filter((a) => !istArchiviert(a)), t('angebote.activeTitle'), t('angebote.empty')),
    archivCard(angebote.filter(istArchiviert)),
  ]));
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

// ── Editor: Kopf + Baukasten-Palette + Positionsliste + Live-Deckungsbeitrag ──

function editorCard() {
  const a = _entwurf;
  const titel = el('input', { type: 'text', placeholder: t('angebote.titel'), value: a.titel || '' });
  titel.addEventListener('input', () => { a.titel = titel.value; });
  const kunde = el('select', {}, [el('option', { value: '' }, t('angebote.none')),
    ..._kunden.map((k) => el('option', { value: k.id }, k.name))]);
  kunde.value = a.kundeId || '';
  kunde.addEventListener('change', () => { a.kundeId = kunde.value || null; });
  const ks = el('select', {}, [el('option', { value: '' }, t('journal.noKostenstelle')),
    ..._kostenstellen.map((k) => el('option', { value: k.nummer }, `${k.nummer} · ${k.name}`))]);
  ks.value = a.kostenstelle || '';
  ks.addEventListener('change', () => { a.kostenstelle = ks.value || null; });
  const datum = el('input', { type: 'date', value: a.datum || '' });
  datum.addEventListener('input', () => { a.datum = datum.value; });
  const gueltig = el('input', { type: 'date', value: a.gueltigBis || '' });
  gueltig.addEventListener('input', () => { a.gueltigBis = gueltig.value; });

  // Interne Zuschläge (Gemeinkosten/Gewinn) — steuern die Kalkulation neuer Positionen.
  const gemein = el('input', { type: 'number', min: '0', step: '1', value: String(_zuschlaege.gemeinkostenProzent), style: 'width:6rem' });
  gemein.addEventListener('input', () => { _zuschlaege.gemeinkostenProzent = Number(gemein.value) || 0; });
  const gewinn = el('input', { type: 'number', min: '0', step: '1', value: String(_zuschlaege.gewinnProzent), style: 'width:6rem' });
  gewinn.addEventListener('input', () => { _zuschlaege.gewinnProzent = Number(gewinn.value) || 0; });

  const err = el('p', { class: 'form-error' });
  const submitBtns = [el('button', {
    class: 'btn btn-primary', type: 'button', text: _editId ? t('common.save') : t('angebote.create'),
    onClick: async () => {
      err.textContent = '';
      const fehler = validateAngebot(_entwurf);
      if (fehler.length) { err.textContent = fehler.join(' '); return; }
      try { await saveAngebot(_entwurf); }
      catch (e) { err.textContent = String(e.message || e); return; }
      const war = _editId;
      _entwurf = neuesAngebot(); _editId = null; _openSchemaId = null;
      await repaint(el('div', { class: 'banner banner-warn', text: war ? t('angebote.saved') : t('angebote.created') }));
    },
  })];
  if (_editId || (_entwurf.positionen && _entwurf.positionen.length)) {
    submitBtns.push(el('button', {
      class: 'btn', type: 'button', text: t('common.cancel'),
      onClick: async () => { _entwurf = neuesAngebot(); _editId = null; _openSchemaId = null; await repaint(); },
    }));
  }

  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: _editId ? t('angebote.edit') : t('angebote.new') }),
    el('div', { class: 'form-grid' }, [
      field(t('angebote.titel'), titel), field(t('angebote.customer'), kunde),
      field(t('angebote.kostenstelle'), ks), field(t('angebote.datum'), datum),
      field(t('angebote.gueltigBis'), gueltig),
    ]),
    el('div', { class: 'form-grid' }, [
      field(t('angebote.gemeinkosten'), gemein), field(t('angebote.gewinn'), gewinn),
    ]),
    el('p', { class: 'muted small', text: t('angebote.zuschlaegeHint') }),

    el('h3', { class: 'card-subtitle', text: t('angebote.baukasten') }),
    el('p', { class: 'muted small', text: t('angebote.baukastenHint') }),
    palette(),
    schemaFormSlot(),

    el('h3', { class: 'card-subtitle', text: t('angebote.positionen') }),
    positionsListe(),

    deckungsbeitragPanel(),
    err,
    el('div', { class: 'btn-row' }, submitBtns),
  ]);
}

// Adaptive Palette: Karten je Leistungsart, häufig/zuletzt genutzte zuerst (baukastenPalette).
// Optional eine Schnellzugriffs-Zeile „häufig genutzt" (haeufigsteSchemata) darüber.
function palette() {
  const profil = nutzungsprofil();
  const haeufig = haeufigsteSchemata(PRODUKT_SCHEMATA, profil, 3);
  const eintraege = baukastenPalette(PRODUKT_SCHEMATA, profil);

  const karte = (schema, anzahl) => el('button', {
    class: 'baukasten-karte' + (_openSchemaId === schema.id ? ' active' : ''),
    type: 'button',
    onClick: () => { _openSchemaId = _openSchemaId === schema.id ? null : schema.id; repaint(); },
  }, [
    el('span', { class: 'bk-label', text: schema.label }),
    anzahl > 0 ? el('span', { class: 'bk-zaehler', title: t('angebote.usedTimes'), text: '×' + anzahl }) : null,
  ]);

  const teile = [];
  if (haeufig.length) {
    teile.push(el('div', { class: 'muted small', text: t('angebote.haeufig') }));
    teile.push(el('div', { class: 'baukasten-palette' }, haeufig.map((s) => karte(s, 0))));
  }
  teile.push(el('div', { class: 'baukasten-palette' }, eintraege.map((e) => karte(e.schema, e.anzahl))));
  return el('div', { class: 'baukasten' }, teile);
}

// Eingabe-Formular der geöffneten Karte: die Schema-Felder + Menge + USt → positionAusSchema.
function schemaFormSlot() {
  if (!_openSchemaId) return null;
  const schema = schemaNach(_openSchemaId);
  if (!schema) return null;

  const reads = [];
  const felderNodes = schema.felder.map((f) => {
    const { node, read } = feldInput(f);
    reads.push([f.key, read]);
    return field(f.label, node);
  });

  const menge = el('input', { type: 'text', value: '1', style: 'width:6rem' });
  const beschreibung = el('input', { type: 'text', placeholder: schema.label, value: '' });
  const ust = el('select', {}, UST_SAETZE.map((s) => el('option', { value: String(s) }, `${s} %`)));
  ust.value = '19';

  const hinzufuegen = el('button', {
    class: 'btn btn-primary', type: 'button', text: t('angebote.addPosition'),
    onClick: async () => {
      const werte = {};
      for (const [key, read] of reads) werte[key] = read();
      const pos = positionAusSchema(schema, {
        werte,
        zuschlaege: { ..._zuschlaege, ustProzent: Number(ust.value) || 0 },
        beschreibung: beschreibung.value.trim() || schema.label,
        menge: Number(String(menge.value).replace(',', '.')) || 1,
      });
      _entwurf.positionen = [...(_entwurf.positionen || []), pos];
      _openSchemaId = null;
      // Nutzung zählen → adaptive Sortierung lernt mit. Persistiert gerätelokal (Settings).
      const profil = zaehleNutzung(nutzungsprofil(), schema.id);
      await updateSettings({ baukastenNutzungsprofil: profil });
      await repaint();
    },
  });
  const abbrechen = el('button', { class: 'btn', type: 'button', text: t('common.cancel'),
    onClick: () => { _openSchemaId = null; repaint(); } });

  return el('div', { class: 'card schema-form' }, [
    el('div', { class: 'card-title-row' }, [
      el('h4', { class: 'card-subtitle', text: schema.label }),
      el('span', { class: 'badge badge-entwurf', text: t('angebote.hotspot') + ': ' + schema.hotspot }),
    ]),
    el('div', { class: 'form-grid' }, [
      field(t('angebote.posBeschreibung'), beschreibung), field(t('angebote.menge'), menge),
      field(t('angebote.vat'), ust), ...felderNodes,
    ]),
    el('div', { class: 'btn-row' }, [hinzufuegen, abbrechen]),
  ]);
}

// Eingabefeld je Schema-Feldtyp. Geld als Euro (Cent-genau intern), sonst Dezimalzahl.
function feldInput(f) {
  if (f.typ === FELD_TYP.GELD) {
    const node = el('input', { type: 'text', placeholder: '0,00', value: f.default ? formatCents(f.default) : '' });
    return { node, read: () => parseEuroToCents(node.value) || 0 };
  }
  const node = el('input', { type: 'text', value: f.default != null ? String(f.default) : '0' });
  return { node, read: () => Number(String(node.value).replace(',', '.')) || 0 };
}

// Positionsliste mit Drag-and-drop (HTML5) + Pfeil-Knöpfen (↑/↓, DeX/Touch-tauglich, additiv).
function positionsListe() {
  const positionen = _entwurf.positionen || [];
  if (!positionen.length) return el('p', { class: 'muted small', text: t('angebote.noPositions') });

  const reorder = async (next) => { _entwurf.positionen = next; await repaint(); };

  const rows = positionen.map((p, i) => {
    const netto = (Number(p.einzelpreisCent) || 0) * (Number(p.menge) || 0);
    const row = el('div', {
      class: 'pos-row angebot-pos', draggable: 'true',
      'data-idx': String(i),
    }, [
      el('span', { class: 'drag-griff', title: t('angebote.dragHint'), text: '⠿' }),
      el('span', { class: 'pos-desc', text: p.beschreibung || '—' }),
      el('span', { class: 'muted small', text: `${p.menge} × ${formatEuro(p.einzelpreisCent)}` }),
      el('span', { class: 'num', text: formatEuro(netto) }),
      el('span', { class: 'muted small', text: `${p.ustSatz} %` }),
      el('span', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-sm', type: 'button', text: '↑', title: t('angebote.moveUp'), disabled: i === 0 ? true : null,
          onClick: () => reorder(verschiebeNachOben(positionen, i)) }),
        el('button', { class: 'btn btn-sm', type: 'button', text: '↓', title: t('angebote.moveDown'), disabled: i === positionen.length - 1 ? true : null,
          onClick: () => reorder(verschiebeNachUnten(positionen, i)) }),
        el('button', { class: 'btn btn-sm btn-danger', type: 'button', text: '✕', title: t('angebote.removePos'),
          onClick: () => reorder(positionen.filter((_, j) => j !== i)) }),
      ]),
    ]);
    row.addEventListener('dragstart', () => { _dragFrom = i; row.classList.add('dragging'); });
    row.addEventListener('dragend', () => { _dragFrom = null; row.classList.remove('dragging'); });
    row.addEventListener('dragover', (e) => { e.preventDefault(); });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      if (_dragFrom == null || _dragFrom === i) return;
      reorder(verschiebePosition(positionen, _dragFrom, i));
    });
    return row;
  });

  return el('div', { class: 'pos-box angebot-pos-liste' }, rows);
}

// Live-Deckungsbeitrag (Katalog §5.2) — rein INTERN (Prime Directive), je Position aus der
// gespeicherten Kalkulation summiert. Daneben die neutralen Angebotssummen (netto/USt/brutto).
function deckungsbeitragPanel() {
  const summen = angebotSummen(_entwurf.positionen);
  const intern = interneAuswertung(_entwurf);
  const dbProzent = intern.netto > 0 ? Math.round((intern.deckungsbeitrag / intern.netto) * 100) : 0;
  const line = (label, wert, cls) => el('div', { class: 'report-line' + (cls ? ' ' + cls : '') }, [
    el('span', { text: label }), el('span', { class: 'num', text: wert })]);
  return el('div', { class: 'angebot-summen' }, [
    el('div', { class: 'card no-pad angebot-extern' }, [
      el('div', { class: 'rech-summen' }, [
        line(t('angebote.net'), formatEuro(summen.netto)),
        line(t('angebote.vatSum'), formatEuro(summen.ust)),
        line(t('angebote.gross'), formatEuro(summen.brutto), 'strong'),
      ]),
    ]),
    el('div', { class: 'card no-pad angebot-intern' }, [
      el('div', { class: 'card-title-row' }, [
        el('h4', { class: 'card-subtitle', text: t('angebote.internTitle') }),
        el('span', { class: 'badge badge-entwurf', text: t('angebote.internBadge') }),
      ]),
      el('div', { class: 'rech-summen' }, [
        line(t('angebote.selbstkosten'), formatEuro(intern.selbstkosten)),
        line(t('angebote.deckungsbeitrag'), `${formatEuro(intern.deckungsbeitrag)} (${dbProzent} %)`, 'strong'),
      ]),
      el('p', { class: 'muted small', text: t('angebote.internHint') }),
    ]),
  ]);
}

// ── Gespeicherte Angebote (aktiv + Archiv) ───────────────────────────────────

function statusBadge(status) {
  const ok = status === ANGEBOT_STATUS.ANGENOMMEN;
  return el('span', { class: 'badge ' + (ok ? 'badge-ok' : 'badge-entwurf'), text: t('angebote.status.' + status) });
}

function listeCard(angebote, titel, leer) {
  if (!angebote.length) return emptyState('empty-orders.png', leer);
  return el('div', { class: 'card no-pad' }, [
    el('h2', { class: 'card-title pad', text: titel }),
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: t('angebote.nummer') }), el('th', { text: t('angebote.titel') }),
        el('th', { class: 'num', text: t('angebote.gross') }), el('th', { text: t('angebote.status') }), el('th', {}),
      ])),
      el('tbody', {}, angebote.map((a) => zeile(a))),
    ]),
  ]);
}

function archivCard(angebote) {
  if (!angebote.length) return null;
  return listeCard(angebote, t('angebote.archivTitle'), '');
}

function zeile(a) {
  const summen = angebotSummen(a.positionen);
  const kundeName = (_kunden.find((k) => k.id === a.kundeId) || {}).name || '';
  return el('tr', {}, [
    el('td', { class: 'mono small', text: a.nummer || '—' }),
    el('td', {}, [el('div', { text: a.titel || '—' }), el('div', { class: 'muted small', text: kundeName })]),
    el('td', { class: 'num', text: formatEuro(summen.brutto) }),
    el('td', {}, [statusBadge(a.status)]),
    el('td', { class: 'actions' }, [aktionen(a)]),
  ]);
}

function aktionen(a) {
  const wrap = el('div', { class: 'btn-row' });
  for (const next of ANGEBOT_STATUS_FLOW[a.status] || []) {
    wrap.appendChild(el('button', {
      class: 'btn btn-sm', type: 'button', text: t('angebote.aktion.' + next),
      onClick: async () => {
        try { await setzeAngebotStatusStore(a.id, next); await repaint(); }
        catch (e) { alert(String(e.message || e)); }
      },
    }));
  }
  wrap.appendChild(el('button', {
    class: 'btn btn-sm', type: 'button', text: t('angebote.show'),
    onClick: () => dokumentAnzeigen(a),
  }));
  wrap.appendChild(el('button', {
    class: 'btn btn-sm', type: 'button', text: t('common.edit'),
    onClick: async () => {
      const voll = await getAngebot(a.id);
      _entwurf = { ...voll, positionen: [...(voll.positionen || [])] };
      _editId = a.id; _openSchemaId = null;
      await repaint();
      if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  }));
  wrap.appendChild(el('button', {
    class: 'btn btn-sm btn-danger', type: 'button', text: t('common.delete'),
    onClick: async () => { if (confirm(t('angebote.confirmDelete'))) { await deleteAngebot(a.id); if (_editId === a.id) { _entwurf = neuesAngebot(); _editId = null; } await repaint(); } },
  }));
  return wrap;
}

// ── Neutrales Angebotsdokument (Prime Directive: NUR externesAngebot/Whitelist) ──

function dokumentAnzeigen(a) {
  const doc = externesAngebot(a);
  const kunde = _kunden.find((k) => k.id === a.kundeId) || {};
  const posRows = doc.positionen.map((p) => el('tr', {}, [
    el('td', { text: p.beschreibung || '—' }),
    el('td', { class: 'num', text: String(p.menge) }),
    el('td', { class: 'num', text: formatEuro(p.einzelpreisCent) }),
    el('td', { class: 'num', text: `${p.ustSatz} %` }),
    el('td', { class: 'num', text: formatEuro(p.netto) }),
  ]));
  const sumRows = [
    el('div', { class: 'report-line' }, [el('span', { text: t('angebote.net') }), el('span', { class: 'num', text: formatEuro(doc.netto) })]),
    ...doc.steuerzeilen.filter((z) => z.satz > 0).map((z) =>
      el('div', { class: 'report-line' }, [el('span', { text: `USt ${z.satz} %` }), el('span', { class: 'num', text: formatEuro(z.ust) })])),
    el('div', { class: 'report-line strong' }, [el('span', { text: t('angebote.gross') }), el('span', { class: 'num', text: formatEuro(doc.brutto) })]),
  ];
  mount(_host, el('section', { class: 'view' }, [
    el('div', { class: 'btn-row no-print' }, [
      el('button', { class: 'btn', type: 'button', text: t('common.back'), onClick: () => repaint() }),
      el('button', { class: 'btn btn-primary', type: 'button', text: t('reports.print'), onClick: () => window.print() }),
    ]),
    el('p', { class: 'muted small no-print', text: t('angebote.docHint') }),
    el('div', { class: 'card rechnung-doc' }, [
      el('h2', { class: 'card-title', text: `${t('angebote.docTitle')} ${doc.nummer || ''}` }),
      el('div', { class: 'muted small' }, [
        kunde.name ? el('span', { text: kunde.name }) : null,
        doc.datum ? el('span', { text: `   ·   ${t('angebote.datum')}: ${doc.datum}` }) : null,
        doc.gueltigBis ? el('span', { text: `   ·   ${t('angebote.gueltigBis')}: ${doc.gueltigBis}` }) : null,
      ]),
      doc.titel ? el('p', { text: doc.titel }) : null,
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', { text: t('angebote.posBeschreibung') }), el('th', { class: 'num', text: t('angebote.menge') }),
          el('th', { class: 'num', text: t('angebote.price') }), el('th', { class: 'num', text: t('angebote.vat') }),
          el('th', { class: 'num', text: t('angebote.net') }),
        ])),
        el('tbody', {}, posRows),
      ]),
      el('div', { class: 'rech-summen' }, sumRows),
    ]),
  ]));
}

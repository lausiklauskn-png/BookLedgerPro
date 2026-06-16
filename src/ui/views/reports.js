// src/ui/views/reports.js — Auswertung: USt-Voranmeldung, EÜR, GoBD-Audit.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, formatCents, parseEuroToCents } from '../../domain/money.js';
import { loadAccounts, listBuchungen, verifyAuditChain } from '../../domain/store.js';
import { computeUStVoranmeldung, computeEUR, computeEURIst, verprobeUSt } from '../../domain/taxes.js';
import { kostenstellenAuswertung } from '../../domain/costcenters.js';
import { buildLedgerCsv, buildDatevExtf, buildUstVa, ustVaToCsv, eurToCsv, buildOffeneVerbindlichkeitenCsv, buildElsterVaPaket } from '../../domain/export.js';
import { VA_ZEITRAUM, voranmeldungsperioden, periodeIndexFuer, sondervorauszahlung, jahresZahllast } from '../../domain/umsatzsteuer.js';
import { downloadText } from '../../core/files.js';
import { isMistralConfigured } from '../../ai/aiConfig.js';
import { erklaereSteuer } from '../../ai/taxAssist.js';
import { listAuftraege, listKunden, mahnungErfassen } from '../../domain/crm-store.js';
import { offenePosten } from '../../domain/zahlungsabgleich.js';
import { anreicherePosten, ueberfaelligSummen, mahnschreibenDaten, kundeIstB2B, vorschlagNaechsteStufe, mahnStufeLabel, letzteMahnstufe } from '../../domain/mahnwesen.js';
import { listEingangsrechnungen } from '../../domain/payables-store.js';
import { offeneVerbindlichkeiten, anreichereVerbindlichkeiten, verbindlichkeitenSummen } from '../../domain/payables.js';
import { getSettings, updateSettings } from '../../state.js';
import { emptyState } from '../empty.js';

let _host = null;
let _b2bById = {}; // kundeId → ist Unternehmer (B2B)? für Verzugszinsen/Pauschale
let _auftragById = {}; // auftragId → Auftrag (für persistenten Mahn-Verlauf)
const periode = { von: '', bis: '' };
// USt-VA Voranmeldungszeitraum-Auswahl (eigenständig, ohne Voll-Repaint).
let _vaTyp = null, _vaJahr = null, _vaIdx = 0;

export async function mountReports(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const [konten, buchungen] = await Promise.all([loadAccounts(), listBuchungen()]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;

  if (!buchungen.some((b) => b.seq != null)) {
    mount(_host, el('section', { class: 'view' }, [
      el('h1', { text: t('reports.title') }),
      emptyState('empty-reports.png', t('reports.empty')),
    ]));
    return;
  }

  const p = (periode.von || periode.bis) ? { von: periode.von || undefined, bis: periode.bis || undefined } : undefined;

  const ust = computeUStVoranmeldung(buchungen, idx, p);
  const verprobung = verprobeUSt(buchungen, idx, p);
  const eur = computeEUR(buchungen, idx, p);
  const eurIst = computeEURIst(buchungen, idx, p);
  const va = buildUstVa(buchungen, idx, p);
  const ks = kostenstellenAuswertung(buchungen, idx, p);
  const audit = await verifyAuditChain();
  const claudeBereit = await isMistralConfigured().catch(() => false);

  // Offene Forderungen + Fälligkeit/Überfälligkeit für das Mahnwesen.
  let offen = [];
  try {
    const [auftraege, kunden] = await Promise.all([listAuftraege(), listKunden()]);
    const nameById = {}; _b2bById = {}; _auftragById = {};
    for (const k of kunden) { nameById[k.id] = k.name; _b2bById[k.id] = kundeIstB2B(k); }
    for (const a of auftraege) _auftragById[a.id] = a;
    const s = getSettings();
    offen = anreicherePosten(offenePosten(auftraege, { nameById }), { zielTage: s.zahlungszielTage });
  } catch { offen = []; }

  // Offene Verbindlichkeiten (Kreditoren-OP-Liste) + Fälligkeit/Überfälligkeit.
  let offenVerb = [];
  try {
    offenVerb = anreichereVerbindlichkeiten(offeneVerbindlichkeiten(await listEingangsrechnungen()));
  } catch { offenVerb = []; }

  mount(_host, el('section', { class: 'view', id: 'report-view' }, [
    el('h1', { text: t('reports.title') }),
    periodeControls(),
    exportBar(buchungen, idx, eur, va),
    offen.length ? mahnungenCard(offen) : null,
    offenVerb.length ? verbindlichkeitenCard(offenVerb) : null,
    el('div', { class: 'report-grid' }, [
      ustCard(ust),
      eurCard(eur),
    ]),
    eurIstCard(eurIst),
    vaCard(va),
    vaPeriodeCard(buchungen, idx),
    verprobungCard(verprobung),
    claudeBereit ? assistentCard(va, eur, p) : null,
    ks.length ? kostenstellenCard(ks) : null,
    auditCard(audit),
  ]));
}

// ---- Offene Forderungen & Mahnwesen ----------------------------------------

function mahnungenCard(posten) {
  const sum = ueberfaelligSummen(posten);
  const reihen = [...posten].sort((a, b) => b.tageUeberfaellig - a.tageUeberfaellig).map((p) => {
    const auftrag = _auftragById[p.id];
    const letzte = letzteMahnstufe(auftrag);
    const vor = vorschlagNaechsteStufe(auftrag, p.tageUeberfaellig);
    const statusKinder = [
      p.ueberfaellig
        ? el('span', { class: 'badge badge-warn', text: `${t('reports.mahnOverdue')} ${p.tageUeberfaellig} ${t('reports.mahnDays')}` })
        : el('span', { class: 'muted small', text: t('reports.mahnOpen') }),
    ];
    if (letzte > 0) statusKinder.push(el('span', { class: 'muted small', text: ` · ${t('reports.mahnLast')}: ${mahnStufeLabel(letzte)}` }));
    const aktion = vor.mahnbar
      ? el('button', { class: 'btn btn-sm', text: `${t('reports.mahnShow')} (${vor.label})`, onClick: () => zeigeMahnung(p) })
      : null;
    return el('tr', {}, [
      el('td', { text: p.referenz || '—' }),
      el('td', { text: p.name || '—' }),
      el('td', { class: 'num', text: formatEuro(p.betragCent) }),
      el('td', { class: 'mono small', text: p.faelligAm }),
      el('td', {}, statusKinder),
      el('td', { class: 'actions no-print' }, [aktion].filter(Boolean)),
    ]);
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.mahnTitle') }),
    el('div', { class: 'report-line strong' }, [
      el('span', { text: t('reports.mahnOverdueSum') }),
      el('span', { class: 'num', text: `${formatEuro(sum.summeCent)} (${sum.anzahl})` }),
    ]),
    el('table', { class: 'table' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { text: t('reports.mahnInvoice') }), el('th', { text: t('reports.mahnCustomer') }),
        el('th', { class: 'num', text: t('orders.gross') }), el('th', { text: t('reports.mahnDue') }),
        el('th', { text: t('reports.mahnStatus') }), el('th', { class: 'no-print', text: '' }),
      ])]),
      el('tbody', {}, reihen),
    ]),
    el('p', { class: 'muted small', text: t('reports.mahnNote') }),
  ]);
}

function zeigeMahnung(posten) {
  const s = getSettings();
  const auftrag = _auftragById[posten.id];
  const b2b = posten.kundeId != null && _b2bById[posten.kundeId] === false ? false : true;
  const vor = vorschlagNaechsteStufe(auftrag, posten.tageUeberfaellig);
  const d = mahnschreibenDaten(posten, {
    zielTage: s.zahlungszielTage,
    basiszinsProzent: s.verzugBasiszinsProzent,
    b2b,
  });
  const firma = s.firma || {};
  const zeile = (label, cents, strong) => el('div', { class: 'report-line' + (strong ? ' strong' : '') }, [
    el('span', { text: label }), el('span', { class: 'num', text: formatEuro(cents) }),
  ]);

  // Manuell erfassbare Verzugszinsen/Mahngebühren (vorbelegt mit §288-Berechnung, editierbar).
  const zinsenInput = el('input', { type: 'text', value: formatCents(d.zinsenCent) });
  const gebuehrenInput = el('input', { type: 'text', value: formatCents(d.pauschaleCent) });
  const verlauf = (auftrag && auftrag.mahnungen) || [];
  const status = el('p', { class: 'muted small' });

  mount(_host, el('section', { class: 'view' }, [
    el('div', { class: 'btn-row no-print' }, [
      el('button', { class: 'btn', text: t('common.back'), onClick: () => repaint() }),
      el('button', { class: 'btn btn-primary', text: t('reports.print'), onClick: () => window.print() }),
    ]),
    el('div', { class: 'card rechnung-doc' }, [
      el('div', { class: 'muted small', text: firma.name || '' }),
      el('h2', { class: 'card-title', text: `${vor.label}${d.referenz ? ' — Rechnung ' + d.referenz : ''}` }),
      el('div', { text: `${t('reports.mahnCustomer')}: ${d.name || '—'}` }),
      verlauf.length ? el('p', { class: 'muted small', text: `${t('reports.mahnLast')}: ` +
        verlauf.map((m) => `${mahnStufeLabel(m.stufe)} (${m.datum})`).join(', ') }) : null,
      el('p', { class: 'small', text: t('reports.mahnBody')
        .replace('{ref}', d.referenz || '—').replace('{faellig}', d.faelligAm).replace('{tage}', String(d.tageUeberfaellig)) }),
      zeile(t('reports.mahnClaim'), d.forderungCent),
      // Editierbare Beträge (no-print: im Druck erscheinen die Zahlen über die Summe).
      el('div', { class: 'form-grid no-print' }, [
        el('label', { class: 'field' }, [el('span', { text: t('reports.mahnInterest') }), zinsenInput]),
        el('label', { class: 'field' }, [el('span', { text: t('reports.mahnFee') }), gebuehrenInput]),
      ]),
      el('div', { class: 'mycel-divider' }),
      el('p', { class: 'small', text: t('reports.mahnDeadline').replace('{frist}', d.neueFrist) }),
      el('div', { class: 'btn-row no-print' }, [
        el('button', {
          class: 'btn btn-primary', text: `${t('reports.mahnRecord')} (${vor.label})`,
          onClick: async (e) => {
            e.target.setAttribute('disabled', '');
            try {
              await mahnungErfassen(posten.id, {
                stufe: vor.stufe,
                zinsenCent: parseEuroToCents(zinsenInput.value) || 0,
                gebuehrenCent: parseEuroToCents(gebuehrenInput.value) || 0,
              });
              status.textContent = t('reports.mahnRecorded');
            } catch (err) { status.textContent = String(err.message || err); }
          },
        }),
      ]),
      status,
      el('p', { class: 'muted small', text: t('reports.mahnLegal') }),
      el('p', { class: 'muted small', text: t('reports.mahnBookHint') }),
    ].filter(Boolean)),
  ]));
}

// ---- Offene Verbindlichkeiten (Kreditoren-OP-Liste) ------------------------

function verbindlichkeitenCard(posten) {
  const sum = verbindlichkeitenSummen(posten);
  const reihen = [...posten]
    .sort((a, b) => (a.faelligAm || '').localeCompare(b.faelligAm || ''))
    .map((p) => {
      const badge = p.ueberfaellig
        ? el('span', { class: 'badge badge-warn', text: `${t('reports.opOverdue')} ${p.tageUeberfaellig} ${t('reports.mahnDays')}` })
        : el('span', { class: 'muted small', text: t('reports.mahnOpen') });
      return el('tr', {}, [
        el('td', { text: p.referenz || '—' }),
        el('td', { text: p.name || '—' }),
        el('td', { class: 'num', text: formatEuro(p.offenCent) }),
        el('td', { class: 'mono small', text: p.faelligAm || '—' }),
        el('td', {}, [badge]),
      ]);
    });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.opTitle') }),
    el('div', { class: 'report-line strong' }, [
      el('span', { text: t('reports.opSum') }),
      el('span', { class: 'num', text: `${formatEuro(sum.summeCent)} (${sum.anzahl})` }),
    ]),
    sum.ueberfaelligAnzahl ? el('div', { class: 'report-line' }, [
      el('span', { text: t('reports.opOverdueSum') }),
      el('span', { class: 'num', text: `${formatEuro(sum.ueberfaelligCent)} (${sum.ueberfaelligAnzahl})` }),
    ]) : null,
    el('table', { class: 'table' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { text: t('reports.mahnInvoice') }), el('th', { text: t('reports.opCreditor') }),
        el('th', { class: 'num', text: t('reports.opOpen') }), el('th', { text: t('reports.mahnDue') }),
        el('th', { text: t('reports.mahnStatus') }),
      ])]),
      el('tbody', {}, reihen),
    ]),
    el('div', { class: 'btn-row no-print' }, [
      el('button', {
        class: 'btn btn-sm', text: t('reports.opExport'),
        onClick: () => downloadText(`offene-verbindlichkeiten-${new Date().toISOString().slice(0, 10)}.csv`, BOM + buildOffeneVerbindlichkeitenCsv(posten), 'text/csv'),
      }),
    ]),
    el('p', { class: 'muted small', text: t('reports.opNote') }),
  ].filter(Boolean));
}

const BOM = '﻿';

function datevOpts() {
  const s = getSettings();
  const d = s.datev || {};
  const f = s.firma || {};
  return {
    berater: d.beraterNr || '', mandant: d.mandantNr || '', sachkontenlaenge: d.sachkontenlaenge || 4,
    bezeichnung: (f.name ? f.name + ' — ' : '') + 'BookLedgerPro', festschreibung: true,
  };
}

function exportBar(buchungen, idx, eur, va) {
  const stamp = new Date().toISOString().slice(0, 10);
  const dl = (name, text) => downloadText(name, BOM + text, 'text/csv');
  return el('div', { class: 'card export-bar no-print' }, [
    el('span', { class: 'muted small', text: t('reports.export') + ':' }),
    el('button', { class: 'btn btn-sm', text: t('reports.exportJournal'), onClick: () => dl(`journal-${stamp}.csv`, buildLedgerCsv(buchungen, idx)) }),
    el('button', { class: 'btn btn-sm', text: t('reports.exportDatev'), onClick: () => dl(`EXTF_Buchungsstapel_${stamp}.csv`, buildDatevExtf(buchungen, idx, datevOpts())) }),
    el('button', { class: 'btn btn-sm', text: t('reports.exportUstVa'), onClick: () => dl(`ust-va-${stamp}.csv`, ustVaToCsv(va)) }),
    el('button', { class: 'btn btn-sm', text: t('reports.exportEur'), onClick: () => dl(`euer-${stamp}.csv`, eurToCsv(eur)) }),
    el('button', { class: 'btn btn-sm', text: t('reports.print'), onClick: () => window.print() }),
  ]);
}

function vaCard(va) {
  const line = (kz, label, cents, strong) => el('div', { class: 'report-line' + (strong ? ' strong' : '') }, [
    el('span', { text: (kz ? `Kz ${kz} · ` : '') + label }),
    el('span', { class: 'num', text: formatEuro(cents) }),
  ]);
  // Zeilen für Steuerschuldumkehr/EU nur zeigen, wenn relevant (sonst Karte schlank halten).
  const opt = (kz, label, cents, strong) => (cents ? line(kz, label, cents, strong) : null);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.ustVaKennzahlen') }),
    opt('41', t('reports.kz41'), va.kz41),
    opt('43', t('reports.kz43'), va.kz43),
    line('81', t('reports.kz81'), va.kz81),
    line('', t('reports.kz81s'), va.kz81Steuer),
    line('86', t('reports.kz86'), va.kz86),
    line('', t('reports.kz86s'), va.kz86Steuer),
    opt('89', t('reports.kz89'), va.kz89),
    opt('93', t('reports.kz93'), va.kz93),
    opt('46', t('reports.kz46'), va.kz46),
    opt('47', t('reports.kz47'), va.kz47),
    line('66', t('reports.kz66'), va.kz66),
    opt('61', t('reports.kz61'), va.kz61),
    opt('67', t('reports.kz67'), va.kz67),
    el('div', { class: 'mycel-divider' }),
    line('83', t('reports.kz83'), va.kz83, true),
    el('p', { class: 'muted small', text: t('reports.ustVaNote') }),
  ]);
}

// USt-VA je Voranmeldungszeitraum (Monat/Quartal/Jahr) + Sondervorauszahlung + ELSTER-Paket.
function vaPeriodeCard(buchungen, idx) {
  if (_vaTyp == null) _vaTyp = getSettings().vaZeitraum || VA_ZEITRAUM.VIERTELJAEHRLICH;
  if (_vaJahr == null) _vaJahr = new Date().getFullYear();

  const ergebnis = el('div');
  const typSel = el('select', {}, [
    el('option', { value: VA_ZEITRAUM.MONATLICH, text: t('reports.vaMonthly') }),
    el('option', { value: VA_ZEITRAUM.VIERTELJAEHRLICH, text: t('reports.vaQuarterly') }),
    el('option', { value: VA_ZEITRAUM.JAEHRLICH, text: t('reports.vaYearly') }),
  ]);
  typSel.value = _vaTyp;
  const jahrInput = el('input', { type: 'number', value: String(_vaJahr), style: 'width:7rem' });
  const periodeSel = el('select', {});

  const fuellePerioden = () => {
    const perioden = voranmeldungsperioden(_vaTyp, _vaJahr);
    if (_vaIdx >= perioden.length) _vaIdx = 0;
    clearChildren(periodeSel);
    perioden.forEach((p, i) => periodeSel.appendChild(el('option', { value: String(i), text: p.label })));
    periodeSel.value = String(_vaIdx);
    return perioden;
  };
  const render = () => {
    const perioden = voranmeldungsperioden(_vaTyp, _vaJahr);
    const p = perioden[_vaIdx] || perioden[0];
    const va = buildUstVa(buchungen, idx, { von: p.von, bis: p.bis });
    const svVorjahr = sondervorauszahlung(jahresZahllast(buchungen, idx, _vaJahr - 1));
    const stamp = `${p.code}-${_vaJahr}`;
    const meta = { ...firmaMeta(), jahr: _vaJahr, zeitraumCode: p.code, zeitraumLabel: p.label };
    const line = (label, cents, strong) => el('div', { class: 'report-line' + (strong ? ' strong' : '') }, [
      el('span', { text: label }), el('span', { class: 'num', text: formatEuro(cents) }),
    ]);
    clearChildren(ergebnis);
    ergebnis.appendChild(el('div', { class: 'muted small', text: `${p.von} – ${p.bis} · ${t('reports.vaCode')} ${p.code}` }));
    ergebnis.appendChild(line(t('reports.kz83'), va.kz83, true));
    if (_vaTyp === VA_ZEITRAUM.MONATLICH && svVorjahr > 0) {
      ergebnis.appendChild(line(t('reports.vaSondervorauszahlung'), svVorjahr));
      ergebnis.appendChild(el('p', { class: 'muted small', text: t('reports.vaSvHint') }));
    }
    ergebnis.appendChild(el('div', { class: 'btn-row no-print' }, [
      el('button', {
        class: 'btn btn-sm', text: t('reports.vaExportPaket'),
        onClick: () => downloadText(`ust-va-elster-${stamp}.csv`, BOM + buildElsterVaPaket(va, meta), 'text/csv'),
      }),
      el('button', {
        class: 'btn btn-sm', text: t('reports.exportUstVa'),
        onClick: () => downloadText(`ust-va-${stamp}.csv`, BOM + ustVaToCsv(va), 'text/csv'),
      }),
    ]));
  };

  fuellePerioden();
  typSel.addEventListener('change', () => { _vaTyp = typSel.value; updateSettings({ vaZeitraum: _vaTyp }).catch(() => {}); _vaIdx = 0; fuellePerioden(); render(); });
  jahrInput.addEventListener('change', () => { _vaJahr = Number(jahrInput.value) || _vaJahr; fuellePerioden(); render(); });
  periodeSel.addEventListener('change', () => { _vaIdx = Number(periodeSel.value) || 0; render(); });
  render();

  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.vaPeriodTitle') }),
    el('div', { class: 'period-bar no-print' }, [
      el('span', { class: 'muted small', text: t('reports.vaType') + ':' }), typSel,
      jahrInput, periodeSel,
    ]),
    ergebnis,
    el('p', { class: 'muted small', text: t('reports.vaPaketHint') }),
  ]);
}

function clearChildren(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function firmaMeta() {
  const f = getSettings().firma || {};
  return { steuernummer: f.steuernummer || '', ustId: f.ustId || '' };
}

function assistentCard(va, eur, p) {
  const out = el('div', { class: 'muted small' });
  const btn = el('button', {
    class: 'btn btn-sm', text: t('reports.taxAssist'),
    onClick: async () => {
      out.textContent = '…';
      try { out.textContent = await erklaereSteuer(va, eur, p); }
      catch (e) { out.textContent = String(e.message || e); }
    },
  });
  return el('div', { class: 'card no-print' }, [
    el('h2', { class: 'card-title', text: t('reports.taxAssist') }),
    el('p', { class: 'muted small', text: t('reports.taxAssistHint') }),
    el('div', { class: 'btn-row' }, [btn]),
    out,
  ]);
}

function kostenstellenCard(ks) {
  const rows = ks.map((k) => el('tr', {}, [
    el('td', { class: 'mono', text: k.kostenstelle }),
    el('td', { class: 'num', text: formatEuro(k.aufwand) }),
    el('td', { class: 'num', text: formatEuro(k.ertrag) }),
    el('td', { class: 'num', text: formatEuro(k.saldo) }),
  ]));
  return el('div', { class: 'card no-pad' }, [
    el('div', { class: 'pad' }, el('h2', { class: 'card-title', text: t('reports.costcenters') })),
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: t('reports.costcenters') }),
        el('th', { class: 'num', text: t('reports.aufwand') }),
        el('th', { class: 'num', text: t('reports.ertrag') }),
        el('th', { class: 'num', text: t('reports.ksSaldo') }),
      ])),
      el('tbody', {}, rows),
    ]),
  ]);
}

function periodeControls() {
  const von = el('input', { type: 'text', value: periode.von, placeholder: 'YYYY-MM-DD' });
  const bis = el('input', { type: 'text', value: periode.bis, placeholder: 'YYYY-MM-DD' });
  const apply = el('button', {
    class: 'btn btn-sm', text: t('reports.period'),
    onClick: async () => { periode.von = von.value.trim(); periode.bis = bis.value.trim(); await repaint(); },
  });
  return el('div', { class: 'card period-bar' }, [
    el('span', { class: 'muted small', text: t('reports.period') + ':' }),
    el('label', { class: 'inline-field' }, [el('span', { text: t('reports.from') }), von]),
    el('label', { class: 'inline-field' }, [el('span', { text: t('reports.to') }), bis]),
    apply,
  ]);
}

function zeile(label, cents, opts = {}) {
  return el('div', { class: 'report-line' + (opts.strong ? ' strong' : '') }, [
    el('span', { text: label }),
    el('span', { class: 'num', text: formatEuro(cents) }),
  ]);
}

function ustCard(ust) {
  const erstattung = ust.zahllast < 0;
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.ustVa') }),
    zeile(t('reports.ust'), ust.umsatzsteuer),
    zeile(t('reports.vorsteuer'), ust.vorsteuer),
    el('div', { class: 'mycel-divider' }),
    zeile(erstattung ? t('reports.guthaben') : t('reports.zahllast'), Math.abs(ust.zahllast), { strong: true }),
  ]);
}

function eurCard(eur) {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.eur') }),
    zeile(t('reports.income'), eur.einnahmen),
    zeile(t('reports.expense'), eur.ausgaben),
    el('div', { class: 'mycel-divider' }),
    zeile(t('reports.surplus'), eur.ueberschuss, { strong: true }),
    el('p', { class: 'muted small', text: t('reports.eurNote') }),
  ]);
}

function verprobungCard(v) {
  const block = (label, teil) => {
    const abw = teil.diff !== 0;
    return el('div', { class: 'report-line' + (abw ? ' strong' : '') }, [
      el('span', { text: label }),
      el('span', { class: 'num', text: `${formatEuro(teil.gebucht)} / ${formatEuro(teil.erwartet)}`
        + (abw ? ` (${teil.diff > 0 ? '+' : ''}${formatEuro(teil.diff)})` : '') }),
    ]);
  };
  return el('div', { class: `card audit ${v.ok ? 'audit-ok' : 'audit-fail'}` }, [
    el('h2', { class: 'card-title', text: t('reports.verprobung') }),
    el('div', { class: 'audit-status' }, [
      el('span', { class: 'audit-dot' }),
      el('span', { text: v.ok ? t('reports.verprobungOk') : t('reports.verprobungAbw') }),
    ]),
    el('p', { class: 'muted small', text: t('reports.verprobungSpalten') }),
    block(t('reports.ust'), v.umsatzsteuer),
    block(t('reports.vorsteuer'), v.vorsteuer),
    el('p', { class: 'muted small', text: t('reports.verprobungNote') }),
  ]);
}

function eurIstCard(eur) {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.eurIst') }),
    zeile(t('reports.income'), eur.einnahmen),
    zeile(t('reports.expense'), eur.ausgaben),
    el('div', { class: 'mycel-divider' }),
    zeile(t('reports.surplus'), eur.ueberschuss, { strong: true }),
    el('p', { class: 'muted small', text: t('reports.eurIstNote') }),
  ]);
}

function auditCard(audit) {
  return el('div', { class: `card audit ${audit.ok ? 'audit-ok' : 'audit-fail'}` }, [
    el('h2', { class: 'card-title', text: t('reports.audit') }),
    el('div', { class: 'audit-status' }, [
      el('span', { class: 'audit-dot' }),
      el('span', { text: (audit.ok ? t('reports.auditOk') : t('reports.auditFail')) + ` — ${audit.count} ${t('reports.auditCount')}` }),
    ]),
    audit.ok ? null : el('ul', { class: 'audit-errors' }, audit.errors.map((e) => el('li', { text: e }))),
  ]);
}

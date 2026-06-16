// src/ui/views/berichte.js — Berichte: Summen-/Saldenliste (SuSa), Kontenblatt, Anlage-EÜR.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, listBuchungen } from '../../domain/store.js';
import { summenSaldenliste, kontenblatt, anlageEUR } from '../../domain/berichte.js';
import { buildSusaCsv, buildKontenblattCsv, buildAnlageEURCsv } from '../../domain/export.js';
import { buildGdpduPaket } from '../../domain/gdpdu.js';
import { zipFiles } from '../../core/zip.js';
import { downloadText, downloadBlob } from '../../core/files.js';
import { getSettings } from '../../state.js';
import { emptyState } from '../empty.js';

const BOM = '﻿';
let _host = null;
let _konto = '';
const periode = { von: '', bis: '' };

export async function mountBerichte(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const [konten, buchungen] = await Promise.all([loadAccounts(), listBuchungen()]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;

  if (!buchungen.some((b) => b.seq != null)) {
    mount(_host, el('section', { class: 'view' }, [
      el('h1', { text: t('berichte.title') }),
      emptyState('empty-reports.png', t('reports.empty')),
    ]));
    return;
  }

  const p = (periode.von || periode.bis) ? { von: periode.von || undefined, bis: periode.bis || undefined } : undefined;
  const susa = summenSaldenliste(buchungen, idx, p);
  if (!_konto) _konto = (susa.zeilen[0] && susa.zeilen[0].nummer) || '';
  const eur = anlageEUR(buchungen, idx, p);
  const blatt = _konto ? kontenblatt(buchungen, _konto, idx, p) : null;

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('berichte.title') }),
    periodeControls(),
    anlageEURCard(eur),
    susaCard(susa),
    kontenblattCard(konten, blatt),
    gdpduCard(buchungen, konten, idx, p),
  ]));
}

function gdpduCard(buchungen, konten, idx, p) {
  const f = getSettings().firma || {};
  const jahr = (p && p.bis ? p.bis.slice(0, 4) : (p && p.von ? p.von.slice(0, 4) : new Date().getFullYear()));
  return el('div', { class: 'card no-print' }, [
    el('h2', { class: 'card-title', text: t('berichte.gdpduTitle') }),
    el('p', { class: 'muted small', text: t('berichte.gdpduHint') }),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn-sm', text: t('berichte.gdpduExport'),
        onClick: () => {
          const meta = { jahr, firma: f.name || 'BookLedgerPro', steuernummer: f.steuernummer || '', periode: p };
          const dateien = buildGdpduPaket(buchungen, konten, idx, meta);
          downloadBlob(`GoBD-GDPdU-Export-${jahr}.zip`, zipFiles(dateien), 'application/zip');
        },
      }),
    ]),
  ]);
}

function dl(name, text) { downloadText(name, BOM + text, 'text/csv'); }

function periodeControls() {
  const von = el('input', { type: 'text', value: periode.von, placeholder: 'YYYY-MM-DD' });
  const bis = el('input', { type: 'text', value: periode.bis, placeholder: 'YYYY-MM-DD' });
  return el('div', { class: 'card period-bar no-print' }, [
    el('span', { class: 'muted small', text: t('reports.period') + ':' }),
    el('label', { class: 'inline-field' }, [el('span', { text: t('reports.from') }), von]),
    el('label', { class: 'inline-field' }, [el('span', { text: t('reports.to') }), bis]),
    el('button', { class: 'btn btn-sm', text: t('reports.period'), onClick: async () => { periode.von = von.value.trim(); periode.bis = bis.value.trim(); await repaint(); } }),
  ]);
}

function anlageEURCard(eur) {
  const line = (label, cents, strong) => el('div', { class: 'report-line' + (strong ? ' strong' : '') }, [
    el('span', { text: label }), el('span', { class: 'num', text: formatEuro(cents) }),
  ]);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('berichte.anlageEur') }),
    ...eur.einnahmen.map((e) => line(e.gruppe, e.wert)),
    line(t('berichte.sumIncome'), eur.summeEinnahmen, true),
    el('div', { class: 'mycel-divider' }),
    ...eur.ausgaben.map((a) => line(a.gruppe, a.wert)),
    line(t('berichte.sumExpense'), eur.summeAusgaben, true),
    el('div', { class: 'mycel-divider' }),
    line(t('berichte.profit'), eur.ueberschuss, true),
    el('p', { class: 'muted small', text: t('berichte.anlageEurNote') }),
    el('div', { class: 'btn-row no-print' }, [
      el('button', { class: 'btn btn-sm', text: t('berichte.exportAnlageEur'), onClick: () => dl('anlage-euer.csv', buildAnlageEURCsv(eur)) }),
    ]),
  ]);
}

function susaCard(susa) {
  const rows = susa.zeilen.map((z) => el('tr', {}, [
    el('td', { class: 'mono', text: z.nummer }),
    el('td', { text: z.name }),
    el('td', { class: 'num', text: formatEuro(z.soll) }),
    el('td', { class: 'num', text: formatEuro(z.haben) }),
    el('td', { class: 'num', text: formatEuro(z.saldo) }),
  ]));
  return el('div', { class: 'card no-pad' }, [
    el('div', { class: 'pad export-bar no-print' }, [
      el('h2', { class: 'card-title', text: t('berichte.susa') }),
      el('button', { class: 'btn btn-sm', text: t('berichte.exportSusa'), onClick: () => dl('susa.csv', buildSusaCsv(susa)) }),
    ]),
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: t('accounts.number') }), el('th', { text: t('accounts.name') }),
        el('th', { class: 'num', text: 'Soll' }), el('th', { class: 'num', text: 'Haben' }),
        el('th', { class: 'num', text: t('accounts.saldo') }),
      ])),
      el('tbody', {}, rows),
      el('tfoot', {}, el('tr', { class: 'strong' }, [
        el('td', { text: t('common.total') }), el('td', {}),
        el('td', { class: 'num', text: formatEuro(susa.summen.soll) }),
        el('td', { class: 'num', text: formatEuro(susa.summen.haben) }),
        el('td', {}),
      ])),
    ]),
  ]);
}

function kontenblattCard(konten, blatt) {
  const sel = el('select', {}, konten.map((k) => el('option', { value: k.nummer, text: `${k.nummer} · ${k.name}` })));
  if (_konto) sel.value = _konto;
  sel.addEventListener('change', async () => { _konto = sel.value; await repaint(); });

  const rows = (blatt ? blatt.eintraege : []).map((e) => el('tr', {}, [
    el('td', { class: 'mono small', text: e.datum }),
    el('td', { class: 'mono small', text: String(e.seq) }),
    el('td', { text: e.beschreibung }),
    el('td', { class: 'num', text: e.soll ? formatEuro(e.soll) : '' }),
    el('td', { class: 'num', text: e.haben ? formatEuro(e.haben) : '' }),
    el('td', { class: 'num', text: formatEuro(e.saldo) }),
  ]));

  return el('div', { class: 'card no-pad' }, [
    el('div', { class: 'pad period-bar no-print' }, [
      el('h2', { class: 'card-title', text: t('berichte.kontenblatt') }),
      sel,
      blatt ? el('button', { class: 'btn btn-sm', text: t('berichte.exportKontenblatt'), onClick: () => dl(`kontenblatt-${blatt.nummer}.csv`, buildKontenblattCsv(blatt)) }) : null,
    ].filter(Boolean)),
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: t('journal.date') }), el('th', { text: '#' }), el('th', { text: t('journal.desc') }),
        el('th', { class: 'num', text: 'Soll' }), el('th', { class: 'num', text: 'Haben' }),
        el('th', { class: 'num', text: t('accounts.saldo') }),
      ])),
      el('tbody', {}, rows.length ? rows : [el('tr', {}, [el('td', { colspan: '6', class: 'muted small', text: t('berichte.kontenblattEmpty') })])]),
      blatt ? el('tfoot', {}, el('tr', { class: 'strong' }, [
        el('td', { text: t('common.total') }), el('td', {}), el('td', {}),
        el('td', { class: 'num', text: formatEuro(blatt.summeSoll) }),
        el('td', { class: 'num', text: formatEuro(blatt.summeHaben) }),
        el('td', { class: 'num', text: formatEuro(blatt.endsaldo) }),
      ])) : null,
    ]),
  ]);
}

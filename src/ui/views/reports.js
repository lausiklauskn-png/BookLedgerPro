// src/ui/views/reports.js — Auswertung: USt-Voranmeldung, EÜR, GoBD-Audit.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, listBuchungen, verifyAuditChain } from '../../domain/store.js';
import { computeUStVoranmeldung, computeEUR, verprobeUSt } from '../../domain/taxes.js';
import { kostenstellenAuswertung } from '../../domain/costcenters.js';
import { buildLedgerCsv, buildDatevCsv, buildUstVa, ustVaToCsv, eurToCsv } from '../../domain/export.js';
import { downloadText } from '../../core/files.js';
import { isMistralConfigured } from '../../ai/aiConfig.js';
import { erklaereSteuer } from '../../ai/taxAssist.js';
import { emptyState } from '../empty.js';

let _host = null;
const periode = { von: '', bis: '' };

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
  const va = buildUstVa(buchungen, idx, p);
  const ks = kostenstellenAuswertung(buchungen, idx, p);
  const audit = await verifyAuditChain();
  const claudeBereit = await isMistralConfigured().catch(() => false);

  mount(_host, el('section', { class: 'view', id: 'report-view' }, [
    el('h1', { text: t('reports.title') }),
    periodeControls(),
    exportBar(buchungen, idx, eur, va),
    el('div', { class: 'report-grid' }, [
      ustCard(ust),
      eurCard(eur),
    ]),
    vaCard(va),
    verprobungCard(verprobung),
    claudeBereit ? assistentCard(va, eur, p) : null,
    ks.length ? kostenstellenCard(ks) : null,
    auditCard(audit),
  ]));
}

const BOM = '﻿';

function exportBar(buchungen, idx, eur, va) {
  const stamp = new Date().toISOString().slice(0, 10);
  const dl = (name, text) => downloadText(name, BOM + text, 'text/csv');
  return el('div', { class: 'card export-bar no-print' }, [
    el('span', { class: 'muted small', text: t('reports.export') + ':' }),
    el('button', { class: 'btn btn-sm', text: t('reports.exportJournal'), onClick: () => dl(`journal-${stamp}.csv`, buildLedgerCsv(buchungen, idx)) }),
    el('button', { class: 'btn btn-sm', text: t('reports.exportDatev'), onClick: () => dl(`datev-${stamp}.csv`, buildDatevCsv(buchungen, idx)) }),
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
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('reports.ustVaKennzahlen') }),
    line('81', t('reports.kz81'), va.kz81),
    line('', t('reports.kz81s'), va.kz81Steuer),
    line('86', t('reports.kz86'), va.kz86),
    line('', t('reports.kz86s'), va.kz86Steuer),
    line('66', t('reports.kz66'), va.kz66),
    el('div', { class: 'mycel-divider' }),
    line('83', t('reports.kz83'), va.kz83, true),
    el('p', { class: 'muted small', text: t('reports.ustVaNote') }),
  ]);
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

// src/ui/views/reports.js — Auswertung: USt-Voranmeldung, EÜR, GoBD-Audit.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, listBuchungen, verifyAuditChain } from '../../domain/store.js';
import { computeUStVoranmeldung, computeEUR } from '../../domain/taxes.js';

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
  const p = (periode.von || periode.bis) ? { von: periode.von || undefined, bis: periode.bis || undefined } : undefined;

  const ust = computeUStVoranmeldung(buchungen, idx, p);
  const eur = computeEUR(buchungen, idx, p);
  const audit = await verifyAuditChain();

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('reports.title') }),
    periodeControls(),
    el('div', { class: 'report-grid' }, [
      ustCard(ust),
      eurCard(eur),
    ]),
    auditCard(audit),
  ]));
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

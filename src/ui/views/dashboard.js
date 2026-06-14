// src/ui/views/dashboard.js — Übersicht mit echten Jahres-Kennzahlen.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { navigate } from '../../state.js';
import { getMandantId } from '../../core/vault.js';
import { loadAccounts, listBuchungen, verifyAuditChain } from '../../domain/store.js';
import { listBelege } from '../../domain/documents.js';
import { listKunden, listAuftraege } from '../../domain/crm-store.js';
import { dashboardKennzahlen } from '../../domain/summary.js';
import { MycelDivider } from '../mycel.js';

export async function mountDashboard(host) {
  mount(host, el('section', { class: 'view' }, [el('h1', { text: t('dashboard.welcome') }), el('p', { class: 'muted', text: '…' })]));

  const jahr = new Date().getFullYear();
  const [konten, buchungen, belege, kunden, auftraege, audit] = await Promise.all([
    loadAccounts(), listBuchungen(), listBelege().catch(() => []),
    listKunden().catch(() => []), listAuftraege().catch(() => []), verifyAuditChain().catch(() => ({ ok: true, count: 0 })),
  ]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;
  const k = dashboardKennzahlen(buchungen, idx, jahr);

  const kpi = (label, value, cls) => el('div', { class: 'kpi ' + (cls || '') }, [
    el('div', { class: 'kpi-value', text: value }),
    el('div', { class: 'kpi-label', text: label }),
  ]);

  mount(host, el('section', { class: 'view' }, [
    el('div', { class: 'dash-head' }, [
      el('h1', { text: t('dashboard.welcome') }),
      el('span', { class: 'muted small', text: `${t('dashboard.year')} ${jahr}` }),
    ]),
    el('p', { class: 'muted', text: t('app.tagline') }),

    el('div', { class: 'kpi-grid' }, [
      kpi(t('reports.surplus'), formatEuro(k.ueberschuss), k.ueberschuss >= 0 ? 'kpi-pos' : 'kpi-neg'),
      kpi(t('reports.zahllast'), formatEuro(k.ustZahllast)),
      kpi(t('reports.income'), formatEuro(k.ertrag)),
      kpi(t('reports.expense'), formatEuro(k.aufwand)),
    ]),

    el('div', { class: 'kpi-grid small-kpi' }, [
      kpi(t('dashboard.posted'), String(k.festgeschrieben)),
      kpi(t('dashboard.drafts'), String(k.entwuerfe)),
      kpi(t('nav.documents'), String(belege.length)),
      kpi(t('nav.customers'), String(kunden.length)),
      kpi(t('nav.orders'), String(auftraege.length)),
    ]),

    MycelDivider(),

    el('div', { class: 'card' }, [
      el('div', { class: 'report-line' }, [
        el('span', { text: t('reports.audit') }),
        el('span', { class: audit.ok ? 'badge badge-ok' : 'badge badge-storno', text: (audit.ok ? t('reports.auditOk') : t('reports.auditFail')) + ` (${audit.count})` }),
      ]),
      getMandantId() ? el('div', { class: 'report-line' }, [
        el('span', { text: t('dashboard.mandant') }),
        el('code', { class: 'mono small', text: getMandantId() }),
      ]) : null,
    ]),

    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-primary', text: t('journal.new'), onClick: () => navigate('journal') }),
      el('button', { class: 'btn', text: t('docs.quickEntry'), onClick: () => navigate('documents') }),
      el('button', { class: 'btn', text: t('nav.reports'), onClick: () => navigate('reports') }),
    ]),
  ]));
}

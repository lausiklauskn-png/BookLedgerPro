// src/ui/views/accounts.js — Kontenplan mit Salden.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, listBuchungen } from '../../domain/store.js';
import { saldenliste } from '../../domain/taxes.js';
import { KONTOART } from '../../domain/accounts.js';

const ART_LABEL = {
  [KONTOART.AKTIV]: 'Aktiv', [KONTOART.PASSIV]: 'Passiv',
  [KONTOART.AUFWAND]: 'Aufwand', [KONTOART.ERTRAG]: 'Ertrag',
};

export async function mountAccounts(host) {
  mount(host, el('section', { class: 'view' }, [el('h1', { text: t('accounts.title') }), el('p', { class: 'muted', text: '…' })]));

  const [konten, buchungen] = await Promise.all([loadAccounts(), listBuchungen()]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;
  const salden = {};
  for (const s of saldenliste(buchungen, idx)) salden[s.nummer] = s.saldo;

  const rows = konten.map((k) => el('tr', {}, [
    el('td', { class: 'mono', text: k.nummer }),
    el('td', { text: k.name }),
    el('td', { class: 'muted small', text: ART_LABEL[k.art] || k.art }),
    el('td', { class: 'num', text: salden[k.nummer] != null ? formatEuro(salden[k.nummer]) : '–' }),
  ]));

  const table = el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('accounts.number') }),
      el('th', { text: t('accounts.name') }),
      el('th', { text: t('accounts.type') }),
      el('th', { class: 'num', text: t('accounts.saldo') }),
    ])),
    el('tbody', {}, rows),
  ]);

  mount(host, el('section', { class: 'view' }, [
    el('h1', { text: t('accounts.title') }),
    buchungen.some((b) => b.seq != null) ? null : el('p', { class: 'muted', text: t('accounts.empty') }),
    el('div', { class: 'card no-pad' }, [table]),
  ]));
}

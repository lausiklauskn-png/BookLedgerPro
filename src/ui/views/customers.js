// src/ui/views/customers.js — Kunden (verschlüsselt gespeichert).

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { listKunden, saveKunde, deleteKunde } from '../../domain/crm-store.js';
import { emptyState } from '../empty.js';

let _host = null;

export async function mountCustomers(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const kunden = await listKunden();
  kunden.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('crm.customersTitle') }),
    form(),
    liste(kunden),
  ]));
}

function form() {
  const name = el('input', { type: 'text', placeholder: t('crm.name') });
  const email = el('input', { type: 'text', placeholder: t('crm.email') });
  const adresse = el('input', { type: 'text', placeholder: t('crm.address') });
  const ustId = el('input', { type: 'text', placeholder: t('crm.ustid') });
  const istVerbraucher = el('input', { type: 'checkbox' });
  const err = el('p', { class: 'form-error' });
  return el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      if (!name.value.trim()) { err.textContent = t('crm.name'); return; }
      await saveKunde({ name: name.value, email: email.value, adresse: adresse.value, ustId: ustId.value, istVerbraucher: istVerbraucher.checked });
      await repaint();
    },
  }, [
    el('h2', { class: 'card-title', text: t('crm.newCustomer') }),
    el('div', { class: 'form-grid' }, [
      field(t('crm.name'), name), field(t('crm.email'), email),
      field(t('crm.address'), adresse), field(t('crm.ustid'), ustId),
    ]),
    el('label', { class: 'inline-field' }, [istVerbraucher, el('span', { text: t('crm.consumer') })]),
    el('p', { class: 'muted small', text: t('crm.consumerHint') }),
    err,
    el('div', { class: 'btn-row' }, [el('button', { class: 'btn btn-primary', type: 'submit', text: t('crm.add') })]),
  ]);
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

function liste(kunden) {
  if (!kunden.length) return emptyState('empty-customers.png', t('crm.customersEmpty'));
  const rows = kunden.map((k) => el('tr', {}, [
    el('td', { text: k.name }),
    el('td', { class: 'muted small', text: k.email || '' }),
    el('td', { class: 'muted small', text: k.adresse || '' }),
    el('td', { class: 'muted small mono', text: k.ustId || '' }),
    el('td', { class: 'muted small', text: k.istVerbraucher ? t('crm.consumerShort') : t('crm.businessShort') }),
    el('td', { class: 'actions' }, [el('button', {
      class: 'btn btn-sm', text: t('common.delete'),
      onClick: async () => { if (confirm(t('common.delete') + '?')) { await deleteKunde(k.id); await repaint(); } },
    })]),
  ]));
  return el('div', { class: 'card no-pad' }, [el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('crm.name') }), el('th', { text: t('crm.email') }),
      el('th', { text: t('crm.address') }), el('th', { text: t('crm.ustid') }),
      el('th', { text: t('crm.customerType') }), el('th', {}),
    ])),
    el('tbody', {}, rows),
  ])]);
}

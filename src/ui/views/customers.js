// src/ui/views/customers.js — Kunden (verschlüsselt gespeichert).

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { listKunden, saveKunde, deleteKunde } from '../../domain/crm-store.js';
import { importKundenAusText } from '../../domain/kundenimport.js';
import { pickFile, readFileText } from '../../core/files.js';
import { emptyState } from '../empty.js';

let _host = null;
let _banner = null; // {kind:'ok'|'err', text} — Import-Rückmeldung (einmalig)

export async function mountCustomers(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const kunden = await listKunden();
  kunden.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('crm.customersTitle') }),
    _banner ? el('p', { class: _banner.kind === 'err' ? 'form-error' : 'muted small', text: _banner.text }) : null,
    form(),
    importCard(),
    liste(kunden),
  ]));
  _banner = null;
}

// Kundenimport aus CSV / vCard (zusätzlich zum WorkFloh-JSON). Datei lesen → reine Logik
// importKundenAusText (node-getestet) → verschlüsselt speichern. Bereits vorhandene Namen
// werden übersprungen. Bucht nichts.
function importCard() {
  const btn = el('button', {
    class: 'btn', text: t('crm.importPick'),
    onClick: async () => {
      const file = await pickFile('.csv,.vcf,.vcard,text/csv,text/vcard,text/plain');
      if (!file) return;
      let kunden;
      try { kunden = importKundenAusText(await readFileText(file)); }
      catch { _banner = { kind: 'err', text: t('crm.importError') }; await repaint(); return; }
      if (!kunden.length) { _banner = { kind: 'err', text: t('crm.importNone') }; await repaint(); return; }
      const vorhanden = new Set((await listKunden()).map((k) => (k.name || '').trim().toLowerCase()).filter(Boolean));
      let neu = 0, skip = 0;
      for (const k of kunden) {
        const key = (k.name || '').trim().toLowerCase();
        if (key && vorhanden.has(key)) { skip++; continue; }
        await saveKunde(k); if (key) vorhanden.add(key); neu++;
      }
      _banner = { kind: 'ok', text: t('crm.importDone').replace('{neu}', String(neu)).replace('{skip}', String(skip)) };
      await repaint();
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('crm.importTitle') }),
    el('p', { class: 'small', text: t('crm.importHint') }),
    el('div', { class: 'btn-row' }, [btn]),
  ]);
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

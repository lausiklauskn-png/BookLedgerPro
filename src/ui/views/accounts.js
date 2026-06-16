// src/ui/views/accounts.js — Kontenplan mit Salden + Konten anlegen/bearbeiten/löschen.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, listBuchungen, addKonto, updateKonto, deleteKonto } from '../../domain/store.js';
import { saldenliste } from '../../domain/taxes.js';
import { KONTOART, KONTOART_LISTE } from '../../domain/accounts.js';

const ART_LABEL = {
  [KONTOART.AKTIV]: 'Aktiv', [KONTOART.PASSIV]: 'Passiv',
  [KONTOART.AUFWAND]: 'Aufwand', [KONTOART.ERTRAG]: 'Ertrag',
};

let _host = null;
let _edit = null; // Konto-Objekt das gerade bearbeitet wird, oder null (= Neuanlage)

export async function mountAccounts(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  mount(_host, el('section', { class: 'view' }, [el('h1', { text: t('accounts.title') }), el('p', { class: 'muted', text: '…' })]));

  const [konten, buchungen] = await Promise.all([loadAccounts(), listBuchungen()]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;
  const salden = {};
  for (const s of saldenliste(buchungen, idx)) salden[s.nummer] = s.saldo;
  const benutzt = new Set();
  for (const b of buchungen) for (const z of b.zeilen || []) benutzt.add(z.konto);

  const rows = konten.map((k) => el('tr', {}, [
    el('td', { class: 'mono', text: k.nummer }),
    el('td', { text: k.name }),
    el('td', { class: 'muted small', text: ART_LABEL[k.art] || k.art }),
    el('td', { class: 'muted small', text: k.ust != null ? `${k.ust}%` : '' }),
    el('td', { class: 'num', text: salden[k.nummer] != null ? formatEuro(salden[k.nummer]) : '–' }),
    el('td', { class: 'actions no-print' }, [
      el('button', { class: 'btn btn-sm', text: t('common.edit'), onClick: () => { _edit = { ...k }; repaint(); } }),
      benutzt.has(k.nummer) ? null : el('button', {
        class: 'btn btn-sm', text: t('common.delete'),
        onClick: async () => {
          if (!confirm(`${t('common.delete')} ${k.nummer} ${k.name}?`)) return;
          try { await deleteKonto(k.nummer); if (_edit && _edit.nummer === k.nummer) _edit = null; await repaint(); }
          catch (e) { alert(String(e.message || e)); }
        },
      }),
    ].filter(Boolean)),
  ]));

  const table = el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('accounts.number') }),
      el('th', { text: t('accounts.name') }),
      el('th', { text: t('accounts.type') }),
      el('th', { text: 'USt' }),
      el('th', { class: 'num', text: t('accounts.saldo') }),
      el('th', { class: 'no-print', text: '' }),
    ])),
    el('tbody', {}, rows),
  ]);

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('accounts.title') }),
    kontoForm(),
    el('div', { class: 'card no-pad' }, [
      el('div', { class: 'pad muted small', text: `${konten.length} ${t('accounts.count')}` }),
      table,
    ]),
  ]));
}

function kontoForm() {
  const editing = !!_edit;
  const nummer = el('input', { type: 'text', value: _edit ? _edit.nummer : '', placeholder: 'z. B. 4980' });
  if (editing) nummer.setAttribute('disabled', ''); // Nummer unveränderlich
  const name = el('input', { type: 'text', value: _edit ? _edit.name : '', placeholder: t('accounts.name') });
  const art = el('select', {}, KONTOART_LISTE.map((a) =>
    el('option', { value: a, text: ART_LABEL[a], selected: _edit && _edit.art === a ? '' : undefined })));
  if (_edit) art.value = _edit.art;
  const ust = el('select', {}, [
    el('option', { value: '', text: '–' }),
    el('option', { value: '19', text: '19%' }),
    el('option', { value: '7', text: '7%' }),
    el('option', { value: '0', text: '0%' }),
  ]);
  if (_edit && _edit.ust != null) ust.value = String(_edit.ust);
  const err = el('p', { class: 'form-error' });

  const submit = el('button', {
    class: 'btn btn-primary', type: 'submit', text: editing ? t('common.save') : t('accounts.add'),
  });
  const form = el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const eingabe = { nummer: nummer.value, name: name.value, art: art.value, ust: ust.value === '' ? null : ust.value };
      try {
        if (editing) await updateKonto(_edit.nummer, { name: eingabe.name, art: eingabe.art, ust: eingabe.ust });
        else await addKonto(eingabe);
        _edit = null;
        await repaint();
      } catch (ex) { err.textContent = String(ex.message || ex); }
    },
  }, [
    el('h2', { class: 'card-title', text: editing ? `${t('accounts.edit')} ${_edit.nummer}` : t('accounts.new') }),
    el('div', { class: 'form-grid' }, [
      field(t('accounts.number'), nummer),
      field(t('accounts.name'), name),
      field(t('accounts.type'), art),
      field('USt', ust),
    ]),
    el('p', { class: 'muted small', text: t('accounts.formHint') }),
    err,
    el('div', { class: 'btn-row' }, [
      submit,
      editing ? el('button', { class: 'btn', type: 'button', text: t('common.cancel'), onClick: () => { _edit = null; repaint(); } }) : null,
    ].filter(Boolean)),
  ]);
  return form;
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

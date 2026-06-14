// src/ui/views/employees.js — Mitarbeiter + Zeiterfassung (verschlüsselt gespeichert).

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, parseEuroToCents } from '../../domain/money.js';
import { zeitSummen, formatDauer, validateMitarbeiter, validateZeit } from '../../domain/employees.js';
import {
  listMitarbeiter, saveMitarbeiter, deleteMitarbeiter,
  listZeiten, saveZeit, deleteZeit, listAuftraege,
} from '../../domain/crm-store.js';
import { emptyState } from '../empty.js';

let _host = null;
let _mitarbeiter = [];
let _auftraege = [];

export async function mountEmployees(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  [_mitarbeiter, _auftraege] = await Promise.all([listMitarbeiter(), listAuftraege()]);
  _mitarbeiter.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const zeiten = await listZeiten();
  zeiten.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('emp.title') }),
    mitarbeiterForm(),
    mitarbeiterListe(zeiten),
    el('div', { class: 'mycel-divider' }),
    el('h2', { class: 'card-title', text: t('emp.time') }),
    zeitForm(),
    zeitListe(zeiten),
  ]));
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

function mitarbeiterForm() {
  const name = el('input', { type: 'text', placeholder: t('emp.name') });
  const lohn = el('input', { type: 'text', placeholder: '0,00' });
  const err = el('p', { class: 'form-error' });
  return el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      const m = { name: name.value, stundenlohnCent: lohn.value.trim() ? parseEuroToCents(lohn.value) : null };
      const fehler = validateMitarbeiter(m);
      if (fehler.length) { err.textContent = fehler.join(' '); return; }
      await saveMitarbeiter(m);
      await repaint();
    },
  }, [
    el('h2', { class: 'card-title', text: t('emp.new') }),
    el('div', { class: 'form-grid' }, [field(t('emp.name'), name), field(t('emp.wage'), lohn)]),
    err,
    el('div', { class: 'btn-row' }, [el('button', { class: 'btn btn-primary', type: 'submit', text: t('crm.add') })]),
  ]);
}

function mitarbeiterListe(zeiten) {
  if (!_mitarbeiter.length) return emptyState('empty-employees.png', t('emp.empty'));
  const rows = _mitarbeiter.map((m) => {
    const eigene = zeiten.filter((z) => z.mitarbeiterId === m.id);
    const s = zeitSummen(eigene, m.stundenlohnCent);
    return el('tr', {}, [
      el('td', { text: m.name }),
      el('td', { class: 'muted small', text: m.stundenlohnCent != null ? formatEuro(m.stundenlohnCent) + '/h' : '' }),
      el('td', { class: 'num', text: formatDauer(s.minuten) }),
      el('td', { class: 'num', text: s.kostenCent != null ? formatEuro(s.kostenCent) : '' }),
      el('td', { class: 'actions' }, [el('button', {
        class: 'btn btn-sm', text: t('common.delete'),
        onClick: async () => { if (confirm(t('common.delete') + '?')) { await deleteMitarbeiter(m.id); await repaint(); } },
      })]),
    ]);
  });
  return el('div', { class: 'card no-pad' }, [el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('emp.name') }), el('th', { text: t('emp.wage') }),
      el('th', { class: 'num', text: t('emp.sum') }), el('th', { class: 'num', text: t('emp.cost') }), el('th', {}),
    ])),
    el('tbody', {}, rows),
  ])]);
}

function zeitForm() {
  const ma = el('select', {}, _mitarbeiter.map((m) => el('option', { value: m.id }, m.name)));
  const auftrag = el('select', {}, [el('option', { value: '' }, t('orders.none')),
    ..._auftraege.map((a) => el('option', { value: a.id }, a.titel))]);
  const datum = el('input', { type: 'text', value: new Date().toISOString().slice(0, 10) });
  const dauer = el('input', { type: 'text', placeholder: '60' });
  const desc = el('input', { type: 'text', placeholder: t('emp.desc') });
  const err = el('p', { class: 'form-error' });
  if (!_mitarbeiter.length) return el('p', { class: 'muted small', text: t('emp.empty') });
  return el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      const z = { mitarbeiterId: ma.value, auftragId: auftrag.value || null, datum: datum.value, dauerMin: Number(dauer.value) || 0, beschreibung: desc.value };
      const fehler = validateZeit(z);
      if (fehler.length) { err.textContent = fehler.join(' '); return; }
      await saveZeit(z);
      await repaint();
    },
  }, [
    el('div', { class: 'form-grid' }, [
      field(t('emp.employee'), ma), field(t('orders.title'), auftrag),
      field(t('emp.date'), datum), field(t('emp.duration'), dauer), field(t('emp.desc'), desc),
    ]),
    err,
    el('div', { class: 'btn-row' }, [el('button', { class: 'btn btn-primary', type: 'submit', text: t('emp.timeNew') })]),
  ]);
}

function zeitListe(zeiten) {
  if (!zeiten.length) return el('p', { class: 'muted', text: t('emp.timeEmpty') });
  const maName = (id) => (_mitarbeiter.find((m) => m.id === id) || {}).name || '';
  const rows = zeiten.map((z) => el('tr', {}, [
    el('td', { class: 'mono', text: z.datum }),
    el('td', { text: maName(z.mitarbeiterId) }),
    el('td', { class: 'num', text: formatDauer(z.dauerMin) }),
    el('td', { class: 'muted small', text: z.beschreibung || '' }),
    el('td', { class: 'actions' }, [el('button', {
      class: 'btn btn-sm', text: t('common.delete'),
      onClick: async () => { if (confirm(t('common.delete') + '?')) { await deleteZeit(z.id); await repaint(); } },
    })]),
  ]));
  return el('div', { class: 'card no-pad' }, [el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('emp.date') }), el('th', { text: t('emp.employee') }),
      el('th', { class: 'num', text: t('emp.duration') }), el('th', { text: t('emp.desc') }), el('th', {}),
    ])),
    el('tbody', {}, rows),
  ])]);
}

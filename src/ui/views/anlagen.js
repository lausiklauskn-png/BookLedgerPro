// src/ui/views/anlagen.js — Anlagenverzeichnis: Anlagegüter + AfA + AfA-Buchung + AVEÜR-CSV.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, saveEntwurf } from '../../domain/store.js';
import { listAnlagen, addAnlage, updateAnlage, deleteAnlage } from '../../domain/anlagen-store.js';
import {
  AFA_METHODE, AFA_METHODE_LISTE, klassifiziere, sammelpostenZulaessig,
  anlagenverzeichnis, afaBuchungZeilen, normalizeAnlage,
} from '../../domain/anlagen.js';
import { KONTOART } from '../../domain/accounts.js';
import { buildAnlagenverzeichnisCsv } from '../../domain/export.js';
import { downloadText } from '../../core/files.js';
import { emptyState } from '../empty.js';

const BOM = '﻿';
const METHODE_LABEL = {
  [AFA_METHODE.GWG]: () => t('anlagen.methode.gwg'),
  [AFA_METHODE.SAMMELPOSTEN]: () => t('anlagen.methode.sammelposten'),
  [AFA_METHODE.LINEAR]: () => t('anlagen.methode.linear'),
};

let _host = null;
let _edit = null;                 // Anlage in Bearbeitung oder null
let _jahr = new Date().getFullYear();
let _hinweis = '';

export async function mountAnlagen(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const [konten, anlagen] = await Promise.all([loadAccounts(), listAnlagen()]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;
  // Anlagekonten: Aktiv-Bestandskonten (typisch Klasse 0). Fallback: alle Aktivkonten.
  const anlagekonten = konten.filter((k) => k.art === KONTOART.AKTIV);
  const vz = anlagenverzeichnis(anlagen, _jahr);

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('anlagen.title') }),
    el('p', { class: 'muted small', text: t('anlagen.intro') }),
    anlageForm(anlagekonten),
    jahrLeiste(),
    anlagen.length ? exportLeiste(vz) : null,
    anlagen.length
      ? el('div', { class: 'card no-pad' }, [verzeichnisTabelle(vz, idx)])
      : emptyState('empty-reports.png', t('anlagen.empty')),
  ]));
}

function jahrLeiste() {
  const input = el('input', { type: 'number', value: String(_jahr), style: 'width:7rem' });
  return el('div', { class: 'card period-bar no-print' }, [
    el('span', { class: 'muted small', text: t('anlagen.year') + ':' }),
    input,
    el('button', {
      class: 'btn btn-sm', text: t('anlagen.apply'),
      onClick: async () => { _jahr = Number(input.value) || _jahr; await repaint(); },
    }),
  ]);
}

function exportLeiste(vz) {
  return el('div', { class: 'card export-bar no-print' }, [
    el('span', { class: 'muted small', text: t('reports.export') + ':' }),
    el('button', {
      class: 'btn btn-sm', text: t('anlagen.exportCsv'),
      onClick: () => downloadText(`anlagenverzeichnis-${vz.jahr}.csv`, BOM + buildAnlagenverzeichnisCsv(vz), 'text/csv'),
    }),
  ]);
}

function verzeichnisTabelle(vz, idx) {
  const rows = vz.zeilen.map((z) => el('tr', {}, [
    el('td', { text: z.bezeichnung }),
    el('td', { class: 'mono small', text: z.anschaffungsdatum }),
    el('td', { class: 'num', text: formatEuro(z.akNettoCents) }),
    el('td', { class: 'muted small', text: (METHODE_LABEL[z.methode] || (() => z.methode))() }),
    el('td', { class: 'num', text: formatEuro(z.afaJahr) }),
    el('td', { class: 'num', text: formatEuro(z.kumuliert) }),
    el('td', { class: 'num', text: formatEuro(z.restbuchwert) }),
    el('td', { class: 'actions no-print' }, [
      z.afaJahr > 0 ? el('button', {
        class: 'btn btn-sm', text: t('anlagen.book'),
        onClick: () => afaBuchen(z),
      }) : null,
      el('button', { class: 'btn btn-sm', text: t('common.edit'), onClick: () => { _edit = { ...z }; repaint(); } }),
      el('button', {
        class: 'btn btn-sm', text: t('common.delete'),
        onClick: async () => {
          if (!confirm(`${t('common.delete')} „${z.bezeichnung}"?`)) return;
          await deleteAnlage(z.id); if (_edit && _edit.id === z.id) _edit = null; await repaint();
        },
      }),
    ].filter(Boolean)),
  ]));
  const s = vz.summen;
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('anlagen.name') }), el('th', { text: t('anlagen.acqDate') }),
      el('th', { class: 'num', text: t('anlagen.akNetto') }), el('th', { text: t('anlagen.method') }),
      el('th', { class: 'num', text: `${t('anlagen.afaYear')} ${vz.jahr}` }),
      el('th', { class: 'num', text: t('anlagen.afaCum') }), el('th', { class: 'num', text: t('anlagen.bookValue') }),
      el('th', { class: 'no-print', text: '' }),
    ])),
    el('tbody', {}, rows),
    el('tfoot', {}, el('tr', { class: 'strong' }, [
      el('td', { text: t('common.total') }), el('td', {}),
      el('td', { class: 'num', text: formatEuro(s.ak) }), el('td', {}),
      el('td', { class: 'num', text: formatEuro(s.afaJahr) }),
      el('td', { class: 'num', text: formatEuro(s.kumuliert) }),
      el('td', { class: 'num', text: formatEuro(s.restbuchwert) }),
      el('td', { class: 'no-print' }),
    ])),
  ]);
}

async function afaBuchen(anlage) {
  const gebaut = afaBuchungZeilen(anlage, _jahr);
  if (!gebaut) return;
  await saveEntwurf({
    datum: `${_jahr}-12-31`,
    beschreibung: `${t('anlagen.afaText')} ${_jahr}: ${anlage.bezeichnung}`,
    zeilen: gebaut.zeilen,
  });
  _hinweis = t('anlagen.bookDone');
  alert(_hinweis);
}

function anlageForm(anlagekonten) {
  const editing = !!_edit;
  const bez = el('input', { type: 'text', value: _edit ? _edit.bezeichnung : '', placeholder: t('anlagen.name') });
  const ak = el('input', { type: 'text', value: _edit ? (Number(_edit.akNettoCents || 0) / 100).toFixed(2).replace('.', ',') : '', placeholder: '0,00' });
  const datum = el('input', { type: 'text', value: _edit ? _edit.anschaffungsdatum : new Date().toISOString().slice(0, 10), placeholder: 'YYYY-MM-DD' });
  const methode = el('select', {}, AFA_METHODE_LISTE.map((m) =>
    el('option', { value: m, text: (METHODE_LABEL[m])() })));
  if (_edit) methode.value = _edit.methode;
  const nd = el('input', { type: 'number', value: _edit && _edit.nutzungsdauerJahre ? String(_edit.nutzungsdauerJahre) : '', placeholder: t('anlagen.years'), style: 'width:7rem' });
  const konto = el('select', {}, anlagekonten.map((k) =>
    el('option', { value: k.nummer, text: `${k.nummer} · ${k.name}` })));
  if (_edit && _edit.anlageKonto) konto.value = _edit.anlageKonto;
  const err = el('p', { class: 'form-error' });
  const ndField = field(t('anlagen.years'), nd);
  const syncNd = () => { ndField.style.display = methode.value === AFA_METHODE.LINEAR ? '' : 'none'; };
  methode.addEventListener('change', syncNd);
  // Methodenvorschlag, sobald ein Betrag eingegeben wird (nicht im Bearbeiten-Modus).
  if (!editing) ak.addEventListener('change', () => {
    const cents = normalizeAnlage({ akNetto: ak.value }).akNettoCents;
    if (Number.isInteger(cents) && cents > 0) { methode.value = klassifiziere(cents); syncNd(); }
  });
  syncNd();

  const submit = el('button', { class: 'btn btn-primary', type: 'submit', text: editing ? t('common.save') : t('anlagen.add') });
  return el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const eingabe = {
        bezeichnung: bez.value, akNetto: ak.value, anschaffungsdatum: datum.value,
        methode: methode.value, nutzungsdauerJahre: nd.value, anlageKonto: konto.value,
      };
      try {
        if (editing) await updateAnlage(_edit.id, eingabe);
        else await addAnlage(eingabe);
        _edit = null;
        await repaint();
      } catch (ex) { err.textContent = String(ex.message || ex); }
    },
  }, [
    el('h2', { class: 'card-title', text: editing ? t('anlagen.edit') : t('anlagen.new') }),
    el('div', { class: 'form-grid' }, [
      field(t('anlagen.name'), bez),
      field(t('anlagen.akNetto'), ak),
      field(t('anlagen.acqDate'), datum),
      field(t('anlagen.method'), methode),
      ndField,
      field(t('anlagen.account'), konto),
    ]),
    el('p', { class: 'muted small', text: t('anlagen.formHint') }),
    err,
    el('div', { class: 'btn-row' }, [
      submit,
      editing ? el('button', { class: 'btn', type: 'button', text: t('common.cancel'), onClick: () => { _edit = null; repaint(); } }) : null,
    ].filter(Boolean)),
  ]);
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

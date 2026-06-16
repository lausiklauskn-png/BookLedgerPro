// src/ui/views/kassenbuch.js — Kassenbuch / Eröffnungsbestände: GoBD-Kassenbericht,
// laufender Bestand, Anfangsbestand-Buchung, CSV-Export.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, formatCents, parseEuroToCents } from '../../domain/money.js';
import { loadAccounts, listBuchungen, saveEntwurf, ensureSeedKonten } from '../../domain/store.js';
import { getAnfangsbestand, setAnfangsbestand } from '../../domain/anfangsbestand-store.js';
import { kassenbuchEintraege, kassenbericht, anfangsbestandZeilen, KASSE_KONTO } from '../../domain/kassenbuch.js';
import { KONTOART } from '../../domain/accounts.js';
import { buildKassenbuchCsv } from '../../domain/export.js';
import { downloadText } from '../../core/files.js';

const BOM = '﻿';
const GELDKONTEN = ['1000', '1200', '1210'];

let _host = null;
let _konto = KASSE_KONTO;
let _jahr = new Date().getFullYear();

export async function mountKassenbuch(host) {
  _host = host;
  await ensureSeedKonten(['9000']).catch(() => {});
  await repaint();
}

async function repaint() {
  const [konten, buchungen] = await Promise.all([loadAccounts(), listBuchungen()]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;
  // Auswahl: bekannte Geldkonten, sonst alle Aktivkonten als Rückfall.
  let geldkonten = konten.filter((k) => GELDKONTEN.includes(k.nummer));
  if (!geldkonten.length) geldkonten = konten.filter((k) => k.art === KONTOART.AKTIV);
  if (!geldkonten.some((k) => k.nummer === _konto) && geldkonten.length) _konto = geldkonten[0].nummer;

  const periode = { von: `${_jahr}-01-01`, bis: `${_jahr}-12-31` };
  const anfang = await getAnfangsbestand(_konto, _jahr);
  const eintraege = kassenbuchEintraege(buchungen, _konto, periode);
  const bericht = kassenbericht(eintraege, anfang);

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('kasse.title') }),
    el('p', { class: 'muted small', text: t('kasse.intro') }),
    steuerLeiste(geldkonten),
    anfangsbestandKarte(anfang, idx),
    bericht.negativ ? negativWarnung(bericht) : null,
    berichtKarte(bericht),
    el('div', { class: 'card export-bar no-print' }, [
      el('span', { class: 'muted small', text: t('reports.export') + ':' }),
      el('button', {
        class: 'btn btn-sm', text: t('kasse.exportCsv'),
        onClick: () => downloadText(`kassenbuch-${_konto}-${_jahr}.csv`, BOM + buildKassenbuchCsv(bericht), 'text/csv'),
      }),
      el('button', { class: 'btn btn-sm', text: t('reports.print'), onClick: () => window.print() }),
    ]),
    el('div', { class: 'card no-pad' }, [eintraegeTabelle(bericht)]),
  ]));
}

function steuerLeiste(geldkonten) {
  const kontoSel = el('select', {}, geldkonten.map((k) =>
    el('option', { value: k.nummer, text: `${k.nummer} · ${k.name}` })));
  kontoSel.value = _konto;
  kontoSel.addEventListener('change', async () => { _konto = kontoSel.value; await repaint(); });
  const jahrInput = el('input', { type: 'number', value: String(_jahr), style: 'width:7rem' });
  return el('div', { class: 'card period-bar no-print' }, [
    el('span', { class: 'muted small', text: t('kasse.account') + ':' }), kontoSel,
    el('span', { class: 'muted small', text: t('anlagen.year') + ':' }), jahrInput,
    el('button', { class: 'btn btn-sm', text: t('anlagen.apply'), onClick: async () => { _jahr = Number(jahrInput.value) || _jahr; await repaint(); } }),
  ]);
}

function anfangsbestandKarte(anfang, idx) {
  const input = el('input', { type: 'text', value: anfang ? formatCents(anfang) : '', placeholder: '0,00' });
  const status = el('span', { class: 'muted small' });
  return el('div', { class: 'card no-print' }, [
    el('h2', { class: 'card-title', text: t('kasse.openingTitle') }),
    el('div', { class: 'form-grid' }, [
      el('label', { class: 'field' }, [el('span', { text: t('kasse.opening') }), input]),
    ]),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn-sm', text: t('common.save'),
        onClick: async () => {
          await setAnfangsbestand(_konto, _jahr, parseEuroToCents(input.value) || 0);
          await repaint();
        },
      }),
      el('button', {
        class: 'btn btn-sm', text: t('kasse.bookOpening'),
        onClick: async () => {
          const cents = parseEuroToCents(input.value) || 0;
          if (cents <= 0) { status.textContent = t('kasse.openingNeeded'); return; }
          const gebaut = anfangsbestandZeilen(_konto, cents);
          await saveEntwurf({ datum: `${_jahr}-01-01`, beschreibung: `${t('kasse.openingText')} ${_jahr} (${_konto})`, zeilen: gebaut.zeilen });
          status.textContent = t('kasse.bookDone');
        },
      }),
      status,
    ]),
    el('p', { class: 'muted small', text: t('kasse.openingHint') }),
  ]);
}

function negativWarnung(bericht) {
  const n = bericht.ersteNegative;
  return el('div', { class: 'card hinweis' }, [
    el('strong', { text: t('kasse.negativeTitle') }),
    el('p', { class: 'small', text: `${t('kasse.negativeAt')} ${n ? n.datum : ''} (#${n ? n.seq : ''}). ${t('kasse.negativeNote')}` }),
  ]);
}

function berichtKarte(b) {
  const line = (label, cents, strong) => el('div', { class: 'report-line' + (strong ? ' strong' : '') }, [
    el('span', { text: label }), el('span', { class: 'num', text: formatEuro(cents) }),
  ]);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('kasse.reportTitle') }),
    line(t('kasse.opening'), b.anfangsbestand),
    line(t('kasse.sumIn'), b.summeEinnahmen),
    line(t('kasse.sumOut'), b.summeAusgaben),
    el('div', { class: 'mycel-divider' }),
    line(t('kasse.closing'), b.endbestand, true),
  ]);
}

function eintraegeTabelle(b) {
  const rows = b.zeilen.map((z) => el('tr', { class: z.bestand < 0 ? 'audit-fail' : undefined }, [
    el('td', { class: 'mono small', text: z.datum }),
    el('td', { class: 'mono small', text: String(z.seq) }),
    el('td', { text: z.beschreibung }),
    el('td', { class: 'num', text: z.einnahme ? formatEuro(z.einnahme) : '' }),
    el('td', { class: 'num', text: z.ausgabe ? formatEuro(z.ausgabe) : '' }),
    el('td', { class: 'num', text: formatEuro(z.bestand) }),
  ]));
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('journal.date') }), el('th', { text: '#' }), el('th', { text: t('journal.desc') }),
      el('th', { class: 'num', text: t('kasse.in') }), el('th', { class: 'num', text: t('kasse.out') }),
      el('th', { class: 'num', text: t('kasse.balance') }),
    ])),
    el('tbody', {}, rows.length ? rows : [el('tr', {}, [el('td', { colspan: '6', class: 'muted small', text: t('kasse.empty') })])]),
  ]);
}

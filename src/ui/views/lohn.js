// src/ui/views/lohn.js — V-Lohn / Schritt L3 — Lohn-/Gehaltsbuchung (Brutto-Methode).
//
// EHRLICHE ABGRENZUNG (im UI sichtbar): BookLedgerPro RECHNET die Lohnsteuer/Sozialversicherung
// NICHT. Du gibst die bereits berechneten Beträge ein (aus der Entgeltabrechnung des Lohnbüros/
// Steuerberaters/Lohnprogramms); BLP bucht sie GoBD-sicher (Brutto-Methode) und führt ein
// Lohnkonto je Mitarbeiter. Festschreiben bleibt manuell (GoBD) — diese Ansicht erzeugt nur Entwürfe.
//
// Reine Logik (node-getestet) in domain/lohnbuchung.js; Store/Buchungs-Glue in domain/lohn-store.js.
// DOM/IndexedDB-Pfad: statisch geprüft (kein Headless-Browser).

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatCents, parseEuroToCents } from '../../domain/money.js';
import { navigate, getSettings } from '../../state.js';
import {
  lohnBuchungZeilen, validateLohnlauf, lohnkontoAggregat, lohnsteuerAnmeldung,
  offeneLohnabgaben, LOHN_AUSZAHLUNG,
} from '../../domain/lohnbuchung.js';
import {
  saveLohnlauf, listLohnlaeufe, deleteLohnlauf, bucheLohnlauf, bucheLohnabgaben,
} from '../../domain/lohn-store.js';
import { buildLohnsteuerAnmeldungPaket } from '../../domain/export.js';
import { listBuchungen } from '../../domain/store.js';
import { downloadText } from '../../core/files.js';
import { listMitarbeiter } from '../../domain/crm-store.js';
import { emptyState } from '../empty.js';

let _host = null;
let _mitarbeiter = [];
let _banner = null; // {kind:'ok'|'err', text}
let _lstMonat = null; // gewählter Monat der Lohnsteuer-Anmeldung

export async function mountLohn(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const [mitarbeiter, laeufe, buchungen] = await Promise.all([listMitarbeiter(), listLohnlaeufe(), listBuchungen()]);
  _mitarbeiter = mitarbeiter.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  laeufe.sort((a, b) => (b.monat || '').localeCompare(a.monat || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('lohn.title') }),
    el('p', { class: 'muted small', text: t('lohn.hint') }),
    _banner ? el('p', { class: _banner.kind === 'err' ? 'form-error' : 'muted small', text: _banner.text }) : null,
    _mitarbeiter.length ? lohnlaufForm() : el('div', { class: 'card' }, [
      el('p', { class: 'muted', text: t('lohn.noEmployees') }),
      el('div', { class: 'btn-row' }, [el('button', { class: 'btn', text: t('nav.employees'), onClick: () => navigate('employees') })]),
    ]),
    lohnlaufListe(laeufe),
    abgabenKarte(buchungen),
    lohnsteuerKarte(laeufe),
    lohnkontoKarte(laeufe),
  ]));
  _banner = null; // Banner nur einmal zeigen.
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);
const euroInput = () => el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00' });

function lohnlaufForm() {
  const mitarbeiter = el('select', {},
    _mitarbeiter.map((m) => el('option', { value: m.id, text: m.name || m.id })));
  const monat = el('input', { type: 'month', value: new Date().toISOString().slice(0, 7) });
  const brutto = euroInput(), lohnsteuer = euroInput(), solz = euroInput();
  const kirche = euroInput(), svAn = euroInput(), svAg = euroInput();
  const auszahlung = el('select', {}, [
    el('option', { value: LOHN_AUSZAHLUNG.BANK, text: t('lohn.payoutBank') }),
    el('option', { value: LOHN_AUSZAHLUNG.VERBINDLICHKEIT, text: t('lohn.payoutLiability') }),
  ]);
  const preview = el('p', { class: 'muted small' });
  const err = el('p', { class: 'form-error' });

  // Live-Vorschau: Netto + Ausgeglichenheit über die reine Logik (kein Rechnen im DOM).
  const eingabe = () => ({
    bruttoCent: parseEuroToCents(brutto.value || '0'),
    lohnsteuerCent: parseEuroToCents(lohnsteuer.value || '0'),
    solzCent: parseEuroToCents(solz.value || '0'),
    kirchensteuerCent: parseEuroToCents(kirche.value || '0'),
    svAnCent: parseEuroToCents(svAn.value || '0'),
    svAgCent: parseEuroToCents(svAg.value || '0'),
  });
  const aktualisiere = () => {
    const r = lohnBuchungZeilen(eingabe(), { auszahlung: auszahlung.value });
    preview.textContent = t('lohn.previewNet')
      .replace('{netto}', formatCents(r.nettoCent))
      .replace('{soll}', formatCents(r.sollCent))
      .replace('{haben}', formatCents(r.habenCent));
  };
  for (const inp of [brutto, lohnsteuer, solz, kirche, svAn, svAg, auszahlung]) inp.oninput = aktualisiere;
  aktualisiere();

  return el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      const m = _mitarbeiter.find((x) => x.id === mitarbeiter.value);
      const lauf = { ...eingabe(), mitarbeiterId: mitarbeiter.value, name: m ? m.name : '', monat: monat.value, auszahlung: auszahlung.value };
      const pruefung = validateLohnlauf(lauf);
      if (!pruefung.ok) { err.textContent = pruefung.errors.join(' '); return; }
      await saveLohnlauf(lauf);
      _banner = { kind: 'ok', text: t('lohn.saved') };
      await repaint();
    },
  }, [
    el('h2', { class: 'card-title', text: t('lohn.new') }),
    el('div', { class: 'form-grid' }, [
      field(t('lohn.employee'), mitarbeiter),
      field(t('lohn.month'), monat),
      field(t('lohn.gross'), brutto),
      field(t('lohn.wageTax'), lohnsteuer),
      field(t('lohn.solz'), solz),
      field(t('lohn.churchTax'), kirche),
      field(t('lohn.svEmployee'), svAn),
      field(t('lohn.svEmployer'), svAg),
      field(t('lohn.payout'), auszahlung),
    ]),
    preview,
    err,
    el('div', { class: 'btn-row' }, [el('button', { class: 'btn btn-primary', type: 'submit', text: t('lohn.save') })]),
  ]);
}

function lohnlaufListe(laeufe) {
  if (!laeufe.length) return el('div', { class: 'card' }, [emptyState('empty-reports.png', t('lohn.empty'))]);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('lohn.list') }),
    ...laeufe.map((l) => el('div', { class: 'report-line' }, [
      el('span', { class: 'small', text: `${l.name || '—'} · ${l.monat || '—'} · ${t('lohn.gross')} ${formatCents(l.bruttoCent)} · ${t('lohn.net')} ${formatCents(l.nettoCent)}` }),
      el('span', { class: 'btn-row' }, [
        l.buchungId
          ? el('span', { class: 'badge badge-ok', text: t('lohn.booked') })
          : el('button', { class: 'btn btn-sm', text: t('lohn.book'), onClick: async () => {
              try { await bucheLohnlauf(l.id); _banner = { kind: 'ok', text: t('lohn.bookedBanner') }; }
              catch (e2) { _banner = { kind: 'err', text: String(e2.message || e2) }; }
              await repaint();
            } }),
        el('button', { class: 'btn btn-sm', text: t('lohn.delete'), onClick: async () => { await deleteLohnlauf(l.id); await repaint(); } }),
      ]),
    ])),
  ]);
}

function abgabenKarte(buchungen) {
  const offen = offeneLohnabgaben(buchungen);
  if (offen.summeCent <= 0) return null; // nichts abzuführen → keine Karte
  const zeile = (label, cent, strong) => el('div', { class: 'report-line' + (strong ? ' strong' : '') }, [
    el('span', { class: 'small', text: label }), el('span', { class: 'small', text: formatCents(cent) }),
  ]);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('lohn.dueTitle') }),
    zeile(t('lohn.dueTax'), offen.lohnsteuerCent),
    zeile(t('lohn.dueSv'), offen.sozialCent),
    zeile(t('lohn.dueTotal'), offen.summeCent, true),
    el('p', { class: 'muted small', text: t('lohn.dueHint') }),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn-sm', text: t('lohn.dueBook'),
        onClick: async () => {
          try { await bucheLohnabgaben({ lohnsteuerCent: offen.lohnsteuerCent, sozialCent: offen.sozialCent }); _banner = { kind: 'ok', text: t('lohn.dueBooked') }; }
          catch (e2) { _banner = { kind: 'err', text: String(e2.message || e2) }; }
          await repaint();
        },
      }),
    ]),
  ]);
}

function lohnsteuerKarte(laeufe) {
  if (!laeufe.length) return null;
  const monat = _lstMonat || new Date().toISOString().slice(0, 7);
  const anm = lohnsteuerAnmeldung(laeufe, { monat });
  const monatInput = el('input', { type: 'month', value: monat });
  monatInput.onchange = () => { _lstMonat = monatInput.value; repaint(); };
  const f = getSettings().firma || {};
  const meta = { firma: f.name || '', steuernummer: f.steuernummer || '' };
  const zeile = (label, cent, strong) => el('div', { class: 'report-line' + (strong ? ' strong' : '') }, [
    el('span', { class: 'small', text: label }), el('span', { class: 'small', text: formatCents(cent) }),
  ]);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('lohn.lstTitle') }),
    el('div', { class: 'setting' }, [el('span', { class: 'muted small', text: t('lohn.month') }), monatInput]),
    zeile(t('lohn.wageTax'), anm.lohnsteuerCent),
    zeile(t('lohn.solz'), anm.solzCent),
    zeile(t('lohn.churchTax'), anm.kirchensteuerCent),
    zeile(t('lohn.lstTotal'), anm.summeCent, true),
    el('p', { class: 'muted small', text: t('lohn.lstHint') }),
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-sm', text: t('lohn.lstDownload'), onClick: () => downloadText(`lohnsteuer-anmeldung-${monat}.csv`, '﻿' + buildLohnsteuerAnmeldungPaket(anm, meta), 'text/csv') }),
      el('a', { class: 'btn btn-sm', href: 'https://www.elster.de/eportal/formulare-leistungen/alleformulare', target: '_blank', rel: 'noopener noreferrer', text: t('lohn.lstElster') }),
    ]),
  ]);
}

function lohnkontoKarte(laeufe) {
  if (!laeufe.length) return null;
  const jahr = new Date().getFullYear();
  const agg = lohnkontoAggregat(laeufe, { jahr });
  if (!agg.proMitarbeiter.length) return null;
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('lohn.account').replace('{jahr}', String(jahr)) }),
    ...agg.proMitarbeiter.map((m) => el('div', { class: 'report-line' }, [
      el('span', { class: 'small', text: `${m.name || '—'} · ${m.anzahl}× · ${t('lohn.gross')} ${formatCents(m.bruttoCent)}` }),
      el('span', { class: 'small muted', text: `${t('lohn.net')} ${formatCents(m.nettoCent)}` }),
    ])),
    el('div', { class: 'report-line' }, [
      el('span', { class: 'small', text: t('lohn.total') }),
      el('span', { class: 'small', text: `${t('lohn.gross')} ${formatCents(agg.summe.bruttoCent)} · ${t('lohn.net')} ${formatCents(agg.summe.nettoCent)}` }),
    ]),
  ]);
}

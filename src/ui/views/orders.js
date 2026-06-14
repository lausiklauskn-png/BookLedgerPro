// src/ui/views/orders.js — Aufträge: Positionen, Status-Workflow, Rechnung → Buchung.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, parseEuroToCents } from '../../domain/money.js';
import { AUFTRAG_STATUS, STATUS_FLOW, auftragSummen, validateAuftrag } from '../../domain/orders.js';
import { UST_SAETZE } from '../../domain/taxes.js';
import {
  listAuftraege, saveAuftrag, deleteAuftrag, setAuftragStatus, rechnungAusAuftrag,
  listKunden, listKostenstellen, ensureKostenstellenSeeded,
} from '../../domain/crm-store.js';
import { emptyState } from '../empty.js';

let _host = null;
let _kunden = [];
let _kostenstellen = [];

export async function mountOrders(host) {
  _host = host;
  await ensureKostenstellenSeeded();
  await repaint();
}

async function repaint(banner) {
  [_kunden, _kostenstellen] = await Promise.all([listKunden(), listKostenstellen()]);
  const auftraege = await listAuftraege();
  auftraege.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('orders.title') }),
    banner || null,
    form(),
    liste(auftraege),
  ]));
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

function positionsRow() {
  const desc = el('input', { type: 'text', placeholder: t('orders.posDesc') });
  const menge = el('input', { type: 'text', value: '1' });
  const preis = el('input', { type: 'text', placeholder: '0,00' });
  const ust = el('select', {}, UST_SAETZE.map((s) => el('option', { value: String(s) }, `${s} %`)));
  const row = el('div', { class: 'pos-row' }, [desc, menge, preis, ust]);
  row._read = () => ({
    beschreibung: desc.value,
    menge: Number(String(menge.value).replace(',', '.')) || 0,
    einzelpreisCent: parseEuroToCents(preis.value) || 0,
    ustSatz: Number(ust.value) || 0,
  });
  return row;
}

function form() {
  const titel = el('input', { type: 'text', placeholder: t('orders.titel') });
  const kunde = el('select', {}, [el('option', { value: '' }, t('orders.none')),
    ..._kunden.map((k) => el('option', { value: k.id }, k.name))]);
  const ks = el('select', {}, [el('option', { value: '' }, t('journal.noKostenstelle')),
    ..._kostenstellen.map((k) => el('option', { value: k.nummer }, `${k.nummer} · ${k.name}`))]);
  const posBox = el('div', { class: 'pos-box' }, [positionsRow()]);
  const addPos = el('button', { class: 'btn btn-sm', type: 'button', text: t('orders.addPos'),
    onClick: () => posBox.appendChild(positionsRow()) });
  const err = el('p', { class: 'form-error' });

  return el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const positionen = Array.from(posBox.children).map((r) => r._read()).filter((p) => p.einzelpreisCent > 0);
      const auftrag = { titel: titel.value, kundeId: kunde.value || null, kostenstelle: ks.value || null, positionen };
      const fehler = validateAuftrag(auftrag);
      if (fehler.length) { err.textContent = fehler.join(' '); return; }
      await saveAuftrag(auftrag);
      await repaint();
    },
  }, [
    el('h2', { class: 'card-title', text: t('orders.new') }),
    el('div', { class: 'form-grid' }, [field(t('orders.titel'), titel), field(t('orders.customer'), kunde), field(t('orders.kostenstelle'), ks)]),
    el('div', { class: 'pos-head' }, [el('span', { text: t('orders.posDesc') }), el('span', { text: t('orders.qty') }), el('span', { text: t('orders.price') }), el('span', { text: t('orders.vat') })]),
    posBox,
    el('div', { class: 'btn-row' }, [addPos]),
    err,
    el('div', { class: 'btn-row' }, [el('button', { class: 'btn btn-primary', type: 'submit', text: t('orders.create') })]),
  ]);
}

function statusBadge(status) {
  return el('span', { class: 'badge ' + (status === 'berechnet' ? 'badge-ok' : 'badge-entwurf'), text: t('orders.status.' + status) });
}

function liste(auftraege) {
  if (!auftraege.length) return emptyState('empty-orders.png', t('orders.empty'));
  const kundeName = (id) => (_kunden.find((k) => k.id === id) || {}).name || '';
  const rows = auftraege.map((a) => {
    const s = auftragSummen(a.positionen);
    return el('tr', {}, [
      el('td', {}, [el('div', { text: a.titel || '—' }), el('div', { class: 'muted small', text: kundeName(a.kundeId) })]),
      el('td', { text: a.kostenstelle || '' , class: 'mono small' }),
      el('td', { class: 'num', text: formatEuro(s.brutto) }),
      el('td', {}, [statusBadge(a.status)]),
      el('td', { class: 'actions' }, [aktionen(a)]),
    ]);
  });
  return el('div', { class: 'card no-pad' }, [el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('orders.titel') }), el('th', { text: t('orders.kostenstelle') }),
      el('th', { class: 'num', text: t('orders.gross') }), el('th', { text: t('orders.status') }), el('th', {}),
    ])),
    el('tbody', {}, rows),
  ])]);
}

function aktionen(a) {
  const wrap = el('div', { class: 'btn-row' });
  for (const next of STATUS_FLOW[a.status] || []) {
    if (next === AUFTRAG_STATUS.BERECHNET) continue; // über Rechnung-Button
    wrap.appendChild(el('button', { class: 'btn btn-sm', text: t('orders.status.' + next),
      onClick: async () => { await setAuftragStatus(a.id, next); await repaint(); } }));
  }
  if (!a.rechnungBuchungId && a.positionen.length) {
    wrap.appendChild(el('button', {
      class: 'btn btn-sm btn-primary', text: t('orders.invoice'),
      onClick: async () => {
        if (!confirm(t('orders.confirmInvoice'))) return;
        try { await rechnungAusAuftrag(a.id); await repaint(el('div', { class: 'banner banner-warn', text: t('orders.invoiceDone') })); }
        catch (e) { alert(String(e.message || e)); }
      },
    }));
  }
  wrap.appendChild(el('button', { class: 'btn btn-sm', text: t('common.delete'),
    onClick: async () => { if (confirm(t('common.delete') + '?')) { await deleteAuftrag(a.id); await repaint(); } } }));
  return wrap;
}

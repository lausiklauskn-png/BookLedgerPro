// src/ui/views/orders.js — Aufträge: Positionen, Status-Workflow, Rechnung → Buchung.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, parseEuroToCents } from '../../domain/money.js';
import { AUFTRAG_STATUS, STATUS_FLOW, auftragSummen, validateAuftrag } from '../../domain/orders.js';
import { UST_SAETZE } from '../../domain/taxes.js';
import {
  listAuftraege, saveAuftrag, deleteAuftrag, setAuftragStatus, rechnungAusAuftrag,
  listKunden, getKunde, listKostenstellen, ensureKostenstellenSeeded, importWorkFloh,
} from '../../domain/crm-store.js';
import { normalizeImport } from '../../domain/importworkfloh.js';
import { buildAustauschPaket, parseAustauschPaket, austauschDateiname } from '../../domain/connect.js';
import { pickFile, readFileText, downloadText } from '../../core/files.js';
import { baueRechnung, pflichtangaben } from '../../domain/rechnung.js';
import { baueXRechnungCII, xRechnungDateiname } from '../../domain/erechnung.js';
import { getSettings } from '../../state.js';
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
    importKarte(),
    form(),
    liste(auftraege),
  ]));
}

// Import aus WorkFloh (JSON) — Kunden + Aufträge inkl. Auftragsnummern.
function importKarte() {
  const status = el('p', { class: 'muted small' });
  const btn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('import.button'),
    onClick: async () => {
      try {
        const file = await pickFile('application/json,.json', null);
        if (!file) return;
        const text = await readFileText(file);
        const res = parseAustauschPaket(text);
        if (!res.ok) { status.textContent = t('import.error') + ' ' + res.fehler; return; }
        const parsed = normalizeImport(res.obj);
        const r = await importWorkFloh(parsed);
        const teile = [
          `${r.kundenNeu} ${t('import.customers')}`,
          `${r.auftraegeNeu} ${t('import.orders')}`,
        ];
        if (r.rechnungenUebernommen) teile.push(`${r.rechnungenUebernommen} ${t('import.invoices')}`);
        if (r.zahlungenUebernommen) teile.push(`${r.zahlungenUebernommen} ${t('import.payments')}`);
        if (r.auftraegeUebersprungen) teile.push(`${r.auftraegeUebersprungen} ${t('import.skipped')}`);
        if (parsed.warnungen.length) teile.push(`${parsed.warnungen.length} ${t('import.notes')}`);
        await repaint(el('div', { class: 'banner banner-warn', text: t('import.done') + ' ' + teile.join(' · ') }));
      } catch (e) { status.textContent = t('import.error') + ' ' + String(e.message || e); }
    },
  });
  const exportBtn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('connect.export'),
    onClick: async () => {
      try {
        const paket = buildAustauschPaket({ kunden: await listKunden(), auftraege: await listAuftraege() });
        downloadText(austauschDateiname(), JSON.stringify(paket, null, 2), 'application/json');
      } catch (e) { status.textContent = t('import.error') + ' ' + String(e.message || e); }
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('import.title') }),
    el('p', { class: 'muted small', text: t('import.hint') }),
    el('div', { class: 'btn-row' }, [btn, exportBtn, status]),
    el('p', { class: 'muted small', text: t('connect.hint') }),
  ]);
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

function positionsRow() {
  const desc = el('input', { type: 'text', placeholder: t('orders.posDesc') });
  const menge = el('input', { type: 'text', value: '1' });
  const preis = el('input', { type: 'text', placeholder: '0,00' });
  const ust = el('select', {}, UST_SAETZE.map((s) => el('option', { value: String(s) }, `${s} %`)));
  const remove = el('button', {
    class: 'btn btn-sm btn-danger pos-remove', type: 'button', text: '✕', title: t('orders.removePos'),
    onClick: () => { const box = row.parentElement; if (box && box.querySelectorAll('.pos-row').length > 1) row.remove(); },
  });
  const row = el('div', { class: 'pos-row' }, [desc, menge, preis, ust, remove]);
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
  const defaultZiel = getSettings().zahlungszielTage;
  const ziel = el('input', { type: 'number', min: '0', step: '1', placeholder: String(defaultZiel != null ? defaultZiel : 14) });
  const posBox = el('div', { class: 'pos-box' }, [positionsRow()]);
  const addPos = el('button', { class: 'btn btn-sm', type: 'button', text: t('orders.addPos'),
    onClick: () => posBox.appendChild(positionsRow()) });
  const err = el('p', { class: 'form-error' });

  return el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const positionen = Array.from(posBox.children).map((r) => r._read()).filter((p) => p.einzelpreisCent > 0);
      const zielRoh = String(ziel.value).trim();
      const zahlungszielTage = zielRoh === '' ? null : Math.trunc(Number(zielRoh));
      const auftrag = { titel: titel.value, kundeId: kunde.value || null, kostenstelle: ks.value || null, zahlungszielTage, positionen };
      const fehler = validateAuftrag(auftrag);
      if (fehler.length) { err.textContent = fehler.join(' '); return; }
      await saveAuftrag(auftrag);
      await repaint();
    },
  }, [
    el('h2', { class: 'card-title', text: t('orders.new') }),
    el('div', { class: 'form-grid' }, [field(t('orders.titel'), titel), field(t('orders.customer'), kunde), field(t('orders.kostenstelle'), ks), field(t('orders.zahlungsziel'), ziel)]),
    el('p', { class: 'muted small', text: t('orders.zahlungsziel.hint') }),
    el('div', { class: 'pos-head' }, [el('span', { text: t('orders.posDesc') }), el('span', { text: t('orders.qty') }), el('span', { text: t('orders.price') }), el('span', { text: t('orders.vat') }), el('span', {})]),
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

// ---- Rechnungs-Dokument (druckbar, § 14 UStG) ------------------------------

async function rechnungAnzeigen(a) {
  const s = getSettings();
  const kunde = a.kundeId ? (await getKunde(a.kundeId)) || {} : {};
  const rechnung = baueRechnung({
    auftrag: a, kunde, firma: s.firma || {},
    nummer: a.rechnungNummer, datum: a.rechnungDatum, leistungsdatum: a.rechnungDatum,
    kleinunternehmer: s.kleinunternehmer, defaultZielTage: s.zahlungszielTage,
  });
  mount(_host, rechnungView(rechnung));
}

function adrBlock(titel, zeilen) {
  return el('div', { class: 'rech-adr' }, [
    el('div', { class: 'muted small', text: titel }),
    ...zeilen.filter(Boolean).map((z) => el('div', { text: z })),
  ]);
}

function rechnungView(r) {
  const fehlt = pflichtangaben(r);
  const posRows = r.positionen.map((p) => el('tr', {}, [
    el('td', { text: p.beschreibung || '—' }),
    el('td', { class: 'num', text: String(p.menge) }),
    el('td', { class: 'num', text: formatEuro(p.einzelpreisCent) }),
    el('td', { class: 'num', text: `${p.ustSatz} %` }),
    el('td', { class: 'num', text: formatEuro(p.netto) }),
  ]));
  const sumRows = [
    el('div', { class: 'report-line' }, [el('span', { text: t('reports.income') + ' (netto)' }), el('span', { class: 'num', text: formatEuro(r.netto) })]),
    ...r.steuerzeilen.filter((z) => z.satz > 0 && !r.kleinunternehmer).map((z) =>
      el('div', { class: 'report-line' }, [el('span', { text: `USt ${z.satz} %` }), el('span', { class: 'num', text: formatEuro(z.ust) })])),
    el('div', { class: 'report-line strong' }, [el('span', { text: t('orders.gross') }), el('span', { class: 'num', text: formatEuro(r.brutto) })]),
  ];
  return el('section', { class: 'view' }, [
    el('div', { class: 'btn-row no-print' }, [
      el('button', { class: 'btn', text: t('common.back'), onClick: () => repaint() }),
      el('button', { class: 'btn btn-primary', text: t('reports.print'), onClick: () => window.print() }),
      el('button', {
        class: 'btn', text: t('orders.xrechnung'), title: t('orders.xrechnung.hint'),
        onClick: () => downloadText(xRechnungDateiname(r), baueXRechnungCII(r), 'application/xml'),
      }),
    ]),
    fehlt.length ? el('div', { class: 'hinweis no-print' }, [
      el('strong', { class: 'small', text: t('orders.invoiceMissing') }),
      el('ul', { class: 'hinweis-liste' }, fehlt.map((m) => el('li', { class: 'small', text: m }))),
    ]) : null,
    el('div', { class: 'card rechnung-doc' }, [
      el('div', { class: 'rech-kopf' }, [
        adrBlock(t('orders.issuer'), [r.firma.name, r.firma.anschrift, r.firma.steuernummer ? `St.-Nr.: ${r.firma.steuernummer}` : '', r.firma.ustId ? `USt-IdNr.: ${r.firma.ustId}` : '']),
        adrBlock(t('orders.recipient'), [r.kunde.name, r.kunde.adresse, r.kunde.ustId ? `USt-IdNr.: ${r.kunde.ustId}` : '']),
      ]),
      el('h2', { class: 'card-title', text: `${t('orders.invoiceTitle')} ${r.nummer || ''}` }),
      el('div', { class: 'muted small' }, [
        el('span', { text: `${t('journal.date')}: ${r.datum || '—'}` }),
        el('span', { text: `   ·   ${t('orders.serviceDate')}: ${r.leistungsdatum || '—'}` }),
        r.zahlbarBis ? el('span', { text: `   ·   ${t('orders.payableUntil')}: ${r.zahlbarBis}` }) : null,
      ]),
      r.titel ? el('p', { text: r.titel }) : null,
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', { text: t('orders.posDesc') }), el('th', { class: 'num', text: t('orders.qty') }),
          el('th', { class: 'num', text: t('orders.price') }), el('th', { class: 'num', text: t('orders.vat') }),
          el('th', { class: 'num', text: t('reports.income') }),
        ])),
        el('tbody', {}, posRows),
      ]),
      el('div', { class: 'rech-summen' }, sumRows),
      r.kleinunternehmer ? el('p', { class: 'muted small', text: t('orders.kleinunternehmerHinweis') }) : null,
    ]),
  ]);
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
  if (a.rechnungNummer) {
    wrap.appendChild(el('button', { class: 'btn btn-sm', text: t('orders.showInvoice'),
      onClick: () => rechnungAnzeigen(a) }));
  }
  wrap.appendChild(el('button', { class: 'btn btn-sm', text: t('common.delete'),
    onClick: async () => { if (confirm(t('common.delete') + '?')) { await deleteAuftrag(a.id); await repaint(); } } }));
  return wrap;
}

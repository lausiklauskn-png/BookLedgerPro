// src/ui/views/payables.js — Verbindlichkeiten (Kreditoren) manuell anlegen/bearbeiten (R3).
// Spiegelbild zu Aufträgen/Forderungen: hier werden Eingangsrechnungen erfasst, die noch
// nicht (vollständig) bezahlt sind. Beim Anlegen wird optional „auf Ziel" gebucht (Aufwand +
// abziehbare Vorsteuer AN Verbindlichkeiten 1600) als ENTWURF — Festschreiben bleibt manuell
// (GoBD). Zahlungen erfolgen im Bankimport-Zahlungsabgleich (richtung 'ausgabe').
//
// ⚠️ Browser-Pfad: nutzt Vault/IndexedDB (payables-store, store) → NICHT im Node-Test
// abgedeckt. Die reine Logik (Buchungszeilen, Fälligkeit, Status, Validierung, Extraktion)
// liegt in src/domain/payables.js und ist node-getestet.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, parseEuroToCents } from '../../domain/money.js';
import {
  eingangsrechnungZeilen, offenerBetrag, rechnungStatus, rechnungBrutto,
  berechneFaelligAm, validateEingangsrechnung,
} from '../../domain/payables.js';
import {
  listEingangsrechnungen, saveEingangsrechnung, stornoEingangsrechnung, deleteEingangsrechnung,
} from '../../domain/payables-store.js';
import { loadAccounts, saveEntwurf } from '../../domain/store.js';
import { emptyState } from '../empty.js';

let _host = null;
let _idx = {};
let _bearbeite = null; // aktuell bearbeitete Rechnung (oder null = Neuanlage)

const AUFWAND_DEFAULT = '4980';
const ZIEL_DEFAULT = 30;

export async function mountPayables(host) {
  _host = host;
  const konten = await loadAccounts();
  _idx = {};
  for (const k of konten) _idx[k.nummer] = k;
  await repaint();
}

async function repaint() {
  const rechnungen = await listEingangsrechnungen();
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('pay.title') }),
    el('p', { class: 'muted small', text: t('pay.intro') }),
    formKarte(),
    liste(rechnungen),
  ]));
}

// ---- Erfassungs-/Bearbeitungsformular ---------------------------------------

function formKarte() {
  const b = _bearbeite;
  const erstePos = b && b.positionen && b.positionen[0] ? b.positionen[0] : null;
  const gebucht = !!(b && b.buchungRef);

  const kreditor = el('input', { type: 'text', placeholder: t('pay.creditor'), value: b ? b.kreditor || '' : '' });
  const rechnungsnr = el('input', { type: 'text', placeholder: t('pay.invoiceNo'), value: b ? b.rechnungsnr || '' : '' });
  const datum = el('input', { type: 'date', value: b ? b.datum || '' : new Date().toISOString().slice(0, 10) });
  const ziel = el('input', { type: 'number', min: '0', step: '1', placeholder: String(ZIEL_DEFAULT),
    value: b && b.zahlungszielTage != null ? String(b.zahlungszielTage) : '' });
  const netto = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00',
    value: erstePos ? (erstePos.nettoCent / 100).toFixed(2).replace('.', ',') : '' });
  const ustSatz = el('select', {}, [0, 7, 19].map((s) =>
    el('option', { value: String(s), text: `${s} %`, selected: erstePos && Number(erstePos.ustSatz) === s ? 'selected' : null })));
  const aufwand = el('input', { type: 'text', placeholder: AUFWAND_DEFAULT,
    value: erstePos ? erstePos.aufwandKonto || '' : '', list: 'pay-aufwand-konten' });
  const notiz = el('input', { type: 'text', placeholder: t('pay.note'), value: b ? b.notiz || '' : '' });
  const buchen = el('input', { type: 'checkbox', checked: !gebucht ? 'checked' : null });
  buchen.checked = !gebucht;
  const err = el('p', { class: 'form-error' });
  const info = el('p', { class: 'muted small' });

  // Datalist mit Aufwandskonten (Klasse 3/4) für bequeme Kontowahl.
  const aufwandKonten = Object.values(_idx)
    .filter((k) => /^[34]/.test(String(k.nummer)))
    .sort((a, b2) => String(a.nummer).localeCompare(String(b2.nummer)));
  const datalist = el('datalist', { id: 'pay-aufwand-konten' },
    aufwandKonten.map((k) => el('option', { value: k.nummer, text: `${k.nummer} ${k.name}` })));

  const form = el('form', {
    class: 'card', onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = ''; info.textContent = '';
      const nettoCent = parseEuroToCents(netto.value);
      if (!Number.isInteger(nettoCent) || nettoCent < 0) { err.textContent = t('pay.errNetto'); return; }
      const aufwandKonto = (aufwand.value || '').trim() || AUFWAND_DEFAULT;
      if (!_idx[aufwandKonto]) { err.textContent = `${t('pay.errKonto')} (${aufwandKonto})`; return; }
      const zielTage = ziel.value.trim() === '' ? null : Math.round(Number(ziel.value));
      const rechnung = {
        id: b ? b.id : undefined,
        kreditor: kreditor.value.trim(),
        rechnungsnr: rechnungsnr.value.trim(),
        datum: datum.value,
        zahlungszielTage: zielTage,
        positionen: [{ nettoCent, ustSatz: Number(ustSatz.value), aufwandKonto }],
        notiz: notiz.value.trim(),
        // bestehende Felder erhalten (Zahlungen/Buchungsverweis nicht verlieren beim Bearbeiten)
        zahlungen: b ? b.zahlungen || [] : [],
        buchungRef: b ? b.buchungRef || null : null,
        storniert: b ? !!b.storniert : false,
        createdAt: b ? b.createdAt : undefined,
      };
      const fehler = validateEingangsrechnung(rechnung);
      if (fehler.length) { err.textContent = fehler.join(' '); return; }
      try {
        // „Auf Ziel" buchen (Entwurf), wenn gewünscht und noch nicht gebucht.
        if (buchen.checked && !rechnung.buchungRef) {
          const { zeilen } = eingangsrechnungZeilen(rechnung);
          const entwurf = await saveEntwurf({
            datum: rechnung.datum,
            beschreibung: `${t('pay.payable')}: ${rechnung.kreditor} ${rechnung.rechnungsnr}`.trim(),
            zeilen,
          });
          rechnung.buchungRef = entwurf.id;
        }
        await saveEingangsrechnung(rechnung);
        _bearbeite = null;
        await repaint();
      } catch (ex) { err.textContent = String(ex.message || ex); }
    },
  }, [
    el('h2', { class: 'card-title', text: b ? t('pay.editTitle') : t('pay.newTitle') }),
    datalist,
    el('div', { class: 'form-grid' }, [
      feld(t('pay.creditor'), kreditor),
      feld(t('pay.invoiceNo'), rechnungsnr),
      feld(t('pay.date'), datum),
      feld(t('pay.targetDays'), ziel),
      feld(t('pay.netto'), netto),
      feld(t('pay.ustRate'), ustSatz),
      feld(t('pay.expenseAccount'), aufwand),
      feld(t('pay.note'), notiz),
    ]),
    gebucht
      ? el('p', { class: 'muted small', text: t('pay.alreadyBooked') })
      : el('label', { class: 'inline-field' }, [buchen, el('span', { text: t('pay.bookOnAccount') })]),
    el('p', { class: 'muted small', text: t('pay.hint') }),
    err, info,
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-primary', type: 'submit', text: b ? t('common.save') : t('pay.add') }),
      b ? el('button', { class: 'btn', type: 'button', text: t('common.cancel'),
        onClick: async () => { _bearbeite = null; await repaint(); } }) : null,
    ]),
  ]);
  return form;
}

const feld = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

// ---- Liste der Verbindlichkeiten --------------------------------------------

function liste(rechnungen) {
  if (!rechnungen.length) return emptyState('empty-documents.png', t('pay.empty'));
  const heute = new Date().toISOString().slice(0, 10);
  const rows = rechnungen.map((r) => {
    const status = rechnungStatus(r);
    const offen = offenerBetrag(r);
    const faellig = berechneFaelligAm(r, ZIEL_DEFAULT);
    const ueberfaellig = status !== 'bezahlt' && status !== 'storniert' && faellig && faellig < heute;
    return el('tr', {}, [
      el('td', { text: r.kreditor || '—' }),
      el('td', { class: 'muted small mono', text: r.rechnungsnr || '' }),
      el('td', { class: 'muted small mono', text: r.datum || '' }),
      el('td', { class: 'muted small mono' + (ueberfaellig ? ' form-error' : ''), text: faellig || '—' }),
      el('td', { class: 'num mono', text: formatEuro(rechnungBrutto(r)) }),
      el('td', { class: 'num mono', text: formatEuro(offen) }),
      el('td', {}, [el('span', { class: 'badge ' + statusKlasse(status), text: t('pay.status.' + status) })]),
      el('td', { class: 'actions' }, [aktionen(r, status)]),
    ]);
  });
  return el('div', { class: 'card no-pad' }, [el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('pay.creditor') }), el('th', { text: t('pay.invoiceNo') }),
      el('th', { text: t('pay.date') }), el('th', { text: t('pay.due') }),
      el('th', { class: 'num', text: t('pay.gross') }), el('th', { class: 'num', text: t('pay.open') }),
      el('th', { text: t('pay.statusLabel') }), el('th', {}),
    ])),
    el('tbody', {}, rows),
  ])]);
}

function statusKlasse(status) {
  return status === 'bezahlt' ? 'badge-ok' : 'badge-entwurf';
}

function aktionen(r, status) {
  const wrap = el('div', { class: 'btn-row' });
  if (status !== 'storniert') {
    wrap.appendChild(el('button', { class: 'btn btn-sm', text: t('common.edit'),
      onClick: async () => { _bearbeite = r; await repaint(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }));
    wrap.appendChild(el('button', { class: 'btn btn-sm', text: t('pay.storno'),
      onClick: async () => { if (confirm(t('pay.confirmStorno'))) { await stornoEingangsrechnung(r.id); await repaint(); } } }));
  }
  // Löschen nur erlauben, solange keine Buchung verknüpft ist (GoBD: gebuchtes nicht spurlos löschen).
  if (!r.buchungRef) {
    wrap.appendChild(el('button', { class: 'btn btn-sm', text: t('common.delete'),
      onClick: async () => { if (confirm(t('common.delete') + '?')) { await deleteEingangsrechnung(r.id); await repaint(); } } }));
  }
  return wrap;
}

// src/ui/views/journal.js — Journal: Liste + Neue-Buchung-Formular, Festschreiben, Storno.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, listBuchungen, saveEntwurf, festschreiben, storno } from '../../domain/store.js';
import { baueBuchungZeilen, summeSeiten, validateBuchung, BUCHUNG_STATUS } from '../../domain/journal.js';
import { KONTOART } from '../../domain/accounts.js';
import { UST_SAETZE } from '../../domain/taxes.js';
import { listKostenstellen, ensureKostenstellenSeeded } from '../../domain/crm-store.js';
import { emptyState } from '../empty.js';

let _host = null;
let _kostenstellen = [];

export async function mountJournal(host) {
  _host = host;
  await ensureKostenstellenSeeded();
  await repaint();
}

async function repaint() {
  const [konten, buchungen, kostenstellen] = await Promise.all([loadAccounts(), listBuchungen(), listKostenstellen()]);
  _kostenstellen = kostenstellen;
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('journal.title') }),
    buchungForm(konten, idx),
    el('p', { class: 'muted small', text: t('journal.postedHint') }),
    el('div', { class: 'card no-pad' }, [buchungTabelle(buchungen, idx)]),
  ]));
}

function kontoOptions(konten) {
  return konten.map((k) => el('option', { value: k.nummer }, `${k.nummer} · ${k.name}`));
}

/** Bestimmt Steuer-Konto + Seite anhand der Buchungsrichtung. */
function pickSteuer(idx, konten, sollNr, habenNr, satz) {
  if (!satz) return null;
  const soll = idx[sollNr], haben = idx[habenNr];
  if (haben && haben.art === KONTOART.ERTRAG) {
    const k = konten.find((x) => x.rolle === 'umsatzsteuer' && x.ust === satz);
    if (k) return { steuerKonto: k.nummer, steuerSeite: 'H' };
  }
  if (soll && soll.art === KONTOART.AUFWAND) {
    const k = konten.find((x) => x.rolle === 'vorsteuer' && x.ust === satz);
    if (k) return { steuerKonto: k.nummer, steuerSeite: 'S' };
  }
  return null; // keine eindeutige Richtung → ohne USt-Split buchen
}

function buchungForm(konten, idx) {
  const heute = new Date().toISOString().slice(0, 10);
  const fDatum = el('input', { type: 'text', value: heute, placeholder: 'YYYY-MM-DD' });
  const fText = el('input', { type: 'text', placeholder: t('journal.desc') });
  const fSoll = el('select', {}, kontoOptions(konten));
  const fHaben = el('select', {}, kontoOptions(konten));
  const fBetrag = el('input', { type: 'text', placeholder: '0,00' });
  const fUst = el('select', {}, UST_SAETZE.map((s) => el('option', { value: String(s) }, `${s} %`)));
  const fKs = el('select', {}, [el('option', { value: '' }, t('journal.noKostenstelle')),
    ..._kostenstellen.map((k) => el('option', { value: k.nummer }, `${k.nummer} · ${k.name}`))]);
  fHaben.selectedIndex = Math.min(1, konten.length - 1);
  const err = el('p', { class: 'form-error', role: 'alert' });

  const submit = el('button', {
    class: 'btn btn-primary', type: 'submit', text: t('journal.saveDraft'),
  });

  const form = el('form', {
    class: 'buchung-form card',
    onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      try {
        const satz = Number(fUst.value) || 0;
        const steuer = pickSteuer(idx, konten, fSoll.value, fHaben.value, satz);
        const built = baueBuchungZeilen({
          sollKonto: fSoll.value, habenKonto: fHaben.value,
          brutto: fBetrag.value, ustSatz: steuer ? satz : 0,
          steuerKonto: steuer ? steuer.steuerKonto : null,
          steuerSeite: steuer ? steuer.steuerSeite : null,
        });
        const buchung = { datum: fDatum.value, beschreibung: fText.value, zeilen: built.zeilen, kostenstelle: fKs.value || null };
        const fehler = validateBuchung(buchung, idx);
        if (fehler.length) { err.textContent = fehler.join(' '); return; }
        await saveEntwurf(buchung);
        await repaint();
      } catch (ex) {
        err.textContent = String(ex.message || ex);
      }
    },
  }, [
    el('h2', { class: 'form-title', text: t('journal.new') }),
    el('div', { class: 'form-grid' }, [
      field(t('journal.date'), fDatum),
      field(t('journal.desc'), fText),
      field(t('journal.soll'), fSoll),
      field(t('journal.haben'), fHaben),
      field(t('journal.gross'), fBetrag),
      field(t('journal.ust'), fUst),
      field(t('journal.kostenstelle'), fKs),
    ]),
    err,
    el('div', { class: 'btn-row' }, [submit]),
  ]);
  return form;
}

function field(label, input) {
  return el('label', { class: 'field' }, [el('span', { text: label }), input]);
}

function statusBadge(status) {
  const map = {
    [BUCHUNG_STATUS.ENTWURF]: ['badge-entwurf', 'journal.status.entwurf'],
    [BUCHUNG_STATUS.FESTGESCHRIEBEN]: ['badge-ok', 'journal.status.festgeschrieben'],
    [BUCHUNG_STATUS.STORNIERT]: ['badge-storno', 'journal.status.storniert'],
  };
  const [cls, key] = map[status] || ['', 'journal.status.entwurf'];
  return el('span', { class: `badge ${cls}`, text: t(key) });
}

function buchungTabelle(buchungen, idx) {
  if (!buchungen.length) {
    return el('div', { class: 'pad' }, emptyState('empty-journal.png', t('journal.empty')));
  }
  const rows = [];
  for (const b of buchungen) {
    const betrag = summeSeiten(b.zeilen).soll;
    const zeilenTxt = b.zeilen.map((z) => `${z.seite} ${z.konto} ${formatEuro(z.betrag)}`).join('  ·  ');
    rows.push(el('tr', {}, [
      el('td', { class: 'mono', text: b.seq != null ? String(b.seq) : '–' }),
      el('td', { class: 'mono', text: b.datum }),
      el('td', {}, [
        el('div', { text: b.beschreibung || '—' }),
        el('div', { class: 'muted small mono', text: zeilenTxt }),
      ]),
      el('td', { class: 'num', text: formatEuro(betrag) }),
      el('td', {}, [statusBadge(b.status)]),
      el('td', { class: 'actions' }, [aktion(b)]),
    ]));
  }
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: t('journal.seq') }),
      el('th', { text: t('journal.date') }),
      el('th', { text: t('journal.desc') }),
      el('th', { class: 'num', text: t('journal.amount') }),
      el('th', { text: t('journal.status') }),
      el('th', {}),
    ])),
    el('tbody', {}, rows),
  ]);
}

function aktion(b) {
  if (b.status === BUCHUNG_STATUS.ENTWURF) {
    return el('button', {
      class: 'btn btn-sm btn-primary', text: t('journal.post'),
      onClick: async () => {
        if (!confirm(t('journal.confirmPost'))) return;
        try { await festschreiben(b.id); await repaint(); }
        catch (e) { alert(String(e.message || e)); }
      },
    });
  }
  if (b.status === BUCHUNG_STATUS.FESTGESCHRIEBEN) {
    return el('button', {
      class: 'btn btn-sm', text: t('journal.storno'),
      onClick: async () => {
        if (!confirm(t('journal.confirmStorno'))) return;
        try { await storno(b.id); await repaint(); }
        catch (e) { alert(String(e.message || e)); }
      },
    });
  }
  return el('span', { class: 'muted small', text: '—' });
}

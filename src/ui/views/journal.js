// src/ui/views/journal.js — Journal: Liste + Neue-Buchung-Formular, Festschreiben, Storno.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { loadAccounts, listBuchungen, saveEntwurf, festschreiben, storno, getBuchung, deleteEntwurf } from '../../domain/store.js';
import { baueBuchungZeilen, summeSeiten, BUCHUNG_STATUS, formularAusBuchung } from '../../domain/journal.js';
import { pruefeBuchung } from '../../domain/pruefung.js';
import { begruendeBuchung } from '../../ai/berater.js';
import { KONTOART } from '../../domain/accounts.js';
import { UST_SAETZE } from '../../domain/taxes.js';
import { listKostenstellen, ensureKostenstellenSeeded } from '../../domain/crm-store.js';
import { getSettings } from '../../state.js';
import { emptyState } from '../empty.js';

let _host = null;
let _kostenstellen = [];
let _idx = {};
let _letztesFestDatum = null;
let _hinweise = null; // Warnungen der zuletzt gespeicherten Buchung (nicht-blockierend)
let _editId = null;    // wird ein Entwurf bearbeitet?
let _editVorlage = null; // vorbefüllte Formularwerte (aus formularAusBuchung)

function centsZuEingabe(c) { return (Number(c || 0) / 100).toFixed(2).replace('.', ','); }

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
  _idx = idx;
  // Datum der zuletzt festgeschriebenen Buchung (für die Zeitnähe-Prüfung).
  _letztesFestDatum = buchungen
    .filter((b) => b.seq != null)
    .reduce((acc, b) => (acc && acc > b.datum ? acc : b.datum), null);

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('journal.title') }),
    buchungForm(konten, idx),
    _hinweise && _hinweise.length ? hinweisKarte(_hinweise) : null,
    el('p', { class: 'muted small', text: t('journal.postedHint') }),
    el('div', { class: 'card no-pad' }, [buchungTabelle(buchungen, idx)]),
  ]));
}

/** Nicht-blockierende Hinweis-Karte (gelb) zur zuletzt gespeicherten Buchung. */
function hinweisKarte(warnungen) {
  return el('div', { class: 'card hinweis' }, [
    el('strong', { text: t('journal.hints') }),
    el('ul', { class: 'hinweis-liste' }, warnungen.map((w) => el('li', { class: 'small', text: w }))),
    el('p', { class: 'muted small', text: t('journal.hintsNote') }),
  ]);
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

  // Bearbeiten: Formular aus dem Entwurf vorbefüllen.
  if (_editVorlage) {
    const v = _editVorlage;
    if (v.datum) fDatum.value = v.datum;
    fText.value = v.beschreibung;
    if (v.sollKonto) fSoll.value = v.sollKonto;
    if (v.habenKonto) fHaben.value = v.habenKonto;
    if (v.bruttoCent) fBetrag.value = centsZuEingabe(v.bruttoCent);
    fUst.value = String(v.ustSatz || 0);
    if (v.kostenstelle) fKs.value = v.kostenstelle;
  }
  const err = el('p', { class: 'form-error', role: 'alert' });

  const fBegruendung = el('textarea', { class: 'beleg-text', rows: '2', placeholder: t('journal.begruendungPlaceholder') });
  if (_editVorlage && _editVorlage.begruendung) fBegruendung.value = _editVorlage.begruendung;
  const beraterStatus = el('span', { class: 'muted small' });
  const beraterBtn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('journal.aiReason'),
    onClick: async () => {
      beraterStatus.textContent = '…';
      try {
        const sollK = idx[fSoll.value], habenK = idx[fHaben.value];
        const kontierung = `Soll ${fSoll.value} ${sollK ? sollK.name : ''} an Haben ${fHaben.value} ${habenK ? habenK.name : ''}`.replace(/\s+/g, ' ').trim();
        const r = await begruendeBuchung({
          beschreibung: fText.value, konto: fSoll.value, kontoName: sollK ? sollK.name : '',
          kontierung, text: fText.value,
          kleinunternehmer: getSettings().kleinunternehmer,
        });
        fBegruendung.value = r.text;
        beraterStatus.textContent = r.quelle === 'mistral' ? t('journal.aiReasonMistral') : t('journal.aiReasonLocal');
      } catch (e) { beraterStatus.textContent = String(e.message || e); }
    },
  });

  const submit = el('button', {
    class: 'btn btn-primary', type: 'submit', text: _editId ? t('journal.saveEdit') : t('journal.saveDraft'),
  });
  const cancelBtn = _editId ? el('button', {
    class: 'btn btn-sm', type: 'button', text: t('common.cancel'),
    onClick: async () => { _editId = null; _editVorlage = null; await repaint(); },
  }) : null;

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
        const buchung = { id: _editId || undefined, datum: fDatum.value, beschreibung: fText.value, begruendung: fBegruendung.value.trim(), zeilen: built.zeilen, kostenstelle: fKs.value || null };
        // Spielraum: Entwurf wird IMMER gespeichert. Hinweise blockieren nicht;
        // streng wird erst beim Festschreiben geprüft.
        await saveEntwurf(buchung);
        _editId = null; _editVorlage = null;
        const { warnungen } = pruefeBuchung(buchung, idx, { letztesFestDatum: _letztesFestDatum, kleinunternehmer: getSettings().kleinunternehmer });
        _hinweise = warnungen;
        await repaint();
      } catch (ex) {
        // Echter Erfassungs-Stopper bleibt nur „kein/ungültiger Betrag" (dann gibt es
        // keine Buchungszeilen) — alles andere ist ein nicht-blockierender Hinweis.
        err.textContent = String(ex.message || ex);
      }
    },
  }, [
    el('h2', { class: 'form-title', text: _editId ? t('journal.editTitle') : t('journal.new') }),
    el('div', { class: 'form-grid' }, [
      field(t('journal.date'), fDatum),
      field(t('journal.desc'), fText),
      field(t('journal.soll'), fSoll),
      field(t('journal.haben'), fHaben),
      field(t('journal.gross'), fBetrag),
      field(t('journal.ust'), fUst),
      field(t('journal.kostenstelle'), fKs),
    ]),
    el('label', { class: 'field' }, [
      el('span', { text: t('journal.begruendung') }),
      fBegruendung,
    ]),
    el('div', { class: 'btn-row' }, [beraterBtn, beraterStatus]),
    el('p', { class: 'muted small', text: t('journal.aiReasonNote') }),
    err,
    el('div', { class: 'btn-row' }, cancelBtn ? [submit, cancelBtn] : [submit]),
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
        b.begruendung ? el('div', { class: 'muted small', text: '📝 ' + b.begruendung }) : null,
      ]),
      el('td', { class: 'num', text: formatEuro(betrag) }),
      el('td', {}, [statusBadge(b.status)]),
      el('td', { class: 'actions' }, [aktion(b, idx)]),
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

function aktion(b, idx) {
  if (b.status === BUCHUNG_STATUS.ENTWURF) {
    const post = el('button', {
      class: 'btn btn-sm btn-primary', text: t('journal.post'),
      onClick: async () => {
        // Hinweise zeigen, aber den Profi entscheiden lassen (nicht-blockierend).
        const frisch = await getBuchung(b.id);
        const { warnungen } = pruefeBuchung(frisch, _idx, { letztesFestDatum: _letztesFestDatum, kleinunternehmer: getSettings().kleinunternehmer });
        let frage = t('journal.confirmPost');
        if (warnungen.length) frage = t('journal.hints') + ':\n– ' + warnungen.join('\n– ') + '\n\n' + frage;
        if (!confirm(frage)) return;
        try { _hinweise = null; await festschreiben(b.id); await repaint(); }
        catch (e) { alert(String(e.message || e)); }
      },
    });
    const edit = el('button', {
      class: 'btn btn-sm', text: t('journal.edit'),
      onClick: async () => {
        _editId = b.id;
        _editVorlage = formularAusBuchung(b, idx || _idx);
        _hinweise = null;
        await repaint();
        _host.scrollIntoView ? _host.scrollIntoView({ behavior: 'smooth', block: 'start' }) : null;
      },
    });
    const del = el('button', {
      class: 'btn btn-sm btn-danger', text: t('common.delete'),
      onClick: async () => {
        if (!confirm(t('journal.confirmDeleteDraft'))) return;
        try {
          await deleteEntwurf(b.id);
          if (_editId === b.id) { _editId = null; _editVorlage = null; }
          await repaint();
        } catch (e) { alert(String(e.message || e)); }
      },
    });
    return el('div', { class: 'btn-row' }, [post, edit, del]);
  }
  if (b.status === BUCHUNG_STATUS.FESTGESCHRIEBEN) {
    // Eine Storno-Gegenbuchung wird NICHT erneut storniert (sonst Endlos-Kaskade).
    if (b.stornoVon) return el('span', { class: 'muted small', text: t('journal.istStorno') });
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

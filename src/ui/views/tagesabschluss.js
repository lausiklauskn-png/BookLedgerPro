// src/ui/views/tagesabschluss.js — Tagesabschluss der offenen Ladenkasse und Quittungsvorlage
// (Klaus 2026-11-09, Bauplan Neuausrichtung M1, Weg c). Wird in „Kasse & Shop“ (views/kassenbuch.js) gezeigt.
//
// Ablauf: Kasse zählen → gezählten Bestand, Ausgaben, Bankeinzahlung, Privat eintragen (oder einen Satz sprechen:
// „Bestand 612 Euro, 20 Euro Kaffee ausgegeben, 300 zur Bank“ → „Übernehmen“ füllt die Felder) → die App rechnet die
// Tageseinnahme zurück und zeigt die Buchungen → Foto des Zählprotokolls → „Festschreiben“.
// Die Rechnung steht in domain/tagesabschluss.js (Node-Tests), Speichern in domain/tagesabschluss-store.js.

import { el } from '../dom.js';
import { t } from '../i18n.js';
import { getSettings } from '../../state.js';
import { formatEuro, formatCents, parseEuroToCents } from '../../domain/money.js';
import { rueckrechnung, tagesabschlussBuchungen, satzZuFeldern, fehlendeTage, quittungPruefen, ustHeraus,
  einnahmeAuffaellig, quittungenSumme, quittungenPruefen, quittungPdfBauen } from '../../domain/tagesabschluss.js';
import { listTagesabschluesse, kassenStandFuer, tagesabschlussFestschreiben, listQuittungen, quittungAblegen } from '../../domain/tagesabschluss-store.js';
import { pdfLibLaden } from '../../core/scanPdf.js';

const heuteIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const gesternIso = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const cent = (v) => { const c = parseEuroToCents(v); return Number.isFinite(c) ? c : 0; };
const GESCHLOSSEN_KEY = 'blpr_kasse_geschlossen';

function geschlossenLesen() { try { return JSON.parse(localStorage.getItem(GESCHLOSSEN_KEY) || '[]'); } catch { return []; } }
function geschlossenMerken(liste) { try { localStorage.setItem(GESCHLOSSEN_KEY, JSON.stringify(liste.slice(-400))); } catch { /* ohne Speicher */ } }

/** Karte „Tagesabschluss“. `neuZeichnen` wird nach dem Festschreiben gerufen. */
export async function tagesabschlussKarte(neuZeichnen) {
  const abschluesse = await listTagesabschluesse();
  const fehlen = fehlendeTage(abschluesse.map((a) => a.datum), { bis: gesternIso(), geschlossen: geschlossenLesen() });
  const box = el('div', { class: 'card', 'data-tagesabschluss': '' });
  let datum = fehlen[0] || heuteIso();
  if (abschluesse.some((a) => a.datum === datum)) datum = heuteIso();

  const datumIn = el('input', { type: 'date', value: datum, 'data-ta-datum': '' });
  const endIn = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00', 'data-ta-end': '' });
  const bankIn = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00', 'data-ta-bank': '' });
  const entIn = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00', 'data-ta-entnahme': '' });
  const einIn = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00', 'data-ta-einlage': '' });
  const satzIn = el('textarea', { rows: '2', 'data-mikro': 'tagesabschluss', 'data-ta-satz': '', name: 'notiz-tagesabschluss',
    placeholder: t('tagab.satzPlatz') });
  const fotoIn = el('input', { type: 'file', accept: 'image/*,application/pdf', capture: 'environment', 'data-ta-foto': '' });
  const quittungIn = el('input', { type: 'file', accept: 'image/*,application/pdf', multiple: true, 'data-ta-quittungen': '' });
  const ausgabenBox = el('div', { class: 'ta-ausgaben', 'data-ta-ausgaben': '' });
  const ergebnis = el('div', { class: 'ta-ergebnis', 'data-ta-ergebnis': '', 'aria-live': 'polite' });
  const meldung = el('p', { class: 'small', 'data-ta-meldung': '' });
  let stand = { anfangCent: 0, gebuchtCent: 0, gebuchtAnzahl: 0, offeneEntwuerfe: 0 };
  let appQuittungen = [];
  // Nachfrage bei auffällig hoher Einnahme: gilt nur für genau den bestätigten Betrag (ändert sich die Zählung, wird neu gefragt).
  let bestaetigtFuer = null;

  const ausgabeZeile = (a = {}) => {
    const betrag = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00', value: a.betragCent ? formatCents(a.betragCent) : '', 'data-ta-ausgabe-betrag': '', style: 'width:7rem' });
    const text = el('input', { type: 'text', placeholder: t('tagab.ausgabeWofuer'), value: a.text || '', 'data-ta-ausgabe-text': '' });
    const satz = el('select', { 'data-ta-ausgabe-satz': '', 'aria-label': t('tagab.ausgabeSatz') }, [
      el('option', { value: '', text: t('tagab.ohneBeleg') }), el('option', { value: '19', text: '19 %' }), el('option', { value: '7', text: '7 %' })]);
    const zeile = el('div', { class: 'ta-ausgabe-zeile', style: 'display:flex;gap:.4rem;align-items:center;flex-wrap:wrap' }, [
      betrag, text, satz,
      el('button', { class: 'btn btn-sm', type: 'button', text: '×', 'aria-label': t('common.delete'), onClick: () => { zeile.remove(); rechnen(); } }),
    ]);
    [betrag, text].forEach((x) => x.addEventListener('input', rechnen));
    satz.addEventListener('change', rechnen);
    ausgabenBox.appendChild(zeile);
  };

  const eingabe = () => ({
    datum: datumIn.value,
    endCent: endIn.value.trim() === '' ? null : cent(endIn.value),
    ausgaben: [...ausgabenBox.querySelectorAll('.ta-ausgabe-zeile')].map((z) => ({
      betragCent: cent(z.querySelector('[data-ta-ausgabe-betrag]').value),
      text: z.querySelector('[data-ta-ausgabe-text]').value.trim(),
      ustSatz: z.querySelector('[data-ta-ausgabe-satz]').value === '' ? null : Number(z.querySelector('[data-ta-ausgabe-satz]').value),
    })).filter((a) => a.betragCent > 0),
    bankCent: cent(bankIn.value), entnahmeCent: cent(entIn.value), einlageCent: cent(einIn.value),
    ustSatz: 19, satz: satzIn.value.trim(),
  });

  const festKnopf = el('button', { class: 'btn btn-primary', type: 'button', text: t('tagab.festschreiben'), disabled: true, 'data-ta-fest': '' });

  function rechnen() {
    const e = { ...eingabe(), anfangCent: stand.anfangCent, gebuchtCent: stand.gebuchtCent };
    const schon = abschluesse.some((a) => a.datum === e.datum);
    festKnopf.disabled = true;
    if (schon) { ergebnis.replaceChildren(el('p', { class: 'small', 'data-ta-schon': '', text: t('tagab.schonFest') })); return; }
    if (e.endCent == null) { ergebnis.replaceChildren(el('p', { class: 'muted small', text: t('tagab.erstZaehlen') })); return; }
    const r = rueckrechnung(e);
    const zeile = (l, c, extra = {}) => el('div', { class: 'report-line' + (extra.stark ? ' strong' : ''), ...(extra.attr || {}) }, [el('span', { text: l }), el('span', { class: 'num', text: formatEuro(c) })]);
    const teile = [
      zeile(t('tagab.anfang'), e.anfangCent),
      zeile(t('tagab.end'), e.endCent),
      r.ausgabenCent ? zeile('+ ' + t('tagab.ausgaben'), r.ausgabenCent) : null,
      e.bankCent ? zeile('+ ' + t('tagab.bank'), e.bankCent) : null,
      e.entnahmeCent ? zeile('+ ' + t('tagab.entnahme'), e.entnahmeCent) : null,
      e.einlageCent ? zeile('− ' + t('tagab.einlage'), e.einlageCent) : null,
      e.gebuchtCent ? zeile('− ' + t('tagab.gebucht'), e.gebuchtCent) : null,
      el('div', { class: 'mycel-divider' }),
    ];
    if (r.fehler.length) {
      teile.push(el('p', { class: 'small hinweis-rot', 'data-ta-fehler': '', text: r.fehler.join(' ') }));
    } else {
      teile.push(zeile(t('tagab.einnahme'), r.einnahmeCent, { stark: true, attr: { 'data-ta-einnahme': String(r.einnahmeCent) } }));
      teile.push(zeile(t('tagab.netto'), r.nettoCent, { attr: { 'data-ta-netto': String(r.nettoCent) } }));
      teile.push(zeile(t('tagab.ust19'), r.ustCent, { attr: { 'data-ta-ust': String(r.ustCent) } }));
      const buchungen = tagesabschlussBuchungen(e.datum, e, r);
      teile.push(el('details', { class: 'small', 'data-ta-buchungen': String(buchungen.length) }, [
        el('summary', { text: `${t('tagab.buchungenZeigen')} (${buchungen.length})` }),
        el('ul', {}, buchungen.map((b) => el('li', { text: `${b.beschreibung}: ` + b.zeilen.map((z) => `${z.seite} ${z.konto} ${formatEuro(z.betrag)}`).join(' · ') }))),
      ]));
      r.hinweise.forEach((h) => teile.push(el('p', { class: 'muted small', text: h })));
      const qs = quittungenSumme(appQuittungen);
      if (qs.anzahl) teile.push(el('p', { class: 'muted small', 'data-ta-app-quittungen': String(qs.anzahl),
        text: t('tagab.appQuittungen').replace('{n}', qs.anzahl).replace('{betrag}', formatEuro(qs.summeCent)) }));
      const qh = quittungenPruefen(r.einnahmeCent, appQuittungen);
      if (qh) teile.push(el('p', { class: 'small hinweis-rot', 'data-ta-quittung-hinweis': '', text: qh }));
      const auff = einnahmeAuffaellig(r.einnahmeCent, abschluesse.filter((a) => a.datum < e.datum).map((a) => a.einnahmeCent));
      if (auff.auffaellig && bestaetigtFuer !== r.einnahmeCent) {
        teile.push(el('div', { class: 'card hinweis small', 'data-ta-nachfrage': '' }, [
          el('strong', { text: t('tagab.auffTitel') + ' ' }),
          el('span', { text: auff.ueblichCent != null ? t('tagab.auffSonst').replace('{betrag}', formatEuro(auff.ueblichCent)) : t('tagab.auffOhne') }),
          el('div', { class: 'btn-row' }, [
            el('button', { class: 'btn btn-sm btn-primary', type: 'button', text: t('tagab.auffPrivat'), 'data-ta-privat-ja': '',
              onClick: () => { einIn.focus(); einIn.scrollIntoView({ block: 'center' }); } }),
            el('button', { class: 'btn btn-sm', type: 'button', text: t('tagab.auffStimmt'), 'data-ta-stimmt': '',
              onClick: () => { bestaetigtFuer = r.einnahmeCent; rechnen(); } }),
          ]),
        ]));
      } else festKnopf.disabled = false;
      festKnopf.dataset.auffaellig = auff.auffaellig ? 'ja' : 'nein';
    }
    if (stand.offeneEntwuerfe) teile.push(el('p', { class: 'muted small', text: t('tagab.offeneEntwuerfe').replace('{n}', stand.offeneEntwuerfe) }));
    ergebnis.replaceChildren(...teile.filter(Boolean));
  }

  async function standLaden() {
    stand = await kassenStandFuer(datumIn.value || heuteIso());
    appQuittungen = await listQuittungen(datumIn.value || heuteIso());
    rechnen();
  }

  const uebernehmen = el('button', { class: 'btn btn-sm', type: 'button', text: t('tagab.satzUebernehmen'), 'data-ta-satz-los': '',
    onClick: () => {
      const f = satzZuFeldern(satzIn.value);
      if (f.endCent != null) endIn.value = formatCents(f.endCent);
      if (f.bankCent) bankIn.value = formatCents(f.bankCent);
      if (f.entnahmeCent) entIn.value = formatCents(f.entnahmeCent);
      if (f.einlageCent) einIn.value = formatCents(f.einlageCent);
      f.ausgaben.forEach((a) => ausgabeZeile(a));
      meldung.textContent = f.unklar.length ? t('tagab.unklar') + ' „' + f.unklar.join('“, „') + '“' : t('tagab.satzOk');
      meldung.dataset.unklar = String(f.unklar.length);
      rechnen();
    } });

  festKnopf.addEventListener('click', async () => {
    const e = eingabe();
    festKnopf.disabled = true;
    try {
      const rec = await tagesabschlussFestschreiben(e, { foto: fotoIn.files && fotoIn.files[0] ? fotoIn.files[0] : null,
        quittungFotos: [...(quittungIn.files || [])], auffaelligBestaetigt: bestaetigtFuer != null && bestaetigtFuer === rueckrechnung({ ...e, anfangCent: stand.anfangCent, gebuchtCent: stand.gebuchtCent }).einnahmeCent });
      meldung.textContent = t('tagab.fertig').replace('{datum}', rec.datum).replace('{betrag}', formatEuro(rec.einnahmeCent));
      meldung.dataset.fertig = rec.datum;
      if (neuZeichnen) setTimeout(neuZeichnen, 600);
    } catch (err) {
      meldung.textContent = String(err && err.message || err);
      festKnopf.disabled = false;
    }
  });

  [endIn, bankIn, entIn, einIn].forEach((x) => x.addEventListener('input', rechnen));
  datumIn.addEventListener('change', standLaden);

  const feld = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);
  box.append(
    el('h2', { class: 'card-title', text: t('tagab.titel') }),
    el('p', { class: 'muted small', text: t('tagab.erklaer') }),
    fehlen.length ? fehlendeZeile(fehlen, (d) => { datumIn.value = d; standLaden(); }, neuZeichnen) : null,
    el('div', { class: 'form-grid' }, [feld(t('tagab.datum'), datumIn), feld(t('tagab.end'), endIn)].filter(Boolean)),
    el('label', { class: 'field' }, [el('span', { text: t('tagab.satz') }), satzIn]),
    el('div', { class: 'btn-row' }, [uebernehmen]),
    el('h3', { class: 'small', text: t('tagab.ausgaben') }),
    ausgabenBox,
    el('div', { class: 'btn-row' }, [el('button', { class: 'btn btn-sm', type: 'button', text: '+ ' + t('tagab.ausgabe'), 'data-ta-ausgabe-neu': '', onClick: () => ausgabeZeile() })]),
    el('div', { class: 'form-grid' }, [feld(t('tagab.bank'), bankIn), feld(t('tagab.entnahme'), entIn), feld(t('tagab.einlage'), einIn)]),
    feld(t('tagab.foto'), fotoIn),
    feld(t('tagab.quittungenFotos'), quittungIn),
    el('p', { class: 'muted small', text: t('tagab.quittungenErklaer') }),
    ergebnis,
    el('div', { class: 'btn-row' }, [festKnopf]),
    meldung,
    abschluesse.length ? letzteAbschluesse(abschluesse) : null,
  );
  await standLaden();
  // Nach einer gedruckten Quittung nur die Quittungs-Zeile auffrischen – nie neu zeichnen (sonst gingen Eingaben verloren).
  box.quittungenNeu = async () => { appQuittungen = await listQuittungen(datumIn.value || heuteIso()); rechnen(); };
  return box;
}

function fehlendeZeile(fehlen, waehlen, neuZeichnen) {
  const zeige = fehlen.slice(-14);
  return el('div', { class: 'hinweis small', 'data-ta-fehlend': String(fehlen.length) }, [
    el('strong', { text: t('tagab.fehlen').replace('{n}', fehlen.length) + ' ' }),
    ...zeige.map((d) => el('span', { style: 'display:inline-flex;gap:.2rem;margin:.1rem .4rem .1rem 0' }, [
      el('button', { class: 'btn btn-sm', type: 'button', text: d, 'data-ta-fehlt': d, onClick: () => waehlen(d) }),
      el('button', { class: 'btn btn-sm', type: 'button', text: t('tagab.geschlossen'), 'data-ta-zu': d, title: t('tagab.geschlossenTitel'),
        onClick: () => { geschlossenMerken([...geschlossenLesen(), d]); if (neuZeichnen) neuZeichnen(); } }),
    ])),
  ]);
}

function letzteAbschluesse(liste) {
  const rows = liste.slice(-10).reverse().map((a) => el('tr', { 'data-ta-zeile': a.datum }, [
    el('td', { class: 'mono small', text: a.datum }),
    el('td', { class: 'num', text: formatEuro(a.endCent) }),
    el('td', { class: 'num', text: formatEuro(a.einnahmeCent) }),
    el('td', { class: 'num', text: formatEuro(a.ustCent) }),
    el('td', { class: 'small', text: a.belegId ? t('tagab.mitFoto') : '—' }),
  ]));
  return el('details', { class: 'small' }, [
    el('summary', { text: t('tagab.letzte') }),
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [el('th', { text: t('tagab.datum') }), el('th', { class: 'num', text: t('tagab.end') }),
        el('th', { class: 'num', text: t('tagab.einnahme') }), el('th', { class: 'num', text: 'USt' }), el('th', { text: t('tagab.foto') })])),
      el('tbody', {}, rows),
    ]),
  ]);
}

// ---- Quittungsvorlage --------------------------------------------------------------------------------

/** Karte „Quittung“: eine ausgefüllte Kleinbetragsrechnung oder ein leeres Blatt für den Quittungsblock drucken. */
export function quittungKarte(nachAblegen) {
  const s = getSettings(); const f = s.firma || {};
  const box = el('div', { class: 'card quittung-karte', 'data-quittung': '' });
  const leistung = el('input', { type: 'text', placeholder: t('tagab.q.leistungPlatz'), 'data-q-leistung': '' });
  const betrag = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00', 'data-q-betrag': '' });
  const satz = el('select', { 'data-q-satz': '' }, [el('option', { value: '19', text: '19 %' }), el('option', { value: '7', text: '7 %' }), el('option', { value: '0', text: '0 %' })]);
  const datum = el('input', { type: 'date', value: heuteIso(), 'data-q-datum': '' });
  const pruef = el('p', { class: 'small', 'data-q-pruef': '' });
  const abgelegt = el('p', { class: 'small', 'data-q-abgelegt': '' });
  const blatt = el('div', { class: 'quittung-blatt', 'data-q-blatt': '' });

  const daten = () => ({ aussteller: f.name || '', anschrift: f.anschrift || '', datum: datum.value, leistung: leistung.value.trim(),
    bruttoCent: cent(betrag.value), ustSatz: Number(satz.value) });
  const quittungHtml = (q, leer) => {
    const u = ustHeraus(q.bruttoCent, q.ustSatz);
    const z = (l, v) => el('div', { class: 'q-zeile', style: 'display:flex;justify-content:space-between;border-bottom:1px solid #999;padding:.3rem 0;gap:1rem' }, [el('span', { text: l }), el('span', { text: v })]);
    return el('div', { class: 'q-eine', style: 'border:1px solid #444;padding:.8rem;margin:.6rem 0;break-inside:avoid;background:#fff;color:#000' }, [
      el('strong', { text: t('tagab.q.kopf') }),
      z(t('tagab.q.aussteller'), [q.aussteller, q.anschrift].filter(Boolean).join(', ') || '______________________________'),
      z(t('tagab.q.datum'), leer ? '____.____.________' : q.datum.split('-').reverse().join('.')),
      z(t('tagab.q.leistung'), leer ? '______________________________' : q.leistung),
      z(t('tagab.q.brutto'), leer ? '________ €' : formatEuro(q.bruttoCent)),
      z(t('tagab.q.satz'), leer ? '☐ 19 %   ☐ 7 %' : `${q.ustSatz} %` + (q.ustSatz ? ` (${t('tagab.q.darin')} ${formatEuro(u.ust)})` : '')),
      z(t('tagab.q.unterschrift'), '______________________'),
    ]);
  };
  const zeigen = (leer) => {
    const q = daten();
    if (!leer) {
      const p = quittungPruefen(q);
      pruef.textContent = p.fehlt.length ? t('tagab.q.fehlt') + ' ' + p.fehlt.join(', ') : (p.hinweise.join(' ') || t('tagab.q.ok'));
      pruef.dataset.ok = String(p.ok);
      if (p.fehlt.length) { blatt.replaceChildren(); return false; }
      blatt.replaceChildren(quittungHtml(q, false));
    } else {
      pruef.textContent = f.name ? t('tagab.q.leerOk') : t('tagab.q.ohneFirma');
      blatt.replaceChildren(...[0, 1, 2].map(() => quittungHtml(q, true)));
    }
    return true;
  };
  const drucken = () => {
    document.documentElement.classList.add('druck-quittung');
    const weg = () => { document.documentElement.classList.remove('druck-quittung'); window.removeEventListener('afterprint', weg); };
    window.addEventListener('afterprint', weg);
    window.print();
    setTimeout(weg, 1500);
  };
  const feld = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);
  box.append(
    el('h2', { class: 'card-title no-print', text: t('tagab.q.titel') }),
    el('p', { class: 'muted small no-print', text: t('tagab.q.erklaer') }),
    el('div', { class: 'form-grid no-print' }, [feld(t('tagab.q.leistung'), leistung), feld(t('tagab.q.brutto'), betrag), feld(t('tagab.q.satz'), satz), feld(t('tagab.q.datum'), datum)]),
    el('div', { class: 'btn-row no-print' }, [
      el('button', { class: 'btn btn-sm', type: 'button', text: t('tagab.q.ausgefuellt'), 'data-q-zeigen': '', onClick: async () => {
        if (!zeigen(false)) return;
        drucken();
        // Kopie als Beleg aufbewahren (Kleinbetragsrechnung: Doppel 8 Jahre), mit dem Tagesabschluss dieses Tages verknüpft.
        try {
          const q = daten();
          const bytes = await quittungPdfBauen(await pdfLibLaden(), q, { kopf: t('tagab.q.kopf'), aussteller: t('tagab.q.aussteller'),
            datum: t('tagab.q.datum'), leistung: t('tagab.q.leistung'), brutto: t('tagab.q.brutto'), satz: t('tagab.q.satz'),
            darin: t('tagab.q.darin'), unterschrift: t('tagab.q.unterschrift') });
          const rec = await quittungAblegen(q, bytes);
          abgelegt.textContent = t('tagab.q.abgelegt').replace('{datum}', rec.datum);
          abgelegt.dataset.belegId = rec.belegId;
          if (nachAblegen) nachAblegen(rec);
        } catch (err) { abgelegt.textContent = t('tagab.q.nichtAbgelegt') + ' ' + String(err && err.message || err); }
      } }),
      el('button', { class: 'btn btn-sm', type: 'button', text: t('tagab.q.leer'), 'data-q-leer': '', onClick: () => { zeigen(true); drucken(); } }),
    ]),
    el('div', { class: 'no-print' }, [pruef, abgelegt]),
    blatt,
  );
  return box;
}

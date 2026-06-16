// src/ui/views/documents.js — Belege: Upload/Foto/Scanner/PDF (verschlüsselt),
// Texterkennung über Google Vision (EU), Kontierung über Mistral (EU, mit
// On-Device-Heuristik-Fallback). Respektiert den KI-Autonomie-Schalter.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { pickFile, formatBytes, readFileText } from '../../core/files.js';
import { parseEingangsrechnung, eingangsrechnungExtraktion } from '../../domain/erechnungLesen.js';
import { parseBankauszug, umsatzExtraktion } from '../../domain/bankimport.js';
import { offenePosten, findeOffenePosten, findeKandidaten, zahlungsBuchungZeilen } from '../../domain/zahlungsabgleich.js';
import { offeneVerbindlichkeiten, eingangsrechnungZeilen } from '../../domain/payables.js';
import { saveEingangsrechnung, listEingangsrechnungen, zahlungHinzufuegen } from '../../domain/payables-store.js';
import { listAuftraege, listKunden, auftragZahlungHinzufuegen } from '../../domain/crm-store.js';
import { loadAccounts, saveEntwurf } from '../../domain/store.js';
import { extractFromText } from '../../ai/extract.js';
import { categorize as categorizeAI } from '../../ai/mistral.js';
import { ladeAnker } from '../../ai/anker.js';
import { tokenize, maskierungsBericht } from '../../ai/pseudonym.js';
import { ocr } from '../../ai/vision.js';
import { isVisionConfigured } from '../../ai/aiConfig.js';
import { buildVorschlag } from '../../ai/suggest.js';
import { begruendeBuchung } from '../../ai/berater.js';
import { onDeviceBegruendung } from '../../domain/rechtsregeln.js';
import { saveBeleg, listBelege, deleteBeleg, getBelegBytes, bytesToBase64, linkBeleg } from '../../domain/documents.js';
import { getSettings } from '../../state.js';
import { emptyState } from '../empty.js';

let _host = null;
let _idx = {};

// Anker nur laden, wenn der Datenschutz-Modus „pseudonym" aktiv ist (sonst null →
// KI-Module senden den Text unverändert). Browser/IndexedDB-Pfad.
async function kiAnker() {
  return getSettings().datenschutzModus === 'pseudonym' ? await ladeAnker() : null;
}

// Transparenz-Bauteil: zeigt bei aktivem Datenschutz-Modus, was an die KI ging.
// Liefert null, wenn der Modus aus ist oder nichts maskiert wurde. Browser-UI.
async function pseudonymBadge(quelltext) {
  if (!quelltext) return null;
  const anker = await kiAnker();
  if (!anker || !anker.length) return null;
  const { text: pseudo, map } = tokenize(quelltext, anker, { wortgrenze: true });
  const bericht = maskierungsBericht(map);
  if (!bericht.gesamt) return null;
  const proTyp = Object.entries(bericht.proTyp)
    .map(([typ, n]) => `${n}× ${t('pseudonym.typ.' + typ) || typ}`).join(', ');
  return el('details', { class: 'hinweis pseudonym-info' }, [
    el('summary', { class: 'small', text: `🛡 ${t('pseudonym.badge').replace('{n}', String(bericht.gesamt))} (${proTyp})` }),
    el('p', { class: 'muted small', text: t('pseudonym.previewHint') }),
    el('pre', { class: 'mono small pseudonym-preview', text: pseudo }),
  ]);
}

export async function mountDocuments(host) {
  _host = host;
  const konten = await loadAccounts();
  _idx = {};
  for (const k of konten) _idx[k.nummer] = k;
  await repaint();
}

async function repaint(extra) {
  const [belege, visionBereit] = await Promise.all([listBelege(), isVisionConfigured().catch(() => false)]);
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('docs.title') }),
    schnellerfassung(),
    extra || null,
    eRechnungKarte(),
    bankImportKarte(),
    uploadKarte(),
    belegListe(belege, visionBereit),
  ]));
}

// ---- Schnellerfassung aus Text ---------------------------------------------

function schnellerfassung() {
  const ta = el('textarea', { class: 'beleg-text', placeholder: t('docs.pastePlaceholder'), rows: '5' });
  const out = el('div', { class: 'vorschlag-slot' });
  const btn = el('button', {
    class: 'btn btn-primary', text: t('docs.analyze'),
    onClick: async () => {
      out.replaceChildren();
      const ex = extractFromText(ta.value);
      const kat = await categorizeAI(ta.value, _idx, { anker: await kiAnker() });
      const res = buildVorschlag(ex, kat, _idx, { kleinunternehmer: getSettings().kleinunternehmer });
      if (!res.ok) { out.appendChild(el('p', { class: 'form-error', text: res.fehler })); return; }
      out.appendChild(await vorschlagKarte(res.vorschlag, null, ta.value));
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('docs.quickEntry') }),
    el('p', { class: 'muted small', text: t('docs.quickHint') }),
    ta,
    el('div', { class: 'btn-row' }, [btn]),
    out,
  ]);
}

// ---- Vorschlag-Karte (respektiert Autonomie) -------------------------------

async function vorschlagKarte(vorschlag, belegId, quelltext) {
  const autonomy = getSettings().aiAutonomy; // suggest | draft | auto
  const kleinunternehmer = getSettings().kleinunternehmer;
  const sachK = _idx[vorschlag.sachkonto], gegenK = _idx[vorschlag.gegenkonto];
  const kontierung = `${vorschlag.sachkonto} ${sachK ? sachK.name : ''} / Gegenkonto ${vorschlag.gegenkonto} ${gegenK ? gegenK.name : ''}`.replace(/\s+/g, ' ').trim();
  const beraterKontext = { beschreibung: vorschlag.beschreibung, konto: vorschlag.sachkonto, kontoName: sachK ? sachK.name : '', kontierung, text: quelltext || '', kleinunternehmer };
  const zeilenTxt = vorschlag.zeilen.map((z) =>
    el('div', { class: 'mono small', text: `${z.seite}  ${z.konto}  ${formatEuro(z.betrag)}` }));

  const card = el('div', { class: 'card vorschlag' }, [
    el('div', { class: 'vorschlag-head' }, [
      el('strong', { text: t('docs.proposal') }),
      el('span', { class: 'badge badge-entwurf', text: `${t('docs.confidence')} ${(vorschlag.confidence * 100).toFixed(0)} %` }),
    ]),
    el('div', { class: 'muted small', text: `${vorschlag.datum} · ${vorschlag.beschreibung}` }),
    el('div', { class: 'vorschlag-zeilen' }, zeilenTxt),
  ]);

  // Nicht-blockierende Hinweise (USt vergessen, Zukunftsdatum …) — Spielraum.
  const warnungen = vorschlag.warnungen || [];
  if (warnungen.length) {
    card.appendChild(el('div', { class: 'hinweis' }, [
      el('strong', { class: 'small', text: t('docs.hints') }),
      el('ul', { class: 'hinweis-liste' }, warnungen.map((w) => el('li', { class: 'small', text: w }))),
    ]));
  }

  // Transparenz: zeigt, welche/wie viele Identifikatoren bei aktivem Datenschutz-Modus
  // an die EU-KI maskiert gesendet wurden (deterministisch dieselbe Maskierung wie der
  // tatsächliche Versand in mistral.categorize). Klartext nur lokal in der Vorschau.
  const transparenz = await pseudonymBadge(quelltext);
  if (transparenz) card.appendChild(transparenz);

  // Begründung/Notiz mit §-Bezug: on-device vorbefüllt (rein, kein Netz), per
  // Knopf über die KI (Mistral EU, opt-in) verfeinerbar. Wird mit dem Entwurf gespeichert.
  const fBegruendung = el('textarea', { class: 'beleg-text', rows: '2', placeholder: t('journal.begruendungPlaceholder') });
  fBegruendung.value = onDeviceBegruendung(beraterKontext);
  const beraterStatus = el('span', { class: 'muted small' });
  const beraterBtn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('journal.aiReason'),
    onClick: async () => {
      beraterStatus.textContent = '…';
      try {
        const r = await begruendeBuchung(beraterKontext, { anker: await kiAnker() });
        fBegruendung.value = r.text;
        beraterStatus.textContent = r.quelle === 'mistral' ? t('journal.aiReasonMistral') : t('journal.aiReasonLocal');
      } catch (e) { beraterStatus.textContent = String(e.message || e); }
    },
  });
  card.appendChild(el('label', { class: 'field' }, [el('span', { text: t('journal.begruendung') }), fBegruendung]));
  card.appendChild(el('div', { class: 'btn-row' }, [beraterBtn, beraterStatus]));

  const status = el('p', { class: 'muted small' });
  async function uebernehmen() {
    const entwurf = await saveEntwurf({ datum: vorschlag.datum, beschreibung: vorschlag.beschreibung, begruendung: fBegruendung.value.trim(), zeilen: vorschlag.zeilen });
    if (belegId) await linkBeleg(belegId, entwurf.id);
    status.textContent = t('docs.draftCreated');
    return entwurf;
  }

  if (autonomy === 'suggest') {
    card.appendChild(el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-primary btn-sm', text: t('docs.accept'), onClick: async (e) => { e.target.setAttribute('disabled', ''); await uebernehmen(); } }),
    ]));
  } else {
    await uebernehmen();
    status.textContent = autonomy === 'auto' ? t('docs.autoDraft') : t('docs.draftCreated');
  }
  card.appendChild(status);
  card.appendChild(el('p', { class: 'muted small', text: t('docs.postManual') }));
  return card;
}

// ---- E-Rechnung (XRechnung XML) einlesen → Buchungsvorschlag ---------------

function eRechnungKarte() {
  const out = el('div', { class: 'vorschlag-slot' });
  const btn = el('button', {
    class: 'btn', text: t('docs.eInvoiceImport'),
    onClick: async () => {
      out.replaceChildren();
      const file = await pickFile('application/xml,text/xml,.xml', null);
      if (!file) return;
      try {
        const p = parseEingangsrechnung(await readFileText(file));
        if (!p.format) { out.appendChild(el('p', { class: 'form-error', text: p.fehler })); return; }
        const ex = eingangsrechnungExtraktion(p);
        const kat = await categorizeAI(p.lieferant || '', _idx, { anker: await kiAnker() });
        const res = buildVorschlag(ex, kat, _idx, { kleinunternehmer: getSettings().kleinunternehmer });
        if (!res.ok) { out.appendChild(el('p', { class: 'form-error', text: res.fehler })); return; }
        out.appendChild(el('div', { class: 'muted small', text: `${p.format} · ${t('docs.eInvoiceFrom')} ${p.lieferant || '—'} · ${p.nummer || '—'}` }));
        out.appendChild(verbindlichkeitErfassenZeile(p, kat));
        out.appendChild(await vorschlagKarte(res.vorschlag, null, p.lieferant || ''));
      } catch (e) { out.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('docs.eInvoice') }),
    el('p', { class: 'muted small', text: t('docs.eInvoiceHint') }),
    el('div', { class: 'btn-row' }, [btn]),
    out,
  ]);
}

// Erfasst eine eingelesene Eingangsrechnung als OFFENE VERBINDLICHKEIT (Kreditor) und
// bucht sie „auf Ziel" (Aufwand + Vorsteuer an 1600) als Entwurf. Die offene Verbindlichkeit
// taucht danach im Bankimport-Zahlungsabgleich auf (Ausgangszahlung → Verbindlichkeit an Bank).
function verbindlichkeitErfassenZeile(p, kat) {
  const slot = el('div', {});
  const aufwand = (kat && /^[34]/.test(String(kat.konto)) && _idx[kat.konto]) ? kat.konto : '4980';
  const netto = p.netto != null ? p.netto : (p.brutto != null ? Math.round(p.brutto / (1 + (p.ustSatz || 0) / 100)) : null);
  const btn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('docs.payableCreate'),
    onClick: async () => {
      slot.replaceChildren();
      try {
        const rechnung = {
          kreditor: p.lieferant || '—',
          rechnungsnr: p.nummer || '',
          datum: p.datum || new Date().toISOString().slice(0, 10),
          positionen: netto != null ? [{ nettoCent: netto, ustSatz: p.ustSatz || 0, aufwandKonto: aufwand }] : [],
          bruttoCent: p.brutto != null ? p.brutto : undefined,
        };
        const { zeilen } = eingangsrechnungZeilen(rechnung);
        const entwurf = await saveEntwurf({
          datum: rechnung.datum,
          beschreibung: `${t('docs.payable')}: ${rechnung.kreditor} ${rechnung.rechnungsnr}`.trim(),
          zeilen,
        });
        await saveEingangsrechnung({ ...rechnung, buchungRef: entwurf.id });
        slot.appendChild(el('p', { class: 'muted small', text: t('docs.payableDone') }));
      } catch (e) { slot.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
    },
  });
  return el('div', { class: 'bank-row' }, [
    el('div', { class: 'btn-row' }, [
      el('span', { class: 'small muted', text: t('docs.payableHint') }), btn,
    ]),
    slot,
  ]);
}

// ---- Bankimport (MT940) → Buchungsvorschläge je Umsatz ---------------------

function bankImportKarte() {
  const out = el('div', { class: 'vorschlag-slot' });
  const btn = el('button', {
    class: 'btn', text: t('docs.bankImport'),
    onClick: async () => {
      out.replaceChildren();
      const file = await pickFile('text/plain,application/xml,text/xml,.sta,.940,.txt,.mt940,.xml', null);
      if (!file) return;
      try {
        const { format, konto, umsaetze } = parseBankauszug(await readFileText(file));
        if (!umsaetze.length) { out.appendChild(el('p', { class: 'form-error', text: t('docs.bankNone') })); return; }
        // Offene Posten für den Zahlungsabgleich laden: Forderungen (aus Aufträgen,
        // richtung 'einnahme') + Verbindlichkeiten (Eingangsrechnungen, richtung 'ausgabe').
        let posten = [];
        try {
          const [auftraege, kunden, eingang] = await Promise.all([listAuftraege(), listKunden(), listEingangsrechnungen()]);
          const nameById = {}; for (const k of kunden) nameById[k.id] = k.name;
          posten = [...offenePosten(auftraege, { nameById }), ...offeneVerbindlichkeiten(eingang)];
        } catch { posten = []; }
        out.appendChild(el('div', { class: 'muted small', text: `${format || '—'} · ${t('docs.bankAccount')}: ${konto || '—'} · ${umsaetze.length} ${t('docs.bankTxns')}` }));
        for (const u of umsaetze) out.appendChild(umsatzRow(u, posten));
      } catch (e) { out.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('docs.bank') }),
    el('p', { class: 'muted small', text: t('docs.bankHint') }),
    el('div', { class: 'btn-row' }, [btn]),
    out,
  ]);
}

// Erfasst die (Teil-)Zahlung eines Bank-Umsatzes gegen den passenden offenen Posten:
// Verbindlichkeit → Eingangsrechnung, Forderung → Auftrag (markiert bei Ausgleich „bezahlt").
async function zahlungVerbuchen(p, u, datum) {
  const zahlung = { betragCent: u.betragCent, datum, ref: u.zweck || null };
  if (p.kind === 'verbindlichkeit') await zahlungHinzufuegen(p.id, zahlung);
  else await auftragZahlungHinzufuegen(p.id, zahlung);
}

function umsatzRow(u, posten = []) {
  const slot = el('div', {});
  const vz = (u.gegen || u.zweck || '').slice(0, 80);
  const info = el('span', { class: 'mono small', text: `${u.valuta} · ${u.richtung === 'einnahme' ? '+' : '−'}${formatEuro(u.betragCent)} · ${vz}` });
  const knoepfe = [info];

  // Zahlungsabgleich: passt der Umsatz exakt zu einem offenen Posten (Rechnung)?
  const treffer = findeOffenePosten(u, posten);
  if (treffer) {
    const p = treffer.posten;
    knoepfe.push(el('button', {
      class: 'btn btn-sm btn-primary', type: 'button',
      text: `${t('docs.bankMatch')} ${p.referenz || ''}`.trim(),
      onClick: async () => {
        slot.replaceChildren();
        const bk = zahlungsBuchungZeilen(u, p);
        try {
          await saveEntwurf({ datum: bk.datum, beschreibung: bk.beschreibung, zeilen: bk.zeilen });
          // Vollständige Zahlung als Zahlung erfassen (Rest → 0 markiert automatisch „bezahlt").
          await zahlungVerbuchen(p, u, bk.datum);
          const msg = p.kind === 'verbindlichkeit' ? t('docs.bankMatchPaid') : t('docs.bankMatchDone');
          slot.appendChild(el('p', { class: 'muted small', text: `${msg} (${p.referenz || ''})` }));
        } catch (e) { slot.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
      },
    }));
  } else {
    // Kein exakter Treffer: Teilzahlung/Skonto auf einen offenen Posten anbieten
    // (Forderung ODER Verbindlichkeit — der Rest wird sauber weitergeführt).
    const kand = findeKandidaten(u, posten).find((k) => k.art === 'teilzahlung' || k.art === 'skonto');
    if (kand) {
      const p = kand.posten;
      knoepfe.push(el('button', {
        class: 'btn btn-sm', type: 'button',
        text: `${t(kand.art === 'skonto' ? 'docs.bankSkonto' : 'docs.bankPartial')} ${p.referenz || ''}`.trim(),
        onClick: async () => {
          slot.replaceChildren();
          const bk = zahlungsBuchungZeilen(u, p);
          try {
            await saveEntwurf({ datum: bk.datum, beschreibung: bk.beschreibung, zeilen: bk.zeilen });
            await zahlungVerbuchen(p, u, bk.datum);
            slot.appendChild(el('p', { class: 'muted small', text: t('docs.bankPartialDone').replace('{rest}', formatEuro(kand.restCent || kand.skontoCent || 0)) }));
            if (kand.art === 'skonto') slot.appendChild(el('p', { class: 'muted small', text: t('docs.bankSkontoHint').replace('{betrag}', formatEuro(kand.skontoCent)) }));
          } catch (e) { slot.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
        },
      }));
    }
  }

  // Fallback / Alternative: normaler Buchungsvorschlag über Kategorisierung.
  knoepfe.push(el('button', {
    class: 'btn btn-sm', type: 'button', text: t('docs.bankDraft'),
    onClick: async () => {
      slot.replaceChildren();
      const ex = umsatzExtraktion(u);
      const kat = await categorizeAI(u.zweck || u.gegen || '', _idx, { anker: await kiAnker() });
      kat.richtung = u.richtung; // Kontoauszug bestimmt die Richtung verbindlich
      const res = buildVorschlag(ex, kat, _idx, { kleinunternehmer: getSettings().kleinunternehmer });
      if (!res.ok) { slot.appendChild(el('p', { class: 'form-error', text: res.fehler })); return; }
      slot.appendChild(await vorschlagKarte(res.vorschlag, null, u.zweck || ''));
    },
  }));

  return el('div', { class: 'bank-row' }, [el('div', { class: 'btn-row' }, knoepfe), slot]);
}

// ---- Upload (Datei / Foto / PDF) + Beleg-Liste -----------------------------

function uploadKarte() {
  const add = async (accept, capture) => {
    const file = await pickFile(accept, capture);
    if (!file) return;
    try { await saveBeleg(file); await repaint(); }
    catch (e) { alert(String(e.message || e)); }
  };
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('docs.archive') }),
    el('p', { class: 'muted small', text: t('docs.archiveHint') }),
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn', text: t('docs.camera'), onClick: () => add('image/*', 'environment') }),
      el('button', { class: 'btn', text: t('docs.upload'), onClick: () => add('image/*,application/pdf', null) }),
    ]),
  ]);
}

function belegListe(belege, visionBereit) {
  if (!belege.length) return emptyState('empty-documents.png', t('docs.empty'));
  const rows = belege.map((b) => el('tr', {}, [
    el('td', { text: b.name }),
    el('td', { class: 'muted small', text: b.mediaType }),
    el('td', { class: 'num muted small', text: formatBytes(b.size) }),
    el('td', { class: 'muted small mono', text: (b.createdAt || '').slice(0, 10) }),
    el('td', { text: b.buchungId ? '🔗' : '' }),
    el('td', { class: 'actions' }, [belegAktionen(b, visionBereit)]),
  ]));
  return el('div', { class: 'card no-pad' }, [
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: t('docs.name') }), el('th', { text: t('docs.kind') }),
        el('th', { class: 'num', text: t('docs.size') }), el('th', { text: t('docs.date') }),
        el('th', {}), el('th', {}),
      ])),
      el('tbody', {}, rows),
    ]),
  ]);
}

function belegAktionen(b, visionBereit) {
  const wrap = el('div', { class: 'btn-row' });
  if (visionBereit && /^(image\/|application\/pdf)/.test(b.mediaType)) {
    wrap.appendChild(el('button', {
      class: 'btn btn-sm', text: t('docs.ocr'),
      onClick: () => visionExtraktion(b),
    }));
  }
  wrap.appendChild(el('button', {
    class: 'btn btn-sm', text: t('common.delete'),
    onClick: async () => { if (confirm(t('docs.confirmDelete'))) { await deleteBeleg(b.id); await repaint(); } },
  }));
  return wrap;
}

async function visionExtraktion(b) {
  if (!confirm(t('docs.confirmOcr'))) return; // Daten gehen an Google Vision (EU)
  try {
    const bytes = await getBelegBytes(b.id);
    const text = await ocr({ base64: bytesToBase64(bytes), mimeType: b.mediaType });
    if (!text) { alert(t('docs.ocrNoText')); return; }
    const ex = extractFromText(text);
    const kat = await categorizeAI(text, _idx, { anker: await kiAnker() });   // Mistral EU, sonst Heuristik
    const res = buildVorschlag(ex, kat, _idx);
    if (!res.ok) { alert(res.fehler); return; }
    await repaint(await vorschlagKarte(res.vorschlag, b.id, text));
  } catch (e) {
    alert(t('docs.ocrError') + ' ' + String(e.message || e));
  }
}

// src/ui/views/documents.js — Belege: Upload/Foto/Scanner/PDF (verschlüsselt),
// Texterkennung über Google Vision (EU), Kontierung über Mistral (EU, mit
// On-Device-Heuristik-Fallback). Respektiert den KI-Autonomie-Schalter.

import { el, mount } from '../dom.js';
import { t, tOpt } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { pickFile, pickFiles, formatBytes, readFileText, readFileBytes } from '../../core/files.js';
import { parseEingangsrechnung, eingangsrechnungExtraktion } from '../../domain/erechnungLesen.js';
import { extrahiereZugferdXml, kostPflichtfelder } from '../../domain/zugferd.js';
import { parseBankauszug, umsatzExtraktion, pruefeBankauszug } from '../../domain/bankimport.js';
import { validiereBankauszug } from '../../domain/bankschema.js';
import { offenePosten, findeOffenePosten, findeKandidaten, zahlungsBuchungZeilen, findeSammelzuordnung, verteileSammelzahlung, sammelBuchungZeilen } from '../../domain/zahlungsabgleich.js';
import { skontoEntwurf } from '../../domain/skonto.js';
import { offeneVerbindlichkeiten, eingangsrechnungZeilen, extraktionZuEingangsrechnung, validateEingangsrechnung } from '../../domain/payables.js';
import { saveEingangsrechnung, listEingangsrechnungen, zahlungHinzufuegen } from '../../domain/payables-store.js';
import { listAuftraege, listKunden, auftragZahlungHinzufuegen } from '../../domain/crm-store.js';
import { loadAccounts, saveEntwurf } from '../../domain/store.js';
import { extractFromText } from '../../ai/extract.js';
import { categorize as categorizeAI } from '../../ai/mistral.js';
import { ladeAnker } from '../../ai/anker.js';
import { tokenize, maskierungsBericht } from '../../ai/pseudonym.js';
import { ocr } from '../../ai/vision.js';
import { isOcrAktiv, getAiConfig, isMistralConfigured } from '../../ai/aiConfig.js';
import { belegKontierung } from '../../ai/belegRichter.js';
import { loadEmbedder } from '../../sbkim/embed.js';
import { buildVorschlag } from '../../ai/suggest.js';
import { begruendeBuchung } from '../../ai/berater.js';
import { onDeviceBegruendung } from '../../domain/rechtsregeln.js';
import { saveBeleg, listBelege, deleteBeleg, getBelegBytes, bytesToBase64, linkBeleg, aufbewahrungBis, istAufbewahrungspflichtig } from '../../domain/documents.js';
import { getSettings } from '../../state.js';
import { zeigeFeature, FEATURE } from '../../domain/nutzungsmodus.js';
import { emptyState } from '../empty.js';
import { testMarke } from '../testmarke.js';
import { pruefStandVon, ungepruefte, belegDateienWaehlen, kiAnweisungZeilen, textNachWahl, PRUEF_STAND } from '../../domain/kiReinigung.js';
import { pruefeBeleg, pruefBericht, kiVermerke, vermerkeKiEntfernt, pruefKern, prueferMail } from '../../domain/belegPruefung.js';
import { belegFuersKi } from '../../ai/kiVorbereitung.js';
import { pruefberichtZeigen, ungeprueftHalt, auffaelligHalt, kiReinigungHalt, textHalt } from '../belegDialoge.js';

let _host = null;
let _idx = {};

// Anker nur laden, wenn der Datenschutz-Modus „pseudonym" aktiv ist (sonst null →
// KI-Module senden den Text unverändert). `text` (optional) erlaubt zusätzlich die
// NER-PII-Erkennung Dritter im Belegtext (siehe ai/anker.ladeAnker). Browser/IndexedDB.
async function kiAnker(text) {
  return getSettings().datenschutzModus === 'pseudonym' ? await ladeAnker(text) : null;
}

// Transparenz-Bauteil: zeigt bei aktivem Datenschutz-Modus, was an die KI ging.
// Liefert null, wenn der Modus aus ist oder nichts maskiert wurde. Browser-UI.
async function pseudonymBadge(quelltext) {
  if (!quelltext) return null;
  const anker = await kiAnker(quelltext);
  if (!anker || !anker.length) return null;
  const { text: pseudo, map } = tokenize(quelltext, anker, { wortgrenze: true });
  const bericht = maskierungsBericht(map);
  if (!bericht.gesamt) return null;
  const proTyp = Object.entries(bericht.proTyp)
    .map(([typ, n]) => `${n}× ${tOpt('pseudonym.typ.' + typ) || typ}`).join(', ');
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
  const [belege, visionBereit] = await Promise.all([listBelege(), isOcrAktiv().catch(() => false)]);
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
      const frei = await kiTextFreigabe(ta.value);
      const kat = await categorizeAI(frei.kiText, _idx, { anker: await kiAnker(frei.kiText), nurLokal: frei.nurLokal });
      const res = buildVorschlag(ex, kat, _idx, { kleinunternehmer: getSettings().kleinunternehmer });
      if (!res.ok) { out.appendChild(el('p', { class: 'form-error', text: res.fehler })); return; }
      if (frei.hinweis) out.appendChild(el('p', { class: 'hinweis small', text: frei.hinweis }));
      out.appendChild(await vorschlagKarte(res.vorschlag, null, frei.kiText));
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
        const r = await begruendeBuchung(beraterKontext, { anker: await kiAnker(beraterKontext.text) });
        fBegruendung.value = r.text;
        beraterStatus.textContent = r.quelle === 'mistral' ? t('journal.aiReasonMistral') : t('journal.aiReasonLocal');
      } catch (e) { beraterStatus.textContent = String(e.message || e); }
    },
  });
  card.appendChild(el('label', { class: 'field' }, [el('span', { text: t('journal.begruendung') }), fBegruendung]));
  card.appendChild(el('div', { class: 'btn-row' }, [beraterBtn, beraterStatus]));

  // Konto-Vorschlag über den SBKIM-Richter (Beleg-OCR → Embedding → Vorfilter + Richter).
  // Opt-in (Modell/Netz), fail-soft, rein informativ — ändert die Buchung NICHT automatisch.
  if (quelltext) card.appendChild(sbkimRichterBlock(quelltext));

  const status = el('p', { class: 'muted small' });
  async function uebernehmen() {
    // belegRef geht in die Buchung (GoBD-Belegprinzip, Teil der Hash-Kette);
    // buchungId verlinkt zusätzlich rückwärts den Beleg.
    const entwurf = await saveEntwurf({ datum: vorschlag.datum, beschreibung: vorschlag.beschreibung, begruendung: fBegruendung.value.trim(), zeilen: vorschlag.zeilen, belegRef: belegId || null });
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

// ---- SBKIM-Richter: Konto-Vorschlag aus dem Belegtext ----------------------
// Schließt die Kette Beleg-OCR → semantische Anfrage → On-Device-Einbettung →
// SBKIM-Vorfilter + Richter (Mistral EU, opt-in, fail-soft) → SKR03-Konten.
// Opt-in wie die SBKIM-Suche: erst beim Klick wird das Embedding-Modell (einmalig,
// ~30 MB) geladen; der Richter nutzt — wenn hinterlegt — den Mistral-Schlüssel (EU).

function richterErgebnis(res) {
  if (!res || res.mode === 'leer' || res.mode === 'vorfilter-leer') {
    return el('p', { class: 'muted small', text: t('docs.richterEmpty') });
  }
  const wrap = el('div', {});
  if (res.mode === 'nur-vorfilter') wrap.appendChild(el('div', { class: 'hinweis small', text: t('docs.richterNoKey') }));
  else if (res.mode === 'fail-soft-vorfilter') wrap.appendChild(el('div', { class: 'hinweis warn small', text: t('docs.richterFailsoft').replace('%R%', res.reason || '') }));
  const treffer = res.treffer || [];
  if (!treffer.length) { wrap.appendChild(el('p', { class: 'muted small', text: t('docs.richterNone') })); return wrap; }
  wrap.appendChild(el('ul', { class: 'sbkimsuche-list' }, treffer.map((v) => el('li', {}, [
    el('strong', { text: v.label }),
    el('span', { class: 'muted small', text: ` · ${t('docs.richterScore')} ${Math.round((Number(v.score) || 0) * 100)} %` }),
    v.begruendung ? el('p', { class: 'muted small', text: v.begruendung }) : null,
  ].filter(Boolean)))));
  if (res.query) wrap.appendChild(el('p', { class: 'muted small', text: t('docs.richterQuery').replace('%Q%', res.query) }));
  return wrap;
}

function sbkimRichterBlock(quelltext) {
  const out = el('div', { class: 'vorschlag-slot' });
  const status = el('span', { class: 'muted small' });
  let busy = false;
  const btn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('docs.richterBtn'),
    onClick: async () => {
      if (busy) return;
      busy = true; btn.setAttribute('disabled', '');
      out.replaceChildren();
      const setStatus = (s) => { status.textContent = s; };
      try {
        setStatus(t('docs.richterLoading'));
        const embedder = await loadEmbedder({ onStatus: setStatus });
        const ex = extractFromText(quelltext);
        const cfg = await getAiConfig();
        setStatus(cfg.mistralKey ? t('docs.richterJudging') : t('docs.richterPrefiltering'));
        const res = await belegKontierung(quelltext, { vendor: ex.vendor, ustSatz: ex.ustSatz }, Object.values(_idx), {
          embedQuery: embedder.embedQuery, embedPassage: embedder.embedPassage,
          apiKey: cfg.mistralKey, provider: 'mistral', model: cfg.mistralModel,
          queryLabel: ex.vendor || 'Beleg', k: 5,
          onProgress: (d, total) => setStatus(t('docs.richterEmbedding').replace('%D%', String(d)).replace('%T%', String(total))),
        });
        setStatus('');
        out.appendChild(richterErgebnis(res));
      } catch (e) {
        setStatus(t('docs.richterError').replace('%E%', String((e && e.message) || e)));
      } finally { busy = false; btn.removeAttribute('disabled'); }
    },
  });
  return el('details', { class: 'richter-block' }, [
    el('summary', { class: 'small', text: t('docs.richterTitle') }),
    el('p', { class: 'muted small', text: t('docs.richterHint') }),
    el('div', { class: 'btn-row' }, [btn, status]),
    // TEMPORÄR: Browser-Test-Marke (co-located → fehlt der Knopf, fehlt die Marke).
    testMarke('beleg-richter', 'Konto vorschlagen (SBKIM-Richter)'),
    out,
  ]);
}

// ---- E-Rechnung (XRechnung XML) einlesen → Buchungsvorschlag ---------------

function eRechnungKarte() {
  const out = el('div', { class: 'vorschlag-slot' });
  const btn = el('button', {
    class: 'btn', text: t('docs.eInvoiceImport'),
    onClick: async () => {
      out.replaceChildren();
      const file = await pickFile('application/xml,text/xml,.xml,application/pdf,.pdf', null);
      if (!file) return;
      try {
        const istPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || '');
        let xml;
        if (istPdf) {
          xml = await extrahiereZugferdXml(await readFileBytes(file));
          if (!xml) { out.appendChild(el('p', { class: 'form-error', text: t('docs.zugferdNone') })); return; }
        } else {
          xml = await readFileText(file);
        }
        const p = parseEingangsrechnung(xml);
        if (!p.format) { out.appendChild(el('p', { class: 'form-error', text: p.fehler })); return; }
        const ex = eingangsrechnungExtraktion(p);
        // Der Lieferantenname stammt aus einer FREMDEN Datei und geht an die Kontierung (Mistral EU) —
        // dieselbe Prüfung wie beim OCR-Text (Klaus 2026-10-14: „E-Rechnung und Bank-Import nachziehen").
        const frei = await kiTextFreigabe(p.lieferant || '');
        const kat = await categorizeAI(frei.kiText, _idx, { anker: await kiAnker(frei.kiText), nurLokal: frei.nurLokal });
        const res = buildVorschlag(ex, kat, _idx, { kleinunternehmer: getSettings().kleinunternehmer });
        if (!res.ok) { out.appendChild(el('p', { class: 'form-error', text: res.fehler })); return; }
        if (frei.hinweis) out.appendChild(el('p', { class: 'hinweis small', text: frei.hinweis }));
        out.appendChild(el('div', { class: 'muted small', text: `${p.format}${istPdf ? ' (ZUGFeRD/PDF)' : ''} · ${t('docs.eInvoiceFrom')} ${p.lieferant || '—'} · ${p.nummer || '—'}` }));
        const kosit = kostPflichtfelder(p);
        out.appendChild(el('div', { class: kosit.ok ? 'muted small' : 'form-error', text: kosit.ok ? `✓ ${t('docs.kositOk')}` : `⚠ ${t('docs.kositMissing')}: ${kosit.fehlende.join(', ')}` }));
        // R6/P2: Kreditoren-OP („auf Ziel" als Verbindlichkeit) nur, wenn das Feature gilt.
        if (zeigeFeature(getSettings(), FEATURE.VERBINDLICHKEITEN)) out.appendChild(verbindlichkeitErfassenZeile(p, kat));
        out.appendChild(await vorschlagKarte(res.vorschlag, null, frei.kiText));
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

// R3: Erfasst aus einem Foto/PDF-Beleg (OCR-Extraktion ai/extract) eine offene
// VERBINDLICHKEIT „auf Ziel" (Aufwand + Vorsteuer an 1600, Entwurf). Fehlende Felder
// werden nicht erfunden: ohne Lieferant/Datum wird ein Platzhalter/heute gesetzt — die
// Feinheiten lassen sich danach in der Verbindlichkeiten-Ansicht nacharbeiten.
function verbindlichkeitAusExtraktionZeile(ex, kat) {
  const slot = el('div', {});
  const aufwand = (kat && /^[34]/.test(String(kat.konto)) && _idx[kat.konto]) ? kat.konto : '4980';
  const btn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('docs.payableFromOcr'),
    onClick: async () => {
      slot.replaceChildren();
      try {
        const rechnung = extraktionZuEingangsrechnung(ex, { aufwandKonto: aufwand });
        if (!rechnung.kreditor) rechnung.kreditor = '—';
        if (!rechnung.datum) rechnung.datum = new Date().toISOString().slice(0, 10);
        const fehler = validateEingangsrechnung(rechnung);
        if (fehler.length) { slot.appendChild(el('p', { class: 'form-error', text: fehler.join(' ') })); return; }
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
      el('span', { class: 'small muted', text: t('docs.payableFromOcr') }), btn,
    ]),
    slot,
  ]);
}

// ---- Bankimport (MT940) → Buchungsvorschläge je Umsatz ---------------------

// Übersetzt die Prüf-Warnungen aus pruefeBankauszug() in einen kompakten Hinweis.
function bankPruefHinweis(pruef) {
  const zeilen = pruef.warnungen.map((w) => {
    if (w.code === 'saldo-differenz') return t('docs.bankWarnSaldo').replace('{betrag}', formatEuro(Math.abs(w.differenzCent)));
    if (w.code === 'unvollstaendige-umsaetze') return t('docs.bankWarnUnvollstaendig').replace('{anzahl}', String(w.anzahl));
    if (w.code === 'format-unbekannt') return t('docs.bankWarnFormat');
    if (w.code === 'keine-umsaetze') return t('docs.bankNone');
    return w.code;
  });
  return el('div', { class: 'hinweis warn small' }, [
    el('strong', { text: `⚠ ${t('docs.bankWarnTitel')} ` }),
    el('span', { text: zeilen.join(' · ') }),
  ]);
}

// Eine Schema-/Struktur-Meldung (Fehler ODER Warnung) lesbar machen.
// `{tag/detail/code}` → kompakte Zeile; vieles ist bereits sprechend (z. B. "max 16 Zeichen").
function schemaZeile(m) {
  const teil = m.detail || (m.tag ? `:${m.tag}:` : '') || m.code;
  return m.tag && m.detail ? `:${m.tag}: ${m.detail}` : teil;
}

// Übersetzt die Schema-/Struktur-Validierung (validiereBankauszug) in einen Hinweis:
// klare Verstöße als Fehler (rot), strittige Punkte als Hinweise (gelb), sonst ✓.
function bankSchemaHinweis(val) {
  if (val.fehler && val.fehler.length) {
    return el('div', { class: 'hinweis warn small' }, [
      el('strong', { text: `⚠ ${t('docs.bankSchemaFehlerTitel')} ` }),
      el('span', { text: val.fehler.map(schemaZeile).join(' · ') }),
    ]);
  }
  if (val.warnungen && val.warnungen.length) {
    return el('div', { class: 'hinweis small' }, [
      el('strong', { text: `${t('docs.bankSchemaHinweisTitel')} ` }),
      el('span', { text: val.warnungen.map(schemaZeile).join(' · ') }),
    ]);
  }
  return el('p', { class: 'muted small', text: t('docs.bankSchemaOk').replace('{format}', val.format || '—') });
}

function bankImportKarte() {
  const out = el('div', { class: 'vorschlag-slot' });
  const btn = el('button', {
    class: 'btn', text: t('docs.bankImport'),
    onClick: async () => {
      out.replaceChildren();
      const file = await pickFile('text/plain,application/xml,text/xml,.sta,.940,.txt,.mt940,.xml', null);
      if (!file) return;
      try {
        const roh = await readFileText(file);
        const parsed = parseBankauszug(roh);
        const { format, konto, umsaetze } = parsed;
        // Struktur-/Schema-Validierung (SWIFT-Feldformate / ISO-20022-Nachrichten-Struktur)
        // VOR den Umsätzen anzeigen — auch wenn keine Umsätze geparst wurden.
        const schema = validiereBankauszug(roh);
        if (!umsaetze.length) {
          out.appendChild(bankSchemaHinweis(schema));
          out.appendChild(el('p', { class: 'form-error', text: t('docs.bankNone') }));
          return;
        }
        // Offene Posten für den Zahlungsabgleich laden: Forderungen (aus Aufträgen,
        // richtung 'einnahme') + Verbindlichkeiten (Eingangsrechnungen, richtung 'ausgabe').
        let posten = [];
        try {
          const [auftraege, kunden, eingang] = await Promise.all([listAuftraege(), listKunden(), listEingangsrechnungen()]);
          const nameById = {}; for (const k of kunden) nameById[k.id] = k.name;
          posten = [...offenePosten(auftraege, { nameById }), ...offeneVerbindlichkeiten(eingang)];
        } catch { posten = []; }
        out.appendChild(el('div', { class: 'muted small', text: `${format || '—'} · ${t('docs.bankAccount')}: ${konto || '—'} · ${umsaetze.length} ${t('docs.bankTxns')}` }));
        // Struktur-/Schema-Validierung (Feldformate / Nachrichten-Struktur).
        out.appendChild(bankSchemaHinweis(schema));
        // Plausibilitätsprüfung (Saldo-Abgleich / unvollständige Umsätze) als Hinweis.
        const pruef = pruefeBankauszug(parsed);
        if (pruef.warnungen.length) out.appendChild(bankPruefHinweis(pruef));
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
// `extra` erlaubt eine abweichende Ausgleichshöhe (z. B. inkl. Skonto) + Zusatzfelder.
async function zahlungVerbuchen(p, u, datum, extra = {}) {
  const zahlung = { betragCent: u.betragCent, datum, ref: u.zweck || null, ...extra };
  if (p.kind === 'verbindlichkeit') await zahlungHinzufuegen(p.id, zahlung);
  else await auftragZahlungHinzufuegen(p.id, zahlung);
}

// Sammelzahlungs-Panel (R2b): listet alle gleichgerichteten offenen Posten mit
// Checkboxen, die vorgeschlagene Kombination ist vorausgewählt. Die laufende Summe
// wird gegen den Zahlbetrag geprüft (passt / über / unter); beim Verbuchen wird der
// Betrag der Reihe nach verteilt (Restbildung beim letzten Posten) und EIN Entwurf
// mit je einer Zeile pro Rechnung erzeugt — manuell festschreiben (GoBD).
function sammelPanel(u, posten, vorschlag, slot) {
  const wrap = el('div', { class: 'sammel-panel' });
  const kandidaten = posten.filter((p) => p.richtung === u.richtung && (p.betragCent || 0) > 0);
  const gewaehlt = new Set((vorschlag.posten || []).map((p) => p.id));
  const status = el('p', { class: 'muted small' });

  const aktualisiere = () => {
    const auswahl = kandidaten.filter((p) => gewaehlt.has(p.id));
    const sum = auswahl.reduce((s, p) => s + (p.betragCent || 0), 0);
    const diff = sum - u.betragCent;
    let txt = `${t('docs.bankSammelSum')}: ${formatEuro(sum)} / ${formatEuro(u.betragCent)}`;
    if (Math.abs(diff) <= 2) txt += ` · ${t('docs.bankSammelFits')}`;
    else if (diff > 0) txt += ` · ${t('docs.bankSammelOver').replace('{betrag}', formatEuro(diff))}`;
    else txt += ` · ${t('docs.bankSammelUnder').replace('{betrag}', formatEuro(-diff))}`;
    status.textContent = txt;
  };

  const liste = el('div', { class: 'sammel-liste' }, kandidaten.map((p) => {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = gewaehlt.has(p.id);
    cb.addEventListener('change', () => { if (cb.checked) gewaehlt.add(p.id); else gewaehlt.delete(p.id); aktualisiere(); });
    return el('label', { class: 'sammel-zeile' }, [
      cb,
      el('span', { class: 'mono small', text: `${p.referenz || p.id} · ${formatEuro(p.betragCent)} · ${(p.name || '').slice(0, 30)}` }),
    ]);
  }));

  const verbuchen = el('button', {
    class: 'btn btn-sm btn-primary', type: 'button', text: t('docs.bankSammelBook'),
    onClick: async () => {
      const auswahl = kandidaten.filter((p) => gewaehlt.has(p.id));
      if (auswahl.length < 2) { status.textContent = t('docs.bankSammelMin'); return; }
      const datum = u.valuta || new Date().toISOString().slice(0, 10);
      const { zuordnung, unverteiltCent } = verteileSammelzahlung(u.betragCent, auswahl);
      const bk = sammelBuchungZeilen({ richtung: u.richtung, valuta: datum }, zuordnung);
      if (!bk) { status.textContent = t('docs.bankSammelMin'); return; }
      slot.replaceChildren();
      try {
        await saveEntwurf({ datum: bk.datum, beschreibung: bk.beschreibung, zeilen: bk.zeilen });
        // Je Posten den zugeordneten (Teil-)Betrag als Zahlung erfassen.
        for (const z of zuordnung) {
          await zahlungVerbuchen(z.posten, u, bk.datum, { betragCent: z.betragCent, ref: u.zweck || null });
        }
        slot.appendChild(el('p', { class: 'muted small', text: t('docs.bankSammelDone').replace('{anzahl}', String(zuordnung.length)).replace('{betrag}', formatEuro(bk.summeCent)) }));
        if (unverteiltCent > 0) slot.appendChild(el('p', { class: 'muted small', text: t('docs.bankSammelRest').replace('{betrag}', formatEuro(unverteiltCent)) }));
      } catch (e) { slot.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
    },
  });

  aktualisiere();
  wrap.appendChild(el('p', { class: 'muted small', text: t('docs.bankSammelHint') }));
  wrap.appendChild(liste);
  wrap.appendChild(status);
  wrap.appendChild(el('div', { class: 'btn-row' }, [verbuchen]));
  return wrap;
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
    // Kein exakter Treffer: Skonto ODER Teilzahlung auf einen offenen Posten anbieten.
    const kand = findeKandidaten(u, posten).find((k) => k.art === 'teilzahlung' || k.art === 'skonto');
    if (kand && kand.art === 'skonto') {
      // Skonto: Posten KOMPLETT ausgleichen inkl. USt-/Vorsteuer-Korrektur nach §17 UStG
      // (Buchungs-ENTWURF, manuell festschreiben — Korrektheit vor Bequemlichkeit).
      const p = kand.posten;
      const datum = u.valuta || new Date().toISOString().slice(0, 10);
      const entwurf = skontoEntwurf({
        richtung: u.richtung,
        offenCent: kand.offenCent,
        zahlungCent: kand.gezahltCent,
        saetze: p.saetze,
        referenz: p.referenz,
        name: p.name,
        datum,
      });
      if (entwurf) {
        knoepfe.push(el('button', {
          class: 'btn btn-sm', type: 'button',
          text: `${t('docs.bankSkonto')} ${p.referenz || ''}`.trim(),
          title: entwurf.begruendung,
          onClick: async () => {
            slot.replaceChildren();
            try {
              await saveEntwurf({ datum: entwurf.datum, beschreibung: entwurf.beschreibung, begruendung: entwurf.begruendung, zeilen: entwurf.zeilen });
              // Posten gilt als ausgeglichen (Bank + Skonto = offener Betrag).
              await zahlungVerbuchen(p, u, entwurf.datum, { betragCent: kand.offenCent, bankCent: kand.gezahltCent, skontoCent: entwurf.skontoBruttoCent });
              slot.appendChild(el('p', { class: 'muted small', text: t('docs.bankSkontoDone').replace('{betrag}', formatEuro(entwurf.skontoBruttoCent)) }));
              slot.appendChild(el('p', { class: 'muted small', text: t('docs.bankSkontoUst').replace('{netto}', formatEuro(entwurf.nettoSkontoCent)).replace('{ust}', formatEuro(entwurf.ustSkontoCent)) }));
            } catch (e) { slot.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
          },
        }));
      }
    } else if (kand) {
      // Teilzahlung: nur den gezahlten Betrag verbuchen, der Rest bleibt offen.
      const p = kand.posten;
      knoepfe.push(el('button', {
        class: 'btn btn-sm', type: 'button',
        text: `${t('docs.bankPartial')} ${p.referenz || ''}`.trim(),
        onClick: async () => {
          slot.replaceChildren();
          const bk = zahlungsBuchungZeilen(u, p);
          try {
            await saveEntwurf({ datum: bk.datum, beschreibung: bk.beschreibung, zeilen: bk.zeilen });
            await zahlungVerbuchen(p, u, bk.datum);
            slot.appendChild(el('p', { class: 'muted small', text: t('docs.bankPartialDone').replace('{rest}', formatEuro(kand.restCent || 0)) }));
          } catch (e) { slot.appendChild(el('p', { class: 'form-error', text: String(e.message || e) })); }
        },
      }));
    }
  }

  // Sammelzahlung (R2b): deckt eine Zahlung mehrere offene Rechnungen ab? Dann eine
  // Mehrfach-Auswahl anbieten (explizite Bestätigung statt automatischer Zuordnung).
  const sammel = findeSammelzuordnung(u, posten);
  if (sammel.length) {
    knoepfe.push(el('button', {
      class: 'btn btn-sm', type: 'button', text: t('docs.bankSammel'),
      onClick: () => { slot.replaceChildren(); slot.appendChild(sammelPanel(u, posten, sammel[0], slot)); },
    }));
  }

  // Fallback / Alternative: normaler Buchungsvorschlag über Kategorisierung.
  knoepfe.push(el('button', {
    class: 'btn btn-sm', type: 'button', text: t('docs.bankDraft'),
    onClick: async () => {
      slot.replaceChildren();
      const ex = umsatzExtraktion(u);
      // Verwendungszweck und Gegenpartei schreibt der ABSENDER einer Zahlung — fremder Text, der an
      // die Kontierung geht. Dieselbe Prüfung wie beim OCR-Text (Klaus 2026-10-14).
      const frei = await kiTextFreigabe(u.zweck || u.gegen || '');
      const kat = await categorizeAI(frei.kiText, _idx, { anker: await kiAnker(frei.kiText), nurLokal: frei.nurLokal });
      kat.richtung = u.richtung; // Kontoauszug bestimmt die Richtung verbindlich
      const res = buildVorschlag(ex, kat, _idx, { kleinunternehmer: getSettings().kleinunternehmer });
      if (!res.ok) { slot.appendChild(el('p', { class: 'form-error', text: res.fehler })); return; }
      if (frei.hinweis) slot.appendChild(el('p', { class: 'hinweis small', text: frei.hinweis }));
      // Der Zweck geht in Begründung und Richter nur bereinigt weiter (vorher nur u.zweck, ohne Gegenpartei).
      slot.appendChild(await vorschlagKarte(res.vorschlag, null, u.zweck ? frei.kiText : ''));
    },
  }));

  return el('div', { class: 'bank-row' }, [el('div', { class: 'btn-row' }, knoepfe), slot]);
}

// ---- Upload (Datei / Foto / PDF) + Beleg-Liste -----------------------------

let _importStatus = null;   // {text, liste?} — überlebt das Neuzeichnen

function uploadKarte() {
  const add = async (accept, capture) => {
    const file = await pickFile(accept, capture);
    if (!file) return;
    try { await saveBeleg(file); await repaint(); }
    catch (e) { alert(String(e.message || e)); }
  };
  // Viele auf einmal oder ein ganzer Ordner (Klaus 2026-10-14). Jeder Beleg wird einzeln
  // verschlüsselt abgelegt — OHNE Prüfung beim Einlesen (geprüft wird auf Knopfdruck, wie in
  // Workflow PDF #111). Was übersprungen wird, steht beim Namen da.
  const viele = async (ordner) => {
    const files = await pickFiles('image/*,application/pdf,.pdf', { ordner });
    if (!files.length) return;
    const { nehmen, ueberspringen } = belegDateienWaehlen(files);
    const fehler = [];
    let n = 0;
    for (let i = 0; i < nehmen.length; i++) {
      _importStatus = { text: t('docs.importLaeuft').replace('{i}', String(i + 1)).replace('{n}', String(nehmen.length)) };
      const st = document.querySelector('[data-import-status]');
      if (st) st.textContent = _importStatus.text;
      try { await saveBeleg(nehmen[i].file, { typ: nehmen[i].typ }); n++; }
      catch (e) { fehler.push(`${nehmen[i].pfad}: ${String((e && e.message) || e)}`); }
    }
    _importStatus = {
      text: t('docs.importFertig').replace('{n}', String(n)),
      uebersprungen: ueberspringen.map((u) => u.pfad),
      fehler,
    };
    if (typeof window !== 'undefined') window.__blpImport = { abgelegt: n, uebersprungen: ueberspringen, fehler };   // Probe
    await repaint();
  };
  const status = [];
  if (_importStatus) {
    status.push(el('p', { class: 'small', 'data-import-status': '', text: _importStatus.text }));
    if (_importStatus.uebersprungen && _importStatus.uebersprungen.length) {
      status.push(el('details', { class: 'small', 'data-import-uebersprungen': '' }, [
        el('summary', { text: t('docs.importUebersprungen').replace('{n}', String(_importStatus.uebersprungen.length)) }),
        el('ul', { class: 'hinweis-liste' }, _importStatus.uebersprungen.map((p) => el('li', { text: p }))),
      ]));
    }
    if (_importStatus.fehler && _importStatus.fehler.length) {
      status.push(el('div', { class: 'form-error small', 'data-import-fehler': '' }, [
        el('p', { text: t('docs.importFehler').replace('{n}', String(_importStatus.fehler.length)) }),
        el('ul', { class: 'hinweis-liste' }, _importStatus.fehler.map((f) => el('li', { text: f }))),
      ]));
    }
  } else status.push(el('p', { class: 'small', 'data-import-status': '' }));
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('docs.archive') }),
    el('p', { class: 'muted small', text: t('docs.archiveHint') }),
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn', text: t('docs.camera'), onClick: () => add('image/*', 'environment') }),
      el('button', { class: 'btn', text: t('docs.uploadMehrere'), 'data-import-viele': '', onClick: () => viele(false) }),
      el('button', { class: 'btn', text: t('docs.ordner'), 'data-import-ordner': '', onClick: () => viele(true) }),
    ]),
    ...status,
  ]);
}

// ---- Prüfung auf Knopfdruck (Klaus 2026-10-14) ------------------------------

const _pruefLaeuft = new Set();   // Kennungen, die gerade geprüft werden
let _pruefStapel = null;          // {i, n} beim „Alle ungeprüften prüfen", sonst null
let _pruefStapelErgebnis = null;  // Satz nach dem letzten Stapel

async function pruefeEinen(b, { zeigen = true } = {}) {
  _pruefLaeuft.add(b.id);
  await repaint();
  let p;
  try { p = await pruefeBeleg(b.id); }
  catch (e) { _pruefLaeuft.delete(b.id); await repaint(); alert(String((e && e.message) || e)); return null; }
  finally { _pruefLaeuft.delete(b.id); }
  await repaint();
  if (zeigen) await berichtOeffnen(b, p);
  return p;
}

async function berichtOeffnen(b, vorhanden) {
  const p = vorhanden || await pruefBericht(b.id);
  const E = await pruefKern().catch(() => null);
  const ki = await kiVermerke(b.id);
  await pruefberichtZeigen(b.name, p, E, ki, {
    erneut: async () => { await pruefeEinen(b); },
  });
}

async function alleUngepruefenPruefen(belege) {
  const liste = ungepruefte(belege);
  if (!liste.length || _pruefStapel) return;
  let w = 0, u = 0;
  for (let i = 0; i < liste.length; i++) {
    _pruefStapel = { i: i + 1, n: liste.length };
    const p = await pruefeEinen(liste[i], { zeigen: false });
    if (p && p.stand === PRUEF_STAND.WARNUNG) w++;
    if (!p || p.stand === PRUEF_STAND.UNGEPRUEFT) u++;
  }
  _pruefStapel = null;
  _pruefStapelErgebnis = t('docs.pruefenFertig').replace('{n}', String(liste.length)).replace('{w}', String(w)).replace('{u}', String(u));
  await repaint();
}

function pruefKnopf(b) {
  const stand = pruefStandVon(b);
  if (!stand) return el('span', { class: 'muted small', text: '—' });
  if (_pruefLaeuft.has(b.id)) return el('span', { class: 'small', 'data-pruefung': 'laeuft', text: t('beleg.laeuft') });
  const text = { offen: t('beleg.offen'), warnung: t('beleg.warnung'), sauber: t('beleg.sauber'), ungeprueft: t('beleg.ungeprueft') }[stand];
  const knopf = el('button', {
    class: 'btn btn-sm' + (stand === 'warnung' ? ' btn-danger' : ''), type: 'button', text,
    'data-pruefung': stand,
    ...(stand === 'offen' ? { 'data-pruef-nachholen': '' } : { 'data-pruef-bericht': '' }),
    onClick: () => (stand === 'offen' ? pruefeEinen(b) : berichtOeffnen(b)),
  });
  const teile = [knopf];
  if (b.kiEntfernt && b.kiEntfernt.anzahl) {
    teile.push(el('button', { class: 'btn btn-link btn-sm', type: 'button', 'data-ki-gereinigt': '', text: t('beleg.gereinigt'), onClick: () => berichtOeffnen(b) }));
  }
  return el('div', { class: 'btn-row' }, teile);
}

function pruefLeiste(belege) {
  const offen = ungepruefte(belege);
  const teile = [];
  if (_pruefStapel) {
    teile.push(el('span', { class: 'small', 'data-pruef-stapel': 'laeuft',
      text: t('docs.pruefenLaeuft').replace('{i}', String(_pruefStapel.i)).replace('{n}', String(_pruefStapel.n)) }));
  } else if (offen.length) {
    teile.push(el('button', { class: 'btn btn-sm', type: 'button', 'data-pruef-alle': '',
      text: t('docs.alleUngeprueften').replace('{n}', String(offen.length)), onClick: () => alleUngepruefenPruefen(belege) }));
  }
  if (!_pruefStapel && _pruefStapelErgebnis) teile.push(el('span', { class: 'muted small', 'data-pruef-stapel': 'fertig', text: _pruefStapelErgebnis }));
  return teile.length ? el('div', { class: 'btn-row pruef-leiste' }, teile) : null;
}

function belegListe(belege, visionBereit) {
  if (!belege.length) return emptyState('empty-documents.png', t('docs.empty'));
  const rows = belege.map((b) => el('tr', {}, [
    el('td', { text: b.name }),
    el('td', { class: 'muted small', text: b.mediaType }),
    el('td', { class: 'num muted small', text: formatBytes(b.size) }),
    el('td', { class: 'muted small mono', text: (b.createdAt || '').slice(0, 10) }),
    el('td', { class: 'muted small mono', text: aufbewahrungBis(b.createdAt).slice(0, 4), title: t('docs.keepUntil') }),
    el('td', { text: b.buchungId ? '🔗' : '' }),
    el('td', { class: 'pruef-zelle', 'data-beleg-id': b.id }, [pruefKnopf(b)]),
    el('td', { class: 'actions' }, [belegAktionen(b, visionBereit)]),
  ]));
  return el('div', { class: 'card no-pad' }, [
    pruefLeiste(belege),
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: t('docs.name') }), el('th', { text: t('docs.kind') }),
        el('th', { class: 'num', text: t('docs.size') }), el('th', { text: t('docs.date') }),
        el('th', { text: t('docs.keepUntil') }), el('th', {}), el('th', { text: t('docs.pruefung') }), el('th', {}),
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
    // TEMPORÄR: Browser-Test-Marke für den Scan→OCR→Vorschlag-Pfad (co-located am OCR-Knopf).
    wrap.appendChild(testMarke('beleg-ocr', 'Texterkennung (Vision EU)'));
  }
  wrap.appendChild(el('button', {
    class: 'btn btn-sm', text: t('common.delete'),
    onClick: async () => {
      if (b.buchungId) { alert(t('docs.deleteLinked')); return; }            // GoBD: verknüpft → nicht löschbar
      const frist = istAufbewahrungspflichtig(b) ? `\n\n${t('docs.deleteRetention')} ${aufbewahrungBis(b.createdAt)}` : '';
      if (confirm(t('docs.confirmDelete') + frist)) { await deleteBeleg(b.id); await repaint(); }
    },
  }));
  return wrap;
}

// Der OCR-Text (oder ein eingefügter Text) geht als Nächstes an die Kontierung (Mistral EU).
// Steht darin eine Anweisung an eine KI, hält es EINMAL an (Klaus 2026-10-14: „Ja, einmal
// anhalten"). Ohne Mistral-Schlüssel geht nichts hinaus — dann gibt es auch keinen Halt.
// ⚠ Fehlt die Prüfliste, geht NICHTS an die KI (fail-closed) — es wird gesagt.
async function kiTextFreigabe(text) {
  let mistral = false;
  try { mistral = await isMistralConfigured(); } catch { mistral = false; }
  if (!mistral) return { kiText: text, nurLokal: false };
  let PM;
  try { PM = await prueferMail(); }
  catch { return { kiText: text, nurLokal: true, hinweis: t('beleg.prueflisteFehlt') }; }
  const zeilen = kiAnweisungZeilen(PM.pruefeMail(String(text || '')));
  if (!zeilen.length) return { kiText: text, nurLokal: false };
  const wahl = await textHalt(zeilen);
  if (typeof window !== 'undefined') window.__blpTextHalt = { zeilen, wahl };   // Probe
  return textNachWahl(text, zeilen, wahl);
}

// Texterkennung eines Belegs (Klaus 2026-10-14). Bis hierher ging die ORIGINALDATEI an die OCR
// (PDF samt unsichtbarem Text, Foto samt EXIF). Jetzt, in dieser Reihenfolge:
//   1. noch nie geprüft → einmal fragen („Jetzt prüfen" / „Ohne Prüfung weiter");
//      auffällig → einmal anhalten.
//   2. reinigen: PDF als gezeichnete Seitenbilder, versteckter Text zugedeckt; Foto neu gezeichnet.
//      Versteckter Text gefunden → einmal anhalten („Ohne ihn senden" / „Abbrechen").
//   3. der bisherige Hinweis, dass etwas das Gerät verlässt (confirm).
//   4. OCR je Seitenbild; danach der Vermerk am Beleg (was nicht mitging).
//   5. der erkannte Text → Halt bei einer Anweisung an eine KI → Kontierung.
// Abbrechen heißt an jeder Stelle: nichts geht hinaus, nichts wird vermerkt.
async function visionExtraktion(b) {
  try {
    const stand = pruefStandVon(b);
    let p = null;
    if (stand === PRUEF_STAND.OFFEN) {
      const w = await ungeprueftHalt(b.name);
      if (!w) return;
      if (w === 'pruefen') p = await pruefeEinen(b, { zeigen: false });
    } else if (stand === PRUEF_STAND.WARNUNG) p = await pruefBericht(b.id);
    if (p && p.stand === PRUEF_STAND.WARNUNG) {
      const E = await pruefKern().catch(() => null);
      if (!(await auffaelligHalt(b.name, p, E))) { alert(t('beleg.abgebrochen')); return; }
    }

    const bytes = await getBelegBytes(b.id);
    const r = await belegFuersKi(bytes, b.mediaType);
    const versteckt = r.liste.filter((e) => e.grund !== 'meta');
    if (versteckt.length && !(await kiReinigungHalt(b.name, versteckt))) { alert(t('beleg.abgebrochen')); return; }
    const mehr = r.gesamt > r.seiten ? '\n\n' + t('beleg.seitenMax').replace('{m}', String(r.seiten)).replace('{g}', String(r.gesamt)) : '';
    if (!confirm(t('docs.confirmOcrSauber').replace('{n}', String(r.bilder.length)) + mehr)) return; // Daten gehen an die OCR (EU)

    const teile = [];
    for (const u of r.bilder) teile.push(await ocr({ base64: u.slice(u.indexOf(',') + 1), mimeType: 'image/jpeg' }));
    await vermerkeKiEntfernt(b.id, r.liste, 'Texterkennung');
    const text = teile.join('\n\n').trim();
    if (!text) { alert(t('docs.ocrNoText')); await repaint(); return; }

    const ex = extractFromText(text);
    const frei = await kiTextFreigabe(text);
    const kat = await categorizeAI(frei.kiText, _idx, { anker: await kiAnker(frei.kiText), nurLokal: frei.nurLokal });   // Mistral EU, sonst Heuristik
    const res = buildVorschlag(ex, kat, _idx);
    if (!res.ok) { alert(res.fehler); await repaint(); return; }
    // R3: Aus dem OCR-Beleg lässt sich entweder direkt buchen (Buchungsvorschlag) ODER eine
    // offene VERBINDLICHKEIT „auf Ziel" erfassen (Kreditor, erscheint im Zahlungsabgleich).
    await repaint(el('div', {}, [
      frei.hinweis ? el('p', { class: 'hinweis small', text: frei.hinweis }) : null,
      zeigeFeature(getSettings(), FEATURE.VERBINDLICHKEITEN) ? verbindlichkeitAusExtraktionZeile(ex, kat) : null,
      await vorschlagKarte(res.vorschlag, b.id, frei.kiText),
    ]));
  } catch (e) {
    alert(t('docs.ocrError') + ' ' + String(e.message || e));
  }
}

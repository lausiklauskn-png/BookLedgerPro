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
import { categorize as categorizeAI, chat } from '../../ai/mistral.js';
import { ladeAnker } from '../../ai/anker.js';
import { tokenize, maskierungsBericht, reidentify } from '../../ai/pseudonym.js';
import { ocr } from '../../ai/vision.js';
import { isOcrAktiv, getAiConfig, isMistralConfigured } from '../../ai/aiConfig.js';
import { belegKontierung } from '../../ai/belegRichter.js';
import { buildVorschlag } from '../../ai/suggest.js';
import { begruendeBuchung } from '../../ai/berater.js';
import { onDeviceBegruendung } from '../../domain/rechtsregeln.js';
import { saveBeleg, listBelege, deleteBeleg, getBelegBytes, getOriginalBytes, bytesToBase64, linkBeleg, aufbewahrungBis, istAufbewahrungspflichtig } from '../../domain/documents.js';
import { setBelegText, getBelegText, setBelegVektoren, getBelegVektoren } from '../../domain/documents.js';
import { setBelegPositionen, getBelegPositionen } from '../../domain/documents.js';
import { parseEml, mailAlsText, mailBelegName, absenderName, istMailDatei, MAIL_TYP } from '../../domain/mailEml.js';
import { belegPositionen } from '../../domain/belegPositionen.js';
import { angebotMarkeLesen } from '../../domain/workflowPdfRundlauf.js';
import { listAngebote, setzeAngebotVerweise } from '../../domain/angebote-store.js';
import { suchwoerter, wortTreffer, ausschnitt, zerlegen, besteNaehe, bedeutungsRang, kombiniere, brauchtVektoren, eintragText, ZERLEGUNG, belegeFuerFrage, frageNachrichten, antwortTeile, FRAGE_TEXT_MAX } from '../../domain/belegsuche.js';
import { listBuchungen } from '../../domain/store.js';
import { loadEmbedder } from '../../sbkim/embed.js';
import { getSettings, navigate, updateSettings } from '../../state.js';
import { zeigeFeature, FEATURE } from '../../domain/nutzungsmodus.js';
import { emptyState } from '../empty.js';
import { icon } from '../icons.js';
import { gebenKnopf } from '../proAppGeben.js';
import { belegGruppen, PRUEF_SYMBOL, gruppeZu, gruppeUmschalten, alleZu, alleAuf } from '../../domain/belegListe.js';
import { testMarke } from '../testmarke.js';
import { namenVorschlagBox } from '../namensvorschlag.js';
import { pruefStandVon, ungepruefte, belegDateienWaehlen, belegTyp, kiAnweisungZeilen, textNachWahl, ohneZeilen, PRUEF_STAND } from '../../domain/kiReinigung.js';
import { pruefeBeleg, pruefBericht, kiVermerke, vermerkeKiEntfernt, pruefKern, prueferMail } from '../../domain/belegPruefung.js';
import { belegFuersKi, pdfKopf, pdfTextebene } from '../../ai/kiVorbereitung.js';
import { herkunftVon, istEigenerScan, textebeneReicht, workflowScanAdresse, istAndroid } from '../../domain/workflowPdf.js';
import { geteilteDateienHolen } from '../../domain/teilenEmpfang.js';
import { pruefberichtZeigen, ungeprueftHalt, auffaelligHalt, kiReinigungHalt, textHalt, drehkreis, arbeitsAnzeige } from '../belegDialoge.js';
import { fotoZuScan } from '../../core/scanPdf.js';
import { scannen } from '../scanner.js';
import { platzPlan, mb } from '../../domain/importPlatz.js';

let _host = null;
let _idx = {};
// Der Text der Schnellerfassung überlebt ein Neuzeichnen: ein Tipp auf einen Namensvorschlag
// speichert die Einstellungen, und die Ansicht wird neu gebaut (gefunden von smoke_handnamen).
let _schnellText = '';

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

// Übergabe aus Androids Teilen-Liste oder „Öffnen mit" (Klaus 2026-10-26): die Shell merkt beim Start den
// Parameter ./?geteilt=… bzw. die Dateien aus launchQueue; die Belegseite holt sie beim Öffnen ab.
let _geteilt = null;      // '1' | '0' | 'fehler' | null
let _geteiltDateien = []; // aus launchQueue („Öffnen mit")
export function merkeGeteilt(param) { _geteilt = param; }
export function merkeGeteilteDateien(files) { _geteiltDateien = Array.from(files || []); }

export async function mountDocuments(host) {
  _host = host;
  const konten = await loadAccounts();
  _idx = {};
  for (const k of konten) _idx[k.nummer] = k;
  await repaint();
  await geteiltesAbholen();
}

// Geteilte Dateien aus dem Vorrat des Workers holen und einlesen — nie still: kam nichts an, steht es da.
async function geteiltesAbholen() {
  const g = _geteilt; _geteilt = null;
  const direkt = _geteiltDateien; _geteiltDateien = [];
  if (g === null && !direkt.length) return;
  let files = direkt;
  if (g !== null) {
    if (g === 'fehler') { _importStatus = { text: t('docs.teilenFehler') }; await repaint(); return; }
    files = files.concat(await geteilteDateienHolen());
  }
  if (!files.length) { _importStatus = { text: t('docs.teilenNichts') }; await repaint(); return; }
  await dateienEinlesen(files, { quelle: 'teilen' });
}

async function repaint(extra) {
  const [belege, visionBereit] = await Promise.all([listBelege(), isOcrAktiv().catch(() => false)]);
  const ansicht = el('section', { class: 'view belege-ansicht' }, [
    el('h1', { text: t('docs.title') }),
    neuImTresorHinweis(),
    schnellerfassung(),
    extra || null,
    eRechnungKarte(),
    bankImportKarte(),
    uploadKarte(),
    belegSuche(belege),
    belegListe(belege, visionBereit),
  ]);
  mount(_host, ansicht);
  // Strichgrafiken statt Emojis (Leitfaden § 5) — auch in später gezeichneten Teilen (Suchtreffer, Meldungen).
  // Einordnen startet nie von selbst beim Öffnen (Leitfaden § 3): erst nach „Einordnen“ (oder dem Einschalten) in dieser
  // Sitzung. Danach kommen neue Belege wie bisher von selbst dazu.
  if (getSettings().bedeutungssuche === 'an' && _einordnenFrei) setTimeout(() => bedeutungStarten(belege).catch(() => {}), 0);
  else if (getSettings().bedeutungssuche === 'an') einordnenAnbieten(belege);
}
let _einordnenFrei = false;

// Bedeutung an, aber in dieser Sitzung noch nicht freigegeben: die Zeile nennt, was fehlt, und bietet „Einordnen“ an.
function einordnenAnbieten(belege) {
  const offen = belege.filter(brauchtVektoren).length;
  const ziel = document.querySelector('[data-einordnen-platz]');
  if (!ziel) return;
  if (!offen) { zustandSetzen('wartet', t('docs.suche.bedeutungBereitKurz')); return; }
  zustandSetzen('wartet', t('docs.suche.nochNicht').replace('{n}', String(offen)));
  ziel.replaceChildren(el('button', { class: 'btn btn-sm btn-primary', type: 'button', 'data-einordnen': '', text: t('docs.suche.einordnen'), onClick: () => {
    _einordnenFrei = true; ziel.replaceChildren(); bedeutungStarten().catch(() => {});
  } }));
}

// 1 · „Neu im Tresorordner“ (Klaus 2026-10-28, nur Pro-App): eine Zeile über den Belegen, wenn andere Pro-Apps etwas
// hineingelegt haben, das noch nicht übernommen ist. Der Platz bleibt leer, bis die Zahl da ist (kein Springen ohne Grund).
function neuImTresorHinweis() {
  if (typeof window === 'undefined' || !window.BLPNative || !window.BLPNative.tresor) return null;
  const platz = el('div', { 'data-belege-tresor-neu': '' });
  import('./tresorordner.js').then((m) => m.neuImTresorordner()).then((n) => {
    if (!n || !platz.isConnected) return;
    platz.replaceChildren(el('div', { class: 'card btn-row', role: 'status' }, [
      el('span', { text: t('tresor.neuHinweis').replace('{n}', String(n)) }),
      el('button', { class: 'btn btn-primary', text: t('tresor.neuZeigen'), 'data-belege-tresor-zeigen': '', onClick: () => navigate('tresorordner') }),
    ]));
  }).catch(() => {});
  return platz;
}

// ---- Schnellerfassung aus Text ---------------------------------------------

function schnellerfassung() {
  const ta = el('textarea', { class: 'beleg-text', placeholder: t('docs.pastePlaceholder'), rows: '5' });
  const out = el('div', { class: 'vorschlag-slot' });
  // Namensvorschläge wie im Sende-Prüfer: VOR dem Senden, beim Tippen (verdecken erst nach einem Tipp).
  const namen = namenVorschlagBox(() => ta.value);
  let warte = null;
  ta.value = _schnellText;
  ta.addEventListener('input', () => { _schnellText = ta.value; clearTimeout(warte); warte = setTimeout(namen.aktualisiere, 400); });
  if (_schnellText) setTimeout(namen.aktualisiere, 0);
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
    namen.box,
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
  // Namen, die im Text stehen, aber noch nicht verdeckt werden — für den nächsten Versand.
  if (quelltext) { const nv = namenVorschlagBox(() => quelltext); card.appendChild(nv.box); await nv.aktualisiere(); }

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
    if (!belegId) _schnellText = '';   // gebucht: die Schnellerfassung beginnt leer
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
  wrap.appendChild(el('ul', { class: 'sbkimsuche-list' }, treffer.map((v) => el('li', v.ausgeschlossen ? { 'data-ausgeschlossen': v.ausgeschlossen } : {}, [
    el('strong', { text: (v.ausgeschlossen ? '⚠ ' : '') + v.label }),
    el('span', { class: 'muted small', text: v.ausgeschlossen ? ` · ${t('sbkim.ausgeschlossen')}` : ` · ${t('docs.richterScore')} ${Math.round((Number(v.score) || 0) * 100)} %` }),
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

// Ein Foto wird beim Ablegen zum Scan-PDF (Klaus 2026-10-14: „Ja, Scan + Original behalten",
// „wie bei Workflow PDF"). Das Original liegt unverändert und verschlüsselt am selben Beleg.
// Lässt sich kein Scan bauen, wird das Foto wie bisher abgelegt — und das wird gesagt.
async function belegAblegen(file, typ, quelle, mail) {
  const art = file.type || typ || '';
  if (/^image\//.test(art)) {
    try {
      const sc = await fotoZuScan(file, { qualitaet: (getSettings() || {}).scanQualitaet });
      const pdf = new File([sc.pdf], sc.name, { type: 'application/pdf' });
      const b = await saveBeleg(pdf, { original: file, originalTyp: art, scan: sc, quelle, mail });
      return { scan: true, sicher: sc.sicher, grund: sc.grund, id: b && b.id };
    } catch (e) {
      const b = await saveBeleg(file, { typ, quelle, mail });
      return { scan: false, grund: String((e && e.message) || e), id: b && b.id };
    }
  }
  // PDF: die Marke im Kopf sagt, ob es ein eigener Scan aus Workflow PDF ist (keine Datei-Prüfung, D12).
  let herkunft, angebot = null;
  if (art === 'application/pdf' || /\.pdf$/i.test(file.name || '')) {
    try {
      const bytes = await readFileBytes(file);
      const kopf = await pdfKopf(bytes);
      herkunft = herkunftVon(kopf);
      angebot = await angebotZuPdf(kopf, bytes);
    } catch { herkunft = undefined; angebot = null; }
  }
  const b = await saveBeleg(file, { typ, herkunft, quelle, mail, angebot: angebot ? { id: angebot.id, nummer: angebot.nummer } : undefined });
  if (angebot && b && b.id) {
    try { await setzeAngebotVerweise(angebot.id, { wfpdfBelegId: b.id, wfpdfBelegName: b.name || file.name || '', wfpdfZurueckAm: new Date().toISOString() }); }
    catch { /* der Beleg steht; der Vermerk am Angebot ist Beiwerk */ }
  }
  return { scan: false, eigen: herkunft === 'workflow-pdf', angebot: angebot ? angebot.nummer : null, id: b && b.id };
}

// Rückweg aus Workflow PDF (Klaus 2026-10-26, „beides“): trägt ein PDF die Marke eines BLP-Angebots (Keywords
// `blp-angebot=…` — Workflow PDF setzt beim festen Export nur Title/Producer/Creator — oder die Fußzeile in der
// Textebene), wird der Beleg diesem Angebot zugeordnet. Nur die Textebene wird gelesen, wenn das PDF von Workflow PDF
// oder BookLedgerPro stammt; fremde PDFs bleiben unangetastet. Das Angebot muss es hier geben, sonst nichts.
async function angebotZuPdf(kopf, bytes) {
  const k = kopf || {};
  let marke = angebotMarkeLesen('', k.keywords);
  if (!marke && /^(Workfloh PDF|BookLedgerPro)/.test(String(k.producer || ''))) {
    try { const tb = await pdfTextebene(bytes); marke = angebotMarkeLesen(tb && tb.text, ''); } catch { marke = null; }
  }
  if (!marke) return null;
  const alle = await listAngebote();
  const a = alle.find((x) => x.id === marke.id) || (marke.nummer ? alle.find((x) => x.nummer === marke.nummer) : null) || null;
  return a ? { id: a.id, nummer: a.nummer || marke.nummer || '' } : null;
}

// Textebene eines PDFs sofort am Beleg merken (eigener Scan oder Mail-Anhang, Klaus 2026-10-26): Wort-/Bedeutungssuche
// und die Positionen (Steuer-Plan S1) — ohne KI, nichts verlässt das Gerät. @returns true, wenn Text gemerkt wurde
async function textebeneMerken(id, file) {
  try {
    const tb = await pdfTextebene(await readFileBytes(file));
    const text = tb ? String(tb.text || '').trim() : '';
    if (typeof window !== 'undefined') window.__blpScanText = { zeichen: text.length, seiten: tb && tb.seiten };   // Probe
    if (!text) return false;
    await textMerken(id, text);
    await positionenMerken(id, text);
    return true;
  } catch (e) { if (typeof window !== 'undefined') window.__blpScanText = { fehler: String((e && e.message) || e) }; return false; }
}
async function positionenMerken(id, text) {
  try { const pos = belegPositionen(text); await setBelegPositionen(id, pos); if (typeof window !== 'undefined') window.__blpPositionen = { id, anzahl: pos.positionen.length, stimmt: pos.stimmt }; }   // Probe
  catch { /* Positionen sind Beiwerk */ }
}

// Eine geteilte Mail (.eml, Klaus 2026-10-26: „nur für die Ablage … Rechnungsanhänge differenziert auslesen"):
// die Mail selbst wird ein Beleg (Original verschlüsselt, Kopf + Text durchsuchbar), jeder PDF-/Bild-Anhang ein eigener
// Beleg mit Verweis auf die Mail; PDF-Anhänge mit Textebene bekommen Text und Positionen sofort. Keine KI dabei.
async function mailEinlesen(file, quelle) {
  const bytes = await readFileBytes(file);
  const m = parseEml(bytes);
  const von = absenderName(m.kopf.von), betreff = m.kopf.betreff || '', datum = (m.kopf.datum || '').slice(0, 10);
  const eml = new File([bytes], mailBelegName(m), { type: MAIL_TYP });
  const mailBeleg = await saveBeleg(eml, { typ: MAIL_TYP, quelle: quelle || 'mail', mail: { von, betreff, datum, anhaenge: m.anhaenge.length } });
  await textMerken(mailBeleg.id, mailAlsText(m));
  let anhaenge = 0, gelesen = 0;
  const uebergangen = [];
  for (const a of m.anhaenge) {
    const typ = belegTyp(a.name, a.typ);
    if (!typ || typ === MAIL_TYP || a.inline) { uebergangen.push(a.name); continue; }
    const f = new File([a.bytes], a.name, { type: typ });
    const r = await belegAblegen(f, typ, quelle || 'mail', { von, betreff, datum, mailId: mailBeleg.id });
    anhaenge++;
    if (r.id && typ === 'application/pdf' && await textebeneMerken(r.id, f)) gelesen++;
  }
  if (m.uebergangen) uebergangen.push(`+${m.uebergangen}`);
  return { id: mailBeleg.id, belege: 1 + anhaenge, anhaenge, gelesen, uebergangen, betreff, von };
}

// „X Dateien, Y MB, frei Z" — und fragen, wenn es nicht passt oder eine Datei sehr groß ist.
async function platzFrage(nehmen) {
  let est = null;
  try { est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; } catch { est = null; }
  const plan = platzPlan(nehmen, est);
  const frei = plan.frei == null ? t('docs.platzUnbekannt') : mb(plan.frei);
  const zeile = t('docs.platzZeile').replace('{n}', String(plan.anzahl)).replace('{y}', mb(plan.bytes)).replace('{b}', mb(plan.bedarf)).replace('{z}', frei);
  if (typeof window !== 'undefined') window.__blpPlatz = { ...plan, zeile };   // Probe
  const gross = plan.gross.map((g) => '· ' + g.pfad + ' (' + mb(g.size) + ')');
  if (plan.passt === false || gross.length) {
    const teile = [zeile];
    if (plan.passt === false) teile.push(t('docs.platzPasstNicht'));
    if (gross.length) teile.push(t('docs.platzGross'), ...gross.slice(0, 8), ...(gross.length > 8 ? ['… +' + (gross.length - 8)] : []));
    teile.push('', t('docs.platzWeiter'));
    if (!confirm(teile.join('\n'))) return { weiter: false, zeile };
  }
  return { weiter: true, zeile, gross: plan.gross };
}

let _importStatus = null;   // {text, liste?} — überlebt das Neuzeichnen

function uploadKarte() {
  const add = async (accept, capture) => {
    const file = await pickFile(accept, capture);
    if (!file) return;
    try {
      const r = await belegAblegen(file);
      _importStatus = r.scan ? { text: r.sicher ? t('docs.scanSicher') : t('docs.scanGanz').replace('{grund}', r.grund || '') }
        : (r.grund ? { text: t('docs.scanNicht').replace('{grund}', r.grund) } : _importStatus);
      await repaint();
    }
    catch (e) { alert(String(e.message || e)); }
  };
  // Viele auf einmal oder ein ganzer Ordner (Klaus 2026-10-14). Jeder Beleg wird einzeln
  // verschlüsselt abgelegt — OHNE Prüfung beim Einlesen (geprüft wird auf Knopfdruck, wie in
  // Workflow PDF #111). Was übersprungen wird, steht beim Namen da.
  const viele = async (ordner) => {
    const files = await pickFiles('image/*,application/pdf,.pdf', { ordner });
    if (!files.length) return;
    await dateienEinlesen(files);
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
  // V2 (Klaus 2026-10-26): Workflow PDF zum Scannen öffnen — Android: die Pro-App (Rückfall Web-Fassung),
  // sonst die Web-Fassung in einem neuen Fenster. Zurück kommt der Scan über Teilen (Android) oder Datei wählen.
  const wfKnopf = el('a', {
    class: 'btn', 'data-workflow-scan': '', href: workflowScanAdresse({ android: istAndroid(navigator.userAgent) }),
    target: istAndroid(navigator.userAgent) ? '_self' : '_blank', rel: 'noopener', text: t('docs.workflowScan'), title: t('docs.workflowScanHint'),
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('docs.archive') }),
    el('p', { class: 'muted small', text: t('docs.archiveHint') }),
    el('div', { class: 'btn-row' }, [
      // 📷 Scannen (Klaus 2026-10-26): der Scanner-Kern von Workflow PDF, eingebaut — Ecken, gerade ziehen, Filter,
      // Texterkennung, PDF mit Textebene → als Beleg, Text sofort suchbar. „Foto aufnehmen“ bleibt der stille Weg.
      el('button', { class: 'btn btn-primary', 'data-scan-start': '', text: t('docs.scannen'), title: t('docs.scannenHint'), onClick: () => scannerStarten() }),
      el('button', { class: 'btn', text: t('docs.camera'), onClick: () => add('image/*', 'environment') }),
      wfKnopf,
      el('button', { class: 'btn', text: t('docs.uploadMehrere'), 'data-import-viele': '', onClick: () => viele(false) }),
      el('button', { class: 'btn', text: t('docs.ordner'), 'data-import-ordner': '', onClick: () => viele(true) }),
    ]),
    el('p', { class: 'muted small', text: t('docs.workflowScanHint') }),
    ...status,
  ]);
}

// 📷 Scannen mit dem eingebauten Scanner-Kern (src/ui/scanner.js). Das fertige PDF (Marke „Workfloh PDF · Scannen“)
// geht durch dateienEinlesen wie jede Datei: Stand „eigen“, Text aus der Textebene gleich am Beleg gemerkt.
async function scannerStarten(dateien) {
  _importStatus = { text: t('docs.scannerLaedt') }; const st = document.querySelector('[data-import-status]'); if (st) st.textContent = _importStatus.text;
  try {
    await scannen({ titel: t('docs.scannenTitel'), fertigText: t('docs.scanFertig'), dateien, qualitaet: (getSettings() || {}).scanQualitaet, fertig: async (file) => { await dateienEinlesen([file], { quelle: 'scanner' }); } });
    _importStatus = { text: '' }; const st2 = document.querySelector('[data-import-status]'); if (st2) st2.textContent = '';
  } catch (e) {
    _importStatus = { text: t('docs.scannerFehlt').replace('{e}', String((e && e.message) || e)) };
    const st2 = document.querySelector('[data-import-status]'); if (st2) st2.textContent = _importStatus.text;
  }
}

// Viele Dateien auf einmal (Mehrfach-Auswahl, Ordner, Teilen, „Öffnen mit"). Jeder Beleg wird einzeln
// verschlüsselt abgelegt — OHNE Prüfung beim Einlesen (geprüft wird auf Knopfdruck, wie in Workflow PDF
// #111). Was übersprungen wird, steht beim Namen da. `quelle` = 'teilen' für Dateien aus der Teilen-Liste.
async function dateienEinlesen(files, { quelle } = {}) {
  {
    const { nehmen, ueberspringen } = belegDateienWaehlen(files);
    const platz = await platzFrage(nehmen);
    if (!platz.weiter) {
      _importStatus = { text: platz.zeile + ' — ' + t('docs.platzAbgebrochen') };
      if (typeof window !== 'undefined') window.__blpImport = { abgelegt: 0, uebersprungen: ueberspringen, fehler: [], abgebrochen: true };   // Probe
      await repaint(); return;
    }
    const fehler = [], ohneScan = [];
    let n = 0, scans = 0, ganz = 0;
    let eigen = 0, gelesen = 0, mails = 0, mailAnhaenge = 0;
    const angebote = [];   // Rundlauf Workflow PDF: zugeordnete Angebotsnummern
    const mailUebergangen = [];
    for (let i = 0; i < nehmen.length; i++) {
      _importStatus = { text: t('docs.importLaeuft').replace('{i}', String(i + 1)).replace('{n}', String(nehmen.length)) };
      const st = document.querySelector('[data-import-status]');
      if (st) st.textContent = _importStatus.text;
      try {
        if (nehmen[i].typ === MAIL_TYP || istMailDatei(nehmen[i].file.name, nehmen[i].typ)) {
          const mr = await mailEinlesen(nehmen[i].file, quelle);
          n += mr.belege; mails++; mailAnhaenge += mr.anhaenge; gelesen += mr.gelesen;
          mailUebergangen.push(...mr.uebergangen.map((x) => `${mr.betreff || 'Mail'}: ${x}`));
          continue;
        }
        const r = await belegAblegen(nehmen[i].file, nehmen[i].typ, quelle); n++;
        if (r.eigen) eigen++;
        if (r.angebot) angebote.push(r.angebot);
        // Eigener Scan (Marke „Workfloh PDF · Scannen“, aus dem eingebauten Scanner oder geteilt): der erkannte Text aus der
        // Textebene wird gleich am Beleg gemerkt (verschlüsselt) → Wort- und Bedeutungssuche (Klaus 2026-10-26). Keine KI
        // dabei; vor einer Kontierung prüft kiTextFreigabe den Text wie bisher. Die Textebene IST die Texterkennung — jedes
        // Wort zählt (kein Mindestmaß wie vor Vision); ohne Textebene holt „Text aus dem PDF übernehmen“ ihn später.
        if (r.eigen && r.id && await textebeneMerken(r.id, nehmen[i].file)) gelesen++;
        if (r.scan) { scans++; if (!r.sicher) ganz++; } else if (r.grund) ohneScan.push(`${nehmen[i].pfad}: ${r.grund}`);
      } catch (e) { fehler.push(`${nehmen[i].pfad}: ${String((e && e.message) || e)}`); }
    }
    const zusatz = (scans ? ' ' + t('docs.scanAnzahl').replace('{n}', String(scans)).replace('{g}', String(ganz)) : '')
      + (eigen ? ' ' + t('docs.eigeneScans').replace('{n}', String(eigen)) : '')
      + (gelesen ? ' ' + t('docs.scanTextGemerkt').replace('{n}', String(gelesen)) : '')
      + (mails ? ' ' + t('docs.mailAbgelegt').replace('{m}', String(mails)).replace('{a}', String(mailAnhaenge)) : '')
      + (angebote.length ? ' ' + t('docs.angebotZugeordnet').replace('{n}', String(angebote.length)) : '');
    const vorsatz = quelle === 'teilen' ? t('docs.teilenEmpfangen').replace('{n}', String(nehmen.length + ueberspringen.length)) + ' · ' : '';
    _importStatus = {
      text: vorsatz + platz.zeile + ' · ' + t('docs.importFertig').replace('{n}', String(n)) + zusatz,
      uebersprungen: ueberspringen.map((u) => u.pfad),
      fehler: fehler.concat(ohneScan.map((x) => t('docs.scanNicht').replace('{grund}', x))),
      uebergangen: mailUebergangen,
    };
    if (typeof window !== 'undefined') window.__blpImport = { abgelegt: n, uebersprungen: ueberspringen, fehler, scans, ganz, ohneScan, eigen, gelesen, mails, mailAnhaenge, mailUebergangen, angebote, quelle: quelle || null };   // Probe
    await repaint();
  }
}

// ---- Prüfung auf Knopfdruck (Klaus 2026-10-14) ------------------------------

const _pruefLaeuft = new Set();   // Kennungen, die gerade geprüft werden
let _pruefStapel = null;          // {i, n, name} beim „Alle ungeprüften prüfen", sonst null
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
    _pruefStapel = { i: i + 1, n: liste.length, name: liste[i].name };
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
  if (_pruefLaeuft.has(b.id)) return el('span', { class: 'small pruef-laeuft', 'data-pruefung': 'laeuft', role: 'status', title: t('beleg.laeuft'), 'aria-label': t('beleg.laeuft') }, [drehkreis()]);
  const text = { offen: t('beleg.offen'), eigen: t('beleg.eigen'), warnung: t('beleg.warnung'), sauber: t('beleg.sauber'), ungeprueft: t('beleg.ungeprueft') }[stand];
  const nachholen = stand === 'offen' || stand === 'eigen';
  // Flache Zeile (Leitfaden § 5): nur das kleine Zustandssymbol, der Satz steht im title/aria-label.
  const knopf = el('button', {
    class: 'zustand-knopf zustand-' + stand, type: 'button', title: text, 'aria-label': text,
    'data-pruefung': stand,
    ...(nachholen ? { 'data-pruef-nachholen': '' } : { 'data-pruef-bericht': '' }),
    onClick: () => (nachholen ? pruefeEinen(b) : berichtOeffnen(b)),
  }, [icon(PRUEF_SYMBOL[stand] || 'blp-offen')]);
  const teile = [knopf];
  if (b.kiEntfernt && b.kiEntfernt.anzahl) {
    teile.push(el('button', { class: 'zustand-knopf zustand-gereinigt', type: 'button', 'data-ki-gereinigt': '', title: t('beleg.gereinigt'), 'aria-label': t('beleg.gereinigt'), onClick: () => berichtOeffnen(b) }, [icon('blp-ki')]));
  }
  return el('span', { class: 'zustand-zelle' }, teile);
}

function pruefLeiste(belege) {
  const offen = ungepruefte(belege);
  const teile = [];
  if (_pruefStapel) {
    // Drehkreis + Balken: man sieht, DASS es läuft und WIE WEIT (Klaus 2026-10-14).
    teile.push(el('div', { class: 'pruef-stapel', 'data-pruef-stapel': 'laeuft', role: 'status' }, [
      el('div', { class: 'small pruef-laeuft' }, [drehkreis(),
        t('docs.pruefenLaeuft').replace('{i}', String(_pruefStapel.i)).replace('{n}', String(_pruefStapel.n))]),
      el('progress', { max: String(_pruefStapel.n), value: String(_pruefStapel.i - 1), 'data-pruef-balken': '' }),
      el('div', { class: 'muted small', text: _pruefStapel.name || '' }),
    ]));
  } else if (offen.length) {
    teile.push(el('button', { class: 'btn btn-sm', type: 'button', 'data-pruef-alle': '',
      text: t('docs.alleUngeprueften').replace('{n}', String(offen.length)), onClick: () => alleUngepruefenPruefen(belege) }));
  }
  if (!_pruefStapel && _pruefStapelErgebnis) teile.push(el('span', { class: 'muted small', 'data-pruef-stapel': 'fertig', text: _pruefStapelErgebnis }));
  return teile.length ? el('div', { class: 'btn-row pruef-leiste' }, teile) : null;
}

// Belegliste für Hunderte (Leitfaden § 5, Klaus 2026-10-28): eine flache Zeile je Beleg — Zustandssymbol, gekürzter Name,
// Datum, Größe, Verknüpfung, ⋯ für alle Knöpfe. Eine Mail ist eine Gruppe, ihre Anhänge darunter aufklappbar; „Alle zu/auf“.
const GRUPPEN_KEY = 'blpr_belege_gruppen';
function gruppenMerk() { try { return JSON.parse(localStorage.getItem(GRUPPEN_KEY) || 'null') || alleAuf(); } catch { return alleAuf(); } }
function gruppenSetzen(m) { try { localStorage.setItem(GRUPPEN_KEY, JSON.stringify(m)); } catch { /* nur Komfort */ } }

function belegZeile(b, visionBereit, { anhangVon = null, gruppe = null, zu = false } = {}) {
  const unter = [
    ...(b.original ? [el('div', { class: 'muted small zeile-unter', 'data-scan': b.scan && b.scan.sicher ? 'sicher' : 'ganz',
      text: (b.scan && b.scan.sicher ? t('docs.scanMarkeSicher') : t('docs.scanMarkeGanz')) + ' · ' + t('docs.originalLiegtBei') })] : []),
    mailZeile(b), angebotZeile(b), positionenZeile(b),
  ].filter(Boolean);
  const klapp = gruppe && gruppe.anhaenge.length ? el('button', {
    class: 'gruppe-klapp', type: 'button', 'data-gruppe-klapp': b.id, 'aria-expanded': zu ? 'false' : 'true',
    title: t(zu ? 'docs.liste.aufklappen' : 'docs.liste.zuklappen'), 'aria-label': t(zu ? 'docs.liste.aufklappen' : 'docs.liste.zuklappen'),
    onClick: () => { gruppenSetzen(gruppeUmschalten(gruppenMerk(), b.id)); repaint(); },
  }, [icon('blp-pfeil'), el('span', { class: 'gruppe-zahl', text: String(gruppe.anhaenge.length) })]) : null;
  const name = el('div', { class: 'zeile-name' }, [
    klapp,
    anhangVon ? icon('blp-anhang', 'zeile-anhang-ic') : null,
    el('span', { class: 'beleg-name', title: b.name + ' · ' + (b.mediaType || ''), text: b.name }),
  ].filter(Boolean));
  return el('tr', {
    class: 'beleg-zeile' + (anhangVon ? ' beleg-anhang' : '') + (gruppe && gruppe.anhaenge.length ? ' beleg-gruppe' : ''),
    'data-beleg-zeile': b.id, ...(anhangVon ? { 'data-anhang-von': anhangVon } : {}), ...(anhangVon && zu ? { hidden: true } : {}),
  }, [
    el('td', { class: 'pruef-zelle', 'data-beleg-id': b.id }, [pruefKnopf(b)]),
    el('td', { class: 'name-zelle' }, [name, ...unter]),
    el('td', { class: 'muted small mono datum-zelle', text: (b.createdAt || '').slice(0, 10) }),
    el('td', { class: 'num muted small groesse-zelle', text: formatBytes(b.size) }),
    el('td', { class: 'link-zelle' }, b.buchungId ? [el('span', { class: 'link-marke', title: t('docs.verknuepft'), 'aria-label': t('docs.verknuepft'), 'data-verknuepft': '' }, [icon('pb-link')])] : []),
    el('td', { class: 'actions' }, [el('div', { class: 'zeilen-knoepfe' }, [gebenKnopf(b), zeilenMenue(b, visionBereit)])]),
  ]);
}

// ⋯-Menü einer Zeile: alle Knöpfe (Texterkennung, Original, Löschen) und die Angaben, die nicht in die Zeile passen.
function zeilenMenue(b, visionBereit) {
  const liste = el('div', { class: 'zeilen-menue-liste', role: 'menu' }, [
    el('div', { class: 'muted small zeilen-menue-info', 'data-menue-info': '' }, [
      el('div', { text: b.name }),
      el('div', { text: (b.mediaType || '') + ' · ' + formatBytes(b.size) }),
      el('div', { title: t('docs.keepUntil'), text: t('docs.keepUntil') + ': ' + aufbewahrungBis(b.createdAt) }),
    ]),
    belegAktionen(b, visionBereit),
  ]);
  const d = el('details', { class: 'zeilen-menue', 'data-zeilen-menue': b.id }, [
    el('summary', { class: 'zeilen-menue-knopf', title: t('docs.liste.mehr'), 'aria-label': t('docs.liste.mehr') }, [icon('blp-mehr')]),
    liste,
  ]);
  d.addEventListener('toggle', () => {
    if (!d.open) return;
    for (const x of document.querySelectorAll('details.zeilen-menue[open]')) if (x !== d) x.open = false;
  });
  return d;
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    for (const x of document.querySelectorAll('details.zeilen-menue[open]')) if (!x.contains(e.target)) x.open = false;
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') for (const x of document.querySelectorAll('details.zeilen-menue[open]')) x.open = false; });
}

function belegListe(belege, visionBereit) {
  if (!belege.length) return emptyState('empty-documents.png', t('docs.empty'));
  const merk = gruppenMerk();
  const gruppen = belegGruppen(belege, MAIL_TYP);
  const rows = [];
  for (const g of gruppen) {
    const zu = g.anhaenge.length ? gruppeZu(merk, g.beleg.id) : false;
    rows.push(belegZeile(g.beleg, visionBereit, { gruppe: g, zu }));
    for (const a of g.anhaenge) rows.push(belegZeile(a, visionBereit, { anhangVon: g.beleg.id, zu }));
  }
  const mitGruppen = gruppen.some((g) => g.anhaenge.length);
  const alleSindZu = mitGruppen && gruppen.filter((g) => g.anhaenge.length).every((g) => gruppeZu(merk, g.beleg.id));
  const kopf = el('div', { class: 'liste-kopf' }, [
    el('span', { class: 'muted small', 'data-belege-zahl': String(belege.length), text: t('docs.liste.zahl').replace('{n}', String(belege.length)) }),
    mitGruppen ? el('button', { class: 'btn btn-sm', type: 'button', 'data-gruppen-alle': alleSindZu ? 'auf' : 'zu',
      text: t(alleSindZu ? 'docs.liste.alleAuf' : 'docs.liste.alleZu'), onClick: () => { gruppenSetzen(alleSindZu ? alleAuf() : alleZu()); repaint(); } }) : null,
  ]);
  return el('div', { class: 'card no-pad beleg-liste-karte' }, [
    pruefLeiste(belege),
    kopf,
    el('table', { class: 'table beleg-liste' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { class: 'pruef-zelle', title: t('docs.pruefung'), 'aria-label': t('docs.pruefung') }), el('th', { text: t('docs.name') }),
        el('th', { class: 'datum-zelle', text: t('docs.date') }), el('th', { class: 'num groesse-zelle', text: t('docs.size') }),
        el('th', { class: 'link-zelle' }), el('th', { class: 'actions' }),
      ])),
      el('tbody', {}, rows),
    ]),
  ]);
}

// Herkunft aus einer geteilten Mail (Klaus 2026-10-26): am Mail-Beleg „📧 Mail von … · n Anhänge", am Anhang „📎 aus Mail …".
function angebotZeile(b) {
  if (!b.angebot || !b.angebot.id) return null;
  return el('div', { class: 'muted small', 'data-angebot-beleg': b.angebot.id, text: t('docs.angebotZeile').replace('{nr}', b.angebot.nummer || '—') });
}
function mailZeile(b) {
  if (b.mediaType === MAIL_TYP) {
    const m = b.mail || {};
    return el('div', { class: 'muted small', 'data-mail': 'mail', text: t('docs.mailVon').replace('{von}', m.von || '—').replace('{n}', String(m.anhaenge || 0)) });
  }
  if (b.mail && b.mail.mailId) {
    return el('div', { class: 'muted small', 'data-mail': 'anhang', text: t('docs.mailAnhang').replace('{betreff}', b.mail.betreff || '—').replace('{von}', b.mail.von || '—') });
  }
  return null;
}

// Positionen (Steuer-Plan S1, Klaus 2026-10-26): „n Positionen · Summe stimmt" — ein Tipp klappt die Tabelle auf.
function positionenZeile(b) {
  if (!b.positionenAnzahl) return null;
  const wrap = el('div', { class: 'small', 'data-positionen': String(b.positionenAnzahl) });
  const knopf = el('button', { class: 'btn btn-link btn-sm', type: 'button', 'data-positionen-zeigen': '',
    text: t('docs.positionen').replace('{n}', String(b.positionenAnzahl)) + (b.positionenStimmt === true ? t('docs.positionenStimmt') : b.positionenStimmt === false ? t('docs.positionenWeicht') : '') });
  let offen = null;
  knopf.addEventListener('click', async () => {
    if (offen) { offen.remove(); offen = null; return; }
    const pos = await getBelegPositionen(b.id);
    if (!pos) return;
    offen = el('div', { class: 'positionen' }, [
      el('table', { class: 'table small', 'data-positionen-tabelle': '' }, [
        el('thead', {}, el('tr', {}, [el('th', { text: t('docs.posBezeichnung') }), el('th', { class: 'num', text: t('docs.posMenge') }), el('th', { class: 'num', text: t('docs.posEinzel') }), el('th', { class: 'num', text: t('docs.posBetrag') }), el('th', { text: t('docs.posUst') })])),
        el('tbody', {}, pos.positionen.map((p) => el('tr', {}, [
          el('td', { text: p.beschreibung }), el('td', { class: 'num', text: String(p.menge).replace('.', ',') }),
          el('td', { class: 'num', text: p.einzelpreisCent != null ? formatEuro(p.einzelpreisCent) : '' }),
          el('td', { class: 'num', text: formatEuro(p.betragCent) }), el('td', { text: p.ustSatz != null ? p.ustSatz + ' %' : (p.kz || '') }),
        ]))),
      ]),
      el('p', { class: 'muted small', text: t('docs.posSumme').replace('{s}', formatEuro(pos.summeCent)).replace('{r}', pos.erkannteSummeCent != null ? formatEuro(pos.erkannteSummeCent) : '—') + ' ' + t('docs.posHinweis') }),
    ]);
    wrap.appendChild(offen);
  });
  wrap.appendChild(knopf);
  return wrap;
}

function belegAktionen(b, visionBereit) {
  const wrap = el('div', { class: 'btn-row' });
  // Texterkennung: mit Vision für Bilder und PDFs; ein PDF mit Textebene (z. B. ein Scan aus Workflow PDF)
  // braucht keine Vision — der Knopf steht dann auch ohne Schlüssel (Klaus 2026-10-26).
  const pdf = b.mediaType === 'application/pdf';
  if ((visionBereit && /^(image\/|application\/pdf)/.test(b.mediaType)) || pdf) {
    wrap.appendChild(el('button', {
      class: 'btn btn-sm', text: pdf && !visionBereit ? t('docs.textebene') : t('docs.ocr'), 'data-texterkennung': '',
      onClick: () => visionExtraktion(b),
    }));
    // TEMPORÄR: Browser-Test-Marke für den Scan→OCR→Vorschlag-Pfad (co-located am OCR-Knopf).
    wrap.appendChild(testMarke('beleg-ocr', 'Texterkennung (Vision EU)'));
  }
  if (b.original) {
    wrap.appendChild(el('button', {
      class: 'btn btn-sm', type: 'button', 'data-original-laden': '', text: t('docs.originalLaden'),
      onClick: async () => {
        const bytes = await getOriginalBytes(b.id);
        if (!bytes) { alert(t('docs.originalFehlt')); return; }
        const url = URL.createObjectURL(new Blob([bytes], { type: b.original.mediaType || 'application/octet-stream' }));
        const a = el('a', { href: url, download: b.original.name || 'Foto' });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        if (typeof window !== 'undefined') window.__blpOriginal = { name: b.original.name, groesse: bytes.length };   // Probe
      },
    }));
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
    // Eigener Scan aus Workflow PDF (D12): kein Halt „noch nie geprüft" — er stammt direkt vom Papier.
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
    // Textebene zuerst (Klaus 2026-10-26): trägt das PDF seinen Text schon (Scan aus Workflow PDF mit
    // „Durchsuchbar", Rechnung aus einem Programm), wird nichts gezeichnet, nichts gesendet, kein Vision —
    // der Text geht direkt in die Prüfung auf KI-Anweisungen und die Kontierung.
    if (b.mediaType === 'application/pdf') {
      let tb = null;
      try { tb = await pdfTextebene(bytes); } catch { tb = null; }
      if (tb && textebeneReicht(tb.text)) {
        if (typeof window !== 'undefined') window.__blpTextebene = { seiten: tb.seiten, gesamt: tb.gesamt, zeichen: tb.text.length, eigen: istEigenerScan(b) };   // Probe
        const hinweis = (istEigenerScan(b) ? t('beleg.textebeneEigen') : t('beleg.textebene'))
          + (tb.gesamt > tb.seiten ? ' ' + t('beleg.seitenMax').replace('{m}', String(tb.seiten)).replace('{g}', String(tb.gesamt)) : '');
        await textMerken(b.id, tb.text);
        await textZuVorschlag(b, tb.text, hinweis);
        return;
      }
      const vision = await isOcrAktiv().catch(() => false);
      if (!vision) { alert(t('docs.textebeneFehlt')); return; }
    }
    let arbeit = arbeitsAnzeige(t('beleg.arbeitVorbereiten'));
    let r;
    try {
      r = await belegFuersKi(bytes, b.mediaType, {
        onSeite: (i, n) => arbeit.setzen(t('beleg.arbeitSeite').replace('{i}', String(i)).replace('{n}', String(n))),
      });
    } finally { arbeit.weg(); }
    const versteckt = r.liste.filter((e) => e.grund !== 'meta');
    if (versteckt.length && !(await kiReinigungHalt(b.name, versteckt))) { alert(t('beleg.abgebrochen')); return; }
    const mehr = r.gesamt > r.seiten ? '\n\n' + t('beleg.seitenMax').replace('{m}', String(r.seiten)).replace('{g}', String(r.gesamt)) : '';
    if (!confirm(t('docs.confirmOcrSauber').replace('{n}', String(r.bilder.length)) + mehr)) return; // Daten gehen an die OCR (EU)

    const teile = [];
    arbeit = arbeitsAnzeige(t('beleg.arbeitOcr').replace('{i}', '1').replace('{n}', String(r.bilder.length)));
    try {
      for (let i = 0; i < r.bilder.length; i++) {
        arbeit.setzen(t('beleg.arbeitOcr').replace('{i}', String(i + 1)).replace('{n}', String(r.bilder.length)));
        const u = r.bilder[i];
        teile.push(await ocr({ base64: u.slice(u.indexOf(',') + 1), mimeType: (/^data:([^;]+);/.exec(u) || [, 'image/jpeg'])[1] }));
      }
    } finally { arbeit.weg(); }
    await vermerkeKiEntfernt(b.id, r.liste, 'Texterkennung');
    const text = teile.join('\n\n').trim();
    if (!text) { alert(t('docs.ocrNoText')); await repaint(); return; }
    await textMerken(b.id, text);
    await textZuVorschlag(b, text, null);
  } catch (e) {
    alert(t('docs.ocrError') + ' ' + String(e.message || e));
  }
}

// Schritt 5: der erkannte Text (OCR oder Textebene) → Halt bei einer Anweisung an eine KI → Kontierung →
// Vorschlag. Gilt für beide Wege gleich (Klaus 2026-10-26: die Textprüfung bleibt auch für eigene Scans).
async function textZuVorschlag(b, text, hinweis) {
  const ex = extractFromText(text);
  const frei = await kiTextFreigabe(text);
  const arbeit = arbeitsAnzeige(t('beleg.arbeitKontierung'));
  let kat;
  try { kat = await categorizeAI(frei.kiText, _idx, { anker: await kiAnker(frei.kiText), nurLokal: frei.nurLokal }); }   // Mistral EU, sonst Heuristik
  finally { arbeit.weg(); }
  const res = buildVorschlag(ex, kat, _idx);
  if (!res.ok) { alert(res.fehler); await repaint(); return; }
  // R3: Aus dem OCR-Beleg lässt sich entweder direkt buchen (Buchungsvorschlag) ODER eine
  // offene VERBINDLICHKEIT „auf Ziel" erfassen (Kreditor, erscheint im Zahlungsabgleich).
  await repaint(el('div', {}, [
    hinweis ? el('p', { class: 'muted small', 'data-textebene-hinweis': '', text: hinweis }) : null,
    frei.hinweis ? el('p', { class: 'hinweis small', text: frei.hinweis }) : null,
    zeigeFeature(getSettings(), FEATURE.VERBINDLICHKEITEN) ? verbindlichkeitAusExtraktionZeile(ex, kat) : null,
    await vorschlagKarte(res.vorschlag, b.id, frei.kiText),
  ]));
}

// ───────────────────────── 🔎 Suche über Belege: Wörter und Bedeutung (Klaus 2026-10-26, A1/A2) ─────────────────────────
// Der erkannte Text liegt verschlüsselt am Beleg (setBelegText); die Suche liest ihn hier entschlüsselt in einen
// Sitzungs-Zwischenspeicher. Bedeutung: dasselbe e5-Modell wie die SBKIM-Suche (einmaliger Opt-in, 118 MB), Vektoren je
// Abschnitt verschlüsselt am Beleg (setBelegVektoren). Nichts verlässt das Gerät; keine KI.
let _frage = '';
let _texte = new Map();      // id → { stand, text }
let _vektoren = new Map();   // id → { zerlegung, anzahl, stuecke }
let _embedder = null;
let _bedeutungZustand = { stand: 'aus', text: '' };   // aus | laedt | ordnet | bereit | fehler
let _ordnetLauf = 0;
let _letzteTreffer = [];

async function textMerken(id, text) {
  try { const m = await setBelegText(id, text); _texte.set(id, { stand: m.textStand, text: String(text || '') }); _vektoren.delete(id); }
  catch { /* Tresor zu oder Beleg weg: Suche bleibt ohne diesen Text */ }
  if (_embedder) belegEinordnen(id).catch(() => {});
}

async function textVon(b) {
  const z = _texte.get(b.id);
  if (z && z.stand === b.textStand) return z.text;
  const text = (b.textZeichen || 0) > 0 ? await getBelegText(b.id).catch(() => '') : '';
  _texte.set(b.id, { stand: b.textStand, text });
  return text;
}

async function vektorenVon(b) {
  const z = _vektoren.get(b.id);
  if (z && z.zerlegung === b.vektorZerlegung && z.anzahl === b.vektorAnzahl) return z.stuecke;
  const stuecke = (b.vektorAnzahl || 0) > 0 ? await getBelegVektoren(b.id).catch(() => []) : [];
  _vektoren.set(b.id, { zerlegung: b.vektorZerlegung, anzahl: b.vektorAnzahl, stuecke });
  return stuecke;
}

async function embedderHolen(setStatus) {
  if (_embedder) return _embedder;
  // Probe-Haken (nur Tests): ein gestellter Embedder statt des 118-MB-Modells aus dem Netz.
  if (typeof window !== 'undefined' && window.__blpEmbedderStub) { _embedder = window.__blpEmbedderStub; return _embedder; }
  _embedder = await loadEmbedder({ onStatus: setStatus });
  return _embedder;
}

async function belegEinordnen(id) {
  const b = (await listBelege()).find((x) => x.id === id);
  if (!b || !_embedder || !brauchtVektoren(b)) return;
  const text = await textVon(b);
  const stuecke = [];
  for (const s of zerlegen(text)) stuecke.push({ text: s, vec: await _embedder.embedPassage(s) });
  const m = await setBelegVektoren(id, stuecke, ZERLEGUNG);
  _vektoren.set(id, { zerlegung: m.vektorZerlegung, anzahl: m.vektorAnzahl, stuecke });
}

function zustandSetzen(stand, text) {
  _bedeutungZustand = { stand, text: text || '' };
  for (const e of document.querySelectorAll('[data-bedeutung-zustand]')) { e.dataset.bedeutungZustand = stand; e.textContent = _bedeutungZustand.text; }
  if (typeof window !== 'undefined') window.__blpBedeutung = { ..._bedeutungZustand };
}

/** Modell laden (einmalig, opt-in) und alle Belege mit Text im Hintergrund einordnen. */
async function bedeutungStarten(belege) {
  const lauf = ++_ordnetLauf;
  try {
    if (!_embedder) { zustandSetzen('laedt', t('docs.suche.bedeutungLaedt')); await embedderHolen((s) => zustandSetzen('laedt', t('docs.suche.bedeutungLaedt') + ' ' + s)); }
    const offen = (belege || await listBelege()).filter(brauchtVektoren);
    // Pro-Umbau 4 (Leitfaden § 3): in der Android-App als Hintergrundaufgabe — läuft weiter, wenn die App nicht zu sehen
    // ist; „Abbrechen“ in der Mitteilung hält nach dem laufenden Beleg an. PWA/Basic: kein ProHintergrund, Lauf wie bisher.
    const aufgabe = offen.length && typeof window !== 'undefined' && window.ProHintergrund
      ? await window.ProHintergrund.beginnen({ art: 'einordnen', titel: t('docs.suche.bedeutungTitel') }).catch(() => null) : null;
    try {
      for (let i = 0; i < offen.length; i++) {
        if (lauf !== _ordnetLauf) return;
        if (aufgabe?.signal?.aborted) {
          _einordnenFrei = false;
          einordnenAnbieten(await listBelege());   // „Einordnen“ wieder anbieten
          zustandSetzen('wartet', t('docs.suche.bedeutungAbgebrochen').replace('{i}', String(i)).replace('{n}', String(offen.length)));
          return;
        }
        const satz = t('docs.suche.bedeutungOrdnet').replace('{i}', String(i + 1)).replace('{n}', String(offen.length));
        zustandSetzen('ordnet', satz);
        aufgabe?.stand(satz, i, offen.length);
        await belegEinordnen(offen[i].id);
      }
    } finally { aufgabe?.ende(); }
    const alle = await listBelege();
    const ohneText = alle.filter((b) => !(b.textZeichen > 0)).length;
    zustandSetzen('bereit', t('docs.suche.bedeutungBereit').replace('{n}', String(alle.length - ohneText)) + (ohneText ? ' · ' + t('docs.suche.ohneText').replace('{n}', String(ohneText)) : ''));
  } catch (e) {
    zustandSetzen('fehler', t('docs.suche.bedeutungFehler').replace('{e}', String((e && e.message) || e)));
  }
}

async function sucheAusfuehren(frage, _belegeAlt, ziel) {
  const woerter = suchwoerter(frage);
  ziel.replaceChildren();
  if (!woerter.length && !frage.trim()) return;
  const s = getSettings();
  // Frisch lesen: nach dem Einordnen im Hintergrund tragen die Belege neue Zählwerte (vektorAnzahl), ohne Neuzeichnen.
  const belege = await listBelege();
  const treffer = [];
  // 1) Wörter in Belegtexten (und im Namen)
  for (const b of belege) {
    const text = await textVon(b);
    const w = wortTreffer(b.name + ' ' + text, woerter);
    if (w) treffer.push({ id: b.id, art: 'wort', typ: 'beleg', name: b.name, stelle: ausschnitt(text || b.name, woerter) });
  }
  // 2) A2: Buchungen, Kunden, Aufträge (Wortsuche)
  if (s.belegsucheWeit !== false) {
    const [buchungen, kunden, auftraege] = await Promise.all([listBuchungen().catch(() => []), listKunden().catch(() => []), listAuftraege().catch(() => [])]);
    for (const [art, liste] of [['buchung', buchungen], ['kunde', kunden], ['auftrag', auftraege]]) {
      for (const e of liste) {
        const text = eintragText(art, e);
        if (wortTreffer(text, woerter)) treffer.push({ id: e.id, art: 'wort', typ: art, name: (art === 'buchung' ? (e.beschreibung || e.datum) : art === 'kunde' ? e.name : (e.titel || e.nr)) || '', stelle: ausschnitt(text, woerter) });
      }
    }
  }
  // 3) Bedeutung (nur mit geladenem Modell)
  let bedeutung = [], schwach = false;
  if (!_embedder && s.bedeutungssuche === 'an' && frage.trim()) {
    try { zustandSetzen('laedt', t('docs.suche.bedeutungLaedt')); await embedderHolen((x) => zustandSetzen('laedt', t('docs.suche.bedeutungLaedt') + ' ' + x)); einordnenAnbieten(belege); } catch (e) { zustandSetzen('fehler', t('docs.suche.bedeutungFehler').replace('{e}', String((e && e.message) || e))); }
  }
  if (_embedder && frage.trim()) {
    try {
      const q = await _embedder.embedQuery(frage.trim());
      const kand = [];
      for (const b of belege) {
        if (!(b.vektorAnzahl > 0)) continue;
        const best = besteNaehe(q, await vektorenVon(b));
        if (best) kand.push({ id: b.id, typ: 'beleg', name: b.name, naehe: best.naehe, stelle: best.stueck.slice(0, 160) });
      }
      const r = bedeutungsRang(kand);
      bedeutung = r.treffer; schwach = r.schwach;
    } catch { bedeutung = []; }
  }
  const alle = kombiniere(treffer, bedeutung);
  _letzteTreffer = alle;
  if (typeof window !== 'undefined') window.__blpSuche = { frage, woerter, wort: treffer.length, bedeutung: bedeutung.length, schwach, treffer: alle.map((x) => ({ id: x.id, typ: x.typ, art: x.art, naehe: x.naehe })) };
  if (!alle.length) { ziel.appendChild(el('p', { class: 'muted small', 'data-suche-leer': '', text: t('docs.suche.keineTreffer') })); return; }
  ziel.appendChild(el('p', { class: 'muted small', text: t('docs.suche.treffer').replace('{n}', String(alle.length)) + (schwach ? ' · ' + t('docs.suche.bedeutungSchwach') : '') }));
  ziel.appendChild(el('ul', { class: 'suche-liste' }, alle.map((x) => el('li', { 'data-treffer': x.id, 'data-art': x.art, 'data-typ': x.typ }, [
    el('span', { class: 'suche-typ', text: t('docs.suche.art.' + x.typ) + (x.art === 'bedeutung' ? ' · 🧠 ' + Math.round(x.naehe * 100) + ' %' : '') }),
    el('button', { class: 'btn btn-sm', type: 'button', text: x.name || '—', onClick: () => {
      const zeile = document.querySelector(`[data-beleg-id="${x.id}"]`);
      if (zeile) { const tr = zeile.closest('tr'); if (tr.hidden) for (const z of document.querySelectorAll(`[data-anhang-von="${tr.dataset.anhangVon}"]`)) z.hidden = false; tr.scrollIntoView({ block: 'center' }); tr.classList.add('suche-markiert'); }
      else if (x.typ === 'buchung') navigate('journal'); else if (x.typ === 'kunde') navigate('customers'); else if (x.typ === 'auftrag') navigate('orders');
    } }),
    el('span', { class: 'muted small suche-stelle', text: x.stelle || '' }),
  ]))));
}

function belegSuche(belege) {
  const s = getSettings();
  const input = el('input', { type: 'search', class: 'beleg-text', placeholder: t('docs.suche.platzhalter'), value: _frage, 'data-mikro-key': 'belegsuche', 'data-belegsuche': '', 'aria-label': t('docs.suche.titel') });
  const ziel = el('div', { class: 'suche-treffer', 'data-suche-treffer': '' });
  let warte = null;
  const los = () => { _frage = input.value; clearTimeout(warte); warte = setTimeout(() => sucheAusfuehren(_frage, belege, ziel).catch(() => {}), 250); };
  input.addEventListener('input', los);
  input.addEventListener('change', los);
  const an = s.bedeutungssuche === 'an';
  const zustand = el('span', { class: 'muted small', 'data-bedeutung-zustand': _bedeutungZustand.stand, text: an ? _bedeutungZustand.text : '' });
  // Schalter direkt am Suchfeld (Leitfaden § 1.5: Suche + Bedeutung nebeneinander), flach, role=switch.
  const schalter = el('button', { class: 'schalter-knopf', type: 'button', role: 'switch', 'aria-checked': an ? 'true' : 'false', 'data-bedeutung-schalter': an ? 'an' : 'aus',
    title: (an ? t('docs.suche.bedeutungAus') : t('docs.suche.bedeutungAn')).replace(/^\S+\s/u, ''), 'data-kein-strich': '', onClick: async () => {
    if (!an) {
      if (!confirm(t('docs.suche.bedeutungFrage'))) return;
      _einordnenFrei = true;   // Einschalten ist der Tipp: einordnen darf gleich beginnen
      await updateSettings({ bedeutungssuche: 'an' }, { still: true });
      await repaint();
    } else { _ordnetLauf++; await updateSettings({ bedeutungssuche: 'aus' }, { still: true }); zustandSetzen('aus', ''); await repaint(); }
  } }, [icon('blp-bedeutung'), el('span', { class: 'schalter-name', text: t('docs.suche.bedeutung') }), el('span', { class: 'schalter-bahn', 'aria-hidden': 'true' }, [el('span', { class: 'schalter-punkt' })])]);
  const weit = el('label', { class: 'small' }, [el('input', { type: 'checkbox', 'data-suche-weit': '' }), ' ' + t('docs.suche.weit')]);
  // A3 (Klaus: „wenn mit KI, dann mit Anonymisierung"): Frage an die gefundenen Belege, nur mit Mistral-Schlüssel.
  const frageZiel = el('div', { class: 'frage-ziel', 'data-frage-ziel': '' });   // bleibt stehen, wenn die Treffer neu gezeichnet werden
  const frageKnopf = el('button', { class: 'btn btn-sm', type: 'button', 'data-frage-belege': '', hidden: true, text: t('docs.frage.knopf'), onClick: () => frageAnBelege(input.value, frageZiel).catch((e) => alert(String((e && e.message) || e))) });
  isMistralConfigured().then((ja) => { if (ja) frageKnopf.hidden = false; }).catch(() => {});
  const cb = weit.querySelector('input'); cb.checked = s.belegsucheWeit !== false;
  cb.addEventListener('change', async () => { await updateSettings({ belegsucheWeit: cb.checked }, { still: true }); los(); });
  if (_frage) setTimeout(los, 0);
  return el('div', { class: 'card suche-karte', 'data-belegsuche-karte': '' }, [
    el('h2', { class: 'small', text: t('docs.suche.titel') }),
    el('div', { class: 'suche-kopf' }, [el('div', { class: 'suche-feld' }, [input]), schalter]),   // Mikrofon-Leiste hängt in .suche-feld
    el('div', { class: 'suche-zeile' }, [zustand, el('span', { 'data-einordnen-platz': '' }), weit, frageKnopf]),
    frageZiel,
    el('p', { class: 'muted small', text: t('docs.suche.hinweis') }),
    ziel,
  ]);
}

// ───────────── A3: Frage an die Belege (Mistral EU) — nur pseudonymisiert, mit Vorschau und Halt ─────────────
// Klaus (2026-10-26): „wenn mit KI, dann mit Anonymisierung". Weg: die besten Treffer der Suche (höchstens 5 Belege mit
// Text) → jeder Text pseudonymisiert (Stammdaten-Anker, Muster, „Weitere Namen") → Prüfung auf Anweisungen an eine KI
// (kiTextFreigabe, Halt) → Vorschau „Das sieht die KI" mit Senden/Abbrechen → Mistral → Antwort, Platzhalter wieder
// aufgelöst (nur auf dem Gerät), Verweise [n] als Sprung zum Beleg. Ohne Schlüssel gibt es den Knopf nicht.
async function frageAnBelege(frage, ziel) {
  const f = String(frage || '').trim();
  if (!f) { alert(t('docs.frage.leer')); return; }
  const kand = belegeFuerFrage(_letzteTreffer);
  if (!kand.length) { alert(t('docs.frage.keineBelege')); return; }
  const alle = await listBelege();
  const belege = [];
  const karten = [];
  let nr = 0;
  for (const k of kand) {
    const b = alle.find((x) => x.id === k.id);
    if (!b) continue;
    const text = await textVon(b);
    if (!text) continue;
    nr++;
    const anker = await kiAnker(text);
    const { text: pseudo, map } = (anker && anker.length) ? tokenize(text, anker, { wortgrenze: true }) : { text, map: [] };
    belege.push({ nummer: nr, id: b.id, name: b.name, text: pseudo, map });
  }
  if (!belege.length) { alert(t('docs.frage.keineBelege')); return; }
  // Halt bei Anweisungen an eine KI — über alle Texte zusammen (einmal anhalten, wie bei der Kontierung).
  const frei = await kiTextFreigabe(belege.map((b) => b.text).join('\n\n'));
  if (frei.nurLokal) { alert(frei.hinweis || t('docs.frage.nurLokal')); return; }
  const gesamt = belege.map((b) => b.text).join('\n\n');
  if (frei.kiText !== gesamt) {
    // Der Halt nimmt ganze Zeilen heraus (ohneZeilen): dieselben Zeilen je Beleg entfernen, Reihenfolge und Rest unverändert.
    const bleibt = new Set(frei.kiText.split('\n').map((z) => z.trim()));
    const weg = gesamt.split('\n').map((z) => z.trim()).filter((z) => z && !bleibt.has(z));
    for (const b of belege) b.text = ohneZeilen(b.text, weg);
  }
  // Vorschau je Beleg — mit dem Text, der wirklich hinausginge (nach Pseudonymisierung UND Halt).
  for (const b of belege) karten.push(el('details', { class: 'hinweis pseudonym-info', open: b.nummer === 1 ? '' : null }, [
    el('summary', { class: 'small', text: `[${b.nummer}] ${b.name} · ${t('pseudonym.badge').replace('{n}', String(b.map.length))}` }),
    el('pre', { class: 'mono small pseudonym-preview', text: b.text.slice(0, FRAGE_TEXT_MAX) + (b.text.length > FRAGE_TEXT_MAX ? ' …' : '') }),
  ]));
  const antwortSlot = el('div', { class: 'frage-antwort', 'data-frage-antwort': '' });
  const vorschau = el('div', { class: 'card frage-vorschau', 'data-frage-vorschau': '' }, [
    el('h3', { class: 'small', text: t('docs.frage.vorschauTitel') }),
    el('p', { class: 'muted small', text: t('docs.frage.vorschauText').replace('{n}', String(belege.length)) }),
    el('p', { class: 'mono small', text: t('docs.frage.frage') + ' ' + f }),
    ...karten,
    el('div', { class: 'suche-zeile' }, [
      el('button', { class: 'btn btn-primary btn-sm', type: 'button', 'data-frage-senden': '', text: t('docs.frage.senden'), onClick: async () => {
        vorschau.querySelectorAll('button').forEach((x) => x.setAttribute('disabled', ''));
        antwortSlot.replaceChildren(el('p', { class: 'muted small', text: t('docs.frage.wartet') }));
        try {
          const nachrichten = frageNachrichten(f, belege);
          if (typeof window !== 'undefined') window.__blpFrage = { belege: belege.map((b) => ({ nummer: b.nummer, id: b.id, verdeckt: b.map.length })), gesendet: nachrichten[1].content };
          const roh = await chat(nachrichten, { maxTokens: 500 });
          const map = belege.flatMap((b) => b.map);
          const klar = reidentify(roh, map);
          antwortSlot.replaceChildren(
            el('h3', { class: 'small', text: t('docs.frage.antwortTitel') }),
            el('p', { 'data-frage-text': '' }, antwortTeile(klar, belege).map((x) => x.verweis
              ? el('button', { class: 'btn btn-sm', type: 'button', 'data-frage-verweis': String(x.verweis), text: `[${x.verweis}] ${x.name}`, onClick: () => { const z = document.querySelector(`[data-beleg-id="${x.id}"]`); if (z) { z.closest('tr').scrollIntoView({ block: 'center' }); z.closest('tr').classList.add('suche-markiert'); } } })
              : el('span', { text: x.text }))),
            el('p', { class: 'muted small', text: t('docs.frage.antwortHinweis') }),
          );
        } catch (e) { antwortSlot.replaceChildren(el('p', { class: 'hinweis small', text: t('docs.frage.fehler').replace('{e}', String((e && e.message) || e)) })); }
        finally { vorschau.querySelectorAll('button').forEach((x) => x.removeAttribute('disabled')); }
      } }),
      el('button', { class: 'btn btn-sm', type: 'button', 'data-frage-abbrechen': '', text: t('common.cancel'), onClick: () => { vorschau.remove(); antwortSlot.remove(); } }),
    ]),
    antwortSlot,
  ]);
  ziel.replaceChildren(vorschau);
}

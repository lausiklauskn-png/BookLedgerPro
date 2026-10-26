// src/ui/views/angebote.js
// BAUPLAN Block 2 / Schritt 11b — Angebots-Ansicht mit adaptivem Baukasten.
// Grundlage: docs/KALKULATION_KATALOG.md §3 (UX — adaptiver Positions-Baukasten) +
// §4 (Nummernkreise/Status) + §5.2 (Live-Deckungsbeitrag).
//
// WAS DAS IST: die UI ÜBER der bereits fertigen, node-getesteten reinen Logik —
//   - domain/baukasten.js  (#132): Nutzungszähler + adaptive Palette + Umsortieren
//   - domain/angebote.js   (#128): Status-Flow, Nummernkreis, Aggregation, Whitelist
//   - domain/produktschemata.js (#127): kalibrierbare Leistungs-Schemata
//   - domain/angebote-store.js  (11b): verschlüsselte Persistenz (encstore)
//
// PRIME DIRECTIVE (Katalog §0): Die KALKULATION (Selbstkosten/Marge/Deckungsbeitrag)
// wird nur INTERN angezeigt („intern — nicht im Angebot") und je Position verschlüsselt
// mitgespeichert. Das ANGEBOTSDOKUMENT (Ansicht/Druck) baut ausschließlich über
// externesAngebot(angebot) (Whitelist) — Marge/Verschnitt/Maschinensatz sehen Kunden nie.
//
// EHRLICHE GRENZE: DOM/IndexedDB → in der Build-Umgebung NICHT headless getestet
// (statisch geprüft, kein Headless-Browser). Die reine Logik darunter ist node-getestet.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro, formatCents, parseEuroToCents } from '../../domain/money.js';
import { UST_SAETZE } from '../../domain/taxes.js';
import { PRODUKT_SCHEMATA, schemaNach, FELD_TYP } from '../../domain/produktschemata.js';
import {
  ANGEBOT_STATUS, ANGEBOT_STATUS_FLOW, neuesAngebot, positionAusSchema, angebotSummen,
  externesAngebot, interneAuswertung, validateAngebot, istArchiviert,
} from '../../domain/angebote.js';
import {
  baukastenPalette, haeufigsteSchemata, zaehleNutzung, normalizeNutzung,
  verschiebePosition, verschiebeNachOben, verschiebeNachUnten,
} from '../../domain/baukasten.js';
import { listAngebote, saveAngebot, getAngebot, deleteAngebot, setzeAngebotStatusStore, rechnungAusAngebot, setzeAngebotVerweise } from '../../domain/angebote-store.js';
import { vorgangAuftrag, vorgangUrl, zielKey, WORKFLOH_ZIELE, vorgangStand, zielAusVerweisen } from '../../domain/vorgang.js';
import { getBuchung } from '../../domain/store.js';
import { BUCHUNG_STATUS } from '../../domain/journal.js';
import { angebotPdfBauen, arbeitsstandBauen } from '../../domain/workflowPdfRundlauf.js';
import { pdfLibLaden } from '../../core/scanPdf.js';
import { pdfVorschaubild } from '../../ai/kiVorbereitung.js';
import { ladeKalibrierungFaktoren } from '../../domain/nachkalkulation-store.js';
import { darfAngebotUebernehmen } from '../../domain/angebotUebernahme.js';
import { listKunden, listKostenstellen, ensureKostenstellenSeeded, saveKunde } from '../../domain/crm-store.js';
import { getSettings, updateSettings } from '../../state.js';
import { consumeUebernahme, merkeUebernahme, consumeUebernahmeFehler } from '../../domain/uebernahmeExtern.js';
import { emptyState } from '../empty.js';

let _host = null;
let _kunden = [];
let _kostenstellen = [];
let _entwurf = null;           // in Arbeit befindliches Angebot (Positionen tragen interne `kalkulation`)
let _editId = null;            // id des bearbeiteten gespeicherten Angebots (null = Neuanlage)
let _openSchemaId = null;      // welche Baukasten-Karte ihr Eingabe-Formular geöffnet hat
let _dragFrom = null;          // Quell-Index beim Drag-and-drop der Positionsliste
let _kalibrierung = null;      // { faktorWerte, anzahlVergleiche } aus der Historie (oder null)
let _uebernahmeHinweis = null; // Banner-Basiszeile nach Übergabe aus WorkFloh (einmalig)
let _letzteUebernahme = null;  // D22: die zuletzt angekommene Übergabe (für „stattdessen neuer Entwurf")
let _angehaengt = 0;           // D22: wie viele Positionen an den offenen Entwurf angehängt wurden (0 = neuer Entwurf)
let _uebernahmeModus = null;   // 'angebot' | 'rechnung' — steuert nur den Hinweis, keinen GoBD-Pfad
let _uebernahmeKundeName = ''; // übergebener Kundenname (für Zuordnung / „anlegen")
let _uebernahmeKundeOffen = false;   // Kunde fehlt noch in BLP → „anlegen"-Knopf zeigen
let _uebernahmeKundeGesetzt = false; // Kunde per Name automatisch zugeordnet
let _rueckverweis = null;      // R2: { angebotId, nummer, wfAuftragNr, status } — Rechnung gehört zu einem vorhandenen Angebot
// Interne Zuschläge (Gemeinkosten/Gewinn) — gelten beim Hinzufügen einer Position. Reine
// INTERN-Größen (Prime Directive): sie steuern die Kalkulation, stehen NIE im Angebot.
let _zuschlaege = { gemeinkostenProzent: 15, gewinnProzent: 20 };

export async function mountAngebote(host) {
  _host = host;
  await ensureKostenstellenSeeded();
  // _entwurf über Re-Mounts hinweg behalten (updateSettings → Shell-paint → mountAngebote):
  // sonst ginge das in Arbeit befindliche Angebot beim Persistieren des Nutzungsprofils verloren.
  if (!_entwurf) _entwurf = neuesAngebot();
  // Übergabe aus WorkFloh (docs/UEBERNAHME_TOMY.md): Formular vorbefüllen, mehr nicht.
  // Fremde Art (z.B. Shop-Buchhaltungs-Summen) gehört nicht hierher → zurücklegen.
  let ext = consumeUebernahme();
  if (ext && ext.art && ext.art !== 'angebot') { merkeUebernahme(ext); ext = null; }
  // R2 (Rundlauf, Klaus 2026-10-26): trägt die Übergabe einen Verweis auf ein BLP-Angebot, das es hier gibt,
  // wird KEIN neuer Entwurf angelegt — die Rechnung entsteht aus genau diesem Angebot („Rechnung aus Angebot").
  // Der WorkFloh-Auftrag wird am Angebot vermerkt (reine Stammdaten, kein Statuswechsel, keine Nummer).
  if (ext && ext.verweise && (ext.verweise.blpAngebotNr || ext.verweise.blpAngebotId)) {
    const alle = await listAngebote();
    const treffer = alle.find((a) => (ext.verweise.blpAngebotId && a.id === ext.verweise.blpAngebotId)
      || (ext.verweise.blpAngebotNr && a.nummer === ext.verweise.blpAngebotNr)) || null;
    if (treffer) {
      const wfAuftragNr = ext.auftragNr || ext.verweise.wfAuftragNr || '';
      try { await setzeAngebotVerweise(treffer.id, { wfAuftragNr, wfQuelle: ext.quelle, wfRueckAm: new Date().toISOString() }); }
      catch { /* Vermerk ist Beiwerk — die Führung unten steht trotzdem */ }
      _rueckverweis = { angebotId: treffer.id, nummer: treffer.nummer || '', wfAuftragNr, status: treffer.status };
      _uebernahmeHinweis = t('angebote.rueckverweis').replace('%NR%', wfAuftragNr || '—').replace('%ANGEBOT%', treffer.nummer || '—');
      _uebernahmeModus = null;
      _uebernahmeKundeName = ''; _uebernahmeKundeOffen = false; _uebernahmeKundeGesetzt = false;
      ext = null;
    }
  }
  if (ext) {
    // D22 (Klaus 2026-10-26: „anhängen wäre besser"): kommt eine zweite Übergabe, während ein ungespeicherter Entwurf
    // mit Positionen offen ist (z. B. Needs-Software nach Calculate-Hardware), werden die Positionen ANGEHÄNGT statt den
    // Entwurf zu ersetzen. Der Banner sagt es und bietet „stattdessen neuer Entwurf" an. Ein Angebot in Bearbeitung
    // (_editId) wird nie angefasst — dort entsteht wie bisher ein neuer Entwurf.
    const offen = !_editId && _entwurf && Array.isArray(_entwurf.positionen) && _entwurf.positionen.length > 0;
    _letzteUebernahme = ext;
    if (offen) {
      _entwurf.positionen = [..._entwurf.positionen, ...(ext.positionen || [])];
      if (!_entwurf.titel) _entwurf.titel = ext.titel || '';
      _angehaengt = (ext.positionen || []).length;
    } else {
      _entwurf = neuesAngebot({ titel: ext.titel, positionen: ext.positionen });
      _angehaengt = 0;
    }
    _editId = null; _openSchemaId = null;
    _uebernahmeModus = ext.modus || 'angebot';
    _uebernahmeKundeName = ext.kundeName || '';
    _uebernahmeHinweis = (offen ? t('angebote.uebernahmeAngehaengt').replace('%N%', String(_angehaengt)) : t('angebote.uebernahme'))
      .replace('%TITEL%', ext.titel || '—')
      .replace('%NR%', ext.auftragNr || ext.angebotsNr || '—');
    // Kunde per Name einem vorhandenen Stammkunden zuordnen (GoBD-neutral, reine Stammdaten);
    // fehlt er, wird er im Banner zum Anlegen angeboten.
    _kunden = await listKunden();
    const treffer = findeKundeNachName(_uebernahmeKundeName);
    if (treffer) { _entwurf.kundeId = treffer.id; _uebernahmeKundeGesetzt = true; _uebernahmeKundeOffen = false; }
    else { _uebernahmeKundeGesetzt = false; _uebernahmeKundeOffen = !!_uebernahmeKundeName; }
  } else if (consumeUebernahmeFehler()) {
    // Eine Übergabe kam an, wurde aber nicht verstanden. Es wird NUR gesagt, dass
    // es passiert ist — nie, was drinstand: der Inhalt ist fremde Eingabe aus der
    // Adresse. Kein Entwurf, kein Formular, kein Kunde; die Ansicht bleibt leer
    // wie sonst auch, nur mit einer Zeile darüber.
    _uebernahmeHinweis = t('angebote.uebernahmeUnverstanden');
    _uebernahmeModus = null;
    _uebernahmeKundeName = ''; _uebernahmeKundeOffen = false; _uebernahmeKundeGesetzt = false;
  }
  // Korrekturfaktoren aus der Historie laden (für die kalibrierte Vorwärtskalkulation).
  // Fehler dürfen die Ansicht nie blockieren — dann eben ohne Kalibrierungs-Option.
  try { _kalibrierung = await ladeKalibrierungFaktoren(); }
  catch { _kalibrierung = null; }
  await repaint();
}

// Liegt verwertbare Historie für die kalibrierte Vorwärtskalkulation vor?
function hatKalibrierung() {
  return !!(_kalibrierung && _kalibrierung.anzahlVergleiche > 0);
}
// Soll beim Anlegen einer Position kalibriert werden? (Setting + Historie nötig.)
function kalibrierungAktiv() {
  return hatKalibrierung() && !!getSettings().kalibrierungAnwenden;
}

// Nutzungsprofil (adaptive Sortierung) — gerätelokal in den (verschlüsselten) Settings.
function nutzungsprofil() {
  return normalizeNutzung(getSettings().baukastenNutzungsprofil);
}

async function repaint(banner) {
  [_kunden, _kostenstellen] = await Promise.all([listKunden(), listKostenstellen()]);
  const angebote = await listAngebote();
  angebote.sort((a, b) => String(b.nummer || b.createdAt || '').localeCompare(String(a.nummer || a.createdAt || '')));
  const uebernahmeBanner = uebernahmeBannerNode();
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('angebote.title') }),
    el('p', { class: 'muted small', text: t('angebote.intro') }),
    uebernahmeBanner,
    banner || null,
    editorCard(),
    listeCard(angebote.filter((a) => !istArchiviert(a)), t('angebote.activeTitle'), t('angebote.empty')),
    archivCard(angebote.filter(istArchiviert)),
  ]));
}

const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);

// Übergabe-Zustand vollständig zurücksetzen — der Hinweis ist bewusst „einmalig"
// (nach Speichern/Abbrechen/Bearbeiten/Löschen verschwindet er).
function resetUebernahmeHinweis() {
  _uebernahmeHinweis = null; _uebernahmeModus = null; _rueckverweis = null; _letzteUebernahme = null; _angehaengt = 0;
  _uebernahmeKundeName = ''; _uebernahmeKundeOffen = false; _uebernahmeKundeGesetzt = false;
}

// Vorhandenen Stammkunden per Name finden (getrimmt, ohne Groß/Klein-Unterschied).
function findeKundeNachName(name) {
  const ziel = String(name || '').trim().toLowerCase();
  if (!ziel) return null;
  return _kunden.find((k) => (k.name || '').trim().toLowerCase() === ziel) || null;
}

// Banner nach WorkFloh-Übergabe: Basiszeile + Modus-Hinweis (Angebot/Rechnung) +
// Kunden-Zeile (automatisch zugeordnet ODER „Kunde anlegen"). Reine Bedien-Führung —
// speichert nichts, vergibt keine Nummer, rührt keinen GoBD-Pfad an.
function uebernahmeBannerNode() {
  if (!_uebernahmeHinweis) return null;
  const kinder = [el('div', { class: 'banner-text', text: _uebernahmeHinweis })];
  if (_rueckverweis) {
    kinder.push(el('div', { class: 'small', 'data-rueckverweis': _rueckverweis.angebotId,
      text: _rueckverweis.status === ANGEBOT_STATUS.ANGENOMMEN
        ? t('angebote.rueckverweisBereit')
        : t('angebote.rueckverweisStatus').replace('%STATUS%', t('angebote.status.' + _rueckverweis.status)) }));
  }
  if (_angehaengt > 0 && _letzteUebernahme) {
    // D22: Rückweg — die angehängten Positionen wieder heraus, allein als neuer Entwurf.
    kinder.push(el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-sm', type: 'button', text: t('angebote.uebernahmeNeu'), 'data-uebernahme-neu': '',
        onClick: async () => {
          const u = _letzteUebernahme;
          _entwurf = neuesAngebot({ titel: u.titel, positionen: u.positionen });
          _editId = null; _openSchemaId = null; _angehaengt = 0;
          _uebernahmeHinweis = t('angebote.uebernahme').replace('%TITEL%', u.titel || '—').replace('%NR%', u.auftragNr || u.angebotsNr || '—');
          const k = findeKundeNachName(_uebernahmeKundeName);
          if (k) { _entwurf.kundeId = k.id; _uebernahmeKundeGesetzt = true; _uebernahmeKundeOffen = false; }
          await repaint();
        } }),
    ]));
  }
  if (_uebernahmeModus) {
    kinder.push(el('div', { class: 'small', text: t('angebote.uebernahmeModus.' + _uebernahmeModus) }));
  }
  if (_uebernahmeKundeName && _uebernahmeKundeGesetzt) {
    kinder.push(el('div', { class: 'small', text: t('angebote.uebernahmeKundeGesetzt').replace('%KUNDE%', _uebernahmeKundeName) }));
  } else if (_uebernahmeKundeName && _uebernahmeKundeOffen) {
    kinder.push(el('div', { class: 'btn-row' }, [
      el('span', { class: 'small', text: t('angebote.uebernahmeKundeFehlt').replace('%KUNDE%', _uebernahmeKundeName) }),
      el('button', {
        class: 'btn btn-sm', type: 'button',
        text: t('angebote.uebernahmeKundeAnlegen').replace('%KUNDE%', _uebernahmeKundeName),
        onClick: async () => {
          const name = _uebernahmeKundeName;
          try { await saveKunde({ name }); }
          catch (e) { alert(String(e.message || e)); return; }
          _kunden = await listKunden();
          const k = findeKundeNachName(name);
          if (k) { _entwurf.kundeId = k.id; _uebernahmeKundeGesetzt = true; }
          _uebernahmeKundeOffen = false;
          await repaint();
        },
      }),
    ]));
  }
  return el('div', { class: 'banner banner-warn' }, kinder);
}

// ── Editor: Kopf + Baukasten-Palette + Positionsliste + Live-Deckungsbeitrag ──

function editorCard() {
  const a = _entwurf;
  const titel = el('input', { type: 'text', placeholder: t('angebote.titel'), value: a.titel || '' });
  titel.addEventListener('input', () => { a.titel = titel.value; });
  const kunde = el('select', {}, [el('option', { value: '' }, t('angebote.none')),
    ..._kunden.map((k) => el('option', { value: k.id }, k.name))]);
  kunde.value = a.kundeId || '';
  kunde.addEventListener('change', () => { a.kundeId = kunde.value || null; if (kunde.value) _uebernahmeKundeOffen = false; });
  const ks = el('select', {}, [el('option', { value: '' }, t('journal.noKostenstelle')),
    ..._kostenstellen.map((k) => el('option', { value: k.nummer }, `${k.nummer} · ${k.name}`))]);
  ks.value = a.kostenstelle || '';
  ks.addEventListener('change', () => { a.kostenstelle = ks.value || null; });
  const datum = el('input', { type: 'date', value: a.datum || '' });
  datum.addEventListener('input', () => { a.datum = datum.value; });
  const gueltig = el('input', { type: 'date', value: a.gueltigBis || '' });
  gueltig.addEventListener('input', () => { a.gueltigBis = gueltig.value; });

  // Interne Zuschläge (Gemeinkosten/Gewinn) — steuern die Kalkulation neuer Positionen.
  const gemein = el('input', { type: 'number', min: '0', step: '1', value: String(_zuschlaege.gemeinkostenProzent), style: 'width:6rem' });
  gemein.addEventListener('input', () => { _zuschlaege.gemeinkostenProzent = Number(gemein.value) || 0; });
  const gewinn = el('input', { type: 'number', min: '0', step: '1', value: String(_zuschlaege.gewinnProzent), style: 'width:6rem' });
  gewinn.addEventListener('input', () => { _zuschlaege.gewinnProzent = Number(gewinn.value) || 0; });

  const err = el('p', { class: 'form-error' });
  const submitBtns = [el('button', {
    class: 'btn btn-primary', type: 'button', text: _editId ? t('common.save') : t('angebote.create'),
    onClick: async () => {
      err.textContent = '';
      const fehler = validateAngebot(_entwurf);
      if (fehler.length) { err.textContent = fehler.join(' '); return; }
      try { await saveAngebot(_entwurf); }
      catch (e) { err.textContent = String(e.message || e); return; }
      const war = _editId;
      _entwurf = neuesAngebot(); _editId = null; _openSchemaId = null;
      resetUebernahmeHinweis();
      await repaint(el('div', { class: 'banner banner-warn', text: war ? t('angebote.saved') : t('angebote.created') }));
    },
  })];
  if (_editId || (_entwurf.positionen && _entwurf.positionen.length)) {
    submitBtns.push(el('button', {
      class: 'btn', type: 'button', text: t('common.cancel'),
      onClick: async () => { _entwurf = neuesAngebot(); _editId = null; _openSchemaId = null; resetUebernahmeHinweis(); await repaint(); },
    }));
  }

  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: _editId ? t('angebote.edit') : t('angebote.new') }),
    el('div', { class: 'form-grid' }, [
      field(t('angebote.titel'), titel), field(t('angebote.customer'), kunde),
      field(t('angebote.kostenstelle'), ks), field(t('angebote.datum'), datum),
      field(t('angebote.gueltigBis'), gueltig),
    ]),
    el('div', { class: 'form-grid' }, [
      field(t('angebote.gemeinkosten'), gemein), field(t('angebote.gewinn'), gewinn),
    ]),
    el('p', { class: 'muted small', text: t('angebote.zuschlaegeHint') }),

    kalibrierungUmschalter(),

    el('h3', { class: 'card-subtitle', text: t('angebote.baukasten') }),
    el('p', { class: 'muted small', text: t('angebote.baukastenHint') }),
    palette(),
    schemaFormSlot(),

    el('h3', { class: 'card-subtitle', text: t('angebote.positionen') }),
    positionsListe(),

    deckungsbeitragPanel(),
    err,
    el('div', { class: 'btn-row' }, submitBtns),
  ]);
}

// Kalibrierte Vorwärtskalkulation (Katalog §5.1): die Korrekturfaktoren aus der eigenen
// Historie (Vor→Nachkalkulation) auf die interne Kalkulation neuer Positionen anwenden.
// Nur sichtbar, wenn überhaupt verwertbare Historie vorliegt (sonst kein sinnvoller Schalter).
// Rein INTERN (Prime Directive): wirkt nur auf Selbstkosten/Deckungsbeitrag, nie aufs Dokument.
function kalibrierungUmschalter() {
  if (!hatKalibrierung()) return null;
  const an = !!getSettings().kalibrierungAnwenden;
  const box = el('input', { type: 'checkbox' });
  box.checked = an;
  box.addEventListener('change', async () => {
    await updateSettings({ kalibrierungAnwenden: box.checked });
    await repaint();
  });
  const label = t('angebote.kalibrierung').replace('{n}', String(_kalibrierung.anzahlVergleiche));
  return el('div', {}, [
    el('label', { class: 'inline-field' }, [box, el('span', { text: label })]),
    el('p', { class: 'muted small', text: t('angebote.kalibrierungHint') }),
  ]);
}

// Adaptive Palette: Karten je Leistungsart, häufig/zuletzt genutzte zuerst (baukastenPalette).
// Optional eine Schnellzugriffs-Zeile „häufig genutzt" (haeufigsteSchemata) darüber.
function palette() {
  const profil = nutzungsprofil();
  const haeufig = haeufigsteSchemata(PRODUKT_SCHEMATA, profil, 3);
  const eintraege = baukastenPalette(PRODUKT_SCHEMATA, profil);

  const karte = (schema, anzahl) => el('button', {
    class: 'baukasten-karte' + (_openSchemaId === schema.id ? ' active' : ''),
    type: 'button',
    onClick: () => { _openSchemaId = _openSchemaId === schema.id ? null : schema.id; repaint(); },
  }, [
    el('span', { class: 'bk-label', text: schema.label }),
    anzahl > 0 ? el('span', { class: 'bk-zaehler', title: t('angebote.usedTimes'), text: '×' + anzahl }) : null,
  ]);

  const teile = [];
  if (haeufig.length) {
    teile.push(el('div', { class: 'muted small', text: t('angebote.haeufig') }));
    teile.push(el('div', { class: 'baukasten-palette' }, haeufig.map((s) => karte(s, 0))));
  }
  teile.push(el('div', { class: 'baukasten-palette' }, eintraege.map((e) => karte(e.schema, e.anzahl))));
  return el('div', { class: 'baukasten' }, teile);
}

// Eingabe-Formular der geöffneten Karte: die Schema-Felder + Menge + USt → positionAusSchema.
function schemaFormSlot() {
  if (!_openSchemaId) return null;
  const schema = schemaNach(_openSchemaId);
  if (!schema) return null;

  const reads = [];
  const felderNodes = schema.felder.map((f) => {
    const { node, read } = feldInput(f);
    reads.push([f.key, read]);
    return field(f.label, node);
  });

  const menge = el('input', { type: 'text', value: '1', style: 'width:6rem' });
  const beschreibung = el('input', { type: 'text', placeholder: schema.label, value: '' });
  const ust = el('select', {}, UST_SAETZE.map((s) => el('option', { value: String(s) }, `${s} %`)));
  ust.value = '19';

  const hinzufuegen = el('button', {
    class: 'btn btn-primary', type: 'button', text: t('angebote.addPosition'),
    onClick: async () => {
      const werte = {};
      for (const [key, read] of reads) werte[key] = read();
      const pos = positionAusSchema(schema, {
        werte,
        zuschlaege: { ..._zuschlaege, ustProzent: Number(ust.value) || 0 },
        beschreibung: beschreibung.value.trim() || schema.label,
        menge: Number(String(menge.value).replace(',', '.')) || 1,
        // Kalibrierte Vorwärtskalkulation, wenn der Nutzer sie aktiviert hat und Historie vorliegt.
        ...(kalibrierungAktiv() ? { faktoren: _kalibrierung.faktorWerte } : {}),
      });
      _entwurf.positionen = [...(_entwurf.positionen || []), pos];
      _openSchemaId = null;
      // Nutzung zählen → adaptive Sortierung lernt mit. Persistiert gerätelokal (Settings).
      const profil = zaehleNutzung(nutzungsprofil(), schema.id);
      await updateSettings({ baukastenNutzungsprofil: profil });
      await repaint();
    },
  });
  const abbrechen = el('button', { class: 'btn', type: 'button', text: t('common.cancel'),
    onClick: () => { _openSchemaId = null; repaint(); } });

  return el('div', { class: 'card schema-form' }, [
    el('div', { class: 'card-title-row' }, [
      el('h4', { class: 'card-subtitle', text: schema.label }),
      el('span', { class: 'badge badge-entwurf', text: t('angebote.hotspot') + ': ' + schema.hotspot }),
    ]),
    el('div', { class: 'form-grid' }, [
      field(t('angebote.posBeschreibung'), beschreibung), field(t('angebote.menge'), menge),
      field(t('angebote.vat'), ust), ...felderNodes,
    ]),
    el('div', { class: 'btn-row' }, [hinzufuegen, abbrechen]),
  ]);
}

// Eingabefeld je Schema-Feldtyp. Geld als Euro (Cent-genau intern), sonst Dezimalzahl.
function feldInput(f) {
  if (f.typ === FELD_TYP.GELD) {
    const node = el('input', { type: 'text', placeholder: '0,00', value: f.default ? formatCents(f.default) : '' });
    return { node, read: () => parseEuroToCents(node.value) || 0 };
  }
  const node = el('input', { type: 'text', value: f.default != null ? String(f.default) : '0' });
  return { node, read: () => Number(String(node.value).replace(',', '.')) || 0 };
}

// Positionsliste mit Drag-and-drop (HTML5) + Pfeil-Knöpfen (↑/↓, DeX/Touch-tauglich, additiv).
function positionsListe() {
  const positionen = _entwurf.positionen || [];
  if (!positionen.length) return el('p', { class: 'muted small', text: t('angebote.noPositions') });

  const reorder = async (next) => { _entwurf.positionen = next; await repaint(); };

  const rows = positionen.map((p, i) => {
    const netto = (Number(p.einzelpreisCent) || 0) * (Number(p.menge) || 0);
    const row = el('div', {
      class: 'pos-row angebot-pos', draggable: 'true',
      'data-idx': String(i),
    }, [
      el('span', { class: 'drag-griff', title: t('angebote.dragHint'), text: '⠿' }),
      el('span', { class: 'pos-desc' }, [
        el('span', { text: p.beschreibung || '—' }),
        p.kalkulation && p.kalkulation.kalibriert
          ? el('span', { class: 'badge badge-entwurf', title: t('angebote.kalibrierungHint'), text: t('angebote.kalibriert') })
          : null,
      ]),
      el('span', { class: 'muted small', text: `${p.menge} × ${formatEuro(p.einzelpreisCent)}` }),
      el('span', { class: 'num', text: formatEuro(netto) }),
      el('span', { class: 'muted small', text: `${p.ustSatz} %` }),
      el('span', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-sm', type: 'button', text: '↑', title: t('angebote.moveUp'), disabled: i === 0 ? true : null,
          onClick: () => reorder(verschiebeNachOben(positionen, i)) }),
        el('button', { class: 'btn btn-sm', type: 'button', text: '↓', title: t('angebote.moveDown'), disabled: i === positionen.length - 1 ? true : null,
          onClick: () => reorder(verschiebeNachUnten(positionen, i)) }),
        el('button', { class: 'btn btn-sm btn-danger', type: 'button', text: '✕', title: t('angebote.removePos'),
          onClick: () => reorder(positionen.filter((_, j) => j !== i)) }),
      ]),
    ]);
    row.addEventListener('dragstart', () => { _dragFrom = i; row.classList.add('dragging'); });
    row.addEventListener('dragend', () => { _dragFrom = null; row.classList.remove('dragging'); });
    row.addEventListener('dragover', (e) => { e.preventDefault(); });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      if (_dragFrom == null || _dragFrom === i) return;
      reorder(verschiebePosition(positionen, _dragFrom, i));
    });
    return row;
  });

  return el('div', { class: 'pos-box angebot-pos-liste' }, rows);
}

// Live-Deckungsbeitrag (Katalog §5.2) — rein INTERN (Prime Directive), je Position aus der
// gespeicherten Kalkulation summiert. Daneben die neutralen Angebotssummen (netto/USt/brutto).
function deckungsbeitragPanel() {
  const summen = angebotSummen(_entwurf.positionen);
  const intern = interneAuswertung(_entwurf);
  const dbProzent = intern.netto > 0 ? Math.round((intern.deckungsbeitrag / intern.netto) * 100) : 0;
  const line = (label, wert, cls) => el('div', { class: 'report-line' + (cls ? ' ' + cls : '') }, [
    el('span', { text: label }), el('span', { class: 'num', text: wert })]);
  return el('div', { class: 'angebot-summen' }, [
    el('div', { class: 'card no-pad angebot-extern' }, [
      el('div', { class: 'rech-summen' }, [
        line(t('angebote.net'), formatEuro(summen.netto)),
        line(t('angebote.vatSum'), formatEuro(summen.ust)),
        line(t('angebote.gross'), formatEuro(summen.brutto), 'strong'),
      ]),
    ]),
    el('div', { class: 'card no-pad angebot-intern' }, [
      el('div', { class: 'card-title-row' }, [
        el('h4', { class: 'card-subtitle', text: t('angebote.internTitle') }),
        el('span', { class: 'badge badge-entwurf', text: t('angebote.internBadge') }),
      ]),
      el('div', { class: 'rech-summen' }, [
        line(t('angebote.selbstkosten'), formatEuro(intern.selbstkosten)),
        line(t('angebote.deckungsbeitrag'), `${formatEuro(intern.deckungsbeitrag)} (${dbProzent} %)`, 'strong'),
      ]),
      el('p', { class: 'muted small', text: t('angebote.internHint') }),
    ]),
  ]);
}

// ── Gespeicherte Angebote (aktiv + Archiv) ───────────────────────────────────

function statusBadge(status) {
  const ok = status === ANGEBOT_STATUS.ANGENOMMEN;
  return el('span', { class: 'badge ' + (ok ? 'badge-ok' : 'badge-entwurf'), text: t('angebote.status.' + status) });
}

function listeCard(angebote, titel, leer) {
  if (!angebote.length) return emptyState('empty-orders.png', leer);
  return el('div', { class: 'card no-pad' }, [
    el('h2', { class: 'card-title pad', text: titel }),
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: t('angebote.nummer') }), el('th', { text: t('angebote.titel') }),
        el('th', { class: 'num', text: t('angebote.gross') }), el('th', { text: t('angebote.status') }), el('th', {}),
      ])),
      el('tbody', {}, angebote.map((a) => zeile(a))),
    ]),
  ]);
}

function archivCard(angebote) {
  if (!angebote.length) return null;
  return listeCard(angebote, t('angebote.archivTitle'), '');
}

// Kleine Zeile unter dem Kunden: wohin das Angebot ging bzw. welcher WorkFloh-Auftrag zurückkam.
function wfVerweisNode(a) {
  const v = a.verweise || null;
  if (!v) return null;
  const teile = [];
  // Rundlauf Workflow PDF (Klaus 2026-10-26): hin = Arbeitsstand übergeben, zurück = unterschriebenes PDF als Beleg am Angebot
  if (v.wfpdfBelegId) teile.push(el('div', { class: 'muted small', 'data-wfpdf-verweis': 'zurueck', text: t('angebote.wfpdfZurueck').replace('%BELEG%', v.wfpdfBelegName || '') }));
  else if (v.wfpdfUebergabeAm) teile.push(el('div', { class: 'muted small', 'data-wfpdf-verweis': 'uebergeben', text: t('angebote.wfpdfUebergeben') }));
  const wf = wfVerweisWorkfloh(v);
  if (wf) teile.push(wf);
  return teile.length ? el('div', {}, teile) : null;
}
function wfVerweisWorkfloh(v) {
  if (v.wfAuftragNr) {
    const zeilen = [el('div', { class: 'muted small', 'data-wf-verweis': 'auftrag', text: t('angebote.wfVerweis').replace('%NR%', v.wfAuftragNr) })];
    // R3: was zuletzt an den WorkFloh gemeldet wurde (Rechnung festgeschrieben / bezahlt).
    if (v.wfStand === 'bezahlt') zeilen.push(el('div', { class: 'muted small', 'data-wf-stand-gemeldet': 'bezahlt', text: t('angebote.wfStandBezahlt').replace('%DATUM%', datumKurz(v.wfBezahltAm)) }));
    else if (v.wfStand === 'rechnung') zeilen.push(el('div', { class: 'muted small', 'data-wf-stand-gemeldet': 'rechnung', text: t('angebote.wfStandRechnung').replace('%NR%', v.rechnungNr || '—') }));
    return zeilen.length === 1 ? zeilen[0] : el('div', {}, zeilen);
  }
  if (v.wfZiel) {
    const ziel = WORKFLOH_ZIELE[v.wfZiel];
    return el('div', { class: 'muted small', 'data-wf-verweis': 'uebergeben', text: t('angebote.wfUebergeben').replace('%ZIEL%', ziel ? ziel.name : v.wfZiel) });
  }
  return null;
}

// Workflow PDF, Hinweg (Klaus 2026-10-26: „beides — PDF teilen und Daten teilen"): das Angebot als echtes PDF (pdf-lib,
// nur die Whitelist) UND als Arbeitsstand-Datei von Workflow PDF mit den Feldern Unterschrift · Ort/Datum · Haken
// „angenommen". Android: Teilen-Liste (Workflow PDF nimmt .json); sonst Download + Hinweis. Am Angebot wird nur der
// Zeitpunkt vermerkt; der Status bleibt von Hand. Probe-Haken: window.__blpTeilenAbfangen hält Teilen/Download an,
// window.__blpWfpdf trägt Datei und Zahlen.
async function anWorkflowPdf(a) {
  try {
    const voll = await getAngebot(a.id);
    if (!voll) throw new Error('Angebot nicht gefunden');
    const kunde = _kunden.find((k) => k.id === voll.kundeId) || {};
    const firma = (getSettings() || {}).firma || {};
    const doc = { ...externesAngebot(voll), id: voll.id };
    const PDFLib = await pdfLibLaden();
    const texte = { titel: t('angebote.docTitle'), datum: t('angebote.datum'), gueltig: t('angebote.gueltigBis'), pos: t('angebote.pdfPos'), menge: t('angebote.pdfMenge'), einzel: t('angebote.pdfEinzel'),
      ust: 'USt', netto: t('angebote.net'), summeNetto: t('angebote.net'), summeBrutto: t('angebote.gross'), ortDatum: t('angebote.pdfOrtDatum'), unterschrift: t('angebote.pdfUnterschrift'), angenommen: t('angebote.pdfAngenommen') };
    const pdf = await angebotPdfBauen(PDFLib, doc, { kunde, firma, texte });
    const thumb = await pdfVorschaubild(pdf.bytes, 160);
    const stand = arbeitsstandBauen(doc, pdf.bytes, { seiten: pdf.seiten, feldSeite: pdf.feldSeite, thumb });
    const datei = new File([stand.inhalt], stand.name, { type: 'application/json' });
    await setzeAngebotVerweise(a.id, { wfpdfUebergabeAm: new Date().toISOString() });
    if (typeof window !== 'undefined') window.__blpWfpdf = { name: stand.name, bytes: pdf.bytes.length, seiten: pdf.seiten, inhalt: stand.inhalt, datei };
    if (typeof window !== 'undefined' && window.__blpTeilenAbfangen) { await repaint(); return; }
    if (navigator.canShare && navigator.canShare({ files: [datei] })) {
      try { await navigator.share({ files: [datei], title: stand.name }); await repaint(); return; }
      catch (e) { if (e && e.name === 'AbortError') { await repaint(); return; } }
    }
    const url = URL.createObjectURL(datei); const l = document.createElement('a'); l.href = url; l.download = stand.name; document.body.appendChild(l); l.click(); l.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    await repaint(el('div', { class: 'banner banner-warn', text: t('angebote.wfpdfGespeichert').replace('%DATEI%', stand.name) }));
  } catch (e) { alert(String((e && e.message) || e)); }
}

// R1: Nutzlast bauen (nur die externe Schicht), Ziel am Angebot vermerken, WorkFloh öffnen.
// Probe-Haken: window.__blpSprungAbfangen = true hält den Sprung an, window.__blpVorgang trägt Ziel und Adresse.
async function auftragAnWorkFloh(a) {
  try {
    const voll = await getAngebot(a.id);
    if (!voll) throw new Error('Angebot nicht gefunden');
    const kunde = _kunden.find((k) => k.id === voll.kundeId) || null;
    const payload = vorgangAuftrag(voll, kunde);
    const key = zielKey(getSettings().workflohZiel);
    const url = vorgangUrl(key, payload);
    if (!url) throw new Error('WorkFloh-Ziel unbekannt');
    await setzeAngebotVerweise(a.id, { wfZiel: key, wfUebergabeAm: new Date().toISOString() });
    if (typeof window !== 'undefined') window.__blpVorgang = { ziel: key, url, payload };
    if (typeof window !== 'undefined' && window.__blpSprungAbfangen) { await repaint(); return; }
    location.href = url;
  } catch (e) { alert(String((e && e.message) || e)); }
}

function datumKurz(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : String(iso || '—');
}

// R3 (Rundlauf, Klaus 2026-10-26): Stand der Rechnung zurück an den WorkFloh-Auftrag. „rechnung" meldet NUR eine
// festgeschriebene Buchung (ein Entwurf ist keine Rechnung — Hinweis, kein Sprung); „bezahlt" ist Klaus' Angabe mit
// Datum (BLP führt zum Angebot keinen Zahlungseingang). Ziel = R1-Ziel, sonst die Quelle des R2-Rückwegs, sonst die
// Einstellung. Am Angebot wird nur der gemeldete Stand vermerkt; der WorkFloh übernimmt erst auf Tipp.
// Probe-Haken wie R1: window.__blpSprungAbfangen / window.__blpVorgang.
async function standAnWorkFloh(a, stand) {
  try {
    const voll = await getAngebot(a.id);
    const v = (voll && voll.verweise) || {};
    if (!v.wfAuftragNr) throw new Error(t('angebote.standOhneAuftrag'));
    let felder = {};
    if (stand === 'rechnung') {
      const b = v.rechnungBuchungId ? await getBuchung(v.rechnungBuchungId) : null;
      if (!b || b.status !== BUCHUNG_STATUS.FESTGESCHRIEBEN) { alert(t('angebote.standNochEntwurf').replace('%NR%', v.rechnungNr || '—')); return; }
      felder = { rechnungNr: v.rechnungNr || '', rechnungDatum: b.datum || v.rechnungDatum || '' };
    } else {
      const heute = new Date().toISOString().slice(0, 10);
      const eingabe = prompt(t('angebote.standBezahltFrage'), heute);
      if (eingabe == null) return;
      const d = String(eingabe).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { alert(t('angebote.standDatumFalsch')); return; }
      felder = { bezahltAm: d, rechnungNr: v.rechnungNr || '', rechnungDatum: v.rechnungDatum || '' };
    }
    const payload = vorgangStand(voll, { stand, ...felder });
    const key = zielAusVerweisen(v, getSettings().workflohZiel);
    const url = vorgangUrl(key, payload);
    if (!url) throw new Error('WorkFloh-Ziel unbekannt');
    await setzeAngebotVerweise(a.id, { wfStand: stand, wfStandAm: new Date().toISOString(), ...(stand === 'bezahlt' ? { wfBezahltAm: felder.bezahltAm } : {}) });
    if (typeof window !== 'undefined') window.__blpVorgang = { ziel: key, url, payload };
    if (typeof window !== 'undefined' && window.__blpSprungAbfangen) { await repaint(); return; }
    location.href = url;
  } catch (e) { alert(String((e && e.message) || e)); }
}

function zeile(a) {
  const summen = angebotSummen(a.positionen);
  const kundeName = (_kunden.find((k) => k.id === a.kundeId) || {}).name || '';
  return el('tr', {}, [
    el('td', { class: 'mono small', text: a.nummer || '—' }),
    el('td', {}, [el('div', { text: a.titel || '—' }), el('div', { class: 'muted small', text: kundeName }), wfVerweisNode(a)]),
    el('td', { class: 'num', text: formatEuro(summen.brutto) }),
    el('td', {}, [statusBadge(a.status)]),
    el('td', { class: 'actions' }, [aktionen(a)]),
  ]);
}

function aktionen(a) {
  const wrap = el('div', { class: 'btn-row' });
  // „Rechnung aus Angebot" — nur an einem ANGENOMMENEN, gültigen Angebot (darfAngebotUebernehmen).
  // Erzeugt einen Buchungs-Entwurf (Nummernpolitik je rechnungsstelle), referenziert die
  // Angebotsnummer und archiviert das Angebot. Festschreiben bleibt manuell (GoBD) → Hinweis.
  if (darfAngebotUebernehmen(a)) {
    wrap.appendChild(el('button', {
      class: 'btn btn-sm btn-primary', type: 'button', text: t('angebote.toInvoice'),
      onClick: async () => {
        if (!confirm(t('angebote.confirmInvoice'))) return;
        try {
          const { entwurf } = await rechnungAusAngebot(a.id);
          const text = (entwurf.vorlaeufig ? t('angebote.invoiceDoneVorlaeufig') : t('angebote.invoiceDone'))
            .replace('{nummer}', entwurf.nummer);
          await repaint(el('div', { class: 'banner banner-warn', text }));
        } catch (e) { alert(String(e.message || e)); }
      },
    }));
  }
  // R1 (Rundlauf, Klaus 2026-10-26): ein ANGENOMMENES Angebot wird Auftrag im WorkFloh. Die andere App legt ihn
  // zur Prüfung an und speichert erst auf Tipp; hier wird nur das Ziel und der Zeitpunkt am Angebot vermerkt.
  if (a.status === ANGEBOT_STATUS.ANGENOMMEN) {
    const ziel = WORKFLOH_ZIELE[zielKey(getSettings().workflohZiel)];
    wrap.appendChild(el('button', {
      class: 'btn btn-sm', type: 'button', 'data-wf-auftrag': a.id,
      text: t('angebote.anWorkfloh').replace('{ziel}', ziel.name),
      onClick: () => auftragAnWorkFloh(a),
    }));
  }
  // R3 (Rundlauf): Stand der Rechnung zurück an den WorkFloh — nur, wenn ein Auftrag zurückkam (R2) und die Rechnung aus
  // diesem Angebot entstand. Gemeldetes verschwindet als Knopf; „bezahlt" schließt ab.
  const vw = a.verweise || null;
  if (vw && vw.wfAuftragNr && vw.rechnungBuchungId && vw.wfStand !== 'bezahlt') {
    if (vw.wfStand !== 'rechnung') wrap.appendChild(el('button', { class: 'btn btn-sm', type: 'button', 'data-wf-stand': 'rechnung', text: t('angebote.standRechnung'), onClick: () => standAnWorkFloh(a, 'rechnung') }));
    wrap.appendChild(el('button', { class: 'btn btn-sm', type: 'button', 'data-wf-stand': 'bezahlt', text: t('angebote.standBezahlt'), onClick: () => standAnWorkFloh(a, 'bezahlt') }));
  }
  // Workflow PDF (Klaus 2026-10-26): an jedem nicht archivierten Angebot — PDF + Felder zum Unterschreiben.
  if (a.status !== ANGEBOT_STATUS.ARCHIVIERT) {
    wrap.appendChild(el('button', { class: 'btn btn-sm', type: 'button', 'data-wfpdf-angebot': a.id, text: t('angebote.anWorkflowPdf'), onClick: () => anWorkflowPdf(a) }));
  }
  for (const next of ANGEBOT_STATUS_FLOW[a.status] || []) {
    wrap.appendChild(el('button', {
      class: 'btn btn-sm', type: 'button', text: t('angebote.aktion.' + next),
      onClick: async () => {
        try { await setzeAngebotStatusStore(a.id, next); await repaint(); }
        catch (e) { alert(String(e.message || e)); }
      },
    }));
  }
  wrap.appendChild(el('button', {
    class: 'btn btn-sm', type: 'button', text: t('angebote.show'),
    onClick: () => dokumentAnzeigen(a),
  }));
  wrap.appendChild(el('button', {
    class: 'btn btn-sm', type: 'button', text: t('common.edit'),
    onClick: async () => {
      const voll = await getAngebot(a.id);
      _entwurf = { ...voll, positionen: [...(voll.positionen || [])] };
      _editId = a.id; _openSchemaId = null;
      resetUebernahmeHinweis();
      await repaint();
      if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  }));
  wrap.appendChild(el('button', {
    class: 'btn btn-sm btn-danger', type: 'button', text: t('common.delete'),
    onClick: async () => { if (confirm(t('angebote.confirmDelete'))) { await deleteAngebot(a.id); if (_editId === a.id) { _entwurf = neuesAngebot(); _editId = null; } await repaint(); } },
  }));
  return wrap;
}

// ── Neutrales Angebotsdokument (Prime Directive: NUR externesAngebot/Whitelist) ──

function dokumentAnzeigen(a) {
  const doc = externesAngebot(a);
  const kunde = _kunden.find((k) => k.id === a.kundeId) || {};
  const posRows = doc.positionen.map((p) => el('tr', {}, [
    el('td', { text: p.beschreibung || '—' }),
    el('td', { class: 'num', text: String(p.menge) }),
    el('td', { class: 'num', text: formatEuro(p.einzelpreisCent) }),
    el('td', { class: 'num', text: `${p.ustSatz} %` }),
    el('td', { class: 'num', text: formatEuro(p.netto) }),
  ]));
  const sumRows = [
    el('div', { class: 'report-line' }, [el('span', { text: t('angebote.net') }), el('span', { class: 'num', text: formatEuro(doc.netto) })]),
    ...doc.steuerzeilen.filter((z) => z.satz > 0).map((z) =>
      el('div', { class: 'report-line' }, [el('span', { text: `USt ${z.satz} %` }), el('span', { class: 'num', text: formatEuro(z.ust) })])),
    el('div', { class: 'report-line strong' }, [el('span', { text: t('angebote.gross') }), el('span', { class: 'num', text: formatEuro(doc.brutto) })]),
  ];
  mount(_host, el('section', { class: 'view' }, [
    el('div', { class: 'btn-row no-print' }, [
      el('button', { class: 'btn', type: 'button', text: t('common.back'), onClick: () => repaint() }),
      el('button', { class: 'btn btn-primary', type: 'button', text: t('reports.print'), onClick: () => window.print() }),
    ]),
    el('p', { class: 'muted small no-print', text: t('angebote.docHint') }),
    el('div', { class: 'card rechnung-doc' }, [
      el('h2', { class: 'card-title', text: `${t('angebote.docTitle')} ${doc.nummer || ''}` }),
      el('div', { class: 'muted small' }, [
        kunde.name ? el('span', { text: kunde.name }) : null,
        doc.datum ? el('span', { text: `   ·   ${t('angebote.datum')}: ${doc.datum}` }) : null,
        doc.gueltigBis ? el('span', { text: `   ·   ${t('angebote.gueltigBis')}: ${doc.gueltigBis}` }) : null,
      ]),
      doc.titel ? el('p', { text: doc.titel }) : null,
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', { text: t('angebote.posBeschreibung') }), el('th', { class: 'num', text: t('angebote.menge') }),
          el('th', { class: 'num', text: t('angebote.price') }), el('th', { class: 'num', text: t('angebote.vat') }),
          el('th', { class: 'num', text: t('angebote.net') }),
        ])),
        el('tbody', {}, posRows),
      ]),
      el('div', { class: 'rech-summen' }, sumRows),
    ]),
  ]));
}

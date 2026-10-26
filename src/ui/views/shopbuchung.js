// src/ui/views/shopbuchung.js — Shop-Buchhaltungs-Übernahme (art:"buchhaltung-summen").
// Zeigt die aus den Shop-Summen gebauten Buchungs-ENTWÜRFE zur Prüfung und speichert sie
// auf Knopfdruck als Entwürfe (nichts wird automatisch festgeschrieben — GoBD).
//
// ⚠️ Browser-Pfad: nutzt Vault/IndexedDB (store, accountIndex, saveEntwurf) → NICHT im
// Node-Test abgedeckt. Die reine Logik (Summen → Zeilen) liegt in domain/shopbuchung.js und
// ist node-getestet.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { navigate } from '../../state.js';
import { formatEuro } from '../../domain/money.js';
import { baueShopBuchungen } from '../../domain/shopbuchung.js';
import { consumeUebernahme, merkeUebernahme } from '../../domain/uebernahmeExtern.js';
import { accountIndex, ensureSeedKonten, saveEntwurf } from '../../domain/store.js';

let _daten = null; // zuletzt eingegangene Shop-Übergabe (RAM, bis gespeichert/verworfen)

function heute() {
  return new Date().toISOString().slice(0, 10);
}

export async function mountShopbuchung(host) {
  // Nur die für uns bestimmte Übergabe konsumieren; fremde Art (WorkFloh-Angebot) zurücklegen.
  const ext = consumeUebernahme();
  if (ext && ext.art === 'buchhaltung-summen') _daten = ext;
  else if (ext) merkeUebernahme(ext);

  if (!_daten) {
    mount(host, el('section', { class: 'view' }, [
      el('h1', { text: t('shopbuchung.title') }),
      el('p', { class: 'muted small', text: t('shopbuchung.leer') }),
    ]));
    return;
  }

  const datum = _daten.periode && (_daten.periode.bis || _daten.periode.von) ? _daten.datum || (_daten.periode.bis || _daten.periode.von) : heute();
  const ergebnis = baueShopBuchungen({ ..._daten, periode: { von: _daten.periode.von, bis: _daten.periode.bis || datum } });
  const idx = await accountIndex();
  const kName = (nr) => (idx[nr] ? `${nr} ${idx[nr].name}` : nr);

  const buchungNode = (b) => el('div', { class: 'card', style: 'margin:8px 0;padding:10px' }, [
    el('div', { class: 'row', style: 'justify-content:space-between' }, [
      el('strong', { text: b.beschreibung }),
      el('span', { class: 'muted', text: formatEuro(b.bruttoCent) }),
    ]),
    el('table', { class: 'table small', style: 'margin-top:6px;width:100%' }, [
      el('tbody', {}, b.zeilen.map((z) => el('tr', {}, [
        el('td', { text: z.seite === 'S' ? t('shopbuchung.soll') : t('shopbuchung.haben') }),
        el('td', { text: kName(z.konto) }),
        el('td', { style: 'text-align:right', text: formatEuro(z.betrag) }),
      ]))),
    ]),
    el('div', { class: 'muted small', style: 'margin-top:4px', text: b.begruendung }),
  ]);

  const kinder = [
    el('h1', { text: t('shopbuchung.title') }),
    el('p', { class: 'muted small', text: t('shopbuchung.intro').replace('%SHOP%', ergebnis.shop).replace('%ZEITRAUM%', ergebnis.zeitraum || '—') }),
  ];
  if (_daten.geschaetzt) kinder.push(el('p', { class: 'warn small', text: t('shopbuchung.geschaetzt') }));

  if (!ergebnis.buchungen.length) {
    kinder.push(el('p', { class: 'warn', text: t('shopbuchung.keine') }));
    kinder.push(el('button', { class: 'btn', text: t('shopbuchung.verwerfen'), onClick: verwerfen }));
    mount(host, el('section', { class: 'view' }, kinder));
    return;
  }

  ergebnis.buchungen.forEach((b) => kinder.push(buchungNode(b)));

  const statusZeile = el('p', { class: 'muted small', text: '' });
  kinder.push(el('div', { class: 'row', style: 'gap:8px;margin-top:10px' }, [
    el('button', {
      class: 'btn btn-primary',
      text: t('shopbuchung.speichern'),
      onClick: async (e) => {
        const btn = e.currentTarget; btn.disabled = true;
        try {
          await ensureSeedKonten(ergebnis.konten);
          for (const b of ergebnis.buchungen) {
            await saveEntwurf({ datum: b.datum || heute(), beschreibung: b.beschreibung, begruendung: b.begruendung, zeilen: b.zeilen });
          }
          _daten = null;
          statusZeile.textContent = t('shopbuchung.gespeichert').replace('%N%', String(ergebnis.buchungen.length));
          navigate('journal');
        } catch (err) {
          btn.disabled = false;
          statusZeile.textContent = t('shopbuchung.fehler') + ' ' + (err && err.message ? err.message : '');
        }
      },
    }),
    el('button', { class: 'btn', text: t('shopbuchung.verwerfen'), onClick: verwerfen }),
  ]));
  kinder.push(statusZeile);

  mount(host, el('section', { class: 'view' }, kinder));
}

function verwerfen() {
  _daten = null;
  navigate('dashboard');
}

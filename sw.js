/* sw.js — App-Service-Worker (Offline-Shell-Cache).
 *
 * Browser-Lehre 4 ("SW-Cache + Updates brauchen File-Rename / Version-Bump"):
 * Der Cache-Name trägt eine VERSION. Bei jedem Deploy, der Shell-Logik ändert,
 * MUSS CACHE_VERSION erhöht werden (oder die betroffene Datei umbenannt, z.B.
 * journal.js -> journal-v2.js). Sonst liefert der SW veraltete Buchungslogik —
 * bei einer Buchhaltung inakzeptabel.
 *
 * Strategie:
 *  - install: Kern-Shell precachen, sofort aktiv werden (skipWaiting).
 *  - activate: alte Cache-Versionen löschen, Clients übernehmen.
 *  - fetch: Navigation -> network-first (fällt offline auf index.html zurück);
 *           statische Assets -> stale-while-revalidate (frisch beim nächsten Load).
 */

const CACHE_VERSION = 'v271';

/* ⚠ NUR EIGENE VORRAETE AUFRAEUMEN — `caches` gehoert dem URSPRUNG, nicht dem
 * Pfad. Auf lausiklauskn-png.github.io liegen rund zwanzig Apps; ein Filter,
 * der nur "ist nicht meiner" fragt, laesst ALLE fremden durch und loescht sie.
 * Gemessen am 2026-09-08 an zwei echten Apps
 * (Sage-Protokol/tests/vorrat_wirkung.mjs). Praefix ABGELESEN aus der
 * Vorrat-Konstante, nicht geraten. Muster aus Tomys-Hub/bookledger/sw.js.
 * Es muss BEIDES tun: fremde stehen lassen UND eigene alte weiter wegraeumen. */
const VORRAT_PRAEFIX = "blpr-";
const CACHE_NAME = `blpr-shell-${CACHE_VERSION}`;
/* Teilen aus anderen Apps (Klaus 2026-10-26, Schritt 2 V1 — Muster aus Workflow PDF): Android schickt geteilte
 * Dateien als POST an ./teilen-empfang (share_target im Manifest). Der Worker legt sie in einen eigenen Vorrat
 * und leitet auf ./?geteilt=1 weiter; die App holt sie dort ab (src/domain/teilenEmpfang.js) und leert ihn.
 * Der Vorrat ueberlebt ein neues CACHE_VERSION (BLEIBT). Name = GETEILT_VORRAT in src/domain/workflowPdf.js. */
const GETEILT_VORRAT = 'blpr-geteilt';
/* Eingebettete Apps (Workflow Calculate/Needs, Klaus 2026-10-26): eigener Vorrat, nicht in der Schale (8 MB), beim Oeffnen
 * oder ueber „Offline bereitlegen" gefuellt; ueberlebt ein neues CACHE_VERSION. Name = APPS_VORRAT in src/ui/views/apps.js. */
const APPS_VORRAT = 'blpr-apps';
const BLEIBT = [GETEILT_VORRAT, APPS_VORRAT];

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/tokens.css',
  './assets/app.css',
  './assets/icon.svg',
  // Strichsymbole (Klaus 2026-10-26): PBP-Satz byte-1:1 + BLP-Fachsymbole, geladen von src/ui/icons.js.
  './assets/pb-icons.svg',
  './assets/blp-icons.svg',
  './src/ui/icons.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
  './assets/installieren.js?v=1',
  './assets/img/hero-lock.png',
  './assets/img/cover.webp',
  './assets/img/cover-640.webp',
  './assets/img/iso-iec.jpg',
  './assets/img/empty-journal.png',
  './assets/img/empty-documents.png',
  './assets/img/empty-customers.png',
  './assets/img/empty-orders.png',
  './assets/img/empty-employees.png',
  './assets/img/empty-reports.png',
  './assets/img/empty-network.png',
  './assets/img/onboard-key.png',
  './assets/img/onboard-shamir.png',
  './assets/img/onboard-backup.png',
  './src/main.js',
  './src/state.js',
  './src/domain/datenschutzStandard.js',
  './src/ai/namensvorschlag.js',
  './src/ui/namensvorschlag.js',
  './src/ui/mikro.js',
  './sbkim/25_pseudonym.js',
  './src/core/crypto.js',
  './src/core/shamir.js',
  './src/core/db.js',
  './src/core/mandantenStore.js',
  './src/core/sandboxStore.js',
  './src/core/durability.js',
  './src/core/files.js',
  './src/core/scanPdf.js',
  './src/core/qr.js',
  './src/core/vault.js',
  './src/core/safebox.js',
  './src/core/backup.js',
  './src/core/backupOrdner.js',
  './src/core/tresorBelege.js',
  './src/domain/backupStrategie.js',
  './src/domain/tresorordner.js',
  './src/ui/datensicherung.js',
  './src/ui/dom.js',
  './src/ui/i18n.js',
  './src/ui/geraetename.js',
  './src/ui/theme.js',
  './src/ui/mycel.js',
  './src/ui/mycelCanvas.js',
  './src/ui/empty.js',
  './src/ui/testmarke.js',
  './src/ui/lock.js',
  './src/ui/intro.js',
  './src/ui/shell.js',
  './src/domain/summary.js',
  './src/domain/geschaeftsjahr.js',
  './src/ui/views/dashboard.js',
  './src/ui/views/accounts.js',
  './src/ui/views/anlagen.js',
  './src/ui/views/kassenbuch.js',
  './src/ui/views/journal.js',
  './src/ui/views/reports.js',
  './src/ui/views/berichte.js',
  './src/domain/money.js',
  './src/domain/mandanten.js',
  './src/domain/accounts.js',
  './src/domain/bilanzierung.js',
  './src/domain/nutzungsmodus.js',
  './src/domain/workflowPdf.js',
  './src/domain/belegsuche.js',
  './src/domain/teilenEmpfang.js',
  './src/domain/rechnungsstelle.js',
  './src/domain/kalkulation.js',
  './src/domain/produktschemata.js',
  './src/domain/angebote.js',
  './src/domain/angebotUebernahme.js',
  './src/domain/nachkalkulation.js',
  './src/domain/kalibrierung.js',
  './src/domain/baukasten.js',
  './src/domain/angebote-store.js',
  './src/domain/vorgang.js',
  './src/domain/mailEml.js',
  './src/domain/belegPositionen.js',
  './src/domain/workflowPdfRundlauf.js',
  './src/domain/nachkalkulation-store.js',
  './src/domain/bilanz.js',
  './src/domain/audit.js',
  './src/domain/journal.js',
  './src/domain/shopbuchung.js',
  './src/domain/pruefung.js',
  './src/domain/rechtsregeln.js',
  './src/domain/taxes.js',
  './src/domain/store.js',
  './src/domain/documents.js',
  './src/domain/kiReinigung.js',
  './src/domain/importPlatz.js',
  './src/domain/belegPruefung.js',
  './src/domain/aufbewahrung.js',
  './src/domain/aufklaerung.js',
  './src/ai/extract.js',
  './src/ai/categorize.js',
  './src/ai/suggest.js',
  './src/ai/aiConfig.js',
  './src/ai/anbieter.js',
  './src/ai/vision.js',
  './src/ai/kiVorbereitung.js',
  './src/ai/mistral.js',
  './src/ai/speech.js',
  './src/ai/berater.js',
  './src/ai/pseudonym.js',
  './src/ai/anker.js',
  './src/ai/ner.js',
  './src/ai/namensmuster.js',
  './src/ai/briefkasten.js',
  './src/ai/belegRichter.js',
  './src/ai/schluesselabgleich.js',
  './src/ui/schluesselabgleich.js',
  './src/domain/orders.js',
  './src/domain/besteller.js',
  './src/domain/invoicing.js',
  './src/domain/rechnung.js',
  './src/domain/erechnung.js',
  './src/domain/erechnungLesen.js',
  './src/domain/zugferd.js',
  './src/domain/bankimport.js',
  './src/domain/bankschema.js',
  './src/domain/zahlungsabgleich.js',
  './src/domain/skonto.js',
  './src/domain/payables.js',
  './src/domain/payables-store.js',
  './src/domain/anlagen.js',
  './src/domain/anlagen-store.js',
  './src/domain/kassenbuch.js',
  './src/domain/anfangsbestand-store.js',
  './src/domain/umsatzsteuer.js',
  './src/domain/berichte.js',
  './src/domain/gdpdu.js',
  './src/domain/kleinfaelle.js',
  './src/domain/demodaten.js',
  './src/domain/demodaten-store.js',
  './src/domain/selbsttest.js',
  './src/ui/views/selbsttest.js',
  './src/core/zip.js',
  './src/domain/mahnwesen.js',
  './src/domain/eingangsverzug.js',
  './src/domain/liquiditaet.js',
  './src/domain/lohnbuchung.js',
  './src/domain/lohn-store.js',
  './src/domain/employees.js',
  './src/domain/costcenters.js',
  './src/domain/encstore.js',
  './src/domain/crm-store.js',
  './src/domain/kundenimport.js',
  './src/domain/importworkfloh.js',
  './src/domain/connect.js',
  './src/domain/export.js',
  './src/ai/taxAssist.js',
  './src/ui/views/documents.js',
  './src/ui/belegDialoge.js',
  './src/ui/views/payables.js',
  './src/ui/views/customers.js',
  './src/ui/views/orders.js',
  './src/ui/views/angebote.js',
  './src/ui/views/apps.js',
  './src/domain/eingebettet.js',
  // Scanner-Kern von Workflow PDF (Klaus 2026-10-26), byte-1:1: klein genug für die Schale; pdf-lib/fontkit/Noto und
  // das Scanic-Modell (vendor/scanic) kommen beim ersten Scannen in den Vorrat.
  './src/ui/scanner.js',
  './assets/wfpdf/scanner.js',
  './assets/wfpdf/scan-bild.js',
  './assets/wfpdf/blatt.js',
  './assets/wfpdf/zip.js',
  './assets/wfpdf/scanner.css?v=1',
  './assets/wfpdf/HERKUNFT.json',
  './apps/HERKUNFT.json',
  './src/ui/views/shopbuchung.js',
  './src/ui/views/nachkalkulation.js',
  './src/ui/views/employees.js',
  './src/ui/views/lohn.js',
  './src/ui/views/legal.js',
  './src/ui/views/network.js',
  './src/ui/views/safebox.js',
  './src/ui/views/tresorordner.js',
  './src/ui/views/anleitung.js',
  './src/sbkim/spore.js',
  './src/sbkim/identity.js',
  './src/sbkim/domainvector.js',
  './src/sbkim/signal.js',
  './src/sbkim/nodeProfile.js',
  './src/sbkim/peers.js',
  './src/sbkim/embed.js',
  './src/sbkim/match.js',
  './src/sbkim/hybridSearch.js',
  './src/sbkim/searchCorpus.js',
  './src/sbkim/kontoSynonyme.js',
  './src/ui/views/sbkimsuche.js',
  './src/sbkim/wappen.js',
  './docs/TRANSPARENZ_ZWISCHENSTAND.html',
  // SBKIM Andock-Runtime + Auto-Lauschen (Stufe 2) — byte-identisch aus Sage.
  './sbkim/01_storage.js',
  './sbkim/02_spore.js',
  './sbkim/03_embedding.js',
  './sbkim/04_match.js',
  './sbkim/05_anastomose.js',
  './sbkim/05b_nostr_relay.js',
  './sbkim/07_apoptose.js',
  './sbkim/15_membran.js',
  './sbkim/16_siegel.js',
  './sbkim/siegel-inhalt.js',
  './sicherheit.html',
  './impressum.html',
  './datenschutz.html',
  './sbkim/noble-secp256k1.js',
  './sbkim/17_floating_widget.js',
  // Nachzug 2026-07-30: diese drei fehlten in der Schale — offline war damit das
  // Netz-Panel („Mit dem Knotennetz verbinden") weg, obwohl index.html sie lädt.
  // Goldene Regel 1 dieses Repos ist offline-first; ohne sie hielt sie nur halb.
  './sbkim/21_spracheingabe.js',
  './sbkim/23_rendezvous.js',
  './sbkim/23_rendezvous_ui.js',
  './sbkim/sbkim-init.js',
  // Prüfung und Reinigung der Belege (Klaus 2026-10-14) — byte-1:1 aus Workflow PDF, mit der
  // Adresse, unter der sie geladen werden (der Vorrat vergleicht samt ?v=). pdf.js (1,5 MB) und die
  // Texterkennung (21 MB) stehen NICHT hier: der Worker legt sie beim ersten Prüfen ab.
  './assets/eingang.js?v=5',
  './assets/pruefer-formate.js?v=2',
  './assets/pruefer-mail.js?v=2',
  './assets/pruefer-anhang.js?v=4',
  './assets/reinigung.js?v=1',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter(k => k.startsWith(VORRAT_PRAEFIX) && k !== CACHE_NAME && !BLEIBT.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/teilen-empfang')) {   // Teilen aus einer anderen App
    event.respondWith(teilenEmpfangen(request));
    return;
  }
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // nur eigene Assets

  if (url.pathname.includes('/apps/') && !url.pathname.endsWith('/HERKUNFT.json')) {
    // Eingebettete App: Vorrat zuerst (offline), im Hintergrund frisch; ihre index.html (der Rahmen navigiert) netz-zuerst.
    event.respondWith(
      caches.open(APPS_VORRAT).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; }).catch(() => null);
        if (request.mode === 'navigate') return (await network) || cached || new Response('', { status: 504 });
        return cached || (await network) || new Response('', { status: 504 });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    // Navigationen netz-zuerst (immer aktuell). Offline: exakt angefragte, vorgecachte Seite
    // (z. B. der Transparenzbericht docs/…html) — sonst die App-Shell (index.html, SPA-Routen).
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(request)) || caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => null);
      return cached || (await network) || new Response('', { status: 504 });
    })
  );
});

async function teilenEmpfangen(r) {
  let n = 0;
  try {
    const fd = await r.formData();
    const c = await caches.open(GETEILT_VORRAT);
    for (const f of fd.getAll('dateien')) {
      if (!f || typeof f === 'string' || !f.size) continue;
      await c.put(new Request('./geteilt/' + Date.now() + '-' + (n++)), new Response(f, { headers: {
        'Content-Type': f.type || 'application/octet-stream', 'X-Name': encodeURIComponent(f.name || 'Datei') } }));
    }
  } catch (_) { return Response.redirect('./?geteilt=fehler', 303); }
  return Response.redirect('./?geteilt=' + (n ? '1' : '0'), 303);
}

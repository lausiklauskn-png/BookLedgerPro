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

const CACHE_VERSION = 'v1';
const CACHE_NAME = `blpr-shell-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/tokens.css',
  './assets/app.css',
  './assets/icon.svg',
  './src/main.js',
  './src/state.js',
  './src/core/crypto.js',
  './src/core/shamir.js',
  './src/core/db.js',
  './src/core/durability.js',
  './src/core/files.js',
  './src/core/vault.js',
  './src/core/backup.js',
  './src/ui/dom.js',
  './src/ui/i18n.js',
  './src/ui/theme.js',
  './src/ui/mycel.js',
  './src/ui/lock.js',
  './src/ui/shell.js',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // nur eigene Assets

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
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

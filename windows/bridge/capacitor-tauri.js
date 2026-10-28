/* BookLedgerPro für Windows: stellt dieselben Capacitor-Plugins bereit wie die Android-Hülle, damit native/blp-native.js
   unverändert seinen Weg findet. Jeder Aufruf geht mit dem Sitzungsschlüssel an die Hülle (blp_call); welche Methoden
   es gibt, legt bridge/contracts.json fest (dort geprüft, nicht hier). Ereignisse der Engine kommen als 'blp-native'. */
(() => {
  'use strict';
  if (window !== window.top || location.protocol !== 'https:' || location.hostname !== 'tauri.localhost' || !['/', '/index.html'].includes(location.pathname)) return;
  const invoke = window.__TAURI_INTERNALS__?.invoke; if (typeof invoke !== 'function') return;
  const TOKEN = __BLP_SESSION_TOKEN__;
  const listeners = new Map();
  window.addEventListener('blp-native', (event) => {
    for (const listener of listeners.get(event.detail?.name) || []) { try { listener(event.detail.data); } catch { /* Hörer der Seite */ } }
  });
  const plugins = {};
  for (const name of ['BlpFiles', 'BlpIncoming', 'BlpTresor', 'BlpSpeech', 'BlpFenster', 'ProScanner', 'BlpUpdates']) {
    plugins[name] = new Proxy(Object.freeze({}), { get(_, method) {
      if (method === 'then') return undefined;
      if (method === 'addListener') return async (event, listener) => {
        const key = name + ':' + event; let set = listeners.get(key); if (!set) listeners.set(key, set = new Set()); set.add(listener);
        return { remove: async () => set.delete(listener) };
      };
      return async (options = {}) => {
        try {
          return await invoke('blp_call', { plugin: name, method: String(method), options: { ...options, _language: document.documentElement?.lang || 'de' } }, { headers: { 'x-blp-session': TOKEN } });
        } catch (error) {
          const code = typeof error === 'string' ? error : error?.code || 'APP_RUNTIME_UNAVAILABLE';
          throw Object.assign(new Error(code), { code });
        }
      };
    } });
  }
  Object.defineProperty(window, 'Capacitor', { value: Object.freeze({ Plugins: Object.freeze(plugins), isNativePlatform: () => true, getPlatform: () => 'windows' }), writable: false, configurable: false });
})();

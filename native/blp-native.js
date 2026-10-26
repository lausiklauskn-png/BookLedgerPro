/* native/blp-native.js — Klebstoff der Android-Hülle (Schritt A, Klaus 2026-10-26).
 *
 * Die Web-App bleibt unverändert. Dieses Skript läuft nur in der App (Capacitor) und schließt drei Lücken der WebView,
 * jeweils über den Weg, den die Web-App schon kennt:
 *   1. Eingang: Androids „Teilen" und „Öffnen mit" kommen als launchQueue an — genau wie „Öffnen mit" in der PWA
 *      (src/ui/shell.js liest launchQueue und gibt die Dateien an die Belege).
 *   2. Speichern: <a download> tut in der WebView nichts. Ein Tipp darauf (auch a.click() aus downloadBlob) geht an
 *      Androids Speichern-Dialog — sonst ginge eine Datensicherung still verloren (Regel #2).
 *   3. Teilen hinaus: navigator.share mit einer Datei geht an Androids Teilen-Auswahl.
 * Im Browser tut die Datei nichts (erste Zeile).
 */
(function () {
  'use strict';
  var C = window.Capacitor;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return;
  var P = C.Plugins || {};
  var Eingang = P.BlpIncoming, Dateien = P.BlpFiles;
  var MAX = 100 * 1024 * 1024;
  document.documentElement.setAttribute('data-nativ', 'android');

  function hinweis(text) {
    try {
      var d = document.createElement('div');
      d.setAttribute('role', 'status'); d.setAttribute('data-nativ-hinweis', '');
      d.textContent = text;
      d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483000;max-width:90vw;' +
        'padding:10px 14px;border-radius:10px;background:#1f2933;color:#fff;font:15px/1.35 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.3)';
      (document.body || document.documentElement).appendChild(d);
      setTimeout(function () { d.remove(); }, 4000);
    } catch (e) { /* nur Anzeige */ }
  }

  function base64(blob) {
    return new Promise(function (ok, fehler) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result || ''); ok(s.slice(s.indexOf(',') + 1)); };
      r.onerror = function () { fehler(r.error); };
      r.readAsDataURL(blob);
    });
  }
  function bytesAus(b64) {
    var s = atob(b64 || ''), u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }

  // ---- 2 · Speichern -------------------------------------------------------------------------------------------
  function speichern(href, name) {
    return fetch(href).then(function (r) { return r.blob(); }).then(function (blob) {
      if (blob.size > MAX) throw new Error('zu groß');
      return base64(blob).then(function (data) {
        return Dateien.save({ name: name || 'Datei', mime: blob.type || 'application/octet-stream', data: data });
      });
    }).then(function (r) {
      hinweis(r && r.saved ? 'Gespeichert: ' + (name || 'Datei') : 'Nicht gespeichert.');
      return r;
    }).catch(function () { hinweis('Speichern ging nicht. Bitte noch einmal versuchen.'); });
  }
  if (Dateien) {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
      if (!a || !a.href) return;
      e.preventDefault(); e.stopImmediatePropagation();
      speichern(a.href, a.getAttribute('download'));
    }, true);
  }

  // ---- 3 · Teilen hinaus -----------------------------------------------------------------------------------------
  if (Dateien && !navigator.share) {
    var eine = function (d) { return !!(d && d.files && d.files.length === 1 && d.files[0] && d.files[0].size <= MAX); };
    navigator.canShare = function (d) { return eine(d); };
    navigator.share = function (d) {
      if (!eine(d)) return Promise.reject(new DOMException('Nur eine Datei', 'NotAllowedError'));
      var f = d.files[0];
      return base64(f).then(function (data) {
        return Dateien.share({ name: f.name || 'Datei', mime: f.type || 'application/octet-stream', data: data, title: d.title || '' });
      }).then(function () { return undefined; });
    };
  }

  // ---- 1 · Eingang über launchQueue -----------------------------------------------------------------------------
  if (Eingang && !('launchQueue' in window)) {
    var abnehmer = null, laeuft = false, nochmal = false;
    var lesen = function (batch, f) {
      var teile = [], offset = 0;
      var schritt = function () {
        return Eingang.read({ batch: batch, id: f.id, offset: offset }).then(function (r) {
          var b = bytesAus(r.data); teile.push(b); offset += b.length;
          return r.done ? new File(teile, f.name || 'Datei', { type: f.mime || '' }) : schritt();
        });
      };
      return schritt();
    };
    var aufraeumen = function () {
      if (!Eingang.history) return;
      Eingang.history().then(function (h) {
        var alt = Date.now() - 14 * 864e5;
        (h && h.receipts || []).forEach(function (e) { if (e.at && e.at < alt) Eingang.discardArchived({ id: e.id }).catch(function () {}); });
      }).catch(function () {});
    };
    var liefern = function () {
      if (!abnehmer) return;
      if (laeuft) { nochmal = true; return; }
      laeuft = true;
      Eingang.pending().then(function (batch) {
        if (!batch || batch.empty) return null;
        if (batch.problem) {
          hinweis('Die geteilte Datei kam nicht an. Bitte noch einmal teilen.');
          return Eingang.acknowledge({ id: batch.id, discard: true }).then(function () { nochmal = true; });
        }
        var liste = batch.files || [], fertig = [];
        var naechste = function (i) {
          if (i >= liste.length) return Promise.resolve();
          return lesen(batch.id, liste[i]).then(function (f) { fertig.push(f); return naechste(i + 1); });
        };
        return naechste(0).then(function () {
          // Erst übergeben, dann quittieren (archiviert, nicht gelöscht: 14 Tage Rückweg im App-Speicher).
          return Promise.resolve(abnehmer({ files: fertig.map(function (f) { return { getFile: function () { return Promise.resolve(f); } }; }) }))
            .then(function () { return Eingang.acknowledge({ id: batch.id, discard: false }); })
            .then(function () { nochmal = true; });
        });
      }).catch(function () {
        hinweis('Geteilte Dateien konnten nicht gelesen werden. Nichts wurde eingelesen.');
      }).then(function () {
        laeuft = false;
        if (nochmal) { nochmal = false; liefern(); }
      });
    };
    window.launchQueue = { setConsumer: function (fn) { abnehmer = typeof fn === 'function' ? fn : null; liefern(); } };
    try { Eingang.addListener('available', liefern); } catch (e) { /* ohne Ereignis: beim Start */ }
    setTimeout(aufraeumen, 5000);
  }

  window.BLPNative = Object.freeze({ plattform: 'android', speichern: speichern });
})();

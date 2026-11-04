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
  // Dieselbe Datei läuft in der Android-Hülle und in der Windows-Hülle (windows/bridge/capacitor-tauri.js, Pro-Umbau 5).
  var PLATTFORM = typeof C.getPlatform === 'function' && C.getPlatform() === 'windows' ? 'windows' : 'android';
  var WINDOWS = PLATTFORM === 'windows';
  document.documentElement.setAttribute('data-nativ', PLATTFORM);

  function hinweis(text, ms) {
    try {
      var d = document.createElement('div');
      d.setAttribute('role', 'status'); d.setAttribute('data-nativ-hinweis', '');
      d.textContent = text;
      d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483000;max-width:90vw;' +
        'padding:10px 14px;border-radius:10px;background:#1f2933;color:#fff;font:15px/1.35 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.3)';
      (document.body || document.documentElement).appendChild(d);
      setTimeout(function () { d.remove(); }, ms || 4000);
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
  // Befund SD-Karte 2026-11-03: zwei Sicherungen mit 0 Byte neben dem Tresor. Die Hülle legt den Inhalt jetzt vor dem
  // Dialog im App-Zwischenspeicher ab und löscht eine angelegte Datei wieder, wenn das Schreiben scheitert (BlpFilesPlugin).
  // Hier: leere Inhalte gar nicht erst anbieten, jeden Fehler beim Namen nennen, und „Speichern unter“ in den Tresorordner
  // erkennen (keine offenen Dateien neben dem Tresor; die Sicherung liegt verschlüsselt in BookLedgerPro/Sicherung).
  var SPEICHER_FEHLER = {
    SAVE_FAILED: 'Speichern ging nicht. Die angefangene Datei wurde wieder gelöscht. Bitte noch einmal versuchen.',
    SAVE_FAILED_EMPTY_LEFT: 'Speichern ging nicht. Die leere Datei „{name}“ (0 Byte) ließ sich nicht löschen – bitte in der Dateien-App von Hand löschen.',
    SAVE_DATA_LOST: 'Speichern ging nicht: der Inhalt ging unterwegs verloren. Die leere Datei wurde gelöscht. Bitte noch einmal speichern.',
    SAVE_NO_SPACE: 'Speichern ging nicht: kein Platz im Speicher der App.',
    FILE_EMPTY: 'Die Datei ist leer – nichts gespeichert.',
    FILE_INVALID: 'Die Datei ist zu groß oder beschädigt – nichts gespeichert.',
  };
  var TRESOR_FRAGE = '„{name}“ liegt jetzt im Tresorordner, offen neben den verschlüsselten Fächern.\n\n' +
    'Offene Dateien gehören nicht in den Tresor-Ordner: die Sicherung von BookLedgerPro liegt schon verschlüsselt in „BookLedgerPro/Sicherung“. ' +
    'Besser z. B. unter „Download“ speichern.\n\nOK = trotzdem dort lassen · Abbrechen = wieder entfernen';
  function speicherFehler(e, name) {
    var c = String((e && (e.code || e.message)) || e || '');
    var satz = SPEICHER_FEHLER[c] || 'Speichern ging nicht. Bitte noch einmal versuchen.';
    return satz.replace('{name}', name || 'Datei');
  }
  function speichern(href, name) {
    name = name || 'Datei';
    return fetch(href).then(function (r) { return r.blob(); }).then(function (blob) {
      if (blob.size > MAX) throw new Error('FILE_INVALID');
      if (!blob.size) throw new Error('FILE_EMPTY');
      return base64(blob).then(function (data) {
        return Dateien.save({ name: name, mime: blob.type || 'application/octet-stream', data: data });
      });
    }).then(function (r) {
      if (r && r.saved && r.imTresor) {
        if (window.confirm(TRESOR_FRAGE.replace('{name}', name))) { hinweis('Gespeichert (im Tresorordner): ' + name, 6000); return r; }
        var weg = typeof Dateien.saveZuruecknehmen === 'function' ? Dateien.saveZuruecknehmen() : Promise.resolve({ entfernt: false });
        return weg.then(function (x) {
          hinweis(x && x.entfernt ? 'Wieder entfernt. Bitte einen Ordner außerhalb des Tresors wählen.' : '„' + name + '“ ließ sich nicht entfernen – bitte in der Dateien-App löschen.', 8000);
          return { saved: false, entfernt: !!(x && x.entfernt) };
        });
      }
      hinweis(r && r.saved ? 'Gespeichert: ' + name : 'Nicht gespeichert.');
      return r;
    }).catch(function (e) { hinweis(speicherFehler(e, name), 9000); return { saved: false, fehler: String((e && (e.code || e.message)) || e) }; });
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
      }).then(function (r) {
        // Windows hat keine Teilen-Liste wie Android: „Teilen“ heißt dort Speichern unter … (Satz statt Stille).
        if (WINDOWS) hinweis(r && r.saved ? 'Gespeichert: ' + (f.name || 'Datei') : 'Nicht gespeichert.');
        return undefined;
      });
    };
  }

  // ---- 1 · Eingang über launchQueue -----------------------------------------------------------------------------
  // Neuere Android-WebViews bringen ein eigenes window.launchQueue mit, das dort nie etwas liefert (gemessen am Tablet
  // 2026-10-28: geteilte Mail kam nicht an). Deshalb gilt in der App immer dieser Eingang, ob die WebView eins hat oder nicht.
  if (Eingang) {
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
    var schlange = { setConsumer: function (fn) { abnehmer = typeof fn === 'function' ? fn : null; liefern(); } };
    try { Object.defineProperty(window, 'launchQueue', { value: schlange, configurable: true, enumerable: true, writable: false }); }
    catch (e) { hinweis('Teilen an BookLedgerPro ist in dieser Android-Version nicht verfügbar.'); }
    try { Eingang.addListener('available', liefern); } catch (e) { /* ohne Ereignis: beim Start */ }
    setTimeout(aufraeumen, 5000);
    // Windows: Dateien ins Fenster ziehen = derselbe Eingang wie „Öffnen mit“ (Klaus 2026-10-28: „Das Hineinziehen ist auch klar“).
    // Eigene Ablageflächen der Seite (Tresor-Fach, Datensicherung, Angebotszeilen) haben Vorrang: sie verhindern den Standard selbst.
    if (WINDOWS) {
      var mitDateien = function (e) { var t = e.dataTransfer && e.dataTransfer.types; return !!t && Array.prototype.indexOf.call(t, 'Files') >= 0; };
      document.addEventListener('dragover', function (e) { if (mitDateien(e) && !e.defaultPrevented) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
      document.addEventListener('drop', function (e) {
        if (!mitDateien(e) || e.defaultPrevented) return;
        e.preventDefault();
        var liste = Array.prototype.slice.call(e.dataTransfer.files || []).filter(function (f) { return f.size > 0; });
        if (!liste.length) { hinweis('Ordner lassen sich nicht hineinziehen — bitte einzelne Dateien.'); return; }
        if (!abnehmer) { hinweis('Bitte zuerst entsperren, dann die Dateien noch einmal hineinziehen.'); return; }
        Promise.resolve(abnehmer({ files: liste.map(function (f) { return { getFile: function () { return Promise.resolve(f); } }; }) }))
          .catch(function () { hinweis('Die Dateien konnten nicht eingelesen werden.'); });
      });
    }
  }

  // ---- 4 · Gemeinsamer Tresorordner (Schritt C, Klaus 2026-10-27) ------------------------------------------------
  // Passwörter gehen nie durch diese Datei: anlegen/entsperren/ändern öffnen den nativen Dialog. Hier nur Stücke
  // hin und her (Base64, 256 KiB) und die automatische Sicherung des Bestands ins eigene Fach.
  var T = P.BlpTresor, tresor = null;
  if (T) {
    var ablegen = function (fach, unterordner, blob, name, auszug, datum, aufgabe, uebergabe) {
      return T.ablegenBeginnen({ fach: fach, unterordner: unterordner || '', name: name || 'Datei', art: uebergabe ? blob.type : (blob.type || 'application/octet-stream'),
        auszug: auszug || '', datum: typeof datum === 'number' ? datum : Date.now(), ...(uebergabe ? { uebergabe: uebergabe } : {}) }).then(function (r) {
        var ticket = r.ticket, pos = 0, STUECK = 192 * 1024;
        var weiter = function () {
          if (pos >= blob.size) return T.ablegenFertig({ ticket: ticket });
          // Abbrechen aus der Mitteilung der Hintergrundaufgabe: angefangene Datei verwerfen, nichts halb ablegen.
          if (aufgabe && aufgabe.signal && aufgabe.signal.aborted) return Promise.reject(new Error('Abgebrochen'));
          if (aufgabe && blob.size > STUECK) aufgabe.stand(Math.round(pos / 1048576) + ' von ' + Math.max(1, Math.round(blob.size / 1048576)) + ' MB', pos, blob.size);
          var teil = blob.slice(pos, pos + STUECK); pos += STUECK;
          return base64(teil).then(function (d) { return T.ablegenTeil({ ticket: ticket, data: d }); }).then(weiter);
        };
        return weiter().catch(function (e) { T.ablegenAbbrechen({ ticket: ticket }).catch(function () {}); throw e; });
      });
    };
    var lesenBlob = function (fach, id) {
      return T.lesenOeffnen({ fach: fach, id: id }).then(function (o) {
        var teile = [];
        var weiter = function () {
          return T.lesenTeil({ ticket: o.ticket }).then(function (r) {
            teile.push(bytesAus(r.data));
            return r.fertig ? new File(teile, o.name || 'Datei', { type: o.art || '' }) : weiter();
          });
        };
        return weiter();
      });
    };
    var modul = function (pfad) { return import(new URL(pfad, document.baseURI).href); };
    var hexSha = function (text) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (h) {
        return Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    };
    var MERK = 'blpr_tresor_sicherung';
    var merkLesen = function () { try { return JSON.parse(localStorage.getItem(MERK) || '{}') || {}; } catch (e) { return {}; } };
    var sicherungLaeuft = null;
    // Automatische Sicherung: nur bei offenem Tresorordner, nur wenn sich der Bestand geändert hat, höchstens alle 10 Minuten
    // (sofort = Knopf „Jetzt sichern“). Ein Fehler bleibt sichtbar (Hinweis), nie still (Regel #2).
    var sichern = function (sofort) {
      if (sicherungLaeuft) return sicherungLaeuft;
      sicherungLaeuft = Promise.all([modul('./src/core/db.js'), modul('./src/domain/tresorordner.js'), T.zustand()]).then(function (m) {
        var db = m[0], to = m[1], z = m[2];
        if (!z || !z.offen) return { gesichert: false, grund: 'gesperrt' };
        return db.dumpAll().then(function (dump) {
          var roh = to.fingerabdruckText(dump);
          return hexSha(roh).then(function (fp) {
            var merk = merkLesen();
            if (!to.sicherungFaellig({ jetzt: Date.now(), letzteZeit: merk.zeit, letzterFingerabdruck: merk.fp, fingerabdruck: fp, sofort: !!sofort }))
              return { gesichert: false, grund: 'unveraendert' };
            var jetzt = new Date();
            var blob = new Blob([to.sicherungInhalt(dump, { erstellt: jetzt })], { type: 'application/json' });
            // Pro-Umbau 4 (Leitfaden § 3): als Hintergrundaufgabe — läuft weiter, wenn die App nicht zu sehen ist
            // (Sicherung beim Wechsel in den Hintergrund). Ohne Dienst (ältere Hülle) läuft sie wie bisher.
            var H = window.ProHintergrund;
            var beginn = H ? H.beginnen({ art: 'sichern', titel: 'BookLedgerPro: Sicherung läuft', text: 'in den Tresorordner' }).catch(function () { return null; }) : Promise.resolve(null);
            return beginn.then(function (aufgabe) {
              var ende = function (r) { if (aufgabe) aufgabe.ende(); return r; };
              var fehler = function (x) { if (aufgabe) aufgabe.ende(); throw x; };
              return ablegen('bookledgerpro', to.SICHERUNG_ORDNER, blob, to.sicherungName(jetzt), to.sicherungAuszug(dump), jetzt.getTime(), aufgabe).then(function (e) {
              if (aufgabe) aufgabe.stand('Beleg-Originale', 0, 0);
              try { localStorage.setItem(MERK, JSON.stringify({ fp: fp, zeit: Date.now(), id: e.id })); } catch (x) { /* nur Merkzettel */ }
              return modul('./src/core/durability.js').then(function (d) { return d.markBackupDone(); }).catch(function () {}).then(function () {
                try { window.dispatchEvent(new Event('blp-gesichert')); } catch (x) { /* Anzeige frischt sich sonst nach einer Minute auf */ }
                // Danach die Beleg-Originale einzeln ins Fach (nur neue, nur bei entsperrtem App-Tresor).
                return modul('./src/core/tresorBelege.js').then(function (tb) { return tb.belegeInsFach(tresor); })
                  .catch(function () { return null; })
                  .then(function (belege) { return { gesichert: true, eintrag: e, belege: belege }; });
              });
              }).then(ende, fehler);
            });
          });
        });
      }).catch(function (e) {
        hinweis('Sicherung in den Tresorordner ging nicht: ' + ((e && e.message) || e));
        return { gesichert: false, grund: 'fehler', fehler: String((e && e.message) || e) };
      }).then(function (r) { sicherungLaeuft = null; return r; });
      return sicherungLaeuft;
    };
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') sichern(false); });
    setInterval(function () { if (document.visibilityState === 'visible') sichern(false); }, 15 * 60 * 1000);
    setTimeout(function () { sichern(false); }, 20000);

    tresor = Object.freeze({
      zustand: function () { return T.zustand(); },
      ordnerWaehlen: function () { return T.ordnerWaehlen(); },
      // Klaus 2026-11-04: nur den Speicher wählen, Hauptordner finden oder anlegen, ein Passwort. Ältere Hülle → null.
      einrichten: typeof T.tresorEinrichten === 'function' ? function (merken) { return T.tresorEinrichten({ merken: !!merken }); } : null,
      anlegen: function (merken) { return T.anlegen({ merken: !!merken }); },
      entsperren: function (merken) { return T.entsperren({ merken: !!merken }); },
      sperren: function (vergessen) { return T.sperren({ vergessen: !!vergessen }); },
      appOeffnen: typeof T.appOeffnen === 'function' ? function (app) { return T.appOeffnen({ app: String(app || '') }); } : null,
      // Pro-Umbau 6: Scanner von Workflow PDF Pro direkt (Intent SCANNEN); ältere Hülle ohne die Methode → null, dann appOeffnen.
      scanStarten: typeof T.scanStarten === 'function' ? function () { return T.scanStarten(); } : null,
      ordnerOeffnen: function (welcher) { return T.ordnerOeffnen({ welcher: welcher === 'ablage' ? 'ablage' : 'tresor' }); },
      passwortAendern: function () { return T.passwortAendern(); },
      ersatzErstellen: function () { return T.ersatzErstellen(); },
      wiederherstellen: function (teile) { return T.wiederherstellen({ teile: teile }); },
      verzeichnis: function (fach) { return T.verzeichnis({ fach: fach }); },
      lesen: lesenBlob,
      markieren: function (fach, id) { return T.markieren({ fach: fach, id: id }); },
      uebergabeSenden: function (vaultId, vertrag, file) {
        if (file.size > 20 * 1024 * 1024) return Promise.reject(new Error('Höchstens 20 MiB je Pro-Übergabe.'));
        return ablegen('bookledgerpro', '', file, file.name, '', 0, null, Object.assign({}, vertrag, { vaultId: vaultId }));
      },
      uebergabeBeschreibung: function (vaultId, entryId) { return T.uebergabeBeschreibung({ vaultId: vaultId, entryId: entryId }); },
      uebergabeQuittieren: function (vaultId, entryId, sha256) { return T.uebergabeQuittieren({ vaultId: vaultId, entryId: entryId, sha256: sha256 }); },
      uebergabeStand: function (vaultId, ziel, entryId) { return T.uebergabeStand({ vaultId: vaultId, ziel: ziel, entryId: entryId }); },
      ablegen: ablegen,
      sichern: function () { return sichern(true); },
      letzteSicherung: function () { return merkLesen(); },
    });
  }

  // Versionsnummer der App (Leitfaden § 6, „Über“): nur die Zahl, ohne „-debug“.
  var version = function () {
    if (!Dateien || typeof Dateien.appInfo !== 'function') return Promise.resolve('');
    return Dateien.appInfo().then(function (r) { return ((String((r && r.version) || '')).match(/^\d+\.\d+\.\d+/) || [''])[0]; }).catch(function () { return ''; });
  };
  // Als App gibt es nichts zu installieren (Leitfaden § 4): dieselbe Marke wie nach „appinstalled“ blendet beide Knöpfe aus.
  try { document.documentElement.classList.add('app-installiert'); } catch (e) { /* nur Anzeige */ }
  // Spracheingabe (Klaus 2026-10-28): die WebView verweigert webkitSpeechRecognition („not-allowed“). Androids Sprachfenster
  // hört zu; zurück kommt nur der Text ({text, abgebrochen}). Ohne Plugin (ältere Hülle) null — dann kein Mikrofon in der App.
  var Sprache = P.BlpSpeech;
  var sprechen = Sprache && typeof Sprache.zuhoeren === 'function'
    ? function (sprache) { return Sprache.zuhoeren({ sprache: String(sprache || 'de-DE') }); } : null;
  // Windows: Schließen des Fensters (Kreuz). Läuft noch eine Aufgabe, wird gefragt; ist der Tresorordner offen, wird vorher
  // gesichert (höchstens 20 s, Regel #2). Ein zweites Schließen innerhalb von 15 s schließt immer (die Hülle wartet nicht ewig).
  if (WINDOWS && P.BlpFenster) {
    var schliesst = false;
    window.__blpSchliessen = function () {
      if (schliesst) return;
      var H = window.ProHintergrund, laufend = H && typeof H.aktiv === 'function' ? H.aktiv() : 0;
      if (laufend && !window.confirm('Es läuft noch eine Aufgabe (z. B. Sicherung oder Einordnen). Trotzdem schließen?')) return;
      schliesst = true;
      var vorher = tresor ? Promise.race([tresor.zustand().then(function (z) { if (z && z.offen) { hinweis('Sicherung vor dem Schließen …'); return sichern(false); } }),
        new Promise(function (ok) { setTimeout(ok, 20000); })]).catch(function () {}) : Promise.resolve();
      vorher.then(function () { return P.BlpFenster.schliessen(); }).catch(function () { schliesst = false; });
    };
  }
  // Updates (Leitfaden § 6, Klaus 2026-10-28): von Klaus' Server, nur mit gültiger Unterschrift (prüft die Hülle), Windows und Android.
  var U = P.BlpUpdates;
  var updates = U ? Object.freeze({
    pruefen: function () { return U.pruefen(); },
    installieren: function () { return U.installieren(); },
    beiStand: function (fn) { try { return U.addListener('stand', fn); } catch (e) { return null; } },
  }) : null;
  window.BLPNative = Object.freeze({ plattform: PLATTFORM, speichern: speichern, tresor: tresor, version: version, sprechen: sprechen, updates: updates });
})();

/* Verschlüsselte Sicherung (Brief Stufe 2, Punkt 2) — Muster: Sende-Prüfer
   assets/sicherung.js. Das Schloss ist assets/schluesseltresor.js, byte-1:1
   aus dem Sende-Prüfer (kim-hub-company 1a4528d): AES-256-GCM, PBKDF2-SHA256
   600 000 Runden. Diese Datei rechnet nur — die Oberfläche steht in app.js.

   ⚠ Die Datei verlässt das Gerät. In ihr steht deshalb KEIN Klartext: nur Art,
   Fassung, Datum und das Paket. Wie viele Vorgänge darin sind, erfährt erst,
   wer das Passwort hat. Das Passwort wird nirgends abgelegt.
   ⚠ Zurückholen FÜGT HINZU und überschreibt nie: ein Vorgang, dessen Kennung
   schon da ist, bleibt, wie er ist. Einstellungen und Tabellen kommen nur, wo
   auf diesem Gerät noch keine stehen.
   Eine alte Klartext-Sicherung (art "workflowneeds-sicherung") wird weiter
   gelesen; geschrieben wird nur noch verschlüsselt. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};
  var ART = "workflowneeds-sicherung-verschluesselt", ART_ALT = "workflowneeds-sicherung", FASSUNG = 1;
  var MIN_PW = 8, ERINNERN_TAGE = 14;
  function T() { return g.WERKSTATT_SCHLUESSEL || null; }

  /* inhalt: { vorgaenge, speicher: { einstellungen, tabellen } } (Strings aus localStorage) */
  function verschliessen(pw, inhalt, jetzt) {
    if (!T()) return Promise.reject(new Error("schloss-fehlt"));
    if (String(pw || "").length < MIN_PW) return Promise.reject(new Error("kurz"));
    var erstellt = jetzt || new Date().toISOString();
    return anhaengePacken(inhalt.vorgaenge).then(function (vs) {
      var klar = { art: ART, fassung: FASSUNG, erstellt: erstellt, vorgaenge: vs, speicher: inhalt.speicher || {} };
      return T().zu(pw, JSON.stringify(klar));
    }).then(function (paket) {
      return { art: ART, fassung: FASSUNG, erstellt: erstellt, paket: paket };
    });
  }
  function istVerschluesselt(d) { return !!(d && d.art === ART); }
  function istAlt(d) { return !!(d && d.art === ART_ALT && Array.isArray(d.vorgaenge)); }
  function oeffnen(pw, datei) {
    if (!T()) return Promise.reject(new Error("schloss-fehlt"));
    if (!istVerschluesselt(datei)) return Promise.reject(new Error("keine-sicherung"));
    if (!T().istPaketForm(datei.paket)) return Promise.reject(new Error("keine-sicherung"));
    if (datei.fassung !== FASSUNG) return Promise.reject(new Error("fassung"));
    return T().auf(pw, datei.paket).then(function (text) {
      var o = JSON.parse(text);
      if (!o || o.art !== ART || !Array.isArray(o.vorgaenge)) throw new Error("keine-sicherung");
      return { vorgaenge: anhaengeAuspacken(o.vorgaenge), speicher: o.speicher || {}, erstellt: o.erstellt };
    }, function (e) { throw new Error(e && e.message === "fassung" ? "fassung" : "passwort"); });
  }

  /* Anhänge: im Gerät als Blob, in der Sicherung als base64 — Byte für Byte, Name und Art bleiben */
  function blobZuB64(b) {
    return b.arrayBuffer().then(function (buf) {
      var a = new Uint8Array(buf), s = "", i;
      for (i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
      return g.btoa(s);
    });
  }
  function b64ZuBlob(s, typ) {
    var bin = g.atob(s), a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new g.Blob([a], { type: typ || "application/octet-stream" });
  }
  function anhaengePacken(vorgaenge) {
    return Promise.all((vorgaenge || []).map(function (v) {
      var k = JSON.parse(JSON.stringify(v, function (key, w) { return key === "blob" ? undefined : w; }));
      if (!Array.isArray(v.anhaenge) || !v.anhaenge.length) return k;
      return Promise.all(v.anhaenge.map(function (a, i) {
        var x = k.anhaenge[i];
        return a.blob && typeof a.blob.arrayBuffer === "function" ? blobZuB64(a.blob).then(function (b) { x.b64 = b; return x; }) : x;
      })).then(function (an) { k.anhaenge = an; return k; });
    }));
  }
  function anhaengeAuspacken(vorgaenge) {
    return (vorgaenge || []).map(function (v) {
      if (!v || !Array.isArray(v.anhaenge)) return v;
      v.anhaenge = v.anhaenge.map(function (a) {
        var x = Object.assign({}, a);
        if (typeof a.b64 === "string") { x.blob = b64ZuBlob(a.b64, a.typ); delete x.b64; }
        return x;
      });
      return v;
    });
  }

  /* vorhanden: Liste der Vorgänge auf dem Gerät. Gibt die NEUEN zurück. */
  function zusammenfuehren(vorhanden, geholt) {
    var da = {}, neu = [];
    (vorhanden || []).forEach(function (v) { da[v.id] = 1; });
    (geholt || []).forEach(function (v) {
      if (!v || !v.id || !Array.isArray(v.fassungen) || da[v.id]) return;
      da[v.id] = 1; neu.push(v);
    });
    return { neu: neu, schonDa: (geholt || []).length - neu.length };
  }

  /* Erinnerung: eigene (nicht Beispiel-)Vorgänge da und letzte Sicherung fehlt oder ist ≥ 14 Tage alt */
  function tageSeit(iso, jetztMs) { var z = Date.parse(iso || ""); return isNaN(z) ? Infinity : ((jetztMs || Date.now()) - z) / 86400000; }
  function erinnernNoetig(vorgaenge, zuletzt, jetztMs) {
    var eigene = (vorgaenge || []).filter(function (v) { return !v.beispiel; }).length;
    return eigene > 0 && tageSeit(zuletzt, jetztMs) >= ERINNERN_TAGE;
  }

  WN.sicherung = { ART: ART, ART_ALT: ART_ALT, FASSUNG: FASSUNG, MIN_PW: MIN_PW, ERINNERN_TAGE: ERINNERN_TAGE,
    verschliessen: verschliessen, oeffnen: oeffnen, istVerschluesselt: istVerschluesselt, istAlt: istAlt,
    zusammenfuehren: zusammenfuehren, anhaengePacken: anhaengePacken, anhaengeAuspacken: anhaengeAuspacken, tageSeit: tageSeit, erinnernNoetig: erinnernNoetig };
})(typeof window !== "undefined" ? window : globalThis);

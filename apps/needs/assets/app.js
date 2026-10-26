/* Workflow Bedarfsanalyse — die Oberfläche.
   Drei Stufen: 1 Bedarf (für den Kunden, ohne Preis) · 2 Umfang (intern) ·
   3 Angebot (für den Kunden, ohne interne Sätze). Dazu Fassungen, Tabellen,
   Einstellungen. Rechnen in assets/kern/*, hier nur Anzeige und Eingabe.
   Alles Sichtbare über textContent — nie innerHTML mit Daten. */
(function () {
  "use strict";
  var WN = window.WN, G = WN.geld, R = WN.rechnen, F = WN.fassungen, BD = WN.bedarf;
  var P = window.SbkimPseudonym || null;
  var LS = {
    einst: "workflowneeds_einstellungen", tab: "workflowneeds_tabellen", thema: "workflowneeds_thema",
    lang: "workflowneeds_lang", aktiv: "workflowneeds_aktiv", beispiel: "workflowneeds_beispiel_v1", reiter: "workflowneeds_reiter",
    sicherung: "workflowneeds_sicherung_zuletzt",
  };
  var DB_NAME = "WorkflowNeeds1", STORE = "vorgaenge";

  function lsGet(k) { try { return localStorage.getItem(k); } catch (_e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_e) {} }
  function lsJson(k, d) { try { var x = JSON.parse(lsGet(k) || "null"); return x == null ? d : x; } catch (_e) { return d; } }

  /* ── Zustand ── */
  var S = {
    vorgaenge: [], aktiv: lsGet(LS.aktiv), reiter: lsGet(LS.reiter) || "vorgaenge",
    lang: lsGet(LS.lang) === "en" ? "en" : "de", fNr: null,
    einst: Object.assign({ satzCent: 8000, ust: { modus: "regel", satz: 19 }, zeitraum: 24,
      firma: { name: "", anschrift: "", kontakt: "", steuer: "", bank: "", logo: "" },
      wartung: { freistunden: 4, wochen: 8, pauschaleCent: null } }, lsJson(LS.einst, {})),
    tabellen: null, mdOpts: { stunden: true, euro: false }, antwort: null, meldung: null,
  };
  function tabellenLaden() {
    var t = lsJson(LS.tab, null);
    S.tabellen = {
      bausteine: t && Array.isArray(t.bausteine) ? t.bausteine : F.kopie(WN.BAUSTEINE),
      faktoren: t && Array.isArray(t.faktoren) ? t.faktoren : F.kopie(WN.FAKTOREN),
      markt: t && Array.isArray(t.markt) ? t.markt : F.kopie(WN.MARKT),
    };
  }
  tabellenLaden();
  function tabellenSpeichern() { lsSet(LS.tab, JSON.stringify(S.tabellen)); }
  function einstSpeichern() { lsSet(LS.einst, JSON.stringify(S.einst)); }

  /* ── Sprache ── */
  function t(de) { return S.lang === "en" ? ((WN.EN && WN.EN[de]) || de) : de; }
  function nm(o) { return o ? (o[S.lang] || o.de) : ""; }
  function appName() { return S.lang === "en" ? "Workflow-Needs" : "Workflow Bedarfsanalyse"; }

  /* ── IndexedDB ── */
  var dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (ok, nein) {
      if (!window.indexedDB) { nein(new Error("kein IndexedDB")); return; }
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: "id" }); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { nein(r.error); };
    });
    return dbP;
  }
  function dbAlle() {
    return db().then(function (d) {
      return new Promise(function (ok, nein) {
        var q = d.transaction(STORE, "readonly").objectStore(STORE).getAll();
        q.onsuccess = function () { ok(q.result || []); }; q.onerror = function () { nein(q.error); };
      });
    });
  }
  function dbPut(v) {
    return db().then(function (d) {
      return new Promise(function (ok, nein) {
        var tx = d.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(ablage(v));
        tx.oncomplete = function () { ok(); }; tx.onerror = function () { nein(tx.error); };
      });
    });
  }
  /* Klon für IndexedDB: alles als JSON, nur die Anhänge behalten ihren Blob (IndexedDB speichert Blobs selbst) */
  function ablage(v) {
    var k = JSON.parse(JSON.stringify(v, function (key, w) { return key === "blob" ? undefined : w; }));
    if (Array.isArray(v.anhaenge)) k.anhaenge = k.anhaenge.map(function (a, i) { return Object.assign(a, { blob: v.anhaenge[i].blob }); });
    return k;
  }
  function dbDel(id) {
    return db().then(function (d) {
      return new Promise(function (ok) { var tx = d.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(id); tx.oncomplete = function () { ok(); }; });
    });
  }
  var schreibUhr = null, offen = {};
  function merken(v) {
    v = v || aktiverVorgang();
    if (!v) return;
    offen[v.id] = v;
    clearTimeout(schreibUhr);
    schreibUhr = setTimeout(jetztSpeichern, 250);
  }
  function jetztSpeichern() {
    var liste = Object.keys(offen).map(function (k) { return offen[k]; }); offen = {};
    return Promise.all(liste.map(dbPut)).catch(function () {});
  }
  window.addEventListener("pagehide", jetztSpeichern);

  /* ── Hilfen ── */
  function h(tag, a) {
    var el = document.createElement(tag);
    a = a || {};
    Object.keys(a).forEach(function (k) {
      var w = a[k];
      if (w == null || w === false) return;
      if (k === "text") el.textContent = w;
      else if (k === "class") el.className = w;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), w);
      else if (k === "value" || k === "checked" || k === "disabled" || k === "type" || k === "hidden") el[k] = w;
      else el.setAttribute(k, w === true ? "" : w);
    });
    for (var i = 2; i < arguments.length; i++) anhaengen(el, arguments[i]);
    return el;
  }
  function anhaengen(el, k) {
    if (k == null || k === false) return;
    if (Array.isArray(k)) { k.forEach(function (x) { anhaengen(el, x); }); return; }
    el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  function knopf(text, fn, cls, extra) { return h("button", Object.assign({ type: "button", class: "btn " + (cls || ""), text: text, onclick: fn }, extra || {})); }
  function euro(c) { return G.formatEuro(c, S.lang); }
  function euroG(c) { return G.formatEuroGanz(c, S.lang); }
  function std(x) { return G.formatStunden(x, S.lang); }
  function zahl(x) { if (x === "" || x == null) return null; var n = Number(String(x).replace(",", ".")); return Number.isFinite(n) ? n : null; }
  function aktiverVorgang() { return S.vorgaenge.filter(function (v) { return v.id === S.aktiv; })[0] || null; }
  function sichtFassung(v) {
    if (!v) return null;
    if (S.fNr) { var f = v.fassungen.filter(function (x) { return x.nr === S.fNr; })[0]; if (f) return f; }
    return F.aktuelle(v);
  }
  function melde(text, art) { S.meldung = { text: text, art: art || "" }; zeichne(); }

  /* Fokus über ein Neuzeichnen retten */
  function fokusMerken() {
    var a = document.activeElement;
    if (!a || !a.dataset || !a.dataset.key) return null;
    return { key: a.dataset.key, s: a.selectionStart, e: a.selectionEnd };
  }
  function fokusZurueck(f) {
    if (!f) return;
    var el = document.querySelector('[data-key="' + f.key.replace(/"/g, '\\"') + '"]');
    if (!el) return;
    el.focus({ preventScroll: true });
    try { if (f.s != null) el.setSelectionRange(f.s, f.e); } catch (_e) {}
  }

  /* ── Rahmen ── */
  var REITER = [
    ["vorgaenge", "Vorgänge"], ["bedarf", "1 Bedarf"], ["umfang", "2 Umfang"], ["angebot", "3 Angebot"],
    ["fassungen", "Fassungen"], ["tabellen", "Tabellen"], ["einstellungen", "Einstellungen"],
  ];
  function zeichneKopf() {
    document.documentElement.lang = S.lang;
    document.title = appName();
    var b = document.getElementById("app-name"); if (b) b.textContent = appName();
    var v = aktiverVorgang(), f = v && sichtFassung(v);
    var sub = document.getElementById("app-unter");
    /* Klaus 2026-10-08: oben muss stehen, in welchem Auftrag man ist — Kunde und Titel zuerst, dann die Fassung
       (wie im Angebot). Nur in der App, nie auf einem Blatt; ein leerer Kunde heißt „ohne Kunde“, nie ⟦KUNDE-1⟧. */
    if (sub) {
      var wer = v ? (v.kunde && v.kunde.firma) || (v.eigenesVorhaben ? t("eigenes Vorhaben") : t("ohne Kunde")) : "";
      var text = v ? wer + " · " + t("Fassung") + " " + f.nr + (f.unterschrieben ? " ✍ " + t("unterschrieben") : "") + (v.titel ? " · " + v.titel : "") + " · " + v.id
        : t("kein Vorgang offen");
      sub.textContent = text; sub.title = text;
      if (v) sub.setAttribute("data-kopf-kunde", wer); else sub.removeAttribute("data-kopf-kunde");
    }
    var sp = document.getElementById("sprache"); if (sp) { sp.textContent = S.lang === "en" ? "DE" : "EN"; sp.title = S.lang === "en" ? "Deutsch" : "English"; }
    var th = document.getElementById("thema");
    if (th) { var hell = document.documentElement.dataset.theme === "light"; th.textContent = hell ? "🌙" : "☀"; th.title = hell ? t("Dunkel") : t("Hell"); }
    var nav = document.getElementById("reiter");
    nav.replaceChildren();
    REITER.forEach(function (r) {
      nav.append(knopf(t(r[1]), function () { S.reiter = r[0]; lsSet(LS.reiter, r[0]); S.meldung = null; zeichne(); window.scrollTo(0, 0); },
        "chip" + (S.reiter === r[0] ? " on" : ""), { "data-reiter": r[0] }));
    });
    var an = nav.querySelector(".on");
    if (an && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, an.offsetLeft - nav.clientWidth / 2 + an.offsetWidth / 2);
  }

  function zeichne() {
    var fk = fokusMerken();
    zeichneKopf();
    var main = document.getElementById("inhalt");
    main.replaceChildren();
    main.setAttribute("data-reiter", S.reiter);   /* Ziel für den Installieren-Knopf in den Einstellungen (installieren.js data-in) */
    if (!P) main.append(h("div", { class: "hinweis bad", "data-modul25-fehlt": "" },
      t("Modul 25 (Platzhalter) ist nicht geladen. Der Bauauftrag kann deshalb weder gespeichert noch kopiert noch geteilt werden.")));
    if (S.meldung) main.append(h("div", { class: "hinweis " + (S.meldung.art || ""), role: "status", "data-meldung": "" }, S.meldung.text));
    var v = aktiverVorgang();
    if (S.reiter !== "vorgaenge" && S.reiter !== "tabellen" && S.reiter !== "einstellungen" && !v) {
      main.append(h("div", { class: "karte" }, h("p", { text: t("Noch kein Vorgang offen.") }),
        knopf("＋ " + t("Neuer Vorgang"), neuerVorgang, "pri")));
    } else {
      var fn = { vorgaenge: zVorgaenge, bedarf: zBedarf, umfang: zUmfang, angebot: zAngebot, fassungen: zFassungen,
        tabellen: zTabellen, einstellungen: zEinstellungen }[S.reiter] || zVorgaenge;
      fn(main, v);
    }
    fokusZurueck(fk);
  }

  function nurLesenBanner(main, v, f) {
    if (F.bearbeitbar(v, f)) return false;
    main.append(h("div", { class: "hinweis warn", "data-nur-lesen": "" },
      f.unterschrieben ? t("Diese Fassung ist unterschrieben und eingefroren — nur lesen. Änderungen ergeben eine neue Fassung (Reiter „Fassungen“).")
        : t("Das ist eine ältere Fassung — nur lesen."),
      S.fNr ? [" ", knopf(t("zur aktuellen Fassung"), function () { S.fNr = null; zeichne(); }, "klein")] : null));
    /* Klaus 2026-10-08: in der unterschriebenen Fassung ging die Grenzlinie „nicht mehr“ — sie ist dort gesperrt.
       Der Weg zum Ändern steht deshalb gleich hier, nicht erst im Reiter „Fassungen“. Die Unterschrift bleibt. */
    if (f.unterschrieben && f === F.aktuelle(v)) {
      var anl = h("input", { value: t("Anpassung im Umfang"), id: "anlass-hier", "data-key": "anlass-hier", style: "flex:1 1 200px" });
      var von = h("select", { id: "anlass-von-hier" }, h("option", { value: "betrieb", text: t("Betrieb") }), h("option", { value: "kunde", text: t("Kunde") }), h("option", { value: "bau", text: t("Befund beim Bau") }));
      main.append(h("div", { class: "zeile", "data-neue-fassung-hier": "" }, anl, von, knopf("✎ " + t("Neue Fassung zum Ändern"), function () {
        var r = F.neueFassung(v, { anlass: anl.value, von: von.value });
        if (!r.ok) { melde(t("Bitte einen Anlass nennen."), "warn"); return; }
        S.fNr = null; merken(v); melde(t("Fassung") + " " + r.fassung.nr + " " + t("angelegt.") + " " + t("Fassung") + " " + f.nr + " " + t("bleibt unterschrieben."), "");
      }, "pri", { id: "neue-fassung-hier" })));
    }
    return true;
  }

  /* ════ Vorgänge ════ */
  function naechsteNr() {
    var jahr = F.heute().slice(0, 4), max = 0;
    S.vorgaenge.forEach(function (v) { var m = /^V-(\d{4})-(\d+)$/.exec(v.id); if (m && m[1] === jahr) max = Math.max(max, Number(m[2])); });
    return max + 1;
  }
  function neuerVorgang() {
    var v = F.neuerVorgang(naechsteNr(), S.einst);
    S.vorgaenge.unshift(v); S.aktiv = v.id; lsSet(LS.aktiv, v.id); S.fNr = null;
    merken(v); S.reiter = "vorgaenge"; S.meldung = null; zeichne();
  }
  /* Auswahl + „Laden“ + „Alle laden“ — EINE Fassung für Vorgänge und Einstellungen (Klaus 2026-10-08:
     „gleich am Anfang, wo Neuer Vorgang steht … nicht erst in Einstellungen gehen“). Kennungen je Ort. */
  function beispielSteuerung(pre) {
    var wahl = h("select", { id: pre + "-wahl", "aria-label": t("Beispiele") });
    WN.beispiel.liste().forEach(function (b) {
      var da = S.vorgaenge.some(function (x) { return WN.beispiel.bidVon(x) === b.id; });
      wahl.append(h("option", { value: b.id, text: (da ? "✓ " : "") + nm(b.name) }));
      if (!da && !wahl.dataset.vor) { wahl.dataset.vor = b.id; }
    });
    /* vorausgewählt: das erste Beispiel, das noch nicht geladen ist */
    if (wahl.dataset.vor) wahl.value = wahl.dataset.vor;
    return [wahl,
      knopf(t("Laden"), function () { beispielLaden(wahl.value).then(function (r) { melde(r ? t("Beispiel geladen.") : t("Dieses Beispiel ist schon da — nichts doppelt angelegt."), ""); }); }, "", { id: pre + "-laden" }),
      knopf(t("Alle laden"), function () {
        var ids = WN.beispiel.liste().map(function (b) { return b.id; }), n = 0;
        ids.reduce(function (pr, id) { return pr.then(function () { return beispielLaden(id).then(function (r) { if (r) n++; }); }); }, Promise.resolve())
          .then(function () { melde(n + " " + t("Beispiele geladen,") + " " + (ids.length - n) + " " + t("waren schon da."), ""); });
      }, "", { id: pre + "-alle" })];
  }
  function zVorgaenge(main, v) {
    main.append(h("div", { class: "karte held", "data-held": "" },
      h("img", { src: "assets/bild-prisma.webp", alt: "", width: "120", height: "120" }),
      h("div", null, h("h2", { text: appName() }),
        h("p", { class: "gedaempft", text: t("Bedarf erfassen, Umfang schätzen, Angebot drucken — Kundendaten gehen nie hinaus.") }))));
    erinnerungSicherung(main);
    main.append(h("div", { class: "band vorgang-start", style: "margin-bottom:12px" },
      knopf("＋ " + t("Neuer Vorgang"), neuerVorgang, "pri", { id: "neuer-vorgang" }),
      h("span", { class: "beispiel-start", "data-beispiel-start": "" }, h("span", { class: "gedaempft klein", text: t("oder ein Beispiel ansehen:") }), beispielSteuerung("vg-beispiel"))));
    var liste = h("div", { class: "karte", "data-vorgangsliste": "" }, h("h2", { text: t("Vorgänge") }));
    if (!S.vorgaenge.length) liste.append(h("p", { class: "gedaempft", text: t("Noch keine Vorgänge.") }));
    S.vorgaenge.forEach(function (x) {
      var f = F.aktuelle(x);
      liste.append(h("div", { class: "eintrag", "data-vorgang": x.id },
        h("span", { class: "badge kennung", text: x.id }),
        h("div", null, h("b", { text: x.titel || t("(ohne Titel)") }), " ",
          h("span", { class: "gedaempft klein", text: (x.kunde.firma || (x.eigenesVorhaben ? t("eigenes Vorhaben") : t("ohne Kunde"))) + " · " + t("Fassung") + " " + f.nr + (f.unterschrieben ? " ✍" : "") })),
        h("div", { class: "band" },
          knopf(x.id === S.aktiv ? t("offen") : t("Öffnen"), function () { S.aktiv = x.id; lsSet(LS.aktiv, x.id); S.fNr = null; S.meldung = null; zeichne(); }, "klein" + (x.id === S.aktiv ? " on" : "")),
          knopf(t("Duplizieren"), function () {
            var k = F.kopie(x); k.id = F.neuerVorgang(naechsteNr(), S.einst).id; k.titel = (x.titel || "") + " (" + t("Kopie") + ")";
            k.fassungen = [F.kopie(F.aktuelle(x))]; k.fassungen[0].nr = 1; k.fassungen[0].unterschrieben = null; k.fassungen[0].ust = null; k.fassungen[0].anlass = ""; k.fassungen[0].von = "";
            k.fassungen[0].angebot.nummer = "AN-" + k.id.slice(2);
            if (Array.isArray(x.anhaenge)) k.anhaenge = k.anhaenge.map(function (a, i) { return Object.assign(a, { blob: x.anhaenge[i].blob }); });
            delete k.beispiel;
            S.vorgaenge.unshift(k); merken(k); zeichne();
          }, "klein"),
          knopf(t("Löschen"), function () {
            if (!confirm(t("Diesen Vorgang mit allen Fassungen löschen?") + "\n" + x.id)) return;
            S.vorgaenge = S.vorgaenge.filter(function (y) { return y !== x; });
            if (S.aktiv === x.id) S.aktiv = null;
            dbDel(x.id); zeichne();
          }, "klein gefahr"))));
    });
    main.append(liste);
    if (v) zVorgangDaten(main, v);
  }

  function zVorgangDaten(main, v) {
    var er = v.erklaerung && v.erklaerung.aktiviert;
    var k = h("div", { class: "karte", "data-vorgang-daten": "" }, h("div", { class: "bereich-kopf" }, h("h2", { text: t("Vorgang") + " " + v.id }),
      v.eigenesVorhaben ? null : h("span", { class: "badge" + (er ? "" : " gelb"), "data-erklaerung-status": er ? "aktiviert" : "offen",
        text: "🔏 " + t("Verschwiegenheitserklärung") + ": " + (er ? t("aktiviert am") + " " + datumText(v.erklaerung.aktiviert) : t("offen")) })));
    k.append(h("label", { class: "feld" }, t("Vorhaben (Titel)"),
      h("input", { value: v.titel, "data-key": "titel", oninput: function (e) { v.titel = e.target.value; merken(v); } })));
    k.append(h("h3", { style: "margin-top:12px", text: t("Kunde") }),
      h("p", { class: "gedaempft klein", text: t("Optional und jederzeit nachtragbar. Im Bauauftrag stehen immer die Platzhalter, auf den Kundenausdrucken der Klartext.") }));
    var z = h("div", { class: "zeile" });
    WN.KUNDENFELDER.forEach(function (f) {
      z.append(h("label", { class: "feld" }, nm(f.name) + " · " + f.token,
        h("input", { value: v.kunde[f.id] || "", "data-key": "kunde-" + f.id, "data-kundenfeld": f.id,
          oninput: function (e) { v.kunde[f.id] = e.target.value; merken(v); } })));
    });
    k.append(z);
    k.append(h("label", { class: "schalter", style: "margin-top:8px" },
      h("input", { type: "checkbox", checked: !!v.eigenesVorhaben, id: "eigenes-vorhaben", onchange: function (e) { v.eigenesVorhaben = e.target.checked; merken(v); zeichne(); } }),
      t("Eigenes Vorhaben (keine Kundendaten)")));
    if (v.eigenesVorhaben) k.append(h("div", { class: "hinweis warn", text: t("Eigenes Vorhaben: im Bauauftrag wird NICHTS verdeckt (verdeckt: nein).") }));
    k.append(h("label", { class: "feld", style: "margin-top:10px" }, t("Weitere Namen und Begriffe (eine Zeile je Eintrag, Komma erlaubt)"),
      h("textarea", { value: v.weitereNamen || "", id: "weitere-namen", "data-key": "weitere-namen",
        oninput: function (e) { v.weitereNamen = e.target.value; merken(v); }, onchange: function () { zeichne(); } })));
    k.append(h("p", { class: "gedaempft klein", text: t("Was Modul 25 nicht von selbst erkennt (ein Name, „der einzige Bäcker in X“), bleibt im Klartext — bis es hier eingetragen ist. Dann wird es in allen Fassungen verdeckt. Platzhalter sind keine Verschlüsselung: der Klartext geht gar nicht erst hinaus.") }));
    /* Namensvorschläge — verdecken nichts */
    var vs = vorschlaege(v);
    var box = h("div", { "data-namen-vorschlag": "", "data-anzahl": String(vs.length) });
    if (vs.length) {
      box.append(h("span", { class: "gedaempft klein", text: t("Vorschlag aus dem Text — verdeckt erst nach einem Tipp:") + " " }));
      vs.forEach(function (n) {
        box.append(knopf("＋ " + n, function () {
          var l = WN.bauauftrag.namenListe(v.weitereNamen); if (l.indexOf(n) < 0) l.push(n);
          v.weitereNamen = l.join("\n"); merken(v); zeichne();
        }, "chip klein", { "data-vorschlag": n }));
      });
    }
    k.append(box);
    main.append(k);
    if (!v.eigenesVorhaben) main.append(rechtsKarte(v, "erklaerung"));
    main.append(anhaengeKarte(v));
  }

  /* ── Anhänge am Vorgang (Klaus 2026-10-07): Bilder, PDFs, Mails, Screenshots — damit der Umfang
     sichtbar wird. Byte für Byte, Name und Art bleiben (PDF bleibt PDF, .eml bleibt Mail). Sie gehen
     NICHT in die Bauauftrags-MD (dort stünde Klartext) und NICHT in Angebot oder Bedarfsprotokoll. ── */
  var ANHANG_MAX = 25 * 1024 * 1024;
  function groesse(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return Math.round(n / 1024) + " KB";
    var x = (n / 1048576).toFixed(1); return (S.lang === "en" ? x : x.replace(".", ",")) + " MB";
  }
  function anhangArt(a) {
    var ty = a.typ || "", n = (a.name || "").toLowerCase();
    if (/^image\//.test(ty)) return "Bild";
    if (ty === "application/pdf" || /\.pdf$/.test(n)) return "PDF";
    if (ty === "message/rfc822" || /\.eml$/.test(n)) return "E-Mail";
    return "Datei";
  }
  function anhaengeDazu(v, dateien) {
    var zuGross = [], dazu = 0;
    v.anhaenge = v.anhaenge || [];
    Array.prototype.forEach.call(dateien || [], function (d) {
      if (!d) return;
      if (d.size > ANHANG_MAX) { zuGross.push(d.name); return; }
      v.anhaenge.push({ id: BD.neueKennung(v, "A"), name: d.name || "anhang", typ: d.type || "", groesse: d.size, datum: F.heute(), blob: d });
      dazu++;
    });
    if (dazu) { merken(v); jetztSpeichern(); }
    melde(dazu + " " + t("Anhang/Anhänge dazu.") + (zuGross.length ? " " + t("Zu groß (höchstens 25 MB), nicht übernommen:") + " " + zuGross.join(", ") : ""), zuGross.length ? "warn" : "");
  }
  function screenshotName() {
    var d = new Date(), z = function (n) { return ("0" + n).slice(-2); };
    return "Screenshot-" + F.heute() + "-" + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds());
  }
  function ausZwischenablage(v) {
    if (!navigator.clipboard || !navigator.clipboard.read) { melde(t("Dieser Browser gibt die Zwischenablage nicht her — Strg+V im Abschnitt oder „Datei wählen“ nehmen."), "warn"); return; }
    navigator.clipboard.read().then(function (items) {
      var holen = [];
      items.forEach(function (it) {
        var ty = it.types.filter(function (x) { return /^image\//.test(x); })[0];
        if (ty) holen.push(it.getType(ty).then(function (b) { return new File([b], screenshotName() + "." + (ty.split("/")[1] || "png"), { type: ty }); }));
      });
      if (!holen.length) { melde(t("In der Zwischenablage liegt kein Bild."), "warn"); return; }
      Promise.all(holen).then(function (fs) { anhaengeDazu(v, fs); });
    }, function () { melde(t("Dieser Browser gibt die Zwischenablage nicht her — Strg+V im Abschnitt oder „Datei wählen“ nehmen."), "warn"); });
  }
  function anhaengeKarte(v) {
    var k = h("div", { class: "karte intern", id: "anhaenge", "data-anhaenge": String((v.anhaenge || []).length), tabindex: "0" },
      h("h2", { text: "📎 " + t("Anhänge zum Vorgang") }),
      h("p", { class: "gedaempft klein", text: t("Bilder, Screenshots, PDFs, Mails, Dateien vom Kunden — damit der Umfang sichtbar wird. Jede Datei bleibt, wie sie ist (PDF als PDF, Mail als .eml). Nur auf diesem Gerät und in der verschlüsselten Sicherung; nie in Bauauftrag, Angebot oder Bedarfsprotokoll.") }));
    var ein = h("input", { type: "file", multiple: true, hidden: true, id: "anhang-datei", onchange: function (e) { anhaengeDazu(v, e.target.files); e.target.value = ""; } });
    k.append(h("div", { class: "band" },
      h("label", { class: "btn" }, "📎 " + t("Datei wählen"), ein),
      knopf("📋 " + t("Screenshot einfügen"), function () { ausZwischenablage(v); }, "", { id: "anhang-einfuegen" })));
    k.addEventListener("paste", function (e) {
      var fs = Array.prototype.slice.call((e.clipboardData && e.clipboardData.files) || []);
      if (!fs.length) return;
      e.preventDefault();
      anhaengeDazu(v, fs.map(function (d) { return d.name && d.name !== "image.png" ? d : new File([d], screenshotName() + ".png", { type: d.type || "image/png" }); }));
    });
    var L = v.anhaenge || [];
    if (!L.length) k.append(h("p", { class: "gedaempft", text: t("Noch keine Anhänge.") }));
    var summe = 0;
    L.forEach(function (a) {
      summe += a.groesse || 0;
      var z = h("div", { class: "eintrag", "data-anhang": a.id, "data-art": anhangArt(a) },
        h("span", { class: "badge kennung", text: a.id }));
      var mitte = h("div", { style: "min-width:0" }, h("b", { text: a.name, style: "overflow-wrap:anywhere" }), " ",
        h("span", { class: "gedaempft klein", text: t(anhangArt(a)) + " · " + groesse(a.groesse || 0) + (a.blob ? "" : " · " + t("Inhalt fehlt")) }));
      if (a.blob && /^image\/(png|jpeg|webp|gif)$/.test(a.typ || "")) {
        var u = URL.createObjectURL(a.blob);
        mitte.append(h("div", null, h("img", { src: u, alt: a.name, class: "anhang-bild", title: t("Ansehen"), style: "cursor:pointer", onclick: function () { anhangAnsehen(a); }, onload: function () { URL.revokeObjectURL(u); } })));
      }
      z.append(mitte, h("div", { class: "band" },
        a.blob ? knopf("👁 " + t("Ansehen"), function () { anhangAnsehen(a); }, "klein", { "data-anhang-ansehen": a.id, "aria-label": t("Ansehen") + ": " + a.name }) : null,
        a.blob ? knopf("⬇ " + t("Speichern"), function () { laden(a.blob, a.name); }, "klein", { "data-anhang-laden": a.id }) : null,
        knopf("✕", function () {
          if (!confirm(t("Diesen Anhang entfernen?") + "\n" + a.name)) return;
          v.anhaenge = v.anhaenge.filter(function (x) { return x !== a; }); merken(v); zeichne();
        }, "klein gefahr", { "aria-label": t("Anhang entfernen"), "data-anhang-weg": a.id })));
      k.append(z);
    });
    if (L.length) k.append(h("p", { class: "gedaempft klein", "data-anhang-summe": String(summe), text: L.length + " " + t("Anhang/Anhänge") + " · " + groesse(summe) }));
    return k;
  }


  /* ════ 👁 Ansicht eines Anhangs (Klaus 2026-10-08: „mit einem Auge … als Voransicht größer gemacht
     werden … ob es die richtigen Dokumente sind … komplett drauf“) ════
     Bild eingepasst (keine Lupe, Klaus 2026-10-08) · PDF: alle Seiten, gezeichnet mit pdf.js (Android-Chrome
     zeigt PDFs nicht in einem Rahmen) · E-Mail: Kopf, Text, Anhänge (die man wieder ansehen kann) ·
     Text/CSV als Text. NICHTS wird ausgeführt: HTML und SVG-Quelltext erscheinen als Text, nie als Seite. */
  var PDFJS = "vendor/pdfjs/", pdfjsHolen = null;
  function pdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfjsHolen) return pdfjsHolen;
    pdfjsHolen = new Promise(function (ok, nein) {
      var sc = document.createElement("script"), uhr = setTimeout(function () { nein(new Error("pdf.js kam nicht an")); }, 20000);
      sc.src = PDFJS + "pdf.min.js";
      sc.onload = function () { clearTimeout(uhr); if (!window.pdfjsLib) return nein(new Error("pdf.js meldet sich nicht")); window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; ok(window.pdfjsLib); };
      sc.onerror = function () { clearTimeout(uhr); nein(new Error("pdf.js kam nicht an")); };
      document.head.appendChild(sc);
    });
    pdfjsHolen.catch(function () { pdfjsHolen = null; });
    return pdfjsHolen;
  }
  function ansichtArt(typ, name) {
    typ = String(typ || "").toLowerCase(); name = String(name || "").toLowerCase();
    if (/^image\/(png|jpeg|webp|gif|bmp)$/.test(typ) || /\.(png|jpe?g|webp|gif|bmp)$/.test(name)) return "bild";
    if (typ === "application/pdf" || /\.pdf$/.test(name)) return "pdf";
    if (typ === "message/rfc822" || /\.eml$/.test(name)) return "mail";
    if (/^text\//.test(typ) || /(json|xml|svg)/.test(typ) || /\.(txt|csv|md|json|xml|svg|html?|log)$/.test(name)) return "text";
    return "";
  }
  function blobLatin1(blob) { return blob.arrayBuffer().then(function (ab) { var u = new Uint8Array(ab), s = ""; for (var i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return s; }); }
  function ansichtInhalt(blob, typ, name, ziel, ebene) {
    var art = ansichtArt(typ, name);
    ziel.dataset.ansichtArt = art || "keine";
    if (art === "bild") {
      var u = URL.createObjectURL(blob);
      /* Klaus 2026-10-08: „Ansehen ist ja schon die Vergrößerung … Lupe wegnehmen“ — kein Tipp-Zoom, kein Lupen-Zeiger */
      var img = h("img", { src: u, alt: name, class: "ansicht-bild", "data-ansicht-bild": "" });
      ziel.append(img); return Promise.resolve();
    }
    if (art === "pdf") {
      var hin = h("p", { class: "gedaempft", "data-ansicht-laedt": "", text: t("PDF wird gezeichnet …") });
      ziel.append(hin);
      return Promise.all([pdfjs(), blob.arrayBuffer()]).then(function (r) {
        return r[0].getDocument({ data: new Uint8Array(r[1]), isEvalSupported: false }).promise;
      }).then(function (doc) {
        hin.textContent = doc.numPages + " " + t("Seite(n)");
        var breite = Math.max(320, Math.min(1400, (ziel.clientWidth || 800) - 8)), dpr = Math.min(window.devicePixelRatio || 1, 2);
        var kette = Promise.resolve();
        for (var n = 1; n <= doc.numPages; n++) (function (n) {
          kette = kette.then(function () { return doc.getPage(n); }).then(function (pg) {
            var v1 = pg.getViewport({ scale: 1 }), sc = breite / v1.width, vp = pg.getViewport({ scale: sc * dpr });
            var c = h("canvas", { class: "ansicht-seite", "data-ansicht-seite": String(n), width: String(Math.round(vp.width)), height: String(Math.round(vp.height)), "aria-label": t("Seite") + " " + n });
            ziel.append(c);
            return pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
          });
        })(n);
        return kette;
      }).catch(function (e) {
        hin.textContent = t("Die PDF ließ sich hier nicht zeichnen") + " (" + (e && e.message || e) + "). " + t("Über „Speichern“ öffnet sie das PDF-Programm des Geräts.");
        hin.dataset.ansichtFehler = "";
      });
    }
    if (art === "mail") {
      return blobLatin1(blob).then(function (roh) {
        var m = WN.mail.lesen(roh);
        var kopf = h("table", { class: "ansicht-kopf klein", "data-ansicht-mail": "" });
        [["Von", m.kopf.von], ["An", m.kopf.an], ["Cc", m.kopf.cc], ["Betreff", m.kopf.betreff], ["Datum", m.kopf.datum]].forEach(function (z) {
          if (z[1]) kopf.append(h("tr", null, h("th", { text: t(z[0]) }), h("td", { text: z[1] })));
        });
        ziel.append(kopf, h("pre", { class: "ansicht-text", "data-ansicht-mailtext": "", text: m.text || t("(kein Text)") }));
        if (m.anhaenge.length) {
          var liste = h("div", { class: "ansicht-anhaenge", "data-ansicht-mailanhaenge": String(m.anhaenge.length) }, h("b", { text: "📎 " + t("Anhänge der E-Mail") }));
          m.anhaenge.forEach(function (a, i) {
            var b = new Blob([a.bytes], { type: a.typ });
            liste.append(h("div", { class: "eintrag" }, h("span", { text: a.name + " · " + groesse(a.groesse) }),
              h("div", { class: "band" },
                ansichtArt(a.typ, a.name) && ebene < 3 ? knopf("👁 " + t("Ansehen"), function () { var sub = h("div", { class: "ansicht-unter", "data-ansicht-unter": String(i) }); liste.after(sub); ansichtInhalt(b, a.typ, a.name, sub, ebene + 1); }, "klein", { "data-mailanhang-ansehen": String(i) }) : null,
                knopf("⬇ " + t("Speichern"), function () { laden(b, a.name); }, "klein"))));
          });
          ziel.append(liste);
        }
      });
    }
    if (art === "text") {
      return blob.text().then(function (s) { ziel.append(h("pre", { class: "ansicht-text", "data-ansicht-text": "", text: s.length > 200000 ? s.slice(0, 200000) + "\n…" : s })); });
    }
    ziel.append(h("p", { class: "gedaempft", "data-ansicht-keine": "", text: t("Für diese Dateiart gibt es keine Voransicht. Über „Speichern“ öffnet das passende Programm sie.") }));
    return Promise.resolve();
  }
  function anhangAnsehen(a) {
    var dlg = document.getElementById("ansicht");
    var inhalt = h("div", { class: "ansicht-inhalt" });
    dlg.replaceChildren(h("div", { class: "vorschau-kopf" },
      h("b", { text: a.name, style: "overflow-wrap:anywhere" }), h("span", { class: "gedaempft klein", text: t(anhangArt(a)) + " · " + groesse(a.groesse || 0) }),
      h("div", { class: "band" }, knopf("⬇ " + t("Speichern"), function () { laden(a.blob, a.name); }, "klein"),
        knopf("✕", function () { dlg.close(); }, "klein", { "aria-label": t("Schließen"), "data-ansicht-zu": "" }))), inhalt);
    dlg.dataset.anhang = a.id;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    dlg.dataset.fertig = "";
    return ansichtInhalt(a.blob, a.typ, a.name, inhalt, 0).then(function () { dlg.dataset.fertig = "1"; });
  }

  function alleTexte(f) {
    var out = [];
    BD.alleEintraege(f.protokoll).forEach(function (x) { out.push(x.e.text || ""); if (x.e.nutzen && x.e.nutzen.text) out.push(x.e.nutzen.text); if (x.e.wer) out.push(x.e.wer); });
    return out.join("\n");
  }
  function vorschlaege(v) {
    if (!P || typeof P.suggestNames !== "function") return [];
    try {
      var b = WN.bauauftrag.bekannte(v);
      var seen = {};
      return P.suggestNames(alleTexte(F.aktuelle(v)), { values: b.values.map(function (x) { return x.value; }) })
        .map(function (x) { return x.name; }).filter(function (n) { if (seen[n]) return false; seen[n] = 1; return true; });
    } catch (_e) { return []; }
  }

  /* ════ 1 Bedarf ════ */
  function zBedarf(main, v) {
    var f = sichtFassung(v), ro = nurLesenBanner(main, v, f);
    var def = h("details", { class: "karte", "data-definition": "" },
      h("summary", { text: t("Was ist ein Bedarfsprotokoll?") }),
      h("p", { text: WN.DEFINITION[S.lang] }), h("p", null, h("b", { text: nm(WN.DEFINITION.kette) })), h("p", { class: "gedaempft", text: nm(WN.DEFINITION.abgrenzung) }),
      h("p", { class: "gedaempft klein", text: t("Stufe 1 enthält keine Technikwahl, keine Stunden und keinen Preis.") }));
    main.append(def);
    var n = BD.fortschritt(f.protokoll);
    main.append(h("div", { class: "karte" },
      h("div", { class: "bereich-kopf" }, h("b", { "data-fortschritt": String(n), text: n + " " + t("von 18 ausgefüllt") }),
        h("div", { class: "band" },
          knopf("👁 " + t("Vorschau für den Kunden"), function () { vorschau("protokoll"); }, "", { id: "vorschau-protokoll" }),
          knopf("🖨 " + t("Bedarfsprotokoll"), function () { drucke("protokoll"); }, "pri", { id: "druck-protokoll" }),
          knopf("🖨 " + t("Bedarfsanalyse"), function () { drucke("analyse"); }, "", { id: "druck-analyse" }))),
      h("div", { class: "fortschritt", style: "margin-top:8px" }, h("i", { style: "width:" + Math.round(n / 18 * 100) + "%" })),
      h("p", { class: "gedaempft klein", text: t("„Bedarfsprotokoll“ geht an den Kunden (nur Freigegebenes). „Bedarfsanalyse“ ist für Sie: alles, samt internen Punkten und Notizen.") })));
    WN.BEREICHE.forEach(function (b) { main.append(bereichKarte(v, f, b, ro)); });
    main.append(sterneKarte(v, f));
  }

  function sichtSchalter(obj, ro, key, v) {
    return h("label", { class: "schalter", title: t("Erscheint nur im Kundenausdruck, wenn freigegeben") },
      h("input", { type: "checkbox", checked: !!obj.sichtbar, disabled: ro, "data-key": key, "data-sichtbar": "",
        onchange: function (e) { obj.sichtbar = e.target.checked; merken(v); zeichne(); } }),
      obj.sichtbar ? "👁 " + t("für den Kunden") : "🔒 " + t("nur für mich"));
  }

  function bereichKarte(v, f, b, ro) {
    var roh = f.protokoll.bereiche[b.nr];
    var karte = h("section", { class: "karte" + (roh.sichtbar ? "" : " intern"), "data-bereich": String(b.nr) });
    karte.append(h("div", { class: "bereich-kopf" },
      h("h3", { text: b.nr + " · " + nm(b.name) + (BD.ausgefuellt(f.protokoll, b.nr) ? " ✓" : "") }),
      sichtSchalter(roh, ro, "bs-" + b.nr, v)));
    if (!roh.sichtbar) karte.append(h("div", { class: "intern-satz", text: "🔒 " + t("Bereich erscheint nicht im Kundenausdruck") }));
    if (b.nr === 8) karte.append(h("p", { class: "gedaempft klein", text: nm(WN.HINWEIS_8) }));

    if (b.art === "prio" || b.art === "nutzen") {
      var bed = BD.bedarfe(f.protokoll);
      if (!bed.length) karte.append(h("p", { class: "gedaempft klein", text: t("Erst in Bereich 6 einen Bedarf eintragen.") }));
      bed.forEach(function (e) { karte.append(b.art === "prio" ? prioZeile(v, e, ro) : nutzenZeile(v, f, e, ro)); });
    } else {
      roh.eintraege.forEach(function (e) { karte.append(eintragZeile(v, f, b, e, ro)); });
      if (!ro) {
        if (b.chips.length) {
          var chips = h("div", { class: "band", style: "margin:6px 0" });
          b.chips.forEach(function (c) {
            var txt = nm(c);
            var da = roh.eintraege.filter(function (e) { return e.text === txt || e.text === c.de; })[0];
            chips.append(knopf((da ? "✓ " : "＋ ") + txt, function () {
              if (da) roh.eintraege = roh.eintraege.filter(function (x) { return x !== da; });
              else BD.eintragNeu(v, f.protokoll, b.nr, txt);
              merken(v); zeichne();
            }, "chip klein" + (da ? " on" : ""), { "data-chip": c.de }));
          });
          karte.append(chips);
        }
        var inp = h("input", { placeholder: b.nr === 8 ? nm(WN.HINWEIS_8) : t("Neuer Eintrag …"), "data-key": "neu-" + b.nr, "data-neu-eintrag": String(b.nr), style: "flex:1 1 220px" });
        var dazu = function () {
          if (!inp.value.trim()) return;
          BD.eintragNeu(v, f.protokoll, b.nr, inp.value); inp.value = ""; merken(v); zeichne();
          var n2 = document.querySelector('[data-neu-eintrag="' + b.nr + '"]'); if (n2) n2.focus();
        };
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); dazu(); } });
        karte.append(h("div", { class: "zeile" }, inp, knopf("＋", dazu, "klein", { "data-dazu": String(b.nr), "aria-label": t("Eintrag hinzufügen") })));
      }
    }
    karte.append(h("label", { class: "feld", style: "margin-top:8px" }, "🔒 " + t("Interne Notiz (erscheint nie im Kundenausdruck)"),
      h("textarea", { value: roh.notiz || "", disabled: ro, "data-key": "notiz-" + b.nr, "data-notiz": String(b.nr), rows: 2,
        oninput: function (e) { roh.notiz = e.target.value; merken(v); } })));
    return karte;
  }

  function eintragZeile(v, f, b, e, ro) {
    var roh = f.protokoll.bereiche[b.nr];
    var z = h("div", { class: "eintrag" + (e.sichtbar ? "" : " intern"), "data-eintrag": e.id });
    z.append(h("span", { class: "badge kennung", text: e.id }));
    z.append(h("input", { class: "text", value: e.text, disabled: ro, "data-key": "t-" + e.id, oninput: function (ev) { e.text = ev.target.value; merken(v); } }));
    z.append(ro ? h("span") : knopf("✕", function () {
      roh.eintraege = roh.eintraege.filter(function (x) { return x !== e; });
      (f.umfang.bausteine || []).forEach(function (bs) { bs.deckt = (bs.deckt || []).filter(function (id) { return id !== e.id; }); });
      merken(v); zeichne();
    }, "klein gefahr", { "aria-label": t("Eintrag entfernen"), "data-weg": e.id }));
    var mehr = h("div", { class: "mehr" });
    if (b.nr === 3) mehr.append(t("Anzahl"), zaehler(e.anzahl || 0, ro, function (n) { e.anzahl = Math.max(0, n); merken(v); zeichne(); }, "anz-" + e.id));
    if (b.nr === 18) {
      mehr.append(h("input", { class: "mittel", placeholder: t("wer klärt"), value: e.wer || "", disabled: ro, "data-key": "wer-" + e.id, oninput: function (ev) { e.wer = ev.target.value; merken(v); } }),
        h("input", { type: "date", value: e.bis || "", disabled: ro, "data-key": "bis-" + e.id, onchange: function (ev) { e.bis = ev.target.value; merken(v); } }));
    }
    mehr.append(sichtSchalter(e, ro, "s-" + e.id, v));
    if (!e.sichtbar) mehr.append(h("span", { class: "intern-satz", text: t("erscheint nicht im Kundenausdruck") }));
    z.append(mehr);
    return z;
  }
  function zaehler(n, ro, fn, key) {
    return h("span", { class: "zaehler", "data-zaehler": key },
      h("button", { type: "button", text: "−", disabled: ro, "aria-label": "−", onclick: function () { fn(n - 1); } }),
      h("output", { text: std(n) }),
      h("button", { type: "button", text: "+", disabled: ro, "aria-label": "+", onclick: function () { fn(n + 1); } }));
  }
  function prioZeile(v, e, ro) {
    var seg = h("span", { class: "seg", "data-prio": e.id });
    WN.PRIOS.forEach(function (p) {
      seg.append(h("button", { type: "button", class: e.prio === p ? "on" : "", disabled: ro, text: nm(WN.PRIO_NAME[p]),
        onclick: function () { e.prio = e.prio === p ? "" : p; merken(v); zeichne(); } }));
    });
    return h("div", { class: "eintrag" }, h("span", { class: "badge kennung", text: e.id }), h("span", { text: e.text }), seg);
  }
  function nutzenZeile(v, f, e, ro) {
    e.nutzen = e.nutzen || { stundenMonat: null, euroMonat: null, text: "" };
    var u = e.nutzen;
    return h("div", { class: "eintrag", "data-nutzen": e.id },
      h("span", { class: "badge kennung", text: e.id }), h("span", { text: e.text }), h("span"),
      h("div", { class: "mehr" },
        h("label", { class: "feld", style: "flex:0 1 120px" }, t("Zeit gespart h/Monat"),
          h("input", { type: "number", min: "0", step: "0.5", class: "kurz", value: u.stundenMonat == null ? "" : u.stundenMonat, disabled: ro, "data-key": "nh-" + e.id,
            onchange: function (ev) { u.stundenMonat = zahl(ev.target.value); merken(v); zeichne(); } })),
        h("label", { class: "feld", style: "flex:0 1 120px" }, t("€/Monat (Umsatz, weniger Fehler)"),
          h("input", { type: "number", min: "0", step: "10", class: "kurz", value: u.euroMonat == null ? "" : u.euroMonat, disabled: ro, "data-key": "ne-" + e.id,
            onchange: function (ev) { u.euroMonat = zahl(ev.target.value); merken(v); zeichne(); } })),
        h("label", { class: "feld" }, t("in Worten"),
          h("input", { value: u.text || "", disabled: ro, "data-key": "nt-" + e.id, oninput: function (ev) { u.text = ev.target.value; merken(v); } })),
        h("span", { class: "gedaempft klein", text: t("Angabe des Kunden") })));
  }

  /* ════ 2 Umfang (Analyse, intern) ════ */
  function abgeleitet(f) {
    /* Vorschläge aus Stufe 1 — schreiben nie zurück */
    var regeln = [[/schnittstelle|austausch|datev|kasse|buchhaltung.*(?:übergeben|exportieren)/i, "schnitt"], [/lager|bestand|warenwirtschaft/i, "lager"],
      [/buchhaltung|rechnung/i, "rechnung"], [/dokument|scan|pdf|formular/i, "scan"], [/altbestand|übernehmen|alte daten|excel/i, "altdaten"],
      [/internetseite|webseite|homepage|website/i, "seite"], [/termin|auftr[aä]g|zeit/i, "auftrag"], [/notiz|liste/i, "liste"]];
    var schon = {}; (f.umfang.bausteine || []).forEach(function (b) { if (b.katalog) schon[b.katalog] = 1; });
    var gedeckt = {}; (f.umfang.bausteine || []).forEach(function (b) { (b.deckt || []).forEach(function (id) { gedeckt[id] = 1; }); });
    var out = {};
    BD.alleEintraege(f.protokoll).forEach(function (x) {
      if (x.nr === 16 || x.nr === 17 || x.nr === 18 || gedeckt[x.e.id]) return;
      regeln.forEach(function (r) { if (!schon[r[1]] && r[0].test(x.e.text || "")) (out[r[1]] = out[r[1]] || []).push(x.e.id); });
    });
    return out;
  }
  function zUmfang(main, v) {
    var f = sichtFassung(v), ro = nurLesenBanner(main, v, f);
    var u = f.umfang, s = R.schaetze(f, S.tabellen), kn = R.kostenNutzen(f, s, S.einst.zeitraum);
    main.append(h("div", { class: "hinweis intern" }, "🔒 " + t("Analyse — intern. Nichts von dieser Seite erscheint auf Angebot, Nachtrag oder Bedarfsprotokoll.")));
    /* Satz für diesen Auftrag */
    var satzAbw = f.satzCent !== S.einst.satzCent;
    main.append(h("div", { class: "karte", "data-satz-karte": "" },
      h("div", { class: "zeile" },
        h("label", { class: "feld", style: "flex:0 1 auto" }, h("b", { text: t("Stundensatz für diesen Auftrag (netto)") }),
          h("span", { class: "zeile", style: "margin:0" },
            h("input", { type: "number", min: "0", step: "1", class: "kurz", id: "satz-vorgang", value: f.satzCent / 100, disabled: ro, "data-key": "satz",
              "data-manuell": satzAbw ? "1" : "0", onchange: function (e) { var c = G.parseEuroToCents(e.target.value); if (Number.isFinite(c) && c >= 0) { f.satzCent = c; merken(v); } zeichne(); } }), " €")),
        h("span", { class: "gedaempft", "data-satz-vorgabe": "" }, t("Vorgabe") + " " + euroG(S.einst.satzCent)),
        satzAbw && !ro ? knopf("↺ " + t("Vorgabe"), function () { f.satzCent = S.einst.satzCent; merken(v); zeichne(); }, "klein", { id: "satz-zurueck" }) : null),
      satzAbw ? h("div", { class: "hinweis warn", "data-satz-abweichung": "" }, t("Dieser Auftrag rechnet mit") + " " + euroG(f.satzCent) + " · " + t("Vorgabe") + " " + euroG(S.einst.satzCent)) : null,
      f.unterschrieben ? h("p", { class: "gedaempft klein", text: t("Unterschriebene Fassung: dieser Satz gilt für immer.") }) : null));

    var spalten = h("div", { class: "spalten" });
    var links = h("div"), rechts = h("div", { class: "ergebnis" });
    spalten.append(links, rechts); main.append(spalten);

    /* Bausteine hinzufügen */
    if (!ro) {
      var kat = h("div", { class: "karte" }, h("h2", { text: t("Bausteine anklicken") }));
      var vor = abgeleitet(f);
      if (Object.keys(vor).length) {
        var vb = h("div", { class: "hinweis", "data-ableitung": "" }, t("Vorschlag aus dem Bedarf:") + " ");
        Object.keys(vor).forEach(function (id) {
          var k = R.katalogVon(S.tabellen, id); if (!k) return;
          vb.append(knopf("＋ " + nm(k.name) + " (" + vor[id].join(", ") + ")", function () { bausteinDazu(v, f, id, null, vor[id]); }, "chip klein", { "data-vorschlag-baustein": id }));
        });
        kat.append(vb);
      }
      var chips = h("div", { class: "band" });
      S.tabellen.bausteine.forEach(function (k) {
        chips.append(knopf("＋ " + nm(k.name), function () { bausteinDazu(v, f, k.id, null, []); }, "chip klein", { "data-katalog": k.id }));
      });
      kat.append(chips);
      var frei = h("input", { placeholder: t("Unbekannter Baustein, z. B. „Warenwirtschaftssystem“"), id: "baustein-frei", "data-key": "baustein-frei", style: "flex:1 1 220px" });
      var freiDazu = function () { if (frei.value.trim()) bausteinDazu(v, f, null, frei.value.trim(), []); };
      frei.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); freiDazu(); } });
      kat.append(h("div", { class: "zeile" }, frei, knopf("＋", freiDazu, "klein", { id: "baustein-frei-dazu" })),
        h("p", { class: "gedaempft klein", text: t("Ein unbekannter Baustein steht als „noch nicht geschätzt“ da, bis Größe oder Stunden gesetzt sind. Keine geratene Zahl.") }));
      links.append(kat);
    }

    /* Gewählte Bausteine */
    var gew = h("div", { class: "karte" }, h("h2", { text: t("Umfang") + " · " + (u.bausteine || []).length + " " + t("Bausteine") }));
    gew.append(preisLeiste(v, f, ro));
    (u.bausteine || []).forEach(function (bs, i) { gew.append(bausteinKarte(v, f, bs, s.zeilen[i], ro)); });
    var ungedeckt = BD.bedarfe(f.protokoll).concat(f.protokoll.bereiche[8].eintraege).filter(function (e) {
      return !(u.bausteine || []).some(function (b) { return (b.deckt || []).indexOf(e.id) >= 0; });
    });
    if (ungedeckt.length) gew.append(h("div", { class: "hinweis warn", "data-ungedeckt": ungedeckt.map(function (e) { return e.id; }).join(",") },
      ungedeckt.map(function (e) { return e.id; }).join(", ") + " " + t("ist noch nicht abgedeckt.")));
    /* Zuschläge */
    var fa = u.firmenanpassung = u.firmenanpassung || { von: 0, bis: 0 };
    gew.append(h("h3", { style: "margin-top:12px", text: t("Zuschläge") }),
      h("div", { class: "zeile" },
        h("label", { class: "feld", style: "flex:0 1 200px" }, t("Firmenanpassung (Logo, Begriffe, Felder) h von–bis"),
          h("span", { class: "zeile", style: "margin:0" },
            nummer(fa.von, ro, "fa-von", function (n) { fa.von = n || 0; }, v), "–", nummer(fa.bis, ro, "fa-bis", function (n) { fa.bis = n || 0; }, v))),
        h("label", { class: "feld", style: "flex:0 1 150px" }, t("Abstimmung/Doku %"),
          nummer(u.abstimmungPct == null ? 15 : u.abstimmungPct, ro, "abst", function (n) { u.abstimmungPct = n == null ? 15 : n; }, v, u.abstimmungPct != null && u.abstimmungPct !== 15)),
        h("label", { class: "feld", style: "flex:0 1 150px" }, t("Puffer %"),
          nummer(u.pufferPct == null ? 20 : u.pufferPct, ro, "puffer", function (n) { u.pufferPct = n == null ? 20 : n; }, v, u.pufferPct != null && u.pufferPct !== 20)),
        h("label", { class: "feld", style: "flex:0 1 220px" }, t("Gewährleistung in der Anfangsphase h (Freistunden, eingerechnet)"),
          nummer(u.gewaehrleistungH || 0, ro, "gewaehr", function (n) { u.gewaehrleistungH = n || 0; }, v))));
    links.append(gew);

    /* Ergebnis */
    rechts.append(ergebnisKarte(s));
    links.append(knKarte(v, f, s, kn, ro));
    links.append(phasenKarte(f, s));
    rechts.append(h("div", { class: "band", style: "margin-top:6px" }, knopf("🖨 " + t("Bedarfsanalyse"), function () { drucke("analyse"); }, "")));
  }
  function nummer(w, ro, key, fn, v, markiert) {
    return h("input", { type: "number", min: "0", step: "0.5", class: "kurz", value: w == null ? "" : w, disabled: ro, "data-key": key,
      "data-manuell": markiert ? "1" : "0", onchange: function (e) { fn(zahl(e.target.value)); merken(v); zeichne(); } });
  }
  function bausteinDazu(v, f, katalog, name, deckt) {
    vorher(v, f);
    var b = { id: BD.neueKennung(v, "K"), katalog: katalog, name: name || "", menge: 1, groesse: katalog ? "klein" : null, faktoren: [], deckt: deckt || [] };
    f.umfang.bausteine.push(b); merken(v); zeichne();
  }

  /* ── Erklären, an Ort und Stelle ändern, zurück (Klaus 2026-10-08) ──
     „Die B-Nummern … sind noch nicht als Link … man klickt an, sieht, ah, okay, B01 bedeutet das …
     ein X oder so lassen … sehen, wie sich der Preis verändert. Und einmal wieder ein Zurück-Button.“
     Jeder Chip am Baustein (Kennung K-nn, Größe, Faktor, deckt B-/O-nn) öffnet ein Feld darunter:
     was er bedeutet und was eine Änderung am Preis bewirkt — VORHER gerechnet an einer Kopie der
     Fassung, nicht geraten. Geändert wird erst auf Tipp. Zurück hält bis zu 50 Stände des Umfangs,
     je Vorgang und Fassung, nur im Speicher (nicht in IndexedDB). In einer unterschriebenen Fassung
     erklärt das Feld, ändert aber nichts. */
  var ZURUECK = {};
  function zKey(v, f) { return v.id + ":" + f.nr; }
  function preisBild(f) {
    var s = R.schaetze(f, S.tabellen), kn = R.kostenNutzen(f, s, S.einst.zeitraum);
    var p = R.positionen(f, s, kn, S.tabellen, S.lang), sum = function (l) { return l.reduce(function (a, x) { return a + x.nettoCent; }, 0); };
    return { von: s.kostenVon, bis: s.kostenBis, angebot: sum(p.haupt), optional: sum(p.optional) };
  }
  function vorher(v, f) {
    var k = zKey(v, f), st = ZURUECK[k] = ZURUECK[k] || [];
    st.push({ umfang: JSON.stringify(f.umfang), preis: preisBild(f) });
    if (st.length > 50) st.shift();
  }
  function zurueckNehmen(v, f) {
    var st = ZURUECK[zKey(v, f)] || [];
    if (!st.length || !F.bearbeitbar(v, f)) return;
    f.umfang = JSON.parse(st.pop().umfang);
    merken(v); zeichne();
  }
  function delta(a, b) { var d = b - a; return d === 0 ? "±0 €" : (d > 0 ? "+" : "−") + euroG(Math.abs(d)); }
  function preisLeiste(v, f, ro) {
    var jetzt = preisBild(f), st = ZURUECK[zKey(v, f)] || [];
    var l = h("div", { class: "preis-leiste", "data-preis-leiste": "" },
      h("span", { "data-angebot-jetzt": String(jetzt.angebot) }, h("b", { text: t("Angebot netto") + ": " }), euroG(jetzt.angebot),
        jetzt.optional ? " · " + t("optional") + " " + euroG(jetzt.optional) : ""));
    if (st.length && !ro) {
      var alt = st[st.length - 1].preis;
      l.append(h("span", { class: "gedaempft klein", "data-preis-vorher": String(alt.angebot) },
        t("vor der letzten Änderung") + ": " + euroG(alt.angebot) + " (" + delta(alt.angebot, jetzt.angebot) + ")"),
        knopf("↶ " + t("Zurück") + " (" + st.length + ")", function () { zurueckNehmen(v, f); }, "klein", { "data-umfang-zurueck": String(st.length) }));
    }
    return l;
  }
  function offenesErklaer(v, f, bs, art, id) {
    var I = S.info; return !!(I && I.v === v.id && I.f === f.nr && I.bs === bs.id && I.art === art && I.id === id);
  }
  function erklaerUmschalten(v, f, bs, art, id) {
    S.info = offenesErklaer(v, f, bs, art, id) ? null : { v: v.id, f: f.nr, bs: bs.id, art: art, id: id };
    zeichne();
  }
  function erklaerChip(v, f, bs, art, id, cls, text) {
    var offen = offenesErklaer(v, f, bs, art, id);
    return h("button", { type: "button", class: cls + " erklaer-chip" + (offen ? " erklaer-offen" : ""), text: text, "aria-expanded": offen ? "true" : "false",
      "data-erklaer-chip": art + ":" + id, onclick: function () { erklaerUmschalten(v, f, bs, art, id); } });
  }
  function bsIn(ff, id) { return (ff.umfang.bausteine || []).filter(function (b) { return b.id === id; })[0]; }
  function umschalten(liste, id) { liste = liste || []; return liste.indexOf(id) >= 0 ? liste.filter(function (x) { return x !== id; }) : liste.concat(id); }
  function erklaerInhalt(v, f, bs, art, id) {
    var z = [], a = [];
    if (art === "deckt") {
      var x = BD.alleEintraege(f.protokoll).filter(function (y) { return y.e.id === id; })[0];
      var e = x ? x.e : { text: "?" }, an = (bs.deckt || []).indexOf(id) >= 0;
      var andere = (f.umfang.bausteine || []).filter(function (b) { return b !== bs && (b.deckt || []).indexOf(id) >= 0; }).map(function (b) { return b.id; });
      if (x) z.push(t("Bereich") + " " + x.nr + " · " + nm(WN.BEREICHE[x.nr - 1].name));
      z.push(h("span", { "data-erklaer-text": "" }, e.text || "–"));
      if (e.prio) z.push(t("Priorität") + ": " + nm(WN.PRIO_NAME[e.prio]));
      /* Klaus 2026-10-08: „deckt den Punkt nicht ab · kein anderer“ las sich, als wäre der Punkt überflüssig.
         Vier Lagen, jede sagt, was daraus folgt. */
      z.push(h("span", { "data-erklaer-lage": (an ? "an" : "aus") + (andere.length ? "-andere" : "-allein") },
        an && andere.length ? t("Dieser Baustein deckt den Punkt ab — nicht allein. Auch abgedeckt von") + ": " + andere.join(", ")
          : an ? t("Nur dieser Baustein deckt den Punkt ab. Ohne ihn bleibt der Punkt offen.")
          : andere.length ? t("Dieser Baustein ist dafür nicht eingeplant — den Punkt deckt schon") + ": " + andere.join(", ")
          : t("Bisher deckt kein Baustein den Punkt ab — er ist noch offen. Mit „✓ Durch diesen Baustein abdecken“ übernimmt ihn dieser.")));
      z.push(h("span", { class: "gedaempft" }, t("Der Punkt selbst bleibt im Bedarfsprotokoll — streichen im Reiter „1 Bedarf“. Die Abdeckung bestimmt Priorität und Nutzen, also die Grenzlinie (fest oder optional im Angebot).")));
      a.push(an ? { key: "weg", label: "✕ " + t("Nicht durch diesen Baustein"), tun: function (ff, b) { b.deckt = umschalten(b.deckt, id); } }
        : { key: "dazu", label: "✓ " + t("Durch diesen Baustein abdecken"), tun: function (ff, b) { b.deckt = umschalten(b.deckt, id); } });
      if (andere.length) a.push({ key: "ueberall", label: "✕ " + t("Aus allen Bausteinen nehmen"), tun: function (ff) {
        (ff.umfang.bausteine || []).forEach(function (b) { b.deckt = (b.deckt || []).filter(function (y) { return y !== id; }); }); } });
      return { titel: id, zeilen: z, aktionen: a };
    }
    if (art === "faktor") {
      var fk = S.tabellen.faktoren.filter(function (q) { return q.id === id; })[0] || { name: { de: id }, mal: 1 };
      var fan = (bs.faktoren || []).indexOf(id) >= 0;
      z.push(t("Faktor") + " ×" + String(fk.mal).replace(".", S.lang === "en" ? "." : ",") + " " + t("auf die Stunden dieses Bausteins (Schätzung, nicht gemessen; änderbar unter „Tabellen“)."));
      z.push(fan ? t("Gesetzt.") : t("Nicht gesetzt."));
      a.push({ key: fan ? "weg" : "dazu", label: fan ? "✕ " + t("Faktor entfernen") : "✓ " + t("Faktor setzen"), tun: function (ff, b) { b.faktoren = umschalten(b.faktoren, id); } });
      return { titel: nm(fk.name), zeilen: z, aktionen: a };
    }
    if (art === "groesse") {
      var kk = R.katalogVon(S.tabellen, bs.katalog), sp = kk && kk.spannen && kk.spannen[id];
      z.push(sp ? t("Spanne laut Katalog") + ": " + std(sp[0]) + "–" + std(sp[1]) + " h " + t("je Stück, vor der Wiederverwendung") : t("Kein Katalog-Baustein: Stunden von Hand setzen."));
      z.push(bs.groesse === id ? t("Gewählt.") : t("Nicht gewählt."));
      if (bs.groesse !== id) a.push({ key: "waehlen", label: "✓ " + t("Diese Größe nehmen"), tun: function (ff, b) { b.groesse = id; } });
      return { titel: t({ klein: "klein", mittel: "mittel", gross: "groß" }[id]), zeilen: z, aktionen: a };
    }
    var k = R.katalogVon(S.tabellen, bs.katalog);
    z.push(R.bausteinName(bs, S.tabellen, S.lang));
    if (k && k.vorlage) z.push(t("Vorlage") + ": " + k.vorlage + " · " + Math.round(k.wv * 100) + " % " + t("Wiederverwendung"));
    if (k && k.hinweis) z.push(h("span", { class: "gedaempft" }, k.hinweis));
    z.push(t("deckt:") + " " + ((bs.deckt || []).join(", ") || "–"));
    a.push({ key: "entfernen", label: "✕ " + t("Baustein entfernen"), tun: function (ff) { ff.umfang.bausteine = (ff.umfang.bausteine || []).filter(function (b) { return b.id !== bs.id; }); } });
    return { titel: bs.id, zeilen: z, aktionen: a };
  }
  function erklaerFeld(v, f, bs, ro, art, id) {
    if (!offenesErklaer(v, f, bs, art, id)) return null;
    var d = erklaerInhalt(v, f, bs, art, id), zu = function () { S.info = null; zeichne(); };
    var box = h("div", { class: "erklaer-feld", "data-erklaer": art + ":" + id },
      h("div", { class: "bereich-kopf" }, h("b", { text: d.titel }), knopf("✕", zu, "klein", { "aria-label": t("Erklärung schließen"), "data-erklaer-zu": "" })));
    d.zeilen.forEach(function (zl) { box.append(h("p", { class: "klein" }, zl)); });
    if (ro) box.append(h("p", { class: "gedaempft klein", "data-erklaer-nurlesen": "" }, t("Unterschriebene oder ältere Fassung: hier nur ansehen. Zum Ändern oben „✎ Neue Fassung zum Ändern“ tippen.")));
    else {
      var jetzt = preisBild(f);
      d.aktionen.forEach(function (ak) {
        var kopie = JSON.parse(JSON.stringify(f)); ak.tun(kopie, bsIn(kopie, bs.id));
        var nach = preisBild(kopie);
        box.append(h("div", { class: "zeile erklaer-aktion" },
          knopf(ak.label, function () { vorher(v, f); ak.tun(f, bsIn(f, bs.id)); if (ak.key === "entfernen") S.info = null; merken(v); zeichne(); }, "klein", { "data-erklaer-tun": ak.key }),
          h("span", { class: "klein gedaempft", "data-wirkung": String(nach.angebot - jetzt.angebot) },
            t("Angebot netto") + " " + euroG(jetzt.angebot) + " → " + euroG(nach.angebot) + " (" + delta(jetzt.angebot, nach.angebot) + ") · " +
            t("Schätzung") + " " + euroG(nach.von) + "–" + euroG(nach.bis))));
      });
    }
    box.append(knopf("✓ " + t("So lassen"), zu, "klein", { "data-erklaer-lassen": "" }));
    return box;
  }
  function bausteinKarte(v, f, bs, z, ro) {
    var k = R.katalogVon(S.tabellen, bs.katalog);
    var karte = h("div", { class: "baustein" + (z.geschaetzt ? "" : " offen"), "data-baustein": bs.id, "data-geschaetzt": z.geschaetzt ? "1" : "0" });
    karte.append(h("div", { class: "bereich-kopf" },
      h("div", { class: "band" }, erklaerChip(v, f, bs, "kennung", bs.id, "badge kennung", bs.id),
        ro || k ? h("b", { text: R.bausteinName(bs, S.tabellen, S.lang) })
          : h("input", { value: bs.name, "data-key": "bn-" + bs.id, oninput: function (e) { bs.name = e.target.value; merken(v); } }),
        z.geschaetzt ? h("span", { class: "badge", text: std(z.von) + "–" + std(z.bis) + " h" }) : h("span", { class: "badge gelb", "data-noch-nicht": "", text: t("noch nicht geschätzt") })),
      ro ? null : knopf("✕", function () { vorher(v, f); f.umfang.bausteine = f.umfang.bausteine.filter(function (x) { return x !== bs; }); merken(v); zeichne(); }, "klein gefahr", { "aria-label": t("Baustein entfernen") })));
    anhaengen(karte, erklaerFeld(v, f, bs, ro, "kennung", bs.id));
    if (k && k.vorlage) karte.append(h("div", { class: "gedaempft klein", text: t("Vorlage") + ": " + k.vorlage + " · " + Math.round(k.wv * 100) + " % " + t("Wiederverwendung") + (k.geprueft ? " · ✓ " + t("nachgesehen") : " · " + t("laut Brief, nicht nachgesehen")) }));
    var zeile = h("div", { class: "zeile" });
    zeile.append(t("Menge"), zaehler(bs.menge, ro, function (n) { vorher(v, f); bs.menge = Math.max(1, n); merken(v); zeichne(); }, "m-" + bs.id));
    var seg = h("span", { class: "seg", "data-groesse": bs.id });
    WN.GROESSEN.forEach(function (gr) {
      seg.append(h("button", { type: "button", class: (bs.groesse === gr ? "on" : "") + (offenesErklaer(v, f, bs, "groesse", gr) ? " erklaer-offen" : ""), text: t({ klein: "klein", mittel: "mittel", gross: "groß" }[gr]), "data-g": gr,
        "aria-expanded": offenesErklaer(v, f, bs, "groesse", gr) ? "true" : "false", onclick: function () { erklaerUmschalten(v, f, bs, "groesse", gr); } }));
    });
    zeile.append(seg);
    karte.append(zeile);
    WN.GROESSEN.forEach(function (gr) { anhaengen(karte, erklaerFeld(v, f, bs, ro, "groesse", gr)); });
    var fz = h("div", { class: "band" });
    S.tabellen.faktoren.forEach(function (fk) {
      var an = (bs.faktoren || []).indexOf(fk.id) >= 0;
      var ch = erklaerChip(v, f, bs, "faktor", fk.id, "btn chip klein" + (an ? " on" : ""), nm(fk.name) + " ×" + String(fk.mal).replace(".", S.lang === "en" ? "." : ","));
      ch.setAttribute("data-faktor", fk.id); fz.append(ch);
    });
    karte.append(fz);
    S.tabellen.faktoren.forEach(function (fk) { anhaengen(karte, erklaerFeld(v, f, bs, ro, "faktor", fk.id)); });
    /* deckt Bedarf */
    var kand = BD.bedarfe(f.protokoll).concat(f.protokoll.bereiche[8].eintraege, f.protokoll.bereiche[12].eintraege);
    if (kand.length) {
      var dz = h("div", { class: "band", style: "margin-top:6px" }, h("span", { class: "gedaempft klein", title: t("Alle Bedarfe stehen hier; hervorgehoben sind die, die dieser Baustein abdeckt."), text: t("deckt (hervorgehoben):") }));
      kand.forEach(function (e) {
        var an = (bs.deckt || []).indexOf(e.id) >= 0;
        var ch = erklaerChip(v, f, bs, "deckt", e.id, "btn chip klein" + (an ? " on" : ""), e.id);
        ch.setAttribute("data-deckt", e.id); ch.setAttribute("title", e.text); dz.append(ch);
      });
      karte.append(dz);
      kand.forEach(function (e) { anhaengen(karte, erklaerFeld(v, f, bs, ro, "deckt", e.id)); });
    }
    /* von Hand, eigener Satz, Rechenweg */
    var m = bs.manuell || {};
    var hand = h("div", { class: "zeile" },
      h("label", { class: "feld", style: "flex:0 1 210px" }, t("Stunden von Hand (von–bis)"),
        h("span", { class: "zeile", style: "margin:0" },
          h("input", { type: "number", min: "0", step: "0.5", class: "kurz", value: m.von == null ? "" : m.von, disabled: ro, "data-key": "mv-" + bs.id, "data-manuell": bs.manuell ? "1" : "0",
            onchange: function (e) { bs.manuell = Object.assign({}, bs.manuell, { von: zahl(e.target.value) }); if (bs.manuell.bis == null) bs.manuell.bis = bs.manuell.von; aufraeumen(bs); merken(v); zeichne(); } }),
          "–",
          h("input", { type: "number", min: "0", step: "0.5", class: "kurz", value: m.bis == null ? "" : m.bis, disabled: ro, "data-key": "mb-" + bs.id, "data-manuell": bs.manuell ? "1" : "0",
            onchange: function (e) { bs.manuell = Object.assign({}, bs.manuell, { bis: zahl(e.target.value) }); if (bs.manuell.von == null) bs.manuell.von = bs.manuell.bis; aufraeumen(bs); merken(v); zeichne(); } }))),
      bs.manuell && !ro ? knopf("↺ " + t("Vorgabe"), function () { delete bs.manuell; merken(v); zeichne(); }, "klein", { "data-zurueck": bs.id }) : null,
      h("label", { class: "feld", style: "flex:0 1 160px" }, t("eigener Satz €/h (optional)"),
        h("input", { type: "number", min: "0", step: "1", class: "kurz", value: bs.satzCent == null ? "" : bs.satzCent / 100, disabled: ro, "data-key": "bsatz-" + bs.id,
          "data-manuell": bs.satzCent != null ? "1" : "0",
          onchange: function (e) { var c = e.target.value === "" ? null : G.parseEuroToCents(e.target.value); bs.satzCent = Number.isFinite(c) ? c : null; if (bs.satzCent == null) delete bs.satzCent; merken(v); zeichne(); } })),
      (S.einst.ust.modus !== "p19") ? h("label", { class: "schalter" }, h("input", { type: "checkbox", checked: !!bs.ermaessigt, disabled: ro, onchange: function (e) { bs.ermaessigt = e.target.checked; merken(v); zeichne(); } }), t("ermäßigt 7 %")) : null);
    karte.append(hand);
    karte.append(rechenweg(z));
    return karte;
  }
  function aufraeumen(bs) { if (bs.manuell && bs.manuell.von == null && bs.manuell.bis == null) delete bs.manuell; }
  function rechenweg(z) {
    var d = h("details", { "data-rechenweg": z.id }, h("summary", { class: "klein gedaempft", text: t("Rechenweg") }));
    var ul = h("ul", { class: "weg" });
    z.weg.forEach(function (w) {
      var txt = "";
      if (w.art === "manuell") txt = t("von Hand gesetzt") + ": " + std(w.von) + "–" + std(w.bis) + " h";
      if (w.art === "spanne") txt = t("Spanne") + " " + t({ klein: "klein", mittel: "mittel", gross: "groß" }[w.groesse]) + " × " + std(w.menge) + " = " + std(w.von) + "–" + std(w.bis) + " h";
      if (w.art === "wv") txt = "− " + Math.round(w.anteil * 100) + " % " + t("Wiederverwendung") + (w.quelle ? " (" + w.quelle + ")" : "") + " = " + std(w.von) + "–" + std(w.bis) + " h";
      if (w.art === "faktoren") txt = "× " + String(Math.round(w.mal * 1000) / 1000).replace(".", ",") + " " + t("Faktoren") + " = " + std(w.von) + "–" + std(w.bis) + " h";
      if (w.art === "satz") txt = t("Satz") + " " + euroG(w.satzCent) + "/h" + (w.eigen ? " (" + t("eigener Satz dieses Bausteins") + ")" : " (" + t("Satz des Auftrags") + ")") + (z.geschaetzt ? " → " + euroG(z.kostenVon) + "–" + euroG(z.kostenBis) : "");
      ul.append(h("li", { text: txt }));
    });
    d.append(ul);
    return d;
  }
  function ergebnisKarte(s) {
    var si = R.sichten(s, S.tabellen);
    var k = h("div", { class: "karte", "data-ergebnis": "" }, h("h2", { text: t("Schätzung") }));
    k.append(h("div", { class: "gross-zahl", "data-stunden": std(s.stundenVon) + "–" + std(s.stundenBis), text: std(s.stundenVon) + "–" + std(s.stundenBis) + " h" }),
      h("div", { class: "gedaempft", text: "≈ " + std(R.tage(s.stundenVon)) + "–" + std(R.tage(s.stundenBis)) + " " + t("Tage zu 8 h") }),
      h("div", { class: "mittel-zahl", style: "margin-top:8px", "data-preis": "", text: euroG(s.kostenVon) + " – " + euroG(s.kostenBis) + " " + t("netto") }));
    var max = Math.max(s.kostenBis, si.markt ? si.markt.bis : 0) || 1;
    var bar = h("div", { class: "spanne", title: t("Balken: Ihre Kosten-Spanne · gestrichelt: Markt-Spanne") },
      si.markt ? h("b", { style: "left:" + (si.markt.von / max * 100) + "%;width:" + Math.max(1, (si.markt.bis - si.markt.von) / max * 100) + "%" }) : null,
      h("i", { style: "left:" + (s.kostenVon / max * 100) + "%;width:" + Math.max(1, (s.kostenBis - s.kostenVon) / max * 100) + "%" }));
    k.append(bar);
    if (s.offen.length) k.append(h("div", { class: "hinweis warn", text: t("Nicht in der Summe (noch nicht geschätzt):") + " " + s.offen.join(", ") }));
    var tab = h("table", { class: "klein" },
      h("tr", null, h("td", { text: t("Bausteine") }), h("td", { class: "r", text: std(s.bausteineVon) + "–" + std(s.bausteineBis) + " h" })),
      h("tr", null, h("td", { text: t("Firmenanpassung") }), h("td", { class: "r", text: std(s.firmenanpassung.von) + "–" + std(s.firmenanpassung.bis) + " h" })),
      h("tr", null, h("td", { text: t("Abstimmung/Doku") + " " + s.abstimmung.pct + " %" }), h("td", { class: "r", text: std(s.abstimmung.von) + "–" + std(s.abstimmung.bis) + " h" })),
      h("tr", null, h("td", { text: t("Puffer") + " " + s.puffer.pct + " %" }), h("td", { class: "r", text: std(s.puffer.von) + "–" + std(s.puffer.bis) + " h" })),
      s.gewaehrleistung.stunden ? h("tr", { "data-gewaehr-zeile": "" }, h("td", { text: t("Gewährleistung in der Anfangsphase (eingerechnet)") }), h("td", { class: "r", text: std(s.gewaehrleistung.stunden) + " h" })) : null);
    k.append(tab);
    var sicht = h("div", { style: "margin-top:10px", "data-sichten": "" }, h("h3", { text: t("Drei Sichten — Orientierung, nicht Messung") }),
      h("p", { class: "klein" }, h("b", { text: t("kostenbasiert") + ": " }), euroG(si.kosten.von) + "–" + euroG(si.kosten.bis)));
    if (si.markt) {
      sicht.append(h("p", { class: "klein" }, h("b", { text: t("marktüblich") + ": " }), euroG(si.markt.von) + "–" + euroG(si.markt.bis) + " · " + nm(si.markt.name),
        h("br"), h("span", { class: "gedaempft", text: t("Quelle") + ": " + si.markt.quelle })));
      if (si.markt.lage !== "innerhalb") sicht.append(h("div", { class: "hinweis", "data-markt-lage": si.markt.lage },
        si.markt.lage === "darueber" ? t("Die kostenbasierte Rechnung liegt über der Markt-Spanne.") : t("Die kostenbasierte Rechnung liegt unter der Markt-Spanne.")));
    }
    sicht.append(h("p", { class: "klein" }, h("b", { text: t("Auftragsbau-Modell") + ": " }), euroG(si.auftragsbau.einmalig) + " " + t("einmalig") +
      (si.auftragsbau.pflegeVon != null ? " + " + euroG(si.auftragsbau.pflegeVon) + "–" + euroG(si.auftragsbau.pflegeBis) + " " + t("Pflege/Monat") : "")));
    k.append(sicht);
    return k;
  }
  function knKarte(v, f, s, kn, ro) {
    var u = f.umfang;
    var k = h("div", { class: "karte", "data-kn": "" }, h("h2", { text: t("Kosten-Nutzen") }),
      h("p", { class: "gedaempft klein", text: t("Nutzen = Angabe des Kunden, Kosten = Schätzung. Beides keine Messung.") + " " + t("Zeitraum") + ": " + kn.monate + " " + t("Monate") }));
    k.append(h("div", { class: "zeile" }, h("label", { class: "feld", style: "flex:0 1 220px" }, t("Stundenwert des Kunden (€/h, für „Zeit gespart“)"),
      h("input", { type: "number", min: "0", step: "1", class: "kurz", value: u.kundenStundenwertCent == null ? "" : u.kundenStundenwertCent / 100, disabled: ro, "data-key": "ksw",
        onchange: function (e) { var c = e.target.value === "" ? null : G.parseEuroToCents(e.target.value); u.kundenStundenwertCent = Number.isFinite(c) ? c : null; merken(v); zeichne(); } }))));
    if (kn.stundenwertFehlt) k.append(h("p", { class: "gedaempft klein", text: t("Ohne Stundenwert zählt „Zeit gespart“ nicht als Nutzen.") }));
    var tb = h("table", { "data-kn-tabelle": "" }, h("tr", null, h("th", { text: t("Baustein") }), h("th", { text: t("Prio") }), h("th", { class: "r", text: t("Kosten") }),
      h("th", { class: "r", text: t("Nutzen") + " " + kn.monate + " " + t("Mon.") }), h("th", { class: "r", text: t("bis hier") })));
    kn.zeilen.forEach(function (r, i) {
      var bs = u.bausteine.filter(function (b) { return b.id === r.id; })[0];
      if (i === kn.grenze) tb.append(h("tr", { class: "grenze", "data-grenzlinie": r.id }, h("td", { colspan: "5", class: "klein", style: "color:var(--bad)",
        text: "⚠ " + t("ab hier übersteigen die Kosten den Nutzen") + (kn.manuell ? " (" + t("von Hand gesetzt") + ")" : "") })));
      tb.append(h("tr", { class: kn.grenze >= 0 && i >= kn.grenze ? "unter" : "", "data-kn-zeile": r.id },
        h("td", null, h("span", { class: "badge kennung", text: r.id }), " ", R.bausteinName(bs, S.tabellen, S.lang)),
        h("td", { text: r.prio ? nm(WN.PRIO_NAME[r.prio]) : "–" }),
        h("td", { class: "r", text: euroG(r.kosten) }),
        h("td", { class: "r", text: r.nutzenZeitraum == null ? t("Nutzen nicht angegeben") : euroG(r.nutzenZeitraum) }),
        h("td", { class: "r klein", text: euroG(r.kumKosten) + " · " + (r.kumNutzenMonat ? euroG(r.kumNutzenMonat) + "/" + t("Monat") : "–") +
          (r.amortMonate != null ? " · " + t("rechnet sich nach") + " " + Math.ceil(r.amortMonate) + " " + t("Monaten") : "") })));
    });
    k.append(h("div", { class: "tabelle-huelle" }, tb));
    /* Linie verschieben */
    var sel = h("select", { disabled: ro, id: "grenze-wahl", onchange: function (e) { vorher(v, f); u.grenzeManuell = e.target.value || null; merken(v); zeichne(); } },
      h("option", { value: "", text: t("Grenzlinie automatisch") }), h("option", { value: "keine", text: t("keine Grenzlinie") }));
    kn.zeilen.forEach(function (r) { sel.append(h("option", { value: r.id, text: t("Linie vor") + " " + r.id })); });
    sel.value = u.grenzeManuell || "";
    k.append(h("div", { class: "zeile" }, sel, h("span", { class: "gedaempft klein", text: t("Bausteine unter der Linie stehen im Angebot als „später / optional“.") })));
    k.append(kurve(kn));
    return k;
  }
  function kurve(kn) {
    var NS = "http://www.w3.org/2000/svg";
    var W = 600, H = 200, pad = 30;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("class", "kurve"); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", t("Kosten- und Nutzenkurve über die kumulierte Liste"));
    var n = kn.zeilen.length;
    if (!n) return svg;
    var max = 1; kn.zeilen.forEach(function (r) { max = Math.max(max, r.kumKosten, r.kumNutzenZeitraum); });
    function x(i) { return pad + (W - 2 * pad) * (i / n); }
    function y(c) { return H - pad - (H - 2 * pad) * (c / max); }
    function linie(werte, farbe, strich) {
      var p = document.createElementNS(NS, "polyline");
      p.setAttribute("points", werte.map(function (w, i) { return x(i) + "," + y(w); }).join(" "));
      p.setAttribute("fill", "none"); p.setAttribute("stroke", farbe); p.setAttribute("stroke-width", "2.5");
      if (strich) p.setAttribute("stroke-dasharray", "6 4");
      svg.append(p);
    }
    var ach = document.createElementNS(NS, "line");
    ach.setAttribute("x1", pad); ach.setAttribute("x2", W - pad); ach.setAttribute("y1", H - pad); ach.setAttribute("y2", H - pad); ach.setAttribute("stroke", "currentColor"); ach.setAttribute("opacity", ".3");
    svg.append(ach);
    linie([0].concat(kn.zeilen.map(function (r) { return r.kumKosten; })), "var(--accent)");
    linie([0].concat(kn.zeilen.map(function (r) { return r.kumNutzenZeitraum; })), "var(--accent3)", true);
    if (kn.grenze >= 0) {
      var g = document.createElementNS(NS, "line");
      g.setAttribute("x1", x(kn.grenze)); g.setAttribute("x2", x(kn.grenze)); g.setAttribute("y1", pad / 2); g.setAttribute("y2", H - pad);
      g.setAttribute("stroke", "var(--bad)"); g.setAttribute("stroke-width", "2"); g.setAttribute("data-schnitt", "");
      svg.append(g);
    }
    [["var(--accent)", t("Kosten (kumuliert)"), ""], ["var(--accent3)", t("Nutzen im Zeitraum (kumuliert)"), "6 4"]].forEach(function (l, i) {
      var tx = document.createElementNS(NS, "text"); tx.setAttribute("x", pad + i * 230); tx.setAttribute("y", 14); tx.setAttribute("fill", l[0]); tx.setAttribute("font-size", "12");
      tx.textContent = (l[2] ? "- - " : "— ") + l[1]; svg.append(tx);
    });
    kn.zeilen.forEach(function (r, i) {
      var tx = document.createElementNS(NS, "text"); tx.setAttribute("x", x(i + 1) - 14); tx.setAttribute("y", H - 10); tx.setAttribute("font-size", "11"); tx.setAttribute("fill", "currentColor");
      tx.textContent = r.id; svg.append(tx);
    });
    return svg;
  }
  function phasenKarte(f, s) {
    var ph = R.phasen(s);
    var k = h("div", { class: "karte", "data-phasen": ph.groesse }, h("h2", { text: t("Phasen- und Testplan") }));
    var NAMEN = { protokoll: "Bedarfsprotokoll", angebot: "Angebot", bau: "Bau", test: "Praxistest beim Kunden", abnahme: "Abnahme", betrieb: "Betrieb / Pflege (optional)" };
    var ol = h("ol");
    ph.wochen.forEach(function (p) { ol.append(h("li", { text: t(NAMEN[p.id]) + (p.wochen ? " — " + p.wochen + " " + t("Woche(n)") : "") })); });
    k.append(ol, h("p", { class: "gedaempft klein", text: t("Größe") + ": " + t({ klein: "klein", mittel: "mittel", gross: "groß" }[ph.groesse]) + " (" + t("Schwellen: klein ≤ 20 h, mittel ≤ 60 h, darüber groß") + "). " + t("Alle Zeitangaben sind Schätzungen.") }));
    return k;
  }

  /* ════ 3 Angebot ════ */
  function zAngebot(main, v) {
    var f = sichtFassung(v), ro = nurLesenBanner(main, v, f);
    var a = f.angebot = f.angebot || {};
    a.ueber = a.ueber || {};
    var s = R.schaetze(f, S.tabellen), kn = R.kostenNutzen(f, s, S.einst.zeitraum);
    var pos = R.positionen(f, s, kn, S.tabellen, S.lang);
    var ust = F.ustVon(f, S.einst.ust);
    var k = h("div", { class: "karte" }, h("h2", { text: t("Angebot") + " " + (a.nummer || "") }));
    function feld(lbl, key, typ) {
      return h("label", { class: "feld" }, lbl, h("input", { type: typ || "text", value: a[key] || "", disabled: ro, "data-key": "a-" + key,
        oninput: function (e) { a[key] = e.target.value; merken(v); } }));
    }
    k.append(h("div", { class: "zeile" }, feld(t("Angebotsnummer"), "nummer"), feld(t("Datum"), "datum", "date"), feld(t("gültig bis"), "gueltigBis", "date"),
      h("label", { class: "feld" }, t("Preisbasis"), (function () {
        var sel = h("select", { disabled: ro, onchange: function (e) { a.preisbasis = e.target.value; merken(v); zeichne(); } },
          h("option", { value: "von", text: t("untere Schätzung") }), h("option", { value: "mitte", text: t("Mitte") }), h("option", { value: "bis", text: t("obere Schätzung") }));
        sel.value = a.preisbasis || "mitte"; return sel;
      })())));
    k.append(h("label", { class: "feld" }, t("Zahlung"), h("input", { value: a.zahlung || "", disabled: ro, placeholder: t("z. B. 50 % bei Auftrag, 50 % nach Abnahme"), "data-key": "a-zahlung",
      oninput: function (e) { a.zahlung = e.target.value; merken(v); } })));
    k.append(h("label", { class: "schalter", style: "margin-top:6px" }, h("input", { type: "checkbox", checked: !!a.zahlungNachTest, disabled: ro,
      onchange: function (e) { a.zahlungNachTest = e.target.checked; merken(v); } }), t("Zahlung nach bestandenem Praxistest")));
    main.append(k);
    var pk = h("div", { class: "karte", "data-positionen": "" }, h("h2", { text: t("Positionen") }),
      h("p", { class: "gedaempft klein", text: t("Übernommen aus „2 Umfang“, je Position änderbar. Auf dem Angebot stehen nur Leistung und Preis — kein Satz, keine Stunden.") }));
    var tb = h("table");
    tb.append(h("tr", null, h("th", { text: t("Leistung") }), h("th", { class: "r", text: t("Netto €") }), h("th", { text: "" })));
    pos.haupt.concat(pos.optional).forEach(function (p) {
      var opt = pos.optional.indexOf(p) >= 0;
      tb.append(h("tr", { "data-position": p.id },
        h("td", null, h("input", { value: p.beschreibung, disabled: ro, style: "width:100%", "data-key": "pb-" + p.id, "data-manuell": a.ueber[p.id] && a.ueber[p.id].beschreibung ? "1" : "0",
          onchange: function (e) { a.ueber[p.id] = Object.assign({}, a.ueber[p.id], { beschreibung: e.target.value }); merken(v); zeichne(); } }),
          opt ? h("div", { class: "klein gedaempft", text: t("später / optional (unter der Grenzlinie)") }) : null),
        h("td", { class: "r" }, h("input", { type: "number", step: "0.01", class: "mittel", value: (p.nettoCent / 100).toFixed(2), disabled: ro, "data-key": "pn-" + p.id,
          "data-manuell": a.ueber[p.id] && a.ueber[p.id].nettoCent != null ? "1" : "0",
          onchange: function (e) { var c = G.parseEuroToCents(e.target.value); if (Number.isFinite(c)) { a.ueber[p.id] = Object.assign({}, a.ueber[p.id], { nettoCent: c }); merken(v); } zeichne(); } })),
        h("td", null, p.manuell && !ro ? knopf("↺", function () { delete a.ueber[p.id]; merken(v); zeichne(); }, "klein", { "aria-label": t("Vorgabe"), title: t("Vorgabe") }) : null)));
    });
    pk.append(h("div", { class: "tabelle-huelle" }, tb));
    var su = R.ust(pos.haupt, ust);
    pk.append(summenTabelle(su, false));
    if (f.unterschrieben) pk.append(h("p", { class: "gedaempft klein", text: t("Umsatzsteuer dieser unterschriebenen Fassung ist eingefroren.") }));
    main.append(pk);
    main.append(h("div", { class: "band" },
      knopf("👁 " + t("Vorschau"), function () { vorschau("angebot"); }, "", { id: "vorschau-angebot" }),
      knopf("🖨 " + t("Angebot drucken"), function () { drucke("angebot"); }, "pri", { id: "druck-angebot" }),
      F.bearbeitbar(v, f) ? knopf("✍ " + t("Als unterschrieben markieren"), function () {
        if (!confirm(t("Fassung einfrieren? Danach ist sie nur noch zu lesen; Änderungen ergeben eine neue Fassung."))) return;
        F.unterschreiben(v, f, S.einst.ust); merken(v); melde(t("Fassung") + " " + f.nr + " " + t("ist unterschrieben und eingefroren."), "");
      }, "", { id: "unterschreiben" }) : null));
    if (!v.eigenesVorhaben) { main.append(rechtsKarte(v, "vereinbarung")); main.append(rechtsKarte(v, "wartung")); }
    /* Übergabe an WorkFloh — nur aus der Whitelist (assets/kern/uebergabe.js → aussen.js) */
    var nA = (v.anhaenge || []).filter(function (x) { return x.blob; }).length;
    main.append(h("div", { class: "karte", "data-uebergabe": "", style: "margin-top:12px" },
      h("h2", { text: "📤 " + t("Als Auftrag übergeben") }),
      h("p", { class: "gedaempft klein", text: t("Eine Auftragsdatei für Mein WorkFloh oder Tomys Hub (dort „📥 Importieren“). Darin: Kunde, Positionen, Preis — wie im Angebot, ohne Stundensatz und ohne interne Einträge.") + " " +
        (nA ? nA + " " + t("Anhang/Anhänge gehen als Datei mit (PDF als PDF, Mail als .eml).") : t("Keine Anhänge am Vorgang.")) }),
      h("div", { class: "band" }, knopf("📤 " + t("Auftragsdatei speichern"), function () {
        var auf = WN.uebergabe.auftrag(v, f, S.einst, S.tabellen);
        WN.uebergabe.dateien(v.anhaenge).then(function (fs) {
          auf.files = fs.concat(WN.uebergabe.rechtsDateien(v, rechtCtx()));
          laden(new Blob([JSON.stringify(WN.uebergabe.buendel([auf]), null, 1)], { type: "application/json" }), WN.uebergabe.dateiname(v, f));
          melde(t("Auftragsdatei gespeichert. In WorkFloh: „📥 Importieren“ und diese Datei wählen. Zweimal eingelesen wird aktualisiert, nicht verdoppelt."), "");
        }, function () { melde(t("Die Auftragsdatei ließ sich nicht bauen."), "bad"); });
      }, "", { id: "uebergabe-speichern" }),
      knopf("🧾 " + t("An BookLedgerPro"), function () { anBlp(v, f); }, "", { id: "an-blp" })),
      h("p", { class: "gedaempft klein", text: t("„An BookLedgerPro“ öffnet dort das Angebots-Formular vorbefüllt (Kunde, Positionen netto) — gespeichert wird erst in BookLedgerPro.") })));
  }
  /* ── An BookLedgerPro: gleicher Origin, ?uebernahme= (Datenvertrag v1, wie Workflow Calculate) ── */
  function anBlp(v, f) {
    var ad = WN.uebergabe.blpAdresse(WN.aussen.angebotExtern(v, f, S.einst.firma, S.einst.ust, S.tabellen, S.einst.zeitraum, S.lang));
    if (!ad.ok) { melde(t("Nicht an BookLedgerPro übergeben:") + " " + ad.grund + ".", "warn"); return; }
    merken(v);
    jetztSpeichern().then(function () {
      if (window.__wnSprungAbfangen) { window.__wnSprung = ad.url; return; }
      location.assign(ad.url);
    });
  }
  function summenTabelle(su, blatt) {
    var tb = h("table", { class: blatt ? "" : "klein", "data-summen": su.p19 ? "p19" : "regel", style: "margin-top:8px" });
    tb.append(h("tr", null, h("td", { text: t("Summe netto") }), h("td", { class: "r", text: euro(su.netto) })));
    if (su.p19) {
      tb.append(h("tr", null, h("td", { colspan: "2", class: "klein", "data-p19": "", text: t("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.") })));
    } else {
      su.zeilen.forEach(function (z) { tb.append(h("tr", { "data-ust-zeile": String(z.satz) }, h("td", { text: t("Umsatzsteuer") + " " + z.satz + " % " + t("auf") + " " + euro(z.netto) }), h("td", { class: "r", text: euro(z.ust) }))); });
      tb.append(h("tr", null, h("td", null, h("b", { text: t("Gesamt brutto") })), h("td", { class: "r" }, h("b", { text: euro(su.brutto) }))));
    }
    return tb;
  }

  /* ════ Fassungen ════ */
  function zFassungen(main, v) {
    var akt = F.aktuelle(v);
    var k = h("div", { class: "karte", "data-fassungsliste": "" }, h("h2", { text: t("Fassungen") }));
    v.fassungen.forEach(function (f) {
      k.append(h("div", { class: "eintrag", "data-fassung": String(f.nr) },
        h("span", { class: "badge kennung", text: "F" + f.nr }),
        h("div", null, h("b", { text: f.anlass || (f.nr === 1 ? t("erste Fassung") : "–") }), " ",
          h("span", { class: "gedaempft klein", text: f.datum + (f.von ? " · " + t({ kunde: "von: Kunde", betrieb: "von: Betrieb", bau: "von: Befund beim Bau" }[f.von]) : "") +
            " · " + euroG(f.satzCent) + "/h" + (f.unterschrieben ? " · ✍ " + f.unterschrieben : " · " + t("offen")) })),
        knopf(t("Ansehen"), function () { S.fNr = f === akt ? null : f.nr; S.reiter = "bedarf"; zeichne(); }, "klein")));
      /* Ist-Stunden — nur für unterschriebene Fassungen, intern (stehen am Vorgang, nicht an der Fassung) */
      if (f.unterschrieben) {
        var sch = R.schaetze(f, S.tabellen);
        k.append(h("div", { class: "zeile intern klein", "data-ist-zeile": String(f.nr) },
          h("label", { class: "feld", style: "max-width:200px" }, "🔒 " + t("Ist-Stunden F") + f.nr,
            h("input", { type: "number", min: "0", step: "0.25", "data-ist": String(f.nr), "data-key": "ist-" + f.nr, value: v.ist && v.ist[f.nr] != null ? v.ist[f.nr] : "",
              onchange: function (e) { var n = zahl(e.target.value); v.ist = v.ist || {}; if (n == null || n < 0) delete v.ist[f.nr]; else v.ist[f.nr] = n; merken(v); zeichne(); } })),
          h("span", { class: "gedaempft", text: t("Schätzung") + " " + std(sch.stundenVon) + "–" + std(sch.stundenBis) + " · " + t("nur intern, für die Kalibrierung") })));
      }
    });
    main.append(k);
    /* Neue Fassung */
    var anl = h("input", { placeholder: t("Anlass, z. B. „Kunde wünscht zweite Seite“"), id: "anlass", "data-key": "anlass", style: "flex:1 1 240px" });
    var von = h("select", { id: "anlass-von" }, h("option", { value: "", text: t("von wem?") }),
      h("option", { value: "kunde", text: t("Kunde") }), h("option", { value: "betrieb", text: t("Betrieb") }), h("option", { value: "bau", text: t("Befund beim Bau") }));
    main.append(h("div", { class: "karte" }, h("h2", { text: t("Neue Fassung") }),
      h("p", { class: "gedaempft klein", text: t("Jede Änderung während des Baus ergibt eine neue Fassung. Eine unterschriebene Fassung bleibt, wie sie ist.") }),
      h("div", { class: "zeile" }, anl, von, knopf("＋ " + t("Neue Fassung"), function () {
        var r = F.neueFassung(v, { anlass: anl.value, von: von.value });
        if (!r.ok) { melde(r.grund === "anlass" ? t("Bitte einen Anlass nennen.") : t("Bitte angeben, von wem die Änderung kommt."), "warn"); return; }
        S.fNr = null; merken(v); melde(t("Fassung") + " " + r.fassung.nr + " " + t("angelegt."), "");
      }, "pri", { id: "neue-fassung" }))));
    if (v.fassungen.length >= 2) zVergleich(main, v);
    zBauauftrag(main, v);
  }
  var SYM = { neu: "＋", geaendert: "✎", entfallen: "−", gleich: "=" };
  function zVergleich(main, v) {
    var n = S.vergleichNr && S.vergleichNr <= F.aktuelle(v).nr && S.vergleichNr >= 2 ? S.vergleichNr : F.aktuelle(v).nr;
    var neu = v.fassungen.filter(function (f) { return f.nr === n; })[0], alt = v.fassungen.filter(function (f) { return f.nr === n - 1; })[0];
    if (!alt || !neu) return;
    var vg = F.vergleich(alt, neu, S.tabellen);
    var sel = h("select", { onchange: function (e) { S.vergleichNr = Number(e.target.value); zeichne(); } });
    v.fassungen.slice(1).forEach(function (f) { sel.append(h("option", { value: String(f.nr), text: "F" + (f.nr - 1) + " → F" + f.nr })); });
    sel.value = String(n);
    var k = h("div", { class: "karte", "data-vergleich": alt.nr + "-" + neu.nr }, h("div", { class: "bereich-kopf" }, h("h2", { text: t("Vergleich") }), sel));
    var tb = h("table");
    tb.append(h("tr", null, h("th", { text: "" }), h("th", { text: t("Kennung") }), h("th", { text: t("Was") }), h("th", { class: "r", text: t("Stunden") }), h("th", { class: "r", text: t("Preis") })));
    vg.bausteine.forEach(function (x) {
      var b = x.neu || x.alt;
      tb.append(h("tr", { "data-vg-baustein": x.id, "data-status": x.status, "data-aktion": x.aktion },
        h("td", { class: "status-" + x.status, text: SYM[x.status] + " " + t({ neu: "neu", geaendert: "geändert", entfallen: "entfallen", gleich: "gleich" }[x.status]) }),
        h("td", { text: x.id }), h("td", { text: R.bausteinName(b, S.tabellen, S.lang) + " · " + x.aktion }),
        h("td", { class: "r", text: (x.stundenDiff > 0 ? "+" : x.stundenDiff < 0 ? "−" : "±") + std(Math.abs(x.stundenDiff)) + " h" }),
        h("td", { class: "r", text: (x.kostenDiff > 0 ? "+" : x.kostenDiff < 0 ? "−" : "±") + euroG(Math.abs(x.kostenDiff)) })));
    });
    vg.bedarf.filter(function (x) { return x.status !== "gleich" || x.sichtbarWechsel; }).forEach(function (x) {
      var e = x.neu || x.alt;
      tb.append(h("tr", { "data-vg-bedarf": x.id, "data-status": x.status },
        h("td", { class: "status-" + x.status, text: SYM[x.status] + " " + t({ neu: "neu", geaendert: "geändert", entfallen: "entfallen", gleich: "gleich" }[x.status]) }),
        h("td", { text: x.id }),
        h("td", { colspan: "3", text: (x.status === "geaendert" ? "„" + x.alt.text + "“ → „" + x.neu.text + "“" : e.text) +
          (x.sichtbarWechsel ? " · " + (x.neu.sichtbar ? t("jetzt für den Kunden sichtbar") : t("jetzt nur intern")) : "") })));
    });
    if (vg.satz) tb.append(h("tr", { "data-vg-satz": "" }, h("td", { text: "⚖" }), h("td", { text: t("Satz") }),
      h("td", { text: t("Satz") + " " + euroG(vg.satz.alt) + " → " + euroG(vg.satz.neu) }), h("td"),
      h("td", { class: "r", text: (vg.satz.effektCent >= 0 ? "+" : "−") + euroG(Math.abs(vg.satz.effektCent)) })));
    k.append(h("div", { class: "tabelle-huelle" }, tb));
    var su = vg.summe;
    k.append(h("p", { "data-vg-summe": "" }, t("Stunden") + " F" + alt.nr + " " + std(su.stundenAlt[0]) + "–" + std(su.stundenAlt[1]) + " → F" + neu.nr + " " + std(su.stundenNeu[0]) + "–" + std(su.stundenNeu[1]) +
      " · " + t("netto") + " " + euroG(su.kostenAlt[0]) + "–" + euroG(su.kostenAlt[1]) + " → " + euroG(su.kostenNeu[0]) + "–" + euroG(su.kostenNeu[1])));
    k.append(h("div", { class: "band" },
      knopf("👁 " + t("Nachtrag ansehen"), function () { vorschau("nachtrag", { alt: alt.nr, neu: neu.nr }); }, "", { id: "vorschau-nachtrag" }),
      knopf("🖨 " + t("Nachtrag drucken"), function () { drucke("nachtrag", { alt: alt.nr, neu: neu.nr }); }, "pri", { id: "druck-nachtrag" })));
    main.append(k);
  }

  function zBauauftrag(main, v) {
    var akt = F.aktuelle(v), alt = v.fassungen.length >= 2 ? v.fassungen[v.fassungen.length - 2] : null;
    var k = h("div", { class: "karte", "data-bauauftrag": "" }, h("h2", { text: "📄 " + t("Bauauftrag (MD)") }),
      h("p", { class: "gedaempft klein", text: t("Eine Markdown-Datei für die nächste Sitzung: was neu zu bauen, anzupassen oder zu entfernen ist. Vorher durch den Auslieferungsprüfer schicken.") }));
    k.append(h("div", { class: "band" },
      h("label", { class: "schalter" }, h("input", { type: "checkbox", id: "md-stunden", checked: S.mdOpts.stunden, onchange: function (e) { S.mdOpts.stunden = e.target.checked; } }), t("Stunden mitnehmen")),
      h("label", { class: "schalter" }, h("input", { type: "checkbox", id: "md-euro", checked: S.mdOpts.euro, onchange: function (e) { S.mdOpts.euro = e.target.checked; } }), t("Euro mitnehmen"))),
      h("p", { class: "gedaempft klein", text: t("Mit „Euro“ kommen Preis je Baustein und Summe netto mit. Der Stundensatz selbst steht nie in der Datei — aus Preis ÷ Stunden ist er aber ablesbar.") }),
      h("div", { class: v.eigenesVorhaben ? "hinweis warn" : "hinweis", "data-verdeckt": v.eigenesVorhaben ? "nein" : "ja" },
        v.eigenesVorhaben ? t("verdeckt: nein — eigenes Vorhaben, nichts wird ersetzt.") : t("verdeckt: ja — Kundendaten werden durch Platzhalter ersetzt (⟦KUNDE-1⟧ …). Die Zuordnung bleibt auf diesem Gerät.")));
    k.append(h("div", { class: "band", style: "margin-top:8px" },
      knopf("📄 " + t("Bauauftrag (MD) speichern"), function () { mdHinaus(v, alt, akt, "speichern"); }, "pri", { id: "md-speichern", disabled: !P }),
      knopf("⧉ " + t("Kopieren"), function () { mdHinaus(v, alt, akt, "kopieren"); }, "", { id: "md-kopieren", disabled: !P }),
      knopf("↗ " + t("Teilen"), function () { mdHinaus(v, alt, akt, "teilen"); }, "", { id: "md-teilen", disabled: !P })));
    if (S.mdLetzte && S.mdLetzte.vorgang === v.id) k.append(h("details", null, h("summary", { class: "klein", text: t("Zuletzt erzeugt") }), h("pre", { class: "md", "data-md": "", text: S.mdLetzte.md })));
    /* Einlesen */
    var datei = h("input", { type: "file", accept: ".md,.markdown,.txt,.json,text/markdown,application/json", id: "md-einlesen",
      onchange: function (e) { var fl = e.target.files && e.target.files[0]; if (fl) fl.text().then(function (txt) { einlesenText(txt); }); e.target.value = ""; } });
    k.append(h("h3", { style: "margin-top:14px", text: "↥ " + t("Bauauftrag einlesen") }), h("div", { class: "zeile" }, datei),
      h("p", { class: "gedaempft klein", text: t("Dieselbe MD (oder das JSON aus der Sicherung). Platzhalter werden mit der Zuordnung dieses Geräts wieder zu Klartext; unbekannte bleiben stehen und werden genannt.") }));
    /* Antwort einfügen */
    var ta = h("textarea", { id: "antwort", rows: 5, "data-key": "antwort", placeholder: t("Was die Sitzung zurückgibt, hier einfügen …") });
    k.append(h("h3", { style: "margin-top:14px", text: t("Antwort einfügen") }), ta,
      h("div", { class: "band", style: "margin-top:6px" }, knopf(t("Platzhalter aufdecken"), function () {
        S.antwort = WN.bauauftrag.aufdecken(ta.value, v, P); zeichne();
      }, "", { id: "aufdecken" })));
    if (S.antwort) {
      k.append(h("pre", { class: "md", "data-aufgedeckt": "", text: S.antwort.text }));
      if (S.antwort.unbekannt.length) k.append(h("div", { class: "hinweis warn", "data-unbekannt": S.antwort.unbekannt.join(",") },
        t("Unbekannte Platzhalter (bleiben stehen, nichts geraten):") + " " + S.antwort.unbekannt.join(", ")));
      k.append(knopf("⧉ " + t("Kopieren"), function () { kopiere(S.antwort.text); }, "klein"));
    }
    main.append(k);
  }
  function mdErzeugen(v, alt, akt) {
    var r = WN.bauauftrag.erzeuge(v, alt, akt, { stunden: S.mdOpts.stunden, euro: S.mdOpts.euro, datum: F.heute() }, P, S.tabellen);
    if (!r.ok) {
      if (r.grund === "modul25") melde(t("Modul 25 fehlt — nichts geht hinaus."), "bad");
      else melde(t("Letzte Sicherung: nach dem Verdecken steht noch etwas im Klartext — nichts geht hinaus.") + " " + t("Fundstelle") + ": „" + r.fund + "“" + (r.zeile ? " (" + t("Zeile") + " " + r.zeile + ")" : ""), "bad");
      return null;
    }
    v.zuordnung = r.zuordnung; merken(v);
    S.mdLetzte = { vorgang: v.id, md: r.md };
    return r.md;
  }
  function mdHinaus(v, alt, akt, weg) {
    var md = mdErzeugen(v, alt, akt);
    if (md == null) return;
    var name = "Bauauftrag-" + v.id + "-F" + akt.nr + ".md";
    if (weg === "speichern") { laden(new Blob([md], { type: "text/markdown;charset=utf-8" }), name); melde(t("Gespeichert:") + " " + name, ""); }
    else if (weg === "kopieren") kopiere(md);
    else if (navigator.share) navigator.share({ title: name, text: md }).catch(function () {});
    else melde(t("Teilen kann dieser Browser nicht — bitte „Kopieren“ nehmen."), "warn");
    if (weg !== "speichern") zeichne();
  }
  function kopiere(text) {
    var ok = function () { melde(t("In die Zwischenablage kopiert."), ""); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { melde(t("Kopieren nicht erlaubt — bitte von Hand markieren."), "warn"); });
    else melde(t("Kopieren nicht erlaubt — bitte von Hand markieren."), "warn");
  }
  function laden(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function einlesenText(txt) {
    var j = null;
    try { j = JSON.parse(txt); } catch (_e) {}
    if (SI.istAlt(j)) { sicherungEinlesen(j.vorgaenge, null, t("Alte Sicherung ohne Passwort:")); return; }
    if (SI.istVerschluesselt(j)) { melde(t("Das ist eine verschlüsselte Sicherung — bitte unter „Einstellungen“ → Sicherung mit dem Passwort zurückholen."), "warn"); return; }
    var r = WN.bauauftrag.einlesen(txt, P);
    if (!r.ok) { melde(t("Nicht eingelesen:") + " " + r.grund, "bad"); return; }
    var v = S.vorgaenge.filter(function (x) { return x.id === r.kopf.vorgang; })[0];
    var neuV = false;
    if (!v) { v = F.neuerVorgang(1, S.einst); v.id = r.kopf.vorgang; v.fassungen[0].angebot.nummer = "AN-" + v.id.slice(2); S.vorgaenge.unshift(v); neuV = true; }
    var basis = F.aktuelle(v);
    var a = WN.bauauftrag.standAnwenden(r.stand, basis, v, P);
    var gleiche = v.fassungen.filter(function (f) { return f.nr === Number(r.kopf.fassung); })[0];
    var kern = function (f) { return JSON.stringify([BD.alleEintraege(f.protokoll).map(function (x) { return [x.nr, x.e.id, x.e.text, x.e.prio || "", x.e.sichtbar]; }), (f.umfang.bausteine || []).map(function (b) { return [b.id, b.katalog, b.name, b.menge, b.groesse, b.faktoren, b.deckt]; })]); };
    if (!neuV && gleiche && kern(gleiche) === kern(a.fassung)) {
      melde(t("Fassung") + " " + gleiche.nr + " " + t("ist schon da und gleich — nichts geändert."), "");
    } else {
      var f = a.fassung;
      if (neuV) { f.nr = 1; v.fassungen = [f]; f.anlass = t("Bauauftrag eingelesen") + " (F" + r.kopf.fassung + ")"; f.von = "betrieb"; }
      else { f.nr = basis.nr + 1; f.anlass = t("Bauauftrag eingelesen") + " (F" + r.kopf.fassung + ")"; f.von = "betrieb"; f.unterschrieben = null; f.ust = null; v.fassungen.push(f); }
      f.datum = F.heute();
      melde(t("Eingelesen als Fassung") + " " + f.nr + " " + t("von") + " " + v.id + "." + (a.unbekannt.length ? " " + t("Unbekannte Platzhalter (bleiben stehen, nichts geraten):") + " " + a.unbekannt.join(", ") : ""), a.unbekannt.length ? "warn" : "");
    }
    S.aktiv = v.id; lsSet(LS.aktiv, v.id); S.fNr = null; merken(v); zeichne();
  }

  /* ════ Tabellen ════ */
  function zTabellen(main) {
    main.append(h("div", { class: "hinweis", text: t("Die Tabellen hinter der Schätzung. Jede Zahl ist eine Schätzung und hier änderbar; die Änderung bleibt auf diesem Gerät.") }));
    var kb = h("div", { class: "karte", "data-tabelle": "bausteine" }, h("h2", { text: t("Bausteine") + " (" + t("Stunden je Größe") + ")" }));
    var tb = h("table", { class: "klein" }, h("tr", null, h("th", { text: t("Baustein") }), h("th", { text: t("klein") }), h("th", { text: t("mittel") }), h("th", { text: t("groß") }), h("th", { text: t("Wiederverwendung %") }), h("th", { text: t("Vorlage") })));
    S.tabellen.bausteine.forEach(function (b) {
      function sp(gr, i) {
        return h("input", { type: "number", min: "0", step: "1", class: "kurz", value: b.spannen[gr][i], "data-key": "tb-" + b.id + gr + i,
          onchange: function (e) { var n = zahl(e.target.value); if (n != null) { b.spannen[gr][i] = n; tabellenSpeichern(); } zeichne(); } });
      }
      tb.append(h("tr", null, h("td", { text: nm(b.name) }),
        WN.GROESSEN.map(function (gr) { return h("td", null, h("span", { class: "zeile", style: "margin:0;flex-wrap:nowrap" }, sp(gr, 0), "–", sp(gr, 1))); }),
        h("td", null, h("input", { type: "number", min: "0", max: "100", step: "5", class: "kurz", value: Math.round(b.wv * 100), "data-key": "tbwv-" + b.id,
          onchange: function (e) { var n = zahl(e.target.value); if (n != null) { b.wv = Math.max(0, Math.min(100, n)) / 100; tabellenSpeichern(); } zeichne(); } })),
        h("td", { class: "gedaempft", text: (b.vorlage || t("keine Vorlage")) + (b.geprueft ? " ✓" : b.vorlage ? " · " + t("nicht nachgesehen") : "") })));
    });
    kb.append(h("div", { class: "tabelle-huelle" }, tb));
    main.append(kb);
    var kf = h("div", { class: "karte", "data-tabelle": "faktoren" }, h("h2", { text: t("Faktoren") }));
    S.tabellen.faktoren.forEach(function (fk) {
      kf.append(h("label", { class: "zeile" }, h("span", { style: "min-width:140px", text: nm(fk.name) }), "×",
        h("input", { type: "number", min: "1", max: "1.6", step: "0.05", class: "kurz", value: fk.mal, "data-key": "fk-" + fk.id,
          onchange: function (e) { var n = zahl(e.target.value); if (n != null) { fk.mal = Math.max(1, Math.min(1.6, n)); tabellenSpeichern(); } zeichne(); } })));
    });
    main.append(kf);
    var km = h("div", { class: "karte", "data-tabelle": "markt" }, h("h2", { text: t("Markt (Orientierung)") }));
    var tm = h("table", { class: "klein" }, h("tr", null, h("th", { text: t("Posten") }), h("th", { text: t("von €") }), h("th", { text: t("bis €") }), h("th", { text: t("Art") }), h("th", { text: t("Quelle") })));
    S.tabellen.markt.forEach(function (m) {
      function ein(feld) {
        return h("input", { type: "number", min: "0", step: "1", class: "kurz", value: m[feld] / 100, "data-key": "mk-" + m.id + feld,
          onchange: function (e) { var c = G.parseEuroToCents(e.target.value); if (Number.isFinite(c)) { m[feld] = c; m.quelle = t("von Hand geändert") + " " + F.heute(); tabellenSpeichern(); } zeichne(); } });
      }
      tm.append(h("tr", null, h("td", { text: nm(m.name) }), h("td", null, ein("vonCent")), h("td", null, ein("bisCent")),
        h("td", { text: t({ einmalig: "einmalig", monat: "je Monat", jahr: "je Jahr" }[m.art]) }), h("td", { class: "gedaempft", text: m.quelle })));
    });
    km.append(h("div", { class: "tabelle-huelle" }, tm));
    main.append(km);
    var K = WN.KALIBRIERUNG;
    var kk = h("div", { class: "karte", "data-tabelle": "kalibrierung" }, h("h2", { text: t("Kalibrierung: echte Zeiten") }),
      h("p", { class: "gedaempft klein", text: K.methode + " " + t("Gemessen") + " " + K.datum + ". " + K.gesamt + "." }));
    var tk = h("table", { class: "klein" }, h("tr", null, h("th", { text: "Repo" }), h("th", { class: "r", text: t("aktive h") }), h("th", { class: "r", text: "Commits" }), h("th", { class: "r", text: t("Bildschirme") })));
    K.zeilen.forEach(function (z) { tk.append(h("tr", null, h("td", { text: z.repo }), h("td", { class: "r", text: std(z.stunden) }), h("td", { class: "r", text: String(z.commits) }), h("td", { class: "r gedaempft", text: z.bildschirme == null ? t("nicht gezählt") : String(z.bildschirme) }))); });
    kk.append(h("div", { class: "tabelle-huelle" }, tk), h("p", { class: "gedaempft klein", "data-bildschirm-regel": "", text: t("Bildschirme") + ": " + t(K.bildschirmRegel) }), h("p", { class: "gedaempft klein", text: t("Für Fremdaufträge kommen Abstimmung, Anpassung, Test vor Ort und Pflege als eigene Posten dazu.") }));
    main.append(kk);
    var eig = R.istVergleich(S.vorgaenge, S.tabellen);
    var ke = h("div", { class: "karte intern", "data-tabelle": "eigene-auftraege", "data-anzahl": String(eig.length) },
      h("h2", { text: "🔒 " + t("Eigene Aufträge: Schätzung und Ist (intern)") }),
      h("p", { class: "gedaempft klein", text: t("Ist-Stunden je unterschriebener Fassung, eingetragen unter „Fassungen“. Abweichung gegen die Mitte der Schätzung. Geht in keinen Ausdruck, kein Angebot und keinen Bauauftrag.") }));
    if (!eig.length) ke.append(h("p", { class: "gedaempft", text: t("Noch keine Ist-Stunden eingetragen.") }));
    else {
      var te = h("table", { class: "klein" }, h("tr", null, h("th", { text: t("Vorgang") }), h("th", { text: t("Fassung") }), h("th", { class: "r", text: t("Schätzung") }),
        h("th", { class: "r", text: t("Ist") }), h("th", { class: "r", text: t("Abweichung") }),
        h("th", { class: "r", text: t("Schätzung netto") }), h("th", { class: "r", text: t("Ist × Satz netto") })));
      eig.forEach(function (z) {
        te.append(h("tr", { "data-ist-vergleich": z.vorgang + "-F" + z.fassung }, h("td", { text: z.vorgang + (z.titel ? " · " + z.titel : "") }), h("td", { text: "F" + z.fassung }),
          h("td", { class: "r", text: std(z.von) + "–" + std(z.bis) }), h("td", { class: "r", text: std(z.ist) }),
          h("td", { class: "r", text: z.abweichungPct == null ? "–" : (z.abweichungPct > 0 ? "+" : "") + z.abweichungPct + " %" + (z.imRahmen ? " ✓" : "") }),
          h("td", { class: "r", text: G.formatEuro(z.kostenVon, S.lang) + "–" + G.formatEuro(z.kostenBis, S.lang) }),
          h("td", { class: "r", "data-ist-kosten": String(z.istKostenCent), text: G.formatEuro(z.istKostenCent, S.lang) })));
      });
      ke.append(h("div", { class: "tabelle-huelle" }, te), h("p", { class: "gedaempft klein", text: t("✓ = Ist liegt in der geschätzten Spanne.") + " " + t("„Ist × Satz“: was die Fassung als Kundenauftrag gekostet hätte — Ist-Stunden mal Stundensatz der Fassung, netto. Die Ist-Stunden sind eine Untergrenze aus den Commit-Zeitstempeln.") }));
    }
    main.append(ke);
    main.append(knopf("↺ " + t("Alle Tabellen auf Vorgabe"), function () {
      if (!confirm(t("Alle Tabellen auf die Vorgabe zurücksetzen?"))) return;
      try { localStorage.removeItem(LS.tab); } catch (_e) {}
      tabellenLaden(); zeichne();
    }, "gefahr"));
  }

  /* ════ Einstellungen ════ */
  function zEinstellungen(main) {
    var E = S.einst, fi = E.firma;
    var k = h("div", { class: "karte" }, h("h2", { text: t("Firmendaten (für Angebot, Nachtrag, Bedarfsprotokoll)") }),
      h("p", { class: "gedaempft klein", text: t("Bleiben nur auf diesem Gerät. Nie ins Depot.") }));
    [["name", "Name"], ["kontakt", "Kontakt (Telefon, Mail, Web)"], ["steuer", "USt-ID / Steuernummer"], ["bank", "Bank (IBAN)"]].forEach(function (x) {
      k.append(h("label", { class: "feld" }, t(x[1]), h("input", { value: fi[x[0]] || "", "data-key": "fi-" + x[0], "data-firma": x[0], oninput: function (e) { fi[x[0]] = e.target.value; einstSpeichern(); } })));
    });
    k.append(h("label", { class: "feld" }, t("Anschrift"), h("textarea", { value: fi.anschrift || "", rows: 2, "data-key": "fi-anschrift", "data-firma": "anschrift", oninput: function (e) { fi.anschrift = e.target.value; einstSpeichern(); } })));
    k.append(h("label", { class: "feld" }, t("Logo (optional, PNG/JPEG/WebP)"), h("input", { type: "file", accept: "image/png,image/jpeg,image/webp", onchange: function (e) {
      var fl = e.target.files && e.target.files[0]; if (!fl) return;
      if (fl.size > 300000) { melde(t("Logo zu groß (höchstens 300 KB)."), "warn"); return; }
      var r = new FileReader(); r.onload = function () { fi.logo = String(r.result); einstSpeichern(); zeichne(); }; r.readAsDataURL(fl);
    } })), fi.logo ? h("div", { class: "band" }, h("img", { src: fi.logo, alt: "", style: "max-height:40px" }), knopf(t("Logo entfernen"), function () { fi.logo = ""; einstSpeichern(); zeichne(); }, "klein")) : null);
    main.append(k);
    var kp = h("div", { class: "karte" }, h("h2", { text: t("Preis und Steuer") }));
    kp.append(h("label", { class: "feld", style: "max-width:260px" }, t("Stundensatz-Vorgabe € netto (für neue Vorgänge)"),
      h("input", { type: "number", min: "0", step: "1", id: "satz-vorgabe", value: E.satzCent / 100, "data-key": "satz-vorgabe",
        onchange: function (e) { var c = G.parseEuroToCents(e.target.value); if (Number.isFinite(c) && c >= 0) { E.satzCent = c; einstSpeichern(); } zeichne(); } })),
      h("p", { class: "gedaempft klein", text: t("Ein neuer Vorgang übernimmt die Vorgabe als eigenen Wert. Bestehende Vorgänge bleiben unverändert.") }));
    var rp = h("input", { type: "radio", name: "ust", id: "ust-p19", checked: E.ust.modus === "p19", onchange: function () { E.ust.modus = "p19"; einstSpeichern(); zeichne(); } });
    var rr = h("input", { type: "radio", name: "ust", id: "ust-regel", checked: E.ust.modus !== "p19", onchange: function () { E.ust.modus = "regel"; einstSpeichern(); zeichne(); } });
    kp.append(h("div", { class: "zeile" }, h("label", { class: "schalter" }, rp, t("Kleinunternehmer (§ 19 UStG)")), h("label", { class: "schalter" }, rr, t("Regelbesteuerung"))),
      E.ust.modus !== "p19" ? h("label", { class: "feld", style: "max-width:200px" }, t("Regelsatz %"), h("input", { type: "number", min: "0", max: "100", step: "1", value: E.ust.satz, "data-key": "ust-satz", id: "ust-satz",
        onchange: function (e) { var n = zahl(e.target.value); if (n != null) { E.ust.satz = n; einstSpeichern(); } zeichne(); } })) : null,
      h("p", { class: "gedaempft klein", text: t("Ermäßigt 7 % ist je Baustein wählbar. Eine unterschriebene Fassung behält ihre Umsatzsteuer.") }),
      h("label", { class: "feld", style: "max-width:260px" }, t("Nutzen-Zeitraum für die Kosten-Nutzen-Grenze (Monate)"),
        h("input", { type: "number", min: "1", step: "1", value: E.zeitraum, "data-key": "zeitraum", onchange: function (e) { var n = zahl(e.target.value); if (n) { E.zeitraum = n; einstSpeichern(); } zeichne(); } })));
    main.append(kp);
    main.append(sicherungKarte());
    var kw = h("div", { class: "karte" }, h("h2", { text: t("Wartung (Vorgaben für neue Vorgänge und den Wartungsvertrag)") }),
      h("p", { class: "gedaempft klein", text: t("Freistunden zur Fehlerbehebung in der Anfangsphase sind in der Schätzung eingerechnet; der Kunde sieht nur „inklusive n Stunden“.") }));
    var W = E.wartung = E.wartung || { freistunden: 4, wochen: 8, pauschaleCent: null };
    kw.append(h("div", { class: "zeile" },
      h("label", { class: "feld", style: "max-width:220px" }, t("Freistunden (Anfangsphase)"), h("input", { type: "number", min: "0", step: "0.5", id: "wartung-frei", value: W.freistunden, "data-key": "wartung-frei",
        onchange: function (e) { var n = zahl(e.target.value); if (n != null && n >= 0) { W.freistunden = n; einstSpeichern(); } zeichne(); } })),
      h("label", { class: "feld", style: "max-width:220px" }, t("in den ersten … Wochen nach der Abnahme"), h("input", { type: "number", min: "0", step: "1", id: "wartung-wochen", value: W.wochen, "data-key": "wartung-wochen",
        onchange: function (e) { var n = zahl(e.target.value); if (n != null && n >= 0) { W.wochen = n; einstSpeichern(); } zeichne(); } })),
      h("label", { class: "feld", style: "max-width:260px" }, t("Jahrespauschale ab dem 3. Jahr (€ netto, leer = nach Angebot)"), h("input", { type: "number", min: "0", step: "1", id: "wartung-pauschale",
        value: W.pauschaleCent == null ? "" : W.pauschaleCent / 100, "data-key": "wartung-pauschale",
        onchange: function (e) { var c = e.target.value === "" ? null : G.parseEuroToCents(e.target.value); W.pauschaleCent = Number.isFinite(c) ? c : null; einstSpeichern(); zeichne(); } }))));
    main.append(kw);
    /* Beispiele (Stufe 3 § 3c): Auswahl statt eines Knopfs, „Alle laden“, nie ein Doppel */
    var kb = h("div", { class: "karte", "data-beispiele": "" }, h("h2", { text: t("Beispiele") }),
      h("p", { class: "gedaempft klein", text: t("Vier Beispiele aus den eigenen Repos, jedes durch alle drei Stufen, mit Fassungen nach der echten Geschichte und gemessenen Ist-Stunden. Kundendaten sind erfunden. „Boutique“ ist der Testfall (erfundene Daten).") }),
      h("div", { class: "zeile" }, beispielSteuerung("beispiel")),
      h("ul", { class: "klein gedaempft" }, WN.beispiel.liste().map(function (b) { return h("li", { text: nm(b.name) + " — " + t("Quelle") + ": " + b.quelle }); })));
    main.append(kb);
  }
  /* ── Verschlüsselte Sicherung (Brief Stufe 2, Punkt 2; Muster Sende-Prüfer) — Rechnen in assets/kern/sicherung.js ── */
  var SI = WN.sicherung, SPAETER = "workflowneeds_sicherung_spaeter", gewaehlt = null;
  var SI_GRUND = {
    passwort: "Das Passwort passt nicht zu dieser Sicherung (oder die Datei ist beschädigt). Am Passwort lässt sich nichts zurückrechnen.",
    fassung: "Diese Sicherung stammt aus einer anderen Fassung der App und lässt sich hier nicht öffnen. Am Passwort liegt es nicht.",
    "keine-sicherung": "Das ist keine Sicherungsdatei der Workflow Bedarfsanalyse.",
    "schloss-fehlt": "Das Schloss (assets/schluesseltresor.js) ist nicht geladen — nichts wurde gesichert. Einmal neu laden.",
    kurz: "Das Passwort braucht mindestens 8 Zeichen.",
  };
  function siMelde(id, text, gut) { var e = document.getElementById(id); if (e) { e.className = "hinweis " + (gut ? "" : "warn"); e.textContent = text; e.hidden = false; } }
  function sicherungKarte() {
    var z = lsGet(LS.sicherung);
    var pw = h("input", { type: "password", id: "sicherung-pw", autocomplete: "new-password", spellcheck: "false" });
    var pw2 = h("input", { type: "password", id: "sicherung-pw2", autocomplete: "new-password", spellcheck: "false" });
    var pwz = h("input", { type: "password", id: "sicherung-pw-zurueck", autocomplete: "current-password", spellcheck: "false" });
    var name = h("span", { class: "gedaempft klein", id: "sicherung-dateiname", text: gewaehlt ? gewaehlt.name : "" });
    var k = h("div", { class: "karte", id: "sicherung-kasten", "data-sicherung": "" },
      h("h2", { text: "🔐 " + t("Sicherung") }),
      h("p", { class: "gedaempft klein", text: t("Alle Vorgänge samt Anhängen, Zuordnung, Firmendaten und Tabellen in einer Datei — verschlüsselt mit einem eigenen Passwort (AES-256-GCM, wie im Sende-Prüfer). In der Datei steht kein Klartext.") }),
      h("p", { class: "klein", id: "sicherung-stand", text: z ? t("Letzte Sicherung auf diesem Gerät:") + " " + datumText(z.slice(0, 10)) : t("Auf diesem Gerät wurde noch keine Sicherung angelegt.") }),
      h("div", { class: "zeile" },
        h("label", { class: "feld" }, t("Passwort für die Sicherung (mindestens 8 Zeichen)"), pw),
        h("label", { class: "feld" }, t("Passwort wiederholen"), pw2)),
      h("p", { class: "hinweis warn klein", "data-sicherung-warnung": "", text: t("Das Passwort wird nirgends gespeichert. Ist es vergessen, lässt sich die Sicherung nicht mehr öffnen — von niemandem.") }),
      h("div", { class: "band" }, knopf("🔐 " + t("Sicherung erstellen"), function () {
        if (pw.value.length < SI.MIN_PW) return siMelde("sicherung-meldung", t(SI_GRUND.kurz), false);
        if (pw.value !== pw2.value) return siMelde("sicherung-meldung", t("Die beiden Passwörter sind nicht gleich."), false);
        siMelde("sicherung-meldung", t("Wird verschlüsselt …"), true);
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
        jetztSpeichern().then(function () {
          return SI.verschliessen(pw.value, { vorgaenge: S.vorgaenge, speicher: { einstellungen: lsGet(LS.einst) || "", tabellen: lsGet(LS.tab) || "" } });
        }).then(function (d) {
          var dname = "Workflow-Needs-Sicherung-" + d.erstellt.slice(0, 10) + ".json";
          window.WNApp.letzteSicherung = { name: dname, inhalt: d };
          laden(new Blob([JSON.stringify(d)], { type: "application/json" }), dname);
          lsSet(LS.sicherung, d.erstellt);
          pw.value = pw2.value = "";
          var st = document.getElementById("sicherung-stand"); if (st) st.textContent = t("Letzte Sicherung auf diesem Gerät:") + " " + datumText(d.erstellt.slice(0, 10));
          siMelde("sicherung-meldung", "✓ " + S.vorgaenge.length + " " + t("Vorgänge gesichert in") + " „" + dname + "“. " + t("Legen Sie die Datei an einen zweiten Ort (Stick, Cloud, Mail an sich selbst). Ohne das Passwort ist sie nutzlos."), true);
        }, function (e) { siMelde("sicherung-meldung", t(SI_GRUND[e && e.message] || "Die Sicherung ist nicht gelungen."), false); });
      }, "pri", { id: "sicherung-machen" })),
      h("p", { id: "sicherung-meldung", role: "status", hidden: true }),
      h("h3", { style: "margin-top:14px", text: "↩ " + t("Zurückholen") }),
      h("p", { class: "gedaempft klein", text: t("Fehlende Vorgänge kommen dazu. Was schon da ist, bleibt unverändert. Eine alte Sicherung ohne Passwort wird auch gelesen.") }),
      h("div", { class: "band" },
        h("label", { class: "btn" }, "📂 " + t("Sicherung wählen …"), h("input", { type: "file", accept: ".json,application/json", hidden: true, id: "sicherung-datei", onchange: function (e) {
          var fl = e.target.files && e.target.files[0]; e.target.value = ""; if (!fl) return;
          fl.text().then(function (txt) {
            var j = null; try { j = JSON.parse(txt); } catch (_e) {}
            gewaehlt = { name: fl.name, inhalt: j }; name.textContent = fl.name;
            if (SI.istAlt(j)) { sicherungEinlesen(j.vorgaenge, null, t("Alte Sicherung ohne Passwort:")); gewaehlt = null; }
            else if (!SI.istVerschluesselt(j)) siMelde("sicherung-zurueck-meldung", t(SI_GRUND["keine-sicherung"]), false);
            else { siMelde("sicherung-zurueck-meldung", t("Verschlüsselte Sicherung gewählt — jetzt das Passwort eingeben."), true); pwz.focus(); }
          });
        } })), name),
      h("label", { class: "feld", style: "max-width:360px" }, t("Passwort der Sicherung"), pwz),
      h("div", { class: "band" }, knopf("↩ " + t("Zurückholen"), function () {
        if (!gewaehlt || !SI.istVerschluesselt(gewaehlt.inhalt)) return siMelde("sicherung-zurueck-meldung", t("Erst eine Sicherungsdatei wählen."), false);
        if (!pwz.value) return siMelde("sicherung-zurueck-meldung", t("Das Passwort der Sicherung fehlt."), false);
        siMelde("sicherung-zurueck-meldung", t("Wird geöffnet …"), true);
        SI.oeffnen(pwz.value, gewaehlt.inhalt).then(function (r) {
          pwz.value = ""; gewaehlt = null;
          sicherungEinlesen(r.vorgaenge, r.speicher, t("Sicherung vom") + " " + datumText(String(r.erstellt || "").slice(0, 10)) + ":");
        }, function (e) { siMelde("sicherung-zurueck-meldung", t(SI_GRUND[e && e.message] || "Die Sicherung ließ sich nicht öffnen."), false); });
      }, "pri", { id: "sicherung-holen" })),
      h("p", { id: "sicherung-zurueck-meldung", role: "status", hidden: true }));
    return k;
  }
  function sicherungEinlesen(liste, speicher, vor) {
    var z = SI.zusammenfuehren(S.vorgaenge, liste);
    z.neu.forEach(function (v) { S.vorgaenge.push(v); merken(v); });
    jetztSpeichern();
    var mit = [];
    if (speicher && speicher.einstellungen && !lsGet(LS.einst)) { lsSet(LS.einst, speicher.einstellungen); mit.push(t("Firmendaten und Satz")); }
    if (speicher && speicher.tabellen && !lsGet(LS.tab)) { lsSet(LS.tab, speicher.tabellen); tabellenLaden(); mit.push(t("Tabellen")); }
    S.meldung = { text: (vor ? vor + " " : "") + z.neu.length + " " + t("Vorgänge dazu,") + " " + z.schonDa + " " + t("schon da (nicht überschrieben).") +
      (mit.length ? " " + t("Übernommen, weil hier noch nichts stand:") + " " + mit.join(", ") + "." : ""), art: "" };
    if (mit.length) { try { S.einst = Object.assign(S.einst, lsJson(LS.einst, {})); } catch (_e) {} }
    zeichne();
  }
  function erinnerungSicherung(main) {
    var spaeter = ""; try { spaeter = sessionStorage.getItem(SPAETER) || ""; } catch (_e) {}
    if (spaeter || !SI.erinnernNoetig(S.vorgaenge, lsGet(LS.sicherung))) return;
    var tage = SI.tageSeit(lsGet(LS.sicherung));
    var p = h("div", { class: "hinweis warn", id: "sicherung-erinnerung", "data-sicherung-erinnerung": tage === Infinity ? "nie" : "alt", role: "status" },
      tage === Infinity ? "💾 " + t("Ihre Vorgänge sind noch nie gesichert. Löscht jemand die Browserdaten, sind sie weg.") + " "
        : "💾 " + t("Die letzte Sicherung ist") + " " + Math.floor(tage) + " " + t("Tage alt.") + " ",
      knopf(t("Jetzt sichern"), function () { S.reiter = "einstellungen"; lsSet(LS.reiter, "einstellungen"); zeichne();
        var k = document.getElementById("sicherung-kasten"); if (k) { k.scrollIntoView(); var f = document.getElementById("sicherung-pw"); if (f) f.focus(); } }, "klein", { id: "sicherung-jetzt" }), " ",
      knopf(t("Später"), function () { try { sessionStorage.setItem(SPAETER, "1"); } catch (_e) {} p.remove(); }, "klein", { id: "sicherung-spaeter" }));
    main.append(p);
  }
  /* Lädt ein Beispiel (Vorgabe „boutique“). Liegt es schon da (gleiches bid), passiert nichts → false. */
  function beispielLaden(id) {
    id = id || "boutique";
    var b = WN.beispiel.liste().filter(function (x) { return x.id === id; })[0];
    if (!b || S.vorgaenge.some(function (x) { return WN.beispiel.bidVon(x) === id; })) return Promise.resolve(false);
    var nr = naechsteNr();
    var v = b.bauen(nr, S.einst);
    v.id = "V-" + F.heute().slice(0, 4) + "-" + ("000" + nr).slice(-4);
    v.fassungen.forEach(function (f) { f.angebot.nummer = "AN-" + v.id.slice(2); });
    WN.aussen.RECHT_ARTEN.forEach(function (a) { if (v[a] && v[a].stand) v[a].stand.vorgang = v.id; });
    S.vorgaenge.unshift(v); S.aktiv = v.id; lsSet(LS.aktiv, v.id); S.fNr = null;
    /* Beispiel-Anhänge (erfunden, beispiele/…): als echte Dateien an den Vorgang, so wie
       „📎 Datei wählen“ sie anhängt — sie reisen mit Sicherung und Übergabe an WorkFloh.
       Kommt eine Datei nicht (offline beim ersten Mal), fehlt sie und das wird gesagt. */
    var holen = (b.anhaenge || []).map(function (a) {
      return fetch(a.datei).then(function (r) { return r.ok ? r.blob() : null; }).catch(function () { return null; })
        .then(function (bl) { return bl ? { a: a, blob: new Blob([bl], { type: a.typ }) } : { a: a, fehlt: true }; });
    });
    return Promise.all(holen).then(function (rs) {
      if (rs.length) v.anhaenge = v.anhaenge || [];
      rs.forEach(function (r) {
        if (r.fehlt) return;
        v.anhaenge.push({ id: BD.neueKennung(v, "A"), name: r.a.name, typ: r.a.typ, groesse: r.blob.size, datum: r.a.datum || F.heute(), blob: r.blob });
      });
      var fehlt = rs.filter(function (r) { return r.fehlt; }).length;
      if (fehlt) melde(fehlt + " " + t("Beispiel-Dateien kamen nicht an (ohne Netz beim ersten Mal?). Der Vorgang ist trotzdem da."), "warn");
      /* Merker erst, wenn der Vorgang wirklich in IndexedDB liegt */
      return dbPut(v).then(function () { lsSet(LS.beispiel, "1"); return true; }).catch(function () { return true; });
    });
  }

  /* ════ Rechtsblätter (Stufe 3 § 4) — Rechnen und Whitelist in assets/kern/aussen.js ════
     ⚠ Entwürfe, kein Rechtsrat: jede Karte sagt „vor Verwendung prüfen lassen“. */
  var RECHT_NAME = { erklaerung: "Verschwiegenheits- und Datenschutzerklärung", vereinbarung: "Vereinbarung zu Zahlung und Nutzungsrechten", wartung: "Wartungsvertrag" };
  function rechtCtx() { return { firma: S.einst.firma, ust: S.einst.ust, tabellen: S.tabellen, zeitraum: S.einst.zeitraum, wartung: S.einst.wartung }; }
  function unterschriftFeld(v, r, key, label, fertig) {
    var c = h("canvas", { width: "600", height: "150", class: "unterschrift", "data-unterschrift": key, "aria-label": label });
    var g2 = c.getContext && c.getContext("2d");
    if (r[key] && g2) { var img = new Image(); img.onload = function () { g2.drawImage(img, 0, 0); }; img.src = r[key]; }
    if (!fertig && g2) {
      var zieht = false, last = null;
      var pos = function (e) { var b = c.getBoundingClientRect(); return [(e.clientX - b.left) * c.width / b.width, (e.clientY - b.top) * c.height / b.height]; };
      c.addEventListener("pointerdown", function (e) { zieht = true; last = pos(e); try { c.setPointerCapture(e.pointerId); } catch (_e) {} e.preventDefault(); });
      c.addEventListener("pointermove", function (e) {
        if (!zieht) return;
        var q = pos(e); g2.lineWidth = 3; g2.lineCap = "round"; g2.strokeStyle = "#000";
        g2.beginPath(); g2.moveTo(last[0], last[1]); g2.lineTo(q[0], q[1]); g2.stroke(); last = q;
      });
      ["pointerup", "pointercancel"].forEach(function (ty) { c.addEventListener(ty, function () {
        if (!zieht) return; zieht = false; r[key] = c.toDataURL("image/png"); merken(v); zeichne();
      }); });
    }
    return h("div", { class: "unterschrift-feld" }, h("span", { class: "klein", text: label }), c,
      fertig ? null : knopf("✕ " + t("Unterschrift löschen"), function () { delete r[key]; merken(v); zeichne(); }, "klein", { "data-unterschrift-weg": key, disabled: !r[key] }));
  }
  function rechtsKarte(v, art) {
    var r = v[art] = v[art] || {};
    var fertig = !!r.aktiviert;
    var k = h("div", { class: "karte", "data-recht": art, "data-recht-status": fertig ? "aktiviert" : "offen" },
      h("div", { class: "bereich-kopf" }, h("h2", { text: (art === "wartung" ? "🛠 " : art === "vereinbarung" ? "🤝 " : "🔏 ") + t(RECHT_NAME[art]) }),
        h("span", { class: "badge" + (fertig ? "" : " gelb"), text: fertig ? t("aktiviert am") + " " + datumText(r.aktiviert) + (r.papier ? " · " + t("auf Papier") : "") : t("offen") })),
      h("div", { class: "hinweis warn klein", "data-entwurf": "" }, "⚠ " + t("Entwurf, kein Rechtsrat — vor Verwendung prüfen lassen.")));
    if (art === "erklaerung") k.append(h("p", { class: "gedaempft klein", text: t("Ihre Erklärung an den Kunden, vor oder zu Beginn des Bedarfsgesprächs: was mit seinen Angaben geschieht. Beide unterschreiben — Sie verpflichten sich, der Kunde bestätigt den Erhalt.") }));
    if (art === "vereinbarung") k.append(h("p", { class: "gedaempft klein", text: t("Zahlung erst nach Abnahme, je Baustein; Nutzungsrecht zeitlich unbegrenzt, Änderungen nur durch Sie; ohne Zahlung Bedienungssperre (nur vereinbart, die Daten bleiben); Aktualisierungen zwei Jahre kostenlos.") }));
    if (art === "wartung") k.append(h("p", { class: "gedaempft klein", text: t("Das einzige Blatt mit dem Stundensatz (Ihre ausdrückliche Freigabe). Freistunden und Jahrespauschale kommen aus den Einstellungen.") }));
    if (art !== "erklaerung") {
      var b = WN.aussen.rechtsblatt(v, art, rechtCtx());
      k.append(h("p", { class: "klein", "data-recht-bezug": String(b.fassung) }, t("bezieht sich auf Angebot") + " " + b.text.bezug.nummer + ", " + t("Fassung") + " " + b.fassung));
    }
    k.append(h("div", { class: "zeile" },
      unterschriftFeld(v, r, "unterschriftBetrieb", t("Unterschrift Auftragnehmer"), fertig),
      unterschriftFeld(v, r, "unterschriftKunde", t("Unterschrift Kunde"), fertig)));
    k.append(h("label", { class: "schalter" }, h("input", { type: "checkbox", checked: !!r.papier, disabled: fertig, "data-papier": art,
      onchange: function (e) { r.papier = e.target.checked; merken(v); zeichne(); } }), t("Auf Papier unterschrieben (statt in der App)")));
    var mail = mailtoRecht(v, art);
    k.append(h("div", { class: "band", style: "margin-top:8px" },
      knopf("👁 " + t("Vorschau"), function () { vorschau(art); }, "", { "data-recht-vorschau": art }),
      knopf("🖨 " + (fertig ? t("Drucken") : t("Zum Unterschreiben drucken")), function () { drucke(art); }, "", { "data-recht-druck": art }),
      fertig ? null : knopf("✓ " + t("Aktivieren"), function () {
        if (!WN.aussen.aktivieren(v, art, rechtCtx())) { melde(t("Erst beide Unterschriften — oder „auf Papier unterschrieben“ setzen."), "warn"); return; }
        merken(v); jetztSpeichern(); zeichne(); vorschau(art);
      }, "pri", { "data-recht-aktivieren": art, disabled: !WN.aussen.kannAktivieren(v, art) }),
      fertig ? h("a", { class: "btn", href: mail, "data-recht-mail": art }, "✉ " + t("Per E-Mail")) : null));
    if (fertig) k.append(h("p", { class: "gedaempft klein", text: t("Eingefroren: Text, Datum und Unterschriften bleiben, wie sie sind. Die App verschickt keine Mail selbst — „Per E-Mail“ öffnet Ihr Mailprogramm mit dem Text; das PDF („Als PDF speichern“ im Druckdialog) hängen Sie von Hand an.") }));
    return k;
  }
  function mailtoRecht(v, art) {
    var b = WN.aussen.rechtsblatt(v, art, rechtCtx()), m = WN.aussen.alsText(b);
    return "mailto:" + encodeURIComponent(b.kunde.mail || "") + "?subject=" + encodeURIComponent(m.betreff) + "&body=" + encodeURIComponent(m.text);
  }

  /* ════ Sterne der Mitarbeiter (Stufe 3 § 4f A) — zuerst auf Papier, Klaus trägt nach ════ */
  function sterneKarte(v, f) {
    var bed = BD.bedarfe(f.protokoll);
    var zB = BD.sterneZusammen(v, "bedarf"), zA = BD.sterneZusammen(v, "abnahme");
    var k = h("div", { class: "karte", "data-sterne": String((v.sterne || []).length) }, h("h2", { text: "⭐ " + t("Bewertung der Mitarbeiter im Fachbereich") }),
      h("p", { class: "gedaempft klein", text: t("Zwei Zeitpunkte: beim Bedarf (wie wichtig für die Arbeit?) und bei der Abnahme (wie gut erfüllt?). Zuerst auf Papier ankreuzen lassen, dann hier nachtragen. Erfasst werden Fachbereich und Kürzel — kein Name nötig. Grundlage des Abnahme-Gesprächs, keine Rechen-Automatik.") }),
      h("div", { class: "band" },
        knopf("🖨 " + t("Sternebogen beim Bedarf"), function () { drucke("sterne-bedarf"); }, "", { id: "druck-sterne-bedarf" }),
        knopf("🖨 " + t("Sternebogen bei der Abnahme"), function () { drucke("sterne-abnahme"); }, "", { id: "druck-sterne-abnahme" })));
    if (!bed.length) { k.append(h("p", { class: "gedaempft klein", text: t("Erst in Bereich 6 einen Bedarf eintragen.") })); return k; }
    var tb = h("table", { class: "klein" }, h("tr", null, h("th", { text: t("Kennung") }), h("th", { text: t("Bedarf") }), h("th", { class: "r", text: t("beim Bedarf") }), h("th", { class: "r", text: t("bei der Abnahme") })));
    var zelle = function (z) { return z ? "★ " + std(z.schnitt) + " (" + z.anzahl + ")" : "–"; };
    bed.forEach(function (e) { tb.append(h("tr", { "data-sterne-zeile": e.id }, h("td", { text: e.id }), h("td", { text: e.text }), h("td", { class: "r", text: zelle(zB[e.id]) }), h("td", { class: "r", text: zelle(zA[e.id]) }))); });
    k.append(h("div", { class: "tabelle-huelle" }, tb));
    var wahl = h("select", { id: "sterne-kennung" }); bed.forEach(function (e) { wahl.append(h("option", { value: e.id, text: e.id })); });
    var zp = h("select", { id: "sterne-zeitpunkt" }, h("option", { value: "bedarf", text: t("beim Bedarf") }), h("option", { value: "abnahme", text: t("bei der Abnahme") }));
    var ber = h("input", { id: "sterne-bereich", placeholder: t("Fachbereich, z. B. Verkauf"), class: "mittel" });
    var kz = h("input", { id: "sterne-kuerzel", placeholder: t("Kürzel (optional)"), class: "kurz" });
    var seg = h("span", { class: "seg", "data-sterne-wahl": "" });
    [1, 2, 3, 4, 5].forEach(function (n) {
      seg.append(h("button", { type: "button", text: "★" + n, "data-stern": String(n), "aria-label": n + " " + t("Sterne"), onclick: function () {
        var e = BD.sterneDazu(v, { zeitpunkt: zp.value, kennung: wahl.value, bereich: ber.value, kuerzel: kz.value, sterne: n });
        if (e) { merken(v); zeichne(); }
      } }));
    });
    k.append(h("div", { class: "zeile" }, wahl, zp, ber, kz, seg));
    (v.sterne || []).forEach(function (x) {
      k.append(h("div", { class: "eintrag", "data-stern-eintrag": x.id }, h("span", { class: "badge kennung", text: x.id }),
        h("span", { text: x.kennung + " · " + t(x.zeitpunkt === "abnahme" ? "bei der Abnahme" : "beim Bedarf") + " · " + "★".repeat(x.sterne) + " · " + [x.bereich, x.kuerzel].filter(Boolean).join(" ") }),
        knopf("✕", function () { v.sterne = v.sterne.filter(function (y) { return y !== x; }); merken(v); zeichne(); }, "klein gefahr", { "aria-label": t("Bewertung entfernen") })));
    });
    return k;
  }

  /* ════ Druckblätter — nur aus den Whitelist-Objekten (assets/kern/aussen.js) ════ */
  function datumText(iso) {
    if (!iso) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? (S.lang === "en" ? m[3] + "/" + m[2] + "/" + m[1] : m[3] + "." + m[2] + "." + m[1]) : iso;
  }
  function absender(fi) {
    return h("div", { class: "absender" }, fi.logo ? h("img", { src: fi.logo, alt: "" }) : null, fi.logo ? h("br") : null,
      h("b", { text: fi.name }), fi.anschrift ? "\n" + fi.anschrift : "", fi.kontakt ? "\n" + fi.kontakt : "");
  }
  function fuss(fi) {
    return h("div", { class: "fuss" }, [fi.name, fi.anschrift.replace(/\n/g, ", "), fi.kontakt, fi.steuer, fi.bank].filter(Boolean).join(" · "));
  }
  function kundenBlock(k) {
    return [k.firma, k.ansprechpartner, k.anschrift].filter(Boolean).join("\n");
  }
  /* „für: …“ — ohne Kundendaten eine leere Schreiblinie, nie ein Platzhalter (§ 1b) */
  function fuer(k, mitWort) {
    var txt = kundenBlock(k);
    return [mitWort === false ? "" : t("für") + ": ", txt ? txt : h("span", { class: "schreiblinie", "data-schreiblinie": "", "aria-label": t("von Hand ausfüllen") }), "\n"];
  }
  function unterschriften(a, b) {
    return h("div", { class: "unterschriften" },
      h("div", null, h("b", { text: a }), h("br"), t("Ort, Datum, Unterschrift")),
      h("div", null, h("b", { text: b }), h("br"), t("Ort, Datum, Unterschrift")));
  }
  function blattProtokoll(d) {
    var b = h("article", { class: "blatt", "data-blatt": "protokoll" });
    b.append(h("div", { class: "kopfzeile" },
      h("div", null, h("h1", { text: t("Bedarfsprotokoll") }),
        h("div", { class: "meta", style: "white-space:pre-line" }, (d.titel ? d.titel + "\n" : ""), fuer(d.kunde),
          t("Datum") + ": " + datumText(d.datum) + " · " + t("Fassung") + " " + d.fassung + " · " + d.vorgang)),
      absender(d.firma)));
    b.append(h("p", { class: "klein", text: t("Dieses Protokoll beschreibt, was benötigt wird und warum — nicht die technische Umsetzung.") }));
    d.bereiche.forEach(function (x) {
      var def = WN.BEREICHE[x.nr - 1];
      b.append(h("h2", { text: x.nr + " · " + nm(def.name) }));
      var ul = h("ul");
      x.eintraege.forEach(function (e) {
        var txt = e.text;
        if (e.anzahl != null && x.nr === 3) txt += " — " + e.anzahl;
        if (e.prio) txt += ": " + nm(WN.PRIO_NAME[e.prio]);
        if (e.nutzen) {
          var u = e.nutzen, teile = [];
          if (u.stundenMonat != null && u.stundenMonat !== "") teile.push(std(u.stundenMonat) + " h " + t("gespart je Monat"));
          if (u.euroMonat != null && u.euroMonat !== "") teile.push(euroG(Math.round(u.euroMonat * 100)) + " " + t("je Monat"));
          if (u.text) teile.push(u.text);
          txt += ": " + teile.join(", ") + " (" + t("Angabe des Kunden") + ")";
        }
        if (e.sterne) txt += " — ★ " + std(e.sterne.schnitt) + " (" + e.sterne.anzahl + " " + t("Bewertungen der Mitarbeiter") + ")";
        if (x.nr === 18 && (e.wer || e.bis)) txt += " — " + [e.wer ? t("klärt") + " " + e.wer : "", e.bis ? t("bis") + " " + datumText(e.bis) : ""].filter(Boolean).join(" ");
        ul.append(h("li", null, h("span", { class: "kenn", text: e.id }), " ", txt));
      });
      b.append(ul);
    });
    if (d.erklaerungVom) b.append(h("p", { class: "klein", "data-erklaerung-satz": "", text: t("Es gilt die Verschwiegenheits- und Datenschutzerklärung vom") + " " + datumText(d.erklaerungVom) + "." }));
    b.append(h("p", { class: "klein", style: "margin-top:18px", text: t("Bestätigt durch") + ":" }));
    b.append(unterschriften(t("Auftraggeber"), t("Auftragnehmer")));
    b.append(fuss(d.firma));
    return b;
  }
  function blattAnalyse(d) {
    var b = h("article", { class: "blatt", "data-blatt": "analyse" });
    b.append(h("div", { class: "kopfzeile" },
      h("div", null, h("h1", { text: t("Bedarfsanalyse") }),
        h("div", { class: "meta", style: "white-space:pre-line" }, (d.titel ? d.titel + "\n" : ""), fuer(d.kunde, false), datumText(d.datum) + " · " + t("Fassung") + " " + d.fassung + " · " + d.vorgang)),
      absender(d.firma)));
    b.append(h("div", { class: "intern-titel", text: t("Bedarfsanalyse — INTERN, nicht an den Kunden") }));
    WN.BEREICHE.forEach(function (def) {
      var roh = d.protokoll.bereiche[def.nr];
      var eintraege = def.art === "prio" || def.art === "nutzen" ? BD.bedarfe(d.protokoll) : roh.eintraege;
      if (!eintraege.length && !roh.notiz) return;
      b.append(h("h2", { text: def.nr + " · " + nm(def.name) + (roh.sichtbar ? "" : " 🔒") }));
      var ul = h("ul");
      eintraege.forEach(function (e) {
        var txt = e.text || "";
        if (def.art === "prio") txt += ": " + (e.prio ? nm(WN.PRIO_NAME[e.prio]) : "–");
        else if (def.art === "nutzen") { var u = e.nutzen || {}; txt += ": " + [u.stundenMonat != null && u.stundenMonat !== "" ? std(u.stundenMonat) + " h/" + t("Monat") : "", u.euroMonat != null && u.euroMonat !== "" ? euroG(u.euroMonat * 100) + "/" + t("Monat") : "", u.text || ""].filter(Boolean).join(", "); }
        else { if (def.nr === 3) txt += " — " + (e.anzahl || 0); if (def.nr === 18) txt += " — " + [e.wer, datumText(e.bis)].filter(Boolean).join(" "); }
        ul.append(h("li", null, h("span", { class: "kenn", text: e.id }), " ", txt, e.sichtbar === false ? " · 🔒 " + t("nur intern") : ""));
      });
      if (roh.notiz) ul.append(h("li", null, h("i", { text: "🔒 " + t("Notiz") + ": " + roh.notiz })));
      b.append(ul);
    });
    var s = d.schaetzung;
    b.append(h("h2", { text: t("Umfang und Schätzung") }));
    b.append(h("p", { text: t("Stundensatz dieses Auftrags") + ": " + euro(d.satzCent) + " · " + t("Stunden") + " " + std(s.stundenVon) + "–" + std(s.stundenBis) + " · " + t("netto") + " " + euroG(s.kostenVon) + "–" + euroG(s.kostenBis) }));
    var tb = h("table", null, h("tr", null, h("th", { text: t("Kennung") }), h("th", { text: t("Baustein") }), h("th", { text: t("Größe") }), h("th", { class: "r", text: t("Stunden") }), h("th", { class: "r", text: t("Kosten") })));
    (d.umfang.bausteine || []).forEach(function (bs, i) {
      var z = s.zeilen[i];
      tb.append(h("tr", null, h("td", { text: bs.id }), h("td", { text: R.bausteinName(bs, S.tabellen, S.lang) + (z.menge !== 1 ? " ×" + std(z.menge) : "") }),
        h("td", { text: z.geschaetzt ? (bs.groesse ? t({ klein: "klein", mittel: "mittel", gross: "groß" }[bs.groesse]) : t("von Hand")) : t("noch nicht geschätzt") }),
        h("td", { class: "r", text: z.geschaetzt ? std(z.von) + "–" + std(z.bis) : "–" }), h("td", { class: "r", text: z.geschaetzt ? euroG(z.kostenVon) + "–" + euroG(z.kostenBis) : "–" })));
    });
    b.append(tb);
    b.append(h("h2", { text: t("Kosten-Nutzen") + " (" + d.kn.monate + " " + t("Monate") + ")" }));
    var tk = h("table", null, h("tr", null, h("th", { text: t("Baustein") }), h("th", { text: t("Prio") }), h("th", { class: "r", text: t("Kosten") }), h("th", { class: "r", text: t("Nutzen") })));
    d.kn.zeilen.forEach(function (r, i) {
      if (i === d.kn.grenze) tk.append(h("tr", null, h("td", { colspan: "4", text: "— " + t("ab hier übersteigen die Kosten den Nutzen") + " —" })));
      tk.append(h("tr", null, h("td", { text: r.id }), h("td", { text: r.prio ? nm(WN.PRIO_NAME[r.prio]) : "–" }), h("td", { class: "r", text: euroG(r.kosten) }),
        h("td", { class: "r", text: r.nutzenZeitraum == null ? t("Nutzen nicht angegeben") : euroG(r.nutzenZeitraum) })));
    });
    b.append(tk, h("p", { class: "klein", text: t("Nutzen = Angabe des Kunden, Kosten = Schätzung. Beides keine Messung.") }));
    return b;
  }
  function positionenTabelle(liste, p19) {
    var tb = h("table", null, h("tr", null, h("th", { text: t("Pos.") }), h("th", { text: t("Leistung") }), p19 ? null : h("th", { class: "r", text: t("USt") }), h("th", { class: "r", text: t("Netto") })));
    liste.forEach(function (p, i) {
      tb.append(h("tr", null, h("td", { text: String(i + 1) }), h("td", { text: p.beschreibung }), p19 ? null : h("td", { class: "r", text: p.ustSatz + " %" }), h("td", { class: "r", text: euro(p.nettoCent) })));
    });
    return tb;
  }
  function blattAngebot(d) {
    var b = h("article", { class: "blatt", "data-blatt": "angebot" });
    b.append(h("div", { class: "kopfzeile" },
      h("div", null, h("h1", { text: t("Angebot") + " " + d.nummer }),
        h("div", { class: "meta", style: "white-space:pre-line" }, (d.titel ? d.titel + "\n" : ""), fuer(d.kunde),
          t("Datum") + ": " + datumText(d.datum) + (d.gueltigBis ? " · " + t("gültig bis") + " " + datumText(d.gueltigBis) : ""))),
      absender(d.firma)));
    b.append(h("p", { class: "klein", text: t("Grundlage ist das Bedarfsprotokoll, Fassung") + " " + d.fassung + "." }));
    b.append(positionenTabelle(d.positionen, d.summen.p19));
    b.append(summenTabelle(d.summen, true));
    if (d.optional.length) {
      b.append(h("h2", { text: t("Später / optional (nicht im Preis enthalten)") }));
      b.append(positionenTabelle(d.optional, d.summen.p19));
    }
    b.append(h("h2", { text: t("Ablauf") }));
    b.append(h("ol", { class: "klein" }, h("li", { text: t("Bedarfsprotokoll und Angebot") }), h("li", { text: t("Bau") + " — " + t("etwa") + " " + d.phasen.bauWochen + " " + t("Woche(n)") }),
      h("li", { text: t("Praxistest bei Ihnen") + " — " + t("etwa") + " " + d.phasen.testWochen + " " + t("Woche(n)") }), h("li", { text: t("Abnahme") }), h("li", { text: t("auf Wunsch: Betrieb und Pflege") })));
    b.append(h("p", { class: "klein", text: t("Alle Zeitangaben sind Schätzungen.") }));
    if (d.gewaehrleistung) b.append(h("p", { class: "klein", "data-gewaehr-satz": "", text: t("Inklusive") + " " + std(d.gewaehrleistung.umfang) + " " + t("Stunden Fehlerbehebung in der Anfangsphase nach der Abnahme.") }));
    if (d.zahlung || d.zahlungNachTest) b.append(h("p", { class: "klein" }, h("b", { text: t("Zahlung") + ": " }), [d.zahlung, d.zahlungNachTest ? t("Zahlung nach bestandenem Praxistest.") : ""].filter(Boolean).join(" ")));
    b.append(unterschriften(t("Auftraggeber"), t("Auftragnehmer")));
    b.append(fuss(d.firma));
    return b;
  }
  var ART_NAME = { neu: "neu", geaendert: "geändert", entfallen: "entfällt" };
  function blattNachtrag(d) {
    var b = h("article", { class: "blatt", "data-blatt": "nachtrag" });
    b.append(h("div", { class: "kopfzeile" },
      h("div", null, h("h1", { text: t("Nachtrag zu") + " " + d.nummer + " (" + t("Fassung") + " " + d.fassungNeu + ")" }),
        h("div", { class: "meta", style: "white-space:pre-line" }, (d.titel ? d.titel + "\n" : ""), fuer(d.kunde), t("Datum") + ": " + datumText(d.datum))),
      absender(d.firma)));
    if (d.anlass) b.append(h("p", null, h("b", { text: t("Anlass") + ": " }), d.anlass));
    b.append(h("h2", { text: t("Was sich ändert") + " (" + t("Fassung") + " " + d.fassungAlt + " → " + d.fassungNeu + ")" }));
    var ul = h("ul");
    d.leistungen.forEach(function (x) { ul.append(h("li", null, h("span", { class: "kenn", text: SYM[x.art] + " " + x.id }), " ", x.text + " — " + t(ART_NAME[x.art]) + (x.offen ? " (" + t("Preis folgt") + ")" : ""))); });
    d.bedarf.forEach(function (x) {
      ul.append(h("li", null, h("span", { class: "kenn", text: SYM[x.art] + " " + x.id }), " ",
        x.art === "geaendert" ? "„" + x.alt + "“ → „" + x.neu + "“" : (x.neu || x.alt) + " — " + t(ART_NAME[x.art])));
    });
    if (!d.leistungen.length && !d.bedarf.length) ul.append(h("li", { text: t("keine Änderungen") }));
    b.append(ul);
    b.append(h("h2", { text: t("Preis") }));
    var p19 = d.neu.p19;
    var tb = h("table");
    tb.append(h("tr", null, h("td", { text: t("bisher") + " (" + t("Fassung") + " " + d.fassungAlt + ")" }), h("td", { class: "r", text: euro(p19 ? d.alt.netto : d.alt.brutto) })));
    tb.append(h("tr", null, h("td", { text: t("neu") + " (" + t("Fassung") + " " + d.fassungNeu + ")" }), h("td", { class: "r", text: euro(p19 ? d.neu.netto : d.neu.brutto) })));
    var diff = p19 ? d.diff.netto : d.diff.brutto;
    tb.append(h("tr", { "data-diff": String(diff) }, h("td", null, h("b", { text: t("Unterschied") })), h("td", { class: "r" }, h("b", { text: (diff > 0 ? "+" : diff < 0 ? "−" : "±") + euro(Math.abs(diff)) }))));
    b.append(tb, h("p", { class: "klein", text: p19 ? t("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.") : t("Beträge brutto, einschließlich Umsatzsteuer.") }));
    b.append(h("p", null, h("b", { text: t("Neuer Termin") + ": " }), t("voraussichtlich bis") + " " + datumText(d.termin) + " (" + t("Schätzung") + ")"));
    b.append(h("p", { text: t("Mit Ihrer Unterschrift gilt Fassung") + " " + d.fassungNeu + ". " + t("Sie wissen damit, was Sie bekommen und was es kostet.") }));
    b.append(unterschriften(t("Auftraggeber"), t("Auftragnehmer")));
    b.append(fuss(d.firma));
    return b;
  }
  /* Wer mit wem (Klaus 2026-10-07: „im Kopf … wer der Auftraggeber, Auftragnehmer ist“):
     beide Parteien nebeneinander, leere Angaben als Schreiblinie zum Ausfüllen von Hand. */
  function parteienBlock(d) {
    var P = WN.aussen.parteien(d);
    var spalte = function (titel, zeilen, rolle) {
      var z = zeilen.filter(Boolean);
      return h("div", { "data-partei": rolle }, h("b", { text: titel }), h("br"),
        z.length ? z.join("\n") : h("span", { class: "schreiblinie", "data-schreiblinie": "", "aria-label": t("von Hand ausfüllen") }));
    };
    return h("div", { class: "parteien", "data-parteien": "" },
      spalte("Auftragnehmer", P.auftragnehmer, "auftragnehmer"), spalte("Auftraggeber", P.auftraggeber, "auftraggeber"));
  }
  function blattRecht(d) {
    var b = h("article", { class: "blatt", "data-blatt": d.art, lang: "de" });
    b.append(h("div", { class: "kopfzeile" },
      h("div", null, h("h1", { text: d.titel }),
        h("div", { class: "meta", style: "white-space:pre-line" }, (d.vorhaben ? d.vorhaben + "\n" : ""),
          (d.fassung ? "Angebot " + d.text.bezug.nummer + " · Fassung " + d.fassung + " · " : "") + d.vorgang)),
      d.firma.logo ? h("div", { class: "absender" }, h("img", { src: d.firma.logo, alt: "" })) : null));
    b.append(parteienBlock(d));
    b.append(h("p", { text: d.text.einleitung }));
    var abschnittEl = function (a) {
      var w = h("div", { class: "abschnitt" }, h("h2", { text: a.nr + ". " + a.titel }), h("p", { text: a.text }));
      if (a.tabelle && a.tabelle.length) {
        var tb = h("table", null, h("tr", null, h("th", { text: "Kennung" }), h("th", { text: "Leistung" }), h("th", { text: "deckt Bedarf" }), h("th", { class: "r", text: "Netto" })));
        a.tabelle.forEach(function (z) { tb.append(h("tr", null, h("td", { text: z.kennung }), h("td", { text: z.leistung }), h("td", { text: z.deckt || "–" }), h("td", { class: "r", text: G.formatEuro(z.nettoCent, "de") }))); });
        w.append(tb);
      }
      return w;
    };
    var ab = d.text.abschnitte;
    ab.slice(0, -1).forEach(function (a) { b.append(abschnittEl(a)); });
    /* Unterschriften stehen nie allein auf einer Seite: letzter Abschnitt, Schluss und
       Unterschriften bleiben beim Seitenumbruch zusammen. Die Linie liegt UNTER der Unterschrift. */
    var schluss = h("div", { class: "schlussblock", "data-schlussblock": "" });
    if (ab.length) schluss.append(abschnittEl(ab[ab.length - 1]));
    if (d.text.schluss) schluss.append(h("p", { text: d.text.schluss }));
    var feld = function (bild, txt, rolle) {
      return h("div", { "data-unterschrift-feld": rolle }, h("div", { class: "strich" }, bild ? h("img", { src: bild, alt: "", class: "unterschrift-bild", "data-unterschrift-bild": "" }) : null),
        h("b", { text: txt }), h("br"), "Ort, Datum, Unterschrift");
    };
    schluss.append(h("div", { class: "unterschriften mit-strich" }, feld(d.unterschriftBetrieb, WN.aussen.linksText(d.text.links), "betrieb"), feld(d.unterschriftKunde, d.text.rechts, "kunde")));
    schluss.append(h("p", { class: "klein", "data-recht-stand": d.aktiviert ? "aktiviert" : "offen", text: (d.aktiviert ? "Unterschrieben" + (d.papier ? " auf Papier" : "") + " am " + datumText(d.aktiviert) + " · " : "") + "Textfassung " + d.textFassung + " (" + datumText(d.textStand) + ")" }));
    b.append(schluss);
    b.append(fuss(d.firma));
    return b;
  }
  function blattSterne(d) {
    var b = h("article", { class: "blatt", "data-blatt": "sternebogen" });
    b.append(h("div", { class: "kopfzeile" },
      h("div", null, h("h1", { text: t(d.zeitpunkt === "abnahme" ? "Bewertung bei der Abnahme" : "Bewertung des Bedarfs") }),
        h("div", { class: "meta", style: "white-space:pre-line" }, (d.titel ? d.titel + "\n" : ""), fuer(d.kunde), t("Fassung") + " " + d.fassung + " · " + d.vorgang)),
      absender(d.firma)));
    b.append(h("p", { class: "klein", text: t(d.zeitpunkt === "abnahme" ? "Wie gut erfüllt das Ergebnis diesen Bedarf? Bitte je Zeile 1 bis 5 Sterne ankreuzen." : "Wie wichtig ist dieser Bedarf für Ihre Arbeit? Bitte je Zeile 1 bis 5 Sterne ankreuzen.") }));
    b.append(h("p", null, t("Fachbereich") + ": ", h("span", { class: "schreiblinie", style: "min-width:40%" }), "  " + t("Kürzel") + ": ", h("span", { class: "schreiblinie", style: "min-width:15%" })));
    var tb = h("table", null, h("tr", null, h("th", { text: t("Kennung") }), h("th", { text: t("Bedarf") }), h("th", { text: "☆ 1 · 2 · 3 · 4 · 5" })));
    d.bedarfe.forEach(function (e) { tb.append(h("tr", null, h("td", { text: e.id }), h("td", { text: e.text }), h("td", { class: "sterne-ankreuzen", text: "☐1 ☐2 ☐3 ☐4 ☐5" }))); });
    b.append(tb, fuss(d.firma));
    return b;
  }
  function blattBauen(art, opts) {
    var v = aktiverVorgang(), f = sichtFassung(v);
    if (art === "protokoll") { var d = WN.aussen.kundenProtokoll(v, f, S.einst.firma); return { blatt: blattProtokoll(d), aus: d.ausgeblendet }; }
    if (art === "analyse") return { blatt: blattAnalyse(WN.aussen.analyseIntern(v, f, S.einst.firma, S.einst.ust, S.tabellen, S.einst.zeitraum, S.lang)) };
    if (WN.aussen.RECHT_ARTEN.indexOf(art) >= 0) return { blatt: blattRecht(WN.aussen.rechtsblatt(v, art, rechtCtx())), recht: true };
    if (art === "sterne-bedarf" || art === "sterne-abnahme") return { blatt: blattSterne(WN.aussen.sterneBogenExtern(v, f, S.einst.firma, art.slice(7))) };
    if (art === "angebot") return { blatt: blattAngebot(WN.aussen.angebotExtern(v, f, S.einst.firma, S.einst.ust, S.tabellen, S.einst.zeitraum, S.lang)) };
    if (art === "nachtrag") {
      var alt = v.fassungen.filter(function (x) { return x.nr === opts.alt; })[0], neu = v.fassungen.filter(function (x) { return x.nr === opts.neu; })[0];
      return { blatt: blattNachtrag(WN.aussen.nachtragExtern(v, alt, neu, S.einst.firma, S.einst.ust, S.tabellen, S.einst.zeitraum, S.lang)) };
    }
    return null;
  }
  function drucke(art, opts) {
    var r = blattBauen(art, opts || {});
    var d = document.getElementById("druck");
    d.replaceChildren(r.blatt);
    d.dataset.art = art;
    window.print();
  }
  function vorschau(art, opts) {
    var r = blattBauen(art, opts || {});
    var dlg = document.getElementById("vorschau");
    var kopf = h("div", { class: "vorschau-kopf" },
      h("b", { text: t("Vorschau — genau das, was gedruckt wird") }),
      art === "protokoll" ? h("span", { class: "badge intern", "data-ausgeblendet": String(r.aus), text: r.aus + " " + t("Punkte sind ausgeblendet") }) : null,
      r.recht ? h("span", { class: "badge gelb", "data-entwurf": "", text: "⚠ " + t("Entwurf, kein Rechtsrat — vor Verwendung prüfen lassen.") }) : null,
      h("div", { class: "band" }, knopf("🖨 " + t("Drucken / als PDF"), function () { dlg.close(); drucke(art, opts); }, "pri klein"),
        r.recht && aktiverVorgang()[art] && aktiverVorgang()[art].aktiviert ? h("a", { class: "btn klein", href: mailtoRecht(aktiverVorgang(), art), "data-vorschau-mail": "" }, "✉ " + t("Per E-Mail")) : null,
        knopf("✕", function () { dlg.close(); }, "klein", { "aria-label": t("Schließen") })));
    dlg.replaceChildren(kopf, h("div", { class: "vorschau-papier" }, r.blatt));
    dlg.dataset.art = art;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }

  /* ── Glanzpunkt folgt der Maus (nach tomy-ui/effects.js wireHolo) ── */
  function glanz() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener("pointermove", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".btn");
      if (!b) return;
      var r = b.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      b.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); b.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      b.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg"); b.style.setProperty("--rx", (-(py - 0.5) * 10).toFixed(2) + "deg");
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".btn");
      if (b) ["--mx", "--my", "--rx", "--ry"].forEach(function (p) { b.style.removeProperty(p); });
    }, { passive: true });
  }

  /* ── ⟳ Neu laden: eigenen Vorrat wegwerfen, mit neuer Adresse laden ── */
  function neuLaden() {
    var EIGEN = /^workflow-needs-/;
    Promise.resolve().then(function () {
      return window.caches ? caches.keys().then(function (n) { return Promise.all(n.filter(function (x) { return EIGEN.test(x); }).map(function (x) { return caches.delete(x); })); }) : null;
    }).catch(function () {}).then(function () {
      return navigator.serviceWorker && navigator.serviceWorker.getRegistrations ? navigator.serviceWorker.getRegistrations().then(function (rs) {
        var hier = new URL("./", location.href).href;
        return Promise.all(rs.filter(function (r) { return r.scope === hier; }).map(function (r) { return r.unregister(); }));
      }) : null;
    }).catch(function () {}).then(function () { return jetztSpeichern(); }).then(function () {
      location.replace(location.pathname + "?frisch=" + Date.now() + location.hash);
    });
  }

  /* ── Start ── */
  function start() {
    try { if (/[?&]frisch=/.test(location.search) && history.replaceState) history.replaceState(null, "", location.pathname + location.hash); } catch (_e) {}
    var th = lsGet(LS.thema);
    if (th === "light") document.documentElement.dataset.theme = "light";
    document.getElementById("thema").addEventListener("click", function () {
      var hell = document.documentElement.dataset.theme !== "light";
      if (hell) document.documentElement.dataset.theme = "light"; else delete document.documentElement.dataset.theme;
      lsSet(LS.thema, hell ? "light" : "dark"); zeichneKopf();
    });
    document.getElementById("sprache").addEventListener("click", function () {
      S.lang = S.lang === "en" ? "de" : "en"; lsSet(LS.lang, S.lang); zeichne();
    });
    document.getElementById("neuladen").addEventListener("click", neuLaden);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var d = document.getElementById("vorschau"); if (d.open) d.close(); } });
    glanz();
    dbAlle().then(function (liste) {
      S.vorgaenge = liste.sort(function (a, b) { return a.id < b.id ? 1 : -1; });
      if (lsGet(LS.beispiel) !== "1" && !S.vorgaenge.length) beispielLaden();
      if (!aktiverVorgang() && S.vorgaenge[0]) S.aktiv = S.vorgaenge[0].id;
      zeichne();
      document.body.dataset.bereit = "1";
    }).catch(function () {
      melde(t("Der Speicher (IndexedDB) ist nicht erreichbar — Vorgänge werden nicht gespeichert."), "bad");
    });
  }

  window.WNApp = { S: S, zeichne: zeichne, blattBauen: blattBauen, jetztSpeichern: jetztSpeichern, beispielLaden: beispielLaden,
    einlesenText: einlesenText, mdErzeugen: mdErzeugen, t: t };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

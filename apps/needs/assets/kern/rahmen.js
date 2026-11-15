/* Rahmen des Vorhabens (Klaus 2026-11-13, Ja zu F1–F6, U1 nach dem Rückwärtstest).
   Der Rückwärtstest (Datei-Organizer rueckwaertstest/) zeigte: Geräte, Datenort und Sicherung, das Zusammenspiel
   mit eigenen Programmen, was ausdrücklich NICHT gebaut wird und ob die Lösung vorschlägt oder selbst handelt,
   fragte Needs nie — und genau das ging auf dem Weg zum Bauauftrag verloren.
   Gespeichert an der Fassung (wie alles im Bedarf): protokoll.rahmen = { geraete: [ids], offline: id|"",
   datenort: [ids], sicherung: [ids], eigene: [ids], eigeneText: "", budgetEuro: Zahl|null },
   protokoll.nicht = [{ id: "N-nn", text, sichtbar }], am Bedarf (Bereich 6) e.handeln = id|"".
   Ältere Fassungen haben nichts davon: alles gilt dann als „nicht erfragt“, nichts wird erfunden. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};
  function o(id, de, en) { return { id: id, name: { de: de, en: en } }; }

  WN.RAHMEN = {
    geraete: { bereich: 10, mehrfach: true, frage: { de: "Wo wird es benutzt?", en: "Where will it be used?" },
      wahl: [o("android", "Android-Handy", "Android phone"), o("iphone", "iPhone", "iPhone"), o("tablet", "Tablet", "Tablet"),
        o("windows", "Windows-PC", "Windows PC"), o("mac", "Mac", "Mac"), o("browser", "im Browser", "in the browser")] },
    offline: { bereich: 10, mehrfach: false, frage: { de: "Muss es ohne Internet gehen?", en: "Must it work without internet?" },
      wahl: [o("immer", "ja, alles Wichtige geht ohne Internet (Netz nur für ausdrücklich gewählte Dienste)", "yes, everything important works offline (network only for services chosen on purpose)"), o("unterwegs", "reicht unterwegs", "on the road is enough"), o("nein", "nein", "no")] },
    /* Klaus 2026-11-13: Abgleich zwischen Geräten ist heute Standard (Bestellung am Tablet → sofort in der Küche). */
    abgleich: { bereich: 10, mehrfach: false, frage: { de: "Sollen mehrere Geräte dieselben Daten sehen?", en: "Should several devices see the same data?" },
      wahl: [o("sofort", "ja, sofort (z. B. Tablet → Küche)", "yes, instantly (e.g. tablet → kitchen)"), o("abundzu", "ja, Abgleich ab und zu reicht", "yes, occasional sync is enough"),
        o("eins", "nein, ein Gerät reicht", "no, one device is enough")] },
    eigene: { bereich: 12, mehrfach: true, frage: { de: "Eigene Programme, die schon da sind: was soll zusammenpassen?", en: "Own programs already in use: what must fit together?" },
      wahl: [o("ablageort", "gemeinsamer Ablageort", "shared storage place"), o("hinher", "Dateien hin- und hergeben", "pass files back and forth"),
        o("suche", "gemeinsame Suche", "shared search")] },
    datenort: { bereich: 13, mehrfach: true, frage: { de: "Wo dürfen die Daten liegen?", en: "Where may the data be stored?" },
      wahl: [o("geraet", "auf dem Gerät", "on the device"), o("ordner", "eigener Ordner / Speicherkarte", "own folder / memory card"),
        o("server", "eigener Server", "own server"), o("cloud", "Cloud eines Anbieters", "a provider's cloud")] },
    sicherung: { bereich: 13, mehrfach: true, frage: { de: "Sicherung", en: "Backup" },
      wahl: [o("verschluesselt", "verschlüsselt", "encrypted"), o("zweiterort", "an einen zweiten Ort", "to a second place"),
        o("selbst", "selbst anstoßen", "started by hand"), o("allein", "von allein", "automatic")] },
    /* Klaus 2026-11-13: KI auf dem Gerät, wenn gewünscht, oder über einen Dienst — der Kunde wählt. Hardware ist eine eigene Entscheidung. */
    ki: { bereich: 14, mehrfach: false, frage: { de: "Wo darf eine KI laufen?", en: "Where may an AI run?" },
      wahl: [o("keine", "keine KI", "no AI"), o("geraet", "nur auf dem Gerät", "only on the device"), o("dienst", "über einen Dienst (nach Bestätigung)", "via a service (after confirmation)"),
        o("wahl", "beides — der Nutzer wählt in der App", "both — the user chooses in the app")] },
  };
  WN.RAHMEN_FELDER = ["geraete", "offline", "abgleich", "eigene", "datenort", "sicherung", "ki"];
  WN.HANDELN = [o("vorschlagen", "schlägt vor, ich bestätige", "suggests, I confirm"), o("selbst", "macht es selbst", "does it itself"), o("egal", "egal", "either")];

  /* Budget (Klaus 2026-11-13): einmalig gesamt UND/ODER Monatsrate über eine Laufzeit, die den Kaufpreis abgilt; Wartung kann darin stecken. */
  function leer() { return { geraete: [], offline: "", abgleich: "", eigene: [], eigeneText: "", datenort: [], sicherung: [], ki: "",
    budgetEuro: null, budgetMonatEuro: null, budgetMonate: null, budgetWartung: false }; }
  /* Lesen ohne zu verändern (für Bauauftrag, Ausdruck, Proben) */
  function von(protokoll) {
    var r = (protokoll && protokoll.rahmen) || {}, l = leer();
    Object.keys(l).forEach(function (k) { if (r[k] !== undefined && r[k] !== null) l[k] = Array.isArray(l[k]) ? (Array.isArray(r[k]) ? r[k].slice() : []) : r[k]; });
    return l;
  }
  /* Zum Ändern: legt rahmen/nicht an, wenn sie fehlen */
  function sicher(protokoll) {
    if (!protokoll.rahmen) protokoll.rahmen = leer();
    var l = leer(); Object.keys(l).forEach(function (k) { if (protokoll.rahmen[k] === undefined) protokoll.rahmen[k] = l[k]; });
    if (!Array.isArray(protokoll.nicht)) protokoll.nicht = [];
    return protokoll.rahmen;
  }
  function umschalten(protokoll, feld, id) {
    var r = sicher(protokoll), def = WN.RAHMEN[feld];
    if (!def || !def.wahl.some(function (w) { return w.id === id; })) return false;
    if (def.mehrfach) { var i = r[feld].indexOf(id); if (i >= 0) r[feld].splice(i, 1); else r[feld].push(id); }
    else r[feld] = r[feld] === id ? "" : id;
    return true;
  }
  function nichtNeu(vorgang, protokoll, text) {
    sicher(protokoll);
    var t = String(text || "").trim(); if (!t) return null;
    var e = { id: WN.bedarf.neueKennung(vorgang, "N"), text: t, sichtbar: true };
    protokoll.nicht.push(e);
    return e;
  }
  function nicht(protokoll) { return (protokoll && Array.isArray(protokoll.nicht)) ? protokoll.nicht : []; }
  function name(feld, id, lang) {
    var def = feld === "handeln" ? { wahl: WN.HANDELN } : WN.RAHMEN[feld];
    var w = def && def.wahl.filter(function (x) { return x.id === id; })[0];
    return w ? (w.name[lang] || w.name.de) : "";
  }
  function liste(r, feld, lang) {
    var x = r[feld]; if (!x || (Array.isArray(x) && !x.length)) return "";
    return (Array.isArray(x) ? x : [x]).map(function (id) { return name(feld, id, lang); }).filter(Boolean).join(", ");
  }
  /* Ist überhaupt etwas erfragt? (für „noch nicht erfragt“) */
  function erfragt(protokoll) {
    var r = von(protokoll);
    return WN.RAHMEN_FELDER.some(function (k) { return Array.isArray(r[k]) ? r[k].length : !!r[k]; }) || !!String(r.eigeneText || "").trim() ||
      nicht(protokoll).length > 0 || (WN.bedarf.bedarfe(protokoll) || []).some(function (e) { return !!e.handeln; });
  }

  /* U1 · Schlüssigkeit des Umfangs: Muss-Bedarf ohne Baustein, Baustein zeigt auf einen Bedarf, den es nicht gibt. */
  function schluessig(fassung) {
    var p = fassung.protokoll, bs = (fassung.umfang && fassung.umfang.bausteine) || [];
    var da = {}; WN.bedarf.alleEintraege(p).forEach(function (x) { da[x.e.id] = 1; });
    var gedeckt = {}; bs.forEach(function (b) { (b.deckt || []).forEach(function (id) { gedeckt[id] = 1; }); });
    var mussOhne = WN.bedarf.bedarfe(p).filter(function (e) { return e.prio === "muss" && !gedeckt[e.id]; }).map(function (e) { return e.id; });
    var verwaist = [];
    bs.forEach(function (b) { (b.deckt || []).forEach(function (id) { if (!da[id]) verwaist.push({ baustein: b.id, bedarf: id }); }); });
    return { ok: !mussOhne.length && !verwaist.length, mussOhne: mussOhne, verwaist: verwaist };
  }
  /* F6 · Budget gegen Schätzung (nur intern): Rahmen des Kunden in Euro gesamt gegen die untere Schätzung netto. */
  function zahlOk(x) { var n = Number(x); return x !== null && x !== "" && Number.isFinite(n) && n > 0 ? n : 0; }
  /* Budget-Gegenwert: einmalig + Monatsrate × Laufzeit (ohne Laufzeit: monateVorgabe, Vorgabe 24 = Kosten-Nutzen-Zeitraum). */
  function budget(fassung, schaetzung, monateVorgabe) {
    var r = von(fassung.protokoll);
    var einmal = zahlOk(r.budgetEuro), monat = zahlOk(r.budgetMonatEuro);
    if ((!einmal && !monat) || !schaetzung) return null;
    var monate = zahlOk(r.budgetMonate) || zahlOk(monateVorgabe) || 24;
    var cent = Math.round((einmal + (monat ? monat * monate : 0)) * 100);
    return { budgetCent: cent, einmalCent: Math.round(einmal * 100), monatCent: Math.round(monat * 100), monate: monat ? monate : 0,
      laufzeitGeschaetzt: !!monat && !zahlOk(r.budgetMonate), wartung: !!r.budgetWartung,
      kostenVon: schaetzung.kostenVon, kostenBis: schaetzung.kostenBis, ueber: schaetzung.kostenVon > cent };
  }
  /* Hinweise im Umfang (Klaus 2026-11-13): mehrere Geräte ohne Abgleich-Baustein; Faktor KI ohne Angabe, wo die KI läuft. */
  function hinweise(fassung) {
    var r = von(fassung.protokoll), bs = (fassung.umfang && fassung.umfang.bausteine) || [], out = [];
    var mehrere = r.geraete.length > 1 && r.abgleich !== "eins";
    if (mehrere && !bs.some(function (b) { return b.katalog === "abgleich"; })) out.push({ art: "abgleich", geraete: r.geraete.slice() });
    var kiB = bs.filter(function (b) { return (b.faktoren || []).indexOf("ki") >= 0; }).map(function (b) { return b.id; });
    if (kiB.length && !r.ki) out.push({ art: "ki-ort", bausteine: kiB });
    if (kiB.length && r.ki === "keine") out.push({ art: "ki-keine", bausteine: kiB });
    return out;
  }

  WN.rahmen = { leer: leer, von: von, sicher: sicher, umschalten: umschalten, nichtNeu: nichtNeu, nicht: nicht, name: name, liste: liste,
    erfragt: erfragt, schluessig: schluessig, budget: budget, hinweise: hinweise };
})(typeof window !== "undefined" ? window : globalThis);

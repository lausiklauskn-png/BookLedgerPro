/* Stufe 1 · das Bedarfsprotokoll — die 18 Bereiche (Brief § 3/§ 4).
   Hier steht NICHTS über Technik, Stunden oder Preis. Stufe 2 liest von hier,
   schreibt aber nie zurück. Kennungen (B-nn, O-nn) werden je Vorgang fortlaufend
   vergeben und nie neu nummeriert; ein entfernter Eintrag behält seine Kennung
   in den alten Fassungen, die Nummer wird nicht wieder vergeben. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  WN.DEFINITION = {
    de: "Das Bedarfsprotokoll ist eine strukturierte Dokumentation zur Erfassung, Beschreibung und Bewertung eines bestehenden oder zukünftigen Bedarfs im Bereich Digitalisierung, IT-Systeme, Apps, Websites, Software oder Geschäftsprozesse. Es beschreibt nicht die technische Umsetzung, sondern beantwortet: Was wird benötigt, warum, wer benötigt es, welche Anforderungen ergeben sich daraus?",
    en: "The needs record is a structured document for capturing, describing and assessing an existing or future need in digitalisation, IT systems, apps, websites, software or business processes. It does not describe the technical implementation; it answers: what is needed, why, who needs it, and which requirements follow from it?",
    kette: { de: "IST-Zustand → Problem/Schwachstelle → Bedarf → SOLL-Zustand → Anforderungen → Priorität/Nutzen", en: "Current state → problem/weakness → need → target state → requirements → priority/benefit" },
    abgrenzung: { de: "Kein Programmierauftrag, kein Lastenheft, kein Pflichtenheft, kein Software-, Architektur-, Datenbank- oder UI/UX-Konzept, kein Entwicklungsplan. Es ist die fachliche Grundlage dafür. Reihenfolge der Fragen: Was wird im Betrieb benötigt und warum? → Was muss eine mögliche Lösung können? → Wie wird sie technisch umgesetzt?",
      en: "Not a programming order, not a requirements or functional specification, not a software, architecture, database or UI/UX concept, not a development plan. It is the business basis for them. Order of questions: What does the business need, and why? → What must a possible solution be able to do? → How is it implemented technically?" },
  };

  function B(nr, de, en, art, chips) { return { nr: nr, name: { de: de, en: en }, art: art || "liste", chips: chips || [] }; }
  function c(de, en) { return { de: de, en: en }; }
  /* art: liste (Einträge) · zaehler (Eintrag + Anzahl) · bedarf (Einträge mit
     Priorität/Nutzen) · prio / nutzen (Sicht auf die Bedarfe aus Bereich 6) ·
     offen (Eintrag + wer/bis, Kennung O-nn) */
  WN.BEREICHE = [
    B(1, "Ausgangssituation (IST)", "Starting point (current state)", "liste", [c("Papier", "Paper"), c("Excel", "Excel"), c("E-Mail", "E-mail"), c("alte Software", "old software"), c("nichts", "nothing")]),
    B(2, "Betroffener Prozess", "Affected process", "liste", [c("Auftrag", "Order"), c("Lager", "Stock"), c("Buchhaltung", "Bookkeeping"), c("Termin", "Appointment"), c("Kundenkontakt", "Customer contact"), c("Dokumente", "Documents")]),
    B(3, "Nutzer / Beteiligte", "Users / people involved", "zaehler", [c("Inhaber", "Owner"), c("Mitarbeiter", "Staff"), c("Kunden", "Customers"), c("Steuerberater", "Tax advisor")]),
    B(4, "Problem / Schwachstelle", "Problem / weakness", "liste", [c("doppelte Eingabe", "double entry"), c("Fehler", "errors"), c("Zeitverlust", "lost time"), c("fehlende Übersicht", "no overview")]),
    B(5, "Ursache", "Cause", "liste"),
    B(6, "Bedarf", "Need", "bedarf"),
    B(7, "Ziel (SOLL)", "Goal (target state)", "liste"),
    B(8, "Funktionaler Bedarf", "Functional need", "liste"),
    B(9, "Organisatorischer Bedarf", "Organisational need", "liste", [c("Schulung", "Training"), c("Rollen", "Roles"), c("Abläufe ändern", "Change procedures")]),
    B(10, "Technischer Bedarf", "Technical need", "liste", [c("Geräte", "Devices"), c("offline", "offline"), c("mehrere Standorte", "several locations")]),
    B(11, "Bestehende Systeme", "Existing systems", "liste"),
    B(12, "Schnittstellen", "Interfaces", "liste"),
    B(13, "Daten", "Data", "liste"),
    B(14, "Datenschutz / Sicherheit", "Data protection / security", "liste", [c("personenbezogene Daten: ja", "personal data: yes"), c("personenbezogene Daten: nein", "personal data: no")]),
    B(15, "Rahmenbedingungen", "Constraints", "liste", [c("Termin", "Deadline"), c("Budget-Rahmen (Angabe des Kunden)", "Budget (customer's statement)"), c("Vorgaben", "Requirements")]),
    B(16, "Priorität", "Priority", "prio"),
    B(17, "Erwarteter Nutzen", "Expected benefit", "nutzen"),
    B(18, "Offene Punkte", "Open points", "offen"),
  ];
  WN.PRIOS = ["muss", "soll", "kann"];
  WN.PRIO_NAME = { muss: c("Muss", "Must"), soll: c("Soll", "Should"), kann: c("Kann", "Could") };
  WN.HINWEIS_8 = c("Das System muss …", "The system must …");

  function zwei(n) { return n < 10 ? "0" + n : String(n); }

  function leeresProtokoll() {
    var bereiche = {};
    WN.BEREICHE.forEach(function (b) { bereiche[b.nr] = { sichtbar: true, notiz: "", eintraege: [] }; });
    return { bereiche: bereiche };
  }

  /* Neue Kennung aus dem Zähler des Vorgangs (B, K, O). */
  function neueKennung(vorgang, art) {
    vorgang.zaehler = vorgang.zaehler || {};
    var n = (vorgang.zaehler[art] || 0) + 1;
    vorgang.zaehler[art] = n;
    return art + "-" + zwei(n);
  }

  function eintragNeu(vorgang, protokoll, nr, text, extra) {
    var bereich = protokoll.bereiche[nr];
    var art = nr === 18 ? "O" : "B";
    var e = { id: neueKennung(vorgang, art), text: String(text || "").trim(), sichtbar: true };
    if (nr === 3) e.anzahl = 1;
    if (nr === 6) { e.prio = ""; e.nutzen = { stundenMonat: null, euroMonat: null, text: "" }; }
    if (nr === 18) { e.wer = ""; e.bis = ""; }
    if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
    bereich.eintraege.push(e);
    return e;
  }

  function bedarfe(protokoll) { return (protokoll.bereiche[6] && protokoll.bereiche[6].eintraege) || []; }

  /* Fortschritt „12 von 18 ausgefüllt" */
  function ausgefuellt(protokoll, nr) {
    var b = protokoll.bereiche[nr];
    var art = WN.BEREICHE[nr - 1].art;
    if (art === "prio") return bedarfe(protokoll).some(function (e) { return !!e.prio; });
    if (art === "nutzen") return bedarfe(protokoll).some(function (e) { return hatNutzen(e); });
    return !!(b && b.eintraege.length);
  }
  function fortschritt(protokoll) {
    var n = 0;
    WN.BEREICHE.forEach(function (b) { if (ausgefuellt(protokoll, b.nr)) n++; });
    return n;
  }
  function hatNutzen(e) {
    var u = e && e.nutzen;
    return !!u && ((u.stundenMonat != null && u.stundenMonat !== "") || (u.euroMonat != null && u.euroMonat !== "") || !!(u.text && u.text.trim()));
  }

  /* Alle Einträge mit Bereich (für Vergleich und Ausdruck) */
  function alleEintraege(protokoll) {
    var out = [];
    WN.BEREICHE.forEach(function (b) {
      (protokoll.bereiche[b.nr].eintraege || []).forEach(function (e) { out.push({ nr: b.nr, e: e }); });
    });
    return out;
  }

  /* Sterne der Mitarbeiter im Fachbereich (Stufe 3 § 4f A): v.sterne = [{ id: "S-nn", zeitpunkt: "bedarf"|"abnahme",
     kennung: "B-nn", bereich, kuerzel, sterne: 1…5, datum }]. Am Vorgang, nicht an der Fassung — die Kennungen
     bleiben über alle Fassungen gleich. Zusammengefasst je Kennung: Durchschnitt und Anzahl, nie Namen. */
  function sterneDazu(vorgang, angaben) {
    var a = angaben || {}, n = Math.round(Number(a.sterne));
    if (!(n >= 1 && n <= 5) || !/^B-\d+$/.test(a.kennung || "")) return null;
    vorgang.sterne = vorgang.sterne || [];
    var e = { id: neueKennung(vorgang, "S"), zeitpunkt: a.zeitpunkt === "abnahme" ? "abnahme" : "bedarf", kennung: a.kennung,
      bereich: String(a.bereich || "").trim(), kuerzel: String(a.kuerzel || "").trim(), sterne: n, datum: a.datum || new Date().toISOString().slice(0, 10) };
    vorgang.sterne.push(e);
    return e;
  }
  function sterneZusammen(vorgang, zeitpunkt) {
    var m = {};
    ((vorgang && vorgang.sterne) || []).forEach(function (x) {
      if (x.zeitpunkt !== zeitpunkt) return;
      var z = m[x.kennung] = m[x.kennung] || { summe: 0, anzahl: 0 };
      z.summe += Number(x.sterne) || 0; z.anzahl++;
    });
    Object.keys(m).forEach(function (k) { m[k].schnitt = Math.round(m[k].summe / m[k].anzahl * 10) / 10; delete m[k].summe; });
    return m;
  }

  WN.bedarf = { sterneDazu: sterneDazu, sterneZusammen: sterneZusammen, leeresProtokoll: leeresProtokoll, neueKennung: neueKennung, eintragNeu: eintragNeu,
    bedarfe: bedarfe, ausgefuellt: ausgefuellt, fortschritt: fortschritt, hatNutzen: hatNutzen, alleEintraege: alleEintraege };
})(typeof window !== "undefined" ? window : globalThis);

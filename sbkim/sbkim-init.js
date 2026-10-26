/*
 * SBKIM — Andock-Runtime + Auto-Lauschen (Stufe 2, 2026-06-27)
 *
 * BookLedgerPro war bisher SBKIM-Knoten nur über Identität (Ed25519-Spore) +
 * Briefkasten (§11.6). Dieser Init hebt den Knoten auf den Live-Nostr-Kanal:
 * er lädt den Modul-Runtime (01 Storage / 02 Spore / 03 Embedding /
 * 04 Match / 05 Anastomose / 05b Nostr-Relais / 07 Apoptose) und beginnt
 * beim Öffnen selbsttätig am Relais `wss://relay.family-projekt.de` zu lauschen.
 *
 * EMPFANGSMODUS MIT ANTWORTRECHT: der Knoten lauscht auf eingehende
 * Handshakes und ANTWORTET nur — er initiiert NIE von sich aus (kein
 * Crawler, keine Pulsation, keine Eigenanfrage ins offene Netz). Der
 * Handshake betrifft AUSSCHLIESSLICH die SBKIM-Identität (Ed25519-Spore) —
 * NIE Buchhaltungs-/Klartext-Daten (die bleiben verschlüsselt, lokal).
 *
 * Vollständig fail-soft + nicht-blockierend: ohne Browser (WebCrypto/
 * IndexedDB), ohne Relais-Client (Modul 05b, type=module) oder bei
 * Netz-Fehler passiert schlicht nichts — die App bleibt voll nutzbar.
 *
 * Muster: family-project/sbkim/sbkim-init.js + Sage-Protokol/sbkim-init.js.
 * Die acht Module sind byte-identisch aus Sage `src/modules/` kopiert.
 */
(function () {
  "use strict";

  // Eigener IndexedDB-Namensraum der SBKIM-Identität — getrennt von der
  // Buchhaltungs-DB (DB-Suffix `bookledgerpro` der App bleibt unberührt).
  var DB_SUFFIX = "bookledgerpro-sbkim";

  // Wartet kurz, bis das deferred type=module 05b window.SbkimNostrRelay
  // gesetzt hat (Module laufen nach klassischen Skripten). Fail-soft.
  function waitForRelay(tries) {
    return new Promise(function (resolve) {
      var n = tries || 25;
      (function poll() {
        if (window.SbkimNostrRelay) return resolve(window.SbkimNostrRelay);
        if (--n <= 0) return resolve(null);
        setTimeout(poll, 80);
      })();
    });
  }

  function boot() {
    (async function () {
      try {
        if (!window.SbkimStorage) return; // Module nicht geladen — still aussteigen.
        await SbkimStorage.init({ dbSuffix: DB_SUFFIX });

        // Modul 17 Floating-Widget — Lampen-Design (LEBT/VERKEHR/FREMD/SIEGEL),
        // self-mountend, verschiebbar, schließbar. Klick auf VERKEHR zeigt die
        // letzten 10 Handshakes/Knoten. Betrifft NUR die SBKIM-Statusanzeige,
        // nie Buchhaltungsdaten. Fail-soft. MUSS vor Membran (15) + Siegel (16)
        // laufen, damit die Proxy-Spans #lamp-fremd + #sbkim-siegel-badge im
        // DOM stehen (Karte 09 § Schritt 12).
        if (window.SbkimWidget && typeof SbkimWidget.init === "function") {
          try {
            await SbkimWidget.init({
              slots: ["lebt", "verkehr", "fremd", "siegel"],
              allowedOrigins: ["https://lausiklauskn-png.github.io"],
              repoUrl: "https://github.com/lausiklauskn-png/BookLedgerPro",
            });
          } catch (e) { console.warn("[BLP-SBKIM] Widget-Init übersprungen:", e); }
        }

        // Modul 15 Membran (Außenhülle / Fremdzugriff-Lampe) + Modul 16 Siegel
        // (Selbst-Bezeugung). Nach dem Widget, damit die Proxy-Spans bereitstehen.
        // Das Siegel rendert NUR, wenn die Pflicht-Module 01/02/03/04/05/07/15
        // wirklich geladen sind (Anti-Greenwashing). Fail-soft.
        if (window.SbkimMembrane && typeof SbkimMembrane.init === "function") {
          try {
            await SbkimMembrane.init({
              allowedOrigins: ["https://lausiklauskn-png.github.io"],
              // Unsere Fachworte beim Antworten (Kanon-Option seit 2026-08-14).
              //
              // Fragt ein anderer Knoten nach „Faktura", soll er auch das
              // finden, was bei uns „Rechnung" heißt. Die Frage wird dafür vor
              // dem Suchen aufgefächert und zusätzlich nach Wörtern gesucht
              // (BM25 neben dem Vektor) — es kommen nur Treffer DAZU.
              //
              // Diese Karte stand bis zum 2026-08-14 in unserer KOPIE von
              // Modul 15. Das war der Griff, den „kopieren, nicht klonen"
              // verbietet: das nächste byte-1:1-Nachziehen hätte sie gelöscht.
              // Jetzt liegt die Mechanik im Kanon und die Worte hier, wo die
              // Domäne bekannt ist. Wer hier ein Fachwort ergänzt, ändert
              // KEIN Modul.
              queryInclusion: {
                synonyms: {
                  "rechnung": ["faktura"], "faktura": ["rechnung"],
                  "beleg": ["quittung"], "quittung": ["beleg"],
                  "ust": ["umsatzsteuer", "mehrwertsteuer"], "umsatzsteuer": ["ust", "mehrwertsteuer"],
                  "mehrwertsteuer": ["umsatzsteuer", "ust"], "mwst": ["umsatzsteuer", "ust"],
                  "foto": ["bild"], "bild": ["foto"],
                },
              },
            });
          } catch (e) { console.warn("[BLP-SBKIM] Membran-Init übersprungen:", e); }
        }
        if (window.SbkimSiegel && typeof SbkimSiegel.init === "function") {
          try {
            SbkimSiegel.init({
              badgeSelector: "#sbkim-siegel-badge",
              repoUrl: "https://github.com/lausiklauskn-png/BookLedgerPro",
              // PFLICHT (Skill „status-leiste-siegel"): ohne ribbonText bleibt das
              // Ordens-Band im Wappen LEER — es gibt bewusst keine Auto-Ableitung
              // aus repoUrl. Jede App graviert ihren eigenen Namen ein.
              ribbonText: "BookLedgerPro",
            });
          } catch (e) { console.warn("[BLP-SBKIM] Siegel-Init übersprungen:", e); }
        }

        if (window.SbkimApoptose && typeof SbkimApoptose.init === "function") {
          try { await SbkimApoptose.init(); }
          catch (e) { console.warn("[BLP-SBKIM] Apoptose-Init übersprungen:", e); }
        }

        if (window.SbkimAnastomose && typeof SbkimAnastomose.init === "function") {
          await SbkimAnastomose.init();
        }

        await waitForRelay();
        if (window.SbkimAnastomose &&
            typeof SbkimAnastomose.listenNostr === "function" &&
            window.SbkimNostrRelay) {
          try {
            SbkimAnastomose.listenNostr()
              .then(function () {
                console.info("[BLP-SBKIM] Auto-Lauschen aktiv (Empfangsmodus mit Antwortrecht).");
                // Sichtbar im Widget: VERKEHR-Lampe ruhig grün (= lauscht).
                try { window.dispatchEvent(new CustomEvent("sbkim:nostr-listening", { detail: { active: true } })); } catch (e) {}
              })
              .catch(function (e) { console.warn("[BLP-SBKIM] Auto-Lauschen übersprungen:", e); });
          } catch (e) { console.warn("[BLP-SBKIM] Auto-Lauschen übersprungen:", e); }
        }
      } catch (e) {
        console.warn("[BLP-SBKIM] Andock-Init übersprungen (braucht Browser):", e);
      }
    })();
  }

  // ── Modul 23 Rendezvous — öffentlicher Floating-Knopf „🌐 Mit dem Netz
  // verbinden" (Klaus 2026-06-28: sofort öffentlich, eigener kleiner Knopf).
  // UNABHÄNGIG von der Andock-Kette gemountet (soll immer erscheinen). Mechanik
  // = geteiltes Modul 23 (SbkimRendezvous), nutzt den vorhandenen Stack lazy;
  // createIdentity erzeugt die lebende Spore bei Bedarf (Modul 03 Embedding —
  // schon Teil des Stacks, kein NEUES CDN — + Modul 02 generateOwnSpore) mit der
  // Buchhaltungs-Domänen-Beschreibung. Verfassungstreu: nutzer-ausgelöst, kein
  // Auto-Connect. EU-/BYOK-Leitplanken unberührt (Embedding ist lokales Modell).
  // Gerätename (frei wählbar, lokal) — reine ANZEIGE, kein Vertrauens-Beweis und
  // KEIN Spore-Re-Sign. Der Name reist nur als Anzeige-Zusatz zur Anmelde-Karte im
  // Raum mit; die signierte Identität (generateOwnSpore) behält RDV_CFG.nodeName.
  // sbkim-init.js ist ein klassisches Skript (kein ES-Import) → eigener Mini-Helfer,
  // liest denselben localStorage-Schlüssel wie src/ui/geraetename.js.
  function bkGeraetename() {
    try { return (window.localStorage.getItem("sbkim_geraetename") || "").trim().slice(0, 40); }
    catch (e) { return ""; }
  }
  // Alle Namensfelder der Seite gleichziehen. Eine App darf mehrere haben (Panel +
  // eigenes Feld in den Einstellungen); sie schreiben denselben Speicher und dürfen
  // beim Tippen nicht auseinanderlaufen. Programmatisches Setzen von .value löst
  // kein "input" aus — deshalb keine Schleife.
  function syncGeraetenameFields() {
    try {
      var v = geraetename();
      var list = document.querySelectorAll("[data-sbkim-geraetename]");
      for (var i = 0; i < list.length; i++) { if (list[i].value !== v) list[i].value = v; }
    } catch (_e) {}
  }
  // NETZWEITE BAUREGEL (INTERFACES §11.7): jeder Knoten mit Verbinden-Panel trägt
  // das Gerätenamen-Feld IM Panel. Der Einbau hängt sich an das geteilte Panel
  // (#sbkim-rdv-panel) — kein index.html-Eingriff, und NIEMALS in die byte-kopierte
  // Panel-Datei schreiben (Drift-Guard).
  function injectGeraetenameField() {
    function tryInject() {
      var panel = document.getElementById("sbkim-rdv-panel");
      if (!panel) return false;
      // Erkennungs-Marke statt fester id, und bewusst NUR im Panel gesucht: ein
      // app-eigenes Feld an anderer Stelle bleibt erlaubt (es zieht per
      // syncGeraetenameFields mit), aber im Panel steht nie ein zweites.
      if (panel.querySelector("[data-sbkim-geraetename]")) return true;
      var wrap = document.createElement("div");
      wrap.style.cssText = "margin:8px 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap";
      var lab = document.createElement("span"); lab.textContent = "🏷️ Gerätename:"; lab.style.cssText = "color:#9aa7b6;font-size:.85rem";
      var inp = document.createElement("input"); inp.id = "sbkim-geraetename"; inp.type = "text"; inp.maxLength = 40;
      inp.setAttribute("data-sbkim-geraetename", "1");
      inp.placeholder = "z. B. Klaus-Handy (frei wählbar)"; inp.value = geraetename();
      inp.style.cssText = "flex:1;min-width:120px;padding:4px 6px;border-radius:6px;border:1px solid #33414f;background:#0d1520;color:#dfeaf2;font:inherit";
      inp.title = "Nur ein Anzeige-Hinweis, kein Vertrauens-Beweis — die Kennung bleibt daneben.";
      inp.addEventListener("input", function () {
        try { localStorage.setItem("sbkim_geraetename", String(inp.value || "").trim().slice(0, 40)); } catch (_e) {}
        try { window.dispatchEvent(new CustomEvent("sbkim:geraetename-changed")); } catch (_e) {}
      });
      wrap.appendChild(lab); wrap.appendChild(inp);
      panel.insertBefore(wrap, panel.children[1] || null);
      return true;
    }
    if (tryInject()) return;
    try { var mo = new MutationObserver(function () { if (tryInject()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); } catch (_e) {}
  }
  function displayNodeName(base) {
    var g = bkGeraetename();
    return g ? (base + " · " + g) : base;
  }

  var RDV_CFG = {
    nodeName: "BookLedgerPro",
    domain: "BookLedgerPro-Buchhaltung",
    endpoint: "https://lausiklauskn-png.github.io/BookLedgerPro/",
    nodeType: "hybrid",
    domainDescription: "Offline-first, verschlüsselte Buchhaltung: Belege, Konten, USt/EÜR, GoBD, Aufträge.",
    domainKeywords: ["Buchhaltung", "Beleg", "Konto", "Rechnung", "USt", "EÜR", "GoBD", "Kostenstelle", "Offline", "Verschlüsselung"],
  };

  // ── Inhalts-treuer domainVector (Brief 2026-06-28) ──────────────────────────
  // Statt der EINEN Hüllen-Beschreibung (Marketing-Satz oben) beschreibt sich der
  // Knoten durch seinen DOMÄNEN-INHALT: die Standard-Kontenrahmen-Labels
  // (SKR03-Auswahl) + Standard-Kostenstellen. Das ist der „vom Inhalt statt von
  // der Hülle"-Pfad der Lehre (Sage docs/LEHRE-EMBEDDING-MATCH-KALIBRIERUNG.md).
  //
  // DATENSCHUTZ (BookLedgerPro ist eine sensible App):
  //   • NUR unkritische STANDARD-Labels — verbatim aus src/domain/accounts.js
  //     (SKR03_SEED) + src/domain/crm-store.js (KS_SEED). Öffentliches Buchhaltungs-
  //     Vokabular, kein Nutzer-Datum.
  //   • BEWUSST STATISCH gespiegelt: live angelegte / umbenannte Konten oder
  //     Kostenstellen könnten Klarnamen (Kunden, Lieferanten) tragen → werden
  //     NIE eingebettet. Beträge, Belege, Buchungstexte, OCR-Inhalte ohnehin NIE.
  //   • sbkim-init.js ist ein klassisches Skript (kein ES-Modul-Import), darum
  //     hier gespiegelt statt aus accounts.js gelesen — und damit zugleich von
  //     jedem Live-Nutzer-Datum entkoppelt.
  var STANDARD_KONTO_LABELS = [
    "Kasse", "Bank", "Forderungen aus Lieferungen und Leistungen",
    "Abziehbare Vorsteuer 19%", "Umsatzsteuer 19%", "Umsatzsteuer-Vorauszahlungen",
    "Verbindlichkeiten aus Lieferungen und Leistungen", "Eigenkapital",
    "Privatentnahmen allgemein", "Wareneingang 19% Vorsteuer", "Löhne und Gehälter",
    "Miete", "Gas, Strom, Wasser", "Versicherungen", "Fahrzeugkosten", "Werbekosten",
    "Reisekosten Unternehmer", "Bewirtungskosten (abzugsfähig 70%)",
    "Abschreibungen auf Sachanlagen", "Porto", "Telefon", "Bürobedarf",
    "Fortbildungskosten", "Rechts- und Beratungskosten", "Buchführungskosten",
    "Sonstige betriebliche Aufwendungen", "Erlöse 19% USt", "Provisionserlöse",
    "Steuerfreie Umsätze §4 UStG",
    // Standard-Kostenstellen (KS_SEED) — generische Bereichs-Labels, kein PII.
    "Allgemein", "Vertrieb", "Produktion",
  ];
  function sampleContent() {
    var out = [];
    try {
      for (var i = 0; i < STANDARD_KONTO_LABELS.length && out.length < 32; i++) {
        var t = String(STANDARD_KONTO_LABELS[i] || "").trim();
        if (t.length) out.push(t);
      }
    } catch (e) { /* fail-soft */ }
    return out;
  }
  // Hüllen-Vektor (Selbstbeschreibung) — der Fallback, wenn der Inhalts-Pfad
  // nicht greift (Funktion fehlt / leere Stichprobe / Fehler).
  function embedDescriptionVector() {
    return window.SbkimEmbedding
      .embedPassage(RDV_CFG.domainDescription + ". " + RDV_CFG.domainKeywords.join(", "))
      .then(function (vec) { return { vec: vec, source: "description" }; });
  }

  function rdvCreateIdentity() {
    if (!window.SbkimEmbedding || !window.SbkimSpore) {
      return Promise.reject(new Error("Module 02/03 nicht geladen."));
    }
    return window.SbkimEmbedding.init()
      .then(function () {
        // Inhalts-Vektor bevorzugen (Domänen-Labels), fail-soft auf Beschreibung.
        if (typeof window.SbkimEmbedding.embedContentVector === "function") {
          var samples = sampleContent();
          if (samples.length) {
            return window.SbkimEmbedding.embedContentVector(samples)
              .then(function (res) {
                if (res && res.vector) {
                  if (window.console && console.info) {
                    console.info("[BLP-SBKIM] Inhalts-Vektor aus " + samples.length + " Standard-Konto-Labels erzeugt (kein PII).");
                  }
                  return { vec: res.vector, source: "content" };
                }
                return embedDescriptionVector();
              })
              .catch(function (e) {
                if (window.console && console.warn) console.warn("[BLP-SBKIM] embedContentVector — Fallback auf Beschreibung:", e);
                return embedDescriptionVector();
              });
          }
        }
        return embedDescriptionVector();
      })
      .then(function (r) {
        return window.SbkimSpore.generateOwnSpore({
          domain: RDV_CFG.domain, endpoint: RDV_CFG.endpoint, nodeType: RDV_CFG.nodeType, nodeName: RDV_CFG.nodeName,
          domainDescription: RDV_CFG.domainDescription, domainKeywords: RDV_CFG.domainKeywords,
          domainVector: Array.from(r.vec),
          embeddingSource: r.source, embeddingVersion: 1,
        });
      });
  }
  function mountRendezvous() {
    if (!window.SbkimRendezvousUI) return;
    // Anzeige-Name = Basis-Name + optionaler Gerätename. NUR an die Anzeige/den
    // Announce geben — NIE an generateOwnSpore (rdvCreateIdentity nutzt weiter
    // RDV_CFG.nodeName, damit die signierte Spore unverändert bleibt).
    var announceName = displayNodeName(RDV_CFG.nodeName);
    try {
      if (window.SbkimRendezvous && typeof window.SbkimRendezvous.init === "function") {
        try {
          window.SbkimRendezvous.init({ nodeName: announceName, dbSuffix: DB_SUFFIX, createIdentity: rdvCreateIdentity });   // ensureIdentity ABSICHTLICH NICHT (Stufe 0b): keine wortlose Neu-Anlage beim Seiten-Start
        } catch (e) { if (window.console && console.warn) console.warn("[BLP-SBKIM] Rendezvous (Modus A) übersprungen:", e); }
      }
      window.SbkimRendezvousUI.init({ nodeName: announceName, dbSuffix: DB_SUFFIX, corner: "bl", createIdentity: rdvCreateIdentity });
      if (window.console && console.info) console.info("[BLP-SBKIM] Rendezvous-UI gemountet (öffentlicher 🌐-Knopf).");
    } catch (e) { if (window.console && console.warn) console.warn("[BLP-SBKIM] Rendezvous-UI übersprungen:", e); }

    // Kopplung: ändert der Nutzer den Gerätenamen (Netz-Ansicht), den Anzeige-Namen
    // im Raum neu setzen — fail-soft, ohne Re-Sign der Spore.
    try {
      injectGeraetenameField();
      window.addEventListener("sbkim:geraetename-changed", function () {
        syncGeraetenameFields();
        try {
          if (window.SbkimRendezvous && typeof window.SbkimRendezvous.configure === "function") {
            window.SbkimRendezvous.configure({ nodeName: displayNodeName(RDV_CFG.nodeName) });
          }
          if (window.SbkimRendezvousUI && typeof window.SbkimRendezvousUI.configure === "function") {
            window.SbkimRendezvousUI.configure({ nodeName: displayNodeName(RDV_CFG.nodeName) });
          }
        } catch (e) { /* fail-soft */ }
      });
    } catch (e) { /* fail-soft */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { boot(); mountRendezvous(); });
  } else {
    boot();
    mountRendezvous();
  }
})();

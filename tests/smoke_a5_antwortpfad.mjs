// Headless-Smoke für A5 (Bau 22f-Rollout, 2026-07-11) — Multi-Query im
// Cross-Knoten-ANTWORT-Pfad von BookLedgerPro (Modul 15, op:"query"). Run:
//   node tests/smoke_a5_antwortpfad.mjs
//
// BookLedgerPro hat KEIN Nutzer-Suchfeld; die einzige Match-Nutzung ist der
// Antwort-Pfad, wenn ein anderer Knoten diesen Knoten etwas fragt. Bisher lief
// dort ein reiner Cosinus (queryLocal ohne Hybrid). A5 verdrahtet dort jetzt
// queryWithInclusion: A4 (expandQuerySimple über BLP_QUERY_SYNONYMS →
// queryLocalMulti) + A1 (hybrid BM25+Vektor), fail-soft.
//
// Der Test beweist die API-Kette mit der AUSGELIEFERTEN Karte BLP_QUERY_SYNONYMS
// aus sbkim/15_membran.js (mini Drift-Guard der Verdrahtung). Der 0.80-Cosinus-
// Boden (Modul 05 Andock-Riegel) bleibt unberührt; Gewinn = INKLUSION über BM25.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

globalThis.window = globalThis;

const DIM = 384;
function unit(i) { const v = new Float32Array(DIM); v[i] = 1; return v; }
globalThis.SbkimEmbedding = {
  embedQuery: async () => unit(0),
  embedPassage: async () => unit(1),
  embedPassageBatch: async (texts) => texts.map(() => unit(1)),
};

const src = readFileSync(resolve(repoRoot, "sbkim/04_match.js"), "utf8");
new Function("global", "window", "globalThis", "console", src)(
  globalThis, globalThis, globalThis, console,
);
const M = globalThis.SbkimMatch;

const membran = readFileSync(resolve(repoRoot, "sbkim/15_membran.js"), "utf8");
const a = membran.indexOf("var BLP_QUERY_SYNONYMS");
if (a < 0) { console.error("FAIL: BLP_QUERY_SYNONYMS nicht in 15_membran.js gefunden"); process.exit(1); }
const eq = membran.indexOf("=", a);
const end = membran.indexOf("};", eq) + 2;
const BLP_QUERY_SYNONYMS = new Function("return " + membran.slice(eq + 1, end).trim())();

async function queryWithInclusion(text, k) {
  if (typeof M.queryLocalMulti === "function" && typeof M.expandQuerySimple === "function") {
    const variants = M.expandQuerySimple(text, { synonyms: BLP_QUERY_SYNONYMS });
    return await M.queryLocalMulti(variants, k, { hybrid: true });
  }
  return await M.queryLocal(text, k, { hybrid: true });
}

// Korpus: der Treffer trägt „faktura" im text, aber NICHT das Query-Token
// „rechnung". passageVec = e1 (orthogonal → Cosinus 0). Nur die Variante
// „faktura" nimmt ihn über BM25 auf.
const CORPUS = [
  { label: "Ausgangsbeleg 2026-04", text: "faktura an kunde, netto, ust ausgewiesen, faellig", passageVec: unit(1), anchorId: "blp-1" },
  { label: "Wespen-freier Tisch", text: "hausmittel gegen wespen am gedeckten tisch", passageVec: unit(1), anchorId: "blp-2" },
];
// Korpus registrieren wie im App-Init (sbkim-init.js ruft setLocalCorpus) —
// queryWithInclusion nutzt den registrierten Provider, kein explizites corpus.
M.setLocalCorpus(CORPUS);

let ok = 0, fail = 0;
function check(name, cond) { if (cond) { ok++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name); } }

async function run() {
  console.log("Probe 0 — ausgelieferte BLP_QUERY_SYNONYMS-Karte");
  check("BLP_QUERY_SYNONYMS ist Objekt mit Einträgen", BLP_QUERY_SYNONYMS && typeof BLP_QUERY_SYNONYMS === "object" && Object.keys(BLP_QUERY_SYNONYMS).length > 0);
  check("rechnung → faktura verdrahtet", Array.isArray(BLP_QUERY_SYNONYMS.rechnung) && BLP_QUERY_SYNONYMS.rechnung.includes("faktura"));

  console.log("\nProbe 1 — Single-Query verpasst den Cross-Phrasing-Treffer");
  const single = await M.queryLocal("rechnung", 5, { corpus: CORPUS, hybrid: true });
  check("Single-Query 'rechnung' findet 'faktura'-Beleg NICHT", !new Set(single.map((h) => h.anchorId)).has("blp-1"));

  console.log("\nProbe 2 — Antwort-Pfad (queryWithInclusion) nimmt ihn AUF");
  const answ = await queryWithInclusion("rechnung", 5);
  const ids = new Set(answ.map((h) => h.anchorId));
  check("Multi-Query nimmt 'faktura'-Beleg über BM25-Variante auf", ids.has("blp-1"));
  check("Off-Topic (Wespen) bleibt draußen", !ids.has("blp-2"));
  check("Ergebnis ist Array (fail-soft)", Array.isArray(answ));

  console.log("\n" + (fail === 0 ? "ALLE GRÜN" : "ROT") + " — " + ok + " ok, " + fail + " fail");
  process.exit(fail === 0 ? 0 : 1);
}
run().catch((e) => { console.error("WURF:", e); process.exit(1); });

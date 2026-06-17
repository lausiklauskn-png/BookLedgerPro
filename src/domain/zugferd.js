// src/domain/zugferd.js
// ZUGFeRD/Factur-X: eingebettete CII-/UBL-XML aus einer PDF/A-3 extrahieren (Empfang) +
// KoSIT-ORIENTIERTER Pflichtfeld-Precheck. Build-frei: native DecompressionStream für FlateDecode.
//
// EHRLICHE GRENZEN: Best-effort-Extraktion (scannt nach der eingebetteten Rechnungs-XML);
// das ZUGFeRD-*Erzeugen* (XML in PDF/A-3 einbetten) braucht eine PDF-Bibliothek → nicht build-frei,
// bleibt offen. Der Pflichtfeld-Precheck ist KEIN amtlicher KoSIT-Validator, sondern eine
// Minimalprüfung der EN16931-Kernfelder.

function bytesToLatin1(bytes) {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return s;
}

function findeRechnungsXml(text) {
  const m = /<\?xml[\s\S]*?<\/(?:[\w.-]+:)?(?:CrossIndustryInvoice|Invoice)>/.exec(text)
    || /<(?:[\w.-]+:)?CrossIndustryInvoice\b[\s\S]*?<\/(?:[\w.-]+:)?CrossIndustryInvoice>/.exec(text)
    || /<(?:[\w.-]+:)?Invoice\b[\s\S]*?<\/(?:[\w.-]+:)?Invoice>/.exec(text);
  return m ? m[0] : null;
}

async function inflate(bytes) {
  try {
    const ds = new DecompressionStream('deflate');
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(buf);
  } catch { return null; }
}

/**
 * Extrahiert die eingebettete Rechnungs-XML (CII/UBL) aus PDF-Bytes — best-effort.
 * @returns {Promise<string|null>} XML-String oder null
 */
export async function extrahiereZugferdXml(pdfBytes) {
  const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes || []);
  const text = bytesToLatin1(bytes);
  const direkt = findeRechnungsXml(text);
  if (direkt) return direkt;
  // FlateDecode-Streams einzeln entpacken und durchsuchen.
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = Uint8Array.from(m[1], (ch) => ch.charCodeAt(0) & 0xff);
    const inf = await inflate(raw);
    if (inf) {
      const found = findeRechnungsXml(bytesToLatin1(inf));
      if (found) return found;
    }
  }
  return null;
}

/**
 * KoSIT-orientierter Pflichtfeld-Precheck auf einer geparsten Eingangsrechnung
 * (aus erechnungLesen.parseEingangsrechnung). Prüft EN16931-Kernfelder.
 * @returns {{ok:boolean, fehlende:string[]}}
 */
export function kostPflichtfelder(parsed) {
  if (!parsed) return { ok: false, fehlende: ['(kein Dokument)'] };
  const fehlende = [];
  if (!parsed.nummer) fehlende.push('Rechnungsnummer (BT-1)');
  if (!parsed.datum) fehlende.push('Rechnungsdatum (BT-2)');
  if (!parsed.lieferant) fehlende.push('Verkäufer-Name (BT-27)');
  if (!(Number(parsed.brutto) > 0)) fehlende.push('Rechnungs-Gesamtbetrag (BT-112)');
  return { ok: fehlende.length === 0, fehlende };
}

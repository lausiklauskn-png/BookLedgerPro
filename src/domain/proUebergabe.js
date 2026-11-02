// Reine Datenprüfung für den freiwilligen Pro-Verbund. Keine Kontierung aus fremden Metadaten.
const APPS = ['familienakte', 'workflow-pdf-pro', 'private-brain', 'bookledgerpro'];
export async function proHash(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export async function proMerkmale(file, wert, { namePruefen = true } = {}) {
  if (!wert || typeof wert !== 'object') throw new Error('Übergabevertrag fehlt.');
  const m = wert;
  if (m.vertrag !== 'familienakte-uebergabe/1' || m.ziel !== 'bookledgerpro' || !APPS.includes(m.quelle) ||
      !/^[A-Za-z0-9_.-]{1,160}$/.test(m.id || '') || !/^[A-Za-z0-9_.:-]{1,200}$/.test(m.dokumentId || '') ||
      typeof m.name !== 'string' || !m.name.length || m.name.length > 255 || (namePruefen && m.name !== file.name) ||
      typeof m.mime !== 'string' || m.mime.length > 200 || !Number.isSafeInteger(m.groesse) || m.groesse !== file.size || !file.size || file.size > 20 * 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(m.sha256 || '') || (m.bezug !== undefined && !/^[A-Za-z0-9_.-]{1,160}$/.test(m.bezug))) throw new Error('Übergabe passt nicht zu Datei oder Ziel (höchstens 20 MiB).');
  if (await proHash(await file.arrayBuffer()) !== m.sha256) throw new Error('Die Original-Prüfsumme der Übergabe stimmt nicht.');
  return { vertrag: m.vertrag, id: m.id, quelle: m.quelle, ziel: m.ziel, dokumentId: m.dokumentId, name: m.name, mime: m.mime,
    groesse: m.groesse, sha256: m.sha256, ...(m.bezug ? { bezug: m.bezug } : {}) };
}
export async function proBelegKennung(m) {
  return 'pro-' + await proHash(new TextEncoder().encode(JSON.stringify([m.quelle, m.id])));
}
/** Ältere FPT1-Einträge haben noch keinen Vertrag; ihr bereits vorhandener Eintrag bleibt die stabile Quelle. */
export async function proAltVertrag(vaultId, fach, eintrag, file) {
  const sha256 = await proHash(await file.arrayBuffer());
  if (eintrag.groesse !== file.size || eintrag.sha256 !== sha256) throw new Error('Die Tresordatei stimmt nicht mit ihrem Verzeichnis überein.');
  const id = 'bestand-' + await proHash(new TextEncoder().encode(JSON.stringify([vaultId, fach, eintrag.id])));
  return proMerkmale(file, { vertrag: 'familienakte-uebergabe/1', id, quelle: eintrag.schreiber, ziel: 'bookledgerpro', dokumentId: id,
    name: file.name, mime: file.type, groesse: file.size, sha256 });
}

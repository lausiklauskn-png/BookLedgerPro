// src/core/files.js
// Datei-Helfer. Hinweis (Browser-Lehre 5): auf Tablet-DevTools (Eruda) ist
// copy()/Clipboard unzuverlässig — Diagnose/Export deshalb immer per Download.

/** Liest eine ausgewählte Datei als Uint8Array. */
export function readFileBytes(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result));
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}

/** Liest eine ausgewählte Datei als Text. */
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

/** Löst einen Datei-Download im Browser aus (Blob → <a download>). */
export function downloadBlob(filename, content, mime = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadText(filename, text, mime = 'text/plain') {
  downloadBlob(filename, text, mime + ';charset=utf-8');
}

export function downloadJson(filename, obj) {
  downloadText(filename, JSON.stringify(obj, null, 2), 'application/json');
}

/** Öffnet einen Datei-Auswahldialog und liefert die gewählte Datei.
 *  `capture` = 'environment'|'user' öffnet direkt die Kamera (mobil). */
export function pickFile(accept = '', capture = null) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) input.accept = accept;
    if (capture) input.capture = capture;
    input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
    input.click();
  });
}

// ---- File System Access (gemerkter Zielordner, Schritt 3) -------------------
// Nur Chromium-Desktop hat `showDirectoryPicker`. Auf Tablet/iOS/Firefox fehlt sie →
// der Aufrufer fällt auf den Download zurück (domain/backupStrategie.backupZiel).
// Diese Helfer berühren DOM/Dateisystem → statisch geprüft (kein Headless-Browser).

/** True, wenn der Browser die File-System-Access-Verzeichniswahl unterstützt. */
export function supportsDirectoryPicker() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

/** Öffnet die Verzeichnis-Auswahl (Lese/Schreib) und liefert das Handle (oder null bei Abbruch). */
export async function pickDirectory() {
  if (!supportsDirectoryPicker()) return null;
  try {
    return await window.showDirectoryPicker({ id: 'blpr-backup', mode: 'readwrite' });
  } catch {
    return null; // Nutzer hat abgebrochen
  }
}

/**
 * Stellt sicher, dass für ein (ggf. aus IndexedDB geladenes) Handle die Schreibrechte
 * bestehen — fragt sie sonst nach. True, wenn am Ende geschrieben werden darf.
 */
export async function ensureRwPermission(handle) {
  if (!handle || typeof handle.queryPermission !== 'function') return true;
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  try { return (await handle.requestPermission(opts)) === 'granted'; }
  catch { return false; }
}

/** Schreibt Text als Datei in einen Verzeichnis-Handle (legt sie an/überschreibt sie). */
export async function writeTextToDirectory(dirHandle, filename, text) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

export function formatBytes(n) {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

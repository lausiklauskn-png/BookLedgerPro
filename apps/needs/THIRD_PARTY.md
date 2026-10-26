# Mitgelieferte Fremd-Bibliotheken

| Datei | Was | Lizenz | Herkunft |
|---|---|---|---|
| `vendor/pdfjs/pdf.min.js`, `vendor/pdfjs/pdf.worker.min.js` | PDF.js 3.11.174, Mozilla Foundation | Apache License 2.0 | byte-gleich aus dem Auslieferungsprüfer (`vendor/pdfjs/`), dort aus Workflow PDF und Mein-WorkFloh. SHA-gepinnt in `tests/kern.mjs` (`PDFJS_SHA`) |

Wofür: die 👁 Voransicht der PDF-Anhänge (Seiten werden gezeichnet; Android-Chrome zeigt PDFs nicht
in einem Rahmen). Geladen erst beim ersten PDF, nicht im Installations-Vorrat (1,5 MB); der Worker legt
es nach dem ersten Abruf ab.

⚠ pdf.js 3.x konnte mit einer präparierten Schrift eigenen Code ausführen (CVE-2024-4367). Die App
betreibt es mit `isEvalSupported: false`; ein Wächter in `tests/kern.mjs` liest die Zeile.

Lizenzkopf in den Dateien bleibt erhalten. Lizenztext: <https://www.apache.org/licenses/LICENSE-2.0>

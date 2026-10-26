# Mitgelieferte Fremd-Bibliotheken

| Datei | Was | Lizenz | Herkunft |
|---|---|---|---|
| `vendor/pdfjs/pdf.min.js`, `vendor/pdfjs/pdf.worker.min.js` | PDF.js 3.11.174, Mozilla Foundation | Apache License 2.0 | byte-gleich aus Workflow PDF (`vendor/pdfjs/`), gleich im Auslieferungsprüfer |
| `vendor/tesseract/tesseract.min.js`, `vendor/tesseract/worker.min.js` | Tesseract.js 7.0.0 (naptha) | Apache License 2.0, Lizenztext in `vendor/tesseract/LICENSE-Apache-2.0.txt`; gebündelte Hilfsbibliotheken (MIT, BSD-3-Clause) in den `*.LICENSE.txt` daneben | byte-gleich aus Workflow PDF (`vendor/tesseract/`), dort npm-Paket `tesseract.js@7.0.0` |
| `vendor/tesseract/tesseract-core-*-lstm.wasm.js` | tesseract.js-core 7.0.0 | Apache License 2.0 | byte-gleich aus Workflow PDF |
| `vendor/tesseract/lang/{deu,eng,rus}.traineddata` | Sprachdaten tessdata_fast | Apache License 2.0 | byte-gleich aus Workflow PDF |
| `tests/vendor/pdf-lib.min.js` | pdf-lib 1.17.1 — **nur für die Proben**, wird nicht genutzt | MIT | byte-gleich aus Workflow PDF |

Die Lizenzköpfe in den Dateien bleiben erhalten.

⚠ pdf.js 3.x konnte mit einer präparierten Schrift eigenen Code ausführen (CVE-2024-4367).
BookLedgerPro und der Prüfkern betreiben es mit `isEvalSupported: false`; `tests/run.mjs` liest die Zeile.

Der Prüfkern (`assets/eingang.js`, `pruefer-anhang.js`, `pruefer-mail.js`, `pruefer-formate.js`,
`reinigung.js`) ist eigene Arbeit aus dem Netz (Auslieferungsprüfer → Workflow PDF), byte-1:1
kopiert und in `tests/run.mjs` per SHA-256 gepinnt.

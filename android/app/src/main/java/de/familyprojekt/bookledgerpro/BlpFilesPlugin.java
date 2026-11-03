package de.familyprojekt.bookledgerpro;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.UUID;

/** Speichern und Teilen für die Web-App. Die WebView kann weder <a download> noch navigator.share mit Dateien;
 *  ohne diesen Weg ginge eine Datensicherung still verloren (Regel #2 Datendurabilität). Gespeichert wird nur
 *  dorthin, wo der Mensch im Android-Dialog hinzeigt; geteilt nur über den eigenen FileProvider. */
@CapacitorPlugin(name = "BlpFiles")
public final class BlpFilesPlugin extends Plugin {
    private final PluginWorker worker = new PluginWorker("files");
    // Befund SD-Karte 2026-11-03: zwei Sicherungen „bookledgerpro-backup-….blpr.json“ mit 0 Byte. Androids Speichern-Dialog
    // (ACTION_CREATE_DOCUMENT) legt die Datei schon beim Tipp auf „Speichern“ leer an. Bis hierher lag der Inhalt nur im
    // Arbeitsspeicher (bis 100 MB); wurde die App im Hintergrund beendet, während der Dialog offen war (großer Inhalt, Tablet),
    // kam sie ohne Inhalt zurück und meldete nur „Nicht gespeichert.“ — die leere Datei blieb. Ebenso nach einem Schreibfehler.
    // Jetzt: Inhalt vor dem Dialog in den App-Zwischenspeicher (übersteht das Beenden), danach gestreamt in die Datei; scheitert
    // etwas, wird die angelegte Datei wieder gelöscht und der Fehler genannt.
    private File offen() { return new File(new File(getContext().getCacheDir(), "speichern"), "offen.bin"); }
    private Uri zuletzt; private long zuletztZeit;

    private static byte[] decode(PluginCall call) {
        String data = call.getString("data");
        if (data == null) return null;
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            return bytes.length > NativeUtil.MAX_BYTES ? null : bytes;
        } catch (IllegalArgumentException malformed) { return null; }
    }

    @PluginMethod public void save(PluginCall call) {
        byte[] bytes = decode(call);
        if (bytes == null) { call.reject("FILE_INVALID"); return; }
        if (bytes.length == 0) { call.reject("FILE_EMPTY"); return; }
        File datei = offen();
        try {
            File dir = datei.getParentFile();
            if (dir != null && !dir.isDirectory() && !dir.mkdirs()) throw new java.io.IOException();
            try (FileOutputStream out = new FileOutputStream(datei)) { out.write(bytes); out.getFD().sync(); }
        } catch (Exception keinPlatz) { datei.delete(); call.reject("SAVE_NO_SPACE"); return; }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
            .setType(NativeUtil.mime(call.getString("mime"))).putExtra(Intent.EXTRA_TITLE, NativeUtil.filename(call.getString("name")));
        startActivityForResult(call, intent, "saved");
    }

    private void loeschen(Uri uri) {
        try { DocumentsContract.deleteDocument(getContext().getContentResolver(), uri); } catch (Exception egal) { /* unten gemeldet */ }
    }
    private boolean nochDa(Uri uri) {
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.SIZE }, null, null, null)) {
            return c != null && c.moveToFirst();
        } catch (Exception weg) { return false; }
    }
    private long groesse(Uri uri) {
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.SIZE }, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getLong(0);
        } catch (Exception unbekannt) { /* manche Anbieter nennen keine Größe */ }
        return -1;
    }
    private boolean imTresor(Uri uri) {
        try {
            String baum = getContext().getSharedPreferences(BlpTresorPlugin.PREFS, Context.MODE_PRIVATE).getString("baum", null);
            String baumId = baum == null ? null : DocumentsContract.getTreeDocumentId(Uri.parse(baum));
            return NativeUtil.imTresor(baumId, DocumentsContract.getDocumentId(uri));
        } catch (Exception unbekannt) { return false; }
    }

    @ActivityCallback private void saved(PluginCall call, ActivityResult result) {
        File datei = offen();
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            datei.delete();
            if (call != null) call.resolve(new JSObject().put("saved", false));
            return;
        }
        Uri uri = data.getData();
        Runnable schreiben = () -> {
            if (!datei.isFile()) {
                // Inhalt verloren (Zwischenspeicher geleert): die leer angelegte Datei nicht stehen lassen.
                loeschen(uri);
                if (call != null) call.reject(nochDa(uri) ? "SAVE_FAILED_EMPTY_LEFT" : "SAVE_DATA_LOST");
                return;
            }
            long soll = datei.length();
            try {
                OutputStream out;
                try { out = getContext().getContentResolver().openOutputStream(uri, "wt"); }
                catch (Exception keinWt) { out = getContext().getContentResolver().openOutputStream(uri, "w"); } // frisch angelegt, also leer
                if (out == null) throw new java.io.IOException("SAVE_FAILED");
                try (OutputStream o = out; java.io.InputStream in = new java.io.FileInputStream(datei)) {
                    byte[] puffer = new byte[65536]; int n;
                    while ((n = in.read(puffer)) != -1) o.write(puffer, 0, n);
                    o.flush();
                }
                if (soll > 0 && groesse(uri) == 0) throw new java.io.IOException("SAVE_FAILED");
                datei.delete();
                boolean tresor = imTresor(uri);
                if (tresor) { zuletzt = uri; zuletztZeit = System.currentTimeMillis(); }
                if (call != null) call.resolve(new JSObject().put("saved", true).put("imTresor", tresor));
            } catch (Exception error) {
                datei.delete();
                loeschen(uri);
                if (call != null) call.reject(nochDa(uri) ? "SAVE_FAILED_EMPTY_LEFT" : "SAVE_FAILED");
            }
        };
        // Nach einem Neustart der App (call == null oder ohne Seite) wird trotzdem geschrieben: die Datei ist dann vollständig statt leer.
        if (call == null) worker.execute(schreiben); else worker.submit(call, schreiben);
    }

    /** „Speichern unter“ in den Tresorordner (Regel des gemeinsamen Plans: keine offenen Dateien in den Tresor). Die Seite fragt
     *  nach dem Speichern „Trotzdem dort lassen?“; „Abbrechen“ entfernt genau die eben gespeicherte Datei (höchstens 10 Minuten). */
    @PluginMethod public void saveZuruecknehmen(PluginCall call) {
        Uri uri = zuletzt; long zeit = zuletztZeit; zuletzt = null;
        if (uri == null || System.currentTimeMillis() - zeit > 10 * 60 * 1000L) { call.resolve(new JSObject().put("entfernt", false)); return; }
        worker.submit(call, () -> { loeschen(uri); call.resolve(new JSObject().put("entfernt", !nochDa(uri))); });
    }

    @PluginMethod public void share(PluginCall call) {
        byte[] bytes = decode(call);
        if (bytes == null) { call.reject("FILE_INVALID"); return; }
        String name = NativeUtil.filename(call.getString("name")), mime = NativeUtil.mime(call.getString("mime"));
        String title = call.getString("title", "");
        worker.submit(call, () -> {
            try {
                Context context = getContext();
                File root = new File(context.getCacheDir(), "share");
                File[] old = root.listFiles();
                long grenze = System.currentTimeMillis() - 24L * 3600 * 1000;
                if (old != null) for (File dir : old) if (dir.lastModified() < grenze) { File[] fs = dir.listFiles(); if (fs != null) for (File f : fs) f.delete(); dir.delete(); }
                File dir = new File(root, UUID.randomUUID().toString());
                if (!dir.mkdirs()) throw new java.io.IOException();
                File file = new File(dir, name);
                try (FileOutputStream out = new FileOutputStream(file)) { out.write(bytes); out.getFD().sync(); }
                Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
                Intent send = new Intent(Intent.ACTION_SEND).setType(mime).putExtra(Intent.EXTRA_STREAM, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                if (!title.isEmpty()) send.putExtra(Intent.EXTRA_SUBJECT, title);
                Intent chooser = Intent.createChooser(send, title.isEmpty() ? name : title).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getActivity().runOnUiThread(() -> {
                    try { getActivity().startActivity(chooser); call.resolve(new JSObject().put("shared", true)); }
                    catch (Exception none) { call.reject("SHARE_UNAVAILABLE"); }
                });
            } catch (Exception error) { call.reject("SHARE_FAILED"); }
        });
    }

    /** Versionsnummer der App für „Über“ (Leitfaden § 6): versionName aus dem Paket (Prüf-Bauten tragen „-debug“). */
    @PluginMethod public void appInfo(PluginCall call) {
        try {
            android.content.pm.PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            call.resolve(new JSObject().put("version", info.versionName == null ? "" : info.versionName));
        } catch (Exception error) { call.reject("APP_INFO_UNAVAILABLE"); }
    }

    @Override protected void handleOnDestroy() { worker.close(() -> { }); }
}

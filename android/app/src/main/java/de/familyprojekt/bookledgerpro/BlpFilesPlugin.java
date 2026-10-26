package de.familyprojekt.bookledgerpro;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
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
    private byte[] pending;

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
        pending = bytes;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
            .setType(NativeUtil.mime(call.getString("mime"))).putExtra(Intent.EXTRA_TITLE, NativeUtil.filename(call.getString("name")));
        startActivityForResult(call, intent, "saved");
    }

    @ActivityCallback private void saved(PluginCall call, ActivityResult result) {
        byte[] bytes = pending; pending = null;
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null || bytes == null) {
            call.resolve(new JSObject().put("saved", false)); return;
        }
        Uri uri = data.getData();
        worker.submit(call, () -> {
            try (OutputStream out = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new java.io.IOException("SAVE_FAILED");
                out.write(bytes);
                call.resolve(new JSObject().put("saved", true));
            } catch (Exception error) { call.reject("SAVE_FAILED"); }
        });
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

    @Override protected void handleOnDestroy() { worker.close(() -> { }); }
}

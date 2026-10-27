package de.familyprojekt.bookledgerpro;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.text.Editable;
import android.text.InputType;
import android.util.Base64;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import de.familyprojekt.tresor.Eintrag;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.SafAblage;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyStore;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

/**
 * Brücke zum gemeinsamen Tresorordner (Schritt C, Klaus 2026-10-27). Die Ordnerschicht selbst ist das byte-gleich
 * kopierte Paket de.familyprojekt.tresor (Quelle Workflow PDF Pro). Hier nur: Ordnerwahl mit dauerhafter Freigabe,
 * Passwort ausschließlich im nativen Dialog (nie durch die WebView), Merken des Hauptschlüssels im Android-Schlüsselspeicher,
 * Ablegen und Lesen in Stücken. BookLedgerPro schreibt nur ins eigene Fach und ins Eingangsfach; fremde Fächer liest es.
 */
@CapacitorPlugin(name = "BlpTresor")
public final class BlpTresorPlugin extends Plugin {
    private static final String PREFS = "blp-tresorordner-v1", ALIAS = "bookledgerpro-tresorordner-merken-v1";
    private static final String APP = Fach.BOOKLEDGER_APP;
    private final PluginWorker worker = new PluginWorker("tresor");
    private SafAblage ablage;
    private TresorOrdner offen;
    private final Map<String, Ablegen> ablegen = new HashMap<>();
    private final Map<String, InputStream> lesen = new HashMap<>();

    private static final class Ablegen { String fach, unterordner, name, art, auszug; long datum, groesse; File datei; }

    private SharedPreferences prefs() { return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    private static String code(Exception e) {
        String m = e.getMessage();
        return m != null && m.matches("[A-Z_]{3,60}") ? m : "TRESOR_FEHLER";
    }
    private SafAblage ablage() throws IOException {
        if (ablage != null) return ablage;
        String baum = prefs().getString("baum", null);
        if (baum == null) throw new IOException("TRESOR_KEIN_ORDNER");
        ablage = new SafAblage(getContext().getContentResolver(), Uri.parse(baum));
        return ablage;
    }

    // ---------- Zustand ----------
    @PluginMethod public void zustand(PluginCall call) {
        worker.submit(call, () -> {
            try { call.resolve(zustandJetzt()); } catch (Exception e) { call.reject(code(e)); }
        });
    }
    private JSObject zustandJetzt() throws Exception {
        JSObject z = new JSObject();
        SharedPreferences p = prefs();
        z.put("gewaehlt", p.contains("baum")).put("ordner", p.getString("name", "")).put("gemerkt", p.contains("merken"));
        z.put("offen", offen != null);
        if (!p.contains("baum")) return z;
        try {
            SafAblage a = ablage();
            boolean da = TresorOrdner.vorhanden(a);
            z.put("erreichbar", true).put("vorhanden", da);
            z.put("istFachOrdner", !da && a.gibtEs("tresor.json") && !a.gibtEs(TresorOrdner.KOPF));
            if (da) z.put("kennung", TresorOrdner.kennung(a));
            if (offen == null && da && p.contains("merken")) entsperrenGemerkt();
            z.put("offen", offen != null);
            if (offen != null) {
                JSArray faecher = new JSArray();
                for (Map<String, Object> f : offen.faecher()) faecher.put(new JSONObject(f));
                z.put("faecher", faecher).put("ersatz", new JSONObject(offen.ersatzInfo()));
            }
        } catch (IOException e) { z.put("erreichbar", false).put("problem", code(e)); }
        return z;
    }

    // ---------- Ordner wählen ----------
    @PluginMethod public void ordnerWaehlen(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(call, i, "gewaehlt");
    }
    @ActivityCallback private void gewaehlt(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) { call.resolve(new JSObject().put("gewaehlt", false)); return; }
        Uri baum = data.getData();
        worker.submit(call, () -> {
            try {
                getContext().getContentResolver().takePersistableUriPermission(baum, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                schliessen();
                String name = baum.getLastPathSegment() == null ? "" : baum.getLastPathSegment();
                if (name.contains(":")) name = name.substring(name.indexOf(':') + 1);
                // Ein anderer Ordner: der gemerkte Schlüssel gehört zum alten und wird vergessen.
                if (!prefs().edit().putString("baum", baum.toString()).putString("name", name).remove("merken").remove("kennung").commit()) throw new IOException("TRESOR_NICHT_VERFUEGBAR");
                ablage = null;
                call.resolve(zustandJetzt());
            } catch (Exception e) { call.reject(code(e)); }
        });
    }

    // ---------- Passwort-Dialog (nur nativ) ----------
    private interface MitPasswort { void mit(Editable eins, Editable zwei) throws Exception; }

    private void dialog(PluginCall call, String titel, String text, boolean zweimal, MitPasswort weiter) {
        getActivity().runOnUiThread(() -> {
            Context c = getActivity();
            LinearLayout box = new LinearLayout(c);
            box.setOrientation(LinearLayout.VERTICAL);
            int rand = (int) (20 * c.getResources().getDisplayMetrics().density);
            box.setPadding(rand, rand / 2, rand, 0);
            if (text != null) { TextView t = new TextView(c); t.setText(text); box.addView(t); }
            EditText eins = new EditText(c), zwei = new EditText(c);
            for (EditText e : new EditText[] {eins, zwei}) e.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            eins.setHint("Passwort (mindestens 10 Zeichen)");
            box.addView(eins);
            if (zweimal) { zwei.setHint("Passwort wiederholen"); box.addView(zwei); }
            new AlertDialog.Builder(c).setTitle(titel).setView(box)
                .setPositiveButton("OK", (d, w) -> worker.submit(call, () -> {
                    try { weiter.mit(eins.getText(), zweimal ? zwei.getText() : null); }
                    catch (Exception e) { call.reject(code(e)); }
                    finally { getActivity().runOnUiThread(() -> { eins.getText().clear(); zwei.getText().clear(); }); }
                }))
                .setNegativeButton("Abbrechen", (d, w) -> call.resolve(new JSObject().put("abgebrochen", true)))
                .setOnCancelListener(d -> call.resolve(new JSObject().put("abgebrochen", true)))
                .show();
        });
    }
    private static void gleich(Editable a, Editable b) throws IOException {
        if (b == null) return;
        String x = Normalizer.normalize(a, Normalizer.Form.NFC), y = Normalizer.normalize(b, Normalizer.Form.NFC);
        if (!x.equals(y)) throw new IOException("TRESOR_PASSWORT_UNGLEICH");
    }

    @PluginMethod public void anlegen(PluginCall call) {
        boolean merken = Boolean.TRUE.equals(call.getBoolean("merken", false));
        worker.submit(call, () -> {
            try {
                SafAblage a = ablage();
                if (TresorOrdner.vorhanden(a)) throw new IOException("TRESOR_DA");
                if (a.gibtEs("tresor.json")) throw new IOException("TRESOR_ORDNER_IST_FACH");
            } catch (Exception e) { call.reject(code(e)); return; }
            dialog(call, "Tresorordner anlegen", "Ein Passwort für alle Pro-Apps. Es verlässt das Gerät nie.", true, (p1, p2) -> {
                gleich(p1, p2);
                TresorOrdner t = TresorOrdner.anlegen(ablage(), APP, p1);
                uebernehmen(t, merken);
                t.fachAnlegen(Fach.BOOKLEDGER.slug);
                t.fachAnlegen(Fach.EINGANG_BOOKLEDGER.slug);
                call.resolve(zustandJetzt());
            });
        });
    }

    @PluginMethod public void entsperren(PluginCall call) {
        boolean merken = Boolean.TRUE.equals(call.getBoolean("merken", false));
        dialog(call, "Tresorordner entsperren", null, false, (p1, p2) -> {
            TresorOrdner t = TresorOrdner.oeffnen(ablage(), APP, p1);
            uebernehmen(t, merken);
            t.fachAnlegen(Fach.BOOKLEDGER.slug);
            call.resolve(zustandJetzt());
        });
    }

    @PluginMethod public void passwortAendern(PluginCall call) {
        if (offen == null) { call.reject("TRESOR_GESPERRT"); return; }
        dialog(call, "Neues Passwort", "Gilt für alle Pro-Apps in diesem Ordner.", true, (p1, p2) -> {
            gleich(p1, p2);
            if (offen == null) throw new IOException("TRESOR_GESPERRT");
            offen.passwortAendern(p1);
            call.resolve(new JSObject().put("geaendert", true));
        });
    }

    @PluginMethod public void wiederherstellen(PluginCall call) {
        List<String> teile = new ArrayList<>();
        try { for (Object o : call.getArray("teile").toList()) teile.add(String.valueOf(o)); }
        catch (Exception e) { call.reject("TRESOR_ERSATZ_INCOMPLETE"); return; }
        dialog(call, "Neues Passwort setzen", "Die Ersatzschlüssel stimmen, wenn das neue Passwort angenommen wird.", true, (p1, p2) -> {
            gleich(p1, p2);
            TresorOrdner t = TresorOrdner.wiederherstellen(ablage(), APP, teile, p1);
            uebernehmen(t, false);
            call.resolve(zustandJetzt());
        });
    }

    @PluginMethod public void ersatzErstellen(PluginCall call) {
        worker.submit(call, () -> {
            try {
                if (offen == null) throw new IOException("TRESOR_GESPERRT");
                JSArray teile = new JSArray();
                for (String t : offen.ersatzErstellen(5, 3)) teile.put(t);
                call.resolve(new JSObject().put("teile", teile).put("n", 5).put("k", 3));
            } catch (Exception e) { call.reject(code(e)); }
        });
    }

    @PluginMethod public void sperren(PluginCall call) {
        boolean vergessen = Boolean.TRUE.equals(call.getBoolean("vergessen", false));
        worker.submit(call, () -> {
            schliessen();
            if (vergessen) prefs().edit().remove("merken").remove("kennung").commit();
            try { call.resolve(zustandJetzt()); } catch (Exception e) { call.reject(code(e)); }
        });
    }

    private void uebernehmen(TresorOrdner t, boolean merken) throws Exception {
        schliessen();
        offen = t;
        if (merken) merken(t);
    }
    private void schliessen() {
        for (InputStream in : lesen.values()) try { in.close(); } catch (IOException ignoriert) { }
        lesen.clear();
        for (Ablegen a : ablegen.values()) a.datei.delete();
        ablegen.clear();
        if (offen != null) offen.close();
        offen = null;
    }

    // ---------- Gerät merkt sich den Hauptschlüssel (Android-Schlüsselspeicher) ----------
    private SecretKey geraeteSchluessel(boolean anlegen) throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore"); ks.load(null);
        if (ks.containsAlias(ALIAS)) return (SecretKey) ks.getKey(ALIAS, null);
        if (!anlegen) return null;
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());
        return g.generateKey();
    }
    private static byte[] geraetAad(String id) { return ("familyprojekt-tresorordner|" + id + "|geraet|" + APP).getBytes(java.nio.charset.StandardCharsets.UTF_8); }
    private void merken(TresorOrdner t) throws Exception {
        byte[] haupt = t.hauptschluesselKopie();
        try {
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, geraeteSchluessel(true));
            c.updateAAD(geraetAad(t.id()));
            byte[] zu = c.doFinal(haupt), wert = new byte[12 + zu.length];
            System.arraycopy(c.getIV(), 0, wert, 0, 12); System.arraycopy(zu, 0, wert, 12, zu.length);
            if (!prefs().edit().putString("merken", Base64.encodeToString(wert, Base64.NO_WRAP)).putString("kennung", t.id()).commit()) throw new IOException("TRESOR_NICHT_VERFUEGBAR");
        } finally { Arrays.fill(haupt, (byte) 0); }
    }
    private void entsperrenGemerkt() {
        byte[] haupt = null;
        try {
            SafAblage a = ablage();
            String id = TresorOrdner.kennung(a);
            if (!id.equals(prefs().getString("kennung", ""))) return;
            byte[] wert = Base64.decode(prefs().getString("merken", ""), Base64.NO_WRAP);
            SecretKey k = geraeteSchluessel(false);
            if (k == null || wert.length != 12 + 32 + 16) return;
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, k, new GCMParameterSpec(128, wert, 0, 12));
            c.updateAAD(geraetAad(id));
            haupt = c.doFinal(wert, 12, wert.length - 12);
            offen = TresorOrdner.mitHauptschluessel(a, APP, haupt);
        } catch (Exception e) {
            // Gemerkter Schlüssel passt nicht mehr (anderer Ordner, Passwort/Ersatz neu): dann von Hand entsperren.
            offen = null;
        } finally { if (haupt != null) Arrays.fill(haupt, (byte) 0); }
    }

    // ---------- Ablegen in Stücken (eigenes Fach, Eingangsfach) ----------
    @PluginMethod public void ablegenBeginnen(PluginCall call) {
        worker.submit(call, () -> {
            try {
                if (offen == null) throw new IOException("TRESOR_GESPERRT");
                Ablegen a = new Ablegen();
                a.fach = call.getString("fach", Fach.BOOKLEDGER.slug);
                if (!Fach.nachSlug(a.fach).darfSchreiben(APP)) throw new IOException("TRESOR_FACH_FREMD");
                a.unterordner = call.getString("unterordner", "");
                a.name = NativeUtil.filename(call.getString("name"));
                a.art = NativeUtil.mime(call.getString("art"));
                a.auszug = call.getString("auszug", "");
                a.datum = NativeUtil.integer(call.getData().opt("datum"));
                File ordner = new File(getContext().getCacheDir(), "tresor-ablegen");
                if (!ordner.isDirectory() && !ordner.mkdirs()) throw new IOException("TRESOR_NICHT_VERFUEGBAR");
                a.datei = File.createTempFile("ablegen-", ".tmp", ordner);
                String ticket = UUID.randomUUID().toString();
                ablegen.put(ticket, a);
                call.resolve(new JSObject().put("ticket", ticket));
            } catch (Exception e) { call.reject(code(e)); }
        });
    }
    @PluginMethod public void ablegenTeil(PluginCall call) {
        worker.submit(call, () -> {
            try {
                Ablegen a = ablegen.get(call.getString("ticket"));
                if (a == null) throw new IOException("TRESOR_UEBERGABE_UNGUELTIG");
                byte[] b = Base64.decode(call.getString("data", ""), Base64.DEFAULT);
                if (a.groesse + b.length > 1L << 30) throw new IOException("TRESOR_DATEI_ZU_GROSS");
                try (FileOutputStream out = new FileOutputStream(a.datei, true)) { out.write(b); }
                a.groesse += b.length;
                call.resolve(new JSObject().put("groesse", a.groesse));
            } catch (Exception e) { call.reject(code(e)); }
        });
    }
    @PluginMethod public void ablegenFertig(PluginCall call) {
        worker.submit(call, () -> {
            Ablegen a = ablegen.remove(call.getString("ticket"));
            try {
                if (a == null) throw new IOException("TRESOR_UEBERGABE_UNGUELTIG");
                if (offen == null) throw new IOException("TRESOR_GESPERRT");
                Eintrag e = offen.ablegen(a.fach, a.unterordner, a.name, a.art, a.datum, new FileInputStream(a.datei), a.auszug);
                call.resolve(new JSObject(new JSONObject(e.alsMap()).toString()));
            } catch (Exception e) { call.reject(code(e)); }
            finally { if (a != null) a.datei.delete(); }
        });
    }
    @PluginMethod public void ablegenAbbrechen(PluginCall call) {
        worker.submit(call, () -> { Ablegen a = ablegen.remove(call.getString("ticket")); if (a != null) a.datei.delete(); call.resolve(); });
    }

    // ---------- Lesen: Verzeichnis, Dateien, Marken ----------
    @PluginMethod public void verzeichnis(PluginCall call) {
        worker.submit(call, () -> {
            try {
                if (offen == null) throw new IOException("TRESOR_GESPERRT");
                String fach = call.getString("fach");
                JSArray liste = new JSArray();
                for (Eintrag e : offen.verzeichnis(fach)) liste.put(new JSONObject(e.alsMap()));
                JSArray marken = new JSArray();
                for (String m : offen.marken(fach)) marken.put(m);
                call.resolve(new JSObject().put("eintraege", liste).put("marken", marken));
            } catch (Exception e) { call.reject(code(e)); }
        });
    }
    @PluginMethod public void lesenOeffnen(PluginCall call) {
        worker.submit(call, () -> {
            try {
                if (offen == null) throw new IOException("TRESOR_GESPERRT");
                String fach = call.getString("fach"), id = call.getString("id");
                Eintrag gefunden = null;
                for (Eintrag e : offen.verzeichnis(fach)) if (e.id.equals(id)) gefunden = e;
                if (gefunden == null) throw new IOException("TRESOR_EINTRAG_FEHLT");
                String ticket = UUID.randomUUID().toString();
                lesen.put(ticket, offen.oeffnen(fach, gefunden));
                call.resolve(new JSObject().put("ticket", ticket).put("groesse", gefunden.groesse).put("name", gefunden.name).put("art", gefunden.art));
            } catch (Exception e) { call.reject(code(e)); }
        });
    }
    @PluginMethod public void lesenTeil(PluginCall call) {
        worker.submit(call, () -> {
            String ticket = call.getString("ticket");
            InputStream in = lesen.get(ticket);
            try {
                if (in == null) throw new IOException("TRESOR_UEBERGABE_UNGUELTIG");
                byte[] puffer = new byte[NativeUtil.CHUNK];
                int n = 0, r;
                while (n < puffer.length && (r = in.read(puffer, n, puffer.length - n)) != -1) n += r;
                boolean fertig = n < puffer.length;
                if (fertig) { lesen.remove(ticket); in.close(); }
                call.resolve(new JSObject().put("data", Base64.encodeToString(puffer, 0, n, Base64.NO_WRAP)).put("fertig", fertig));
            } catch (Exception e) {
                lesen.remove(ticket);
                if (in != null) try { in.close(); } catch (IOException ignoriert) { }
                call.reject(code(e));
            }
        });
    }
    @PluginMethod public void markieren(PluginCall call) {
        worker.submit(call, () -> {
            try {
                if (offen == null) throw new IOException("TRESOR_GESPERRT");
                offen.markeSetzen(call.getString("fach"), call.getString("id"));
                call.resolve();
            } catch (Exception e) { call.reject(code(e)); }
        });
    }

    @Override protected void handleOnDestroy() { worker.close(this::schliessen); }
}

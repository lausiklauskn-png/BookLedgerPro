package de.familyprojekt.bookledgerpro;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.util.Arrays;

/** Hülle um die unveränderte Web-App (Schritt A, Klaus 2026-10-26). Eigene Seiten nur von https://localhost;
 *  jede andere Adresse geht an den Browser bzw. die zuständige App, nie in dieses Fenster mit seiner Brücke. */
public class MainActivity extends BridgeActivity {
    private static final String RECEIPT_STATE = "blp.incoming.intent";
    private Intent incomingReceipt;
    private boolean restoreIncoming;
    // Befund Tablet 2026-10-29: beim Teilen aus Workflow PDF Pro (Samsung, Fenster nebeneinander) stand BookLedgerPro ein
    // zweites Mal da; der Scan ging an das neue Fenster, das schon offene zeigte ihn nicht. Es gibt jetzt nur EIN Fenster:
    // eine zweite Kopie reicht die Anfrage an die laufende weiter und schließt sich, bevor ihre Seite etwas tut.
    private static java.lang.ref.WeakReference<MainActivity> laufend = new java.lang.ref.WeakReference<>(null);
    private boolean weiterleiter;

    @Override public void onCreate(Bundle state) {
        MainActivity andere = laufend.get();
        if (andere != null && andere != this && !andere.isFinishing() && !andere.isDestroyed() && andere.getTaskId() != getTaskId()) {
            weiterleiter = true;
            Intent anfrage = getIntent();
            // Die Seite dieser Kopie darf nichts einlesen: sie bekommt eine leere Start-Anfrage, die echte geht an das offene Fenster.
            setIntent(new Intent(Intent.ACTION_MAIN).setClass(this, MainActivity.class));
            super.onCreate(null);
            if (bridge != null) bridge.getWebView().stopLoading();
            // Klaus 2026-10-29: „das sollte dann wieder zurück zu Workflow-PDF springen und nicht in der Anzeige bleiben“.
            // Erst wenn die Dateien im Eingang des offenen Fensters liegen (Leserecht hängt an dieser Kopie), schließt sie sich;
            // im Fenster der sendenden App steht dann wieder diese App.
            if (!andere.uebernehmen(anfrage, () -> runOnUiThread(() -> {
                android.widget.Toast.makeText(this, "An BookLedgerPro übergeben", android.widget.Toast.LENGTH_SHORT).show();
                finish(); overridePendingTransition(0, 0);
            }))) { finish(); overridePendingTransition(0, 0); }
            return;
        }
        laufend = new java.lang.ref.WeakReference<>(this);
        if (state != null && state.containsKey(RECEIPT_STATE)) {
            incomingReceipt = state.getParcelable(RECEIPT_STATE);
            restoreIncoming = incomingReceipt != null;
        }
        registerPlugin(BlpIncomingPlugin.class);
        registerPlugin(BlpFilesPlugin.class);
        registerPlugin(BlpTresorPlugin.class);
        registerPlugin(BlpSpeechPlugin.class);
        registerPlugin(BlpUpdatesPlugin.class);
        registerPlugin(de.familyprojekt.hintergrund.ProHintergrundPlugin.class);
        super.onCreate(state);
        if (bridge == null) return;
        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            // Befund Tablet 2026-10-29 („BookLedgerPro geschlossen, da diese App einen Fehler enthält“): fällt die Anzeige aus
            // (z. B. Speichermangel), beendet Android ohne Antwort hier die ganze App. Jetzt: Anzeige aus dem Fenster nehmen und das
            // Fenster neu aufbauen — die Daten liegen verschlüsselt in der App, der Tresor fragt danach wie beim Start.
            @Override public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                android.util.Log.e("BookLedgerPro", "Anzeige ausgefallen, Fenster wird neu aufgebaut");
                try { android.view.ViewParent p = view.getParent(); if (p instanceof android.view.ViewGroup) ((android.view.ViewGroup) p).removeView(view); }
                catch (Exception egal) { /* weiter mit Neuaufbau */ }
                runOnUiThread(MainActivity.this::recreate);
                return true;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && "localhost".equals(uri.getHost()) && uri.getPort() == -1)
                    return super.shouldOverrideUrlLoading(view, request);
                boolean erlaubt = request.isForMainFrame() && Arrays.asList("http", "https", "mailto", "tel").contains(uri.getScheme())
                    && (request.hasGesture() || NativeUtil.eigeneAdresse(uri.getScheme(), uri.getHost()));
                if (erlaubt) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
                    catch (Exception none) { android.widget.Toast.makeText(MainActivity.this, "Keine App für diese Adresse", android.widget.Toast.LENGTH_SHORT).show(); }
                }
                return true;
            }
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (bridge == null) { moveTaskToBack(true); return; }
                WebView web = bridge.getWebView();
                if (web.canGoBack()) web.goBack(); else moveTaskToBack(true);
            }
        });
    }

    /** Nimmt eine Teilen-/Öffnen-Anfrage aus einer zweiten Kopie an (gleicher Prozess). fertig läuft, sobald sie im Eingang liegt. */
    boolean uebernehmen(Intent anfrage, Runnable fertig) {
        if (anfrage == null || anfrage.getAction() == null || Intent.ACTION_MAIN.equals(anfrage.getAction()) || bridge == null) return false;
        com.getcapacitor.PluginHandle h = bridge.getPlugin("BlpIncoming");
        if (h == null || !(h.getInstance() instanceof BlpIncomingPlugin)) return false;
        runOnUiThread(() -> ((BlpIncomingPlugin) h.getInstance()).annehmen(anfrage, fertig));
        return true;
    }

    // Teilen aus einer anderen App, während dieses Fenster schon lief (onNewIntent, kein Kaltstart): nach dem Speichern im Eingang
    // zurück zur sendenden App. Beim Kaltstart bleibt BookLedgerPro offen (erst entsperren, dann wird eingelesen).
    private boolean zurueckNachTeilen;
    @Override protected void onNewIntent(Intent intent) {
        // Capacitor ruft onNewIntent beim Start selbst mit getIntent() auf (BridgeActivity.load) — das ist kein „schon offenes
        // Fenster“. Nur eine wirklich neue Anfrage (anderes Intent-Objekt) springt nach dem Speichern zur sendenden App zurück.
        zurueckNachTeilen = intent != null && intent != getIntent()
            && (Intent.ACTION_SEND.equals(intent.getAction()) || Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction()));
        super.onNewIntent(intent);
    }
    boolean zurueckNehmen() { boolean z = zurueckNachTeilen; zurueckNachTeilen = false; return z; }
    void zurueckZumSender() {
        runOnUiThread(() -> {
            android.widget.Toast.makeText(this, "An BookLedgerPro übergeben", android.widget.Toast.LENGTH_SHORT).show();
            moveTaskToBack(true);
        });
    }

    @Override public void onDestroy() {
        if (!weiterleiter && laufend.get() == this) laufend = new java.lang.ref.WeakReference<>(null);
        super.onDestroy();
    }

    @Override public void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        if (incomingReceipt != null) state.putParcelable(RECEIPT_STATE, incomingReceipt);
    }

    Intent incomingForLaunch(Intent delivered) {
        if (restoreIncoming) { restoreIncoming = false; return incomingReceipt; }
        return delivered;
    }
    void rememberIncoming(Intent receipt) { incomingReceipt = receipt; }
    Intent currentIncoming() { return incomingReceipt; }
}

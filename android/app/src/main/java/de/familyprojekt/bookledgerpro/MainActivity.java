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

    @Override public void onCreate(Bundle state) {
        if (state != null && state.containsKey(RECEIPT_STATE)) {
            incomingReceipt = state.getParcelable(RECEIPT_STATE);
            restoreIncoming = incomingReceipt != null;
        }
        registerPlugin(BlpIncomingPlugin.class);
        registerPlugin(BlpFilesPlugin.class);
        registerPlugin(BlpTresorPlugin.class);
        registerPlugin(BlpSpeechPlugin.class);
        registerPlugin(de.familyprojekt.hintergrund.ProHintergrundPlugin.class);
        super.onCreate(state);
        if (bridge == null) return;
        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
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

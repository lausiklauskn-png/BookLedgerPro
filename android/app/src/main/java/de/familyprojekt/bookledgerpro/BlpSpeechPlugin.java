package de.familyprojekt.bookledgerpro;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

/**
 * Spracheingabe in der App (Klaus 2026-10-28, Befund am Tablet: „Sprachfehler: not-allowed“, blaues Feld blieb stehen).
 * Die Android-WebView meldet webkitSpeechRecognition, verweigert sie aber (gleicher Befund wie Private Brain Pro .24).
 * Deshalb hört hier Androids eigenes Sprachfenster zu; die App bekommt nur den erkannten Text, nimmt selbst nichts auf
 * und braucht kein Mikrofon-Recht.
 */
@CapacitorPlugin(name = "BlpSpeech")
public class BlpSpeechPlugin extends Plugin {
    private boolean hoert = false;

    @PluginMethod public void verfuegbar(PluginCall call) {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        JSObject r = new JSObject(); r.put("verfuegbar", i.resolveActivity(getContext().getPackageManager()) != null); call.resolve(r);
    }

    @PluginMethod public void zuhoeren(PluginCall call) {
        if (hoert) { call.reject("SPRACHE_LAEUFT"); return; }
        String sprache = call.getString("sprache", "de-DE");
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE, sprache)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, sprache)
            .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        if (i.resolveActivity(getContext().getPackageManager()) == null) { call.reject("SPRACHE_FEHLT"); return; }
        hoert = true;
        try { startActivityForResult(call, i, "erkannt"); }
        catch (ActivityNotFoundException weg) { hoert = false; call.reject("SPRACHE_FEHLT"); }
    }

    @ActivityCallback private void erkannt(PluginCall call, ActivityResult ergebnis) {
        hoert = false;
        if (call == null) return;
        JSObject r = new JSObject();
        if (ergebnis.getResultCode() != Activity.RESULT_OK || ergebnis.getData() == null) { r.put("text", ""); r.put("abgebrochen", true); call.resolve(r); return; }
        ArrayList<String> texte = ergebnis.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        r.put("text", texte != null && !texte.isEmpty() && texte.get(0) != null ? texte.get(0) : "");
        call.resolve(r);
    }
}

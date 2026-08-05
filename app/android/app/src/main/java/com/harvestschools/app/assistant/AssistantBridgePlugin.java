package com.harvestschools.app.assistant;

import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

@CapacitorPlugin(name = "AssistantBridge")
public class AssistantBridgePlugin extends Plugin {

    private static final int APP_FUNCTIONS_MINIMUM_SDK = 36;

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();

        result.put("appIntents", false);
        result.put("appFunctions", Build.VERSION.SDK_INT >= APP_FUNCTIONS_MINIMUM_SDK);

        call.resolve(result);
    }

    @PluginMethod
    public void setKnowledge(PluginCall call) {
        String payload = call.getString("payload");
        String language = HarvestAssistantStore.normalisedLanguage(call.getString("language"));

        if (payload == null || payload.isEmpty()) {
            call.reject("A payload is required");

            return;
        }

        boolean isStored = HarvestAssistantStore.saveKnowledge(getContext(), language, payload);

        if (!isStored) {
            call.reject("The knowledge payload could not be stored");

            return;
        }

        publishShortcuts(payload);

        JSObject result = new JSObject();
        result.put("value", true);

        call.resolve(result);
    }

    private void publishShortcuts(String payload) {
        new Thread(() -> {
            try {
                HarvestAssistantShortcutPublisher.publish(getContext(), new JSONObject(payload));
            } catch (Exception publishError) {
                Logger.warn("AssistantBridge could not publish the assistant shortcuts: " + publishError.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void getKnowledgeInfo(PluginCall call) {
        String language = HarvestAssistantStore.normalisedLanguage(call.getString("language"));
        JSONObject meta = HarvestAssistantStore.readMeta(getContext(), language);

        if (meta == null) {
            call.resolve();

            return;
        }

        JSObject result = new JSObject();

        result.put("language", meta.optString("language", language));
        result.put("schemaVersion", meta.optInt("schemaVersion", 0));
        result.put("contentHash", meta.optString("contentHash", ""));
        result.put("generatedAt", meta.optString("generatedAt", ""));
        result.put("storedAt", meta.optLong("storedAt", 0L));

        call.resolve(result);
    }

    @PluginMethod
    public void clearKnowledge(PluginCall call) {
        HarvestAssistantStore.clear(getContext());

        JSObject result = new JSObject();
        result.put("value", true);

        call.resolve(result);
    }
}

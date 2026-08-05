package com.harvestschools.app.assistant;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public final class HarvestAssistantStore {

    public static final String PREFERENCES_NAME = "harvest_assistant";
    public static final String META_KEY_PREFIX = "harvest_assistant_meta_";
    public static final String KNOWLEDGE_DIRECTORY = "assistant";
    public static final String PUBLIC_INFO_URL = "https://harvestschools.com/scripts/Public/SchoolInfo/getPublicSchoolInfo.php";
    public static final int SCHEMA_VERSION = 1;
    public static final int NETWORK_TIMEOUT_MS = 6000;

    private HarvestAssistantStore() {
    }

    public static String normalisedLanguage(String value) {
        return value != null && value.toLowerCase().startsWith("ar") ? "ar" : "en";
    }

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private static File knowledgeFile(Context context, String language) {
        File directory = new File(context.getFilesDir(), KNOWLEDGE_DIRECTORY);

        if (!directory.exists() && !directory.mkdirs() && !directory.isDirectory()) {
            return null;
        }

        return new File(directory, "knowledge-" + normalisedLanguage(language) + ".json");
    }

    public static boolean saveKnowledge(Context context, String language, String payload) {
        String normalised = normalisedLanguage(language);
        File target = knowledgeFile(context, normalised);

        if (target == null || payload == null) {
            return false;
        }

        File temporary = new File(target.getParentFile(), target.getName() + ".tmp");

        try (FileOutputStream stream = new FileOutputStream(temporary)) {
            stream.write(payload.getBytes(StandardCharsets.UTF_8));
        } catch (IOException writeError) {
            temporary.delete();

            return false;
        }

        if (!temporary.renameTo(target)) {
            temporary.delete();

            return false;
        }

        try {
            JSONObject document = new JSONObject(payload);
            JSONObject meta = new JSONObject();

            meta.put("language", normalised);
            meta.put("schemaVersion", document.optInt("schemaVersion", 0));
            meta.put("contentHash", document.optString("contentHash", ""));
            meta.put("generatedAt", document.optString("generatedAt", ""));
            meta.put("storedAt", System.currentTimeMillis());

            preferences(context).edit().putString(META_KEY_PREFIX + normalised, meta.toString()).apply();
        } catch (JSONException parseError) {
            return false;
        }

        return true;
    }

    public static JSONObject readMeta(Context context, String language) {
        String raw = preferences(context).getString(META_KEY_PREFIX + normalisedLanguage(language), null);

        if (raw == null) {
            return null;
        }

        try {
            return new JSONObject(raw);
        } catch (JSONException parseError) {
            return null;
        }
    }

    public static JSONObject readStoredKnowledge(Context context, String language) {
        File source = knowledgeFile(context, language);

        if (source == null || !source.exists()) {
            return null;
        }

        try (FileInputStream stream = new FileInputStream(source)) {
            String raw = readFully(stream);
            JSONObject document = new JSONObject(raw);

            return document.optInt("schemaVersion", 0) == SCHEMA_VERSION ? document : null;
        } catch (IOException | JSONException readError) {
            return null;
        }
    }

    public static void clear(Context context) {
        for (String language : new String[]{"en", "ar"}) {
            File stored = knowledgeFile(context, language);

            if (stored != null && stored.exists()) {
                stored.delete();
            }
        }

        preferences(context).edit().clear().apply();
    }

    /**
     * Fetches the public knowledge document. Blocking - call from a background thread only.
     */
    public static JSONObject fetchRemoteKnowledge(Context context, String language) {
        String normalised = normalisedLanguage(language);
        HttpURLConnection connection = null;

        try {
            URL url = new URL(PUBLIC_INFO_URL + "?lang=" + normalised);

            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(NETWORK_TIMEOUT_MS);
            connection.setReadTimeout(NETWORK_TIMEOUT_MS);
            connection.setRequestProperty("Accept", "application/json");

            if (connection.getResponseCode() != 200) {
                return null;
            }

            String body;

            try (InputStream stream = connection.getInputStream()) {
                body = readFully(stream);
            }

            JSONObject envelope = new JSONObject(body);
            JSONObject document = envelope.optJSONObject("data");

            if (document == null || document.optInt("schemaVersion", 0) != SCHEMA_VERSION) {
                return null;
            }

            saveKnowledge(context, normalised, document.toString());

            return document;
        } catch (IOException | JSONException fetchError) {
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }


    public static JSONObject knowledge(Context context, String language) {
        JSONObject stored = readStoredKnowledge(context, language);

        return stored != null ? stored : fetchRemoteKnowledge(context, language);
    }

    private static String readFully(InputStream stream) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
        int read;

        while ((read = stream.read(chunk)) != -1) {
            buffer.write(chunk, 0, read);
        }

        return buffer.toString(StandardCharsets.UTF_8.name());
    }
}

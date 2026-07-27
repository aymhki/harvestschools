package com.harvestschools.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public final class HarvestWidgetStore {

    public static final String PREFERENCES_NAME = "harvest_widget";

    public static final String QUICK_ACTIONS_KEY = "harvest_quick_actions";

    public static final String UNIVERSAL_LINK_HOST = "https://harvestschools.com";

    public static final String ARABIC_LANGUAGE = "ar";

    public static final float DEFAULT_ICON_VIEWPORT = 24f;

    public static final class QuickAction {

        public final String id;

        public final String label;

        public final String path;

        public final String iconPath;

        QuickAction(String id, String label, String path, String iconPath) {
            this.id = id;
            this.label = label;
            this.path = path;
            this.iconPath = iconPath;
        }
    }

    public static final class QuickActions {

        public final List<QuickAction> actions;

        public final String language;

        public final float iconViewport;

        QuickActions(List<QuickAction> actions, String language, float iconViewport) {
            this.actions = actions;
            this.language = language;
            this.iconViewport = iconViewport;
        }

        public boolean isArabic() {
            return ARABIC_LANGUAGE.equals(language);
        }
    }

    private HarvestWidgetStore() {
    }

    public static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    public static void saveQuickActions(Context context, String payload) {
        preferences(context).edit().putString(QUICK_ACTIONS_KEY, payload).apply();
    }

    public static QuickActions readQuickActions(Context context) {
        List<QuickAction> actions = new ArrayList<>();

        String language = "en";

        float iconViewport = DEFAULT_ICON_VIEWPORT;

        String payload = preferences(context).getString(QUICK_ACTIONS_KEY, null);

        if (payload != null) {
            try {
                JSONObject stored = new JSONObject(payload);

                language = stored.optString("language", language);

                iconViewport = (float) stored.optDouble("iconViewport", DEFAULT_ICON_VIEWPORT);

                JSONArray storedActions = stored.optJSONArray("actions");

                int total = storedActions == null ? 0 : storedActions.length();

                for (int index = 0; index < total; index += 1) {
                    JSONObject entry = storedActions.optJSONObject(index);

                    if (entry != null) {
                        actions.add(new QuickAction(
                            entry.optString("id"),
                            entry.optString("label"),
                            entry.optString("path"),
                            entry.optString("iconPath")
                        ));
                    }
                }
            } catch (JSONException parseError) {
                actions.clear();
            }
        }

        if (actions.isEmpty()) {
            actions.add(new QuickAction("calendars", "Calendars", "/events",
                "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V10h14zm0-12H5V6h14zM9 14H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zm-8 4H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2z"));
            actions.add(new QuickAction("booking", "Graduation booking", "/events/graduation-booking",
                "M11 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2M5 18c.2-.63 2.57-1.68 4.96-1.94l2.04-2c-.39-.04-.68-.06-1-.06-2.67 0-8 1.34-8 4v2h9l-2-2zm15.6-5.5-5.13 5.17-2.07-2.08L12 17l3.47 3.5L22 13.91z"));
            actions.add(new QuickAction("academics", "Academics", "/academics",
                "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1m0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5z M17.5 10.5c.88 0 1.73.09 2.5.26V9.24c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99M13 12.49v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26V11.9c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.3-4.5.83m4.5 1.84c-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26v-1.52c-.79-.16-1.64-.24-2.5-.24"));
            actions.add(new QuickAction("studentsLife", "Students life", "/students-life",
                "M4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29M20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24zm-7.76-2.78c-1.17-.52-2.61-.9-4.24-.9-1.63 0-3.07.39-4.24.9C6.68 14.13 6 15.21 6 16.39V18h12v-1.61c0-1.18-.68-2.26-1.76-2.74M8.07 16c.09-.23.13-.39.91-.69.97-.38 1.99-.56 3.02-.56s2.05.18 3.02.56c.77.3.81.46.91.69zM12 8c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1m0-2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3"));
            actions.add(new QuickAction("gallery", "Gallery", "/gallery",
                "M20 4v12H8V4zm0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-8.5 9.67 1.69 2.26 2.48-3.1L19 15H9zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6z"));
            actions.add(new QuickAction("admin", "Staff portal", "/admin-login",
                "M17 17.5c-.73 0-2.19.36-2.24 1.08.5.71 1.32 1.17 2.24 1.17s1.74-.46 2.24-1.17c-.05-.72-1.51-1.08-2.24-1.08 M18 11.09V6.27L10.5 3 3 6.27v4.91c0 4.54 3.2 8.79 7.5 9.82.55-.13 1.08-.32 1.6-.55C13.18 21.99 14.97 23 17 23c3.31 0 6-2.69 6-6 0-2.97-2.16-5.43-5-5.91M11 17c0 .56.08 1.11.23 1.62-.24.11-.48.22-.73.3-3.17-1-5.5-4.24-5.5-7.74v-3.6l5.5-2.4 5.5 2.4v3.51c-2.84.48-5 2.94-5 5.91m6 4c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4"));
        }

        return new QuickActions(actions, language, iconViewport <= 0 ? DEFAULT_ICON_VIEWPORT : iconViewport);
    }
}

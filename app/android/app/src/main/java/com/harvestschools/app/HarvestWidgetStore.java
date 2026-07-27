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
            actions.add(new QuickAction("admission", "Admission", "/admission",
                "M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9zm6.82 6L12 12.72 5.18 9 12 5.28zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73z"));
            actions.add(new QuickAction("gallery", "Gallery", "/gallery",
                "M20 4v12H8V4zm0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-8.5 9.67 1.69 2.26 2.48-3.1L19 15H9zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6z"));
        }

        return new QuickActions(actions, language, iconViewport <= 0 ? DEFAULT_ICON_VIEWPORT : iconViewport);
    }
}

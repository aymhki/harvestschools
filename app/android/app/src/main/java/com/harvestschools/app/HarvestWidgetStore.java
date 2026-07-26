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
    public static final String DEEP_LINK_SCHEME = "harvestapp";
    public static final String DEEP_LINK_HOST = "open";
    public static final String DEEP_LINK_PATH_PARAMETER = "path";

    public static final class QuickAction {

        public final String id;
        public final String label;
        public final String icon;
        public final String path;

        QuickAction(String id, String label, String icon, String path) {
            this.id = id;
            this.label = label;
            this.icon = icon;
            this.path = path;
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

    public static boolean isRightToLeft(Context context) {
        boolean isRightToLeft = false;

        try {
            String payload = preferences(context).getString(QUICK_ACTIONS_KEY, null);

            if (payload != null) {
                isRightToLeft = new JSONObject(payload).optBoolean("isRightToLeft", false);
            }
        } catch (JSONException parseError) {
            isRightToLeft = false;
        }

        return isRightToLeft;
    }

    public static List<QuickAction> readQuickActions(Context context) {
        List<QuickAction> actions = new ArrayList<>();

        String payload = preferences(context).getString(QUICK_ACTIONS_KEY, null);

        if (payload != null) {
            try {
                JSONArray stored = new JSONObject(payload).optJSONArray("actions");

                int total = stored == null ? 0 : stored.length();

                for (int index = 0; index < total; index += 1) {
                    JSONObject entry = stored.optJSONObject(index);

                    if (entry != null) {
                        actions.add(new QuickAction(
                            entry.optString("id"),
                            entry.optString("label"),
                            entry.optString("icon"),
                            entry.optString("path")
                        ));
                    }
                }
            } catch (JSONException parseError) {
                actions.clear();
            }
        }

        if (actions.isEmpty()) {
            actions.add(new QuickAction("calendars", "Calendars", "🗓️", "/events"));
            actions.add(new QuickAction("booking", "Graduation booking", "🎓", "/events/graduation-booking"));
            actions.add(new QuickAction("admission", "Admission", "📝", "/admission"));
            actions.add(new QuickAction("gallery", "Gallery", "🖼️", "/gallery"));
        }

        return actions;
    }
}

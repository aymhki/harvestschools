package com.harvestschools.app.assistant;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.harvestschools.app.MainActivity;
import com.harvestschools.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public final class HarvestAssistantShortcutPublisher {

    public static final String UNIVERSAL_LINK_HOST = "https://harvestschools.com";

    public static final int MAXIMUM_DYNAMIC_SHORTCUTS = 4;

    private static final String[] PREFERRED_PAGE_IDS = {
        "page.admission-fees",
        "page.admission",
        "page.minimum-stage-age",
        "page.events",
        "page.academics",
        "page.faqs",
    };

    private HarvestAssistantShortcutPublisher() {
    }

    public static void publish(Context context, JSONObject knowledge) {
        if (context == null || knowledge == null) {
            return;
        }

        JSONArray pages = knowledge.optJSONArray("pages");

        if (pages == null || pages.length() == 0) {
            return;
        }

        List<ShortcutInfoCompat> shortcuts = new ArrayList<>();

        for (String preferredId : PREFERRED_PAGE_IDS) {
            if (shortcuts.size() >= MAXIMUM_DYNAMIC_SHORTCUTS) {
                break;
            }

            JSONObject page = findPage(pages, preferredId);

            if (page == null) {
                continue;
            }

            String routePath = page.optString("routePath", "");
            String title = page.optString("title", "");

            if (routePath.isEmpty() || title.isEmpty()) {
                continue;
            }

            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(UNIVERSAL_LINK_HOST + routePath));
            intent.setClass(context, MainActivity.class);

            shortcuts.add(new ShortcutInfoCompat.Builder(context, "assistant-" + preferredId)
                .setShortLabel(title)
                .setLongLabel(title)
                .setIcon(IconCompat.createWithResource(context, R.mipmap.ic_launcher))
                .setIntent(intent)
                .build());
        }

        if (shortcuts.isEmpty()) {
            return;
        }

        try {
            ShortcutManagerCompat.setDynamicShortcuts(context, shortcuts);
        } catch (IllegalArgumentException | IllegalStateException publishError) {
            ShortcutManagerCompat.removeAllDynamicShortcuts(context);
        }
    }

    private static JSONObject findPage(JSONArray pages, String pageId) {
        for (int index = 0; index < pages.length(); index++) {
            JSONObject page = pages.optJSONObject(index);

            if (page != null && pageId.equals(page.optString("id", ""))) {
                return page;
            }
        }

        return null;
    }
}

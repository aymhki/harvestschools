package com.harvestschools.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import java.util.List;


public class QuickActionsWidgetProvider extends AppWidgetProvider {

    private static final int MAXIMUM_COLUMNS = 4;
    private static final int MAXIMUM_ROWS = 3;
    private static final int CELL_SIZE_DP = 70;
    private static final int CELL_PADDING_DP = 30;

    private static final int[][] TILE_IDS = {
        { R.id.quick_action_0_0, R.id.quick_action_0_1, R.id.quick_action_0_2, R.id.quick_action_0_3 },
        { R.id.quick_action_1_0, R.id.quick_action_1_1, R.id.quick_action_1_2, R.id.quick_action_1_3 },
        { R.id.quick_action_2_0, R.id.quick_action_2_1, R.id.quick_action_2_2, R.id.quick_action_2_3 }
    };

    private static final int[][] TILE_ICON_IDS = {
        { R.id.quick_action_icon_0_0, R.id.quick_action_icon_0_1, R.id.quick_action_icon_0_2, R.id.quick_action_icon_0_3 },
        { R.id.quick_action_icon_1_0, R.id.quick_action_icon_1_1, R.id.quick_action_icon_1_2, R.id.quick_action_icon_1_3 },
        { R.id.quick_action_icon_2_0, R.id.quick_action_icon_2_1, R.id.quick_action_icon_2_2, R.id.quick_action_icon_2_3 }
    };

    private static final int[][] TILE_LABEL_IDS = {
        { R.id.quick_action_label_0_0, R.id.quick_action_label_0_1, R.id.quick_action_label_0_2, R.id.quick_action_label_0_3 },
        { R.id.quick_action_label_1_0, R.id.quick_action_label_1_1, R.id.quick_action_label_1_2, R.id.quick_action_label_1_3 },
        { R.id.quick_action_label_2_0, R.id.quick_action_label_2_1, R.id.quick_action_label_2_2, R.id.quick_action_label_2_3 }
    };

    private static final int[] ROW_IDS = { R.id.quick_action_row_0, R.id.quick_action_row_1, R.id.quick_action_row_2 };

    public static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] widgetIds = manager.getAppWidgetIds(
            new android.content.ComponentName(context, QuickActionsWidgetProvider.class)
        );

        for (int widgetId : widgetIds) {
            renderWidget(context, manager, widgetId);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            renderWidget(context, appWidgetManager, widgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);

        renderWidget(context, appWidgetManager, appWidgetId);
    }

    private static int cellsFor(int availableDp, int maximum) {
        int cells = (int) Math.floor((availableDp + CELL_PADDING_DP) / (double) CELL_SIZE_DP);

        return Math.max(1, Math.min(maximum, cells));
    }

    private static PendingIntent deepLinkFor(Context context, HarvestWidgetStore.QuickAction action, int requestCode) {
        Uri destination = new Uri.Builder()
            .scheme(HarvestWidgetStore.DEEP_LINK_SCHEME)
            .authority(HarvestWidgetStore.DEEP_LINK_HOST)
            .appendQueryParameter(HarvestWidgetStore.DEEP_LINK_PATH_PARAMETER, action.path)
            .build();

        Intent intent = new Intent(context, MainActivity.class);

        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(destination);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static void renderWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
        int columns = cellsFor(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, CELL_SIZE_DP), MAXIMUM_COLUMNS);
        int rows = cellsFor(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, CELL_SIZE_DP), MAXIMUM_ROWS);
        List<HarvestWidgetStore.QuickAction> actions = HarvestWidgetStore.readQuickActions(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.quick_actions_widget);

        int nextAction = 0;

        for (int row = 0; row < MAXIMUM_ROWS; row += 1) {
            boolean rowIsUsed = row < rows && nextAction < actions.size();

            views.setViewVisibility(ROW_IDS[row], rowIsUsed ? View.VISIBLE : View.GONE);

            for (int column = 0; column < MAXIMUM_COLUMNS; column += 1) {
                boolean slotIsUsed = rowIsUsed && column < columns && nextAction < actions.size();

                views.setViewVisibility(TILE_IDS[row][column], slotIsUsed ? View.VISIBLE : View.GONE);

                if (slotIsUsed) {
                    HarvestWidgetStore.QuickAction action = actions.get(nextAction);

                    views.setTextViewText(TILE_ICON_IDS[row][column], action.icon);
                    views.setTextViewText(TILE_LABEL_IDS[row][column], action.label);
                    views.setOnClickPendingIntent(TILE_IDS[row][column], deepLinkFor(context, action, nextAction));

                    nextAction += 1;
                }
            }
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}

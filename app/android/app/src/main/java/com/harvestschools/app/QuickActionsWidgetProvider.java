package com.harvestschools.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import java.util.List;


public class QuickActionsWidgetProvider extends AppWidgetProvider {

    private static final int MAXIMUM_COLUMNS = 4;

    private static final int MAXIMUM_ROWS = 4;

    private static final int CELL_SIZE_DP = 70;

    private static final int CELL_PADDING_DP = 30;

    private static final int[][] TILE_IDS = {
        { R.id.quick_action_0_0, R.id.quick_action_0_1, R.id.quick_action_0_2, R.id.quick_action_0_3 },
        { R.id.quick_action_1_0, R.id.quick_action_1_1, R.id.quick_action_1_2, R.id.quick_action_1_3 },
        { R.id.quick_action_2_0, R.id.quick_action_2_1, R.id.quick_action_2_2, R.id.quick_action_2_3 },
        { R.id.quick_action_3_0, R.id.quick_action_3_1, R.id.quick_action_3_2, R.id.quick_action_3_3 }
    };

    private static final int[] ROW_IDS = {
        R.id.quick_action_row_0,
        R.id.quick_action_row_1,
        R.id.quick_action_row_2,
        R.id.quick_action_row_3
    };

    public static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] widgetIds = manager.getAppWidgetIds(new ComponentName(context, QuickActionsWidgetProvider.class));

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
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId,
                                          Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);

        renderWidget(context, appWidgetManager, appWidgetId);
    }

    private static int cellsFor(int availableDp, int maximum) {
        int cells = (int) Math.floor((availableDp + CELL_PADDING_DP) / (double) CELL_SIZE_DP);

        return Math.max(1, Math.min(maximum, cells));
    }

    private static PendingIntent destinationFor(Context context, HarvestWidgetStore.QuickAction action,
                                                int requestCode) {
        Uri destination = Uri.parse(HarvestWidgetStore.UNIVERSAL_LINK_HOST + action.path);

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

        int availableWidthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, CELL_SIZE_DP);

        int availableHeightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, CELL_SIZE_DP);

        int columns = cellsFor(availableWidthDp, MAXIMUM_COLUMNS);

        int rows = cellsFor(availableHeightDp, MAXIMUM_ROWS);

        float density = context.getResources().getDisplayMetrics().density;

        int tileWidth = (int) ((availableWidthDp * density) / columns);

        int tileHeight = (int) ((availableHeightDp * density) / rows);

        HarvestWidgetStore.QuickActions stored = HarvestWidgetStore.readQuickActions(context);

        List<HarvestWidgetStore.QuickAction> actions = stored.actions;

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

                    Bitmap tile = QuickActionTileRenderer.render(
                        context,
                        action,
                        stored.isArabic(),
                        stored.iconViewport,
                        tileWidth,
                        tileHeight
                    );

                    views.setImageViewBitmap(TILE_IDS[row][column], tile);
                    views.setContentDescription(TILE_IDS[row][column], action.label);
                    views.setOnClickPendingIntent(TILE_IDS[row][column], destinationFor(context, action, nextAction));

                    nextAction += 1;
                }
            }
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}

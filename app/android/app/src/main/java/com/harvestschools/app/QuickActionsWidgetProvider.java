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

    private static int columnsFor(int count, int availableWidthDp, int availableHeightDp, int maximumColumns) {
        if (count <= 0 || availableWidthDp <= 0 || availableHeightDp <= 0) {
            return 1;
        }

        int ideal = (int) Math.round(Math.sqrt((double) count * availableWidthDp / availableHeightDp));
        return Math.max(1, Math.min(Math.min(count, maximumColumns), ideal));
    }

    private static int capacityFor(int availableWidthDp, int availableHeightDp) {
        int widthCells = Math.max(1, Math.min(MAXIMUM_COLUMNS,
            (int) Math.floor((availableWidthDp + CELL_PADDING_DP) / (double) CELL_SIZE_DP)));

        int heightCells = Math.max(1, Math.min(MAXIMUM_ROWS,
            (int) Math.floor((availableHeightDp + CELL_PADDING_DP) / (double) CELL_SIZE_DP)));

        return widthCells * heightCells;
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

        HarvestWidgetStore.QuickActions stored = HarvestWidgetStore.readQuickActions(context);
        List<HarvestWidgetStore.QuickAction> actions = stored.actions;
        int visibleCount = Math.min(actions.size(), capacityFor(availableWidthDp, availableHeightDp));
        int columns = columnsFor(visibleCount, availableWidthDp, availableHeightDp, MAXIMUM_COLUMNS);
        int rows = Math.max(1, (int) Math.ceil(visibleCount / (double) columns));

        float density = context.getResources().getDisplayMetrics().density;

        int tileWidth = (int) ((availableWidthDp * density) / columns);

        int tileHeight = (int) ((availableHeightDp * density) / rows);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.quick_actions_widget);

        int nextAction = 0;

        for (int row = 0; row < MAXIMUM_ROWS; row += 1) {
            boolean rowIsUsed = row < rows && nextAction < visibleCount;

            views.setViewVisibility(ROW_IDS[row], rowIsUsed ? View.VISIBLE : View.GONE);

            for (int column = 0; column < MAXIMUM_COLUMNS; column += 1) {
                boolean slotIsUsed = rowIsUsed && column < columns && nextAction < visibleCount;

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

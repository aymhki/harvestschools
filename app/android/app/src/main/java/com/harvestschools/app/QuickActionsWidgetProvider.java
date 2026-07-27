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

    private static final float WIDEST_TILE_ASPECT = 1.5f;
    private static final float TALLEST_TILE_ASPECT = 0.75f;
    private static final double EMPTY_SLOT_PENALTY = 0.6;
    private static final double SHAPE_PENALTY = 4;

    private static int[] planFor(int count, int availableWidthDp, int availableHeightDp, int maximumColumns, int maximumRows) {
        int bestColumns = Math.max(1, Math.min(count, maximumColumns));
        int bestRows = 1;
        double bestScore = Double.MAX_VALUE;

        for (int columns = 1; columns <= Math.min(count, maximumColumns); columns += 1) {
            int rows = (int) Math.ceil(count / (double) columns);

            if (rows > maximumRows) {
                continue;
            }

            double aspect = (availableWidthDp / (double) columns) / (availableHeightDp / (double) rows);

            boolean fitsShape = aspect <= WIDEST_TILE_ASPECT * 1.6 && aspect >= TALLEST_TILE_ASPECT * 0.6;

            double score = Math.abs(Math.log(aspect))
                + (columns * rows - count) * EMPTY_SLOT_PENALTY
                + (fitsShape ? 0 : SHAPE_PENALTY);

            if (score < bestScore) {
                bestScore = score;

                bestColumns = columns;
                bestRows = rows;
            }
        }

        return new int[] { bestColumns, bestRows };
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
        int[] plan = planFor(visibleCount, availableWidthDp, availableHeightDp, MAXIMUM_COLUMNS, MAXIMUM_ROWS);
        int columns = plan[0];
        int rows = plan[1];
        float density = context.getResources().getDisplayMetrics().density;
        float cellWidth = (availableWidthDp * density) / columns;
        float cellHeight = (availableHeightDp * density) / rows;
        int tileWidth = (int) Math.max(1, Math.min(cellWidth, cellHeight * WIDEST_TILE_ASPECT));
        int tileHeight = (int) Math.max(1, Math.min(cellHeight, cellWidth / TALLEST_TILE_ASPECT));
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.quick_actions_widget);

        for (int row = 0; row < MAXIMUM_ROWS; row += 1) {
            int rowStart = row * columns;

            int inThisRow = Math.max(0, Math.min(visibleCount - rowStart, columns));

            views.setViewVisibility(ROW_IDS[row], row < rows && inThisRow > 0 ? View.VISIBLE : View.GONE);
            int leadingGap = (columns - inThisRow) / 2;

            for (int column = 0; column < MAXIMUM_COLUMNS; column += 1) {
                int indexInRow = column - leadingGap;

                boolean slotIsUsed = column < columns && indexInRow >= 0 && indexInRow < inThisRow;

                views.setViewVisibility(
                    TILE_IDS[row][column],
                    column < columns ? View.VISIBLE : View.GONE
                );

                if (slotIsUsed) {
                    HarvestWidgetStore.QuickAction action = actions.get(rowStart + indexInRow);

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
                    views.setOnClickPendingIntent(TILE_IDS[row][column], destinationFor(context, action, rowStart + indexInRow));
                } else if (column < columns) {
                    views.setImageViewBitmap(TILE_IDS[row][column], null);
                    views.setOnClickPendingIntent(TILE_IDS[row][column], null);
                }
            }
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}

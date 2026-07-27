package com.harvestschools.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;

import androidx.core.content.ContextCompat;
import androidx.core.content.res.ResourcesCompat;
import androidx.core.graphics.PathParser;


public final class QuickActionTileRenderer {

    private static final float TILE_CORNER_RADIUS_DP = 16f;

    private static final float TILE_GLOW_RADIUS_DP = 5f;

    private static final float TILE_PADDING_DP = 6f;

    private static final float ICON_SIZE_DP = 26f;

    private static final float LABEL_SIZE_DP = 10f;

    private static final float LABEL_TOP_MARGIN_DP = 5f;

    private static final int LABEL_MAXIMUM_LINES = 2;

    private static final int GLOW_ALPHA = 90;

    private QuickActionTileRenderer() {
    }

    public static Bitmap render(Context context, HarvestWidgetStore.QuickAction action, boolean isArabic,
                                float iconViewport, int widthInPixels, int heightInPixels) {
        int width = Math.max(1, widthInPixels);

        int height = Math.max(1, heightInPixels);

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

        Canvas canvas = new Canvas(bitmap);

        float density = context.getResources().getDisplayMetrics().density;

        int surfaceColor = ContextCompat.getColor(context, R.color.harvest_widget_surface);

        int contentColor = ContextCompat.getColor(context, R.color.harvest_widget_text);

        drawCard(canvas, density, width, height, surfaceColor, contentColor);

        float iconSize = ICON_SIZE_DP * density;

        float contentHeight = iconSize + (LABEL_TOP_MARGIN_DP * density);

        float iconTop = Math.max(TILE_PADDING_DP * density, (height - contentHeight - (LABEL_SIZE_DP * 2 * density)) / 2);

        drawIcon(canvas, action.iconPath, iconViewport, contentColor, (width - iconSize) / 2, iconTop, iconSize);

        drawLabel(context, canvas, action.label, isArabic, contentColor, density, width,
            iconTop + iconSize + (LABEL_TOP_MARGIN_DP * density));

        return bitmap;
    }

    private static void drawCard(Canvas canvas, float density, int width, int height, int surfaceColor, int glowColor) {
        float glowRadius = TILE_GLOW_RADIUS_DP * density;

        float cornerRadius = TILE_CORNER_RADIUS_DP * density;

        RectF bounds = new RectF(glowRadius, glowRadius, width - glowRadius, height - glowRadius);

        Paint glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        glowPaint.setColor(Color.argb(GLOW_ALPHA, Color.red(glowColor), Color.green(glowColor), Color.blue(glowColor)));
        glowPaint.setMaskFilter(new BlurMaskFilter(glowRadius, BlurMaskFilter.Blur.NORMAL));

        canvas.drawRoundRect(bounds, cornerRadius, cornerRadius, glowPaint);

        Paint surfacePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        surfacePaint.setColor(surfaceColor);

        canvas.drawRoundRect(bounds, cornerRadius, cornerRadius, surfacePaint);
    }

    private static void drawIcon(Canvas canvas, String pathData, float iconViewport, int color,
                                 float left, float top, float size) {
        if (pathData == null || pathData.isEmpty()) {
            return;
        }

        Path path = PathParser.createPathFromPathData(pathData);

        if (path == null) {
            return;
        }

        float scale = size / (iconViewport <= 0 ? HarvestWidgetStore.DEFAULT_ICON_VIEWPORT : iconViewport);

        Matrix matrix = new Matrix();

        matrix.setScale(scale, scale);
        matrix.postTranslate(left, top);

        path.transform(matrix);

        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        paint.setColor(color);
        paint.setStyle(Paint.Style.FILL);

        canvas.drawPath(path, paint);
    }

    private static void drawLabel(Context context, Canvas canvas, String label, boolean isArabic, int color,
                                  float density, int width, float top) {
        Typeface typeface = ResourcesCompat.getFont(context, isArabic ? R.font.arian_lt : R.font.futura_lt);

        TextPaint textPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);

        textPaint.setColor(color);
        textPaint.setTextSize(LABEL_SIZE_DP * density);

        if (typeface != null) {
            textPaint.setTypeface(typeface);
        }

        int labelWidth = Math.max(1, (int) (width - (TILE_PADDING_DP * 2 * density)));

        StaticLayout layout = StaticLayout.Builder
            .obtain(label, 0, label.length(), textPaint, labelWidth)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setMaxLines(LABEL_MAXIMUM_LINES)
            .setEllipsize(TextUtils.TruncateAt.END)
            .setIncludePad(false)
            .build();

        canvas.save();
        canvas.translate(TILE_PADDING_DP * density, top);

        layout.draw(canvas);

        canvas.restore();
    }
}

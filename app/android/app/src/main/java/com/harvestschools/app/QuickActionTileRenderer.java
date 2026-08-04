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

    private static final float CORNER_RADIUS_SHARE = 0.16f;
    private static final float ICON_SHARE = 0.34f;
    private static final float LABEL_SHARE = 0.14f;
    private static final float MINIMUM_CORNER_RADIUS_DP = 12f;
    private static final float MAXIMUM_CORNER_RADIUS_DP = 28f;
    private static final float MINIMUM_ICON_DP = 18f;
    private static final float MAXIMUM_ICON_DP = 64f;
    private static final float MINIMUM_LABEL_DP = 9f;
    private static final float MAXIMUM_LABEL_DP = 20f;
    private static final float TILE_GLOW_RADIUS_DP = 5f;
    private static final int LABEL_MAXIMUM_LINES = 2;

    private static final float ICON_LABEL_GAP_SHARE = 0.45f;

    private static final float CONTENT_INSET_DP = 4f;

    private static final float FIT_STEP = 0.88f;

    private static final int MAXIMUM_FIT_ATTEMPTS = 6;
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
        float shortestSide = Math.min(width, height);
        float glowRadius = TILE_GLOW_RADIUS_DP * density;
        float cornerRadius = clamp(shortestSide * CORNER_RADIUS_SHARE, MINIMUM_CORNER_RADIUS_DP * density, MAXIMUM_CORNER_RADIUS_DP * density);
        int surfaceColor = ContextCompat.getColor(context, R.color.harvest_widget_surface);
        int contentColor = ContextCompat.getColor(context, R.color.harvest_widget_text);
        drawCard(canvas, width, height, glowRadius, cornerRadius, surfaceColor, contentColor);
        float iconSize = clamp(shortestSide * ICON_SHARE, MINIMUM_ICON_DP * density, MAXIMUM_ICON_DP * density);
        float labelSize = clamp(shortestSide * LABEL_SHARE, MINIMUM_LABEL_DP * density, MAXIMUM_LABEL_DP * density);
        float availableHeight = height - glowRadius * 2 - CONTENT_INSET_DP * density * 2;
        float labelWidth = Math.max(1, width - glowRadius * 2 - CONTENT_INSET_DP * density * 2);
        boolean useArabicFace = isArabic && !UNTRANSLATED_ACTION_IDS.contains(action.id);
        TextPaint textPaint = labelPaint(context, useArabicFace, contentColor, labelSize);
        StaticLayout label = layoutLabel(action.label, textPaint, (int) labelWidth);
        int attempt = 0;

        while (iconSize + labelSize * ICON_LABEL_GAP_SHARE + label.getHeight() > availableHeight
            && attempt < MAXIMUM_FIT_ATTEMPTS) {
            iconSize = Math.max(iconSize * FIT_STEP, MINIMUM_ICON_DP * density * 0.6f);
            labelSize = Math.max(labelSize * FIT_STEP, MINIMUM_LABEL_DP * density * 0.75f);
            textPaint = labelPaint(context, useArabicFace, contentColor, labelSize);
            label = layoutLabel(action.label, textPaint, (int) labelWidth);
            attempt += 1;
        }

        float contentHeight = iconSize + labelSize * ICON_LABEL_GAP_SHARE + label.getHeight();
        float contentTop = Math.max(glowRadius, (height - contentHeight) / 2);
        drawIcon(canvas, action.iconPath, iconViewport, contentColor, (width - iconSize) / 2, contentTop, iconSize);
        canvas.save();
        canvas.translate((width - labelWidth) / 2, contentTop + iconSize + labelSize * ICON_LABEL_GAP_SHARE);
        label.draw(canvas);
        canvas.restore();

        return bitmap;
    }

    private static float clamp(float value, float minimum, float maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    private static void drawCard(Canvas canvas, int width, int height, float glowRadius, float cornerRadius, int surfaceColor, int glowColor) {
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

    private static final java.util.Set<String> UNTRANSLATED_ACTION_IDS = java.util.Collections.singleton("schooleverywhere");

    private static TextPaint labelPaint(Context context, boolean isArabic, int color, float labelSize) {
        Typeface typeface = ResourcesCompat.getFont(context, isArabic ? R.font.arian_lt : R.font.futura_lt);

        TextPaint textPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);

        textPaint.setColor(color);
        textPaint.setTextSize(labelSize);

        if (typeface != null) {
            textPaint.setTypeface(typeface);
        }

        return textPaint;
    }

    private static StaticLayout layoutLabel(String label, TextPaint textPaint, int width) {
        return StaticLayout.Builder
            .obtain(label, 0, label.length(), textPaint, width)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setMaxLines(LABEL_MAXIMUM_LINES)
            .setEllipsize(TextUtils.TruncateAt.END)
            .setIncludePad(false)
            .build();
    }
}

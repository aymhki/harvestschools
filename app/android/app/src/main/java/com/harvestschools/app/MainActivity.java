package com.harvestschools.app;

import android.content.Intent;
import android.graphics.Color;
import android.content.res.Configuration;
import androidx.annotation.NonNull;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.ImageButton;
import android.widget.LinearLayout;

import androidx.annotation.Nullable;
import androidx.cardview.widget.CardView;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import androidx.core.content.ContextCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import android.view.HapticFeedbackConstants;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private ImageButton backButton;
    private ImageButton forwardButton;
    private SwipeRefreshLayout swipeRefreshLayout;
    private CoordinatorLayout rootLayout;

    private volatile String currentShareUrl = "https://harvestschools.com";
    private boolean isWaitingForReload = false;
    private long refreshTriggeredAt = 0L;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().getDecorView().post(this::setUpFloatingChrome);
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        applyThemeColors();
    }

    private void applyThemeColors() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;

        if (webView == null || swipeRefreshLayout == null || rootLayout == null) {
            return;
        }

        int backgroundColor = ContextCompat.getColor(this, R.color.web_content_background);

        rootLayout.setBackgroundColor(backgroundColor);
        webView.setBackgroundColor(backgroundColor);
        swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.web_content_background);
    }

    private void setUpFloatingChrome() {
        WebView webView = getBridge().getWebView();
        if (webView == null || !(webView.getParent() instanceof CoordinatorLayout)) return;

        CoordinatorLayout root = (CoordinatorLayout) webView.getParent();
        rootLayout = root;
        int backgroundColor = ContextCompat.getColor(this, R.color.web_content_background);

        root.setBackgroundColor(backgroundColor);
        webView.setBackgroundColor(backgroundColor);

        int index = root.indexOfChild(webView);
        root.removeView(webView);

        swipeRefreshLayout = new SwipeRefreshLayout(this);
        CoordinatorLayout.LayoutParams swipeParams = new CoordinatorLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
        );
        swipeRefreshLayout.setLayoutParams(swipeParams);
        swipeRefreshLayout.addView(
                webView,
                new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );
        root.addView(swipeRefreshLayout, index);

        swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.web_content_background);
        swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.web_content_background);
        swipeRefreshLayout.setColorSchemeResources(R.color.pull_refresh_indicator_color);

        swipeRefreshLayout.setOnRefreshListener(() -> {
            isWaitingForReload = true;
            refreshTriggeredAt = System.currentTimeMillis();
            swipeRefreshLayout.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK);
            webView.reload();
        });

        webView.addJavascriptInterface(new NativeBridge(), "AndroidNativeBridge");

        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            int topInset = insets.getInsets(
                    WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
            ).top;
            CoordinatorLayout.LayoutParams params = (CoordinatorLayout.LayoutParams) swipeRefreshLayout.getLayoutParams();
            if (params.topMargin != topInset) {
                params.topMargin = topInset;
                swipeRefreshLayout.setLayoutParams(params);
                swipeRefreshLayout.setProgressViewOffset(false, topInset, topInset + dp(64));
            }
            return insets;
        });
        ViewCompat.requestApplyInsets(root);

        addFloatingNavBar(root, webView);
        startPollingLoop(webView);
    }

    private void addFloatingNavBar(CoordinatorLayout root, WebView webView) {
        int outerPad = dp(10);

        CardView card = new CardView(this);
        card.setRadius(dp(26));
        card.setCardElevation(dp(6));
        card.setUseCompatPadding(false);
        card.setCardBackgroundColor(Color.argb(235, 250, 250, 250));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(outerPad, outerPad, outerPad, outerPad);

        backButton = makeIconButton(R.drawable.ic_nav_back);
        forwardButton = makeIconButton(R.drawable.ic_nav_forward);
        ImageButton shareButton = makeIconButton(R.drawable.ic_nav_share);

        backButton.setOnClickListener(v -> { if (webView.canGoBack()) webView.goBack(); });
        forwardButton.setOnClickListener(v -> { if (webView.canGoForward()) webView.goForward(); });
        shareButton.setOnClickListener(v -> shareCurrentUrl());

        row.addView(backButton);
        row.addView(forwardButton);
        row.addView(shareButton);
        card.addView(row);

        CoordinatorLayout.LayoutParams lp = new CoordinatorLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.gravity = Gravity.BOTTOM | Gravity.START;
        lp.setMargins(dp(16), 0, 0, dp(16));
        card.setLayoutParams(lp);
        root.addView(card);

        ViewCompat.setOnApplyWindowInsetsListener(card, (v, insets) -> {
            int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            params.bottomMargin = dp(16) + bottomInset;
            v.setLayoutParams(params);
            return insets;
        });

        updateNavButtonState(webView);
    }

    private void startPollingLoop(WebView webView) {
        webView.postDelayed(new Runnable() {
            @Override public void run() {
                updateNavButtonState(webView);

                if (isWaitingForReload) {
                    long elapsed = System.currentTimeMillis() - refreshTriggeredAt;
                    boolean progressDone = elapsed > 300 && webView.getProgress() >= 100;
                    boolean timedOut = elapsed > 8000;
                    if (progressDone || timedOut) {
                        isWaitingForReload = false;
                        if (swipeRefreshLayout != null) swipeRefreshLayout.setRefreshing(false);
                    }
                }

                webView.postDelayed(this, 200);
            }
        }, 200);
    }

    private void updateNavButtonState(WebView webView) {
        if (backButton != null) {
            backButton.setEnabled(webView.canGoBack());
            backButton.setAlpha(webView.canGoBack() ? 1f : 0.35f);
        }
        if (forwardButton != null) {
            forwardButton.setEnabled(webView.canGoForward());
            forwardButton.setAlpha(webView.canGoForward() ? 1f : 0.35f);
        }
    }

    private ImageButton makeIconButton(int drawableRes) {
        ImageButton button = new ImageButton(this);
        button.setImageResource(drawableRes);
        int pad = dp(12);
        button.setPadding(pad, pad, pad, pad);
        button.setBackgroundResource(android.R.color.transparent);
        TypedValue outValue = new TypedValue();
        getTheme().resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, outValue, true);
        button.setForeground(getDrawable(outValue.resourceId));
        button.setLayoutParams(new LinearLayout.LayoutParams(dp(44), dp(44)));
        return button;
    }

    private void shareCurrentUrl() {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, currentShareUrl);
        startActivity(Intent.createChooser(shareIntent, null));
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics());
    }

    private class NativeBridge {
        @JavascriptInterface
        public void setShareUrl(String url) {
            if (url != null && !url.isEmpty()) {
                currentShareUrl = url;
            }
        }
    }
}

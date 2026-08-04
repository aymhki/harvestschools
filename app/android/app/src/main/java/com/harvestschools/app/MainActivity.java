package com.harvestschools.app;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.content.res.Configuration;
import androidx.annotation.NonNull;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
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
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    private ImageButton backButton;
    private ImageButton forwardButton;
    private CardView floatingNavBarCard;
    private final android.os.Handler revealHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private Runnable revealRunnable;
    private boolean isNavBarHidden = false;
    private boolean isNavBarSuppressed = false;
    private static final long NAV_BAR_REVEAL_DELAY_MS = 1200L;
    private static final int NAV_BAR_SCROLL_TOLERANCE_PX = 12;
    private static final long NAV_BAR_SCROLL_SETTLE_MS = 400L;
    private long ignoreScrollUntilMs = 0L;
    private SwipeRefreshLayout swipeRefreshLayout;
    private CoordinatorLayout rootLayout;
    private volatile String currentShareUrl = "https://harvestschools.com";
    private boolean isWaitingForReload = false;
    private long refreshTriggeredAt = 0L;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(WalletPassPlugin.class);
        registerPlugin(HomeWidgetPlugin.class);
        registerPlugin(AppChromePlugin.class);
        registerPlugin(HarvestBrowserPlugin.class);
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
            webView.evaluateJavascript("window.dispatchEvent(new Event('harvestPullToRefresh'))", null);
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

        installWebViewRecovery();
        installEdgeSwipeNavigation(webView);
        addFloatingNavBar(root, webView);
        installNavBarAutoHide(webView);
        startPollingLoop(webView);
    }

    private void installWebViewRecovery() {
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public boolean onRenderProcessGone(WebView webView, RenderProcessGoneDetail detail) {
                if (webView == null) {
                    return false;
                }

                webView.reload();

                return true;
            }
        });
    }

    private void installEdgeSwipeNavigation(WebView webView) {
        final int edgeWidth = dp(24);
        final int travelThreshold = dp(72);
        final float[] downPoint = new float[2];
        final boolean[] startedAtEdge = new boolean[2];

        webView.setOnTouchListener((view, event) -> {
            int action = event.getActionMasked();

            if (action == MotionEvent.ACTION_DOWN) {
                downPoint[0] = event.getX();
                downPoint[1] = event.getY();
                startedAtEdge[0] = event.getX() <= edgeWidth;
                startedAtEdge[1] = event.getX() >= view.getWidth() - edgeWidth;
            } else if (action == MotionEvent.ACTION_UP) {
                float horizontalTravel = event.getX() - downPoint[0];
                float verticalTravel = Math.abs(event.getY() - downPoint[1]);

                if (verticalTravel < Math.abs(horizontalTravel)) {
                    if (startedAtEdge[0] && horizontalTravel > travelThreshold && webView.canGoBack()) {
                        webView.goBack();
                    } else if (startedAtEdge[1] && horizontalTravel < -travelThreshold && webView.canGoForward()) {
                        webView.goForward();
                    }
                }

                startedAtEdge[0] = false;
                startedAtEdge[1] = false;
            }

            return false;
        });
    }


    private void installNavBarAutoHide(WebView webView) {
        webView.setOnScrollChangeListener((view, scrollX, scrollY, oldScrollX, oldScrollY) -> {
            if (Math.abs(scrollY - oldScrollY) <= NAV_BAR_SCROLL_TOLERANCE_PX) {
                return;
            }

            if (System.currentTimeMillis() < ignoreScrollUntilMs) {
                return;
            }

            setNavBarHidden(true);
            scheduleNavBarReveal();
        });
    }

    void setNavigationBarSuppressed(boolean suppressed) {
        isNavBarSuppressed = suppressed;

        if (revealRunnable != null) {
            revealHandler.removeCallbacks(revealRunnable);
        }

        if (floatingNavBarCard != null) {
            floatingNavBarCard.setClickable(!suppressed);
        }

        if (!suppressed) {
            ignoreScrollUntilMs = System.currentTimeMillis() + NAV_BAR_SCROLL_SETTLE_MS;
        }

        setNavBarHidden(suppressed);
    }

    private void scheduleNavBarReveal() {
        if (revealRunnable != null) {
            revealHandler.removeCallbacks(revealRunnable);
        }

        revealRunnable = () -> setNavBarHidden(false);

        revealHandler.postDelayed(revealRunnable, NAV_BAR_REVEAL_DELAY_MS);
    }

    private void setNavBarHidden(boolean hidden) {
        if (floatingNavBarCard == null || (isNavBarSuppressed && !hidden) || hidden == isNavBarHidden) {
            return;
        }

        isNavBarHidden = hidden;

        floatingNavBarCard.animate()
                .alpha(hidden ? 0f : 1f)
                .translationY(hidden ? dp(24) : 0f)
                .setDuration(220)
                .start();
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
        lp.setMargins(dp(12), 0, 0, dp(6));
        card.setLayoutParams(lp);

        card.setAlpha(0f);
        card.setClickable(false);

        root.addView(card);
        floatingNavBarCard = card;
        updateNavButtonState(webView);
    }

    CardView getFloatingNavBar() {
        return floatingNavBarCard;
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

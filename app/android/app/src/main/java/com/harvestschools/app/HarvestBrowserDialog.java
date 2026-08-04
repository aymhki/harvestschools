package com.harvestschools.app;

import android.animation.ValueAnimator;
import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.cardview.widget.CardView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.Map;

public class HarvestBrowserDialog extends Dialog {

    public interface Listener {
        void onBrowserClosed();
        void onPageLoaded(String url);
        void onUrlChanged(String url);
        void onMessage(String rawJson);
    }

    public static class Chrome {
        public boolean showUrlBar = true;
        public boolean collapseUrlBarOnScroll = true;
        public boolean showBack = true;
        public boolean showForward = false;
        public boolean showReload = true;
        public boolean showShare = false;
        public boolean showClose = true;
        public boolean keepTopInset = true;
    }

    private final String startUrl;
    private final Map<String, String> startHeaders;
    private final Chrome chrome;
    private final Listener listener;

    private WebView webView;
    private FrameLayout root;
    private CardView navBar;
    private CardView actionBar;
    private CardView urlChip;
    private TextView urlLabel;
    private ImageButton backButton;
    private ImageButton forwardButton;

    private boolean isShowingFullUrl = false;
    private static final int SCROLL_TOLERANCE_PX = 12;

    public HarvestBrowserDialog(@NonNull Context context, String url, Map<String, String> headers, Chrome chrome, Listener listener) {
        super(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen);

        this.startUrl = url;
        this.startHeaders = headers;
        this.chrome = chrome;
        this.listener = listener;
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        if (window != null) {
            WindowCompat.setDecorFitsSystemWindows(window, false);
            window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        }

        root = new FrameLayout(getContext());
        root.setBackgroundColor(Color.WHITE);

        buildWebView();
        buildActionBar();
        buildUrlChip();

        setContentView(root);

        installSessionCookies();

        webView.loadUrl(startUrl, startHeaders);
    }

    private void installSessionCookies() {
        String cookieHeader = null;

        for (Map.Entry<String, String> entry : startHeaders.entrySet()) {
            if ("cookie".equalsIgnoreCase(entry.getKey())) { cookieHeader = entry.getValue(); }
        }

        if (cookieHeader == null) { return; }

        CookieManager manager = CookieManager.getInstance();

        for (String pair : cookieHeader.split(";")) {
            String trimmed = pair.trim();

            if (!trimmed.isEmpty()) { manager.setCookie(startUrl, trimmed + "; Path=/"); }
        }

        manager.flush();
    }


    private void buildWebView() {
        webView = new WebView(getContext());

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new Bridge(), "harvestBrowserBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                injectBridge();

                renderUrl();

                if (listener != null) { listener.onPageLoaded(url); }
            }

            @Override
            public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
                renderUrl();
                updateNavButtons();

                if (listener != null) { listener.onUrlChanged(url); }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl() != null ? request.getUrl().getScheme() : null;

                if (scheme == null) { return false; }

                String lower = scheme.toLowerCase();

                return !(lower.equals("http") || lower.equals("https") || lower.equals("about"));
            }
        });

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);

        webView.setLayoutParams(params);

        root.addView(webView);

        if (chrome.keepTopInset) {
            ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
                int topInset = insets.getInsets(
                        WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()).top;

                FrameLayout.LayoutParams current = (FrameLayout.LayoutParams) webView.getLayoutParams();

                if (current.topMargin != topInset) {
                    current.topMargin = topInset;
                    webView.setLayoutParams(current);
                }

                return insets;
            });

            ViewCompat.requestApplyInsets(root);
        }

        if (chrome.showUrlBar && chrome.collapseUrlBarOnScroll) {
            webView.setOnScrollChangeListener((view, scrollX, scrollY, oldScrollX, oldScrollY) -> {
                if (Math.abs(scrollY - oldScrollY) <= SCROLL_TOLERANCE_PX) { return; }

                collapseUrlToHost();
            });
        }
    }

    private void injectBridge() {
        webView.evaluateJavascript(
                "window.mobileApp = window.mobileApp || {};" +
                        "window.mobileApp.postMessage = function (payload) {" +
                        "  try { window.harvestBrowserBridge.postMessage(JSON.stringify(payload)); } catch (ignored) {}" +
                        "};" +
                        "window.mobileApp.close = function () {" +
                        "  try { window.harvestBrowserBridge.closeBrowser(); } catch (ignored) {}" +
                        "};",
                null);
    }

    private ImageButton makeIconButton(int drawableRes, View.OnClickListener action) {
        ImageButton button = new ImageButton(getContext());

        button.setImageResource(drawableRes);
        button.setBackgroundResource(android.R.color.transparent);

        int pad = dp(12);
        button.setPadding(pad, pad, pad, pad);

        TypedValue outValue = new TypedValue();
        getContext().getTheme().resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, outValue, true);
        button.setForeground(getContext().getDrawable(outValue.resourceId));

        button.setLayoutParams(new LinearLayout.LayoutParams(dp(44), dp(44)));
        button.setOnClickListener(action);

        return button;
    }

    private CardView makeGlassSurface(int radiusDp) {
        CardView card = new CardView(getContext());

        card.setRadius(dp(radiusDp));
        card.setCardElevation(dp(6));
        card.setUseCompatPadding(false);
        card.setCardBackgroundColor(Color.argb(235, 250, 250, 250));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            card.setOutlineAmbientShadowColor(Color.argb(60, 0, 0, 0));
        }

        return card;
    }

    private CardView makePill(java.util.List<ImageButton> buttons, int gravity) {
        if (buttons.isEmpty()) { return null; }

        LinearLayout row = new LinearLayout(getContext());
        row.setOrientation(LinearLayout.HORIZONTAL);

        int outerPad = dp(10);
        row.setPadding(outerPad, outerPad, outerPad, outerPad);

        for (ImageButton button : buttons) { row.addView(button); }

        CardView card = makeGlassSurface(26);
        card.addView(row);

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);

        params.gravity = Gravity.BOTTOM | gravity;
        params.setMargins(dp(12), 0, dp(12), dp(18));

        card.setLayoutParams(params);

        root.addView(card);

        return card;
    }

    private void buildActionBar() {
        java.util.List<ImageButton> navButtons = new java.util.ArrayList<>();
        java.util.List<ImageButton> actionButtons = new java.util.ArrayList<>();

        if (chrome.showBack) {
            backButton = makeIconButton(R.drawable.ic_nav_back, view -> { if (webView.canGoBack()) { webView.goBack(); } });
            navButtons.add(backButton);
        }

        if (chrome.showForward) {
            forwardButton = makeIconButton(R.drawable.ic_nav_forward, view -> { if (webView.canGoForward()) { webView.goForward(); } });
            navButtons.add(forwardButton);
        }

        if (chrome.showReload) { actionButtons.add(makeIconButton(R.drawable.ic_nav_reload, view -> webView.reload())); }

        if (chrome.showShare) { actionButtons.add(makeIconButton(R.drawable.ic_nav_share, view -> shareCurrentUrl())); }

        if (chrome.showClose) { actionButtons.add(makeIconButton(R.drawable.ic_nav_close, view -> closeFromChrome())); }

        navBar = makePill(navButtons, Gravity.START);
        actionBar = makePill(actionButtons, Gravity.END);

        updateNavButtons();
    }

    private void buildUrlChip() {
        if (!chrome.showUrlBar) { return; }

        urlChip = makeGlassSurface(18);

        urlLabel = new TextView(getContext());
        urlLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        urlLabel.setTextColor(Color.DKGRAY);
        urlLabel.setSingleLine(true);
        urlLabel.setEllipsize(android.text.TextUtils.TruncateAt.END);
        urlLabel.setPadding(dp(14), dp(8), dp(14), dp(8));

        urlChip.addView(urlLabel);

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);

        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.setMargins(dp(84), 0, dp(84), dp(31));

        urlChip.setLayoutParams(params);
        urlChip.setOnClickListener(view -> {
            isShowingFullUrl = !isShowingFullUrl;

            renderUrl();
        });

        root.addView(urlChip);
    }

    private void renderUrl() {
        if (urlLabel == null || webView == null) { return; }

        String current = webView.getUrl();

        if (current == null) { return; }

        if (isShowingFullUrl) {
            urlLabel.setText(current);
        } else {
            Uri parsed = Uri.parse(current);
            urlLabel.setText(parsed.getHost() != null ? parsed.getHost() : current);
        }
    }

    private void collapseUrlToHost() {
        if (urlChip == null || !isShowingFullUrl) { return; }

        isShowingFullUrl = false;

        renderUrl();
    }

    private void updateNavButtons() {
        if (backButton != null) {
            backButton.setEnabled(webView.canGoBack());
            backButton.setAlpha(webView.canGoBack() ? 1f : 0.35f);
        }

        if (forwardButton != null) {
            forwardButton.setEnabled(webView.canGoForward());
            forwardButton.setAlpha(webView.canGoForward() ? 1f : 0.35f);
        }
    }

    private void shareCurrentUrl() {
        String current = webView.getUrl();

        if (current == null) { return; }

        android.content.Intent shareIntent = new android.content.Intent(android.content.Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(android.content.Intent.EXTRA_TEXT, current);

        getContext().startActivity(android.content.Intent.createChooser(shareIntent, null));
    }

    private void closeFromChrome() {
        dismiss();

        if (listener != null) { listener.onBrowserClosed(); }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();

            return;
        }

        closeFromChrome();
    }

    public WebView getWebView() { return webView; }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, getContext().getResources().getDisplayMetrics());
    }

    private boolean isTrustedCaller() {
        String current = webView != null ? webView.getUrl() : null;

        if (current == null) { return false; }

        String host = Uri.parse(current).getHost();
        String expected = Uri.parse(startUrl).getHost();

        return host != null && host.equals(expected);
    }

    private class Bridge {
        @JavascriptInterface
        public void postMessage(String rawJson) {
            webView.post(() -> {
                if (isTrustedCaller() && listener != null) { listener.onMessage(rawJson); }
            });
        }

        @JavascriptInterface
        public void closeBrowser() {
            webView.post(() -> {
                if (isTrustedCaller()) { closeFromChrome(); }
            });
        }
    }
}

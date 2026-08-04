package com.harvestschools.app;

import android.webkit.CookieManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@CapacitorPlugin(name = "HarvestBrowser")
public class HarvestBrowserPlugin extends Plugin implements HarvestBrowserDialog.Listener {

    private HarvestBrowserDialog dialog;
    private boolean isPresented = false;

    private HarvestBrowserDialog.Chrome readChrome(PluginCall call) {
        HarvestBrowserDialog.Chrome chrome = new HarvestBrowserDialog.Chrome();

        chrome.showUrlBar = Boolean.TRUE.equals(call.getBoolean("showUrlBar", true));
        chrome.collapseUrlBarOnScroll = Boolean.TRUE.equals(call.getBoolean("collapseUrlBarOnScroll", true));
        chrome.showBack = Boolean.TRUE.equals(call.getBoolean("showBack", true));
        chrome.showForward = Boolean.TRUE.equals(call.getBoolean("showForward", false));
        chrome.showReload = Boolean.TRUE.equals(call.getBoolean("showReload", true));
        chrome.showShare = Boolean.TRUE.equals(call.getBoolean("showShare", false));
        chrome.showClose = Boolean.TRUE.equals(call.getBoolean("showClose", true));
        chrome.keepTopInset = Boolean.TRUE.equals(call.getBoolean("keepTopInset", true));

        return chrome;
    }

    private Map<String, String> readHeaders(PluginCall call) {
        Map<String, String> headers = new HashMap<>();
        JSObject provided = call.getObject("headers");

        if (provided != null) {
            Iterator<String> keys = provided.keys();

            while (keys.hasNext()) {
                String key = keys.next();
                String value = provided.getString(key);

                if (value != null) { headers.put(key, value); }
            }
        }

        return headers;
    }

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");

        if (url == null || url.isEmpty()) {
            call.reject("A url is required");

            return;
        }

        Map<String, String> headers = readHeaders(call);
        HarvestBrowserDialog.Chrome chrome = readChrome(call);
        boolean startHidden = Boolean.TRUE.equals(call.getBoolean("hidden", false));

        getActivity().runOnUiThread(() -> {
            dismissIfNeeded();

            dialog = new HarvestBrowserDialog(getActivity(), url, headers, chrome, this);

            if (startHidden) {
                dialog.create();
                isPresented = false;
            } else {
                dialog.show();
                isPresented = true;
            }

            call.resolve();
        });
    }

    private void dismissIfNeeded() {
        if (dialog != null) {
            try {
                dialog.dismiss();
            } catch (Exception ignored) {
                // Already gone.
            }
        }

        dialog = null;
        isPresented = false;
    }

    @PluginMethod
    public void close(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            dismissIfNeeded();

            notifyListeners("browserClosed", new JSObject());

            call.resolve();
        });
    }

    @PluginMethod
    public void show(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (dialog != null && !isPresented) {
                dialog.show();
                isPresented = true;
            }

            call.resolve();
        });
    }

    @PluginMethod
    public void hide(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (dialog != null && isPresented) {
                dialog.hide();
                isPresented = false;
            }

            call.resolve();
        });
    }

    @PluginMethod
    public void executeScript(PluginCall call) {
        String code = call.getString("code");

        if (code == null) {
            call.reject("code is required");

            return;
        }

        getActivity().runOnUiThread(() -> {
            if (dialog == null || dialog.getWebView() == null) {
                call.reject("No browser is open");

                return;
            }

            dialog.getWebView().evaluateJavascript(code, value -> call.resolve());
        });
    }

    @PluginMethod
    public void getCookies(PluginCall call) {
        String url = call.getString("url");

        JSObject result = new JSObject();

        if (url == null) {
            call.resolve(result);

            return;
        }

        String raw = CookieManager.getInstance().getCookie(url);

        if (raw != null) {
            for (String pair : raw.split(";")) {
                int separator = pair.indexOf('=');

                if (separator > 0) {
                    result.put(pair.substring(0, separator).trim(), pair.substring(separator + 1).trim());
                }
            }
        }

        call.resolve(result);
    }

    @PluginMethod
    public void clearCookies(PluginCall call) {
        String url = call.getString("url");
        CookieManager manager = CookieManager.getInstance();

        if (url == null) {
            manager.removeAllCookies(value -> call.resolve());

            return;
        }

        String raw = manager.getCookie(url);

        if (raw != null) {
            for (String pair : raw.split(";")) {
                int separator = pair.indexOf('=');

                if (separator > 0) {
                    String name = pair.substring(0, separator).trim();

                    manager.setCookie(url, name + "=; Max-Age=0; Path=/");
                }
            }
        }

        manager.flush();

        call.resolve();
    }

    @Override
    public void onBrowserClosed() {
        isPresented = false;
        dialog = null;

        notifyListeners("browserClosed", new JSObject());
    }

    @Override
    public void onPageLoaded(String url) {
        JSObject payload = new JSObject();
        payload.put("url", url);

        notifyListeners("browserPageLoaded", payload);
    }

    @Override
    public void onUrlChanged(String url) {
        JSObject payload = new JSObject();
        payload.put("url", url);

        notifyListeners("urlChange", payload);
    }

    @Override
    public void onMessage(String rawJson) {
        JSObject payload = new JSObject();

        try {
            payload.put("detail", JSObject.fromJSONObject(new JSONObject(rawJson)));
        } catch (Exception parseError) {
            payload.put("detail", new JSObject());
            payload.put("rawMessage", rawJson);
        }

        notifyListeners("messageFromWebview", payload);
    }
}

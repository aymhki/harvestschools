package com.harvestschools.app;

import android.view.View;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppChrome")
public class AppChromePlugin extends Plugin {

    private static final long VISIBILITY_ANIMATION_MS = 200L;

    @PluginMethod
    public void setNavigationBarVisible(PluginCall call) {
        boolean isVisible = Boolean.TRUE.equals(call.getBoolean("visible", true));

        View navigationBar = getActivity() instanceof MainActivity
            ? ((MainActivity) getActivity()).getFloatingNavBar()
            : null;

        JSObject result = new JSObject();

        if (navigationBar == null) {
            result.put("value", false);

            call.resolve(result);
        } else {
            getActivity().runOnUiThread(() -> {
                navigationBar.animate().alpha(isVisible ? 1f : 0f).setDuration(VISIBILITY_ANIMATION_MS).start();

                navigationBar.setEnabled(isVisible);
                navigationBar.setClickable(isVisible);
            });

            result.put("value", true);

            call.resolve(result);
        }
    }
}

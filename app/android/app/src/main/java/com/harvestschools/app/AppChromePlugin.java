package com.harvestschools.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppChrome")
public class AppChromePlugin extends Plugin {

    @PluginMethod
    public void setNavigationBarVisible(PluginCall call) {
        boolean isVisible = Boolean.TRUE.equals(call.getBoolean("visible", true));

        MainActivity activity = getActivity() instanceof MainActivity ? (MainActivity) getActivity() : null;

        JSObject result = new JSObject();

        if (activity == null) {
            result.put("value", false);

            call.resolve(result);
        } else {
            activity.runOnUiThread(() -> activity.setNavigationBarSuppressed(!isVisible));

            result.put("value", true);

            call.resolve(result);
        }
    }
}

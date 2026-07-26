package com.harvestschools.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HomeWidget")
public class HomeWidgetPlugin extends Plugin {

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("value", true);
        call.resolve(result);
    }

    @PluginMethod
    public void setQuickActions(PluginCall call) {
        String payload = call.getString("payload");

        if (payload == null || payload.isEmpty()) {
            call.reject("A payload is required");
        } else {
            HarvestWidgetStore.saveQuickActions(getContext(), payload);
            QuickActionsWidgetProvider.refreshAllWidgets(getContext());
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        }
    }
}

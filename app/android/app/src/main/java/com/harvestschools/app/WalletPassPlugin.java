package com.harvestschools.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.pay.Pay;
import com.google.android.gms.pay.PayApiAvailabilityStatus;
import com.google.android.gms.pay.PayClient;

@CapacitorPlugin(name = "WalletPass")
public class WalletPassPlugin extends Plugin {

    private static final int SAVE_PASS_REQUEST_CODE = 8410;

    private PayClient payClient;

    @Override
    public void load() {
        payClient = Pay.getClient(getActivity());
    }

    @PluginMethod
    public void canAddPasses(PluginCall call) {
        payClient
            .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
            .addOnSuccessListener(status -> resolveAvailability(call, status == PayApiAvailabilityStatus.AVAILABLE))
            .addOnFailureListener(error -> resolveAvailability(call, false));
    }

    @PluginMethod
    public void addPass(PluginCall call) {
        String token = call.getString("jwt");

        if (token == null || token.isEmpty()) {
            call.reject("A Google Wallet pass token is required");
        } else {
            getActivity()
                .runOnUiThread(() -> {
                    try {
                        payClient.savePassesJwt(token, getActivity(), SAVE_PASS_REQUEST_CODE);

                        JSObject result = new JSObject();

                        result.put("added", true);
                        result.put("presented", true);

                        call.resolve(result);
                    } catch (Exception saveError) {
                        call.reject("The Google Wallet sheet could not be opened", saveError);
                    }
                });
        }
    }

    private void resolveAvailability(PluginCall call, boolean isAvailable) {
        JSObject result = new JSObject();

        result.put("value", isAvailable);
        result.put("available", isAvailable);

        call.resolve(result);
    }
}

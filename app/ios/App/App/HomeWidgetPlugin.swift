import Foundation
import Capacitor
import WidgetKit

@objc(HomeWidgetPlugin)
public class HomeWidgetPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "HomeWidgetPlugin"

    public let jsName = "HomeWidget"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setQuickActions", returnType: CAPPluginReturnPromise)
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["value": UserDefaults(suiteName: harvestAppGroupIdentifier) != nil])
    }

    @objc func setQuickActions(_ call: CAPPluginCall) {
        guard let payload = call.getString("payload") else {
            call.reject("A payload is required")

            return
        }

        guard let sharedDefaults = UserDefaults(suiteName: harvestAppGroupIdentifier) else {
            call.reject("The shared app group is not available")

            return
        }

        sharedDefaults.set(payload, forKey: harvestQuickActionsKey)

        WidgetCenter.shared.reloadAllTimelines()

        call.resolve(["value": true])
    }
}

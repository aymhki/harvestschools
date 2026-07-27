import Foundation
import Capacitor
import UIKit

@objc(AppChromePlugin)
public class AppChromePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "AppChromePlugin"

    public let jsName = "AppChrome"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setNavigationBarVisible", returnType: CAPPluginReturnPromise)
    ]

    weak var navigationBar: FloatingNavBar?

    @objc func setNavigationBarVisible(_ call: CAPPluginCall) {
        let isVisible = call.getBool("visible", true)

        DispatchQueue.main.async { [weak self] in
            guard let navigationBar = self?.navigationBar else {
                call.resolve(["value": false])

                return
            }

            navigationBar.setSuppressed(!isVisible)

            call.resolve(["value": true])
        }
    }
}

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

    weak var navigationBar: UIView?

    @objc func setNavigationBarVisible(_ call: CAPPluginCall) {
        let isVisible = call.getBool("visible", true)

        DispatchQueue.main.async { [weak self] in
            guard let navigationBar = self?.navigationBar else {
                call.resolve(["value": false])

                return
            }

            UIView.animate(withDuration: 0.2) {
                navigationBar.alpha = isVisible ? 1 : 0
            }

            navigationBar.isUserInteractionEnabled = isVisible

            call.resolve(["value": true])
        }
    }
}

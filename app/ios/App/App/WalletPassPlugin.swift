import Foundation
import Capacitor
import PassKit

@objc(WalletPassPlugin)
public class WalletPassPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "WalletPassPlugin"

    public let jsName = "WalletPass"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "canAddPasses", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addPass", returnType: CAPPluginReturnPromise)
    ]

    @objc func canAddPasses(_ call: CAPPluginCall) {
        call.resolve([
            "value": PKAddPassesViewController.canAddPasses()
        ])
    }

    @objc func addPass(_ call: CAPPluginCall) {
        guard let base64 = call.getString("base64"), let passData = Data(base64Encoded: base64) else {
            call.reject("A base64 encoded pass is required")

            return
        }

        guard PKAddPassesViewController.canAddPasses() else {
            call.reject("This device cannot add passes to Apple Wallet")

            return
        }

        var pass: PKPass

        do {
            pass = try PKPass(data: passData)
        } catch {
            call.reject("The pass could not be read", nil, error)

            return
        }

        let library = PKPassLibrary()

        if library.containsPass(pass) {
            let existingPass = library.pass(
                withPassTypeIdentifier: pass.passTypeIdentifier,
                serialNumber: pass.serialNumber
            )

            guard let passURL = existingPass?.passURL else {
                call.resolve(["added": false, "alreadyInWallet": true, "opened": false])

                return
            }

            DispatchQueue.main.async {
                UIApplication.shared.open(passURL, options: [:]) { opened in
                    call.resolve(["added": false, "alreadyInWallet": true, "opened": opened])
                }
            }

            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let controller = PKAddPassesViewController(pass: pass),
                  let presenter = self.bridge?.viewController else {
                call.reject("The Apple Wallet sheet could not be presented")

                return
            }

            controller.delegate = self

            controller.modalPresentationStyle = .overFullScreen

            self.pendingCall = call

            presenter.present(controller, animated: true)
        }
    }

    private var pendingCall: CAPPluginCall?
}


extension WalletPassPlugin: PKAddPassesViewControllerDelegate {

    public func addPassesViewControllerDidFinish(_ controller: PKAddPassesViewController) {
        controller.dismiss(animated: true)

        pendingCall?.resolve(["added": true, "alreadyInWallet": false])

        pendingCall = nil
    }
}

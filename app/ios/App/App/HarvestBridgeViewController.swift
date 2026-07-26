import UIKit
import Capacitor
import WebKit

class HarvestBridgeViewController: CAPBridgeViewController {

    private var isRecoveringWebView = false

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        recoverWebViewIfBlank()
    }

    private func recoverWebViewIfBlank() {
        guard let webView = bridge?.webView, !isRecoveringWebView else {
            return
        }

        webView.evaluateJavaScript("document.body ? document.body.childElementCount : 0") { [weak self] result, error in
            let childCount = (result as? NSNumber)?.intValue ?? 0

            if error != nil || childCount == 0 {
                self?.reloadWebView(webView)
            }
        }
    }

    private func reloadWebView(_ webView: WKWebView) {
        isRecoveringWebView = true

        webView.reload()

        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            self?.isRecoveringWebView = false
        }
    }
}

import UIKit
import Capacitor
import WebKit

class HarvestBridgeViewController: CAPBridgeViewController {

    private var isReloadingWebView = false

    override func viewDidLoad() {
        super.viewDidLoad()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleApplicationDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        restoreWebViewRendering()
    }

    override func dismiss(animated flag: Bool, completion: (() -> Void)? = nil) {
        super.dismiss(animated: flag) { [weak self] in
            completion?()

            self?.restoreWebViewRendering()
        }
    }

    @objc private func handleApplicationDidBecomeActive() {
        restoreWebViewRendering()
    }

    private func restoreWebViewRendering() {
        guard let webView = bridge?.webView, webView.window != nil else {
            return
        }

        webView.isHidden = true

        DispatchQueue.main.async {
            webView.isHidden = false
            webView.setNeedsLayout()
            webView.layoutIfNeeded()

            self.reloadWebViewIfContentIsGone(webView)
        }
    }

    private func reloadWebViewIfContentIsGone(_ webView: WKWebView) {
        guard !isReloadingWebView else {
            return
        }

        webView.evaluateJavaScript("document.body ? document.body.childElementCount : 0") { [weak self] result, error in
            let childCount = (result as? NSNumber)?.intValue ?? 0

            if error != nil || childCount == 0 {
                self?.isReloadingWebView = true

                webView.reload()

                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    self?.isReloadingWebView = false
                }
            }
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

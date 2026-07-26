import UIKit
import Capacitor
import WebKit

class HarvestBridgeViewController: CAPBridgeViewController {

    private(set) var webViewContainer: UIView?

    private var isReloadingWebView = false

    override func viewDidLoad() {
        super.viewDidLoad()

        installStableWebViewContainer()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        repairWebViewLayoutIfNeeded()
    }

    /* UIKit routes dismissal to the presenting controller, so this covers the
     * camera, the wallet sheet and anything else presented over the app. */
    override func dismiss(animated flag: Bool, completion: (() -> Void)? = nil) {
        super.dismiss(animated: flag) { [weak self] in
            completion?()

            self?.repairWebViewLayoutIfNeeded()
        }
    }

    private func installStableWebViewContainer() {
        guard let webView = bridge?.webView, view === webView else {
            return
        }

        let container = UIView(frame: webView.frame)

        container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        container.backgroundColor = PullToRefreshController.siteBackgroundColor
        container.clipsToBounds = true

        view = container

        webView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(webView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: container.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor)
        ])

        webViewContainer = container
    }

    /* Cheap safety net: log the geometry, put the web view back if anything has
     * taken it out of the container, and reload only when the content process is
     * really gone. */
    private func repairWebViewLayoutIfNeeded() {
        guard let webView = bridge?.webView, let container = webViewContainer else {
            return
        }

        if webView.superview !== container {
            container.addSubview(webView)
        }

        container.setNeedsLayout()
        container.layoutIfNeeded()

        CAPLog.print(
            "[harvest] web view geometry container=\(container.bounds.size) web=\(webView.bounds.size)",
            "hidden=\(webView.isHidden) alpha=\(webView.alpha) window=\(webView.window != nil)",
            "offset=\(webView.scrollView.contentOffset) content=\(webView.scrollView.contentSize)"
        )

        reloadWebViewIfContentIsGone(webView)
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
}

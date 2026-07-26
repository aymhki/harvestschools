import Foundation
import WebKit

final class WebViewProcessRecovery: NSObject, WKNavigationDelegate {

    private weak var originalDelegate: WKNavigationDelegate?

    private weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
        self.originalDelegate = webView.navigationDelegate

        super.init()

        webView.navigationDelegate = self
    }

    override func responds(to aSelector: Selector!) -> Bool {
        return super.responds(to: aSelector) || (originalDelegate?.responds(to: aSelector) ?? false)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        return (originalDelegate?.responds(to: aSelector) ?? false) ? originalDelegate : super.forwardingTarget(for: aSelector)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        if (originalDelegate?.responds(to: #selector(webViewWebContentProcessDidTerminate(_:))) ?? false) {
            originalDelegate?.webViewWebContentProcessDidTerminate?(webView)
        }

        webView.reload()
    }
}

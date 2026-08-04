import Foundation
import Capacitor
import UIKit
import WebKit

@objc(HarvestBrowserPlugin)
public class HarvestBrowserPlugin: CAPPlugin, CAPBridgedPlugin, HarvestBrowserControllerDelegate {

    public let identifier = "HarvestBrowserPlugin"

    public let jsName = "HarvestBrowser"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "executeScript", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCookies", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearCookies", returnType: CAPPluginReturnPromise)
    ]

    private var controller: HarvestBrowserController?
    private var isPresented = false
    private var isVisible = false
    private var hiddenContainer: UIView?

    private func activeWindow() -> UIWindow? {
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }?
            .windows
            .first { $0.isKeyWindow }
    }

    private func attachWebViewToWindow(_ webView: WKWebView) -> Bool {
        guard let window = activeWindow() else { return false }

        let frame = CGRect(
            x: window.bounds.maxX + 2048,
            y: 0,
            width: max(window.bounds.width, 1),
            height: max(window.bounds.height, 1)
        )

        let container = hiddenContainer ?? UIView(frame: frame)

        container.frame = frame
        container.backgroundColor = .clear
        container.isOpaque = false
        container.isUserInteractionEnabled = false
        container.clipsToBounds = true
        container.accessibilityElementsHidden = true

        if container.superview !== window {
            container.removeFromSuperview()
            window.addSubview(container)
        }

        hiddenContainer = container

        webView.removeFromSuperview()
        webView.translatesAutoresizingMaskIntoConstraints = true
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.frame = container.bounds
        webView.isUserInteractionEnabled = false

        container.addSubview(webView)

        return true
    }

    private func releaseHiddenContainer() {
        hiddenContainer?.removeFromSuperview()
        hiddenContainer = nil
    }

    private func readChrome(from call: CAPPluginCall) -> HarvestBrowserChrome {
        var chrome = HarvestBrowserChrome()

        chrome.showUrlBar = call.getBool("showUrlBar", true)
        chrome.collapseUrlBarOnScroll = call.getBool("collapseUrlBarOnScroll", true)
        chrome.showBack = call.getBool("showBack", true)
        chrome.showForward = call.getBool("showForward", false)
        chrome.showReload = call.getBool("showReload", true)
        chrome.showShare = call.getBool("showShare", false)
        chrome.showClose = call.getBool("showClose", true)
        chrome.keepTopInset = call.getBool("keepTopInset", true)

        return chrome
    }

    @objc func open(_ call: CAPPluginCall) {
        guard let address = call.getString("url"), let url = URL(string: address) else {
            call.reject("A url is required")

            return
        }

        var headers: [String: String] = [:]

        call.getObject("headers")?.forEach { key, value in
            if let text = value as? String { headers[key] = text }
        }
        let startHidden = call.getBool("hidden", false)
        let chrome = readChrome(from: call)

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.dismissIfNeeded {
                let created = HarvestBrowserController(url: url, headers: headers, chrome: chrome)
                created.delegate = self

                self.controller = created

                created.loadViewIfNeeded()

                if startHidden {
                    self.isPresented = false
                    self.isVisible = false

                    if self.attachWebViewToWindow(created.webView) {
                        call.resolve()
                    } else {
                        call.reject("No active window to load in")
                    }

                    return
                }

                self.presentController(created) { call.resolve() }
            }
        }
    }

    private func presentController(_ created: HarvestBrowserController, completion: @escaping () -> Void) {
        guard let presenter = bridge?.viewController else {
            completion()

            return
        }

        created.loadViewIfNeeded()

        releaseHiddenContainer()
        created.reattachWebView()

        isPresented = true
        isVisible = true

        created.modalPresentationStyle = .fullScreen
        created.view.alpha = 1
        created.view.isUserInteractionEnabled = true

        presenter.present(created, animated: true) { completion() }
    }

    private func dismissIfNeeded(completion: (() -> Void)? = nil) {
        let wasPresented = isPresented
        let existing = controller

        isPresented = false
        isVisible = false
        controller = nil

        releaseHiddenContainer()

        guard wasPresented, let existing = existing else {
            completion?()

            return
        }

        existing.dismiss(animated: false) { completion?() }
    }

    @objc func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.dismissIfNeeded {
                self?.notifyListeners("browserClosed", data: [:])

                call.resolve()
            }
        }
    }

    @objc func show(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let created = self.controller else {
                call.resolve()

                return
            }

            if self.isPresented {
                self.isVisible = true

                call.resolve()

                return
            }

            self.presentController(created) { call.resolve() }
        }
    }

    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let created = self.controller else {
                call.resolve()

                return
            }

            self.isVisible = false

            let park = {
                _ = self.attachWebViewToWindow(created.webView)

                call.resolve()
            }

            if self.isPresented {
                self.isPresented = false

                created.dismiss(animated: false) { park() }
            } else {
                park()
            }
        }
    }

    @objc func executeScript(_ call: CAPPluginCall) {
        guard let code = call.getString("code") else {
            call.reject("code is required")

            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.controller?.webView else {
                call.reject("No browser is open")

                return
            }

            webView.evaluateJavaScript(code) { _, error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func getCookies(_ call: CAPPluginCall) {
        guard let address = call.getString("url"), let url = URL(string: address) else {
            call.reject("A url is required")

            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.controller?.webView else {
                call.resolve([:])

                return
            }

            webView.configuration.websiteDataStore.httpCookieStore.getAllCookies { cookies in
                var jar: [String: String] = [:]

                cookies.forEach { cookie in
                    if let host = url.host, host.hasSuffix(cookie.domain) || cookie.domain.hasSuffix(host) {
                        jar[cookie.name] = cookie.value
                    }
                }

                call.resolve(jar)
            }
        }
    }

    @objc func clearCookies(_ call: CAPPluginCall) {
        let address = call.getString("url")

        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.controller?.webView else {
                call.resolve()

                return
            }

            let store = webView.configuration.websiteDataStore.httpCookieStore

            store.getAllCookies { cookies in
                let host = address.flatMap { URL(string: $0)?.host }

                let group = DispatchGroup()

                cookies.forEach { cookie in
                    let matches = host == nil || host!.hasSuffix(cookie.domain) || cookie.domain.hasSuffix(host!)

                    if matches {
                        group.enter()

                        store.delete(cookie) { group.leave() }
                    }
                }

                group.notify(queue: .main) { call.resolve() }
            }
        }
    }

    func harvestBrowserDidClose() {
        isPresented = false
        isVisible = false

        releaseHiddenContainer()

        controller = nil

        notifyListeners("browserClosed", data: [:])
    }

    func harvestBrowserDidLoadPage(url: String) {
        notifyListeners("browserPageLoaded", data: ["url": url])
    }

    func harvestBrowserDidChangeUrl(url: String) {
        notifyListeners("urlChange", data: ["url": url])
    }

    func harvestBrowserDidReceiveMessage(_ detail: [String: Any]) {
        notifyListeners("messageFromWebview", data: ["detail": detail])
    }
}

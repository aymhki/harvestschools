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

            self.dismissIfNeeded()

            let created = HarvestBrowserController(url: url, headers: headers, chrome: chrome)
            created.delegate = self

            self.presentController(created, invisible: startHidden) { call.resolve() }
        }
    }

    private func presentController(_ created: HarvestBrowserController, invisible: Bool = false, completion: @escaping () -> Void) {
        guard let presenter = bridge?.viewController else {
            completion()

            return
        }

        isPresented = true
        isVisible = !invisible

        created.modalPresentationStyle = .overFullScreen
        created.loadViewIfNeeded()
        created.view.alpha = invisible ? 0 : 1
        created.view.isUserInteractionEnabled = !invisible

        presenter.present(created, animated: !invisible) { completion() }
    }

    private func dismissIfNeeded(completion: (() -> Void)? = nil) {
        let wasPresented = isPresented
        let existing = controller

        isPresented = false
        isVisible = false
        controller = nil

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

            if !self.isPresented {
                self.presentController(created) { call.resolve() }

                return
            }

            self.isVisible = true

            created.view.isUserInteractionEnabled = true

            UIView.animate(withDuration: 0.25, animations: { created.view.alpha = 1 }) { _ in call.resolve() }
        }
    }

    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let created = self.controller, self.isPresented else {
                call.resolve()

                return
            }

            self.isVisible = false

            created.view.alpha = 0
            created.view.isUserInteractionEnabled = false

            call.resolve()
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

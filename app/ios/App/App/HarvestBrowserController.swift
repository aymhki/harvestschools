import UIKit
import WebKit

struct HarvestBrowserChrome {
    var showUrlBar = true
    var collapseUrlBarOnScroll = true
    var showBack = true
    var showForward = false
    var showReload = true
    var showShare = false
    var showClose = true
    var keepTopInset = true
}

protocol HarvestBrowserControllerDelegate: AnyObject {
    func harvestBrowserDidClose()
    func harvestBrowserDidLoadPage(url: String)
    func harvestBrowserDidChangeUrl(url: String)
    func harvestBrowserDidReceiveMessage(_ detail: [String: Any])
}

final class HarvestBrowserController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {

    private let startUrl: URL
    private let startHeaders: [String: String]
    private let chrome: HarvestBrowserChrome

    weak var delegate: HarvestBrowserControllerDelegate?

    private(set) var webView: WKWebView!

    private let navBar = UIVisualEffectView(effect: nil)
    private let actionBar = UIVisualEffectView(effect: nil)
    private let urlChip = UIVisualEffectView(effect: nil)
    private let urlLabel = UILabel()

    private let backButton = UIButton(type: .system)
    private let forwardButton = UIButton(type: .system)
    private let reloadButton = UIButton(type: .system)
    private let shareButton = UIButton(type: .system)
    private let closeButton = UIButton(type: .system)

    private var backObservation: NSKeyValueObservation?
    private var forwardObservation: NSKeyValueObservation?
    private var urlObservation: NSKeyValueObservation?
    private var scrollObservation: NSKeyValueObservation?
    private var webViewConstraints: [NSLayoutConstraint] = []

    private var isShowingFullUrl = false
    private var lastScrollOffset: CGFloat = 0
    private let scrollTolerance: CGFloat = 12

    private let messageHandlerName = "harvestBrowser"

    init(url: URL, headers: [String: String], chrome: HarvestBrowserChrome) {
        self.startUrl = url
        self.startHeaders = headers
        self.chrome = chrome
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    deinit {
        backObservation?.invalidate()
        forwardObservation?.invalidate()
        urlObservation?.invalidate()
        scrollObservation?.invalidate()
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: messageHandlerName)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .systemBackground

        buildWebView()
        buildActionBar()
        buildUrlChip()
        observeWebViewState()

        installSessionCookiesThenLoad()
    }

    private func installSessionCookiesThenLoad() {
        var request = URLRequest(url: startUrl)

        startHeaders.forEach { key, value in
            if key.lowercased() != "cookie" { request.setValue(value, forHTTPHeaderField: key) }
        }

        let cookieHeader = startHeaders.first { $0.key.lowercased() == "cookie" }?.value

        guard let cookieHeader = cookieHeader, let host = startUrl.host else {
            webView.load(request)

            return
        }

        let store = webView.configuration.websiteDataStore.httpCookieStore
        let group = DispatchGroup()

        cookieHeader.split(separator: ";").forEach { pair in
            let parts = pair.split(separator: "=", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }

            guard parts.count == 2, !parts[0].isEmpty else { return }

            let properties: [HTTPCookiePropertyKey: Any] = [
                .name: parts[0],
                .value: parts[1],
                .domain: host,
                .path: "/",
                .secure: startUrl.scheme == "https"
            ]

            guard let cookie = HTTPCookie(properties: properties) else { return }

            group.enter()

            store.setCookie(cookie) { group.leave() }
        }

        group.notify(queue: .main) { [weak self] in
            self?.webView.load(request)
        }
    }

    private func buildWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.userContentController.add(self, name: messageHandlerName)
        configuration.userContentController.addUserScript(Self.makeBridgeScript())

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.allowsBackForwardNavigationGestures = true
        webView.navigationDelegate = self
        webView.scrollView.delegate = nil

        view.addSubview(webView)

        activateWebViewConstraints()

        scrollObservation = webView.scrollView.observe(\.contentOffset, options: [.new]) { [weak self] scrollView, _ in
            guard let self = self, self.chrome.showUrlBar, self.chrome.collapseUrlBarOnScroll else { return }

            let offset = scrollView.contentOffset.y

            guard abs(offset - self.lastScrollOffset) > self.scrollTolerance else { return }

            let isScrollingDown = offset > self.lastScrollOffset

            self.lastScrollOffset = offset

            self.collapseUrlToHost()
        }
    }

    private func activateWebViewConstraints() {
        let topAnchorToUse = chrome.keepTopInset ? view.safeAreaLayoutGuide.topAnchor : view.topAnchor

        webViewConstraints = [
            webView.topAnchor.constraint(equalTo: topAnchorToUse),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ]

        NSLayoutConstraint.activate(webViewConstraints)
    }

    func detachWebViewForParking() {
        NSLayoutConstraint.deactivate(webViewConstraints)

        webViewConstraints = []
    }

    func reattachWebView() {
        guard webView.superview !== view else { return }

        NSLayoutConstraint.deactivate(webViewConstraints)

        webView.removeFromSuperview()
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isUserInteractionEnabled = true

        view.insertSubview(webView, at: 0)

        activateWebViewConstraints()

        view.setNeedsLayout()
    }


    private static func makeGlass(interactive: Bool) -> UIVisualEffect {
        if #available(iOS 26.0, *) {
            let glass = UIGlassEffect()
            glass.isInteractive = interactive
            return glass
        }

        return UIBlurEffect(style: .systemThinMaterial)
    }

    private static func makeBridgeScript() -> WKUserScript {
        let source = """
        window.mobileApp = window.mobileApp || {};
        window.mobileApp.postMessage = function (payload) {
            try { window.webkit.messageHandlers.harvestBrowser.postMessage(payload); } catch (ignored) {}
        };
        window.mobileApp.close = function () {
            try { window.webkit.messageHandlers.harvestBrowser.postMessage({ __harvestClose: true }); } catch (ignored) {}
        };
        """

        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    }

    private func styledButton(_ button: UIButton, systemName: String, action: Selector) -> UIButton {
        let configuration = UIImage.SymbolConfiguration(pointSize: 17, weight: .semibold)

        button.setImage(UIImage(systemName: systemName, withConfiguration: configuration), for: .normal)
        button.tintColor = .label
        button.addTarget(self, action: action, for: .touchUpInside)
        button.widthAnchor.constraint(equalToConstant: 44).isActive = true
        button.heightAnchor.constraint(equalToConstant: 44).isActive = true

        return button
    }

    private func makePill(_ effectView: UIVisualEffectView, buttons: [UIButton]) -> UIVisualEffectView? {
        guard !buttons.isEmpty else { return nil }

        effectView.effect = Self.makeGlass(interactive: true)
        effectView.translatesAutoresizingMaskIntoConstraints = false
        effectView.layer.cornerRadius = 26
        effectView.clipsToBounds = true

        let stack = UIStackView(arrangedSubviews: buttons)
        stack.axis = .horizontal
        stack.distribution = .fillEqually
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false

        effectView.contentView.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: effectView.contentView.topAnchor),
            stack.bottomAnchor.constraint(equalTo: effectView.contentView.bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: effectView.contentView.leadingAnchor, constant: 6),
            stack.trailingAnchor.constraint(equalTo: effectView.contentView.trailingAnchor, constant: -6),
            effectView.heightAnchor.constraint(equalToConstant: 52)
        ])

        return effectView
    }

    private func buildActionBar() {
        var navButtons: [UIButton] = []
        var actionButtons: [UIButton] = []

        if chrome.showBack { navButtons.append(styledButton(backButton, systemName: "chevron.left", action: #selector(handleBack))) }
        if chrome.showForward { navButtons.append(styledButton(forwardButton, systemName: "chevron.right", action: #selector(handleForward))) }

        if chrome.showReload { actionButtons.append(styledButton(reloadButton, systemName: "arrow.clockwise", action: #selector(handleReload))) }
        if chrome.showShare { actionButtons.append(styledButton(shareButton, systemName: "square.and.arrow.up", action: #selector(handleShare))) }
        if chrome.showClose { actionButtons.append(styledButton(closeButton, systemName: "xmark", action: #selector(handleClose))) }

        let bottom = view.safeAreaLayoutGuide.bottomAnchor

        if let pill = makePill(navBar, buttons: navButtons) {
            view.addSubview(pill)

            NSLayoutConstraint.activate([
                pill.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 12),
                pill.bottomAnchor.constraint(equalTo: bottom, constant: -4)
            ])
        }

        if let pill = makePill(actionBar, buttons: actionButtons) {
            view.addSubview(pill)

            NSLayoutConstraint.activate([
                pill.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -12),
                pill.bottomAnchor.constraint(equalTo: bottom, constant: -4)
            ])
        }
    }

    private func buildUrlChip() {
        guard chrome.showUrlBar else { return }

        urlChip.effect = Self.makeGlass(interactive: true)
        urlChip.translatesAutoresizingMaskIntoConstraints = false
        urlChip.layer.cornerRadius = 18
        urlChip.clipsToBounds = true

        urlLabel.font = .systemFont(ofSize: 13, weight: .medium)
        urlLabel.textColor = .label
        urlLabel.textAlignment = .center
        urlLabel.lineBreakMode = .byTruncatingTail
        urlLabel.translatesAutoresizingMaskIntoConstraints = false

        urlChip.contentView.addSubview(urlLabel)
        view.addSubview(urlChip)

        NSLayoutConstraint.activate([
            urlChip.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            urlChip.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -64),
            urlChip.heightAnchor.constraint(equalToConstant: 36),
            urlChip.widthAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.widthAnchor, multiplier: 0.9),
            urlLabel.topAnchor.constraint(equalTo: urlChip.contentView.topAnchor),
            urlLabel.bottomAnchor.constraint(equalTo: urlChip.contentView.bottomAnchor),
            urlLabel.leadingAnchor.constraint(equalTo: urlChip.contentView.leadingAnchor, constant: 14),
            urlLabel.trailingAnchor.constraint(equalTo: urlChip.contentView.trailingAnchor, constant: -14)
        ])

        urlChip.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(handleUrlChipTap)))
        urlChip.isUserInteractionEnabled = true

        renderUrl()
    }

    private func renderUrl() {
        guard chrome.showUrlBar, let current = webView.url else { return }

        urlLabel.text = isShowingFullUrl ? current.absoluteString : (current.host ?? current.absoluteString)
    }

    private func collapseUrlToHost() {
        guard chrome.showUrlBar, isShowingFullUrl else { return }

        isShowingFullUrl = false

        UIView.transition(with: urlLabel, duration: 0.2, options: [.transitionCrossDissolve]) {
            self.renderUrl()
        }
    }

    private func observeWebViewState() {
        backObservation = webView.observe(\.canGoBack, options: [.new, .initial]) { [weak self] _, change in
            let enabled = change.newValue ?? false

            DispatchQueue.main.async {
                self?.backButton.isEnabled = enabled
                self?.backButton.alpha = enabled ? 1 : 0.35
            }
        }

        forwardObservation = webView.observe(\.canGoForward, options: [.new, .initial]) { [weak self] _, change in
            let enabled = change.newValue ?? false

            DispatchQueue.main.async {
                self?.forwardButton.isEnabled = enabled
                self?.forwardButton.alpha = enabled ? 1 : 0.35
            }
        }

        urlObservation = webView.observe(\.url, options: [.new]) { [weak self] webView, _ in
            DispatchQueue.main.async {
                self?.renderUrl()

                if let address = webView.url?.absoluteString {
                    self?.delegate?.harvestBrowserDidChangeUrl(url: address)
                }
            }
        }
    }

    @objc private func handleBack() { if webView.canGoBack { webView.goBack() } }

    @objc private func handleForward() { if webView.canGoForward { webView.goForward() } }

    @objc private func handleReload() { webView.reload() }

    @objc private func handleShare() {
        guard let current = webView.url else { return }

        let activity = UIActivityViewController(activityItems: [current], applicationActivities: nil)

        if let popover = activity.popoverPresentationController {
            popover.sourceView = shareButton
            popover.sourceRect = shareButton.bounds
        }

        present(activity, animated: true)
    }

    @objc private func handleClose() {
        dismiss(animated: true) { [weak self] in
            self?.delegate?.harvestBrowserDidClose()
        }
    }

    @objc private func handleUrlChipTap() {
        isShowingFullUrl.toggle()

        UIView.transition(with: urlLabel, duration: 0.2, options: [.transitionCrossDissolve]) {
            self.renderUrl()
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        renderUrl()

        delegate?.harvestBrowserDidLoadPage(url: webView.url?.absoluteString ?? "")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let scheme = navigationAction.request.url?.scheme?.lowercased() else {
            decisionHandler(.allow)

            return
        }

        decisionHandler(scheme == "http" || scheme == "https" || scheme == "about" ? .allow : .cancel)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == messageHandlerName, message.frameInfo.isMainFrame else { return }

        guard message.frameInfo.securityOrigin.host == startUrl.host else { return }

        if let payload = message.body as? [String: Any] {
            if payload["__harvestClose"] as? Bool == true {
                handleClose()

                return
            }

            delegate?.harvestBrowserDidReceiveMessage(payload)
        }
    }
}

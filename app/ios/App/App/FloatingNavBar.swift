import UIKit
import WebKit

final class FloatingNavBar: UIView, WKScriptMessageHandler {

    private weak var webView: WKWebView?
    private weak var presenter: UIViewController?

    private var backObservation: NSKeyValueObservation?
    private var forwardObservation: NSKeyValueObservation?
    private var scrollObservation: NSKeyValueObservation?

    private var revealWorkItem: DispatchWorkItem?
    private var isBarHidden = false
    private var isSuppressed = false
    private let revealDelay: TimeInterval = 1.2
    private let scrollTolerance: CGFloat = 6

    private var lastScrollOffset: CGFloat = 0
    private var ignoreScrollUntil: Date = .distantPast
    private let scrollSettleWindow: TimeInterval = 0.4

    private let backButton = UIButton(type: .system)
    private let forwardButton = UIButton(type: .system)
    private let shareButton = UIButton(type: .system)
    private let homeButton = UIButton(type: .system)


    private var currentShareURL = URL(string: "https://harvestschools.com")!

    init(webView: WKWebView, presenter: UIViewController) {
        self.webView = webView
        self.presenter = presenter
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        buildUI()
        observeWebViewState()
        observeScrolling(on: webView)
        webView.configuration.userContentController.add(self, name: "nativeShareUrl")
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    deinit {
        backObservation?.invalidate()
        forwardObservation?.invalidate()
        scrollObservation?.invalidate()
        revealWorkItem?.cancel()
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "nativeShareUrl")
    }


    private func observeScrolling(on webView: WKWebView) {
        lastScrollOffset = webView.scrollView.contentOffset.y

        scrollObservation = webView.scrollView.observe(\.contentOffset, options: [.new]) { [weak self] scrollView, _ in
            guard let self = self else { return }

            let offset = scrollView.contentOffset.y

            guard Date() >= self.ignoreScrollUntil else {
                self.lastScrollOffset = offset

                return
            }

            if abs(offset - self.lastScrollOffset) > self.scrollTolerance {
                self.lastScrollOffset = offset

                self.setBarHidden(true)
                self.scheduleReveal()
            }
        }
    }

    func setSuppressed(_ suppressed: Bool) {
        isSuppressed = suppressed

        revealWorkItem?.cancel()

        isUserInteractionEnabled = !suppressed

        if !suppressed {
            ignoreScrollUntil = Date().addingTimeInterval(scrollSettleWindow)

            lastScrollOffset = webView?.scrollView.contentOffset.y ?? lastScrollOffset
        }

        setBarHidden(suppressed)
    }

    private func scheduleReveal() {
        revealWorkItem?.cancel()

        let workItem = DispatchWorkItem { [weak self] in
            self?.setBarHidden(false)
        }

        revealWorkItem = workItem

        DispatchQueue.main.asyncAfter(deadline: .now() + revealDelay, execute: workItem)
    }

    private func setBarHidden(_ hidden: Bool) {
        guard !isSuppressed || hidden else { return }

        guard hidden != isBarHidden else { return }

        isBarHidden = hidden

        UIView.animate(withDuration: 0.22, delay: 0, options: [.beginFromCurrentState, .curveEaseOut]) {
            self.alpha = hidden ? 0 : 1
            self.transform = hidden ? CGAffineTransform(translationX: 0, y: 24) : .identity
        }
    }


    private func buildUI() {
        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)

        backButton.setImage(UIImage(systemName: "chevron.left", withConfiguration: config), for: .normal)
        forwardButton.setImage(UIImage(systemName: "chevron.right", withConfiguration: config), for: .normal)
        homeButton.setImage(UIImage(systemName: "house", withConfiguration: config), for: .normal)
        shareButton.setImage(UIImage(systemName: "square.and.arrow.up", withConfiguration: config), for: .normal)

        [backButton, forwardButton, homeButton, shareButton].forEach { $0.tintColor = .label }

        backButton.addTarget(self, action: #selector(handleBack), for: .touchUpInside)
        forwardButton.addTarget(self, action: #selector(handleForward), for: .touchUpInside)
        homeButton.addTarget(self, action: #selector(handleHome), for: .touchUpInside)
        shareButton.addTarget(self, action: #selector(handleShare), for: .touchUpInside)

        let navigationPill = makePill(with: [backButton, forwardButton])
        let actionPill = makePill(with: [homeButton, shareButton])

        addSubview(navigationPill)
        addSubview(actionPill)

        NSLayoutConstraint.activate([
            navigationPill.leadingAnchor.constraint(equalTo: leadingAnchor),
            navigationPill.topAnchor.constraint(equalTo: topAnchor),
            navigationPill.bottomAnchor.constraint(equalTo: bottomAnchor),
            navigationPill.widthAnchor.constraint(equalToConstant: 126),

            actionPill.trailingAnchor.constraint(equalTo: trailingAnchor),
            actionPill.topAnchor.constraint(equalTo: topAnchor),
            actionPill.bottomAnchor.constraint(equalTo: bottomAnchor),
            actionPill.widthAnchor.constraint(equalToConstant: 126),

            heightAnchor.constraint(equalToConstant: 52)
        ])
    }

    private func makePill(with buttons: [UIButton]) -> UIVisualEffectView {
        let effectView = Self.makeGlassBackground()

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
            stack.trailingAnchor.constraint(equalTo: effectView.contentView.trailingAnchor, constant: -6)
        ])

        return effectView
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)

        return hit === self ? nil : hit
    }

    private static func makeGlassBackground() -> UIVisualEffectView {
        if #available(iOS 26.0, *) {
            let glass = UIGlassEffect()
            glass.isInteractive = true
            return UIVisualEffectView(effect: glass)
        }
        return UIVisualEffectView(effect: UIBlurEffect(style: .systemMaterial))
    }

    private func observeWebViewState() {
        guard let webView else { return }
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
    }

    @objc private func handleBack() { webView?.goBack() }
    @objc private func handleForward() { webView?.goForward() }

    @objc private func handleHome() {
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('harvestNavigateHome'))")
    }

    @objc private func handleShare() {
        let activityVC = UIActivityViewController(activityItems: [currentShareURL], applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = shareButton
            popover.sourceRect = shareButton.bounds
        }
        presenter?.present(activityVC, animated: true)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "nativeShareUrl",
              let urlString = message.body as? String,
              let url = URL(string: urlString) else { return }
        currentShareURL = url
    }
}

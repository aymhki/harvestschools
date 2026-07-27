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

    private let backButton = UIButton(type: .system)
    private let forwardButton = UIButton(type: .system)
    private let shareButton = UIButton(type: .system)


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
        var lastOffset = webView.scrollView.contentOffset.y

        scrollObservation = webView.scrollView.observe(\.contentOffset, options: [.new]) { [weak self] scrollView, _ in
            guard let self = self else { return }

            let offset = scrollView.contentOffset.y

            if abs(offset - lastOffset) > self.scrollTolerance {
                lastOffset = offset

                self.setBarHidden(true)
                self.scheduleReveal()
            }
        }
    }

    func setSuppressed(_ suppressed: Bool) {
        isSuppressed = suppressed

        revealWorkItem?.cancel()

        isUserInteractionEnabled = !suppressed

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
        let effectView = Self.makeGlassBackground()
        effectView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(effectView)
        NSLayoutConstraint.activate([
            effectView.topAnchor.constraint(equalTo: topAnchor),
            effectView.bottomAnchor.constraint(equalTo: bottomAnchor),
            effectView.leadingAnchor.constraint(equalTo: leadingAnchor),
            effectView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])

        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        backButton.setImage(UIImage(systemName: "chevron.left", withConfiguration: config), for: .normal)
        forwardButton.setImage(UIImage(systemName: "chevron.right", withConfiguration: config), for: .normal)
        shareButton.setImage(UIImage(systemName: "square.and.arrow.up", withConfiguration: config), for: .normal)
        [backButton, forwardButton, shareButton].forEach { $0.tintColor = .label }

        backButton.addTarget(self, action: #selector(handleBack), for: .touchUpInside)
        forwardButton.addTarget(self, action: #selector(handleForward), for: .touchUpInside)
        shareButton.addTarget(self, action: #selector(handleShare), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [backButton, forwardButton, shareButton])
        stack.axis = .horizontal
        stack.distribution = .fillEqually
        stack.translatesAutoresizingMaskIntoConstraints = false
        effectView.contentView.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: effectView.contentView.topAnchor),
            stack.bottomAnchor.constraint(equalTo: effectView.contentView.bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: effectView.contentView.leadingAnchor, constant: 6),
            stack.trailingAnchor.constraint(equalTo: effectView.contentView.trailingAnchor, constant: -6),
            widthAnchor.constraint(equalToConstant: 156),
            heightAnchor.constraint(equalToConstant: 52)
        ])

        layer.cornerRadius = 26
        clipsToBounds = true
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

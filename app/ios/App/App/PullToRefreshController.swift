import UIKit
import WebKit

final class PullToRefreshController: NSObject {

    private weak var webView: WKWebView?
    private let refreshControl = UIRefreshControl()
    private let impactGenerator = UIImpactFeedbackGenerator(style: .light)

    private var isRefreshing = false
    private var refreshStartTime: Date?
    private let minimumRefreshDuration: TimeInterval = 0.7

    private var loadingObservation: NSKeyValueObservation?
    private var safeAreaSentinel: SafeAreaSentinelView?
    private var safeAreaTop: CGFloat = 0

    init(webView: WKWebView, containerView: UIView) {
        self.webView = webView
        super.init()

        applySiteColors(to: webView)
        installRefreshControl(on: webView)
        installSafeAreaTracking(in: containerView)
        observeLoadingState(webView: webView)
    }

    deinit {
        loadingObservation?.invalidate()
    }


    private static var siteBackgroundColor: UIColor {
        UIColor { $0.userInterfaceStyle == .dark
            ? UIColor(red: 0x24/255, green: 0x24/255, blue: 0x24/255, alpha: 1)
            : .white
        }
    }

    private func applySiteColors(to webView: WKWebView) {
        let color = Self.siteBackgroundColor
        webView.isOpaque = true
        webView.backgroundColor = color
        webView.scrollView.backgroundColor = color
        webView.underPageBackgroundColor = color
    }

    private func installRefreshControl(on webView: WKWebView) {
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = true
        webView.scrollView.alwaysBounceVertical = true
        refreshControl.tintColor = .label
        refreshControl.addTarget(self, action: #selector(handleRefreshTriggered), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
    }

    @objc private func handleRefreshTriggered() {
        guard let webView, !isRefreshing else { return }
        isRefreshing = true
        refreshStartTime = Date()
        impactGenerator.impactOccurred()
        webView.reload()
    }

    private func observeLoadingState(webView: WKWebView) {
        loadingObservation = webView.observe(\.isLoading, options: [.new]) { [weak self] _, change in
            guard let self, self.isRefreshing, change.newValue == false else { return }
            self.scheduleEndRefreshing()
        }
    }

    private func scheduleEndRefreshing() {
        let elapsed = Date().timeIntervalSince(refreshStartTime ?? Date())
        let remaining = minimumRefreshDuration - elapsed
        let finish = { [weak self] in
            self?.isRefreshing = false
            self?.refreshControl.endRefreshing()
        }
        if remaining <= 0 {
            finish()
        } else {
            DispatchQueue.main.asyncAfter(deadline: .now() + remaining) { finish() }
        }
    }


    private func installSafeAreaTracking(in containerView: UIView) {
        let sentinel = SafeAreaSentinelView()
        sentinel.translatesAutoresizingMaskIntoConstraints = false
        sentinel.isUserInteractionEnabled = false
        sentinel.backgroundColor = .clear
        containerView.insertSubview(sentinel, at: 0)
        NSLayoutConstraint.activate([
            sentinel.topAnchor.constraint(equalTo: containerView.topAnchor),
            sentinel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            sentinel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            sentinel.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
        ])
        sentinel.onSafeAreaChange = { [weak self] insets in
            self?.applySafeAreaInset(insets.top)
        }
        safeAreaSentinel = sentinel

        containerView.layoutIfNeeded()
        applySafeAreaInset(containerView.safeAreaInsets.top)
    }

    private func applySafeAreaInset(_ topInset: CGFloat) {
        guard let webView, topInset != safeAreaTop else { return }
        let scrollView = webView.scrollView
        let wasAtTop = scrollView.contentOffset.y <= -safeAreaTop + 1
        safeAreaTop = topInset
        scrollView.contentInset.top = topInset
        scrollView.verticalScrollIndicatorInsets.top = topInset
        if wasAtTop {
            scrollView.contentOffset = CGPoint(x: 0, y: -topInset)
        }
    }
}


private final class SafeAreaSentinelView: UIView {
    var onSafeAreaChange: ((UIEdgeInsets) -> Void)?
    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        onSafeAreaChange?(safeAreaInsets)
    }
}

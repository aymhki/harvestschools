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

    @MainActor
    init(webView: WKWebView, containerView: UIView) {
        self.webView = webView
        super.init()

//         applySiteColors(to: webView)
        installRefreshControl(on: webView)
        observeLoadingState(webView: webView)
    }

    deinit {
        loadingObservation?.invalidate()
    }

    public static var siteBackgroundColor: UIColor {
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

    @MainActor
    private func installRefreshControl(on webView: WKWebView) {
        webView.scrollView.bounces = true
        webView.scrollView.alwaysBounceVertical = true
        refreshControl.tintColor = UIColor { $0.userInterfaceStyle == .dark ? .white : .systemGray }
        refreshControl.addTarget(self, action: #selector(handleRefreshTriggered), for: .valueChanged)
        refreshControl.layer.zPosition = CGFloat.greatestFiniteMagnitude
        refreshControl.layer.backgroundColor = Self.siteBackgroundColor.cgColor
        
//         webView.registerForTraitChanges([UITraitUserInterfaceStyle.self]) { [weak self] (view: WKWebView, _) in
//             guard let self = self else { return }
//             let dynamicColor = Self.siteBackgroundColor
//             let resolvedColor = dynamicColor.resolvedColor(with: view.traitCollection)
//             self.refreshControl.layer.backgroundColor = resolvedColor.cgColor
//         }
        
        webView.scrollView.refreshControl = refreshControl
    }

    @MainActor
    @objc private func handleRefreshTriggered() {
        guard let webView, !isRefreshing else { return }
        isRefreshing = true
        refreshStartTime = Date()
        impactGenerator.impactOccurred()

        webView.evaluateJavaScript("window.dispatchEvent(new Event('harvestPullToRefresh'))") { _, error in
            if let error {
                print("harvestPullToRefresh dispatch failed: \(error)")
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 8.0) { [weak self] in
            guard let self, self.isRefreshing else { return }
            self.isRefreshing = false
            self.refreshControl.endRefreshing()
        }
    }

    private func observeLoadingState(webView: WKWebView) {
        loadingObservation = webView.observe(\.isLoading, options: [.new]) { [weak self] _, change in
            guard let self, self.isRefreshing, change.newValue == false else {
                return
            }

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
            DispatchQueue.main.asyncAfter(deadline: .now() + remaining) {
                finish()
            }
        }
    }
}


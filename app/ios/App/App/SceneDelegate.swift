import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var floatingNavBar: FloatingNavBar?
    private var pullToRefreshController: PullToRefreshController?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }

        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = PullToRefreshController.siteBackgroundColor
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        window?.rootViewController = storyboard.instantiateInitialViewController()
        window?.makeKeyAndVisible()

        setUpFloatingChrome()

        if let url = connectionOptions.urlContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
        if let userActivity = connectionOptions.userActivities.first {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
        }
    }

    private func setUpFloatingChrome(retryCount: Int = 0) {
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController else { return }
        _ = bridgeVC.view

        guard let webView = bridgeVC.bridge?.webView else {
            if retryCount < 10 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                    self?.setUpFloatingChrome(retryCount: retryCount + 1)
                }
            }
            return
        }

        guard let superview = webView.superview else {
            if retryCount < 10 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                    self?.setUpFloatingChrome(retryCount: retryCount + 1)
                }
            }
            return
        }

        let conflictingConstraints = superview.constraints.filter {
            ($0.firstItem as? UIView) == webView || ($0.secondItem as? UIView) == webView
        }
        NSLayoutConstraint.deactivate(conflictingConstraints)
        NSLayoutConstraint.deactivate(webView.constraints)

        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: superview.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: superview.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: superview.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: superview.trailingAnchor)
        ])

        superview.backgroundColor = PullToRefreshController.siteBackgroundColor
        bridgeVC.view.backgroundColor = PullToRefreshController.siteBackgroundColor

        pullToRefreshController = PullToRefreshController(webView: webView, containerView: bridgeVC.view)

        let navBar = FloatingNavBar(webView: webView, presenter: bridgeVC)
        bridgeVC.view.addSubview(navBar)

        NSLayoutConstraint.activate([
            navBar.leadingAnchor.constraint(equalTo: bridgeVC.view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            navBar.bottomAnchor.constraint(equalTo: bridgeVC.view.safeAreaLayoutGuide.bottomAnchor, constant: -16)
        ])

        floatingNavBar = navBar
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}

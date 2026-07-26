import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var floatingNavBar: FloatingNavBar?
    private var pullToRefreshController: PullToRefreshController?
    private var webViewProcessRecovery: WebViewProcessRecovery?

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
        guard let bridgeVC = window?.rootViewController as? HarvestBridgeViewController else { return }
        _ = bridgeVC.view

        guard let webView = bridgeVC.bridge?.webView, let container = bridgeVC.webViewContainer else {
            if retryCount < 10 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                    self?.setUpFloatingChrome(retryCount: retryCount + 1)
                }
            }
            return
        }

        bridgeVC.bridge?.registerPluginInstance(WalletPassPlugin())
        webView.allowsBackForwardNavigationGestures = true

        webViewProcessRecovery = WebViewProcessRecovery(webView: webView)

        pullToRefreshController = PullToRefreshController(webView: webView, containerView: container)

        let navBar = FloatingNavBar(webView: webView, presenter: bridgeVC)
        container.addSubview(navBar)

        NSLayoutConstraint.activate([
            navBar.leadingAnchor.constraint(equalTo: container.safeAreaLayoutGuide.leadingAnchor, constant: 12),
            navBar.bottomAnchor.constraint(equalTo: container.safeAreaLayoutGuide.bottomAnchor, constant: -4)
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

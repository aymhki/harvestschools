import { Capacitor, registerPlugin } from '@capacitor/core'


const AppChrome = registerPlugin('AppChrome')


const setNavigationBarVisible = async (isVisible) => {
    if (!Capacitor.isNativePlatform()) {
        return
    }

    try {
        await AppChrome.setNavigationBarVisible({ visible: isVisible })
    } catch (chromeError) {
        console.warn('[chrome] Could not change the navigation bar visibility', chromeError)
    }
}


export {
    setNavigationBarVisible,
}

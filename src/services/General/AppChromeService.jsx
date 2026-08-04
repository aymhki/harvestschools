import { Capacitor, registerPlugin } from '@capacitor/core'


const AppChrome = registerPlugin('AppChrome')


let isAppReady = false
let isModalOpen = false
let isExternalSiteOpen = false


const applyNavigationBarVisibility = async () => {
    if (!Capacitor.isNativePlatform()) {
        return
    }

    try {
        await AppChrome.setNavigationBarVisible({ visible: isAppReady && !isModalOpen && !isExternalSiteOpen })
    } catch (chromeError) {
        console.warn('[chrome] Could not change the navigation bar visibility', chromeError)
    }
}


const setAppReady = (isReady) => {
    isAppReady = isReady

    applyNavigationBarVisibility()
}


const setModalOpen = (isOpen) => {
    if (isModalOpen !== isOpen) {
        isModalOpen = isOpen

        applyNavigationBarVisibility()
    }
}


const setExternalSiteOpen = (isOpen) => {
    if (isExternalSiteOpen !== isOpen) {
        isExternalSiteOpen = isOpen

        applyNavigationBarVisibility()
    }
}


export {
    setAppReady,
    setModalOpen,
    setExternalSiteOpen,
}

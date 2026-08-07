import { Capacitor, registerPlugin } from '@capacitor/core'


const AppChrome = registerPlugin('AppChrome')


let isAppReady = false
let isModalOpen = false
let isExternalSiteOpen = false
let isAdminSection = false


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


const applyNavigationBarLayout = async () => {
    if (!Capacitor.isNativePlatform()) {
        return
    }

    try {
        await AppChrome.setNavigationBarMerged({ merged: isAdminSection })
    } catch (chromeError) {
        console.warn('[chrome] Could not change the navigation bar layout', chromeError)
    }
}


const setAdminSection = (isAdmin) => {
    if (isAdminSection !== isAdmin) {
        isAdminSection = isAdmin

        applyNavigationBarLayout()
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
    setAdminSection,
    setModalOpen,
    setExternalSiteOpen,
}

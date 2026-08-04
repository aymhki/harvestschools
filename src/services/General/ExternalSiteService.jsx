import { Capacitor } from '@capacitor/core'
import { InAppBrowser, BackgroundColor } from '@capgo/capacitor-inappbrowser'
import { AppLauncher } from '@capacitor/app-launcher'
import { setExternalSiteOpen } from './AppChromeService.jsx'


const SCHOOL_EVERYWHERE_ORIGIN = 'https://schooleverywhere-harvest.com'

const SCHOOL_EVERYWHERE_ROOT = `${SCHOOL_EVERYWHERE_ORIGIN}/schooleverywhere/`

const ONLINE_ADMISSION_ROOT = `${SCHOOL_EVERYWHERE_ROOT}management/onlineadmission/applyonline/`

const SCHOOL_EVERYWHERE_TARGETS = {
    portal: SCHOOL_EVERYWHERE_ROOT,
    apply: `${ONLINE_ADMISSION_ROOT}onlineadmission.php`,
    status: `${ONLINE_ADMISSION_ROOT}onlineadmissionlogin.php`,
}

const DEFAULT_TARGET = 'portal'


const isKnownTarget = (target) => Object.prototype.hasOwnProperty.call(SCHOOL_EVERYWHERE_TARGETS, target)


const readTarget = (target) => (isKnownTarget(target) ? target : DEFAULT_TARGET)


const getSchoolEverywhereUrl = (target) => SCHOOL_EVERYWHERE_TARGETS[readTarget(target)]


const buildHomeButton = () => ({
    ios: {
        iconType: 'sf-symbol',
        icon: 'house',
    },
    android: {
        iconType: 'vector',
        icon: 'ic_nav_home',
        width: 24,
        height: 24,
    },
})


const openSchoolEverywhere = async ({ target, title }) => {
    const url = getSchoolEverywhereUrl(target)

    if (!Capacitor.isNativePlatform()) {
        window.open(url, '_blank')

        return false
    }

    setExternalSiteOpen(true)

    try {
        await InAppBrowser.openWebView({
            url,
            title,
            preventDeeplink: true,
            activeNativeNavigationForWebview: true,
            showReloadButton: true,
            buttonNearDone: buildHomeButton(),
            backgroundColor: BackgroundColor.WHITE,
            isPresentAfterPageLoad: false,
        })

        return true
    } catch (openError) {
        console.warn('[external-site] Could not open the web view', openError)

        setExternalSiteOpen(false)

        throw openError
    }
}


const closeExternalSite = async () => {
    if (!Capacitor.isNativePlatform()) {
        return
    }

    try {
        await InAppBrowser.close()
    } catch (closeError) {
        /* Already gone when the user dismissed it themselves, which is not a fault. */
        console.debug('[external-site] The web view was already closed', closeError)
    }
}


const markExternalSiteClosed = () => setExternalSiteOpen(false)


const attachExternalSiteListeners = ({ onClose, onHome }) => {
    const handles = []

    let isDetached = false

    const keep = (pending) => {
        pending
            .then((handle) => {
                if (isDetached) {
                    handle.remove()
                } else {
                    handles.push(handle)
                }
            })
            .catch((listenError) => console.warn('[external-site] Could not listen for the web view', listenError))
    }

    if (Capacitor.isNativePlatform()) {
        keep(InAppBrowser.addListener('closeEvent', () => onClose()))
        keep(InAppBrowser.addListener('buttonNearDoneClick', () => onHome()))
    }

    return () => {
        isDetached = true

        handles.forEach((handle) => handle.remove())

        handles.length = 0
    }
}


const openInOwningApp = async (url) => {
    if (!Capacitor.isNativePlatform()) {
        window.open(url, url.startsWith('tel:') ? '_self' : '_blank')

        return
    }

    try {
        await AppLauncher.openUrl({ url })
    } catch (launchError) {
        console.warn('[external-site] Could not hand the link to its app', launchError)
    }
}


export {
    SCHOOL_EVERYWHERE_ORIGIN,
    SCHOOL_EVERYWHERE_TARGETS,
    DEFAULT_TARGET,
    isKnownTarget,
    readTarget,
    getSchoolEverywhereUrl,
    openSchoolEverywhere,
    closeExternalSite,
    markExternalSiteClosed,
    attachExternalSiteListeners,
    openInOwningApp,
}

import { Capacitor } from '@capacitor/core'
import { InAppBrowser, BackgroundColor, ToolBarType, InvisibilityMode } from '@capgo/capacitor-inappbrowser'
import { AppLauncher } from '@capacitor/app-launcher'
import { setExternalSiteOpen } from './AppChromeService.jsx'
import {
    isAvailable as isHarvestBrowserAvailable,
    openHarvestBrowser,
    closeHarvestBrowser,
    showHarvestBrowser,
    runScriptInHarvestBrowser,
    getHarvestBrowserCookies,
    clearHarvestBrowserCookies,
    attachHarvestBrowserListeners,
} from './HarvestBrowserService.jsx'


const PREFER_HARVEST_BROWSER = true

const shouldUseHarvestBrowser = () => PREFER_HARVEST_BROWSER && isHarvestBrowserAvailable()


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


const buildWebViewOptions = ({ url, title }) => ({
    url,
    title,
    toolbarType: ToolBarType.NAVIGATION,
    showURL: true,
    visibleTitle: false,
    showReloadButton: true,
    urlBarHidingEnabled: true,
    preventDeeplink: true,
    activeNativeNavigationForWebview: true,
    backgroundColor: BackgroundColor.WHITE,
})


const openExternalSite = async ({ url, title, headers }) => {
    if (!Capacitor.isNativePlatform()) {
        window.open(url, '_blank')

        return false
    }

    setExternalSiteOpen(true)

    try {
        if (shouldUseHarvestBrowser()) {
            await openHarvestBrowser({ url, headers })
        } else {
            await InAppBrowser.openWebView({
                ...buildWebViewOptions({ url, title }),
                ...(headers ? { headers } : {}),
            })
        }

        return true
    } catch (openError) {
        console.warn('[external-site] Could not open the web view', openError)

        setExternalSiteOpen(false)

        throw openError
    }
}


const openHiddenExternalSite = async ({ url, title, headers }) => {
    setExternalSiteOpen(true)

    try {
        if (shouldUseHarvestBrowser()) {
            await openHarvestBrowser({ url, headers, hidden: true })
        } else {
            await InAppBrowser.openWebView({
                ...buildWebViewOptions({ url, title }),
                ...(headers ? { headers } : {}),
                hidden: true,
                invisibilityMode: InvisibilityMode.FAKE_VISIBLE,
            })
        }

        return true
    } catch (openError) {
        setExternalSiteOpen(false)

        throw openError
    }
}


const revealExternalSite = async () => {
    try {
        if (shouldUseHarvestBrowser()) {
            await showHarvestBrowser()

            return true
        }

        await InAppBrowser.show()

        return true
    } catch (showError) {
        console.warn('[external-site] Could not reveal the web view', showError)

        return false
    }
}


const runScriptInExternalSite = async (code) => {
    try {
        if (shouldUseHarvestBrowser()) {
            await runScriptInHarvestBrowser(code)

            return true
        }

        await InAppBrowser.executeScript({ code })

        return true
    } catch (scriptError) {
        console.warn('[external-site] Could not run the script', scriptError)

        return false
    }
}


const navigateExternalSite = async (url) => {
    try {
        await InAppBrowser.setUrl({ url })

        return true
    } catch (navigateError) {
        console.warn('[external-site] Could not move the web view', navigateError)

        return false
    }
}


const openSchoolEverywhere = ({ target, title }) => openExternalSite({ url: getSchoolEverywhereUrl(target), title })


const closeExternalSite = async () => {
    if (!Capacitor.isNativePlatform()) {
        return
    }

    try {
        if (shouldUseHarvestBrowser()) {
            await closeHarvestBrowser()

            return
        }

        await InAppBrowser.close()
    } catch (closeError) {
        console.debug('[external-site] The web view was already closed', closeError)
    }
}


const markExternalSiteClosed = () => setExternalSiteOpen(false)


const attachExternalSiteListeners = ({ onClose, onUrlChange, onMessage, onPageLoaded }) => {
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

    if (shouldUseHarvestBrowser()) {
        return attachHarvestBrowserListeners({ onClose, onPageLoaded, onUrlChange, onMessage })
    }

    if (Capacitor.isNativePlatform()) {
        if (onClose) {
            keep(InAppBrowser.addListener('closeEvent', () => onClose()))
        }

        if (onUrlChange) {
            keep(InAppBrowser.addListener('urlChangeEvent', (event) => onUrlChange(event && event.url ? event.url : '')))
        }

        if (onPageLoaded) {
            keep(InAppBrowser.addListener('browserPageLoaded', () => onPageLoaded()))
        }

        if (onMessage) {
            keep(InAppBrowser.addListener('messageFromWebview', (event) => onMessage((event && event.detail) || {})))
        }
    }

    return () => {
        isDetached = true

        handles.forEach((handle) => handle.remove())

        handles.length = 0
    }
}


const getExternalSiteCookies = async (url) => {
    if (!Capacitor.isNativePlatform()) {
        return {}
    }

    try {
        if (shouldUseHarvestBrowser()) { return await getHarvestBrowserCookies(url) }

        return await InAppBrowser.getCookies({ url })
    } catch (readError) {
        console.warn('[external-site] Could not read the session', readError)

        return {}
    }
}


const clearExternalSiteCookies = async (url) => {
    if (!Capacitor.isNativePlatform()) {
        return
    }

    try {
        if (shouldUseHarvestBrowser()) {
            await clearHarvestBrowserCookies(url)

            return
        }

        await InAppBrowser.clearCookies({ url })
    } catch (clearError) {
        console.warn('[external-site] Could not clear the stored session', clearError)
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
    openExternalSite,
    openHiddenExternalSite,
    revealExternalSite,
    runScriptInExternalSite,
    navigateExternalSite,
    closeExternalSite,
    clearExternalSiteCookies,
    getExternalSiteCookies,
    markExternalSiteClosed,
    attachExternalSiteListeners,
    openInOwningApp,
}

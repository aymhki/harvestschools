import { Capacitor, registerPlugin } from '@capacitor/core'


const HarvestBrowser = registerPlugin('HarvestBrowser')


const CHROME_DEFAULTS = {
    showUrlBar: true,
    collapseUrlBarOnScroll: true,
    showBack: true,
    showForward: false,
    showReload: true,
    showShare: false,
    showClose: true,
    keepTopInset: true,
}


const isAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('HarvestBrowser')


const openHarvestBrowser = async ({ url, headers, hidden, ...chrome }) => {
    await HarvestBrowser.open({
        url,
        ...CHROME_DEFAULTS,
        ...chrome,
        ...(headers ? { headers } : {}),
        hidden: hidden === true,
    })
}


const closeHarvestBrowser = () => HarvestBrowser.close().catch(() => null)

const showHarvestBrowser = () => HarvestBrowser.show().catch(() => null)

const hideHarvestBrowser = () => HarvestBrowser.hide().catch(() => null)

const runScriptInHarvestBrowser = (code) => HarvestBrowser.executeScript({ code }).catch(() => null)

const getHarvestBrowserCookies = (url) => HarvestBrowser.getCookies({ url }).catch(() => ({}))

const clearHarvestBrowserCookies = (url) => HarvestBrowser.clearCookies({ url }).catch(() => null)


const attachHarvestBrowserListeners = ({ onClose, onPageLoaded, onUrlChange, onMessage }) => {
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
            .catch(() => null)
    }

    if (isAvailable()) {
        if (onClose) { keep(HarvestBrowser.addListener('browserClosed', () => onClose())) }

        if (onPageLoaded) { keep(HarvestBrowser.addListener('browserPageLoaded', (event) => onPageLoaded(event || {}))) }

        if (onUrlChange) { keep(HarvestBrowser.addListener('urlChange', (event) => onUrlChange((event && event.url) || ''))) }

        if (onMessage) { keep(HarvestBrowser.addListener('messageFromWebview', (event) => onMessage((event && event.detail) || {}))) }
    }

    return () => {
        isDetached = true

        handles.forEach((handle) => handle.remove())

        handles.length = 0
    }
}


export {
    CHROME_DEFAULTS,
    isAvailable,
    openHarvestBrowser,
    closeHarvestBrowser,
    showHarvestBrowser,
    hideHarvestBrowser,
    runScriptInHarvestBrowser,
    getHarvestBrowserCookies,
    clearHarvestBrowserCookies,
    attachHarvestBrowserListeners,
}

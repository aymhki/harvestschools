import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

const DEEP_LINK_HOSTS = [
    'harvestschools.com',
    'www.harvestschools.com',
    'admin.harvestschools.com',
    'www.admin.harvestschools.com',
]


const readPathFromDeepLink = (url) => {
    let path = null

    try {
        const parsed = new URL(url)

        if (DEEP_LINK_HOSTS.includes(parsed.hostname)) {
            path = `${parsed.pathname}${parsed.search}${parsed.hash}`
        }
    } catch (parseError) {
        console.warn('[deep-link] Could not read the opened link', parseError)
    }

    return path
}


const attachDeepLinkListener = (navigateTo) => {
    let listenerHandle = null

    const openIfNeeded = (url) => {
        const path = url ? readPathFromDeepLink(url) : null

        const here = window.location.pathname + window.location.search + window.location.hash

        if (path && path !== here) {
            navigateTo(path)
        }
    }

    if (Capacitor.isNativePlatform()) {
        CapacitorApp.addListener('appUrlOpen', (event) => openIfNeeded(event.url))
            .then((handle) => {
                listenerHandle = handle
            })
            .catch((listenError) => console.warn('[deep-link] Could not listen for links', listenError))
    }

    return () => {
        if (listenerHandle) {
            listenerHandle.remove()

            listenerHandle = null
        }
    }
}


export {
    attachDeepLinkListener,
    readPathFromDeepLink,
}

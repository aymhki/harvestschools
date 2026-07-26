import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

const DEEP_LINK_SCHEME = 'harvestapp:'

const DEEP_LINK_PATH_PARAMETER = 'path'


const readPathFromDeepLink = (url) => {
    let path = null

    try {
        const parsed = new URL(url)

        if (parsed.protocol === DEEP_LINK_SCHEME) {
            const requestedPath = parsed.searchParams.get(DEEP_LINK_PATH_PARAMETER)

            path = requestedPath && requestedPath.startsWith('/') ? requestedPath : '/'
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

        if (path) {
            navigateTo(path)
        }
    }

    if (Capacitor.isNativePlatform()) {
        CapacitorApp.getLaunchUrl()
            .then((launch) => openIfNeeded(launch ? launch.url : null))
            .catch((launchError) => console.warn('[deep-link] Could not read the launch link', launchError))

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

import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import { Preferences } from '@capacitor/preferences';


const APP_UPDATE_BASE_URL = 'https://app.harvestschools.com'

const APP_UPDATE_CHANNELS = ['latest', 'stable']

const APP_UPDATE_RESTORE_PATH_KEY = 'harvest_schools_app_update_restore_path'

const APP_UPDATE_PULL_TO_REFRESH_EVENT = 'harvestPullToRefresh'



const fetchManifest = async (channel) => {
    const response = await fetch(`${APP_UPDATE_BASE_URL}/${channel}.json?ts=${Date.now()}`, {
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`Manifest request failed for "${channel}" (${response.status})`)
    }

    const manifest = await response.json()

    if (!manifest || !manifest.version) {
        throw new Error(`Malformed manifest for "${channel}"`)
    }

    return manifest
}


const getAndClearRestorePath = async () => {
    let path = null;
    try {
        const { value } = await Preferences.get({ key: APP_UPDATE_RESTORE_PATH_KEY });
        if (value) {
            path = value;
            await Preferences.remove({ key: APP_UPDATE_RESTORE_PATH_KEY });
        }
    } catch (storageError) {
        console.warn('Could not read the saved restore path', storageError);
    }
    return path;
};

const handlePullToRefresh = async () => {
    try {
        const path = window.location.pathname + window.location.search + window.location.hash
        await Preferences.set({ key: APP_UPDATE_RESTORE_PATH_KEY, value: path })
    } catch (storageError) {
        console.warn('Could not save the restore path', storageError)
    } finally {
        window.location.reload()
    }
}

const attachPullToRefreshListener = () => {
    window.addEventListener(APP_UPDATE_PULL_TO_REFRESH_EVENT, handlePullToRefresh)
    return () => window.removeEventListener(APP_UPDATE_PULL_TO_REFRESH_EVENT, handlePullToRefresh)
}

const applyChannel = async (channel, currentVersion, onProgress) => {
    const manifest = await fetchManifest(channel)

    if (manifest.version === currentVersion) {
        return { updated: false, channel }
    }

    if (onProgress) {
        onProgress(0)
    }

    const bundle = await CapacitorUpdater.download({
        url: `${APP_UPDATE_BASE_URL}/${channel}.zip`,
        version: manifest.version,
    })

    if (bundle.status === 'error') {
        throw new Error(`Downloaded bundle for "${channel}" could not be validated`)
    }

    await CapacitorUpdater.set({ id: bundle.id })

    return { updated: true, channel }
}

const isDeviceOnline = async () => {
    try {
        const status = await Network.getStatus()

        return status.connected
    } catch (networkError) {
        console.warn('Could not read the network status, assuming the device is online', networkError)

        return true
    }
}

const runMobileAppUpdateCheck = async ({ onProgress } = {}) => {
    if (!Capacitor.isNativePlatform()) {
        return { status: 'skipped' }
    }

    try {
        await CapacitorUpdater.notifyAppReady()
    } catch (notifyError) {
        console.warn('notifyAppReady failed', notifyError)
    }

    const online = await isDeviceOnline()

    if (!online) {
        return { status: 'offline' }
    }

    let downloadListenerHandle = null

    try {
        if (onProgress) {
            downloadListenerHandle = await CapacitorUpdater.addListener('download', (state) => {
                onProgress(state.percent)
            })
        }

        const { bundle: currentBundle } = await CapacitorUpdater.current()

        let lastError = null

        for (const channel of APP_UPDATE_CHANNELS) {
            try {
                const result = await applyChannel(channel, currentBundle.version, onProgress)

                return { status: 'ok', ...result }
            } catch (channelError) {
                lastError = channelError
            }
        }

        return { status: 'error', error: lastError }
    } catch (error) {
        return { status: 'error', error }
    } finally {
        if (downloadListenerHandle) {
            downloadListenerHandle.remove()
        }
    }
}

const getCurrentBundleVersion = async () => {
    if (!Capacitor.isNativePlatform()) {
        return null
    }

    try {
        const { bundle } = await CapacitorUpdater.current()

        return bundle && bundle.version ? bundle.version : null
    } catch (versionError) {
        console.warn('Could not read the current bundle version', versionError)

        return null
    }
}

export {
    runMobileAppUpdateCheck,
    getAndClearRestorePath,
    attachPullToRefreshListener,
    getCurrentBundleVersion
}
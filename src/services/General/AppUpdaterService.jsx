import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import { Preferences } from '@capacitor/preferences';


const APP_UPDATE_BASE_URL = 'https://app.harvestschools.com'

const APP_UPDATE_CHANNELS = ['latest', 'stable']

const APP_UPDATE_LAST_ATTEMPT_KEY = 'harvest_schools_app_update_last_attempt'

const APP_UPDATE_RESTORE_PATH_KEY = 'harvest_schools_app_update_restore_path'

const appUpdateRetryCooldown = 60 * 60 * 1000


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

const saveRestorePath = async () => {
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    try {
        await Preferences.set({
            key: APP_UPDATE_RESTORE_PATH_KEY,
            value: currentPath,
        });
    } catch (storageError) {
        console.warn('Could not save the current path', storageError);
    }
};

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

    await saveRestorePath()

    await CapacitorUpdater.set({ id: bundle.id })

    return { updated: true, channel }
}

const getLastAttemptTimestamp = () => {
    const stored = localStorage.getItem(APP_UPDATE_LAST_ATTEMPT_KEY)

    return stored ? Number(stored) : 0
}

const recordAttempt = () => {
    localStorage.setItem(APP_UPDATE_LAST_ATTEMPT_KEY, Date.now().toString())
}

const clearAttempt = () => {
    localStorage.removeItem(APP_UPDATE_LAST_ATTEMPT_KEY)
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

                clearAttempt()

                return { status: 'ok', ...result }
            } catch (channelError) {
                lastError = channelError
            }
        }

        recordAttempt()

        return { status: 'error', error: lastError }
    } catch (error) {
        recordAttempt()

        return { status: 'error', error }
    } finally {
        if (downloadListenerHandle) {
            downloadListenerHandle.remove()
        }
    }
}

export {
    runMobileAppUpdateCheck,
    getLastAttemptTimestamp,
    appUpdateRetryCooldown,
    getAndClearRestorePath,
}
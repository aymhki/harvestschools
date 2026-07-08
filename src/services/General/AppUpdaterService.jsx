import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'

const APP_UPDATE_BASE_URL = 'https://app.harvestschools.com'
const APP_UPDATE_CHANNELS = ['latest', 'stable']
const APP_UPDATE_LAST_ATTEMPT_KEY = 'harvest_schools_app_update_last_attempt'
const appUpdateRetryCooldown = 60 * 60 * 1000

const fetchManifest = async (channel) => {
    const response = await fetch(`${APP_UPDATE_BASE_URL}/${channel}.json?ts=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) {
        throw new Error(`Manifest request failed for "${channel}" (${response.status})`)
    }
    const manifest = await response.json()
    if (!manifest || !manifest.version || !manifest.checksum) {
        throw new Error(`Malformed manifest for "${channel}"`)
    }
    return manifest
}

const applyChannel = async (channel, currentVersion, onProgress) => {
    const manifest = await fetchManifest(channel)
    if (manifest.version === currentVersion) {
        return { updated: false, channel }
    }
    if (onProgress) onProgress(0)
    const bundle = await CapacitorUpdater.download({
        url: `${APP_UPDATE_BASE_URL}/${channel}.zip`,
        version: manifest.version,
        checksum: manifest.checksum,
    })
    if (bundle.status === 'error') {
        throw new Error(`Downloaded bundle for "${channel}" failed checksum/validation`)
    }
    await CapacitorUpdater.set({ id: bundle.id })
    return { updated: true, channel }
}

const getLastAttemptTimestamp = () => Number(localStorage.getItem(APP_UPDATE_LAST_ATTEMPT_KEY) || 0)
const recordAttempt = () => localStorage.setItem(APP_UPDATE_LAST_ATTEMPT_KEY, Date.now().toString())
const clearAttempt = () => localStorage.removeItem(APP_UPDATE_LAST_ATTEMPT_KEY)

const runMobileAppUpdateCheck = async ({ onProgress } = {}) => {
    if (!Capacitor.isNativePlatform()) {
        return { status: 'skipped' }
    }
    await CapacitorUpdater.notifyAppReady()
    let downloadListenerHandle = null
    if (onProgress) {
        downloadListenerHandle = await CapacitorUpdater.addListener('download', (state) => {
            onProgress(state.percent)
        })
    }
    try {
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
        throw lastError
    } catch (error) {
        recordAttempt()
        return { status: 'error', error }
    } finally {
        if (downloadListenerHandle) downloadListenerHandle.remove()
    }
}

export {
    runMobileAppUpdateCheck,
    getLastAttemptTimestamp,
    appUpdateRetryCooldown,
}
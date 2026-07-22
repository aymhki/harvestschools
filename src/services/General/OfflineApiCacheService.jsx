import { Preferences } from '@capacitor/preferences'
import { isNativeRuntime, isOnline } from './OfflineStorageService.jsx'


const API_CACHE_PREFIX = 'harvest_api_cache:'

const API_CACHE_MAX_ENTRY_BYTES = 512 * 1024


const buildCacheKey = (key) => `${API_CACHE_PREFIX}${key}`


const readApiCache = async (key) => {
    if (!isNativeRuntime()) {
        return null
    }

    try {
        const { value } = await Preferences.get({ key: buildCacheKey(key) })

        if (!value) {
            return null
        }

        const parsed = JSON.parse(value)

        return { data: parsed.data, savedAt: parsed.savedAt }
    } catch (readError) {
        console.warn(`[offline-api] Could not read cache for "${key}"`, readError)

        return null
    }
}


const writeApiCache = async (key, data) => {
    if (!isNativeRuntime()) {
        return
    }

    try {
        const serialised = JSON.stringify({ data, savedAt: Date.now() })

        if (serialised.length > API_CACHE_MAX_ENTRY_BYTES) {
            return
        }

        await Preferences.set({ key: buildCacheKey(key), value: serialised })
    } catch (writeError) {
        console.warn(`[offline-api] Could not write cache for "${key}"`, writeError)
    }
}


const clearApiCache = async (key) => {
    try {
        await Preferences.remove({ key: buildCacheKey(key) })
    } catch (removeError) {
        console.warn(`[offline-api] Could not clear cache for "${key}"`, removeError)
    }
}

const cachedRequest = async (key, requestFn, { allowStaleOnError = true } = {}) => {
    if (!isNativeRuntime()) {
        const data = await requestFn()

        return { data, isStale: false, savedAt: null }
    }

    const online = await isOnline()

    if (!online) {
        const cached = await readApiCache(key)

        return { data: cached ? cached.data : null, isStale: true, savedAt: cached ? cached.savedAt : null }
    }

    try {
        const data = await requestFn()

        if (data !== null && data !== undefined) {
            writeApiCache(key, data).catch(() => null)
        }

        return { data, isStale: false, savedAt: Date.now() }
    } catch (requestError) {
        if (!allowStaleOnError) {
            throw requestError
        }

        const cached = await readApiCache(key)

        if (!cached) {
            throw requestError
        }

        return { data: cached.data, isStale: true, savedAt: cached.savedAt }
    }
}


export {
    cachedRequest,
    readApiCache,
    writeApiCache,
    clearApiCache,
}

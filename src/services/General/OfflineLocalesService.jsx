import { i18nConfig } from '../../i18n/i18n-shared.jsx'
import {
    isNativeRuntime,
    isOnline,
    getIndexEntry,
    setIndexEntry,
    writeTextFile,
    readTextFile,
    fileExists,
    fetchWithTimeout,
    flushIndexNow,
} from './OfflineStorageService.jsx'


const LOCALES_REMOTE_BASE = 'https://harvestschools.com/locales'

const LOCALES_LOCAL_BASE = '/locales'

const LOCALE_NAMESPACES = i18nConfig.ns || ['common']

const LOCALE_LANGUAGES = i18nConfig.supportedLngs || ['en']

const LOCALE_NETWORK_TIMEOUT_MS = 6000

const APP_ONLY_NAMESPACES = ['corporate-home', 'corporate-footer', 'corporate-nav']


const getLocaleRemoteUrl = (language, namespace) => {
    const base = isNativeRuntime() ? LOCALES_REMOTE_BASE : LOCALES_LOCAL_BASE

    return `${base}/${language}/${namespace}.json`
}


const getLocaleStoragePath = (language, namespace) => `locales/${language}/${namespace}.json`


const getLocaleIndexKey = (language, namespace) => `locale:${language}:${namespace}`


const readCachedLocale = async (language, namespace) => {
    if (!isNativeRuntime()) {
        return null
    }

    const storagePath = getLocaleStoragePath(language, namespace)

    try {
        const exists = await fileExists(storagePath)

        if (!exists) {
            return null
        }

        const raw = await readTextFile(storagePath)

        return raw ? JSON.parse(raw) : null
    } catch (readError) {
        console.warn(`[offline-locales] Could not read cached locale ${language}/${namespace}`, readError)

        return null
    }
}


const writeCachedLocale = async (language, namespace, payload, validators = {}) => {
    const storagePath = getLocaleStoragePath(language, namespace)

    await writeTextFile(storagePath, JSON.stringify(payload))

    await setIndexEntry(getLocaleIndexKey(language, namespace), {
        kind: 'locale',
        path: storagePath,
        etag: validators.etag || null,
        lastModified: validators.lastModified || null,
    })
}



const syncLocaleNamespace = async (language, namespace, { force = false } = {}) => {
    const indexKey = getLocaleIndexKey(language, namespace)
    const existing = force ? null : await getIndexEntry(indexKey)
    const headers = { Accept: 'application/json' }
    const alreadyOnDisk = await fileExists(getLocaleStoragePath(language, namespace))

    if (existing && alreadyOnDisk) {
        if (existing.etag) {
            headers['If-None-Match'] = existing.etag
        }

        if (existing.lastModified) {
            headers['If-Modified-Since'] = existing.lastModified
        }
    }

    try {
        const response = await fetchWithTimeout(getLocaleRemoteUrl(language, namespace), {
            headers,
            timeoutMs: LOCALE_NETWORK_TIMEOUT_MS,
            cache: 'no-cache',
        })

        if (response.status === 304 && alreadyOnDisk) {
            return { status: 'unchanged', data: null }
        }

        if (!response.ok) {
            throw new Error(`Locale request failed (${response.status})`)
        }

        const payload = await response.json()

        await writeCachedLocale(language, namespace, payload, {
            etag: response.headers.get('etag'),
            lastModified: response.headers.get('last-modified'),
        })

        return { status: 'updated', data: payload }
    } catch (syncError) {
        return { status: 'failed', data: null, error: syncError }
    }
}


const prefetchAllLocales = async ({ force = false, onProgress } = {}) => {
    if (!isNativeRuntime()) {
        return { skipped: true }
    }

    const online = await isOnline()

    if (!online) {
        return { skipped: true, reason: 'offline' }
    }

    const namespaces = LOCALE_NAMESPACES.filter((namespace) => !APP_ONLY_NAMESPACES.includes(namespace))

    const jobs = []

    for (const language of LOCALE_LANGUAGES) {
        for (const namespace of namespaces) {
            jobs.push({ language, namespace })
        }
    }

    let completed = 0
    let updated = 0
    let unchanged = 0
    let failed = 0

    const CONCURRENCY = 6

    const runJob = async ({ language, namespace }) => {
        const result = await syncLocaleNamespace(language, namespace, { force })

        if (result.status === 'updated') {
            updated += 1
        } else if (result.status === 'unchanged') {
            unchanged += 1
        } else {
            failed += 1
        }

        completed += 1

        if (onProgress) {
            onProgress(Math.round((completed / jobs.length) * 100))
        }
    }

    const queue = [...jobs]

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0) {
            const job = queue.shift()

            if (job) {
                await runJob(job)
            }
        }
    })

    await Promise.all(workers)

    await flushIndexNow()

    return { skipped: false, total: jobs.length, updated, unchanged, failed }
}

class OfflineAwareLocaleBackend {
    static type = 'backend'

    init(services, backendOptions = {}) {
        this.services = services
        this.options = backendOptions
    }

    read(language, namespace, callback) {
        const resolve = async () => {
            const online = await isOnline()

            if (!online) {
                const cached = await readCachedLocale(language, namespace)

                if (cached) {
                    return callback(null, cached)
                }

                return callback(null, {})
            }

            const result = await syncLocaleNamespace(language, namespace)

            if (result.status === 'updated' && result.data) {
                return callback(null, result.data)
            }

            const cached = await readCachedLocale(language, namespace)

            if (cached) {
                return callback(null, cached)
            }

            if (result.status === 'unchanged') {
                return callback(null, {})
            }

            return callback(null, {})
        }

        resolve().catch((readError) => {
            console.warn(`[offline-locales] Backend read failed for ${language}/${namespace}`, readError)

            callback(null, {})
        })
    }
}


export {
    LOCALE_LANGUAGES,
    LOCALE_NAMESPACES,
    OfflineAwareLocaleBackend,
    prefetchAllLocales,
    readCachedLocale,
    syncLocaleNamespace,
}

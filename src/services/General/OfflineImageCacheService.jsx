import {
    isNativeRuntime,
    isOnline,
    hashString,
    getIndexEntry,
    setIndexEntry,
    removeIndexEntry,
    getAllIndexEntries,
    writeBinaryFile,
    getNativeFileUrl,
    fileExists,
    deleteStoredFile,
    blobToBase64,
    fetchWithTimeout,
} from './OfflineStorageService.jsx'


const IMAGE_CACHE_BUDGET_BYTES = 120 * 1024 * 1024
const IMAGE_NETWORK_TIMEOUT_MS = 20000
const IMAGE_MAX_SINGLE_FILE_BYTES = 8 * 1024 * 1024
const NON_CACHEABLE_HINTS = ['/videos/', '.mp4', '.webm']
const resolvedUrlMemo = new Map()
const inFlightDownloads = new Map()


const getExtensionFor = (remoteUrl) => {
    try {
        const parsed = new URL(remoteUrl, 'https://harvestschools.com')
        const pathCandidate = parsed.searchParams.get('path') || parsed.pathname
        const match = pathCandidate.match(/\.([a-z0-9]{2,5})(?:$|\?)/i)
        return match ? match[1].toLowerCase() : 'bin'
    } catch {
        return 'bin'
    }
}


const isCacheableAsset = (remoteUrl) => {
    if (!remoteUrl || typeof remoteUrl !== 'string') {
        return false
    }

    if (remoteUrl.startsWith('data:') || remoteUrl.startsWith('blob:')) {
        return false
    }

    const lowered = remoteUrl.toLowerCase()

    return !NON_CACHEABLE_HINTS.some((hint) => lowered.includes(hint))
}


const getImageStoragePath = (remoteUrl) => `images/${hashString(remoteUrl)}.${getExtensionFor(remoteUrl)}`


const getImageIndexKey = (remoteUrl) => `image:${hashString(remoteUrl)}`


const touchEntry = async (remoteUrl) => {
    await setIndexEntry(getImageIndexKey(remoteUrl), { lastAccess: Date.now() })
}


const evictIfOverBudget = async () => {
    const entries = (await getAllIndexEntries()).filter((entry) => entry.kind === 'image')

    const total = entries.reduce((sum, entry) => sum + (entry.size || 0), 0)

    if (total <= IMAGE_CACHE_BUDGET_BYTES) {
        return
    }

    const sorted = entries.sort((a, b) => (a.lastAccess || a.updatedAt || 0) - (b.lastAccess || b.updatedAt || 0))

    let remaining = total

    for (const entry of sorted) {
        if (remaining <= IMAGE_CACHE_BUDGET_BYTES * 0.85) {
            break
        }

        await deleteStoredFile(entry.path)

        await removeIndexEntry(entry.key)

        remaining -= entry.size || 0

        for (const [url, cachedPath] of resolvedUrlMemo.entries()) {
            if (cachedPath && cachedPath.includes(entry.path)) {
                resolvedUrlMemo.delete(url)
            }
        }
    }
}


const downloadAndStore = async (remoteUrl) => {
    const storagePath = getImageStoragePath(remoteUrl)

    const response = await fetchWithTimeout(remoteUrl, {
        timeoutMs: IMAGE_NETWORK_TIMEOUT_MS,
        cache: 'default',
    })

    if (!response.ok) {
        throw new Error(`Asset request failed (${response.status})`)
    }

    const blob = await response.blob()

    if (blob.size > IMAGE_MAX_SINGLE_FILE_BYTES) {
        throw new Error('Asset is too large to cache')
    }

    const base64 = await blobToBase64(blob)

    await writeBinaryFile(storagePath, base64)

    await setIndexEntry(getImageIndexKey(remoteUrl), {
        kind: 'image',
        path: storagePath,
        size: blob.size,
        remoteUrl,
        lastAccess: Date.now(),
    })

    await evictIfOverBudget()

    return getNativeFileUrl(storagePath)
}


const getCachedAssetUrl = async (remoteUrl, { downloadIfMissing = true } = {}) => {
    if (!isNativeRuntime() || !isCacheableAsset(remoteUrl)) {
        return remoteUrl
    }

    if (resolvedUrlMemo.has(remoteUrl)) {
        return resolvedUrlMemo.get(remoteUrl)
    }

    const storagePath = getImageStoragePath(remoteUrl)

    try {
        const entry = await getIndexEntry(getImageIndexKey(remoteUrl))

        const exists = entry ? await fileExists(storagePath) : false

        if (exists) {
            const localUrl = await getNativeFileUrl(storagePath)

            resolvedUrlMemo.set(remoteUrl, localUrl)

            touchEntry(remoteUrl).catch(() => null)

            return localUrl
        }
    } catch (lookupError) {
        console.warn('[offline-images] Cache lookup failed', lookupError)
    }

    const online = await isOnline()

    if (!online || !downloadIfMissing) {
        return online ? remoteUrl : null
    }

    if (!inFlightDownloads.has(remoteUrl)) {
        inFlightDownloads.set(
            remoteUrl,
            downloadAndStore(remoteUrl)
                .then((localUrl) => {
                    resolvedUrlMemo.set(remoteUrl, localUrl)

                    return localUrl
                })
                .catch((downloadError) => {
                    console.warn('[offline-images] Could not cache asset', remoteUrl, downloadError)

                    return null
                })
                .finally(() => {
                    inFlightDownloads.delete(remoteUrl)
                })
        )
    }

    inFlightDownloads.get(remoteUrl)

    return remoteUrl
}

const prefetchCriticalAssets = async (remoteUrls = [], { onProgress } = {}) => {
    if (!isNativeRuntime() || remoteUrls.length === 0) {
        return { skipped: true }
    }

    const online = await isOnline()

    if (!online) {
        return { skipped: true, reason: 'offline' }
    }

    let completed = 0
    let stored = 0

    const queue = remoteUrls.filter(isCacheableAsset)

    const CONCURRENCY = 4

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0) {
            const remoteUrl = queue.shift()

            if (!remoteUrl) {
                continue
            }

            try {
                const storagePath = getImageStoragePath(remoteUrl)

                const exists = await fileExists(storagePath)

                if (!exists) {
                    await downloadAndStore(remoteUrl)

                    stored += 1
                }
            } catch (prefetchError) {
                console.warn('[offline-images] Critical asset prefetch failed', remoteUrl, prefetchError)
            }

            completed += 1

            if (onProgress) {
                onProgress(Math.round((completed / remoteUrls.length) * 100))
            }
        }
    })

    await Promise.all(workers)

    return { skipped: false, total: remoteUrls.length, stored }
}


export {
    getCachedAssetUrl,
    prefetchCriticalAssets,
    isCacheableAsset,
}

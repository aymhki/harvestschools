import { Preferences } from '@capacitor/preferences'
import { isNativeRuntime, isOnline } from './OfflineStorageService.jsx'
import { prefetchAllLocales } from './OfflineLocalesService.jsx'
import { applyCachedFonts, prefetchAllFonts } from './OfflineFontsService.jsx'
import { prefetchCriticalAssets } from './OfflineImageCacheService.jsx'
import { servePublicAsset } from './GeneralServices.jsx'


const PREFETCH_STAMP_KEY = 'harvest_offline_prefetch_stamp'
const PREFETCH_MAX_AGE_MS = 24 * 60 * 60 * 1000

const CRITICAL_ASSET_PATHS = [
    '/images/HarvestLogos/HarvestLogoCropped.avif',
    '/images/HarvestLogos/HarvestLogo.avif',
]

let bootstrapPromise = null
let prefetchPromise = null

const readStamp = async () => {
    try {
        const { value } = await Preferences.get({ key: PREFETCH_STAMP_KEY })

        return value ? JSON.parse(value) : null
    } catch (stampError) {
        console.warn('[offline-prefetch] Could not read the prefetch stamp', stampError)
        return null
    }
}


const writeStamp = async (stamp) => {
    try {
        await Preferences.set({ key: PREFETCH_STAMP_KEY, value: JSON.stringify(stamp) })
    } catch (stampError) {
        console.warn('[offline-prefetch] Could not write the prefetch stamp', stampError)
    }
}


const bootstrapOfflineAssets = async () => {
    if (!isNativeRuntime()) {
        return { skipped: true }
    }

    if (bootstrapPromise) {
        return bootstrapPromise
    }

    bootstrapPromise = (async () => {
        const fontResult = await applyCachedFonts()

        return { skipped: false, fonts: fontResult }
    })()

    return bootstrapPromise
}


const runOfflinePrefetch = async ({ bundleVersion = null, force = false, onProgress } = {}) => {
    if (!isNativeRuntime()) {
        return { skipped: true }
    }

    if (prefetchPromise) {
        return prefetchPromise
    }

    prefetchPromise = (async () => {
        try {
            const online = await isOnline()

            if (!online) {
                return { skipped: true, reason: 'offline' }
            }

            const stamp = await readStamp()

            const bundleChanged = Boolean(bundleVersion) && (!stamp || stamp.bundleVersion !== bundleVersion)

            const isStale = !stamp || Date.now() - (stamp.completedAt || 0) > PREFETCH_MAX_AGE_MS

            if (!force && !bundleChanged && !isStale) {
                return { skipped: true, reason: 'fresh' }
            }

            const report = (label, percent) => {
                if (onProgress) {
                    onProgress({ stage: label, percent })
                }
            }

            report('locales', 0)

            const localeResult = await prefetchAllLocales({
                force: force || bundleChanged,
                onProgress: (percent) => report('locales', percent),
            })

            report('fonts', 0)

            const fontResult = await prefetchAllFonts({
                force: force || bundleChanged,
                onProgress: (percent) => report('fonts', percent),
            })

            report('assets', 0)

            const assetResult = await prefetchCriticalAssets(
                CRITICAL_ASSET_PATHS.map((path) => servePublicAsset(path)),
                { onProgress: (percent) => report('assets', percent) }
            )

            await writeStamp({
                bundleVersion: bundleVersion || (stamp ? stamp.bundleVersion : null),
                completedAt: Date.now(),
            })

            return { skipped: false, locales: localeResult, fonts: fontResult, assets: assetResult }
        } catch (prefetchError) {
            console.warn('[offline-prefetch] Prefetch run failed', prefetchError)

            return { skipped: true, reason: 'error', error: prefetchError }
        } finally {
            prefetchPromise = null
        }
    })()

    return prefetchPromise
}


export {
    CRITICAL_ASSET_PATHS,
    bootstrapOfflineAssets,
    runOfflinePrefetch,
}

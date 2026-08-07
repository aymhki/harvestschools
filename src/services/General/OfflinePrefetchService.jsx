import { Preferences } from '@capacitor/preferences'
import { isNativeRuntime, isOnline } from './OfflineStorageService.jsx'
import { prefetchAllLocales } from './OfflineLocalesService.jsx'

const LOCALES_UPDATED_EVENT = 'harvestLocalesUpdated'
import { applyCachedFonts, prefetchAllFonts } from './OfflineFontsService.jsx'
import { prefetchCriticalAssets } from './OfflineImageCacheService.jsx'
import { servePublicAsset } from './GeneralServices.jsx'
import { prefetchPublicStaff } from '../Public/Staff/PublicStaffServices.jsx'
import { prefetchCalendars } from './SchoolCalendarsService.jsx'
import { prefetchStages } from '../Public/SchoolInfo/PublicStagesServices.jsx'
import { prefetchLibrary } from '../Public/Library/PublicLibraryServices.jsx'


const PREFETCH_STAMP_KEY = 'harvest_offline_prefetch_stamp'
const PREFETCH_MAX_AGE_MS = 24 * 60 * 60 * 1000

const BRANDING_ASSET_PATHS = [
    '/images/HarvestLogos/HarvestLogoCropped.avif',
    '/images/HarvestLogos/HarvestLogo.png',
    '/images/FooterLogos/Facebook_f_logo_(2019).svg',
    '/images/FooterLogos/google_maps_icon.png',
    '/images/FooterLogos/chat_icon.png',
    '/images/FooterLogos/mobile_ringing_icon.png',
]

const HOME_ASSET_PATHS = [
    '/images/HomePage/VisionBackground.v6.avif',
    '/images/HomePage/MissionBckground.v6.avif',
    '/images/HomePage/AccreditedCognia.avif',
    '/images/HomePage/CICIS.avif',
    '/images/HomePage/E-Learning&Academics.v6.avif',
    '/images/HomePage/Explore360.v5.avif',
]

const OPTIONS_GRID_ASSET_PATHS = [
    '/images/AcademicsPages/British1.png',
    '/images/AcademicsPages/Facilities1.png',
    '/images/AcademicsPages/International1.png',
    '/images/AcademicsPages/Kindergarten1.png',
    '/images/AcademicsPages/Login1.png',
    '/images/AcademicsPages/National1.png',
    '/images/AcademicsPages/National2.png',
    '/images/AcademicsPages/Partners1.png',
    '/images/AcademicsPages/Pre-K1.png',
    '/images/AcademicsPages/Staff1.png',
    '/images/AcademicsPages/WebMail1.png',
    '/images/AcademicsPages/OpeningQuote.png',
    '/images/AcademicsPages/ClosingQuote.png',
    '/images/AdmissionPages/AdmissionChecklist2.png',
    '/images/AdmissionPages/AdmissionFees1.png',
    '/images/AdmissionPages/AdmissionProcess1.png',
    '/images/AdmissionPages/Egypt1.png',
    '/images/AdmissionPages/Foreigner1.png',
    '/images/AdmissionPages/Globe1.png',
    '/images/EventsPages/Booking1.png',
    '/images/EventsPages/BookingExtras1.png',
    '/images/EventsPages/BookingInfo1.png',
    '/images/EventsPages/BookingMedia1.png',
    '/images/EventsPages/Calendar1.png',
    '/images/FAQsPages/Age2.png',
    '/images/FAQsPages/FAQs1.png',
    '/images/FAQsPages/Covid1.v1.png',
    '/images/GalleryPages/360Tour1.png',
    '/images/GalleryPages/Photos1.png',
    '/images/GalleryPages/Videos1.png',
    '/images/StudentsLifePages/Activities1.png',
    '/images/StudentsLifePages/AlumniStudents1.png',
    '/images/StudentsLifePages/Drama1.png',
    '/images/StudentsLifePages/General1.png',
    '/images/StudentsLifePages/Informative1.png',
    '/images/StudentsLifePages/Levels1.png',
    '/images/StudentsLifePages/Library1.png',
    '/images/StudentsLifePages/Religious1.png',
    '/images/StudentsLifePages/StudentsUnion1.png',
    '/images/StudentsLifePages/Tales1.png',
    '/images/StudentsLifePages/Tales2.png',
]

const CRITICAL_ASSET_PATHS = [
    ...BRANDING_ASSET_PATHS,
    ...HOME_ASSET_PATHS,
    ...OPTIONS_GRID_ASSET_PATHS,
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


const getPrefetchStatus = async () => {
    const stamp = isNativeRuntime() ? await readStamp() : null

    return {
        completedAt: stamp && stamp.completedAt ? stamp.completedAt : null,
        bundleVersion: stamp && stamp.bundleVersion ? stamp.bundleVersion : null,
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

            if (localeResult && localeResult.updated > 0 && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(LOCALES_UPDATED_EVENT, {
                    detail: { updated: localeResult.updated },
                }))
            }

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

            report('staff', 0)

            const staffResult = await prefetchPublicStaff({
                onProgress: (percent) => report('staff', percent),
            })

            report('calendars', 0)

            const calendarResult = await prefetchCalendars({
                onProgress: (percent) => report('calendars', percent),
            })

            report('stages', 0)

            const stageResult = await prefetchStages({
                onProgress: (percent) => report('stages', percent),
            })

            report('library', 0)


            const libraryResult = await prefetchLibrary({
                onProgress: (percent) => report('library', percent),
            })

            await writeStamp({
                bundleVersion: bundleVersion || (stamp ? stamp.bundleVersion : null),
                completedAt: Date.now(),
            })

            return {
                skipped: false,
                locales: localeResult,
                fonts: fontResult,
                assets: assetResult,
                staff: staffResult,
                calendars: calendarResult,
                stages: stageResult,
                library: libraryResult,
            }
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
    LOCALES_UPDATED_EVENT,
    BRANDING_ASSET_PATHS,
    HOME_ASSET_PATHS,
    OPTIONS_GRID_ASSET_PATHS,
    CRITICAL_ASSET_PATHS,
    bootstrapOfflineAssets,
    getPrefetchStatus,
    runOfflinePrefetch,
}

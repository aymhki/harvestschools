import { Capacitor, registerPlugin } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Preferences } from '@capacitor/preferences'
import { mobileRoutes } from '../../routes/routes.js'
import { LOCALES_UPDATED_EVENT } from '../General/OfflinePrefetchService.jsx'
import { loadPublicSchoolInfo } from './PublicSchoolInfoService.jsx'
import { buildAssistantKnowledge, logAssistantConflicts } from './AssistantKnowledgeBuilder.jsx'
import { ASSISTANT_SUPPORTED_LANGUAGES, normaliseAssistantLanguage } from './AssistantSchema.js'

const AssistantBridge = registerPlugin('AssistantBridge')

const ASSISTANT_LAST_SYNC_KEY = 'harvest_assistant_last_sync'

const ASSISTANT_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000

const ASSISTANT_STARTUP_DELAY_MS = 2500

const EXCLUDED_ROUTE_PATHS = new Set([
    '/',
    '/schooleverywhere',
    '/covid-19',
    '/students-life/alumni-students',
    '/students-life/alumni-students/login',
    '/students-life/alumni-students/profile',
    '/events/graduation-booking',
    '/events/graduation-booking/dashboard',
    '/events/graduation-booking/media',
    '/events/graduation-booking/extras',
    '/events/graduation-booking/info',
    '/events/graduation-booking-confirmation',
    '/events/open-day-signup',
])


const isAssistantSupported = () => Capacitor.isNativePlatform()


const buildRenderablePathSet = () => {
    const paths = new Set()

    mobileRoutes.forEach((route) => {
        if (!route.path || route.path === '*' || route.section === 'admin' || route.adminEntry === true) {
            return
        }

        if (EXCLUDED_ROUTE_PATHS.has(route.path)) {
            return
        }

        paths.add(route.path)
    })

    return paths
}


const readLastSyncRecord = async () => {
    let record = null

    try {
        const { value } = await Preferences.get({ key: ASSISTANT_LAST_SYNC_KEY })

        record = value ? JSON.parse(value) : null
    } catch (readError) {
        console.warn('[assistant] Could not read the last sync record', readError)
    }

    return record && typeof record === 'object' ? record : null
}


const writeLastSyncRecord = async (record) => {
    try {
        await Preferences.set({ key: ASSISTANT_LAST_SYNC_KEY, value: JSON.stringify(record) })
    } catch (writeError) {
        console.warn('[assistant] Could not save the last sync record', writeError)
    }
}


const pushKnowledgeToNative = async (language, knowledge) => {
    let isPushed = false

    try {
        const result = await AssistantBridge.setKnowledge({
            language,
            payload: JSON.stringify(knowledge),
        })

        isPushed = Boolean(result && result.value)
    } catch (bridgeError) {
        console.warn(`[assistant] Could not hand the "${language}" knowledge to the native layer`, bridgeError)
    }

    return isPushed
}


const buildKnowledgeForLanguage = async ({ language, i18n, forceRefresh }) => {
    const normalisedLanguage = normaliseAssistantLanguage(language)

    const { document, refreshError } = await loadPublicSchoolInfo({ language: normalisedLanguage, forceRefresh })

    if (refreshError) {
        console.warn(`[assistant] Falling back to cached school information for "${normalisedLanguage}"`, refreshError)
    }

    if (!document) {
        return null
    }

    const lookup = i18n
        ? (key, options) => i18n.getFixedT(normalisedLanguage, String(key).split('.')[0])(key, options)
        : () => null

    const { knowledge, conflicts } = buildAssistantKnowledge({
        document,
        lookup,
        language: normalisedLanguage,
        renderablePaths: buildRenderablePathSet(),
    })

    logAssistantConflicts(conflicts, normalisedLanguage)

    return { knowledge, conflicts }
}


const readNativeContentHash = async (language) => {
    try {
        const info = await AssistantBridge.getKnowledgeInfo({ language })

        return info && info.contentHash ? String(info.contentHash) : null
    } catch (infoError) {
        console.warn(`[assistant] Could not read the stored "${language}" knowledge info`, infoError)

        return null
    }
}


const syncAssistantKnowledge = async ({ i18n, forceRefresh = false } = {}) => {
    const summary = { synced: [], skipped: [], failed: [], conflicts: 0 }

    if (!isAssistantSupported()) {
        summary.skipped = [...ASSISTANT_SUPPORTED_LANGUAGES]

        return summary
    }

    const previous = await readLastSyncRecord()
    const hashes = {}

    for (const language of ASSISTANT_SUPPORTED_LANGUAGES) {
        try {
            const built = await buildKnowledgeForLanguage({ language, i18n, forceRefresh })

            if (!built) {
                summary.failed.push(language)
                continue
            }

            summary.conflicts += built.conflicts.length
            hashes[language] = built.knowledge.contentHash

            const nativeHash = await readNativeContentHash(language)

            const unchanged = nativeHash !== null
                && nativeHash === built.knowledge.contentHash
                && previous
                && previous.hashes
                && previous.hashes[language] === built.knowledge.contentHash

            if (unchanged && !forceRefresh) {
                summary.skipped.push(language)
                continue
            }

            const isPushed = await pushKnowledgeToNative(language, built.knowledge)

            if (isPushed) {
                summary.synced.push(language)
            } else {
                summary.failed.push(language)
            }
        } catch (syncError) {
            console.warn(`[assistant] Could not sync the "${language}" knowledge`, syncError)
            summary.failed.push(language)
        }
    }

    if (summary.synced.length > 0) {
        await writeLastSyncRecord({
            at: Date.now(),
            hashes: { ...(previous && previous.hashes ? previous.hashes : {}), ...hashes },
        })
    }

    return summary
}


const attachAssistantSyncTriggers = ({ i18n } = {}) => {
    if (!isAssistantSupported()) {
        return () => {}
    }

    const runSync = (forceRefresh = false) => {
        syncAssistantKnowledge({ i18n, forceRefresh }).catch((syncError) => {
            console.warn('[assistant] Scheduled knowledge sync failed', syncError)
        })
    }

    const startupTimer = window.setTimeout(() => runSync(false), ASSISTANT_STARTUP_DELAY_MS)
    const refreshTimer = window.setInterval(() => runSync(true), ASSISTANT_REFRESH_INTERVAL_MS)

    const onLocalesUpdated = () => runSync(true)
    const onLanguageChanged = () => runSync(false)

    window.addEventListener(LOCALES_UPDATED_EVENT, onLocalesUpdated)

    if (i18n) {
        i18n.on('languageChanged', onLanguageChanged)
    }

    const resumeListener = CapacitorApp.addListener('resume', () => runSync(false))

    return () => {
        window.clearTimeout(startupTimer)
        window.clearInterval(refreshTimer)
        window.removeEventListener(LOCALES_UPDATED_EVENT, onLocalesUpdated)

        if (i18n) {
            i18n.off('languageChanged', onLanguageChanged)
        }

        resumeListener.then((handle) => handle.remove()).catch(() => {})
    }
}


export {
    ASSISTANT_REFRESH_INTERVAL_MS,
    attachAssistantSyncTriggers,
    buildRenderablePathSet,
    isAssistantSupported,
    readLastSyncRecord,
    syncAssistantKnowledge,
}

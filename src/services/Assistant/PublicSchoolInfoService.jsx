import { endpoints } from '../General/GeneralUtils.jsx'
import {
    fetchWithTimeout,
    isNativeRuntime,
    readTextFile,
    writeTextFile,
} from '../General/OfflineStorageService.jsx'
import {
    ASSISTANT_SCHEMA_VERSION,
    isAssistantKnowledgeUsable,
    normaliseAssistantLanguage,
} from './AssistantSchema.js'

const SCHOOL_INFO_CACHE_DIRECTORY = 'assistant'

const SCHOOL_INFO_NETWORK_TIMEOUT_MS = 8000

const SCHOOL_INFO_WEB_CACHE_PREFIX = 'harvest_assistant_school_info_'


const cacheRelativePath = (language) => `${SCHOOL_INFO_CACHE_DIRECTORY}/school-knowledge-${language}.json`


const readCachedSchoolInfo = async (language) => {
    const normalisedLanguage = normaliseAssistantLanguage(language)

    let parsed = null

    try {
        if (isNativeRuntime()) {
            const raw = await readTextFile(cacheRelativePath(normalisedLanguage))

            parsed = raw ? JSON.parse(raw) : null
        } else {
            const raw = window.localStorage.getItem(SCHOOL_INFO_WEB_CACHE_PREFIX + normalisedLanguage)

            parsed = raw ? JSON.parse(raw) : null
        }
    } catch (readError) {
        console.warn('[assistant] Could not read the cached school information', readError)
    }

    return isAssistantKnowledgeUsable(parsed) ? parsed : null
}


const writeCachedSchoolInfo = async (language, document) => {
    const normalisedLanguage = normaliseAssistantLanguage(language)

    let isStored = false

    try {
        const serialised = JSON.stringify(document)

        if (isNativeRuntime()) {
            await writeTextFile(cacheRelativePath(normalisedLanguage), serialised)
        } else {
            window.localStorage.setItem(SCHOOL_INFO_WEB_CACHE_PREFIX + normalisedLanguage, serialised)
        }

        isStored = true
    } catch (writeError) {
        console.warn('[assistant] Could not cache the school information', writeError)
    }

    return isStored
}


const fetchPublicSchoolInfo = async ({ language, knownContentHash = '', timeoutMs = SCHOOL_INFO_NETWORK_TIMEOUT_MS } = {}) => {
    const normalisedLanguage = normaliseAssistantLanguage(language)

    const query = new URLSearchParams({ lang: normalisedLanguage })

    if (knownContentHash) {
        query.set('since', knownContentHash)
    }

    const response = await fetchWithTimeout(`${endpoints.getPublicSchoolInfo}?${query.toString()}`, {
        timeoutMs,
        cache: 'no-store',
    })

    if (!response || !response.ok) {
        throw new Error(`The public school information request failed with status ${response ? response.status : 'unknown'}`)
    }

    const body = await response.json()

    if (!body || body.success !== true || !body.data) {
        throw new Error(body && body.message ? body.message : 'The public school information response was not usable')
    }

    if (body.data.unchanged === true) {
        return { document: null, unchanged: true, contentHash: body.data.contentHash }
    }

    if (Number(body.data.schemaVersion) !== ASSISTANT_SCHEMA_VERSION) {
        throw new Error(`Unsupported school knowledge schema version ${body.data.schemaVersion}`)
    }

    return { document: body.data, unchanged: false, contentHash: body.data.contentHash }
}


const loadPublicSchoolInfo = async ({ language, forceRefresh = false } = {}) => {
    const normalisedLanguage = normaliseAssistantLanguage(language)

    const cached = await readCachedSchoolInfo(normalisedLanguage)

    let document = cached
    let fromCache = cached !== null
    let refreshError = null

    try {
        const result = await fetchPublicSchoolInfo({
            language: normalisedLanguage,
            knownContentHash: forceRefresh || !cached ? '' : cached.contentHash,
        })

        if (!result.unchanged && result.document) {
            document = result.document
            fromCache = false

            await writeCachedSchoolInfo(normalisedLanguage, result.document)
        }
    } catch (networkError) {
        refreshError = networkError
    }

    if (document === null && refreshError !== null) {
        throw refreshError
    }

    return { document, fromCache, refreshError }
}


export {
    SCHOOL_INFO_NETWORK_TIMEOUT_MS,
    fetchPublicSchoolInfo,
    loadPublicSchoolInfo,
    readCachedSchoolInfo,
    writeCachedSchoolInfo,
}

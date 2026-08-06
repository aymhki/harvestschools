import {endpoints, getCurrentLangCode} from "../../General/GeneralUtils.jsx";
import {
    fetchWithTimeout,
    isNativeRuntime,
    readTextFile,
    writeTextFile,
} from "../../General/OfflineStorageService.jsx";


const PUBLIC_STAFF_SCHEMA_VERSION = 1
const PUBLIC_STAFF_DEPARTMENTS = ['national', 'british', 'american', 'kindergarten']
const PUBLIC_STAFF_LANGUAGES = ['en', 'ar']
const STAFF_CACHE_DIRECTORY = 'staff'
const STAFF_WEB_CACHE_PREFIX = 'harvest_public_staff_'
const STAFF_NETWORK_TIMEOUT_MS = 8000


const cacheKey = (departmentKey, language) => `${departmentKey}-${language}`

const cacheRelativePath = (departmentKey, language) =>
    `${STAFF_CACHE_DIRECTORY}/staff-${cacheKey(departmentKey, language)}.json`


const isStaffDocumentUsable = (document) => Boolean(
    document
    && Number(document.schemaVersion) === PUBLIC_STAFF_SCHEMA_VERSION
    && Array.isArray(document.members)
    && Array.isArray(document.highlights)
)


const readCachedStaff = async (departmentKey, language) => {
    let parsed = null

    try {
        if (isNativeRuntime()) {
            const raw = await readTextFile(cacheRelativePath(departmentKey, language))

            parsed = raw ? JSON.parse(raw) : null
        } else {
            const raw = window.localStorage.getItem(STAFF_WEB_CACHE_PREFIX + cacheKey(departmentKey, language))

            parsed = raw ? JSON.parse(raw) : null
        }
    } catch (readError) {
        console.warn('[staff] Could not read the cached staff list', readError)
    }

    return isStaffDocumentUsable(parsed) ? parsed : null
}


const writeCachedStaff = async (departmentKey, language, document) => {
    try {
        const serialised = JSON.stringify(document)

        if (isNativeRuntime()) {
            await writeTextFile(cacheRelativePath(departmentKey, language), serialised)
        } else {
            window.localStorage.setItem(STAFF_WEB_CACHE_PREFIX + cacheKey(departmentKey, language), serialised)
        }

        return true
    } catch (writeError) {
        console.warn('[staff] Could not cache the staff list', writeError)

        return false
    }
}


const requestPublicStaff = async (departmentKey, language, timeoutMs = STAFF_NETWORK_TIMEOUT_MS) => {
    const params = new URLSearchParams()
    params.set('department', departmentKey)
    params.set('lang', language)

    const response = await fetchWithTimeout(`${endpoints.getPublicStaff}?${params.toString()}`, { timeoutMs })

    if (!response || !response.ok) {
        throw new Error(`The staff request failed with status ${response ? response.status : 'unknown'}`)
    }

    const body = await response.json()

    if (!body || body.success !== true || !isStaffDocumentUsable(body.data)) {
        throw new Error(body && body.message ? body.message : 'The staff response was not usable')
    }

    return body.data
}


const fetchPublicStaff = async (departmentKey, language) => {
    const normalisedLanguage = language || getCurrentLangCode()

    try {
        const document = await requestPublicStaff(departmentKey, normalisedLanguage)

        await writeCachedStaff(departmentKey, normalisedLanguage, document)

        return document
    } catch (networkError) {
        const cached = await readCachedStaff(departmentKey, normalisedLanguage)

        if (cached) {
            return cached
        }

        console.log(networkError.message)

        return null
    }
}


const prefetchPublicStaff = async ({onProgress} = {}) => {
    const total = PUBLIC_STAFF_DEPARTMENTS.length * PUBLIC_STAFF_LANGUAGES.length

    let completed = 0
    let updated = 0

    for (const departmentKey of PUBLIC_STAFF_DEPARTMENTS) {
        for (const language of PUBLIC_STAFF_LANGUAGES) {
            try {
                const document = await requestPublicStaff(departmentKey, language)

                if (await writeCachedStaff(departmentKey, language, document)) {
                    updated += 1
                }
            } catch {
                console.log("Prefetch Public Staff Error Occurred.")
            }

            completed += 1

            if (onProgress) {
                onProgress(Math.round((completed / total) * 100))
            }
        }
    }

    return {updated, total}
}


export {
    PUBLIC_STAFF_DEPARTMENTS,
    PUBLIC_STAFF_LANGUAGES,
    fetchPublicStaff,
    prefetchPublicStaff,
    readCachedStaff,
}

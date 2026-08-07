import {endpoints, getCurrentLangCode} from "../../General/GeneralUtils.jsx";
import {cachedRequest} from "../../General/OfflineApiCacheService.jsx";


const PUBLIC_LIBRARY_SCHEMA_VERSION = 1

const PUBLIC_LIBRARY_CATEGORIES = [
    'english-fairy-tales', 'english-drama', 'english-levels', 'english-general',
    'arabic-information', 'arabic-general', 'arabic-religion', 'arabic-stories',
]

const PUBLIC_LIBRARY_LANGUAGES = ['en', 'ar']


const isLibraryDocumentUsable = (document) => Boolean(
    document
    && Number(document.schemaVersion) === PUBLIC_LIBRARY_SCHEMA_VERSION
    && Array.isArray(document.books)
)


const requestLibrary = async (categoryKey, language) => {
    const params = new URLSearchParams()
    params.set('category', categoryKey)
    params.set('lang', language)

    const response = await fetch(`${endpoints.getPublicLibrary}?${params.toString()}`, {method: 'GET'})
    const body = await response.json()

    if (!body || body.success !== true || !isLibraryDocumentUsable(body.data)) {
        throw new Error(body && body.message ? body.message : 'The library response was not usable')
    }

    return body.data
}


const fetchLibraryCategory = async (categoryKey, language) => {
    const normalisedLanguage = language || getCurrentLangCode()

    try {
        const {data} = await cachedRequest(
            `public-library:${categoryKey}:${normalisedLanguage}`,
            () => requestLibrary(categoryKey, normalisedLanguage)
        )

        return isLibraryDocumentUsable(data) ? data : null
    } catch (error) {
        console.log(error.message)

        return null
    }
}


const prefetchLibrary = async ({onProgress} = {}) => {
    const total = PUBLIC_LIBRARY_CATEGORIES.length * PUBLIC_LIBRARY_LANGUAGES.length

    let completed = 0
    let updated = 0

    for (const categoryKey of PUBLIC_LIBRARY_CATEGORIES) {
        for (const language of PUBLIC_LIBRARY_LANGUAGES) {
            if (await fetchLibraryCategory(categoryKey, language)) {
                updated += 1
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
    PUBLIC_LIBRARY_CATEGORIES,
    fetchLibraryCategory,
    prefetchLibrary,
}

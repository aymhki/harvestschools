import {endpoints, getCurrentLangCode} from "../../General/GeneralUtils.jsx";
import {cachedRequest} from "../../General/OfflineApiCacheService.jsx";



const isMetaInfoDocumentUsable = (document) => Boolean(
    document && Array.isArray(document.items)
)


const requestMetaInfo = async (language) => {
    const params = new URLSearchParams()
    params.set('lang', language)

    const response = await fetch(`${endpoints.getPublicMetaInfo}?${params.toString()}`, {method: 'GET'})
    const body = await response.json()

    if (!body || body.success !== true || !isMetaInfoDocumentUsable(body.data)) {
        throw new Error(body && body.message ? body.message : 'The meta info response was not usable')
    }

    return body.data
}


const fetchMetaInfo = async (language) => {
    const normalisedLanguage = language || getCurrentLangCode()

    try {
        const {data} = await cachedRequest(
            `public-meta-info:${normalisedLanguage}`,
            () => requestMetaInfo(normalisedLanguage)
        )

        return isMetaInfoDocumentUsable(data) ? data : null
    } catch (error) {
        console.log(error.message)

        return null
    }
}


const prefetchMetaInfo = async ({onProgress} = {}) => {
    const languages = ['en', 'ar']

    let completed = 0
    let updated = 0

    for (const language of languages) {
        if (await fetchMetaInfo(language)) {
            updated += 1
        }

        completed += 1

        if (onProgress) {
            onProgress(Math.round((completed / languages.length) * 100))
        }
    }

    return {updated, total: languages.length}
}


export {
    fetchMetaInfo,
    prefetchMetaInfo,
}

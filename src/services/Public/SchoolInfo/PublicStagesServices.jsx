import {endpoints, getCurrentLangCode} from "../../General/GeneralUtils.jsx";
import {cachedRequest} from "../../General/OfflineApiCacheService.jsx";



const isStagesDocumentUsable = (document) => Boolean(
    document && Array.isArray(document.departments)
)


const requestStages = async (language) => {
    const params = new URLSearchParams()
    params.set('lang', language)

    const response = await fetch(`${endpoints.getPublicStages}?${params.toString()}`, {method: 'GET'})
    const body = await response.json()

    if (!body || body.success !== true || !isStagesDocumentUsable(body.data)) {
        throw new Error(body && body.message ? body.message : 'The stages response was not usable')
    }

    return body.data
}


const fetchStages = async (language) => {
    const normalisedLanguage = language || getCurrentLangCode()

    try {
        const {data} = await cachedRequest(
            `public-stages:${normalisedLanguage}`,
            () => requestStages(normalisedLanguage)
        )

        return isStagesDocumentUsable(data) ? data : null
    } catch (error) {
        console.log(error.message)

        return null
    }
}


const prefetchStages = async ({onProgress} = {}) => {
    const languages = ['en', 'ar']

    let completed = 0
    let updated = 0

    for (const language of languages) {
        if (await fetchStages(language)) {
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
    fetchStages,
    prefetchStages,
}

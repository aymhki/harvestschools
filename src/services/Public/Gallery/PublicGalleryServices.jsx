import {endpoints, getCurrentLangCode} from "../../General/GeneralUtils.jsx";
import {cachedRequest} from "../../General/OfflineApiCacheService.jsx";


const PUBLIC_GALLERY_SCHEMA_VERSION = 1

const PUBLIC_GALLERY_SECTIONS = ['photos', 'videos']

const PUBLIC_GALLERY_LANGUAGES = ['en', 'ar']
const PUBLIC_GALLERY_MEDIA_ROOT = 'gallery'


const isGalleryDocumentUsable = (document) => Boolean(
    document
    && Number(document.schemaVersion) === PUBLIC_GALLERY_SCHEMA_VERSION
    && Array.isArray(document.collages)
    && Array.isArray(document.videos)
)


const requestGallery = async (section, language) => {
    const params = new URLSearchParams()
    params.set('section', section)
    params.set('lang', language)

    const response = await fetch(`${endpoints.getPublicGallery}?${params.toString()}`, {method: 'GET'})
    const body = await response.json()

    if (!body || body.success !== true || !isGalleryDocumentUsable(body.data)) {
        throw new Error(body && body.message ? body.message : 'The gallery response was not usable')
    }

    return body.data
}


const fetchGallerySection = async (section, language) => {
    const normalisedLanguage = language || getCurrentLangCode()

    try {
        const {data} = await cachedRequest(
            `public-gallery:${section}:${normalisedLanguage}`,
            () => requestGallery(section, normalisedLanguage)
        )

        return isGalleryDocumentUsable(data) ? data : null
    } catch (error) {
        console.log(error.message)

        return null
    }
}


const prefetchGallery = async ({onProgress} = {}) => {
    const total = PUBLIC_GALLERY_SECTIONS.length * PUBLIC_GALLERY_LANGUAGES.length

    let completed = 0
    let updated = 0

    for (const section of PUBLIC_GALLERY_SECTIONS) {
        for (const language of PUBLIC_GALLERY_LANGUAGES) {
            if (await fetchGallerySection(section, language)) {
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
    PUBLIC_GALLERY_MEDIA_ROOT,
    PUBLIC_GALLERY_SECTIONS,
    fetchGallerySection,
    prefetchGallery,
}

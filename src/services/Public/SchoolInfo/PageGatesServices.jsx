import {endpoints} from "../../General/GeneralUtils.jsx";
import {cachedRequest} from "../../General/OfflineApiCacheService.jsx";


const isGatesDocumentUsable = (document) => Boolean(
    document && typeof document.gates === 'object' && document.gates !== null
)


const requestPageGates = async () => {
    const response = await fetch(endpoints.getPublicPageGates, {method: 'GET'})
    const body = await response.json()

    if (!body || body.success !== true || !isGatesDocumentUsable(body.data)) {
        throw new Error(body && body.message ? body.message : 'The page gates response was not usable')
    }

    return body.data
}



let gatesPromise = null
let loadedGates = null
let gatesHaveLoaded = false

const fetchPageGates = async () => {
    if (!gatesPromise) {
        gatesPromise = (async () => {
            try {
                const {data} = await cachedRequest('public-page-gates', requestPageGates)

                loadedGates = isGatesDocumentUsable(data) ? data.gates : null
            } catch (error) {
                console.log(error.message)

                loadedGates = null
            }

            gatesHaveLoaded = true

            return loadedGates
        })()
    }

    return gatesPromise
}


const getLoadedPageGates = () => loadedGates


const pageGatesHaveLoaded = () => gatesHaveLoaded


const refreshPageGates = async () => {
    gatesPromise = null
    gatesHaveLoaded = false
    loadedGates = null

    return fetchPageGates()
}


const prefetchPageGates = async ({onProgress} = {}) => {
    const gates = await refreshPageGates()

    if (onProgress) {
        onProgress(100)
    }

    return {updated: gates ? 1 : 0, total: 1}
}


export {
    fetchPageGates,
    getLoadedPageGates,
    pageGatesHaveLoaded,
    refreshPageGates,
    prefetchPageGates,
}

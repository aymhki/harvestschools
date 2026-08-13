import {createContext, useContext} from 'react'


const PrerenderDataContext = createContext(null)


const usePreloadedData = (key) => {
    const contextData = useContext(PrerenderDataContext)

    if (contextData && Object.prototype.hasOwnProperty.call(contextData, key)) {
        return contextData[key]
    }

    if (typeof window !== 'undefined'
        && window.__PRERENDER_DATA__
        && Object.prototype.hasOwnProperty.call(window.__PRERENDER_DATA__, key)) {
        return window.__PRERENDER_DATA__[key]
    }

    return null
}


export {
    PrerenderDataContext,
    usePreloadedData,
}

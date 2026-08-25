import { endpoints } from '../../General/GeneralUtils.jsx'

const framesCache = new Map()

const cacheKey = (path, root, count, width) => `${root || ''}|${path}|${count}|${width}`

const absoluteFrameUrl = (url) => {
    if (/^[a-z]+:\/\//i.test(url)) {
        return url
    }

    const base = String(endpoints.servePublicVideoPreviewFrames || '').replace(/\/scripts\/.*$/, '')

    return `${base}${url}`
}

const requestVideoPreviewFrames = async ({ path, root, durationSeconds, count = 6, width = 320, signal }) => {
    const key = cacheKey(path, root, count, width)

    if (framesCache.has(key)) {
        return framesCache.get(key)
    }

    const params = new URLSearchParams({ path, count: String(count), w: String(width) })

    if (root) {
        params.set('root', root)
    }

    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
        params.set('duration', String(durationSeconds))
    }

    const response = await fetch(`${endpoints.servePublicVideoPreviewFrames}?${params.toString()}`, { signal })
    const body = await response.json()

    if (!body || body.success !== true || !body.data || !Array.isArray(body.data.frames)) {
        throw new Error(body && body.message ? body.message : 'The preview frames response was not usable')
    }

    const data = {
        ...body.data,
        frames: body.data.frames.map((frame) => ({...frame, url: absoluteFrameUrl(frame.url)})),
    }

    framesCache.set(key, data)

    return data
}

const preloadFrame = (url, signal) => new Promise((resolve) => {
    if (signal && signal.aborted) {
        resolve(null)
        return
    }

    const image = new Image()

    const finish = (value) => {
        image.onload = null
        image.onerror = null
        resolve(value)
    }

    image.onload = () => finish(url)
    image.onerror = () => finish(null)
    image.decoding = 'async'
    image.src = url
})

const preloadFramesSequentially = async (urls, { onProgress, signal } = {}) => {
    const loaded = []

    for (let index = 0; index < urls.length; index++) {
        if (signal && signal.aborted) {
            return loaded
        }

        const result = await preloadFrame(urls[index], signal)

        if (result) {
            loaded.push(result)
        }

        if (onProgress) {
            onProgress((index + 1) / urls.length)
        }
    }

    return loaded
}

export { requestVideoPreviewFrames, preloadFramesSequentially }

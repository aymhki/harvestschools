import {
    isNativeRuntime,
    isOnline,
    getIndexEntry,
    setIndexEntry,
    writeBinaryFile,
    readBinaryFileAsBase64,
    getNativeFileUrl,
    fileExists,
    blobToBase64,
    fetchWithTimeout,
    flushIndexNow,
    writeTextFile,
    readTextFile,
} from './OfflineStorageService.jsx'


const FONTS_REMOTE_BASE = 'https://harvestschools.com/fonts'
const FONT_NETWORK_TIMEOUT_MS = 20000
const FONT_STYLE_ELEMENT_ID = 'harvest-offline-fonts'
const FONT_CSS_STORAGE_PATH = 'fonts/offline-fonts.css'


const FONT_FACES = [
    {
        family: 'Futura',
        files: [
            { remote: 'Futura/FuturaLT.woff2', format: 'woff2' },
            { remote: 'Futura/FuturaLT.woff', format: 'woff' },
        ],
    },
    {
        family: 'Futura-Bold',
        files: [
            { remote: 'Futura/FuturaLT-Bold.woff2', format: 'woff2' },
            { remote: 'Futura/FuturaLT-Bold.woff', format: 'woff' },
        ],
    },
    {
        family: 'American Typewriter',
        files: [
            { remote: 'American Typewriter/American Typewriter.woff2', format: 'woff2' },
            { remote: 'American Typewriter/American Typewriter.woff', format: 'woff' },
        ],
    },
    {
        family: 'American Typewriter Light',
        files: [
            { remote: 'American Typewriter Light/ITC American Typewriter Light.woff2', format: 'woff2' },
            { remote: 'American Typewriter Light/ITC American Typewriter Light.woff', format: 'woff' },
        ],
    },
    {
        family: 'Arian Lt',
        files: [
            { remote: 'Arian LT/Arian LT.woff2', format: 'woff2' },
            { remote: 'Arian LT/Arian LT.woff', format: 'woff' },
        ],
    },
    {
        family: 'Arian LT Demi',
        files: [
            { remote: 'Arian LT Demi/Arian LT Demi.woff2', format: 'woff2' },
            { remote: 'Arian LT Demi/Arian LT Demi.woff', format: 'woff' },
        ],
    },
    {
        family: 'Arslan Wessam A',
        files: [
            { remote: 'Arslan Wessam A/Arslan Wessam A.woff2', format: 'woff2' },
            { remote: 'Arslan Wessam A/Arslan Wessam A.woff', format: 'woff' },
        ],
    },
    {
        family: 'Janna LT Bold',
        files: [
            { remote: 'Janna LT Bold/Janna LT Bold.woff2', format: 'woff2' },
            { remote: 'Janna LT Bold/Janna LT Bold.woff', format: 'woff' },
        ],
    },
]


const getFontStoragePath = (remotePath) => `fonts/${remotePath}`


const getFontIndexKey = (remotePath) => `font:${remotePath}`


const getFontRemoteUrl = (remotePath) => `${FONTS_REMOTE_BASE}/${remotePath.split('/').map(encodeURIComponent).join('/')}`


const syncFontFile = async (remotePath, { force = false } = {}) => {
    const indexKey = getFontIndexKey(remotePath)

    const storagePath = getFontStoragePath(remotePath)

    const existing = force ? null : await getIndexEntry(indexKey)

    const alreadyOnDisk = await fileExists(storagePath)

    const headers = {}

    if (existing && alreadyOnDisk) {
        if (existing.etag) {
            headers['If-None-Match'] = existing.etag
        }

        if (existing.lastModified) {
            headers['If-Modified-Since'] = existing.lastModified
        }
    }

    try {
        const response = await fetchWithTimeout(getFontRemoteUrl(remotePath), {
            headers,
            timeoutMs: FONT_NETWORK_TIMEOUT_MS,
            cache: 'no-cache',
        })

        if (response.status === 304 && alreadyOnDisk) {
            return { status: 'unchanged' }
        }

        if (!response.ok) {
            throw new Error(`Font request failed (${response.status})`)
        }

        const blob = await response.blob()

        const base64 = await blobToBase64(blob)

        await writeBinaryFile(storagePath, base64)

        await setIndexEntry(indexKey, {
            kind: 'font',
            path: storagePath,
            etag: response.headers.get('etag'),
            lastModified: response.headers.get('last-modified'),
            size: blob.size,
        })

        return { status: 'updated' }
    } catch (syncError) {
        return { status: 'failed', error: syncError }
    }
}


const buildFontCss = async ({ useDataUrls = false } = {}) => {
    const blocks = []

    for (const face of FONT_FACES) {
        const sources = []

        for (const file of face.files) {
            const storagePath = getFontStoragePath(file.remote)

            const exists = await fileExists(storagePath)

            if (!exists) {
                continue
            }

            if (useDataUrls) {
                const base64 = await readBinaryFileAsBase64(storagePath)

                if (!base64) {
                    continue
                }

                sources.push(`url('data:font/${file.format};base64,${base64}') format('${file.format}')`)
            } else {
                const localUrl = await getNativeFileUrl(storagePath)

                sources.push(`url('${localUrl}') format('${file.format}')`)
            }
        }

        if (sources.length === 0) {
            continue
        }

        blocks.push(
            `@font-face{font-family:'${face.family}';src:${sources.join(',')};font-weight:normal;font-style:normal;font-display:swap;}`
        )
    }

    return blocks.join('\n')
}


const injectFontCss = (cssText) => {
    if (!cssText || typeof document === 'undefined') {
        return
    }

    let styleElement = document.getElementById(FONT_STYLE_ELEMENT_ID)

    if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = FONT_STYLE_ELEMENT_ID
        styleElement.setAttribute('data-harvest-offline', 'fonts')
    }

    styleElement.textContent = cssText

    document.head.appendChild(styleElement)
}


const verifyAndRepairFonts = async () => {
    if (typeof document === 'undefined' || !document.fonts) {
        return { repaired: false }
    }

    try {
        await Promise.all(
            FONT_FACES.map((face) => document.fonts.load(`16px '${face.family}'`).catch(() => null))
        )

        await document.fonts.ready

        const broken = FONT_FACES.filter((face) => !document.fonts.check(`16px '${face.family}'`))

        if (broken.length === 0) {
            return { repaired: false }
        }

        console.warn('[offline-fonts] Falling back to inline font data for', broken.map((face) => face.family))

        const dataUrlCss = await buildFontCss({ useDataUrls: true })

        if (dataUrlCss) {
            injectFontCss(dataUrlCss)

            await writeTextFile(FONT_CSS_STORAGE_PATH, dataUrlCss)
        }

        return { repaired: true }
    } catch (verifyError) {
        console.warn('[offline-fonts] Could not verify the injected fonts', verifyError)

        return { repaired: false }
    }
}

const applyCachedFonts = async () => {
    if (!isNativeRuntime()) {
        return { applied: false }
    }

    try {
        const hasCss = await fileExists(FONT_CSS_STORAGE_PATH)

        if (hasCss) {
            const cssText = await readTextFile(FONT_CSS_STORAGE_PATH)

            if (cssText) {
                injectFontCss(cssText)

                return { applied: true, source: 'cached-css' }
            }
        }

        const rebuilt = await buildFontCss()

        if (rebuilt) {
            injectFontCss(rebuilt)

            await writeTextFile(FONT_CSS_STORAGE_PATH, rebuilt)

            return { applied: true, source: 'rebuilt' }
        }

        return { applied: false }
    } catch (applyError) {
        console.warn('[offline-fonts] Could not apply cached fonts', applyError)

        return { applied: false }
    }
}


const prefetchAllFonts = async ({ force = false, onProgress } = {}) => {
    if (!isNativeRuntime()) {
        return { skipped: true }
    }

    const online = await isOnline()

    if (!online) {
        return { skipped: true, reason: 'offline' }
    }

    const files = FONT_FACES.flatMap((face) => face.files.map((file) => file.remote))

    let completed = 0
    let updated = 0
    let unchanged = 0
    let failed = 0

    const CONCURRENCY = 4

    const queue = [...files]

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0) {
            const remotePath = queue.shift()

            if (!remotePath) {
                continue
            }

            const result = await syncFontFile(remotePath, { force })

            if (result.status === 'updated') {
                updated += 1
            } else if (result.status === 'unchanged') {
                unchanged += 1
            } else {
                failed += 1
            }

            completed += 1

            if (onProgress) {
                onProgress(Math.round((completed / files.length) * 100))
            }
        }
    })

    await Promise.all(workers)

    await flushIndexNow()

    if (updated > 0 || failed < files.length) {
        const cssText = await buildFontCss()

        if (cssText) {
            await writeTextFile(FONT_CSS_STORAGE_PATH, cssText)

            injectFontCss(cssText)

            await verifyAndRepairFonts()
        }
    }

    return { skipped: false, total: files.length, updated, unchanged, failed }
}


export {
    FONT_FACES,
    applyCachedFonts,
    prefetchAllFonts,
    verifyAndRepairFonts,
}

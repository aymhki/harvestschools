import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { spawn, spawnSync } from 'child_process'

const MIME_TYPES = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',  gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml',
    avif: 'image/avif', ico: 'image/x-icon',
    mp4: 'video/mp4',  webm: 'video/webm',
    pdf: 'application/pdf',
    woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf',
    json: 'application/json',
}

const THUMBNAIL_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v']
const THUMBNAIL_DEFAULT_WIDTH = 1280
const THUMBNAIL_MIN_WIDTH = 160
const THUMBNAIL_MAX_WIDTH = 1600
const THUMBNAIL_MAX_PARALLEL_JOBS = 3
const THUMBNAIL_TIMEOUT_MS = 25000

const inFlightThumbnails = new Map()
const queuedThumbnails = []

let runningThumbnailJobs = 0
let resolvedFfmpegPath


function ffmpegCandidates() {
    const configured = process.env.HARVEST_FFMPEG_PATH

    if (process.platform === 'win32') {
        return [
            configured,
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe',
            'ffmpeg.exe',
        ].filter(Boolean)
    }

    return [
        configured,
        '/bin/ffmpeg',
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/opt/homebrew/bin/ffmpeg',
        '/usr/local/opt/ffmpeg/bin/ffmpeg',
        '/opt/local/bin/ffmpeg',
        '/snap/bin/ffmpeg',
        'ffmpeg',
    ].filter(Boolean)
}


function findFfmpeg() {
    if (resolvedFfmpegPath !== undefined) {
        return resolvedFfmpegPath
    }

    resolvedFfmpegPath = null

    for (const candidate of ffmpegCandidates()) {
        const isPathLookup = path.basename(candidate) === candidate

        if (!isPathLookup && !fs.existsSync(candidate)) {
            continue
        }

        const probe = spawnSync(candidate, ['-version'], { encoding: 'utf-8', timeout: 10000 })

        if (probe.status === 0 && String(probe.stdout).toLowerCase().includes('ffmpeg version')) {
            resolvedFfmpegPath = candidate
            break
        }
    }

    if (resolvedFfmpegPath === null) {
        console.warn('[serve-local-assets] No working ffmpeg was found, so video thumbnails fall back to the browser.')
    }

    return resolvedFfmpegPath
}


function runThumbnailJob(ffmpegPath, sourcePath, seconds, width, destinationPath) {
    return new Promise((resolve) => {
        const attempts = seconds > 0 ? [seconds, 0] : [0]

        const attempt = (index) => {
            if (index >= attempts.length) {
                resolve(false)
                return
            }

            const child = spawn(ffmpegPath, [
                '-nostdin',
                '-hide_banner',
                '-loglevel', 'error',
                '-ss', attempts[index].toFixed(3),
                '-i', sourcePath,
                '-frames:v', '1',
                '-an',
                '-vf', `scale='min(${width},iw)':-2`,
                '-q:v', '4',
                '-f', 'image2',
                '-y',
                destinationPath,
            ], { stdio: 'ignore', timeout: THUMBNAIL_TIMEOUT_MS })

            const finish = (succeeded) => {
                if (succeeded && fs.existsSync(destinationPath) && fs.statSync(destinationPath).size > 0) {
                    resolve(true)
                    return
                }

                if (fs.existsSync(destinationPath)) {
                    fs.rmSync(destinationPath, { force: true })
                }

                attempt(index + 1)
            }

            child.on('error', () => finish(false))
            child.on('close', (code) => finish(code === 0))
        }

        attempt(0)
    })
}


function drainThumbnailQueue() {
    while (runningThumbnailJobs < THUMBNAIL_MAX_PARALLEL_JOBS && queuedThumbnails.length > 0) {
        const job = queuedThumbnails.shift()

        runningThumbnailJobs += 1

        job().finally(() => {
            runningThumbnailJobs -= 1
            drainThumbnailQueue()
        })
    }
}


function buildThumbnail(ffmpegPath, sourcePath, seconds, width, destinationPath) {
    if (inFlightThumbnails.has(destinationPath)) {
        return inFlightThumbnails.get(destinationPath)
    }

    const pending = new Promise((resolve) => {
        queuedThumbnails.push(() => runThumbnailJob(ffmpegPath, sourcePath, seconds, width, destinationPath).then(resolve))
        drainThumbnailQueue()
    }).finally(() => inFlightThumbnails.delete(destinationPath))

    inFlightThumbnails.set(destinationPath, pending)

    return pending
}


function sendThumbnailFailure(res, status, message) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ success: false, message }))
}


async function serveThumbnail(res, sourcePath, cacheDir, query) {
    const ffmpegPath = findFfmpeg()

    if (!ffmpegPath) {
        sendThumbnailFailure(res, 503, 'No video toolchain is available on this host.')
        return
    }

    const seconds = Math.round(Math.max(0, Number.parseFloat(query.get('thumbnail')) || 0) * 10) / 10
    const requestedWidth = Number.parseInt(query.get('w'), 10)
    const width = Number.isFinite(requestedWidth)
        ? Math.min(THUMBNAIL_MAX_WIDTH, Math.max(THUMBNAIL_MIN_WIDTH, requestedWidth))
        : THUMBNAIL_DEFAULT_WIDTH

    const stat = fs.statSync(sourcePath)
    const cacheKey = crypto.createHash('md5').update(`${sourcePath}|${stat.mtimeMs}|${stat.size}|${seconds}|${width}`).digest('hex')
    const cachePath = path.join(cacheDir, `${cacheKey}.jpg`)

    if (!fs.existsSync(cachePath)) {
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true })
        }

        const built = await buildThumbnail(ffmpegPath, sourcePath, seconds, width, cachePath)

        if (!built) {
            sendThumbnailFailure(res, 503, 'The thumbnail could not be generated.')
            return
        }
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Content-Length', fs.statSync(cachePath).size)
    res.setHeader('Cache-Control', 'no-cache')

    fs.createReadStream(cachePath).pipe(res)
}


export function serveLocalAssets(localAssetsDir, options = {}) {
    const resolvedBase = path.resolve(localAssetsDir)
    const prefixes = options.prefixes || ['/assets', '/images', '/videos', '/fonts', '/documents', '/locales']
    const thumbnailCacheDir = options.thumbnailCacheDir || path.resolve(resolvedBase, '..', 'node_modules', '.cache', 'harvest-video-thumbnails')

    return {
        name: 'serve-local-assets',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const [rawPath, rawQuery] = req.url.split('?')
                const cleanUrl = decodeURIComponent(rawPath)

                const matchedPrefix = prefixes.find(prefix => cleanUrl.startsWith(prefix))
                if (!matchedPrefix) return next()

                let assetPath
                if (matchedPrefix === '/assets') {
                    assetPath = cleanUrl.slice('/assets'.length)
                } else {
                    assetPath = cleanUrl
                }

                const relativeAssetPath = assetPath.replace(/^\/+/, '')
                const filePath = path.resolve(resolvedBase, relativeAssetPath)

                if (!filePath.startsWith(resolvedBase + path.sep)) {
                    console.warn(`[serve-local-assets] Traversal attempt blocked: ${cleanUrl}`)
                    res.statusCode = 403
                    res.end('Forbidden')
                    return
                }

                if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                    return next()
                }

                const ext  = path.extname(filePath).slice(1).toLowerCase()
                const mime = MIME_TYPES[ext]

                if (!mime) {
                    console.warn(`[serve-local-assets] No MIME type for extension: .${ext}`)
                    return next()
                }

                const query = new URLSearchParams(rawQuery || '')

                if (query.has('thumbnail')) {
                    if (!THUMBNAIL_EXTENSIONS.includes(ext)) {
                        sendThumbnailFailure(res, 403, 'Type not permitted.')
                        return
                    }

                    serveThumbnail(res, filePath, thumbnailCacheDir, query).catch((thumbnailError) => {
                        console.error(`[serve-local-assets] Thumbnail error: ${thumbnailError.message}`)

                        if (!res.headersSent) {
                            sendThumbnailFailure(res, 503, 'The thumbnail could not be generated.')
                        }
                    })

                    return
                }

                const stat = fs.statSync(filePath)
                const fileSize = stat.size
                const range = req.headers.range

                res.setHeader('Content-Type', mime)
                res.setHeader('Accept-Ranges', 'bytes')
                res.setHeader('Cache-Control', 'no-cache')

                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-")
                    const start = parseInt(parts[0], 10)
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

                    if (start >= fileSize || start > end) {
                        res.statusCode = 416
                        res.setHeader('Content-Range', `bytes */${fileSize}`)
                        return res.end()
                    }

                    const chunksize = (end - start) + 1
                    const stream = fs.createReadStream(filePath, { start, end })

                    res.statusCode = 206
                    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
                    res.setHeader('Content-Length', chunksize)

                    stream.on('error', (err) => {
                        console.error(`[serve-local-assets] Stream error: ${err.message}`)
                        if (!res.headersSent) {
                            res.statusCode = 500
                            res.end('Internal server error')
                        }
                    })

                    stream.pipe(res)
                } else {
                    res.statusCode = 200
                    res.setHeader('Content-Length', fileSize)

                    const stream = fs.createReadStream(filePath)
                    stream.on('error', (err) => {
                        console.error(`[serve-local-assets] Stream error: ${err.message}`)
                        if (!res.headersSent) {
                            res.statusCode = 500
                            res.end('Internal server error')
                        }
                    })

                    stream.pipe(res)
                }
            })
        }
    }
}

import fs from 'fs'
import path from 'path'

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

export function serveLocalAssets(localAssetsDir, options = {}) {
    const resolvedBase = path.resolve(localAssetsDir)
    const prefixes = options.prefixes || ['/assets', '/images', '/videos', '/fonts', '/documents', '/locales']

    return {
        name: 'serve-local-assets',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const cleanUrl = decodeURIComponent(req.url.split('?')[0])

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
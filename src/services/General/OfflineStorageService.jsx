import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import { Preferences } from '@capacitor/preferences'


let filesystemModule = null
const OFFLINE_ROOT = 'harvest-offline'
const OFFLINE_INDEX_KEY = 'harvest_offline_asset_index'
const OFFLINE_INDEX_WRITE_DEBOUNCE_MS = 400
let cachedIndex = null
let indexWriteTimer = null
let indexWritePromise = null
const isNativeRuntime = () => Capacitor.isNativePlatform()

const loadFilesystem = async () => {
    if (filesystemModule) {
        return filesystemModule
    }

    const imported = await import('@capacitor/filesystem')

    filesystemModule = {
        Filesystem: imported.Filesystem,
        Directory: imported.Directory,
        Encoding: imported.Encoding,
    }

    return filesystemModule
}


const isOnline = async () => {
    try {
        const status = await Network.getStatus()

        return status.connected
    } catch (networkError) {
        console.warn('[offline-store] Could not read network status, assuming online', networkError)

        return true
    }
}


const hashString = (value) => {
    let hash = 0x811c9dc5

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 0x01000193)
    }

    return (hash >>> 0).toString(36) + '-' + value.length.toString(36)
}


const readIndex = async () => {
    if (cachedIndex) {
        return cachedIndex
    }

    try {
        const { value } = await Preferences.get({ key: OFFLINE_INDEX_KEY })
        cachedIndex = value ? JSON.parse(value) : {}
    } catch (indexError) {
        console.warn('[offline-store] Could not read the asset index, starting fresh', indexError)

        cachedIndex = {}
    }

    return cachedIndex
}


const flushIndex = async () => {
    if (!cachedIndex) {
        return
    }

    try {
        await Preferences.set({ key: OFFLINE_INDEX_KEY, value: JSON.stringify(cachedIndex) })
    } catch (indexError) {
        console.warn('[offline-store] Could not persist the asset index', indexError)
    }
}


const scheduleIndexFlush = () => {
    if (indexWriteTimer) {
        clearTimeout(indexWriteTimer)
    }

    indexWriteTimer = setTimeout(() => {
        indexWriteTimer = null
        indexWritePromise = flushIndex()
    }, OFFLINE_INDEX_WRITE_DEBOUNCE_MS)
}


const flushIndexNow = async () => {
    if (indexWriteTimer) {
        clearTimeout(indexWriteTimer)
        indexWriteTimer = null
    }

    indexWritePromise = flushIndex()

    return indexWritePromise
}


const getIndexEntry = async (key) => {
    const index = await readIndex()

    return index[key] || null
}


const setIndexEntry = async (key, entry) => {
    const index = await readIndex()

    index[key] = { ...(index[key] || {}), ...entry, updatedAt: Date.now() }

    scheduleIndexFlush()

    return index[key]
}


const removeIndexEntry = async (key) => {
    const index = await readIndex()

    delete index[key]

    scheduleIndexFlush()
}


const getAllIndexEntries = async () => {
    const index = await readIndex()

    return Object.entries(index).map(([key, entry]) => ({ key, ...entry }))
}


const buildFilePath = (relativePath) => `${OFFLINE_ROOT}/${relativePath.replace(/^\/+/, '')}`


const ensureDirectoryFor = async (relativePath) => {
    const { Filesystem, Directory } = await loadFilesystem()

    const fullPath = buildFilePath(relativePath)

    const directoryPath = fullPath.split('/').slice(0, -1).join('/')

    if (!directoryPath) {
        return
    }

    try {
        await Filesystem.mkdir({ path: directoryPath, directory: Directory.Data, recursive: true })
    } catch (mkdirError) {
        const message = String(mkdirError && mkdirError.message ? mkdirError.message : mkdirError)

        if (!message.toLowerCase().includes('exist')) {
            console.warn(`[offline-store] Could not create directory "${directoryPath}"`, mkdirError)
        }
    }
}


const writeTextFile = async (relativePath, data) => {
    const { Filesystem, Directory, Encoding } = await loadFilesystem()

    await ensureDirectoryFor(relativePath)

    await Filesystem.writeFile({
        path: buildFilePath(relativePath),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        data,
        recursive: true,
    })
}


const readTextFile = async (relativePath) => {
    const { Filesystem, Directory, Encoding } = await loadFilesystem()

    const result = await Filesystem.readFile({
        path: buildFilePath(relativePath),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
    })

    return typeof result.data === 'string' ? result.data : ''
}


const writeBinaryFile = async (relativePath, base64Data) => {
    const { Filesystem, Directory } = await loadFilesystem()

    await ensureDirectoryFor(relativePath)

    await Filesystem.writeFile({
        path: buildFilePath(relativePath),
        directory: Directory.Data,
        data: base64Data,
        recursive: true,
    })
}


const readBinaryFileAsBase64 = async (relativePath) => {
    const { Filesystem, Directory } = await loadFilesystem()

    const result = await Filesystem.readFile({
        path: buildFilePath(relativePath),
        directory: Directory.Data,
    })

    return typeof result.data === 'string' ? result.data : ''
}


const getNativeFileUrl = async (relativePath) => {
    const { Filesystem, Directory } = await loadFilesystem()

    const result = await Filesystem.getUri({
        path: buildFilePath(relativePath),
        directory: Directory.Data,
    })

    return Capacitor.convertFileSrc(result.uri)
}


const fileExists = async (relativePath) => {
    const { Filesystem, Directory } = await loadFilesystem()

    try {
        await Filesystem.stat({ path: buildFilePath(relativePath), directory: Directory.Data })

        return true
    } catch {
        return false
    }
}


const deleteStoredFile = async (relativePath) => {
    const { Filesystem, Directory } = await loadFilesystem()

    try {
        await Filesystem.deleteFile({ path: buildFilePath(relativePath), directory: Directory.Data })
    } catch (deleteError) {
        console.warn(`[offline-store] Could not delete "${relativePath}"`, deleteError)
    }
}


const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Could not read the downloaded file'))

    reader.onload = () => {
        const result = String(reader.result || '')
        const separatorIndex = result.indexOf(',')

        resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result)
    }

    reader.readAsDataURL(blob)
})


const fetchWithTimeout = async (url, { timeoutMs = 12000, headers = {}, cache = 'no-store' } = {}) => {
    const controller = new AbortController()

    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

    try {
        return await fetch(url, { headers, cache, signal: controller.signal })
    } finally {
        clearTimeout(timeoutHandle)
    }
}


const clearOfflineStore = async () => {
    const { Filesystem, Directory } = await loadFilesystem()

    try {
        await Filesystem.rmdir({ path: OFFLINE_ROOT, directory: Directory.Data, recursive: true })
    } catch (removeError) {
        console.warn('[offline-store] Could not clear the offline store', removeError)
    }

    cachedIndex = {}

    await flushIndexNow()
}


export {
    OFFLINE_ROOT,
    isNativeRuntime,
    isOnline,
    hashString,
    getIndexEntry,
    setIndexEntry,
    removeIndexEntry,
    getAllIndexEntries,
    flushIndexNow,
    writeTextFile,
    readTextFile,
    writeBinaryFile,
    readBinaryFileAsBase64,
    getNativeFileUrl,
    fileExists,
    deleteStoredFile,
    blobToBase64,
    fetchWithTimeout,
    clearOfflineStore,
}

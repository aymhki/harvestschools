import { Share } from '@capacitor/share'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { isNativeRuntime, blobToBase64 } from './OfflineStorageService.jsx'


const SHARED_FILES_FOLDER = 'shared'


const writeSharedFile = async (fileName, base64Data) => {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    const path = `${SHARED_FILES_FOLDER}/${fileName}`

    try {
        await Filesystem.mkdir({ path: SHARED_FILES_FOLDER, directory: Directory.Cache, recursive: true })
    } catch (directoryError) {
        const message = String(directoryError && directoryError.message ? directoryError.message : directoryError)

        if (!message.toLowerCase().includes('exist')) {
            console.warn('[native-share] Could not create the shared files folder', directoryError)
        }
    }

    await Filesystem.writeFile({ path, directory: Directory.Cache, data: base64Data, recursive: true })
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
    return uri
}


const shareFileFromBlob = async (blob, fileName, title) => {
    let shared = false

    if (isNativeRuntime()) {
        const base64 = await blobToBase64(blob)
        const uri = await writeSharedFile(fileName, base64)
        await Share.share({ title, files: [uri] })
        Haptics.notification({ type: NotificationType.Success }).catch(() => null)
        shared = true
    }

    return shared
}


export {
    shareFileFromBlob,
}

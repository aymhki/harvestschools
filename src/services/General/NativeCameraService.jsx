import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNativeRuntime } from './OfflineStorageService.jsx'


const CAPTURE_QUALITY = 60
const CAPTURE_MAX_WIDTH = 1280
const CAPTURE_MIME_TYPE = 'image/jpeg'
const CAPTURE_FILE_EXTENSION = 'jpg'
const CANCELLED_MESSAGE_HINTS = ['cancel', 'no image picked']
const buildCapturedFileName = () => `photo-${Date.now()}.${CAPTURE_FILE_EXTENSION}`
const isCameraAvailable = () => isNativeRuntime()


const wasCancelled = (captureError) => {
    const message = String(captureError && captureError.message ? captureError.message : captureError).toLowerCase()

    return CANCELLED_MESSAGE_HINTS.some((hint) => message.includes(hint))
}


const base64ToBlob = (base64, mimeType) => {
    const binary = atob(base64)

    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }

    return new Blob([bytes], { type: mimeType })
}


const capturePhotoAsFile = async () => {
    let capturedFile = null

    if (isCameraAvailable()) {
        let photo = null

        try {
            photo = await Camera.getPhoto({
                quality: CAPTURE_QUALITY,
                width: CAPTURE_MAX_WIDTH,
                correctOrientation: true,
                allowEditing: false,
                saveToGallery: false,
                source: CameraSource.Camera,
                resultType: CameraResultType.Base64,
                presentationStyle: 'fullscreen',
            })
        } catch (captureError) {
            console.warn('[camera] getPhoto failed', captureError)

            if (!wasCancelled(captureError)) {
                throw captureError
            }
        }

        if (photo && photo.base64String) {
            const mimeType = photo.format ? `image/${photo.format}` : CAPTURE_MIME_TYPE

            capturedFile = new File([base64ToBlob(photo.base64String, mimeType)], buildCapturedFileName(), {
                type: mimeType,
            })
        }
    }

    return capturedFile
}


export {
    capturePhotoAsFile,
    isCameraAvailable,
}

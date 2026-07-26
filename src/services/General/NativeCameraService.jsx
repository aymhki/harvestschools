import { Camera } from '@capacitor/camera'
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


const capturePhotoAsFile = async () => {
    let capturedFile = null

    if (isCameraAvailable()) {
        let photo = null

        try {
            photo = await Camera.takePhoto({
                quality: CAPTURE_QUALITY,
                targetWidth: CAPTURE_MAX_WIDTH,
                correctOrientation: true,
                editable: 'in-app',
                saveToGallery: false,
                presentationStyle: 'fullscreen',
            })
        } catch (captureError) {
            console.warn('[camera] getPhoto failed', captureError)

            if (!wasCancelled(captureError)) {
                throw captureError
            }
        }

        if (photo && photo.webPath) {
            const response = await fetch(photo.webPath)

            const blob = await response.blob()

            capturedFile = new File([blob], buildCapturedFileName(), {
                type: blob.type || CAPTURE_MIME_TYPE,
            })
        }
    }

    return capturedFile
}


export {
    capturePhotoAsFile,
    isCameraAvailable,
}

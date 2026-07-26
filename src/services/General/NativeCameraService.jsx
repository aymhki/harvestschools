import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNativeRuntime } from './OfflineStorageService.jsx'


const CAPTURE_QUALITY = 60
const CAPTURE_MAX_WIDTH = 1280
const CAPTURE_MIME_TYPE = 'image/jpeg'
const CAPTURE_FILE_EXTENSION = 'jpg'
const buildCapturedFileName = () => `photo-${Date.now()}.${CAPTURE_FILE_EXTENSION}`
const isCameraAvailable = () => isNativeRuntime()


const capturePhotoAsFile = async () => {
    let capturedFile = null

    if (isCameraAvailable()) {
        const photo = await Camera.getPhoto({
            quality: CAPTURE_QUALITY,
            width: CAPTURE_MAX_WIDTH,
            correctOrientation: true,
            allowEditing: false,
            saveToGallery: false,
            source: CameraSource.Camera,
            resultType: CameraResultType.Uri,
            presentationStyle: 'fullscreen',
        })

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

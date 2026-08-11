import {endpoints, isDevelopment} from "./GeneralUtils.jsx";
import { Capacitor } from '@capacitor/core';

const submitFormRequest = async (formData) => {
    try {
        const response = await fetch(endpoints.submitForm, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            if (result.message) {
                return `${result.message}`;
            } else {
                return 'Form submission failed. Please try again.';
            }
        }
    } catch (error) {
        return error.message;
    }
}


function servePublicAsset(path, options = {}) {
    const { w, h, format, quality, download, filename, thumbnailAt, root } = options

    const wantsThumbnail = thumbnailAt !== undefined && thumbnailAt !== null

    const isRepositoryAsset = !root || root === 'assets'

    if (isDevelopment() && !Capacitor.isNativePlatform() && isRepositoryAsset) {
        if (!wantsThumbnail) return `/assets/${path}`

        const devParams = new URLSearchParams({ thumbnail: String(thumbnailAt) })

        if (w) devParams.set('w', w)

        return `/assets/${path}?${devParams.toString()}`
    }

    if (wantsThumbnail) {
        const thumbnailParams = new URLSearchParams({ path, t: String(thumbnailAt) })

        if (w)                 thumbnailParams.set('w', w)
        if (!isRepositoryAsset) thumbnailParams.set('root', root)

        return `${endpoints.servePublicVideoThumbnail}?${thumbnailParams.toString()}`
    }

    const params = new URLSearchParams({ path })

    if (!isRepositoryAsset) params.set('root', root)

    if (w)        params.set('w', w)
    if (h)        params.set('h', h)
    if (format)   params.set('format', format)
    if (quality)  params.set('quality', quality)
    if (download) params.set('download', '1')
    if (filename) params.set('filename', filename)


    return `${endpoints.servePublicAssetFile}?${params.toString()}`
}

export {
    submitFormRequest,
    servePublicAsset
}
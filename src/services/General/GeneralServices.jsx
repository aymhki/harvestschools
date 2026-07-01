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
    if (isDevelopment() && !Capacitor.isNativePlatform()) return `/assets/${path}`

    const { w, h, format, quality, download, filename } = options
    const params = new URLSearchParams({ path })

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
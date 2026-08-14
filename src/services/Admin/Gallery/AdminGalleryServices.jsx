import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders, EMBEDDABLE_EXTENSIONS, getMimeType, isDevelopment} from "../../General/GeneralUtils.jsx";
import {servePublicAsset} from "../../General/GeneralServices.jsx";


const GALLERY_MEDIA_ROOT = 'gallery';
const galleryFileUrl = (path) => servePublicAsset(path, {root: GALLERY_MEDIA_ROOT});


const serveGalleryFile = async (searchParams, setIsLoading, setError, setCanEmbed, setMimeType, setFilename, setFileBlobUrl) => {
    const filePath = searchParams.get('file');

    if (!filePath) {
        setError('No file was specified.');
        setIsLoading(false);
        return;
    }

    try {
        const decodedFilename = decodeURIComponent(filePath.split('/').pop());
        setFilename(decodedFilename);
        const extension = decodedFilename.split('.').pop().toLowerCase();
        setCanEmbed(EMBEDDABLE_EXTENSIONS.includes(extension));
        setMimeType(getMimeType(extension));
    } catch (nameError) {
        setFilename('download');
        setCanEmbed(false);
    }

    try {
        const url = galleryFileUrl(filePath);
        const response = await fetch(url, {method: 'HEAD'});

        if (!response.ok) {
            setError(`That file could not be opened (Code: ${response.status})`);
        } else {
            setFileBlobUrl(url);
        }
    } catch (error) {
        setError(error.message);
    } finally {
        setIsLoading(false);
    }
}


const fetchGallery = async (navigate, {collageId = ''} = {}) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return null;
    }

    try {
        const params = new URLSearchParams();

        if (collageId) {
            params.set('collage', collageId);
        }

        const query = params.toString();

        const response = await fetch(`${endpoints.getGallery}${query ? `?${query}` : ''}`, {
            method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        if (result && result.message) {
            console.log(result.message);
        }

        if (result && result.code && (result.code === 401 || result.code === 403)) {
            navigate(adminLoginPageUrl, { replace: true });
        }

        return null;
    } catch (error) {
        console.log(error.message);

        return null;
    }
}


const postToGallery = async (endpoint, payload, fallbackMessage, signal) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoint, {method: 'POST',
            body: JSON.stringify(payload),
            headers: await buildAuthHeaders(sessionId),
            signal
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        return (result && result.message) || fallbackMessage;
    } catch (error) {
        return error.message;
    }
}


const sendGalleryForm = async (endpoint, formData, fallbackMessage) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const headers = await buildAuthHeaders(sessionId);

        delete headers['Content-Type'];

        const response = await fetch(endpoint, {method: 'POST', body: formData, headers});
        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        return (result && result.message) || fallbackMessage;
    } catch (error) {
        return error.message;
    }
}


const addCollage = async ({titleEn, titleAr, layout, placement, afterId}, photoFiles) => {
    const formData = new FormData();

    formData.append('title_en', titleEn);
    formData.append('title_ar', titleAr);
    formData.append('layout', layout);
    formData.append('placement', placement || 'end');
    formData.append('after_id', String(afterId || 0));

    photoFiles.forEach((photo) => formData.append('photos[]', photo));

    return sendGalleryForm(endpoints.addCollage, formData, 'An error occurred while creating the collage.');
}


const addCollagePhotos = async (collageId, photoFiles) => {
    const formData = new FormData();

    formData.append('collage_id', String(collageId));

    photoFiles.forEach((photo) => formData.append('photos[]', photo));

    return sendGalleryForm(endpoints.addCollagePhotos, formData, 'An error occurred while adding the photos.');
}


const updateCollage = async (payload) =>
    postToGallery(endpoints.updateCollage, payload, 'An error occurred while updating the collage.');

const deleteCollage = async (collageId) =>
    postToGallery(endpoints.deleteCollage, {collage_id: collageId}, 'An error occurred while deleting the collage.');

const deleteCollagePhoto = async (photoId) =>
    postToGallery(endpoints.deleteCollagePhoto, {photo_id: photoId}, 'An error occurred while deleting the photo.');

const updateVideo = async (payload) =>
    postToGallery(endpoints.updateVideo, payload, 'An error occurred while updating the video.');

const deleteVideo = async (videoId) =>
    postToGallery(endpoints.deleteVideo, {video_id: videoId}, 'An error occurred while deleting the video.');


const beginVideoUpload = async ({titleEn, titleAr, fileName, totalBytes}) =>
    postToGallery(endpoints.beginVideoUpload, {
        title_en: titleEn,
        title_ar: titleAr,
        file_name: fileName,
        total_bytes: totalBytes,
        is_production: !isDevelopment(),
    }, 'The upload could not be started.');


class UploadCancelledError extends Error {
    constructor() {
        super('Upload cancelled.');
        this.name = 'UploadCancelledError';
    }
}


const cancelVideoUpload = async (videoId, {keepalive = false} = {}) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.cancelVideoUpload, {
            method: 'POST',
            body: JSON.stringify({video_id: videoId}),
            headers: await buildAuthHeaders(sessionId),
            keepalive,
        });

        const result = await response.json();

        return result && result.success ? result : ((result && result.message) || 'The upload could not be cancelled.');
    } catch (error) {
        return error.message;
    }
}


const prepareUploadDiscard = async (videoId) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return () => {};
        }

        const headers = await buildAuthHeaders(sessionId);

        return () => {
            try {
                fetch(endpoints.cancelVideoUpload, {
                    method: 'POST',
                    body: JSON.stringify({video_id: videoId}),
                    headers,
                    keepalive: true,
                });
            } catch (error) {
                console.log(error.message);
            }
        };
    } catch (error) {
        console.log(error.message);

        return () => {};
    }
}


const runVideoUpload = async (videoId, chunkSize, file, {titleEn, titleAr, thumbnailAt, placement, afterId, onProgress, signal} = {}) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        return 'Session expired';
    }

    const headers = await buildAuthHeaders(sessionId);

    delete headers['Content-Type'];

    const report = (phase, sentBytes) => {
        if (typeof onProgress === 'function') {
            onProgress({
                phase,
                sentBytes,
                totalBytes: file.size,
                percent: file.size > 0 ? Math.min(100, Math.floor((sentBytes / file.size) * 100)) : 100,
            });
        }
    };

    const stopIfCancelled = () => {
        if (signal && signal.aborted) {
            throw new UploadCancelledError();
        }
    };

    let offset = 0;

    stopIfCancelled();
    report('uploading', 0);

    while (offset < file.size) {
        const formData = new FormData();

        formData.append('video_id', String(videoId));
        formData.append('offset', String(offset));
        formData.append('total_bytes', String(file.size));
        formData.append('chunk', file.slice(offset, offset + chunkSize));

        let result;

        try {
            const response = await fetch(endpoints.uploadVideoChunk, {method: 'POST', body: formData, headers, signal});
            result = await response.json();
        } catch (error) {
            stopIfCancelled();
            throw error;
        }

        if (!result || !result.success) {
            if (result && typeof result.resumeFrom === 'number' && result.resumeFrom !== offset) {
                offset = result.resumeFrom;
                report('uploading', offset);
                continue;
            }

            return (result && result.message) || 'The upload failed part way through.';
        }

        offset = result.receivedBytes;
        report('uploading', offset);
        stopIfCancelled();
    }

    stopIfCancelled();
    report('finishing', file.size);

    const finished = await postToGallery(endpoints.finishVideoUpload, {
        video_id: videoId,
        source_name: file.name,
        placement: placement || 'end',
        after_id: afterId || 0,
    }, 'The upload could not be finished.', signal);

    stopIfCancelled();


    if (finished && finished.success && Number(thumbnailAt) > 0) {
        await updateVideo({
            video_id: videoId,
            title_en: titleEn,
            title_ar: titleAr,
            thumbnail_at: Number(thumbnailAt),
            is_public: true,
        });
    }

    report('done', file.size);

    return finished;
}


const fetchVideoUploadStatuses = async () => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return [];
        }

        const response = await fetch(endpoints.getVideoUploadStatus, {
            method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        return result && result.success ? result.statuses : [];
    } catch (error) {
        console.log(error.message);

        return [];
    }
}


export {
    fetchGallery,
    galleryFileUrl,
    serveGalleryFile,
    beginVideoUpload,
    runVideoUpload,
    cancelVideoUpload,
    prepareUploadDiscard,
    UploadCancelledError,
    fetchVideoUploadStatuses,
    addCollage,
    addCollagePhotos,
    updateCollage,
    deleteCollage,
    deleteCollagePhoto,
    updateVideo,
    deleteVideo,
    GALLERY_MEDIA_ROOT
}

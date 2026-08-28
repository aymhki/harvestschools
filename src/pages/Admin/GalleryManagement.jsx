import '../../styles/AdminDashboard.css';
import {useNavigate, useSearchParams} from "react-router";
import {useEffect, useMemo, useRef, useState} from "react";
import {Capacitor} from "@capacitor/core";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import FancyList from "../../modules/FancyList.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {msgTimeout, galleryManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";
import {
    fetchGallery,
    addCollage,
    addCollagePhotos,
    updateCollage,
    deleteCollage,
    deleteCollagePhoto,
    updateVideo,
    deleteVideo,
    beginVideoUpload,
    runVideoUpload,
    cancelVideoUpload,
    prepareUploadDiscard,
    UploadCancelledError,
    fetchVideoUploadStatuses,
    galleryFileUrl
} from "../../services/Admin/Gallery/AdminGalleryServices.jsx";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'
import { rememberedTab } from '../../services/General/TabsMemoryService.jsx';

const photoAltColIndex = 1;
const photoIdColIndex = 4;

const videoTitleEnColIndex = 1;
const videoStatusColIndex = 7;
const videoIdColIndex = 10;

const collageTitleEnFieldId = 1;
const collageTitleArFieldId = 2;
const collageLayoutFieldId = 3;
const collageShownFieldId = 4;
const collagePhotosFieldId = 5;
const PHOTOS_FIELD_LABEL = 'Collage Photos';

const PHOTO_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/heic', 'image/heif',
    '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif',
];

const MAX_PHOTO_BYTES = 1024 * 1024 * 1024;

const photosField = (isRequired) => ({
    id: collagePhotosFieldId,
    type: 'files',
    name: 'photos',
    label: PHOTOS_FIELD_LABEL,
    required: isRequired,
    errorMsg: 'Please choose at least one photo',
    value: '',
    allowedFileTypes: PHOTO_FILE_TYPES,
    maxFileSizeInBytes: MAX_PHOTO_BYTES,
    widthOfField: 1,
    labelOutside: true,
    labelOnTop: true,
    displayLabel: 'Photos',
    httpName: 'photos',
});

const videoTitleEnFieldId = 11;
const videoTitleArFieldId = 12;
const videoLayoutFieldId = 13;
const videoShownFieldId = 14;
const videoFileFieldId = 15;
const videoThumbnailPickerFieldId = 16;
const VIDEO_FIELD_LABEL = 'Video File';
const VIDEO_FILE_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', '.mp4', '.webm', '.mov', '.m4v'];
const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024;
const UPLOAD_POLL_INTERVAL_MS = 2000;
const LAYOUT_CHOICES = ['Wide', 'Narrow'];
const SHOWN_CHOICES = ['Shown on the website', 'Hidden'];

const collagePlacementFieldId = 6;
const collageAfterFieldId = 7;
const videoPlacementFieldId = 17;
const videoAfterFieldId = 18;

const PLACEMENT_KEEP = 'Keep where it is';
const PLACEMENT_TOP = 'At the top';
const PLACEMENT_CHOOSE = 'Choose the position myself';
const PLACEMENT_DATE = 'Use the date from the file';
const PLACEMENT_END = 'At the bottom';
const PLACEMENT_CHOICES = [PLACEMENT_TOP, PLACEMENT_CHOOSE, PLACEMENT_DATE, PLACEMENT_END];

const placementValueOf = (choice) => {
    if (choice === PLACEMENT_KEEP) return 'keep';
    if (choice === PLACEMENT_TOP) return 'top';
    if (choice === PLACEMENT_CHOOSE) return 'after';
    if (choice === PLACEMENT_DATE) return 'date';

    return 'end';
};

const positionChoiceOf = (item, index) => `${index + 1}. ${item.titleEn}`;

const afterFieldFor = (fieldId, items, noun) => ({
    id: fieldId,
    type: 'select',
    name: 'place-after',
    label: 'Place After',
    required: true,
    choices: items.map(positionChoiceOf),
    errorMsg: `Please choose which ${noun} this one should follow`,
    value: '',
    widthOfField: 1,
    labelOutside: true,
    labelOnTop: true,
    displayLabel: 'Place After',
    httpName: 'place-after',
});

const placementFieldFor = (fieldId, afterFieldId, items, noun, canKeep = false) => ({
    id: fieldId,
    type: 'select',
    name: 'placement',
    label: 'Position',
    required: true,
    choices: (canKeep ? [PLACEMENT_KEEP] : []).concat(items.length === 0 ? [PLACEMENT_TOP, PLACEMENT_DATE] : PLACEMENT_CHOICES),
    errorMsg: 'Please choose where it goes',
    value: '',
    defaultValue: canKeep ? PLACEMENT_KEEP : PLACEMENT_TOP,
    widthOfField: 1,
    labelOutside: true,
    labelOnTop: true,
    displayLabel: 'Position',
    httpName: 'placement',
    rules: items.length === 0 ? [] : [
        {value: PLACEMENT_CHOOSE, ruleResult: [afterFieldFor(afterFieldId, items, noun)]},
    ],
});

const layoutChoiceOf = (layout) => (layout === 'narrow' ? LAYOUT_CHOICES[1] : LAYOUT_CHOICES[0]);
const layoutValueOf = (choice) => (choice === LAYOUT_CHOICES[1] ? 'narrow' : 'wide');
const layoutSummaryOf = (layout) => (layout === 'narrow' ? 'narrow' : 'wide');
const shownChoiceOf = (isPublic) => (isPublic ? SHOWN_CHOICES[0] : SHOWN_CHOICES[1]);
const shownValueOf = (choice) => choice === SHOWN_CHOICES[0];

const PHOTOS_TAB = 0;
const VIDEOS_TAB = 1;
const GALLERY_TABS_TITLE = 'Gallery Management';

function GalleryManagement() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useLoading(false);
    const [collages, setCollages] = useState([]);
    const [photosData, setPhotosData] = useState(null);
    const [videosData, setVideosData] = useState(null);
    const [videoRecords, setVideoRecords] = useState([]);

    const [modalType, setModalType] = useState(null);
    const [modalFields, setModalFields] = useState(null);
    const [resetModal, setResetModal] = useState(false);

    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [videoUpload, setVideoUpload] = useState(null);
    const [photoUpload, setPhotoUpload] = useState(null);

    const modalFooterButtonsRef = useRef(null);
    const uploadAbortRef = useRef(null);
    const uploadVideoIdRef = useRef(null);
    const uploadDiscardRef = useRef(null);
    const uploadPromiseRef = useRef(null);
    const photoAbortRef = useRef(null);

    const isUploadingVideo = videoUpload !== null;
    const isUploadingPhotos = photoUpload !== null;
    const isUploadingAnything = isUploadingVideo || isUploadingPhotos;

    const tabParam = searchParams.get('tab');
    const openTab = tabParam
        ? (tabParam === 'videos' ? VIDEOS_TAB : PHOTOS_TAB)
        : (rememberedTab(GALLERY_TABS_TITLE) === VIDEOS_TAB ? VIDEOS_TAB : PHOTOS_TAB);
    const openCollageId = searchParams.get('collage') || '';
    const isTableView = openTab === PHOTOS_TAB && openCollageId !== '';

    const animateModal = useSpring({
        opacity: modalType ? 1 : 0,
        transform: modalType ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateDeleteModal = useSpring({
        opacity: pendingDelete ? 1 : 0,
        transform: pendingDelete ? 'translateY(0)' : 'translateY(-100%)'
    });

    const reloadData = async ({silent = false} = {}) => {
        if (!silent) {
            setIsLoading(true);
        }

        const data = await fetchGallery(navigate, { collageId: openCollageId });

        if (data) {
            setCollages(data.collages || []);
            setPhotosData(data.photos || null);
            setVideosData(data.videos || null);
            setVideoRecords(data.videoRecords || []);
        }

        if (!silent) {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, galleryManagementPermissionLevel, setIsLoading)
            .then(() => {
                reloadData();
            });
    }, [openCollageId]);

    const hasVideoInProgress = useMemo(
        () => videoRecords.some((video) => video.status === 'uploading' || video.status === 'processing'),
        [videoRecords]
    );

    useEffect(() => {
        if (!hasVideoInProgress) {
            return undefined;
        }

        const poll = setInterval(async () => {
            const statuses = await fetchVideoUploadStatuses();

            if (statuses.length === 0) {
                return;
            }

            setVideoRecords((current) => current.map((video) => {
                const update = statuses.find((status) => status.id === video.id);

                return update ? {...video, status: update.status, progressPercent: update.progressPercent} : video;
            }));

            setVideosData((current) => (current === null ? current : current.map((row, rowIndex) => {
                if (rowIndex === 0) {
                    return row;
                }

                const update = statuses.find((status) => String(status.id) === row[videoIdColIndex]);

                if (!update) {
                    return row;
                }

                const label = update.status === 'ready'
                    ? 'Ready'
                    : (update.status === 'failed'
                        ? `Failed: ${update.statusMessage}`
                        : `${update.status.charAt(0).toUpperCase()}${update.status.slice(1)} ${update.progressPercent}%`);

                return row.map((cell, columnIndex) => (columnIndex === videoStatusColIndex ? label : cell));
            })));

            if (statuses.every((status) => status.status !== 'uploading' && status.status !== 'processing')) {
                await reloadData({silent: true});
            }
        }, UPLOAD_POLL_INTERVAL_MS);

        return () => clearInterval(poll);
    }, [hasVideoInProgress]);

    const openCollage = useMemo(
        () => collages.find((collage) => String(collage.id) === openCollageId) || null,
        [collages, openCollageId]
    );

    const showTableView = (collageId) => {
        setSearchParams({ tab: 'photos', collage: String(collageId) });
    };

    const goBackToList = () => {
        setSearchParams({ tab: 'photos' });
    };

    const handleTabChange = (tabIndex) => {
        setSearchParams(tabIndex === VIDEOS_TAB ? { tab: 'videos' } : { tab: 'photos' });
    };

    const openGalleryFile = (path) => {
        const url = `/view-gallery-file?file=${encodeURIComponent(path)}`;

        if (Capacitor.isNativePlatform()) {
            navigate(url);
        } else {
            window.open(url, '_blank');
        }
    };

    const cancelVideoUploadInProgress = async () => {
        const videoId = uploadVideoIdRef.current;
        const runningUpload = uploadPromiseRef.current;

        if (!videoId) {
            return;
        }

        setVideoUpload((current) => (current ? {...current, isCancelling: true} : current));

        if (uploadAbortRef.current) {
            uploadAbortRef.current.abort();
        }

        if (runningUpload) {
            await runningUpload.catch(() => {});
        }

        const cancelled = await cancelVideoUpload(videoId);

        if (typeof cancelled === 'string') {
            console.log(cancelled);
        }

        await reloadData({silent: true});
    };

    const cancelPhotoUploadInProgress = () => {
        setPhotoUpload((current) => (current ? {...current, isCancelling: true} : current));

        if (photoAbortRef.current) {
            photoAbortRef.current.abort();
        }
    };

    const uploadPhotosWith = async (photoFiles, send) => {
        const controller = new AbortController();
        const totalBytes = photoFiles.reduce((sum, file) => sum + (file.size || 0), 0);

        photoAbortRef.current = controller;

        setPhotoUpload({phase: 'uploading', percent: 0, sentBytes: 0, totalBytes, isCancelling: false});

        try {
            return await send({
                signal: controller.signal,
                onProgress: ({phase, percent, sentBytes, totalBytes}) => {
                    setPhotoUpload((current) => (current ? {...current, phase, percent, sentBytes, totalBytes} : current));
                },
            });
        } finally {
            photoAbortRef.current = null;
            setPhotoUpload(null);
        }
    };

    useEffect(() => {
        if (!isUploadingAnything) {
            return undefined;
        }

        const warnBeforeLeaving = (event) => {
            event.preventDefault();
            event.returnValue = '';

            return '';
        };

        const discardOnLeaving = (event) => {
            if (event.persisted) {
                return;
            }

            if (typeof uploadDiscardRef.current === 'function') {
                uploadDiscardRef.current();
            }
        };

        window.addEventListener('beforeunload', warnBeforeLeaving);
        window.addEventListener('pagehide', discardOnLeaving);

        return () => {
            window.removeEventListener('beforeunload', warnBeforeLeaving);
            window.removeEventListener('pagehide', discardOnLeaving);
        };
    }, [isUploadingAnything]);

    const closeModal = () => {
        if (uploadVideoIdRef.current !== null || photoAbortRef.current !== null) {
            return;
        }

        setModalType(null);
        setModalFields(null);
        setResetModal(true);
    };

    const collageFields = (collage) => ([
        { id: collageTitleEnFieldId, type: 'text', name: 'title-en', label: 'Title (EN)', required: true, errorMsg: 'Please enter the English title', value: '', defaultValue: collage ? collage.titleEn : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (EN)', httpName: 'title-en' },
        { id: collageTitleArFieldId, type: 'text', name: 'title-ar', label: 'Title (AR)', required: true, errorMsg: 'Please enter the Arabic title', value: '', defaultValue: collage ? collage.titleAr : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (AR)', lang: 'ar', httpName: 'title-ar' },
        { id: collageLayoutFieldId, type: 'select', name: 'layout', label: 'Layout', required: true, choices: LAYOUT_CHOICES, errorMsg: 'Please choose a layout', value: '', defaultValue: layoutChoiceOf(collage ? collage.layout : 'wide'), widthOfField: collage ? 2 : 1, labelOutside: true, labelOnTop: true, displayLabel: 'Layout', httpName: 'layout' },
        ...(collage ? [
            { id: collageShownFieldId, type: 'select', name: 'is-public', label: 'Visibility', required: true, choices: SHOWN_CHOICES, errorMsg: 'Please choose the visibility', value: '', defaultValue: shownChoiceOf(collage.isPublic), widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Visibility', httpName: 'is-public' },
        ] : []),
    ]);

    const openAddCollageModal = () => {
        setModalType({ kind: 'add-collage', orderedItems: collages });
        setModalFields([
            ...collageFields(null),
            placementFieldFor(collagePlacementFieldId, collageAfterFieldId, collages, 'collage'),
            photosField(true),
        ]);
    };

    const openAddPhotosModal = () => {
        setModalType({ kind: 'add-photos', collageId: openCollage.id });
        setModalFields([photosField(true)]);
    };

    const openUploadVideoModal = () => {
        setModalType({ kind: 'upload-video', orderedItems: videoRecords });
        setModalFields([
            { id: videoTitleEnFieldId, type: 'text', name: 'title-en', label: 'Title (EN)', required: true, errorMsg: 'Please enter the English title', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (EN)', httpName: 'title-en' },
            { id: videoTitleArFieldId, type: 'text', name: 'title-ar', label: 'Title (AR)', required: true, errorMsg: 'Please enter the Arabic title', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (AR)', lang: 'ar', httpName: 'title-ar' },
            { id: videoLayoutFieldId, type: 'select', name: 'layout', label: 'Layout', required: true, choices: LAYOUT_CHOICES, errorMsg: 'Please choose a layout', value: '', defaultValue: LAYOUT_CHOICES[0], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Layout', httpName: 'layout' },
            { id: videoFileFieldId, type: 'file', name: 'video', label: VIDEO_FIELD_LABEL, required: true, errorMsg: 'Please choose a video', value: '', allowedFileTypes: VIDEO_FILE_TYPES, maxFileSizeInBytes: MAX_VIDEO_BYTES, showPreview: true, widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Video', httpName: 'video' },
            { id: videoThumbnailPickerFieldId, type: 'video-thumbnail', name: 'thumbnail-at', label: 'Cover Frame', required: false, sourceFieldId: videoFileFieldId, value: '', defaultValue: '0', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Cover frame', httpName: 'thumbnail-at' },
            placementFieldFor(videoPlacementFieldId, videoAfterFieldId, videoRecords, 'video'),
        ]);
    };

    const openEditCollageModal = () => {
        const otherCollages = collages.filter((collage) => collage.id !== openCollage.id);

        setModalType({ kind: 'edit-collage', collageId: openCollage.id, orderedItems: otherCollages });
        setModalFields([
            ...collageFields(openCollage),
            placementFieldFor(collagePlacementFieldId, collageAfterFieldId, otherCollages, 'collage', true),
        ]);
    };

    const openEditVideoModal = (rowIndex) => {
        const videoId = Number(videosData[rowIndex][videoIdColIndex]);
        const video = videoRecords.find((record) => record.id === videoId);

        if (!video) {
            return;
        }

        const otherVideos = videoRecords.filter((record) => record.id !== videoId);

        setModalType({ kind: 'edit-video', videoId, duration: video.durationSeconds, orderedItems: otherVideos });
        setModalFields([
            { id: videoTitleEnFieldId, type: 'text', name: 'title-en', label: 'Title (EN)', required: true, errorMsg: 'Please enter the English title', value: '', defaultValue: video.titleEn, widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (EN)', httpName: 'title-en' },
            { id: videoTitleArFieldId, type: 'text', name: 'title-ar', label: 'Title (AR)', required: true, errorMsg: 'Please enter the Arabic title', value: '', defaultValue: video.titleAr, widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (AR)', lang: 'ar', httpName: 'title-ar' },
            { id: videoLayoutFieldId, type: 'select', name: 'layout', label: 'Layout', required: true, choices: LAYOUT_CHOICES, errorMsg: 'Please choose a layout', value: '', defaultValue: layoutChoiceOf(video.layout), widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Layout', httpName: 'layout' },
            { id: videoShownFieldId, type: 'select', name: 'is-public', label: 'Visibility', required: true, choices: SHOWN_CHOICES, errorMsg: 'Please choose the visibility', value: '', defaultValue: shownChoiceOf(video.isPublic), widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Visibility', httpName: 'is-public' },
            { id: videoThumbnailPickerFieldId, type: 'video-thumbnail', name: 'thumbnail-at', label: 'Cover Frame', required: false, videoUrl: galleryFileUrl(`videos/${video.fileName}`), value: '', defaultValue: String(video.thumbnailAt), widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Cover frame', httpName: 'thumbnail-at' },
            placementFieldFor(videoPlacementFieldId, videoAfterFieldId, otherVideos, 'video', true),
        ]);
    };

    const uploadVideoFromModal = async (videoFile, {titleEn, titleAr, thumbnailAt, layout, placement, afterId}) => {
        const begun = await beginVideoUpload({
            titleEn,
            titleAr,
            fileName: videoFile.name,
            totalBytes: videoFile.size,
        });

        if (!begun || !begun.success) {
            return begun;
        }

        const controller = new AbortController();

        uploadAbortRef.current = controller;
        uploadVideoIdRef.current = begun.videoId;
        uploadDiscardRef.current = await prepareUploadDiscard(begun.videoId);

        setVideoUpload({
            videoId: begun.videoId,
            phase: 'uploading',
            percent: 0,
            sentBytes: 0,
            totalBytes: videoFile.size,
            isCancelling: false,
        });

        const running = runVideoUpload(begun.videoId, begun.chunkSize, videoFile, {
            titleEn,
            titleAr,
            thumbnailAt,
            layout,
            placement,
            afterId,
            signal: controller.signal,
            onProgress: ({phase, percent, sentBytes, totalBytes}) => {
                setVideoUpload((current) => (
                    (current && current.videoId === begun.videoId && phase !== 'done')
                        ? {...current, phase, percent, sentBytes, totalBytes}
                        : current
                ));
            },
        });

        uploadPromiseRef.current = running;

        try {
            return await running;
        } finally {
            uploadAbortRef.current = null;
            uploadVideoIdRef.current = null;
            uploadDiscardRef.current = null;
            uploadPromiseRef.current = null;
            setVideoUpload(null);
        }
    };

    const handleModalSubmit = async (formData) => {
        const showsPageSpinner = !['upload-video', 'add-collage', 'add-photos'].includes(modalType.kind);

        if (showsPageSpinner) {
            setIsLoading(true);
        }

        try {
            const values = Object.fromEntries(formData.entries());
            let result;
            let nextCollageId = null;

            const chosenPlacement = (placementFieldId, afterFieldId) => {
                const items = modalType.orderedItems || [];
                const chosenAfter = values[`field_${afterFieldId}`];
                const afterIndex = items.findIndex((item, index) => positionChoiceOf(item, index) === chosenAfter);

                return {
                    placement: placementValueOf(values[`field_${placementFieldId}`]),
                    afterId: afterIndex === -1 ? 0 : items[afterIndex].id,
                };
            };

            if (modalType.kind === 'add-collage') {
                const collagePhotoFiles = formData.getAll(PHOTOS_FIELD_LABEL);

                result = await uploadPhotosWith(collagePhotoFiles, (options) => addCollage({
                    titleEn: values[`field_${collageTitleEnFieldId}`],
                    titleAr: values[`field_${collageTitleArFieldId}`],
                    layout: layoutValueOf(values[`field_${collageLayoutFieldId}`]),
                    ...chosenPlacement(collagePlacementFieldId, collageAfterFieldId),
                }, collagePhotoFiles, options));

                nextCollageId = result && result.collageId ? result.collageId : null;
            } else if (modalType.kind === 'add-photos') {
                const extraPhotoFiles = formData.getAll(PHOTOS_FIELD_LABEL);

                result = await uploadPhotosWith(extraPhotoFiles, (options) => addCollagePhotos(modalType.collageId, extraPhotoFiles, options));
            } else if (modalType.kind === 'upload-video') {
                result = await uploadVideoFromModal(formData.get(VIDEO_FIELD_LABEL), {
                    titleEn: values[`field_${videoTitleEnFieldId}`],
                    titleAr: values[`field_${videoTitleArFieldId}`],
                    thumbnailAt: Number(values[`field_${videoThumbnailPickerFieldId}`] || 0),
                    layout: layoutValueOf(values[`field_${videoLayoutFieldId}`]),
                    ...chosenPlacement(videoPlacementFieldId, videoAfterFieldId),
                });
            } else if (modalType.kind === 'edit-collage') {
                const placed = chosenPlacement(collagePlacementFieldId, collageAfterFieldId);

                result = await updateCollage({
                    collage_id: modalType.collageId,
                    title_en: values[`field_${collageTitleEnFieldId}`],
                    title_ar: values[`field_${collageTitleArFieldId}`],
                    layout: layoutValueOf(values[`field_${collageLayoutFieldId}`]),
                    is_public: shownValueOf(values[`field_${collageShownFieldId}`]),
                    placement: placed.placement,
                    after_id: placed.afterId,
                });
            } else if (modalType.kind === 'edit-video') {
                const placed = chosenPlacement(videoPlacementFieldId, videoAfterFieldId);

                result = await updateVideo({
                    video_id: modalType.videoId,
                    title_en: values[`field_${videoTitleEnFieldId}`],
                    title_ar: values[`field_${videoTitleArFieldId}`],
                    thumbnail_at: Number(values[`field_${videoThumbnailPickerFieldId}`]),
                    layout: layoutValueOf(values[`field_${videoLayoutFieldId}`]),
                    is_public: shownValueOf(values[`field_${videoShownFieldId}`]),
                    placement: placed.placement,
                    after_id: placed.afterId,
                });
            }

            if (result && result.success) {
                closeModal();

                if (nextCollageId) {
                    showTableView(nextCollageId);
                } else {
                    await reloadData({silent: !showsPageSpinner});
                }

                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            if (error instanceof UploadCancelledError) {
                throw new Error(modalType.kind === 'upload-video'
                    ? 'Upload cancelled. Choose another video, or close this window.'
                    : 'Upload cancelled. Choose different photos, or close this window.');
            }

            throw new Error(error.message || 'An error occurred while saving.');
        } finally {
            if (showsPageSpinner) {
                setIsLoading(false);
            }
        }
    };

    const handleDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        setIsLoading(true);
        setIsDeleting(true);

        try {
            let result;

            if (pendingDelete.kind === 'collage') {
                result = await deleteCollage(pendingDelete.id);
            } else if (pendingDelete.kind === 'photo') {
                result = await deleteCollagePhoto(pendingDelete.id);
            } else {
                result = await deleteVideo(pendingDelete.id);
            }

            if (result && result.success) {
                const wasCollage = pendingDelete.kind === 'collage';

                setPendingDelete(null);

                if (wasCollage) {
                    goBackToList();
                } else {
                    await reloadData();
                }

                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            setDeleteError(error.message || 'An error occurred while deleting.');
            setTimeout(() => { setDeleteError(null); }, msgTimeout);
        } finally {
            setIsLoading(false);
            setIsDeleting(false);
        }
    };

    const renderCollageList = () => (
        <div className="admin-page-tab-content">
            <FancyList
                items={collages.map((collage) => ({
                    id: collage.id,
                    title: collage.titleEn,
                    subtitle: `${collage.photoCount} ${collage.photoCount === 1 ? 'photo' : 'photos'} · ${layoutSummaryOf(collage.layout)} · updated ${collage.updatedAt}`,
                    badge: collage.isPublic ? (collage.photoCount === 0 ? 'Empty' : null) : 'Hidden',
                    meta: null,
                }))}
                onSelect={(item) => showTableView(item.id)}
                isLoading={isLoading}
                emptyMessage={'No photo collages yet'}
                headerElements={[
                    (
                        <button key={1} onClick={openAddCollageModal}>
                            Add a new Photo Collage
                        </button>
                    )
                ]}
            />
        </div>
    );

    const renderPhotosTable = () => (
        <div className="admin-page-tab-content">
            <Table tableData={photosData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Photo ID', 'Alt Text']}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   likelyUrlColumns={{'Photo Path': openGalleryFile}}
                   allowDeleteEntryOption={true}
                   onDeleteEntry={(rowIndex) => {
                       setDeleteError(null);
                       setPendingDelete({
                           kind: 'photo',
                           id: Number(photosData[rowIndex][photoIdColIndex]),
                           label: photosData[rowIndex][photoAltColIndex],
                       });
                   }}
                   headerModuleElements={[
                       (<button key={1} onClick={goBackToList}>Back</button>),
                       (<button key={2} onClick={openAddPhotosModal}>Add Photos</button>),
                       (<button key={3} onClick={openEditCollageModal}>Edit Collage</button>),
                       (
                           <button key={4} onClick={() => {
                               setDeleteError(null);
                               setPendingDelete({ kind: 'collage', id: openCollage.id, label: openCollage.titleEn });
                           }}>
                               Delete Collage
                           </button>
                       ),
                   ]}
                   footerModuleElements={[]}
            />
        </div>
    );

    const renderVideosTable = () => (
        <div className="admin-page-tab-content">
            <Table tableData={videosData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Video ID', 'File Name']}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   cellRenderers={{
                       'Video Path': (cellValue) => {
                           const video = videoRecords.find((record) => `videos/${record.fileName}` === cellValue);
                           return (video && video.status === 'ready') ? <a className={"table-link"} lang={"en"} onClick={() => openGalleryFile(cellValue)}>{cellValue}</a> : <span className={"table-cell-inert"} lang={"en"}>{cellValue}</span>;
                       },
                   }}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => openEditVideoModal(rowIndex)}
                   allowDeleteEntryOption={true}
                   onDeleteEntry={(rowIndex) => {
                       setDeleteError(null);
                       setPendingDelete({
                           kind: 'video',
                           id: Number(videosData[rowIndex][videoIdColIndex]),
                           label: videosData[rowIndex][videoTitleEnColIndex],
                       });
                   }}
                   headerModuleElements={[
                       (<button key={1} onClick={openUploadVideoModal}>Upload a new Video</button>),
                   ]}
                   footerModuleElements={[]}
            />
        </div>
    );

    const tabData = useMemo(() => ([
        {
            id: PHOTOS_TAB,
            label: 'Photos',
            element: isTableView && openCollage ? renderPhotosTable() : renderCollageList(),
        },
        {
            id: VIDEOS_TAB,
            label: 'Videos',
            element: renderVideosTable(),
        },
    ]), [collages, photosData, videosData, videoRecords, isLoading, openCollageId, openTab]);

    const modalFieldState = useMemo(() => ({
        [collagePhotosFieldId]: {
            upload: photoUpload === null ? null : {
                phase: photoUpload.phase,
                percent: photoUpload.percent,
                sentBytes: photoUpload.sentBytes,
                totalBytes: photoUpload.totalBytes,
                isCancelling: photoUpload.isCancelling,
                onCancel: cancelPhotoUploadInProgress,
            },
        },
        [videoFileFieldId]: {
            upload: videoUpload === null ? null : {
                phase: videoUpload.phase,
                percent: videoUpload.percent,
                sentBytes: videoUpload.sentBytes,
                totalBytes: videoUpload.totalBytes,
                isCancelling: videoUpload.isCancelling,
                onCancel: cancelVideoUploadInProgress,
            },
        },
    }), [videoUpload, photoUpload]);

    const modalTitles = {
        'add-collage': 'Add a new Photo Collage',
        'add-photos': 'Add Photos',
        'upload-video': 'Upload a new Video',
        'edit-collage': 'Edit Collage',
        'edit-video': 'Edit Video',
    };

    const deleteTitles = {
        collage: 'Delete Collage',
        photo: 'Delete Photo',
        video: 'Delete Video',
    };

    return (
        <>

            <div className={"gallery-management-page"}>
                <TabsPage tabData={tabData}
                          initialTab={PHOTOS_TAB}
                          controlledTab={openTab}
                          onTabChange={handleTabChange}
                          title={GALLERY_TABS_TITLE}/>
            </div>

            <animated.div style={animateModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>{modalType ? modalTitles[modalType.kind] : ''}</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {(modalType && modalFields != null) && (
                            <Form fields={modalFields}
                                  mailTo={''}
                                  sendPdf={false}
                                  formTitle={"Gallery Modal Form"}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  resetFormFromParent={resetModal}
                                  setResetForFromParent={setResetModal}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleModalSubmit}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={() => closeModal()}
                                  formHasPasswordField={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  forceEnglishForm={true}
                                  noClearOption={true}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={['Save Changes', 'Saving...']}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={modalFooterButtonsRef}
                                  fieldStateFromParent={modalFieldState}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"}
                                disabled={isUploadingAnything}
                                onClick={closeModal}>
                            Cancel
                        </button>
                        <div ref={modalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeleteModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={() => setPendingDelete(null)}/>
                <div className={"general-small-admin-action-modal-container"}>
                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>{pendingDelete ? deleteTitles[pendingDelete.kind] : ''}</h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
                        <p>
                            Are you sure you want to delete {pendingDelete && pendingDelete.label}?
                            {pendingDelete && pendingDelete.kind === 'collage' && ' Every photo in it is removed from the server as well.'}
                            {pendingDelete && pendingDelete.kind !== 'collage' && ' The file is removed from the server as well.'}
                            {' '}This action cannot be reversed.
                        </p>

                        {deleteError && (
                            <>
                                <br/>
                                <p>{deleteError}</p>
                            </>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={() => setPendingDelete(null)}>
                            Cancel
                        </button>

                        <button onClick={handleDelete}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default GalleryManagement;

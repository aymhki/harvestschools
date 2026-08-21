import {v6 as uuidv6} from "uuid";
import i18n from '../../i18n/i18n-client.jsx';
import {useLocation, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import { Capacitor } from '@capacitor/core';
import {clearMobileSession, getMobileSession, getDeviceBindingSecret} from "./CapacitorSecureAuthUtils.jsx"

const isMobileApp = () => Capacitor.isNativePlatform();

const isDevelopment = () => {
    return !import.meta.env.PROD;
};

const getBaseUrl = (isAdmin = false) => {
    if (isDevelopment()) return BASE_URLS.development;
    return isAdmin ? ADMIN_BASE_URLS.production : BASE_URLS.production;
};

const generateEndpoints = () => {
    const fullEndpoints = {};

    for (const [key, path] of Object.entries(ENDPOINTS)) {
        const isAdmin = path.startsWith('/scripts/Admin/');
        fullEndpoints[key] = `${getBaseUrl(isAdmin)}${path}`;
    }

    return fullEndpoints;
};


const getSessionsFromLocalStorage = (sessionName) => {
    const sessionId = localStorage.getItem(`${sessionName}_session_id`);
    const sessionTime = localStorage.getItem(`${sessionName}_session_time`);
    return {sessionId, sessionTime};
}

const getAdminSessionId = async () => {
    return Capacitor.isNativePlatform() ? await getMobileSession('harvest_schools_admin') : localStorage.getItem('harvest_schools_admin_session_id');
}

const getEventBookingSessionId = async () => {
    return Capacitor.isNativePlatform() ? await getMobileSession('harvest_schools_event_booking') : localStorage.getItem('harvest_schools_event_booking_session_id');
}

const formatDateFromPacific = (pacificTimeString) => {
    const [datePart, timePart] = pacificTimeString.split(' ');
    const pacificDate = new Date(`${datePart}T${timePart}-07:00`);

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    return pacificDate.toLocaleString(undefined, options);
};

const createSessions = (sessionName) => {
    const sessionId = uuidv6();
    localStorage.setItem(`${sessionName}_session_id`, sessionId);
    localStorage.setItem(`${sessionName}_session_time`, Date.now().toString());
    return sessionId;
}

const extendSession = (sessionName, sessionId) => {
    localStorage.setItem(`${sessionName}_session_id`, sessionId);
    localStorage.setItem(`${sessionName}_session_time`, Date.now().toString());
}

const resetSession = (sessionName) => {
    localStorage.removeItem(`${sessionName}_session_id`);
    localStorage.removeItem(`${sessionName}_session_time`);
}

const getMimeType = (extension) => {
    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'txt':
            return 'text/plain';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'svg':
            return 'image/svg+xml';
        case 'webp':
            return 'image/webp';
        case 'avif':
            return 'image/avif';
        case 'mp4':
        case 'm4v':
            return 'video/mp4';
        case 'webm':
            return 'video/webm';
        case 'mov':
            return 'video/quicktime';
        default:
            return 'application/octet-stream';
    }
};

const formatCeremonyDate = (ceremonyDate, langCode) => {
    let formatted = '';

    const parts = String(ceremonyDate || '').split('-');

    if (parts.length === 3) {
        const parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

        formatted = Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat(langCode === 'ar' ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(parsed);
    }

    return formatted;
};

const formatCeremonyTime = (ceremonyTime, langCode) => {
    let formatted = '';

    const parts = String(ceremonyTime || '').split(':');

    if (parts.length >= 2) {
        const parsed = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1]));

        formatted = Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat(langCode === 'ar' ? 'ar-EG' : 'en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(parsed);
    }

    return formatted;
};

const formatNumberByLocale = (number) => {
    const currentLanguage = i18n.language;
    return new Intl.NumberFormat(currentLanguage === 'ar' ? 'ar-SA' : 'en-US').format(number);
};

const EMBEDDABLE_EXTENSIONS = ['pdf', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'mp4', 'webm', 'mov', 'm4v'];
const cdCost = 150;
const additionalAttendeeCost = 150;
const pendingPaymentStatus = 'Signed Up, pending payment';
const notSignedUpStatus = 'Not Signed Up';
const confirmedStatus = 'Confirmed';
const sessionDurationInHours = 12;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;
const msgTimeout = 5000;
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SCRIPT_TIMEOUT_MS = 8000;

const mfaResendCooldownSeconds = 30;
const mfaResendMaxPerWindow = 5;
const EventBookingLoginPageUrl = '/events/event-booking';
const EventBookingDashboardPageUrl = '/events/event-booking/dashboard';
const adminLoginPageUrl = '/admin-login';
const adminDashboardPageUrl = '/admin-dashboard';
const alumniStudentsPageUrl = '/students-life/alumni-students';
const alumniLoginPageUrl = '/students-life/alumni-students/login';
const alumniProfilePageUrl = '/students-life/alumni-students/profile';
const costPerChildInOpenDaySignup = 150;

const adminUserManagementPermissionLevel = "1000";
const jobApplicationManagementPermissionLevel = "0";
const EventBookingManagementPermissionLevel = "1";
const openDaySignupManagementPermissionLevel = "2";
const BorrowingSystemManagementPermissionLevel = "3";
const borrowingRolePermissionLevels = {
    'hr': "25",
    'accounting': "26",
    'board': BorrowingSystemManagementPermissionLevel,
};
const infoSystemManagementPermissionLevel = "7";
const alumniStudentsManagementPermissionLevel = "13";
const staffDirectoryManagementPermissionLevel = "14";
const libraryManagementPermissionLevel = "22";
const galleryManagementPermissionLevel = "23";
const pageGatesManagementPermissionLevel = "24";
const academicCalendarsMasterPermissionLevel = "15";
const academicCalendarPermissionLevels = {
    'national': "16",
    'british': "17",
    'american': "18",
    'national-kg': "19",
    'british-kg': "20",
    'american-kg': "21",
};
const anyAcademicCalendarPermissionLevels = [
    academicCalendarsMasterPermissionLevel,
    ...Object.values(academicCalendarPermissionLevels),
];
const anyBorrowingSystemPermissionLevels = Object.values(borrowingRolePermissionLevels);
const jackOfAllTradesPermissionLevel = "7246262252458111903";


const getClientFingerprint = async () => {
    const raw = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency ?? '',
        screen.colorDepth ?? '',
        navigator.maxTouchPoints ?? '',
    ].join('||');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};


const buildAuthHeaders = async (sessionId) => {
    const native = Capacitor.isNativePlatform();

    const headers = {
        'Authorization': 'Bearer ' + sessionId,
        'X-Client-Platform': native ? 'native' : 'web',
        'X-Client-Fingerprint': await getClientFingerprint(),
    };

    if (native) {
        const deviceSecret = await getDeviceBindingSecret('harvest_schools_admin');
        if (deviceSecret) { headers['X-Device-Binding'] = deviceSecret; }
    }

    return headers;
};

const buildLoginHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Client-Platform': Capacitor.isNativePlatform() ? 'native' : 'web',
});


const buildRecoveryHeaders = async () => ({
    'Content-Type': 'application/json',
    'X-Client-Platform': Capacitor.isNativePlatform() ? 'native' : 'web',
    'X-Client-Fingerprint': await getClientFingerprint(),
});

const getCurrentLangCode = () => (i18n.language === 'ar' ? 'ar' : 'en');


const ENDPOINTS = {
    checkEventBookingSession: '/scripts/Parents/EventBookings/checkEventBookingSession.php',
    getAllEventBookings: '/scripts/Admin/EventBookings/getAllEventBookings.php',
    validateEventBookingLogin: '/scripts/Parents/EventBookings/validateEventBookingLogin.php',
    createEventBookingSession: '/scripts/Parents/EventBookings/createEventBookingSession.php',
    deleteEventBookingEntry: '/scripts/Admin/EventBookings/deleteEventBookingEntry.php',
    submitAddEventBookingForm: '/scripts/Admin/EventBookings/submitAddEventBookingForm.php',
    getEventBookingInfoBySession: '/scripts/Parents/EventBookings/getEventBookingBySession.php',
    submitEditEventBookingForm: '/scripts/Admin/EventBookings/submitEditEventBookingForm.php',
    validateAdminSession: '/scripts/Admin/Session/checkAdminSession.php',
    validateAdminLogin: '/scripts/Admin/Session/validateAdminLogin.php',
    deleteAdminSession: '/scripts/Admin/Session/deleteAdminSession.php',
    getDashboardPermissions: '/scripts/Admin/Session/getDashboardPermissions.php',
    getUserPermissions: '/scripts/Admin/Session/getAdminUserPermissions.php',
    submitForm: '/scripts/Public/General/submitForm.php',
    submitJobApplication: '/scripts/Public/JobApplications/submitJobApplication.php',
    getJobApplications: '/scripts/Admin/JobApplications/getJobApplications.php',
    updateEventBookingExtras: '/scripts/Parents/EventBookings/submitUpdateEventBookingExtras.php',
    getEventBookingConfirmation: '/scripts/Public/EventBookings/getEventBookingConfirmation.php',
    createEventBookingWalletPass: '/scripts/Parents/EventBookings/createEventBookingWalletPass.php',
    getEventCeremonyDetails: '/scripts/Admin/EventBookings/getEventMetaDetails.php',
    updateEventMetaDetails: '/scripts/Admin/EventBookings/updateEventMetaDetails.php',
    serveJobApplicationFile: '/scripts/Admin/JobApplications/serveJobApplicationFile.php?file=',
    submitOpenDaySignupForm: '/scripts/Public/OpenDaySignups/submitOpenDaySignupForm.php',
    getOpenDaySignups: '/scripts/Admin/OpenDaySignups/getOpenDaySignups.php',
    servePublicAssetFile: '/scripts/Public/General/servePublicAssetFile.php',
    servePublicVideoThumbnail: '/scripts/Public/General/serveVideoThumbnail.php',
    servePublicVideoPreviewFrames: '/scripts/Public/General/serveVideoPreviewFrames.php',
    getPublicGallery: '/scripts/Public/Gallery/getPublicGallery.php',
    getGallery: '/scripts/Admin/Gallery/getGallery.php',
    addCollage: '/scripts/Admin/Gallery/addCollage.php',
    addCollagePhotos: '/scripts/Admin/Gallery/addCollagePhotos.php',
    updateCollage: '/scripts/Admin/Gallery/updateCollage.php',
    deleteCollage: '/scripts/Admin/Gallery/deleteCollage.php',
    deleteCollagePhoto: '/scripts/Admin/Gallery/deleteCollagePhoto.php',
    updateVideo: '/scripts/Admin/Gallery/updateVideo.php',
    deleteVideo: '/scripts/Admin/Gallery/deleteVideo.php',
    beginVideoUpload: '/scripts/Admin/Gallery/beginVideoUpload.php',
    uploadVideoChunk: '/scripts/Admin/Gallery/uploadVideoChunk.php',
    finishVideoUpload: '/scripts/Admin/Gallery/finishVideoUpload.php',
    cancelVideoUpload: '/scripts/Admin/Gallery/cancelVideoUpload.php',
    getVideoUploadStatus: '/scripts/Admin/Gallery/getVideoUploadStatus.php',
    getPublicSchoolInfo: '/scripts/Public/SchoolInfo/getPublicSchoolInfo.php',
    getPublicSchoolStages: '/scripts/Public/SchoolInfo/getPublicSchoolStages.php',
    getPublicSchoolContacts: '/scripts/Public/SchoolInfo/getPublicSchoolContacts.php',
    getPublicStages: '/scripts/Public/SchoolInfo/getPublicStages.php',
    getPublicPageGates: '/scripts/Public/SchoolInfo/getPublicPageGates.php',
    getPageGates: '/scripts/Admin/PageGates/getPageGates.php',
    updatePageGate: '/scripts/Admin/PageGates/updatePageGate.php',
    getAllAdminUsers: '/scripts/Admin/AdminUsers/getAllAdminUsers.php',
    addAdminUser: '/scripts/Admin/AdminUsers/addAdminUser.php',
    editAdminUser: '/scripts/Admin/AdminUsers/editAdminUser.php',
    deleteAdminUser: '/scripts/Admin/AdminUsers/deleteAdminUser.php',
    getInfoSystem: '/scripts/Admin/InfoSystem/getInfoSystemData.php',
    updateInfoSystem: '/scripts/Admin/InfoSystem/updateInfoSystemData.php',
    getStaffDirectory: '/scripts/Admin/StaffDirectory/getStaffDirectory.php',
    addEmployee: '/scripts/Admin/StaffDirectory/addEmployee.php',
    editEmployee: '/scripts/Admin/StaffDirectory/editEmployee.php',
    deleteEmployee: '/scripts/Admin/StaffDirectory/deleteEmployee.php',
    getPublicStaff: '/scripts/Public/Staff/getPublicStaff.php',
    getPublicCalendar: '/scripts/Public/Calendars/getPublicCalendar.php',
    getPublicLibrary: '/scripts/Public/Library/getPublicLibrary.php',
    getLibraryBooks: '/scripts/Admin/Library/getLibraryBooks.php',
    addLibraryBook: '/scripts/Admin/Library/addLibraryBook.php',
    editLibraryBook: '/scripts/Admin/Library/editLibraryBook.php',
    deleteLibraryBook: '/scripts/Admin/Library/deleteLibraryBook.php',
    getAcademicCalendars: '/scripts/Admin/AcademicCalendars/getAcademicCalendars.php',
    addAcademicCalendarYear: '/scripts/Admin/AcademicCalendars/addAcademicCalendarYear.php',
    updateCalendarMetaData: '/scripts/Admin/AcademicCalendars/updateCalendarMetaData.php',
    uploadCalendarPdf: '/scripts/Admin/AcademicCalendars/uploadCalendarPdf.php',
    addCalendarEvent: '/scripts/Admin/AcademicCalendars/addCalendarEvent.php',
    editCalendarEvent: '/scripts/Admin/AcademicCalendars/editCalendarEvent.php',
    deleteCalendarEvent: '/scripts/Admin/AcademicCalendars/deleteCalendarEvent.php',
    getBorrowingSystem: '/scripts/Admin/BorrowingSystem/getBorrowingSystem.php',
    getEmployeeScore: '/scripts/Admin/BorrowingSystem/getEmployeeScore.php',
    recordEligibilityInputs: '/scripts/Admin/BorrowingSystem/recordEligibilityInputs.php',
    submitBorrowingApplication: '/scripts/Admin/BorrowingSystem/submitApplication.php',
    reviewBorrowingApplication: '/scripts/Admin/BorrowingSystem/reviewApplication.php',
    submitBorrowingDelayRequest: '/scripts/Admin/BorrowingSystem/submitDelayRequest.php',
    reviewBorrowingDelayRequest: '/scripts/Admin/BorrowingSystem/reviewDelayRequest.php',
    recordBorrowingPayment: '/scripts/Admin/BorrowingSystem/recordPayment.php',
    reviewBorrowingEditRequest: '/scripts/Admin/BorrowingSystem/reviewEditRequest.php',
    updateBorrowingConfig: '/scripts/Admin/BorrowingSystem/updateBorrowingConfig.php',
    verifyMfa: '/scripts/Admin/Session/verifyMfa.php',
    requestMfaEmailCode: '/scripts/Admin/Session/requestMfaEmailCode.php',
    getMyAccount: '/scripts/Admin/Session/getMyAccount.php',
    dismissPasskeyPrompt: '/scripts/Admin/Session/dismissPasskeyPrompt.php',
    setupTotp: '/scripts/Admin/Session/setupTotp.php',
    confirmTotp: '/scripts/Admin/Session/confirmTotp.php',
    passkeyRegisterOptions: '/scripts/Admin/Session/passkeyRegisterOptions.php',
    passkeyRegisterVerify: '/scripts/Admin/Session/passkeyRegisterVerify.php',
    passkeyLoginOptions: '/scripts/Admin/Session/passkeyLoginOptions.php',
    passkeyLoginVerify: '/scripts/Admin/Session/passkeyLoginVerify.php',
    listAdminSessions: '/scripts/Admin/Session/listAdminSessions.php',
    revokeAdminSession: '/scripts/Admin/Session/revokeAdminSession.php',
    setPreferredMfa: '/scripts/Admin/Session/setPreferredMfa.php',
    requestEmailVerification: '/scripts/Admin/Session/requestEmailVerification.php',
    confirmEmailVerification: '/scripts/Admin/Session/confirmEmailVerification.php',
    requestEmailChange: '/scripts/Admin/Session/requestEmailChange.php',
    requestStepUp: '/scripts/Admin/Session/requestStepUp.php',
    requestStepUpEmailCode: '/scripts/Admin/Session/requestStepUpEmailCode.php',
    stepUpPasskeyOptions: '/scripts/Admin/Session/stepUpPasskeyOptions.php',
    verifyStepUp: '/scripts/Admin/Session/verifyStepUp.php',
    requestPasswordReset: '/scripts/Admin/Session/requestPasswordReset.php',
    requestResetEmailCode: '/scripts/Admin/Session/requestResetEmailCode.php',
    resetPasskeyOptions: '/scripts/Admin/Session/resetPasskeyOptions.php',
    verifyPasswordReset: '/scripts/Admin/Session/verifyPasswordReset.php',
    submitAlumniSignup: '/scripts/Public/AlumniStudents/submitAlumniSignup.php',
    validateAlumniLogin: '/scripts/Public/AlumniStudents/validateAlumniLogin.php',
    alumniPasskeyLoginOptions: '/scripts/Public/AlumniStudents/alumniPasskeyLoginOptions.php',
    alumniPasskeyLoginVerify: '/scripts/Public/AlumniStudents/alumniPasskeyLoginVerify.php',
    alumniPasskeyDiscoverableLoginOptions: '/scripts/Public/AlumniStudents/alumniPasskeyDiscoverableLoginOptions.php',
    alumniPasskeyDiscoverableLoginVerify: '/scripts/Public/AlumniStudents/alumniPasskeyDiscoverableLoginVerify.php',
    requestAlumniPasswordReset: '/scripts/Public/AlumniStudents/requestAlumniPasswordReset.php',
    requestAlumniResetEmailCode: '/scripts/Public/AlumniStudents/requestAlumniResetEmailCode.php',
    alumniResetPasskeyOptions: '/scripts/Public/AlumniStudents/alumniResetPasskeyOptions.php',
    verifyAlumniPasswordReset: '/scripts/Public/AlumniStudents/verifyAlumniPasswordReset.php',
    requestEventBookingPasswordReset: '/scripts/Parents/EventBookings/requestEventBookingPasswordReset.php',
    requestEventBookingResetEmailCode: '/scripts/Parents/EventBookings/requestEventBookingResetEmailCode.php',
    verifyEventBookingPasswordReset: '/scripts/Parents/EventBookings/verifyEventBookingPasswordReset.php',
    searchEventBookingStudents: '/scripts/Parents/EventBookings/searchEventBookingStudents.php',
    recoverEventBookingUsername: '/scripts/Parents/EventBookings/recoverEventBookingUsername.php',
    getApprovedAlumniPosts: '/scripts/Public/AlumniStudents/getApprovedAlumniPosts.php',
    serveAlumniPublicFile: '/scripts/Public/AlumniStudents/serveAlumniPublicFile.php',
    checkAlumniSession: '/scripts/Alumni/checkAlumniSession.php',
    deleteAlumniSession: '/scripts/Alumni/deleteAlumniSession.php',
    getMyAlumniAccount: '/scripts/Alumni/getMyAlumniAccount.php',
    submitAlumniProfileUpdate: '/scripts/Alumni/submitAlumniProfileUpdate.php',
    cancelAlumniProfileUpdate: '/scripts/Alumni/cancelAlumniProfileUpdate.php',
    requestAlumniAccountDeletion: '/scripts/Alumni/requestAlumniAccountDeletion.php',
    cancelAlumniAccountDeletionRequest: '/scripts/Alumni/cancelAlumniAccountDeletionRequest.php',
    changeAlumniPassword: '/scripts/Alumni/changeAlumniPassword.php',
    alumniPasskeyRegisterOptions: '/scripts/Alumni/alumniPasskeyRegisterOptions.php',
    alumniPasskeyRegisterVerify: '/scripts/Alumni/alumniPasskeyRegisterVerify.php',
    deleteAlumniPasskey: '/scripts/Alumni/deleteAlumniPasskey.php',
    submitAlumniPost: '/scripts/Alumni/submitAlumniPost.php',
    editAlumniPost: '/scripts/Alumni/editAlumniPost.php',
    deleteAlumniPost: '/scripts/Alumni/deleteAlumniPost.php',
    uploadAlumniPostImage: '/scripts/Alumni/uploadAlumniPostImage.php',
    getAllAlumniAccounts: '/scripts/Admin/AlumniStudents/getAllAlumniAccounts.php',
    setAlumniAccountStatus: '/scripts/Admin/AlumniStudents/setAlumniAccountStatus.php',
    reviewAlumniProfileUpdate: '/scripts/Admin/AlumniStudents/reviewAlumniProfileUpdate.php',
    reviewAlumniDeletionRequest: '/scripts/Admin/AlumniStudents/reviewAlumniDeletionRequest.php',
    deleteAlumniAccount: '/scripts/Admin/AlumniStudents/deleteAlumniAccount.php',
    getAllAlumniPosts: '/scripts/Admin/AlumniStudents/getAllAlumniPosts.php',
    reviewAlumniPost: '/scripts/Admin/AlumniStudents/reviewAlumniPost.php',
    setAlumniPostPlacement: '/scripts/Admin/AlumniStudents/setAlumniPostPlacement.php',
    deleteAlumniPostByAdmin: '/scripts/Admin/AlumniStudents/deleteAlumniPostByAdmin.php',
    serveAlumniFile: '/scripts/Admin/AlumniStudents/serveAlumniFile.php?file=',
};

const BASE_URLS = {
    development: 'http://localhost:8080',
    production: Capacitor.isNativePlatform() ? 'https://harvestschools.com' : ''
};

const ADMIN_BASE_URLS = {
    development: 'http://localhost:8080',
    production: Capacitor.isNativePlatform() ? 'https://admin.harvestschools.com' : ''
};

const endpoints = generateEndpoints();

const getAlumniSessionId = async () => {
    return Capacitor.isNativePlatform() ? await getMobileSession('harvest_schools_alumni') : localStorage.getItem('harvest_schools_alumni_session_id');
}

const alumniPublicFileUrl = (pathOrUrl) => {
    if (!pathOrUrl) {
        return '';
    }

    if (/^https?:\/\//i.test(pathOrUrl)) {
        return pathOrUrl;
    }

    return `${endpoints.serveAlumniPublicFile}?file=${encodeURIComponent(pathOrUrl)}`;
}

const logoutCurrentAdmin = async (navigate) => {
    const native = Capacitor.isNativePlatform();
    const sessionId = native ? await getMobileSession('harvest_schools_admin') : localStorage.getItem('harvest_schools_admin_session_id');

    if (sessionId) {
        try {

            await fetch(endpoints.deleteAdminSession, {
                method: 'POST',
                headers: await buildAuthHeaders(sessionId),
            });

        } catch {
            console.log('Could not delete admin session sessions from the server.');
        }
    }

    localStorage.removeItem('harvest_schools_admin_session_id');
    localStorage.removeItem('harvest_schools_admin_session_time');
    if (native) { await clearMobileSession('harvest_schools_admin'); }
    navigate(adminLoginPageUrl, { replace: true });
}

const useToggleLanguage = ({ignoreDocUpdate}) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!ignoreDocUpdate) {
            document.documentElement.lang = i18n.language;
            document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        }
    }, [i18n.language, ignoreDocUpdate]);

    return ({lng}) => {
        if (lng === undefined) {
            lng = i18n.language === 'ar' ? 'en' : 'ar';
        }

        if (i18n.language === lng) return;

        i18n.changeLanguage(lng);

        const searchParams = new URLSearchParams(location.search);
        searchParams.set('lang', lng);

        navigate({
            pathname: location.pathname,
            search: searchParams.toString()
        }, { replace: true });
    };
};

const useDarkMode = () => {

    const getInitial = () =>
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    const [isDarkMode, setIsDarkMode] = useState(getInitial);

    useEffect(() => {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = (event) => setIsDarkMode(event.matches);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return isDarkMode;
}


export {
    generateEndpoints,
    formatDateFromPacific,
    createSessions,
    extendSession,
    resetSession,
    getMimeType,
    isDevelopment,
    EMBEDDABLE_EXTENSIONS,
    cdCost,
    additionalAttendeeCost,
    pendingPaymentStatus,
    notSignedUpStatus,
    confirmedStatus,
    sessionDuration,
    msgTimeout,
    turnstileSiteKey,
    mfaResendCooldownSeconds,
    mfaResendMaxPerWindow,
    EventBookingLoginPageUrl,
    EventBookingDashboardPageUrl,
    adminLoginPageUrl,
    adminDashboardPageUrl,
    alumniStudentsPageUrl,
    alumniLoginPageUrl,
    alumniProfilePageUrl,
    alumniPublicFileUrl,
    getAlumniSessionId,
    endpoints,
    BASE_URLS,
    costPerChildInOpenDaySignup,
    formatNumberByLocale,
    formatCeremonyDate,
    formatCeremonyTime,
    useToggleLanguage,
    logoutCurrentAdmin,
    adminUserManagementPermissionLevel,
    EventBookingManagementPermissionLevel,
    openDaySignupManagementPermissionLevel,
    jobApplicationManagementPermissionLevel,
    infoSystemManagementPermissionLevel,
    alumniStudentsManagementPermissionLevel,
    staffDirectoryManagementPermissionLevel,
    libraryManagementPermissionLevel,
    galleryManagementPermissionLevel,
    pageGatesManagementPermissionLevel,
    academicCalendarsMasterPermissionLevel,
    academicCalendarPermissionLevels,
    anyAcademicCalendarPermissionLevels,
    BorrowingSystemManagementPermissionLevel,
    borrowingRolePermissionLevels,
    anyBorrowingSystemPermissionLevels,
    jackOfAllTradesPermissionLevel,
    getBaseUrl,
    getSessionsFromLocalStorage,
    getAdminSessionId,
    getEventBookingSessionId,
    useDarkMode,
    getClientFingerprint,
    buildAuthHeaders,
    buildLoginHeaders,
    buildRecoveryHeaders,
    getCurrentLangCode,
    TURNSTILE_SCRIPT_URL,
    TURNSTILE_SCRIPT_TIMEOUT_MS,
    isMobileApp
}
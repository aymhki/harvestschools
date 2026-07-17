import {v6 as uuidv6} from "uuid";
import i18n from '../../i18n/i18n-client.jsx';
import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import { Capacitor } from '@capacitor/core';
import {clearMobileSession, getMobileSession, getDeviceBindingSecret} from "./CapacitorSecureAuthUtils.jsx"

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

const getAdminSessionId = () => {
    return localStorage.getItem('harvest_schools_admin_session_id');
}

const getGraduationBookingSessionId = () => {
    return localStorage.getItem('harvest_schools_graduation_booking_session_id');
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
        default:
            return 'application/octet-stream';
    }
};

const formatNumberByLocale = (number) => {
    const currentLanguage = i18n.language;
    return new Intl.NumberFormat(currentLanguage === 'ar' ? 'ar-SA' : 'en-US').format(number);
};

const EMBEDDABLE_EXTENSIONS = ['pdf', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
const cdCost = 150;
const additionalAttendeeCost = 150;
const pendingPaymentStatus = 'Signed Up, pending payment';
const notSignedUpStatus = 'Not Signed Up';
const confirmedStatus = 'Confirmed';
const sessionDurationInHours = 12;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;
const msgTimeout = 5000;


const mfaResendCooldownSeconds = 30;
const mfaResendMaxPerWindow = 5;
const graduationBookingLoginPageUrl = '/events/graduation-booking';
const graduationBookingDashboardPageUrl = '/events/graduation-booking/dashboard';
const adminLoginPageUrl = '/admin-login';
const adminDashboardPageUrl = '/admin-dashboard';
const costPerChildInOpenDaySignup = 150;

const adminUserManagementPermissionLevel = "1000";
const jobApplicationManagementPermissionLevel = "0";
const graduationBookingManagementPermissionLevel = "1";
const openDaySignupManagementPermissionLevel = "2";
const BorrowingSystemManagementPermissionLevel = "3";
const infoSystemManagementPermissionLevel = "7";
const alumniStudentsManagementPermissionLevel = "13";
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


const ENDPOINTS = {
    checkGraduationBookingSession: '/scripts/Parents/GraduationBookings/checkGraduationBookingSession.php',
    getAllGraduationBookings: '/scripts/Admin/GraduationBookings/getAllGraduationBookings.php',
    validateGraduationBookingLogin: '/scripts/Parents/GraduationBookings/validateGraduationBookingLogin.php',
    createGraduationBookingSession: '/scripts/Parents/GraduationBookings/createGraduationBookingSession.php',
    deleteGraduationBookingEntry: '/scripts/Admin/GraduationBookings/deleteGraduationBookingEntry.php',
    submitAddGraduationBookingForm: '/scripts/Admin/GraduationBookings/submitAddGraduationBookingForm.php',
    getGraduationBookingInfoBySession: '/scripts/Parents/GraduationBookings/getGraduationBookingBySession.php',
    submitEditGraduationBookingForm: '/scripts/Admin/GraduationBookings/submitEditGraduationBookingForm.php',
    validateAdminSession: '/scripts/Admin/Session/checkAdminSession.php',
    validateAdminLogin: '/scripts/Admin/Session/validateAdminLogin.php',
    deleteAdminSession: '/scripts/Admin/Session/deleteAdminSession.php',
    getDashboardPermissions: '/scripts/Admin/Session/getDashboardPermissions.php',
    getUserPermissions: '/scripts/Admin/Session/getAdminUserPermissions.php',
    submitForm: '/scripts/Public/General/submitForm.php',
    submitJobApplication: '/scripts/Public/JobApplications/submitJobApplication.php',
    getJobApplications: '/scripts/Admin/JobApplications/getJobApplications.php',
    updateGraduationBookingExtras: '/scripts/Parents/GraduationBookings/submitUpdateGraduationBookingExtras.php',
    getGraduationBookingConfirmation: '/scripts/Public/GraduationBookings/getGraduationBookingConfirmation.php',
    serveJobApplicationFile: '/scripts/Admin/JobApplications/serveJobApplicationFile.php?file=',
    submitOpenDaySignupForm: '/scripts/Public/OpenDaySignups/submitOpenDaySignupForm.php',
    getOpenDaySignups: '/scripts/Admin/OpenDaySignups/getOpenDaySignups.php',
    servePublicAssetFile: '/scripts/Public/General/servePublicAssetFile.php',
    getAllAdminUsers: '/scripts/Admin/AdminUsers/getAllAdminUsers.php',
    addAdminUser: '/scripts/Admin/AdminUsers/addAdminUser.php',
    editAdminUser: '/scripts/Admin/AdminUsers/editAdminUser.php',
    deleteAdminUser: '/scripts/Admin/AdminUsers/deleteAdminUser.php',
    getInfoSystem: '/scripts/Admin/InfoSystem/getInfoSystemData.php',
    updateInfoSystem: '/scripts/Admin/InfoSystem/updateInfoSystemData.php',
    verifyMfa: '/scripts/Admin/Session/verifyMfa.php',
    requestMfaEmailCode: '/scripts/Admin/Session/requestMfaEmailCode.php',
    getMyAccount: '/scripts/Admin/Session/getMyAccount.php',
    updateMyAccount: '/scripts/Admin/Session/updateMyAccount.php',
    setupTotp: '/scripts/Admin/Session/setupTotp.php',
    confirmTotp: '/scripts/Admin/Session/confirmTotp.php',
    passkeyRegisterOptions: '/scripts/Admin/Session/passkeyRegisterOptions.php',
    passkeyRegisterVerify: '/scripts/Admin/Session/passkeyRegisterVerify.php',
    passkeyLoginOptions: '/scripts/Admin/Session/passkeyLoginOptions.php',
    passkeyLoginVerify: '/scripts/Admin/Session/passkeyLoginVerify.php',
    deletePasskey: '/scripts/Admin/Session/deletePasskey.php',
    listAdminSessions: '/scripts/Admin/Session/listAdminSessions.php',
    revokeAdminSession: '/scripts/Admin/Session/revokeAdminSession.php',
    deleteTotp: '/scripts/Admin/Session/deleteTotp.php',
    setPreferredMfa: '/scripts/Admin/Session/setPreferredMfa.php',
    requestEmailVerification: '/scripts/Admin/Session/requestEmailVerification.php',
    confirmEmailVerification: '/scripts/Admin/Session/confirmEmailVerification.php',
    requestEmailChange: '/scripts/Admin/Session/requestEmailChange.php',
    requestStepUp: '/scripts/Admin/Session/requestStepUp.php',
    requestStepUpEmailCode: '/scripts/Admin/Session/requestStepUpEmailCode.php',
    stepUpPasskeyOptions: '/scripts/Admin/Session/stepUpPasskeyOptions.php',
    verifyStepUp: '/scripts/Admin/Session/verifyStepUp.php',
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
    mfaResendCooldownSeconds,
    mfaResendMaxPerWindow,
    graduationBookingLoginPageUrl,
    graduationBookingDashboardPageUrl,
    adminLoginPageUrl,
    adminDashboardPageUrl,
    endpoints,
    BASE_URLS,
    costPerChildInOpenDaySignup,
    formatNumberByLocale,
    useToggleLanguage,
    logoutCurrentAdmin,
    adminUserManagementPermissionLevel,
    graduationBookingManagementPermissionLevel,
    openDaySignupManagementPermissionLevel,
    jobApplicationManagementPermissionLevel,
    infoSystemManagementPermissionLevel,
    alumniStudentsManagementPermissionLevel,
    BorrowingSystemManagementPermissionLevel,
    jackOfAllTradesPermissionLevel,
    getBaseUrl,
    getSessionsFromLocalStorage,
    getAdminSessionId,
    getGraduationBookingSessionId,
    useDarkMode,
    getClientFingerprint,
    buildAuthHeaders,
    buildLoginHeaders
}

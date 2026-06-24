import {v6 as uuidv6} from "uuid";
import i18n from '../../i18n/i18n-client.jsx';
import {useLocation, useNavigate} from "react-router-dom";
import {useEffect} from "react";

const isDevelopment = () => {
    return !import.meta.env.PROD;
};

const getBaseUrl = () => {
    return isDevelopment() ? BASE_URLS.development : BASE_URLS.production;
};

const generateEndpoints = () => {
    const baseUrl = getBaseUrl();
    const fullEndpoints = {};

    for (const [key, path] of Object.entries(ENDPOINTS)) {
        fullEndpoints[key] = `${baseUrl}${path}`;
    }

    return fullEndpoints;
};

const getCookies = () => {
    return document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});
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

const createSessions = (sessionName,) => {
    const sessionId = uuidv6();
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
    document.cookie = `${sessionName}_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
    document.cookie = `${sessionName}_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
    return sessionId;
}

const extendSession = (sessionName, sessionId) => {
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
    document.cookie = `${sessionName}_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
    document.cookie = `${sessionName}_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
}

const resetSession = (sessionName) => {
    document.cookie = `${sessionName}_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${sessionName}_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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
const graduationBookingLoginPageUrl = '/events/graduation-booking';
const graduationBookingDashboardPageUrl = '/events/graduation-booking/dashboard';
const adminLoginPageUrl = '/login';
const adminDashboardPageUrl = '/dashboard';
const costPerChildInOpenDaySignup = 150;

const ENDPOINTS = {
    checkGraduationBookingSession: '/scripts/Parents/GraduationBookings/checkGraduationBookingSession.php',
    getAllGraduationBookings: '/scripts/Admin/GraduationBookings/getAllGraduationBookings.php',
    validateGraduationBookingLogin: '/scripts/Parents/GraduationBookings/validateGraduationBookingLogin.php',
    createGraduationBookingSession: '/scripts/Parents/GraduationBookings/createGraduationBookingSession.php',
    deleteGraduationBookingEntry: '/scripts/Admin/GraduationBookings/deleteGraduationBookingEntry.php',
    submitAddGraduationBookingForm: '/scripts/Admin/GraduationBookings/submitAddGraduationBookingForm.php',
    getGraduationBookingInfoBySession: '/scripts/Parents/GraduationBookings/getGraduationBookingBySession.php',
    submitEditGraduationBookingForm: '/scripts/Admin/GraduationBookings/submitEditGraduationBookingForm.php',
    createAdminSession: '/scripts/Admin/Session/createAdminSession.php',
    validateAdminSession: '/scripts/Admin/Session/checkAdminSession.php',
    validateAdminLogin: '/scripts/Admin/Session/validateAdminLogin.php',
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
};

const BASE_URLS = {
    development: 'http://localhost:8080',
    production: ''
};

const endpoints = generateEndpoints();

const useToggleLanguage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

    }, [i18n.language]);

    return ({lng, ignoreDocUpdate}) => {
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

        if (!ignoreDocUpdate) {
            document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = lng;
        }
    };
};


export {
    generateEndpoints,
    formatDateFromPacific,
    createSessions,
    extendSession,
    resetSession,
    getMimeType,
    getCookies,
    isDevelopment,
    EMBEDDABLE_EXTENSIONS,
    cdCost,
    additionalAttendeeCost,
    pendingPaymentStatus,
    notSignedUpStatus,
    confirmedStatus,
    sessionDuration,
    msgTimeout,
    graduationBookingLoginPageUrl,
    graduationBookingDashboardPageUrl,
    adminLoginPageUrl,
    adminDashboardPageUrl,
    endpoints,
    BASE_URLS,
    costPerChildInOpenDaySignup,
    formatNumberByLocale,
    useToggleLanguage,
}

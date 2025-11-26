import {v6 as uuidv6} from "uuid";

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

const EMBEDDABLE_EXTENSIONS = ['pdf', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
const cdCost = 250;
const additionalAttendeeCost = 100;
const pendingPaymentStatus = 'Signed Up, pending payment';
const notSignedUpStatus = 'Not Signed Up';
const confirmedStatus = 'Confirmed';
const sessionDurationInHours = 12;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;
const msgTimeout = 5000;
const bookingLoginPageUrl = '/events/booking';
const bookingDashboardPageUrl = '/events/booking/dashboard';
const adminLoginPageUrl = '/admin/login';
const adminDashboardPageUrl = '/admin/dashboard';

const ENDPOINTS = {
    checkBookingSession: '/scripts/checkBookingSession.php',
    getAllBookings: '/scripts/getAllBookings.php',
    validateBookingLogin: '/scripts/validateBookingLogin.php',
    createBookingSession: '/scripts/createBookingSession.php',
    deleteBookingEntry: '/scripts/deleteBookingEntry.php',
    submitAddBookingForm: '/scripts/submitAddBookingForm.php',
    getBookingInfoBySession: '/scripts/getBookingBySession.php',
    submitEditBookingForm: '/scripts/submitEditBookingForm.php',
    createAdminSession: '/scripts/createAdminSession.php',
    validateAdminSession: '/scripts/checkAdminSession.php',
    validateAdminLogin: '/scripts/validateAdminLogin.php',
    getDashboardPermissions: '/scripts/getDashboardPermissions.php',
    getUserPermissions: '/scripts/getUserPermissions.php',
    submitForm: '/scripts/submitForm.php',
    submitJobApplication: '/scripts/submitJobApplication.php',
    getJobApplications: '/scripts/getJobApplications.php',
    updateBookingExtras: '/scripts/submitUpdateBookingExtras.php',
    getBookingConfirmation: '/scripts/getBookingConfirmation.php',
    serveJobApplicationFile: '/scripts/serveJobApplicationFile.php?file='
};

const BASE_URLS = {
    development: 'http://localhost:8080',
    production: ''
};

const endpoints = generateEndpoints();

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
    bookingLoginPageUrl,
    bookingDashboardPageUrl,
    adminLoginPageUrl,
    adminDashboardPageUrl,
    endpoints,
    BASE_URLS
}

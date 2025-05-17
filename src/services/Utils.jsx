import axios from "axios";
import {useCallback} from "react";
import {v4 as uuidv4} from "uuid";


const sessionDurationInHours = 1;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;
const bookingLoginPageUrl = '/events/booking';
const bookingDashboardPageUrl = '/events/booking/dashboard';
const adminLoginPageUrl = '/admin/login';
const adminDashboardPageUrl = '/admin/dashboard';

const checkBookingSessionEndpoint = '/scripts/checkBookingSession.php';
const getAllBookingsEndpoint = '/scripts/getAllBookings.php';
const validateBookingLoginEndpoint = '/scripts/validateBookingLogin.php';
const createBookingSessionEndpoint = '/scripts/createBookingSession.php';
const deleteBookingEntryEndpoint = '/scripts/deleteBookingEntry.php';
const submitAddBookingFormEndpoint = '/scripts/submitAddBookingForm.php';

const createAdminSessionEndpoint = '/scripts/createAdminSession.php';
const validateAdminSessionEndpoint = '/scripts/checkAdminSession.php';
const validateAdminLoginEndpoint = '/scripts/validateAdminLogin.php';

const getDashboardPermissionsEndpoint = '/scripts/getDashboardPermissions.php';
const getUserPermissionsEndpoint = '/scripts/getUserPermissions.php';



const fetchBookingsRequest = async (navigate) => {
        const response = await axios.get(getAllBookingsEndpoint, {
            headers: {'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0',}
        })
        .catch(
            (error) => {
                console.log(error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    navigate(adminLoginPageUrl);
                } else {
                    console.log(error.message);
                }
            }
        )

        if (response.data && response.data.success) {
            return response.data.data;
        } else {
            return null;
        }
}

const handleDeleteBookingRequest = async (
    bookingId,
    whatToDoOnSuccess
) => {
    try {
        const response = await axios.post(deleteBookingEntryEndpoint, {
            bookingId: bookingId,
        }, {
            headers: {'Content-Type': 'application/json'}
        });

        if (response.data.success) {
            whatToDoOnSuccess()
        } else {
            throw new Error(`${response.data.message}`);
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

const checkBookingSessionFromBookingDashboard = async (navigate) => {
    const sessionId = validateBookingSessionLocally();

    if (!sessionId) {
        navigate(bookingLoginPageUrl,);
        return;
    }

    try {
        const sessionResponse = await axios.post(checkBookingSessionEndpoint, {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!sessionResponse.data.success) {
            navigate(bookingLoginPageUrl);
        }

    } catch (error) {
        console.log(error.message);
        navigate(bookingLoginPageUrl);
    }
}

const handleAddBookingRequest = async (formData, whatToDoOnSuccess) => {
    try {
        const response = await axios.post(submitAddBookingFormEndpoint,
            formData, {headers: {'Content-Type': 'multipart/form-data'}});

        if (response.data.success) {
            whatToDoOnSuccess();
        } else {
            throw new Error(`${response.data.message}`);
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

const validateBookingLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await axios.post(validateBookingLoginEndpoint,
            {username, password}, {headers: {'Content-Type': 'application/json'}});

        if (response.data.success) {
            const sessionResponse = await axios.post(createBookingSessionEndpoint, {
                username: username,
                session_id: createSessions('harvest_schools_booking')
            }, {headers: {'Content-Type': 'application/json'}});

            if (sessionResponse.data.success) {
                navigate(bookingDashboardPageUrl);
            } else {
                throw new Error('Session creation failed. Please try again');
            }
        } else {
            throw new Error('Login failed. Wrong Username or Password. Please try again');
        }
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error(error.message);
        }
    }
}

const checkBookingSessionFromBookingLogin = async (navigate) => {
    const sessionId = validateBookingSessionLocally();
    if (!sessionId ) {return;}

    try {
        const response = await axios.post(checkBookingSessionEndpoint,
            {session_id: sessionId}, {headers: {'Content-Type': 'application/json'}});

        if (response.data.success) {
            navigate(bookingDashboardPageUrl);
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkAdminSessionFromAdminDashboard = async (navigate, setDashboardOptions) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const sessionResponse = await axios.post(validateAdminSessionEndpoint,
            {session_id: sessionId}, {headers: {'Content-Type': 'application/json'}});

        if (!sessionResponse.data.success) {
            navigate(adminLoginPageUrl);
            return;
        }

        const permissionsResponse = await axios.post(getDashboardPermissionsEndpoint,
            {session_id: sessionId}, {headers: {'Content-Type': 'application/json'}});

        if (permissionsResponse.data.success) {
            setDashboardOptions(permissionsResponse.data.dashboardOptions);
        }

    } catch (error) {
        console.log(error.message);
        navigate(adminLoginPageUrl);
    }
};

const validateAdminLogin = async  (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] ===  ('field_' + usernameFieldId) )[1];
    const password = formDataEntries.find(entry => entry[0] ===  ('field_' + passwordFieldId) )[1];

    try {
        const response = await axios.post(validateAdminLoginEndpoint,
            {username, password}, {headers: {'Content-Type': 'application/json'}});

        if (response.data.success) {
            const sessionResponse = await axios.post(createAdminSessionEndpoint, {
                username: username,
                session_id: createSessions('harvest_schools_admin')
            }, {headers: {'Content-Type': 'application/json'}});

            if (sessionResponse.data.success) {
                navigate(adminDashboardPageUrl);
            } else {
                throw new Error('Session creation failed. Please try again');
            }
        } else {
            throw new Error('Login failed. Wrong Username or Password. Please try again');
        }

    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error(error.message);
        }
    }
}

const checkAdminSessionFromAdminLogin = async (navigate) => {
    const sessionId = validateAdminSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await axios.post(validateAdminSessionEndpoint,
            {session_id: sessionId}, {headers: {'Content-Type': 'application/json'}});

        if (response.data.success) {
            extendSession('harvest_schools_admin', sessionId);
            navigate(adminDashboardPageUrl);
        }
    } catch (error) {
        console.log(error.message);
    }
};

const checkAdminSession = async (navigate, allowedPermission) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const response = await axios.post(validateAdminSessionEndpoint,
            {session_id: sessionId}, {headers: {'Content-Type': 'application/json'}});

        if (response.data.success) {
            extendSession('harvest_schools_admin', sessionId);
        } else {
            navigate(adminLoginPageUrl);
        }

        const userPermissionsResponse = await axios.post(getUserPermissionsEndpoint,
            {session_id: sessionId}, {headers: {'Content-Type': 'application/json'}});

        if (!userPermissionsResponse.data.includes(allowedPermission)) {
            navigate(adminLoginPageUrl);
        }
    } catch (error) {
        console.log(error.message);
    }
};

const checkBookingSession = async (navigate) => {
    const sessionId = validateBookingSessionLocally();

    if (!sessionId) {
        navigate(bookingLoginPageUrl);
        return;
    }

    try {
        const response = await axios.post(checkBookingSessionEndpoint,
            {session_id: sessionId}, {headers: {'Content-Type': 'application/json'}});

        if (response.data.success) {
            extendSession('harvest_schools_booking', sessionId);
        } else {
            navigate(bookingLoginPageUrl);
        }
    } catch (error) {
        console.log(error.message);
    }
}

function getCookies() {
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

const getStorageKey = (formTitle, fieldId, fieldLabel) => {
    return `form_${formTitle}_${fieldLabel}_${fieldId}`;
};

const createSessions = (sessionName,) => {
    const sessionId = uuidv4();
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
    document.cookie = `${sessionName}_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
    document.cookie = `${sessionName}_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;
    return sessionId;
}

const extendSession = (sessionName, sessionId) => {
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
    document.cookie = `${sessionName}_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
    document.cookie = `${sessionName}_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;
}

const resetSession = (sessionName) => {
    document.cookie = `${sessionName}_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${sessionName}_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const validateBookingSessionLocally = () => {
    const cookies = getCookies();
    const sessionId = cookies.harvest_schools_booking_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        resetSession('harvest_schools_booking');
        return null;
    } else {
        return sessionId;
    }
}

const validateAdminSessionLocally = () => {
    const cookies = getCookies();
    const sessionId = cookies.harvest_schools_admin_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        resetSession('harvest_schools_admin');
        return null;
    } else {
        return sessionId;
    }
}

const useFormCache = (formTitle, fields) => {

    const loadCachedValues = useCallback(() => {
        const cachedValues = {};
        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            const cachedValue = localStorage.getItem(storageKey);
            if (cachedValue !== null) {
                cachedValues[field.id] = cachedValue;
            }
        });
        return cachedValues;
    }, [fields, formTitle]);

    const saveToCache = useCallback((field, value) => {
        const storageKey = getStorageKey(formTitle, field.id, field.label);
        if (value) {
            localStorage.setItem(storageKey, value);
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [formTitle]);

    const clearCache = useCallback(() => {
        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            localStorage.removeItem(storageKey);
        });
    }, [fields, formTitle]);

    return { loadCachedValues, saveToCache, clearCache };
};

export {
    checkAdminSession,
    checkBookingSession,
    sessionDuration,
    sessionDurationInHours,
    getCookies,
    formatDateFromPacific,
    useFormCache,
    getStorageKey,
    checkAdminSessionFromAdminLogin,
    validateAdminLogin,
    checkAdminSessionFromAdminDashboard,
    checkBookingSessionFromBookingLogin,
    validateBookingLogin,
    handleAddBookingRequest,
    checkBookingSessionFromBookingDashboard,
    handleDeleteBookingRequest,
    fetchBookingsRequest
};
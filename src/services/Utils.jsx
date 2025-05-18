import axios from "axios";
import {useCallback} from "react";
import {v4 as uuidv4} from "uuid";


const sessionDurationInHours = 12;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;
const msgTimeout = 5000;
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
const getBookingInfoBySessionEndpoint = '/scripts/getBookingBySession.php'

const createAdminSessionEndpoint = '/scripts/createAdminSession.php';
const validateAdminSessionEndpoint = '/scripts/checkAdminSession.php';
const validateAdminLoginEndpoint = '/scripts/validateAdminLogin.php';

const getDashboardPermissionsEndpoint = '/scripts/getDashboardPermissions.php';
const getUserPermissionsEndpoint = '/scripts/getUserPermissions.php';
const submitFormEndpoint = '/scripts/submitForm.php';
const getJobApplicationsEndpoint = '/scripts/getJobApplications.php';

const fetchBookingsRequest = async (navigate, setAllBookings) => {
    try {
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            navigate(adminLoginPageUrl);
            return;
        }

        const response = await fetch(getAllBookingsEndpoint, {method: 'GET'});
        const result = await response.json();

        if (result) {
            if (result.success && result.data) {
                setAllBookings( result.data );
            } else {
                if (result.message) {
                    console.log(result.message);
                }


                if (result.code  && (result.code === 401 || result.code === 403)) {
                    navigate(adminLoginPageUrl);
                }
            }
        }

    } catch (error) {
        console.log(error.message);
    }

    return null;
}

const handleDeleteBookingRequest = async (bookingId) => {
    try {
        const sessionId = validateAdminSessionLocally();
        if (!sessionId) {
            return 'Session expired'
        }

        const response = await fetch(deleteBookingEntryEndpoint, {
            method: 'POST',
            body: JSON.stringify({bookingId: bookingId})
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return result.message;
        }

    } catch (error) {
        return error.message;
    }
}

const checkBookingSessionFromBookingDashboard = async (navigate) => {
    const sessionId = validateBookingSessionLocally();

    if (!sessionId) {
        navigate(bookingLoginPageUrl);
        return;
    }

    try {
        const response = await fetch(checkBookingSessionEndpoint, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result && !result.success) {

            if (result.message ) {
                console.log(result.message);
            }

            navigate(bookingLoginPageUrl);
        }
    } catch (error) {
        console.log(error.message);
        navigate(bookingLoginPageUrl);
    }
}

const handleAddBookingRequest = async (formData) => {
    try {
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(submitAddBookingFormEndpoint, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return `${result.message}`;
        }
    } catch (error) {
        return error.message;
    }
}

const validateBookingLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await fetch(validateBookingLoginEndpoint, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {
            const sessionResponse = await fetch(createBookingSessionEndpoint, {
                method: 'POST',
                body: JSON.stringify({username: username, session_id: createSessions('harvest_schools_booking')})
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(bookingDashboardPageUrl);
            } else {
                return sessionResult;
            }
        } else {
            return result;
        }
    } catch (error) {
        return error.message;
    }
}

const checkBookingSessionFromBookingLogin = async (navigate) => {
    const sessionId = validateBookingSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(checkBookingSessionEndpoint, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            navigate(bookingDashboardPageUrl);
        } else {
           if (result.message) {
                console.log(result.message);
           }
        }
    } catch (error) {
        return error.message;
    }
}

const checkAdminSessionFromAdminDashboard = async (navigate, setDashboardOptions) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const sessionResponse = await fetch(validateAdminSessionEndpoint, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const sessionResult = await sessionResponse.json();

        if (sessionResult && !sessionResult.success) {
            if (sessionResult.message) {
                console.log(sessionResult.message);
            }

            navigate(adminLoginPageUrl);
        }

        const permissionsResponse = await fetch(getDashboardPermissionsEndpoint, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const permissionsResult = await permissionsResponse.json();

        if (permissionsResult.success) {
            setDashboardOptions(permissionsResult.dashboardOptions);
        } else {
            if (permissionsResult.message) {
                console.log(permissionsResult.message);
            }

            if (permissionsResult.code && (permissionsResult.code === 401 || permissionsResult.code === 403 || permissionsResult.code === 404))  {
                navigate(adminLoginPageUrl);
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const validateAdminLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await fetch(validateAdminLoginEndpoint, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {
            const sessionResponse = await fetch(createAdminSessionEndpoint, {
                method: 'POST',
                body: JSON.stringify({username: username, session_id: createSessions('harvest_schools_admin')})
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(adminDashboardPageUrl);
            } else {
                return sessionResult;
            }
        } else {
            return result;
        }
    } catch (error) {
        return error.message;
    }
}

const checkAdminSessionFromAdminLogin = async (navigate) => {
    const sessionId = validateAdminSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(validateAdminSessionEndpoint, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_admin', sessionId);
            navigate(adminDashboardPageUrl);
        } else {
            if (result.message) {
                console.log(result.message);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkAdminSession = async (navigate, allowedPermission) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const response = await fetch(validateAdminSessionEndpoint, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_admin', sessionId);
        } else {
            navigate(adminLoginPageUrl);
            return result;
        }

        const userPermissionsResponse = await fetch(getUserPermissionsEndpoint, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const userPermissionsResult = await userPermissionsResponse.json();

        if (userPermissionsResult && userPermissionsResult.success && userPermissionsResult.cleanPermissionLevels) {
            if (!userPermissionsResult.cleanPermissionLevels.includes(allowedPermission)) {
                navigate(adminLoginPageUrl);
            }

            return userPermissionsResult;
        } else {
            if (userPermissionsResult.message) {
                console.log(userPermissionsResult.message);
            }

            if (userPermissionsResult.code && (userPermissionsResult.code === 401 || userPermissionsResult.code === 403 || userPermissionsResult.code === 404)) {
                navigate(adminLoginPageUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

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
    msgTimeout,
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
    fetchBookingsRequest,
    validateAdminSessionLocally,
    validateBookingSessionLocally,
    createSessions,
    extendSession,
    resetSession,
    createAdminSessionEndpoint,
    validateAdminSessionEndpoint,
    validateAdminLoginEndpoint,
    getDashboardPermissionsEndpoint,
    getUserPermissionsEndpoint,
    checkBookingSessionEndpoint,
    getAllBookingsEndpoint,
    validateBookingLoginEndpoint,
    createBookingSessionEndpoint,
    deleteBookingEntryEndpoint,
    submitAddBookingFormEndpoint,
    getBookingInfoBySessionEndpoint,
    submitFormEndpoint,
    bookingLoginPageUrl,
    bookingDashboardPageUrl,
    adminLoginPageUrl,
    adminDashboardPageUrl,
    getJobApplicationsEndpoint,
};
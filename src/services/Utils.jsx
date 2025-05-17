import axios from "axios";
import {useCallback} from "react";
import {v4 as uuidv4} from "uuid";


const sessionDurationInHours = 1;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;

const fetchBookingsRequest = async (navigate) => {
    try {

        const response = await axios.get(`/scripts/getAllBookings.php`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

        if (response.data.success) {
            console.log(response);
            return response.data.data;
        } else {
            return null;
        }

    } catch (error) {

        if (error.response && error.response.data && error.response.data.message && error.response.data.code) {
            console.log(error.response.data.message);

            if (error.response.data.code === 401 || error.response.data.code === 403) {
                navigate('/admin/login');
            }
        } else {
            console.log(error.message);

            if (error.status === 401 || error.status === 403 || error.code === 401 || error.code === 403) {
                navigate('/admin/login');
            }
        }

        return null;

    }
}

const handleDeleteBookingRequest = async (
    bookingId,
    whatToDoOnSuccess
) => {
    try {
        const response = await axios.post('/scripts/deleteBookingEntry.php', {
            bookingId: bookingId,
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
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

const checkBookingSessionFromBookingDashboard = async (
    navigate
) => {
    const cookies = getCookies();

    const sessionId = cookies.harvest_schools_booking_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_booking_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_booking_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/events/booking/');
        return;
    }

    try {
        const sessionResponse = await axios.post('/scripts/checkBookingSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!sessionResponse.data.success) {
            navigate('/events/booking/');
        }

    } catch (error) {
        console.log(error.message);
        navigate('/events/booking/');
    }
}

const handleAddBookingRequest = async (
    formData, whatToDoOnSuccess
) => {
    try {
        const response = await axios.post('/scripts/submitAddBookingForm.php',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (response.data.success) {
            whatToDoOnSuccess();
        } else {
            throw new Error(`${response.data.message}`);
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

const validateBookingLogin = async (
    formData,
    usernameFieldId,
    passwordFieldId,
    navigate
) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await axios.post('/scripts/validateBookingLogin.php', {
            username,
            password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            const sessionId = uuidv4();
            const sessionExpiry = new Date();
            sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
            document.cookie = `harvest_schools_booking_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
            document.cookie = `harvest_schools_booking_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;

            const sessionResponse = await axios.post('/scripts/createBookingSession.php', {
                username: username,
                session_id: sessionId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (sessionResponse.data.success) {
                navigate('/events/booking/dashboard');
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

const checkBookingSessionFromBookingLogin = async (
    navigate
) => {
    const cookies = getCookies();
    const sessionId = cookies.harvest_schools_booking_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_booking_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_booking_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        return;
    }

    try {
        const response = await axios.post('/scripts/checkBookingSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            navigate('/events/booking/dashboard');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkAdminSessionFromAdminDashboard = async (
    navigate,
    setDashboardOptions
) => {
    const cookies = getCookies();

    const sessionId = cookies.harvest_schools_admin_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/admin/login');
        return;
    }

    try {
        const sessionResponse = await axios.post('/scripts/checkAdminSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!sessionResponse.data.success) {
            navigate('/admin/login');
            return;
        }

        const permissionsResponse = await axios.post('/scripts/getDashboardPermissions.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (permissionsResponse.data.success) {
            setDashboardOptions(permissionsResponse.data.dashboardOptions);
        }


    } catch (error) {
        console.log(error.message);
        navigate('/admin/login');
    }
};

const validateAdminLogin = async  (
    formData,
    usernameFieldId,
    passwordFieldId,
    navigate
) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] ===  ('field_' + usernameFieldId) )[1];
    const password = formDataEntries.find(entry => entry[0] ===  ('field_' + passwordFieldId) )[1];

    try {
        const response = await axios.post('/scripts/validateAdminLogin.php', {
            username,
            password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            const sessionId = uuidv4();
            const sessionExpiry = new Date();
            sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
            document.cookie = `harvest_schools_admin_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
            document.cookie = `harvest_schools_admin_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;


            const sessionResponse = await axios.post('/scripts/createAdminSession.php', {
                username: username,
                session_id: sessionId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (sessionResponse.data.success) {
                navigate('/admin/dashboard');
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

const checkAdminSessionFromAdminLogin = async (
    navigate
) => {
    const cookies = getCookies()

    const sessionId = cookies.harvest_schools_admin_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        return;
    }

    try {
        const response = await axios.post('/scripts/checkAdminSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            navigate('/admin/dashboard');
            const sessionExpiry = new Date();
            sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
            document.cookie = `harvest_schools_admin_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
            document.cookie = `harvest_schools_admin_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;
        }
    } catch (error) {
        console.log(error.message);
    }
};

const checkAdminSession = async (
    navigate,
    allowedPermission
) => {
    const cookies = getCookies()

    const sessionId = cookies.harvest_schools_admin_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/admin/login');
    }

    try {
        const response = await axios.post('/scripts/checkAdminSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            navigate('/admin/login');
        } else {
            const sessionExpiry = new Date();
            sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
            document.cookie = `harvest_schools_admin_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
            document.cookie = `harvest_schools_admin_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;
        }


        const userPermissionsResponse = await axios.post('/scripts/getUserPermissions.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });


        if (!userPermissionsResponse.data.includes(allowedPermission)) {
            navigate('/admin/dashboard');
            return;
        }

    } catch (error) {
        console.log(error.message);
    }
};

const checkBookingSession = async (
    navigate
) => {

    const cookies = getCookies()

    const sessionId = cookies.harvest_schools_booking_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_booking_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_booking_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/events/booking');
    }

    try {
        const response = await axios.post('/scripts/checkBookingSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            navigate('/events/booking');
        } else {
            const sessionExpiry = new Date();
            sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
            document.cookie = `harvest_schools_booking_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/`;
            document.cookie = `harvest_schools_booking_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/`;
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

const formatDateFromPacific = (
    pacificTimeString
) => {
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

const getStorageKey = (
    formTitle,
    fieldId,
    fieldLabel
) => {
    return `form_${formTitle}_${fieldLabel}_${fieldId}`;
};

const useFormCache = (
    formTitle,
    fields
) => {

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
import axios from "axios";
import {useCallback} from "react";


const sessionDurationInHours = 1;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;


const checkAdminSession = async (
    navigate,
    setIsLoading,
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
    } finally {
        setIsLoading(false);
    }
};

const checkBookingSession = async (
    navigate,
    setIsLoading,
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
    } finally {
        setIsLoading(false);
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


export {checkAdminSession, checkBookingSession, sessionDuration, sessionDurationInHours, getCookies, formatDateFromPacific, useFormCache, getStorageKey};
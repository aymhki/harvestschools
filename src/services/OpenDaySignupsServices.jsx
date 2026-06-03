import {
    adminLoginPageUrl,
    endpoints,
} from "./GeneralUtils.jsx";
import {validateAdminSessionLocally} from "./MainAdminServices.jsx";

const submitOpenDaySignupRequest = async (formData, numberOfAttendees) => {
    try {
        formData.append('numberOfAttendees', numberOfAttendees)

        const response = await fetch(endpoints.submitOpenDaySignupForm, {
            method: 'POST',
            body: formData
        })

        const result = await response.json();

        if (result && result.success) {
            if (result.message) {
                console.log(result.message);
                return result;
            } else {
                return 'Signup failed. Please try again.';
            }
        } else {
            return result.message || 'Signup failed. Please try again.';
        }
    } catch ( error ) {
        return error.message;
    }
}

const fetchAllOpenDaySignups = async (navigate, setOpenDaySignups) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        console.log('Session expired');
    }

    setOpenDaySignups(null);

    try {
        const response = await fetch(endpoints.getOpenDaySignups,
            {method: 'POST', body: JSON.stringify({session_id: sessionId})});

        const result = await response.json();

        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
            setOpenDaySignups(result.data);
        } else {
            setOpenDaySignups(null);

            if (result && result.message) {
                console.log(result.message);
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(adminLoginPageUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


export {
    submitOpenDaySignupRequest,
    fetchAllOpenDaySignups
}
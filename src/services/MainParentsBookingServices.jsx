

import {
    bookingLoginPageUrl,
    createSessions,
    bookingDashboardPageUrl,
    extendSession,
    sessionDuration,
    resetSession,
    getCookies,
    endpoints,
} from "./GeneralUtils.jsx";


const fetchBookingConfirmationRequest = async (bookingId, extrasId, username, password_hash) => {
    try {
        const response = await fetch(endpoints.getBookingConfirmation, {
            method: 'POST',
            body: JSON.stringify({bookingId: bookingId, username: username, password_hash: password_hash, extrasId: extrasId})
        })
        
        const result = await response.json();
        
        if (result && result.success) {
            return result;
        } else {
            return result.message || result || 'An error occurred while fetching booking confirmation.';
        }
        
    } catch (error) {
        return error.message || error || 'An error occurred while fetching booking confirmation.';
    }
}

const submitUpdateBookingExtrasRequest = async (formData, bookingId, navigate) => {
    try {
        const sessionId = validateBookingSessionLocally();
        
        if (!sessionId) {
            return 'Session expired';
        }
        
        const response = await fetch (endpoints.checkBookingSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        })
        
        const result = await response.json();
        
        if (result && !result.success) {
            if (result.message) {
                console.log(result.message);
            }
            
            navigate(bookingLoginPageUrl);
        }
        
        formData.append('bookingId', bookingId);
        
        const updateResponse = await fetch(endpoints.updateBookingExtras, {
            method: 'POST',
            body: formData
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult && updateResult.success) {
            return updateResult;
        } else {
            if (updateResult && updateResult.message) {
                return updateResult.message;
            } else {
                return 'Update failed. Please try again.';
            }
        }
    } catch ( error ) {
        return error.message;
    }
    
}

const fetchBookingInfoBySessionRequest = async (navigate) => {
    try {
        const sessionId = validateBookingSessionLocally();

        if (!sessionId) {
            navigate(bookingLoginPageUrl);
            return 'Session expired';
        }

        const response = await fetch(endpoints.getBookingInfoBySession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        } else {
            if (result && result.message) {
                return result;
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(bookingLoginPageUrl);
            }
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
        const response = await fetch(endpoints.checkBookingSession, {
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

const validateBookingLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await fetch(endpoints.validateBookingLogin, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {
            const sessionResponse = await fetch(endpoints.createBookingSession, {
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
        const response = await fetch(endpoints.checkBookingSession, {
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

const checkBookingSession = async (navigate) => {
    const sessionId = validateBookingSessionLocally();

    if (!sessionId) {
        navigate(bookingLoginPageUrl);
        return;
    }

    try {
        const response = await fetch(endpoints.checkBookingSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_booking', sessionId);
        } else {
            if (result.message) {
                console.log(result.message);
            }

            navigate(bookingLoginPageUrl);
        }
    } catch (error) {
        console.log(error.message);
    }
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

export {
    checkBookingSession,
    checkBookingSessionFromBookingLogin,
    validateBookingLogin,
    checkBookingSessionFromBookingDashboard,
    fetchBookingInfoBySessionRequest,
    submitUpdateBookingExtrasRequest,
    fetchBookingConfirmationRequest,
};

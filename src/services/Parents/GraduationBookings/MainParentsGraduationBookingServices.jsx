

import {
    graduationBookingLoginPageUrl,
    createSessions,
    graduationBookingDashboardPageUrl,
    extendSession,
    sessionDuration,
    resetSession,
    getSessionsFromLocalStorage,
    endpoints,
} from "../../General/GeneralUtils.jsx";


const fetchGraduationBookingConfirmationRequest = async (bookingId, extrasId, username, password_hash) => {
    try {
        const response = await fetch(endpoints.getGraduationBookingConfirmation, {
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

const submitUpdateGraduationBookingExtrasRequest = async (formData, bookingId, navigate) => {
    try {
        const sessionId = validateGraduationBookingSessionLocally();
        
        if (!sessionId) {
            return 'Session expired';
        }
        
        const response = await fetch (endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        })
        
        const result = await response.json();
        
        if (result && !result.success) {
            if (result.message) {
                console.log(result.message);
            }
            
            navigate(graduationBookingLoginPageUrl, { replace: true });
        }
        
        formData.append('bookingId', bookingId);

        const updateResponse = await fetch(endpoints.updateGraduationBookingExtras, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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

const fetchGraduationBookingInfoBySessionRequest = async (navigate) => {
    try {
        const sessionId = validateGraduationBookingSessionLocally();

        if (!sessionId) {
            navigate(graduationBookingLoginPageUrl, { replace: true });
            return 'Session expired';
        }

        const response = await fetch(endpoints.getGraduationBookingInfoBySession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        } else {
            if (result && result.message) {
                return result;
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(graduationBookingLoginPageUrl, { replace: true });
            }
        }
    } catch (error) {
         return error.message;
    }
}

const checkGraduationBookingSessionFromBookingDashboard = async (navigate) => {
    const sessionId = validateGraduationBookingSessionLocally();

    if (!sessionId) {
        navigate(graduationBookingLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        });

        const result = await response.json();

        if (result && !result.success) {

            if (result.message ) {
                console.log(result.message);
            }

            navigate(graduationBookingLoginPageUrl, { replace: true });
        }
    } catch (error) {
        console.log(error.message);
        navigate(graduationBookingLoginPageUrl, { replace: true });
    }
}

const validateGraduationBookingLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await fetch(endpoints.validateGraduationBookingLogin, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {
            const sessionResponse = await fetch(endpoints.createGraduationBookingSession, {
                method: 'POST',
                body: JSON.stringify({username: username, user_id: result.id}),
                headers: {
                    'Authorization': 'Bearer ' + createSessions('harvest_schools_graduation_booking')
                }
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(graduationBookingDashboardPageUrl, { replace: true });
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

const checkGraduationBookingSessionFromBookingLogin = async (navigate) => {
    const sessionId = validateGraduationBookingSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        });

        const result = await response.json();

        if (result.success) {
            navigate(graduationBookingDashboardPageUrl, { replace: true });
        } else {
           if (result.message) {
                console.log(result.message);
           }
        }
    } catch (error) {
        return error.message;
    }
}

const checkGraduationBookingSession = async (navigate) => {
    const sessionId = validateGraduationBookingSessionLocally();

    if (!sessionId) {
        navigate(graduationBookingLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_graduation_booking', sessionId);
        } else {
            if (result.message) {
                console.log(result.message);
            }

            navigate(graduationBookingLoginPageUrl, { replace: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const validateGraduationBookingSessionLocally = () => {
    const localStorage = getSessionsFromLocalStorage('harvest_schools_graduation_booking');
    const sessionId = localStorage.sessionId;
    const sessionTime = parseInt(localStorage.sessionTime, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        resetSession('harvest_schools_graduation_booking');
        return null;
    } else {
        return sessionId;
    }
}



export {
    checkGraduationBookingSession,
    checkGraduationBookingSessionFromBookingLogin,
    validateGraduationBookingLogin,
    checkGraduationBookingSessionFromBookingDashboard,
    fetchGraduationBookingInfoBySessionRequest,
    submitUpdateGraduationBookingExtrasRequest,
    fetchGraduationBookingConfirmationRequest,
};

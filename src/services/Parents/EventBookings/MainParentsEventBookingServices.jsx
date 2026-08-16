

import {
    EventBookingLoginPageUrl,
    createSessions,
    EventBookingDashboardPageUrl,
    extendSession,
    sessionDuration,
    resetSession,
    getSessionsFromLocalStorage,
    endpoints,
    buildAuthHeaders,
    buildLoginHeaders,
    buildRecoveryHeaders,
    getCurrentLangCode,
    isMobileApp
} from "../../General/GeneralUtils.jsx";

import {
    isBiometricAvailable,
    saveBiometricCredentials,
    generateSecureSessionId,
    getMobileSession,
    setMobileSession,
    extendMobileSession,
    clearMobileSession,
} from "../../General/CapacitorSecureAuthUtils.jsx";

const EVENT_BOOKING_SESSION_NAME = 'harvest_schools_event_booking';

const createEventBookingSessionLocally = async () => {
    if (isMobileApp()) {
        const sessionId = generateSecureSessionId();
        await setMobileSession(EVENT_BOOKING_SESSION_NAME, sessionId);
        return sessionId;
    }

    return createSessions(EVENT_BOOKING_SESSION_NAME);
}

const clearEventBookingSessionLocally = async () => {
    if (isMobileApp()) {
        await clearMobileSession(EVENT_BOOKING_SESSION_NAME);
    } else {
        resetSession(EVENT_BOOKING_SESSION_NAME);
    }
}

const logoutEventBooking = async (navigate) => {
    await clearEventBookingSessionLocally();
    navigate(EventBookingLoginPageUrl, { replace: true });
}


const fetchEventBookingConfirmationRequest = async (bookingId, extrasId, username, password_hash) => {
    try {
        const response = await fetch(endpoints.getEventBookingConfirmation, {
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

const submitUpdateEventBookingExtrasRequest = async (formData, bookingId, navigate) => {
    try {
        const sessionId = await validateEventBookingSessionLocally();
        
        if (!sessionId) {
            return 'Session expired';
        }
        
        const response = await fetch (endpoints.checkEventBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        })
        
        const result = await response.json();
        
        if (result && !result.success) {
            if (result.message) {
                console.log(result.message);
            }
            
            navigate(EventBookingLoginPageUrl, { replace: true });
        }
        
        formData.append('bookingId', bookingId);

        const updateResponse = await fetch(endpoints.updateEventBookingExtras, {
            method: 'POST',
            body: formData,
            headers: await buildAuthHeaders(sessionId)
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

const fetchEventBookingInfoBySessionRequest = async (navigate) => {
    try {
        const sessionId = await validateEventBookingSessionLocally();

        if (!sessionId) {
            navigate(EventBookingLoginPageUrl, { replace: true });
            return 'Session expired';
        }

        const response = await fetch(endpoints.getEventBookingInfoBySession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        } else {
            if (result && result.message) {
                return result;
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(EventBookingLoginPageUrl, { replace: true });
            }
        }
    } catch (error) {
         return error.message;
    }
}

const checkEventBookingSessionFromBookingDashboard = async (navigate) => {
    const sessionId = await validateEventBookingSessionLocally();

    if (!sessionId) {
        navigate(EventBookingLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.checkEventBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && !result.success) {

            if (result.message ) {
                console.log(result.message);
            }

            navigate(EventBookingLoginPageUrl, { replace: true });
        }
    } catch (error) {
        console.log(error.message);
        navigate(EventBookingLoginPageUrl, { replace: true });
    }
}

const performEventBookingLogin = async (username, password, navigate, persistBiometricCredentials) => {
    try {
        const response = await fetch(endpoints.validateEventBookingLogin, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp() && persistBiometricCredentials) {
                const biometricHardwareAvailable = await isBiometricAvailable();
                if (biometricHardwareAvailable) {
                    await saveBiometricCredentials(EVENT_BOOKING_SESSION_NAME, username, password);
                }
            }

            const newSessionId = await createEventBookingSessionLocally();

            const sessionResponse = await fetch(endpoints.createEventBookingSession, {
                method: 'POST',
                body: JSON.stringify({username: username, user_id: result.id}),
                headers: await buildAuthHeaders(newSessionId)
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(EventBookingDashboardPageUrl, { replace: true });
            } else {
                await clearEventBookingSessionLocally();
                return sessionResult;
            }
        } else {
            return result;
        }
    } catch (error) {
        return error.message;
    }
}

const validateEventBookingLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    return performEventBookingLogin(username, password, navigate, true);
}

const validateEventBookingLoginWithCredentials = async (username, password, navigate) => {
    return performEventBookingLogin(username, password, navigate, false);
}

const checkEventBookingSessionFromBookingLogin = async (navigate) => {
    const sessionId = await validateEventBookingSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(endpoints.checkEventBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp()) {
                await extendMobileSession(EVENT_BOOKING_SESSION_NAME, sessionId);
            } else {
                extendSession(EVENT_BOOKING_SESSION_NAME, sessionId);
            }

            navigate(EventBookingDashboardPageUrl, { replace: true });
        } else {
           if (result.message) {
                console.log(result.message);
           }
        }
    } catch (error) {
        return error.message;
    }
}

const checkEventBookingSession = async (navigate) => {
    const sessionId = await validateEventBookingSessionLocally();

    if (!sessionId) {
        navigate(EventBookingLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.checkEventBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp()) {
                await extendMobileSession(EVENT_BOOKING_SESSION_NAME, sessionId);
            } else {
                extendSession(EVENT_BOOKING_SESSION_NAME, sessionId);
            }

        } else {
            if (result.message) {
                console.log(result.message);
            }

            await clearEventBookingSessionLocally();
            navigate(EventBookingLoginPageUrl, { replace: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const validateEventBookingSessionLocally = async () => {

    if (isMobileApp()) {
        const mobileSessionId = await getMobileSession(EVENT_BOOKING_SESSION_NAME);

        if (mobileSessionId) {
            return mobileSessionId;
        }
    } else {
        const localStorageData = getSessionsFromLocalStorage(EVENT_BOOKING_SESSION_NAME);
        const sessionId = localStorageData.sessionId;
        const sessionTime = parseInt(localStorageData.sessionTime, 10);

        if (sessionId && sessionTime && (Date.now() - sessionTime) <= sessionDuration) {
            return sessionId;
        }

        resetSession(EVENT_BOOKING_SESSION_NAME);
    }

    return null;
}


const requestEventBookingPasswordReset = async (username) => {
    try {
        const response = await fetch(endpoints.requestEventBookingPasswordReset, {
            method: 'POST',
            headers: await buildRecoveryHeaders(),
            body: JSON.stringify({username, lang: getCurrentLangCode()}),
        });
        const result = await response.json();

        if (result && result.success && result.reset_required) {
            return {
                success: true,
                resetRequired: true,
                resetToken: result.resetToken,
                maskedEmails: result.maskedEmails || [],
            };
        }
        return result;
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const requestEventBookingResetEmailCode = async (resetToken) => {
    try {
        const response = await fetch(endpoints.requestEventBookingResetEmailCode, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({reset_token: resetToken, lang: getCurrentLangCode()}),
        });
        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const completeEventBookingPasswordReset = async (resetToken, code, newPassword, username) => {
    try {
        const response = await fetch(endpoints.verifyEventBookingPasswordReset, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({reset_token: resetToken, code, new_password: newPassword}),
        });
        const result = await response.json();

        if (result && result.success && username && isMobileApp()) {
            const biometricHardwareAvailable = await isBiometricAvailable();
            if (biometricHardwareAvailable) {
                await saveBiometricCredentials(EVENT_BOOKING_SESSION_NAME, username, newPassword);
            }
        }
        return result;
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const listEventBookingStudents = async () => {
    try {
        const response = await fetch(endpoints.searchEventBookingStudents, {
            method: 'POST',
            headers: await buildRecoveryHeaders(),
            body: JSON.stringify({all: true}),
        });
        const result = await response.json();
        return (result && result.success) ? (result.results || []) : [];
    } catch (error) {
        return [];
    }
}


const recoverEventBookingUsername = async (method, payload) => {
    try {
        const response = await fetch(endpoints.recoverEventBookingUsername, {
            method: 'POST',
            headers: await buildRecoveryHeaders(),
            body: JSON.stringify({method, lang: getCurrentLangCode(), ...payload}),
        });
        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

export {
    EVENT_BOOKING_SESSION_NAME,
    validateEventBookingSessionLocally,
    clearEventBookingSessionLocally,
    logoutEventBooking,
    requestEventBookingPasswordReset,
    requestEventBookingResetEmailCode,
    completeEventBookingPasswordReset,
    listEventBookingStudents,
    recoverEventBookingUsername,
    checkEventBookingSession,
    checkEventBookingSessionFromBookingLogin,
    validateEventBookingLogin,
    validateEventBookingLoginWithCredentials,
    checkEventBookingSessionFromBookingDashboard,
    fetchEventBookingInfoBySessionRequest,
    submitUpdateEventBookingExtrasRequest,
    fetchEventBookingConfirmationRequest,
};

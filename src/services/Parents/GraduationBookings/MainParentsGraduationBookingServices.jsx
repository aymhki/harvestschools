

import {
    graduationBookingLoginPageUrl,
    createSessions,
    graduationBookingDashboardPageUrl,
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

const GRADUATION_BOOKING_SESSION_NAME = 'harvest_schools_graduation_booking';

const createGraduationBookingSessionLocally = async () => {
    if (isMobileApp()) {
        const sessionId = generateSecureSessionId();
        await setMobileSession(GRADUATION_BOOKING_SESSION_NAME, sessionId);
        return sessionId;
    }

    return createSessions(GRADUATION_BOOKING_SESSION_NAME);
}

const clearGraduationBookingSessionLocally = async () => {
    if (isMobileApp()) {
        await clearMobileSession(GRADUATION_BOOKING_SESSION_NAME);
    } else {
        resetSession(GRADUATION_BOOKING_SESSION_NAME);
    }
}

const logoutGraduationBooking = async (navigate) => {
    await clearGraduationBookingSessionLocally();
    navigate(graduationBookingLoginPageUrl, { replace: true });
}


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
        const sessionId = await validateGraduationBookingSessionLocally();
        
        if (!sessionId) {
            return 'Session expired';
        }
        
        const response = await fetch (endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
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

const fetchGraduationBookingInfoBySessionRequest = async (navigate) => {
    try {
        const sessionId = await validateGraduationBookingSessionLocally();

        if (!sessionId) {
            navigate(graduationBookingLoginPageUrl, { replace: true });
            return 'Session expired';
        }

        const response = await fetch(endpoints.getGraduationBookingInfoBySession, {
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
                navigate(graduationBookingLoginPageUrl, { replace: true });
            }
        }
    } catch (error) {
         return error.message;
    }
}

const checkGraduationBookingSessionFromBookingDashboard = async (navigate) => {
    const sessionId = await validateGraduationBookingSessionLocally();

    if (!sessionId) {
        navigate(graduationBookingLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
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

const performGraduationBookingLogin = async (username, password, navigate, persistBiometricCredentials) => {
    try {
        const response = await fetch(endpoints.validateGraduationBookingLogin, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp() && persistBiometricCredentials) {
                const biometricHardwareAvailable = await isBiometricAvailable();
                if (biometricHardwareAvailable) {
                    await saveBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME, username, password);
                }
            }

            const newSessionId = await createGraduationBookingSessionLocally();

            const sessionResponse = await fetch(endpoints.createGraduationBookingSession, {
                method: 'POST',
                body: JSON.stringify({username: username, user_id: result.id}),
                headers: await buildAuthHeaders(newSessionId)
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(graduationBookingDashboardPageUrl, { replace: true });
            } else {
                await clearGraduationBookingSessionLocally();
                return sessionResult;
            }
        } else {
            return result;
        }
    } catch (error) {
        return error.message;
    }
}

const validateGraduationBookingLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    return performGraduationBookingLogin(username, password, navigate, true);
}

const validateGraduationBookingLoginWithCredentials = async (username, password, navigate) => {
    return performGraduationBookingLogin(username, password, navigate, false);
}

const checkGraduationBookingSessionFromBookingLogin = async (navigate) => {
    const sessionId = await validateGraduationBookingSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp()) {
                await extendMobileSession(GRADUATION_BOOKING_SESSION_NAME, sessionId);
            } else {
                extendSession(GRADUATION_BOOKING_SESSION_NAME, sessionId);
            }

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
    const sessionId = await validateGraduationBookingSessionLocally();

    if (!sessionId) {
        navigate(graduationBookingLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.checkGraduationBookingSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp()) {
                await extendMobileSession(GRADUATION_BOOKING_SESSION_NAME, sessionId);
            } else {
                extendSession(GRADUATION_BOOKING_SESSION_NAME, sessionId);
            }

        } else {
            if (result.message) {
                console.log(result.message);
            }

            await clearGraduationBookingSessionLocally();
            navigate(graduationBookingLoginPageUrl, { replace: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const validateGraduationBookingSessionLocally = async () => {

    if (isMobileApp()) {
        const mobileSessionId = await getMobileSession(GRADUATION_BOOKING_SESSION_NAME);

        if (mobileSessionId) {
            return mobileSessionId;
        }
    } else {
        const localStorageData = getSessionsFromLocalStorage(GRADUATION_BOOKING_SESSION_NAME);
        const sessionId = localStorageData.sessionId;
        const sessionTime = parseInt(localStorageData.sessionTime, 10);

        if (sessionId && sessionTime && (Date.now() - sessionTime) <= sessionDuration) {
            return sessionId;
        }

        resetSession(GRADUATION_BOOKING_SESSION_NAME);
    }

    return null;
}


const requestGraduationBookingPasswordReset = async (username) => {
    try {
        const response = await fetch(endpoints.requestGraduationBookingPasswordReset, {
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

const requestGraduationBookingResetEmailCode = async (resetToken) => {
    try {
        const response = await fetch(endpoints.requestGraduationBookingResetEmailCode, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({reset_token: resetToken, lang: getCurrentLangCode()}),
        });
        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const completeGraduationBookingPasswordReset = async (resetToken, code, newPassword, username) => {
    try {
        const response = await fetch(endpoints.verifyGraduationBookingPasswordReset, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({reset_token: resetToken, code, new_password: newPassword}),
        });
        const result = await response.json();

        if (result && result.success && username && isMobileApp()) {
            const biometricHardwareAvailable = await isBiometricAvailable();
            if (biometricHardwareAvailable) {
                await saveBiometricCredentials(GRADUATION_BOOKING_SESSION_NAME, username, newPassword);
            }
        }
        return result;
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const listGraduationBookingStudents = async () => {
    try {
        const response = await fetch(endpoints.searchGraduationBookingStudents, {
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


const recoverGraduationBookingUsername = async (method, payload) => {
    try {
        const response = await fetch(endpoints.recoverGraduationBookingUsername, {
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
    GRADUATION_BOOKING_SESSION_NAME,
    validateGraduationBookingSessionLocally,
    clearGraduationBookingSessionLocally,
    logoutGraduationBooking,
    requestGraduationBookingPasswordReset,
    requestGraduationBookingResetEmailCode,
    completeGraduationBookingPasswordReset,
    listGraduationBookingStudents,
    recoverGraduationBookingUsername,
    checkGraduationBookingSession,
    checkGraduationBookingSessionFromBookingLogin,
    validateGraduationBookingLogin,
    validateGraduationBookingLoginWithCredentials,
    checkGraduationBookingSessionFromBookingDashboard,
    fetchGraduationBookingInfoBySessionRequest,
    submitUpdateGraduationBookingExtrasRequest,
    fetchGraduationBookingConfirmationRequest,
};

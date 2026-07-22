import {
    alumniLoginPageUrl,
    alumniProfilePageUrl,
    endpoints,
    extendSession,
    getSessionsFromLocalStorage,
    resetSession,
    sessionDuration,
    isMobileApp,
    buildLoginHeaders,
    buildRecoveryHeaders,
    getCurrentLangCode,
} from "../General/GeneralUtils.jsx";

import {
    isBiometricAvailable,
    saveBiometricCredentials,
} from "../General/CapacitorSecureAuthUtils.jsx";

import {decodeCreateArgs, decodeGetArgs, bufToB64, passkeySupported} from "../General/PasskeyUtils.jsx";

const ALUMNI_SESSION_NAME = 'harvest_schools_alumni';

const validateAlumniSessionLocally = () => {
    const localStorageData = getSessionsFromLocalStorage(ALUMNI_SESSION_NAME);
    const sessionId = localStorageData.sessionId;
    const sessionTime = parseInt(localStorageData.sessionTime, 10);

    if (sessionId && sessionTime && (Date.now() - sessionTime) <= sessionDuration) {
        return sessionId;
    }

    resetSession(ALUMNI_SESSION_NAME);
    return null;
}

const buildAlumniAuthHeaders = (sessionId, includeJsonContentType = false) => {
    const headers = {
        'Authorization': 'Bearer ' + sessionId,
    };

    if (includeJsonContentType) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}

const storeAlumniSessionAndEnter = (sessionToken, navigate) => {
    extendSession(ALUMNI_SESSION_NAME, sessionToken);
    navigate(alumniProfilePageUrl, {replace: true});
}

const logoutCurrentAlumni = async (navigate) => {
    const sessionId = validateAlumniSessionLocally();

    if (sessionId) {
        try {
            await fetch(endpoints.deleteAlumniSession, {
                method: 'POST',
                headers: buildAlumniAuthHeaders(sessionId),
            });
        } catch {
            console.log('Could not delete the alumni session from the server.');
        }
    }

    resetSession(ALUMNI_SESSION_NAME);
    navigate(alumniLoginPageUrl, {replace: true});
}

const checkAlumniSessionFromLogin = async (navigate) => {
    const sessionId = validateAlumniSessionLocally();

    if (!sessionId) { return; }

    try {
        const response = await fetch(endpoints.checkAlumniSession, {
            method: 'POST',
            headers: buildAlumniAuthHeaders(sessionId),
        });

        const result = await response.json();

        if (result.success) {
            extendSession(ALUMNI_SESSION_NAME, sessionId);
            navigate(alumniProfilePageUrl, {replace: true});
        } else if (result.message) {
            console.log(result.message);
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkAlumniSessionFromProfile = async (navigate) => {
    const sessionId = validateAlumniSessionLocally();

    if (!sessionId) {
        navigate(alumniLoginPageUrl, {replace: true});
        return null;
    }

    try {
        const response = await fetch(endpoints.checkAlumniSession, {
            method: 'POST',
            headers: buildAlumniAuthHeaders(sessionId),
        });

        const result = await response.json();

        if (result.success) {
            extendSession(ALUMNI_SESSION_NAME, sessionId);
            return sessionId;
        }

        if (result.message) {
            console.log(result.message);
        }

        resetSession(ALUMNI_SESSION_NAME);
        navigate(alumniLoginPageUrl, {replace: true});
        return null;
    } catch (error) {
        console.log(error.message);
        return null;
    }
}

const performAlumniLogin = async (username, password, navigate, persistBiometricCredentials) => {
    try {
        const response = await fetch(endpoints.validateAlumniLogin, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password}),
        });

        const result = await response.json();

        if (result && result.success && result.sessionToken
            && isMobileApp() && persistBiometricCredentials) {
            const biometricHardwareAvailable = await isBiometricAvailable();
            if (biometricHardwareAvailable) {
                await saveBiometricCredentials(ALUMNI_SESSION_NAME, username, password);
            }
        }

        if (result && result.success && result.sessionToken) {
            storeAlumniSessionAndEnter(result.sessionToken, navigate);
            return {success: true};
        }

        return result;
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const validateAlumniLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];
    return performAlumniLogin(username, password, navigate, true);
}

const validateAlumniLoginWithCredentials = async (username, password, navigate) => {
    return performAlumniLogin(username, password, navigate, false);
}


const performAlumniDiscoverablePasskeyLogin = async (navigate) => {
    try {
        if (!passkeySupported()) {
            return {success: false, message: 'Passkeys are not supported on this device or browser', code: 0};
        }

        const optionsResponse = await fetch(endpoints.alumniPasskeyDiscoverableLoginOptions, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });
        const optionsResult = await optionsResponse.json();

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || {success: false, message: 'Could not start passkey sign in', code: 0};
        }

        const credential = await navigator.credentials.get(decodeGetArgs(optionsResult.options));

        if (!credential) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }

        const userHandle = credential.response.userHandle
            ? bufToB64(credential.response.userHandle)
            : null;

        const verifyResponse = await fetch(endpoints.alumniPasskeyDiscoverableLoginVerify, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                auth_token: optionsResult.authToken,
                id: bufToB64(credential.rawId),
                userHandle,
                clientDataJSON: bufToB64(credential.response.clientDataJSON),
                authenticatorData: bufToB64(credential.response.authenticatorData),
                signature: bufToB64(credential.response.signature),
            }),
        });
        const result = await verifyResponse.json();

        if (result && result.success && result.sessionToken) {
            storeAlumniSessionAndEnter(result.sessionToken, navigate);
            return {success: true};
        }

        return result;
    } catch (error) {
        if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }
        return {success: false, message: error.message, code: 0};
    }
}

const requestAlumniPasswordReset = async (username) => {
    try {
        const response = await fetch(endpoints.requestAlumniPasswordReset, {
            method: 'POST',
            headers: await buildRecoveryHeaders(),
            body: JSON.stringify({username}),
        });
        const result = await response.json();

        if (result && result.success && result.reset_required) {
            return {
                success: true,
                resetRequired: true,
                resetToken: result.resetToken,
                methods: result.methods || [],
                maskedEmail: result.maskedEmail,
            };
        }
        return result;
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const requestAlumniResetEmailCode = async (resetToken) => {
    try {
        const response = await fetch(endpoints.requestAlumniResetEmailCode, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({reset_token: resetToken, lang: getCurrentLangCode()}),
        });
        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const completeAlumniPasswordResetWithCode = async (resetToken, code, newPassword) => {
    try {
        const response = await fetch(endpoints.verifyAlumniPasswordReset, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({reset_token: resetToken, method: 'email', code, new_password: newPassword}),
        });
        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const completeAlumniPasswordResetWithPasskey = async (resetToken, newPassword) => {
    try {
        if (!passkeySupported()) {
            return {success: false, message: 'Passkeys are not supported on this device or browser', code: 0};
        }

        const optionsResponse = await fetch(endpoints.alumniResetPasskeyOptions, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({reset_token: resetToken}),
        });
        const optionsResult = await optionsResponse.json();

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || {success: false, message: 'Could not start passkey verification', code: 0};
        }

        const credential = await navigator.credentials.get(decodeGetArgs(optionsResult.options));

        if (!credential) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }

        const verifyResponse = await fetch(endpoints.verifyAlumniPasswordReset, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({
                reset_token: resetToken,
                method: 'passkey',
                new_password: newPassword,
                id: bufToB64(credential.rawId),
                clientDataJSON: bufToB64(credential.response.clientDataJSON),
                authenticatorData: bufToB64(credential.response.authenticatorData),
                signature: bufToB64(credential.response.signature),
            }),
        });
        return await verifyResponse.json();
    } catch (error) {
        if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }
        return {success: false, message: error.message, code: 0};
    }
}

const updateAlumniBiometricCredentials = async (username, password) => {
    if ( username && password && isMobileApp() ) {
        const biometricHardwareAvailable = await isBiometricAvailable();
        if (biometricHardwareAvailable) {
            await saveBiometricCredentials(ALUMNI_SESSION_NAME, username, password);
        }
    }
}

const performAlumniPasskeyLogin = async (username, navigate) => {
    try {
        if (!passkeySupported()) {
            return {success: false, message: 'Passkeys are not supported on this device or browser', code: 0};
        }

        const optionsResponse = await fetch(endpoints.alumniPasskeyLoginOptions, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username}),
        });
        const optionsResult = await optionsResponse.json();

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || {success: false, message: 'Could not start passkey sign in', code: 0};
        }

        const credential = await navigator.credentials.get(decodeGetArgs(optionsResult.options));

        if (!credential) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }

        const verifyResponse = await fetch(endpoints.alumniPasskeyLoginVerify, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                auth_token: optionsResult.authToken,
                id: bufToB64(credential.rawId),
                clientDataJSON: bufToB64(credential.response.clientDataJSON),
                authenticatorData: bufToB64(credential.response.authenticatorData),
                signature: bufToB64(credential.response.signature),
            }),
        });
        const result = await verifyResponse.json();

        if (result && result.success && result.sessionToken) {
            storeAlumniSessionAndEnter(result.sessionToken, navigate);
            return {success: true};
        }

        return result;
    } catch (error) {
        if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }
        return {success: false, message: error.message, code: 0};
    }
}

const submitAlumniSignup = async (formData) => {
    try {
        const response = await fetch(endpoints.submitAlumniSignup, {
            method: 'POST',
            body: formData,
        });


        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const fetchMyAlumniAccount = async (navigate) => {
    const sessionId = await checkAlumniSessionFromProfile(navigate);

    if (!sessionId) { return null; }

    try {
        const response = await fetch(endpoints.getMyAlumniAccount, {
            method: 'POST',
            headers: buildAlumniAuthHeaders(sessionId),
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        if (result && result.message) {
            console.log(result.message);
        }

        if (result && (result.code === 401 || result.code === 403 || result.code === 404)) {
            resetSession(ALUMNI_SESSION_NAME);
            navigate(alumniLoginPageUrl, {replace: true});
        }

        return null;
    } catch (error) {
        console.log(error.message);
        return null;
    }
}

const postAlumniJsonRequest = async (endpoint, payload, navigate) => {
    const sessionId = validateAlumniSessionLocally();

    if (!sessionId) {
        if (navigate) { navigate(alumniLoginPageUrl, {replace: true}); }
        return {success: false, message: 'Session expired', code: 401};
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: buildAlumniAuthHeaders(sessionId, true),
            body: JSON.stringify(payload || {}),
        });

        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const submitAlumniProfileUpdate = async (formData, navigate) => {
    const sessionId = validateAlumniSessionLocally();

    if (!sessionId) {
        if (navigate) { navigate(alumniLoginPageUrl, {replace: true}); }
        return {success: false, message: 'Session expired', code: 401};
    }

    try {
        const response = await fetch(endpoints.submitAlumniProfileUpdate, {
            method: 'POST',
            headers: buildAlumniAuthHeaders(sessionId),
            body: formData,
        });

        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const cancelAlumniProfileUpdate = async (navigate) => {
    return postAlumniJsonRequest(endpoints.cancelAlumniProfileUpdate, {}, navigate);
}

const changeAlumniPassword = async (currentPassword, newPassword, confirmNewPassword, navigate) => {
    return postAlumniJsonRequest(endpoints.changeAlumniPassword, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
    }, navigate);
}

const registerAlumniPasskey = async (label, navigate) => {
    const sessionId = validateAlumniSessionLocally();

    if (!sessionId) {
        if (navigate) { navigate(alumniLoginPageUrl, {replace: true}); }
        return {success: false, message: 'Session expired', code: 401};
    }

    try {
        if (!passkeySupported()) {
            return {success: false, message: 'Passkeys are not supported on this device or browser', code: 0};
        }

        const optionsResponse = await fetch(endpoints.alumniPasskeyRegisterOptions, {
            method: 'POST',
            headers: buildAlumniAuthHeaders(sessionId, true),
            body: JSON.stringify({}),
        });
        const optionsResult = await optionsResponse.json();

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || {success: false, message: 'Could not start passkey setup', code: 0};
        }

        const credential = await navigator.credentials.create(decodeCreateArgs(optionsResult.options));

        if (!credential) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }

        const verifyResponse = await fetch(endpoints.alumniPasskeyRegisterVerify, {
            method: 'POST',
            headers: buildAlumniAuthHeaders(sessionId, true),
            body: JSON.stringify({
                clientDataJSON: bufToB64(credential.response.clientDataJSON),
                attestationObject: bufToB64(credential.response.attestationObject),
                label,
            }),
        });

        return await verifyResponse.json();
    } catch (error) {
        if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            return {success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true};
        }
        return {success: false, message: error.message, code: 0};
    }
}

const deleteAlumniPasskey = async (passkeyId, navigate) => {
    return postAlumniJsonRequest(endpoints.deleteAlumniPasskey, {passkey_id: passkeyId}, navigate);
}

const submitAlumniPost = async (title, content, navigate) => {
    return postAlumniJsonRequest(endpoints.submitAlumniPost, {title, content}, navigate);
}

const editAlumniPost = async (postId, title, content, navigate) => {
    return postAlumniJsonRequest(endpoints.editAlumniPost, {post_id: postId, title, content}, navigate);
}

const deleteAlumniPost = async (postId, navigate) => {
    return postAlumniJsonRequest(endpoints.deleteAlumniPost, {post_id: postId}, navigate);
}

const uploadAlumniPostImage = async (file, navigate) => {
    const sessionId = validateAlumniSessionLocally();

    if (!sessionId) {
        if (navigate) { navigate(alumniLoginPageUrl, {replace: true}); }
        throw new Error('Session expired');
    }

    const formData = new FormData();
    formData.append('image', file, file.name);

    const response = await fetch(endpoints.uploadAlumniPostImage, {
        method: 'POST',
        headers: buildAlumniAuthHeaders(sessionId),
        body: formData,
    });

    const result = await response.json();

    if (result && result.success && result.filePath) {
        return result.filePath;
    }

    throw new Error((result && result.message) || 'The image could not be uploaded.');
}

export {
    ALUMNI_SESSION_NAME,
    validateAlumniSessionLocally,
    buildAlumniAuthHeaders,
    logoutCurrentAlumni,
    checkAlumniSessionFromLogin,
    checkAlumniSessionFromProfile,
    validateAlumniLogin,
    validateAlumniLoginWithCredentials,
    updateAlumniBiometricCredentials,
    performAlumniPasskeyLogin,
    performAlumniDiscoverablePasskeyLogin,
    requestAlumniPasswordReset,
    requestAlumniResetEmailCode,
    completeAlumniPasswordResetWithCode,
    completeAlumniPasswordResetWithPasskey,
    submitAlumniSignup,
    fetchMyAlumniAccount,
    submitAlumniProfileUpdate,
    cancelAlumniProfileUpdate,
    changeAlumniPassword,
    registerAlumniPasskey,
    deleteAlumniPasskey,
    submitAlumniPost,
    editAlumniPost,
    deleteAlumniPost,
    uploadAlumniPostImage,
}

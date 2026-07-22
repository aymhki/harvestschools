import {
    adminDashboardPageUrl,
    adminLoginPageUrl,
    buildAuthHeaders,
    extendSession,
    resetSession,
    sessionDuration,
    getSessionsFromLocalStorage,
    endpoints,
    isMobileApp,
    getClientFingerprint, buildLoginHeaders} from "../../General/GeneralUtils.jsx";
import {
    getMobileSession,
    setMobileSession,
    setDeviceBindingSecret,
    extendMobileSession,
    isBiometricAvailable,
    saveBiometricCredentials,
} from "../../General/CapacitorSecureAuthUtils.jsx";

import { decodeGetArgs, bufToB64, passkeySupported } from "../../General/PasskeyUtils.jsx";


const checkAdminSession = async (navigate, allowedPermission) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp()) {
                await extendMobileSession('harvest_schools_admin', sessionId);
            } else {
                extendSession('harvest_schools_admin', sessionId);
            }

        } else {

            if (result.message) {
                console.log(result.message);
            }

            navigate(adminLoginPageUrl, { replace: true });
            return;
        }

        const userPermissionsResponse = await fetch(endpoints.getUserPermissions, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const userPermissionsResult = await userPermissionsResponse.json();

        if (userPermissionsResult && userPermissionsResult.success && userPermissionsResult.cleanPermissionLevels) {
            if (!userPermissionsResult.cleanPermissionLevels.includes(allowedPermission)) {
                navigate(adminLoginPageUrl, { replace: true });
            }

            return userPermissionsResult;
        } else {
            if (userPermissionsResult.message) {
                console.log(userPermissionsResult.message);
            }

            if (userPermissionsResult.code && (userPermissionsResult.code === 401 || userPermissionsResult.code === 403 || userPermissionsResult.code === 404)) {
                navigate(adminLoginPageUrl, { replace: true });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkAdminSessionFromAdminDashboard = async (navigate, setDashboardOptions, setLoggedInName, setLoggedInUsername, setAdminPermissions, setLoggedInUserId) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return;
    }

    try {
        const sessionResponse = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const sessionResult = await sessionResponse.json();

        if (sessionResult && !sessionResult.success) {
            if (sessionResult.message) {
                console.log(sessionResult.message);
            }

            navigate(adminLoginPageUrl, { replace: true });
            return;

        } else if (isMobileApp()) {
            await extendMobileSession('harvest_schools_admin', sessionId);
        }

        setLoggedInName(sessionResult.name)
        setLoggedInUserId(sessionResult.id)
        setLoggedInUsername(sessionResult.username)

        const permissionsResponse = await fetch(endpoints.getDashboardPermissions, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const permissionsResult = await permissionsResponse.json();

        if (permissionsResult.success) {

            setDashboardOptions(permissionsResult.dashboardOptions);
            setAdminPermissions(permissionsResult.permissionLevels);

        } else {

            if (permissionsResult.message) {
                console.log(permissionsResult.message);
            }

            if (permissionsResult.code && (permissionsResult.code === 401 || permissionsResult.code === 403 || permissionsResult.code === 404))  {
                navigate(adminLoginPageUrl, { replace: true });
            }

        }

    } catch (error) {
        console.log(error.message);
        throw error;
    }
}

const storeSessionAndEnter = async (result, navigate) => {
    const sessionToken = result.sessionToken;

    if (isMobileApp() && result.deviceSecret) {
        await setDeviceBindingSecret('harvest_schools_admin', result.deviceSecret);
    }

    if (isMobileApp()) {
        await setMobileSession('harvest_schools_admin', sessionToken);
    } else {
        extendSession('harvest_schools_admin', sessionToken);
    }
    navigate(adminDashboardPageUrl, { replace: true });
};

const performAdminLogin = async (username, password, navigate, persistBiometricCredentials, authChannel = null) => {
    try {
        const fingerprint = await getClientFingerprint();
        const body = { username, password, fingerprint };

        if (authChannel) { body.auth_channel = authChannel; }

        const response = await fetch(endpoints.validateAdminLogin, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify(body)
        });
        const result = await response.json();

        if (result && result.success && (result.sessionToken || result.mfa_required)
            && isMobileApp() && persistBiometricCredentials) {
            const biometricHardwareAvailable = await isBiometricAvailable();
            if (biometricHardwareAvailable) {
                await saveBiometricCredentials('harvest_schools_admin', username, password);
            }
        }

        if (result && result.success && result.mfa_required) {
            return {
                success: true,
                mfaRequired: true,
                mfaToken: result.mfaToken,
                methods: result.methods || [],
                preferred: result.preferred,
                maskedEmail: result.maskedEmail,
            };
        }

        if (result && result.success && result.sessionToken) {
            if (result.needsEmailSetup) {
                sessionStorage.setItem('hs_needs_mfa_setup', '1');
            }
            await storeSessionAndEnter(result, navigate);
            return { success: true };
        }

        return result;
    } catch (error) {
        return { success: false, message: error.message, code: 0 };
    }
};

const updateAdminBiometricCredentials = async (username, password) => {
    if ( username && password && isMobileApp() ) {
        const biometricHardwareAvailable = await isBiometricAvailable();
        if (biometricHardwareAvailable) {
            await saveBiometricCredentials('harvest_schools_admin', username, password);
        }
    }
}

const validateAdminLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];
    return performAdminLogin(username, password, navigate, true);
}

const validateAdminLoginWithCredentials = async (username, password, navigate) => {
    return performAdminLogin(username, password, navigate, false, isMobileApp() ? 'native_biometric' : null);
}

const checkAdminSessionFromAdminLogin = async (navigate) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {return;}

    try {

        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {

            if (isMobileApp()) {
                await extendMobileSession('harvest_schools_admin', sessionId);
            } else {
                extendSession('harvest_schools_admin', sessionId);
            }

            navigate(adminDashboardPageUrl, { replace: true });

        } else {

            if (result.message) {
                console.log(result.message);
            }

        }
    } catch (error) {
        console.log(error.message);
    }
}

const validateAdminSessionLocally = async () => {

    if (isMobileApp()) {
        const mobileSessionId = await getMobileSession('harvest_schools_admin');

        if (mobileSessionId) {
            return mobileSessionId;
        }
    } else {
        const localStorageData = getSessionsFromLocalStorage('harvest_schools_admin');
        const sessionId = localStorageData.sessionId;
        const sessionTime = parseInt(localStorageData.sessionTime, 10);

        if (sessionId && sessionTime && (Date.now() - sessionTime) <= sessionDuration) {
            return sessionId;
        }

        resetSession('harvest_schools_admin');
    }

    return null;
}

const completeMfa = async (mfaToken, method, code, navigate) => {
    try {
        const response = await fetch(endpoints.verifyMfa, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({ mfa_token: mfaToken, method, code }),
        });
        const result = await response.json();
        if (result && result.success && result.sessionToken) {
            if (result.promptPasskey && !isMobileApp() && passkeySupported()) {
                sessionStorage.setItem('hs_prompt_passkey', '1');
            }
            await storeSessionAndEnter(result, navigate);
            return { success: true, promptPasskey: result.promptPasskey };
        }
        return result;
    } catch (error) {
        return { success: false, message: error.message, code: 0 };
    }
};

const requestEmailCode = async (mfaToken) => {
    try {
        const response = await fetch(endpoints.requestMfaEmailCode, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({ mfa_token: mfaToken }),
        });

        return await response.json();
    } catch (error) {
        return { success: false, message: error.message, code: 0 };
    }
};

const performPasskeyMfa = async (mfaToken, navigate) => {
    try {
        const optionsResponse = await fetch(endpoints.passkeyLoginOptions, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({ mfa_token: mfaToken }),
        });
        const optionsResult = await optionsResponse.json();

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || { success: false, message: 'Could not start passkey verification', code: 0 };
        }

        const credential = await navigator.credentials.get(decodeGetArgs(optionsResult.options));

        if (!credential) {
            return { success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true };
        }

        const verifyResponse = await fetch(endpoints.passkeyLoginVerify, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({
                mfa_token: mfaToken,
                id: bufToB64(credential.rawId),
                clientDataJSON: bufToB64(credential.response.clientDataJSON),
                authenticatorData: bufToB64(credential.response.authenticatorData),
                signature: bufToB64(credential.response.signature),
            }),
        });
        const result = await verifyResponse.json();

        if (result && result.success && result.sessionToken) {
            await storeSessionAndEnter(result, navigate);
            return { success: true };
        }

        return result;
    } catch (error) {
        if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
            return { success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true };
        }
        return { success: false, message: error.message, code: 0 };
    }
};

const requestPasswordReset = async (username) => {
    try {
        const fingerprint = await getClientFingerprint();
        const response = await fetch(endpoints.requestPasswordReset, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({ username, fingerprint }),
        });
        const result = await response.json();

        if (result && result.success && result.mfa_required) {
            return {
                success: true,
                mfaRequired: true,
                resetToken: result.resetToken,
                methods: result.methods || [],
                preferred: result.preferred,
                maskedEmail: result.maskedEmail,
            };
        }

        return result;
    } catch (error) {
        return { success: false, message: error.message, code: 0 };
    }
};

const requestResetEmailCode = async (resetToken) => {
    try {
        const response = await fetch(endpoints.requestResetEmailCode, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({ reset_token: resetToken }),
        });

        return await response.json();
    } catch (error) {
        return { success: false, message: error.message, code: 0 };
    }
};

const completePasswordReset = async (resetToken, method, code, newPassword) => {
    try {
        const response = await fetch(endpoints.verifyPasswordReset, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({
                reset_token: resetToken,
                method,
                code,
                new_password: newPassword,
            }),
        });

        return await response.json();
    } catch (error) {
        return { success: false, message: error.message, code: 0 };
    }
};

const performPasskeyReset = async (resetToken, newPassword) => {
    try {
        const optionsResponse = await fetch(endpoints.resetPasskeyOptions, {
            method: 'POST',
            headers: buildLoginHeaders(),
            body: JSON.stringify({ reset_token: resetToken }),
        });
        const optionsResult = await optionsResponse.json();

        if (!optionsResult || !optionsResult.success || !optionsResult.options) {
            return optionsResult || { success: false, message: 'Could not start passkey verification', code: 0 };
        }

        const credential = await navigator.credentials.get(decodeGetArgs(optionsResult.options));

        if (!credential) {
            return { success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true };
        }

        const verifyResponse = await fetch(endpoints.verifyPasswordReset, {
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
            return { success: false, message: 'Passkey prompt was cancelled', code: 0, cancelled: true };
        }
        return { success: false, message: error.message, code: 0 };
    }
};

export {
    checkAdminSession,
    validateAdminLogin,
    validateAdminLoginWithCredentials,
    checkAdminSessionFromAdminDashboard,
    checkAdminSessionFromAdminLogin,
    validateAdminSessionLocally,
    requestEmailCode,
    completeMfa,
    performPasskeyMfa,
    requestPasswordReset,
    requestResetEmailCode,
    completePasswordReset,
    performPasskeyReset,
    updateAdminBiometricCredentials
}

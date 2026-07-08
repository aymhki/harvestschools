import {
    adminDashboardPageUrl,
    adminLoginPageUrl,
    createSessions,
    extendSession,
    resetSession,
    sessionDuration,
    getSessionsFromLocalStorage,
    endpoints
} from "../../General/GeneralUtils.jsx";
import { Capacitor } from '@capacitor/core';
import {
    generateSecureSessionId,
    getMobileSession,
    setMobileSession,
    extendMobileSession,
    isBiometricAvailable,
    saveBiometricCredentials,
} from "../../General/CapacitorSecureAuthUtils.jsx";

const isMobileApp = () => Capacitor.isNativePlatform();

const checkAdminSession = async (navigate, allowedPermission) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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

        }
        const userPermissionsResponse = await fetch(endpoints.getUserPermissions, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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

const checkAdminSessionFromAdminDashboard = async (navigate, setDashboardOptions, setLoggedInName, setLoggedInUsername, setLoggedInUserId) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return;
    }

    try {
        const sessionResponse = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        });

        const sessionResult = await sessionResponse.json();

        if (sessionResult && !sessionResult.success) {
            if (sessionResult.message) {
                console.log(sessionResult.message);
            }

            navigate(adminLoginPageUrl, { replace: true });
        } else if (isMobileApp()) {
            await extendMobileSession('harvest_schools_admin', sessionId);
        }

        setLoggedInName(sessionResult.name)
        setLoggedInUserId(sessionResult.id)
        setLoggedInUsername(sessionResult.username)

        const permissionsResponse = await fetch(endpoints.getDashboardPermissions, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        });

        const permissionsResult = await permissionsResponse.json();

        if (permissionsResult.success) {

            setDashboardOptions(permissionsResult.dashboardOptions);

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


const performAdminLogin = async (username, password, navigate, persistBiometricCredentials) => {
    try {
        const response = await fetch(endpoints.validateAdminLogin, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result && result.success) {
            const mobile = isMobileApp();
            const newSessionId = mobile ? generateSecureSessionId() : createSessions('harvest_schools_admin');

            const sessionResponse = await fetch(endpoints.createAdminSession, {
                method: 'POST',
                body: JSON.stringify({ username: username, user_id: result.id }),
                headers: {
                    'Authorization': 'Bearer ' + newSessionId
                }
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {

                if (mobile) {
                    await setMobileSession('harvest_schools_admin', newSessionId);
                    if (persistBiometricCredentials) {
                        const biometricHardwareAvailable = await isBiometricAvailable();
                        if (biometricHardwareAvailable) {
                            await saveBiometricCredentials('harvest_schools_admin', username, password);
                        }
                    }
                }

                navigate(adminDashboardPageUrl, { replace: true });
                return { success: true };

            } else {
                return sessionResult;
            }

        } else {
            return result;
        }
    } catch (error) {
        return { success: false, message: error.message, code: 0 };
    }
}

const validateAdminLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];
    return performAdminLogin(username, password, navigate, true);
}


const validateAdminLoginWithCredentials = async (username, password, navigate) => {
    return performAdminLogin(username, password, navigate, false);
}

const checkAdminSessionFromAdminLogin = async (navigate) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {return;}

    try {

        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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

export {
    checkAdminSession,
    validateAdminLogin,
    validateAdminLoginWithCredentials,
    checkAdminSessionFromAdminDashboard,
    checkAdminSessionFromAdminLogin,
    validateAdminSessionLocally,
    isMobileApp,
}

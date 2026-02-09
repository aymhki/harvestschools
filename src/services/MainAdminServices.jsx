import {
    adminDashboardPageUrl,
    adminLoginPageUrl,
    createSessions,
    extendSession,
    resetSession,
    sessionDuration,
    getCookies,
    endpoints
} from "./GeneralUtils.jsx";



const checkAdminSession = async (navigate, allowedPermission) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_admin', sessionId);
        } else {
            if (result.message) {
                console.log(result.message);
            }

            navigate(adminLoginPageUrl);

        }

        const userPermissionsResponse = await fetch(endpoints.getUserPermissions, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const userPermissionsResult = await userPermissionsResponse.json();

        if (userPermissionsResult && userPermissionsResult.success && userPermissionsResult.cleanPermissionLevels) {
            if (!userPermissionsResult.cleanPermissionLevels.includes(allowedPermission)) {
                navigate(adminLoginPageUrl);
            }

            return userPermissionsResult;
        } else {
            if (userPermissionsResult.message) {
                console.log(userPermissionsResult.message);
            }

            if (userPermissionsResult.code && (userPermissionsResult.code === 401 || userPermissionsResult.code === 403 || userPermissionsResult.code === 404)) {
                navigate(adminLoginPageUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkAdminSessionFromAdminDashboard = async (navigate, setDashboardOptions) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const sessionResponse = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const sessionResult = await sessionResponse.json();

        if (sessionResult && !sessionResult.success) {
            if (sessionResult.message) {
                console.log(sessionResult.message);
            }

            navigate(adminLoginPageUrl);
        }

        const permissionsResponse = await fetch(endpoints.getDashboardPermissions, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const permissionsResult = await permissionsResponse.json();

        if (permissionsResult.success) {
            setDashboardOptions(permissionsResult.dashboardOptions);
        } else {
            if (permissionsResult.message) {
                console.log(permissionsResult.message);
            }

            if (permissionsResult.code && (permissionsResult.code === 401 || permissionsResult.code === 403 || permissionsResult.code === 404))  {
                navigate(adminLoginPageUrl);
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const validateAdminLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await fetch(endpoints.validateAdminLogin, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {
            const sessionResponse = await fetch(endpoints.createAdminSession, {
                method: 'POST',
                body: JSON.stringify({ username: username, session_id: createSessions('harvest_schools_admin') })
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(adminDashboardPageUrl);
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

const checkAdminSessionFromAdminLogin = async (navigate) => {
    const sessionId = validateAdminSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_admin', sessionId);
            navigate(adminDashboardPageUrl);
        } else {
            if (result.message) {
                console.log(result.message);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const validateAdminSessionLocally = () => {
    const cookies = getCookies();
    const sessionId = cookies.harvest_schools_admin_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        resetSession('harvest_schools_admin');
        return null;
    } else {
        return sessionId;
    }
}

export {
    checkAdminSession,
    validateAdminLogin,
    checkAdminSessionFromAdminDashboard,
    checkAdminSessionFromAdminLogin,
    validateAdminSessionLocally
}
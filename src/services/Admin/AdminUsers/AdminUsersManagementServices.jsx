import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, logoutCurrentAdmin, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchAllAdminUsers = async (navigate, setAdminUsers, setAvailablePermissionsDict) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return 'Session expired';
    }

    setAdminUsers(null);

    try {
        const response = await fetch(endpoints.getAllAdminUsers, {method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        })

        const result = await response.json();

        if (result && result.data && Array.isArray(result.data) ) {
            setAdminUsers(result.data);
            setAvailablePermissionsDict(result.permissionsDict);
        } else {
            setAdminUsers(null);

            if (result && result.message) {
                console.log(result.message);
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(adminLoginPageUrl, { replace: true });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const addAdminUser = async (newAdminUser) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.addAdminUser, {method: 'POST',
            body: JSON.stringify(newAdminUser),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        } else {
            return result.message || 'An error occurred while adding the user.';
        }

    } catch (error) {
        return error.message;
    }
}

const editAdminUser = async (newAdminUser, logoutAfterEdit, navigate) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.editAdminUser, {method: 'POST',
            body: JSON.stringify(newAdminUser),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            if (logoutAfterEdit) {
                logoutCurrentAdmin(navigate);
            }

            return result;

        } else {
            return result.message || 'An error occurred while editing the user.';
        }
    } catch (error) {
        return error.message;
    }
}

const deleteAdminUser = async (adminUserToDeleteId, logoutAfterDelete, navigate) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.deleteAdminUser, {method: 'POST',
            body: JSON.stringify(
                {
                    "delete_admin_user_id": adminUserToDeleteId,
                }
            ),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            if (logoutAfterDelete) {
                logoutCurrentAdmin(navigate);
            }

            return result;
        } else {
            return result.message || 'An error occurred while deleting the user.';
        }

    } catch (error) {
        return error.message;
    }
}

export {
    fetchAllAdminUsers,
    addAdminUser,
    editAdminUser,
    deleteAdminUser
}
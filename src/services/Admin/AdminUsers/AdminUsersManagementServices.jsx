import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, logoutCurrentAdmin} from "../../General/GeneralUtils.jsx";


const fetchAllAdminUsers = async (navigate, setAdminUsers, setAvailablePermissionsDict) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return 'Session expired';
    }

    setAdminUsers(null);

    try {
        const response = await fetch(endpoints.getAllAdminUsers, {method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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
                navigate(adminLoginPageUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const addAdminUser = async (newAdminUser) => {
    try {
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.addAdminUser, {method: 'POST',
            body: JSON.stringify(newAdminUser),
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.editAdminUser, {method: 'POST',
            body: JSON.stringify(newAdminUser),
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.deleteAdminUser, {method: 'POST',
            body: JSON.stringify(
                {
                    "delete_admin_user_id": adminUserToDeleteId,
                }
            ),
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
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
import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchPageGatesForAdmin = async (navigate, setPages) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.getPageGates, {method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success && result.pages) {
            setPages(result.pages);
            return;
        }

        if (result && result.message) {
            console.log(result.message);
        }

        if (result && result.code && (result.code === 401 || result.code === 403)) {
            navigate(adminLoginPageUrl, { replace: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const updatePageGate = async (payload) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.updatePageGate, {method: 'POST',
            body: JSON.stringify(payload),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        return (result && result.message) || 'An error occurred while saving the page.';
    } catch (error) {
        return error.message;
    }
}


export {
    fetchPageGatesForAdmin,
    updatePageGate
}

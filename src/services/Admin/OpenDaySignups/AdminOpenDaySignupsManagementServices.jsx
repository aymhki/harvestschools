import {
    adminLoginPageUrl,
    endpoints,
} from "../../General/GeneralUtils.jsx";
import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";

const fetchAllOpenDaySignups = async (navigate, setOpenDaySignups) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return 'Session expired';
    }

    setOpenDaySignups(null);

    try {
        const response = await fetch(endpoints.getOpenDaySignups,
            {method: 'POST', body: JSON.stringify({session_id: sessionId})});

        const result = await response.json();

        if (result && result.data && Array.isArray(result.data)) {
            setOpenDaySignups(result.data);
        } else {
            setOpenDaySignups(null);

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

export {
    fetchAllOpenDaySignups
}
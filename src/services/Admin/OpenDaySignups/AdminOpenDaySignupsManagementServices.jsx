import {
    adminLoginPageUrl,
    endpoints,
} from "../../General/GeneralUtils.jsx";
import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";

const fetchAllOpenDaySignups = async (navigate, setOpenDaySignups) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return 'Session expired';
    }

    setOpenDaySignups(null);

    try {
        const response = await fetch(endpoints.getOpenDaySignups,
    {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionId
            }
        });

        const result = await response.json();

        if (result && result.data && Array.isArray(result.data)) {
            setOpenDaySignups(result.data);
        } else {
            setOpenDaySignups(null);

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

export {
    fetchAllOpenDaySignups
}
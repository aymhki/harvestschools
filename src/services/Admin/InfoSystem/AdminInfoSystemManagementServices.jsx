import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchInfoSystemData = async (navigate, setGlobalSettingsData, setDepartmentsData, setStagesData) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return 'Session expired';
    }

    setGlobalSettingsData(null);
    setDepartmentsData(null);
    setStagesData(null);

    try {
        const response = await fetch(endpoints.getInfoSystem, {method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        })
        const result = await response.json();

        if (result && result.data ) {
            setGlobalSettingsData(result.data.settings);
            setDepartmentsData(result.data.departments);
            setStagesData(result.data.stages);
        } else {
            setGlobalSettingsData(null);
            setDepartmentsData(null);
            setStagesData(null);

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


const updateInfoSystemData = async (newInfoSystemData) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.updateInfoSystem, {method: 'POST',
            body: JSON.stringify(newInfoSystemData),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        } else {
            return result.message || 'An error occurred while editing the user.';
        }
    } catch (error) {
        return error.message;
    }
}


export {
    fetchInfoSystemData,
    updateInfoSystemData
}
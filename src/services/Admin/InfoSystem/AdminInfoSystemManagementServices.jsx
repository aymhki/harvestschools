import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints} from "../../General/GeneralUtils.jsx";


const fetchInfoSystemData = async (navigate, setGlobalSettingsData, setDepartmentsData, setStagesData) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return 'Session expired';
    }

    setGlobalSettingsData(null);
    setDepartmentsData(null);
    setStagesData(null);

    try {
        const response = await fetch(endpoints.getInfoSystem, {method: 'GET', credentials: 'include'})
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
                navigate(adminLoginPageUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


const updateInfoSystemData = async (newInfoSystemData) => {
    try {
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.updateInfoSystem, {method: 'POST', credentials: 'include', body: JSON.stringify(newInfoSystemData) });

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
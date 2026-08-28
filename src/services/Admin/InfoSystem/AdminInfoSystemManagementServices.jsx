import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchInfoSystemData = async (navigate, setGlobalSettingsData, setDepartmentsData, setStagesData, setProfileData, setPoliciesData, setStaticContentData, setFormEmailsData) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return 'Session expired';
    }

    setGlobalSettingsData(null);
    setDepartmentsData(null);
    setStagesData(null);
    setProfileData(null);
    setPoliciesData(null);
    setStaticContentData(null);
    setFormEmailsData(null);

    try {
        const response = await fetch(endpoints.getInfoSystem, {method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        })
        const result = await response.json();

        if (result && result.data ) {
            setGlobalSettingsData(result.data.settings);
            setDepartmentsData(result.data.departments);
            setStagesData(result.data.stages);
            setProfileData(result.data.profile);
            setPoliciesData(result.data.policies);
            setStaticContentData(result.data.staticContent);
            setFormEmailsData(result.data.formEmails);
        } else {
            setGlobalSettingsData(null);
            setDepartmentsData(null);
            setStagesData(null);
            setProfileData(null);
            setPoliciesData(null);
            setStaticContentData(null);
            setFormEmailsData(null);

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


const fetchAnalyticsData = async (navigate, setWebsiteAnalytics, setChatBotAnalytics) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return 'Session expired';
    }

    setWebsiteAnalytics(null);
    setChatBotAnalytics(null);

    const headers = await buildAuthHeaders(sessionId);

    const load = async (endpoint) => {
        try {
            const response = await fetch(endpoint, {method: 'GET', headers});
            const result = await response.json();

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(adminLoginPageUrl, { replace: true });
            }

            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const [website, chatBot] = await Promise.all([
        load(endpoints.getWebsiteAnalytics),
        load(endpoints.getDatabaseAnalytics)
    ]);

    setWebsiteAnalytics(website && website.success ? {
            configured: true,
            totals: (website.data && website.data.totals) || [],
            usersOverTime: (website.data && website.data.usersOverTime) || [],
            rankings: (website.data && website.data.rankings) || [],
            reportingWindow: website.reportingWindow,
            cacheAgeSeconds: website.cacheAgeSeconds,
        } : { configured: false, message: (website && website.message) || 'The website figures could not be loaded.' });

    setChatBotAnalytics(chatBot && chatBot.success ? chatBot.data : null);
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
    fetchAnalyticsData,
    updateInfoSystemData
}
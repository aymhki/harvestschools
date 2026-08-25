import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchImportDescriptor = async (navigate, domain, context = {}) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return null;
    }

    try {
        const params = new URLSearchParams({domain, ...context});

        const response = await fetch(`${endpoints.getImportDescriptor}?${params.toString()}`, {
            method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result.data;
        }

        if (result && result.code && (result.code === 401 || result.code === 403)) {
            navigate(adminLoginPageUrl, { replace: true });
        }

        return null;
    } catch (error) {
        console.log(error.message);

        return null;
    }
}


const importCsvFile = async (domain, context, file) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return {success: false, message: 'Session expired', failed: [], warnings: []};
        }

        const headers = await buildAuthHeaders(sessionId);

        delete headers['Content-Type'];

        const formData = new FormData();

        formData.append('domain', domain);
        formData.append('file', file);

        Object.entries(context || {}).forEach(([key, value]) => formData.append(key, value));

        const response = await fetch(endpoints.importCsv, {method: 'POST', body: formData, headers});
        const result = await response.json();

        return {
            success: Boolean(result && result.success),
            message: (result && result.message) || 'The import could not be completed.',
            imported: (result && result.imported) || 0,
            failed: (result && result.failed) || [],
            warnings: (result && result.warnings) || [],
        };
    } catch (error) {
        return {success: false, message: error.message, failed: [], warnings: []};
    }
}


export {
    fetchImportDescriptor,
    importCsvFile
}

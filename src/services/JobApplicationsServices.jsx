import {adminLoginPageUrl, EMBEDDABLE_EXTENSIONS, endpoints, getMimeType} from "./GeneralUtils.jsx";
import {validateAdminSessionLocally} from "./MainAdminServices.jsx";


const submitJobApplicationRequest = async (formData) => {
    try {
        const response = await fetch(endpoints.submitJobApplication, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            if (result.message) {
                return `${result.message}`;
            } else {
                return 'Form submission failed. Please try again.';
            }
        }
    } catch (error) {
        return error.message;
    }
}

const fetchJobApplicationsRequest = async (navigate, setJobApplications) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        console.log('Session expired');
    }

    setJobApplications(null);
    const timestamp = new Date().getTime();

    try {
        const response = await fetch(endpoints.getJobApplications + '?_=' + timestamp,
            {method: 'POST', body: JSON.stringify({session_id: sessionId})});


        const result = await response.json();

        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
            setJobApplications(result.data);
        } else {
            setJobApplications(null);

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

const serveJobApplicationFile = async (searchParams, setIsLoading, setError, setCanEmbed, setMimeType, setFilename, setFileBlobUrl) => {
    const filePath = searchParams.get('file');

    if (!filePath) {
        setError('No file was specified.');
        setIsLoading(false);
        return;
    }

    try {
        const decodedFilename = decodeURIComponent(filePath.split('/').pop());
        setFilename(decodedFilename);
        const extension = decodedFilename.split('.').pop().toLowerCase();
        setCanEmbed(EMBEDDABLE_EXTENSIONS.includes(extension));
        setMimeType(getMimeType(extension));
    } catch (e) {
        setFilename('download');
        setCanEmbed(false);
    }

    try {
        const response = await fetch(`${endpoints.serveJobApplicationFile}${filePath}`, {credentials: 'include'});

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            const errorText = result.message || "An unclear error occurred";
            setError(`${errorText} (Code: ${result.code})`);
        } else {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setFileBlobUrl(blobUrl);
        }

    } catch (error) {
        setError(error.message);
    } finally {
        setIsLoading(false);
    }

}

export {
    submitJobApplicationRequest,
    fetchJobApplicationsRequest,
    serveJobApplicationFile
}
import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {
    adminLoginPageUrl,
    endpoints,
    buildAuthHeaders,
    EMBEDDABLE_EXTENSIONS,
    getMimeType,
    getAdminSessionId
} from "../../General/GeneralUtils.jsx";

const fetchAllAlumniAccounts = async (navigate, setAccountsData, setAccountRecordsById, setUpdatesData, setUpdateRecordsById) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, {replace: true});
        return 'Session expired';
    }

    setAccountsData(null);
    setUpdatesData(null);

    try {
        const response = await fetch(endpoints.getAllAlumniAccounts, {
            method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success && Array.isArray(result.accountsData)) {
            setAccountsData(result.accountsData);
            setAccountRecordsById(result.accountRecordsById || {});
            setUpdatesData(result.updatesData);
            setUpdateRecordsById(result.updateRecordsById || {});
        } else {
            setAccountsData(null);
            setUpdatesData(null);

            if (result && result.message) {
                console.log(result.message);
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(adminLoginPageUrl, {replace: true});
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const fetchAllAlumniPosts = async (navigate, setPostsData, setPostRecordsById) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, {replace: true});
        return 'Session expired';
    }

    setPostsData(null);

    try {
        const response = await fetch(endpoints.getAllAlumniPosts, {
            method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success && Array.isArray(result.postsData)) {
            setPostsData(result.postsData);
            setPostRecordsById(result.postRecordsById || {});
        } else {
            setPostsData(null);

            if (result && result.message) {
                console.log(result.message);
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(adminLoginPageUrl, {replace: true});
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const postAdminAlumniAction = async (endpoint, payload) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return {success: false, message: 'Session expired', code: 401};
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload || {}),
            headers: await buildAuthHeaders(sessionId)
        });

        return await response.json();
    } catch (error) {
        return {success: false, message: error.message, code: 0};
    }
}

const setAlumniAccountStatus = async (alumniId, newStatus, adminNote) => {
    return postAdminAlumniAction(endpoints.setAlumniAccountStatus, {
        alumni_id: alumniId,
        new_status: newStatus,
        admin_note: adminNote || '',
    });
}

const reviewAlumniProfileUpdate = async (updateId, decision, adminNote) => {
    return postAdminAlumniAction(endpoints.reviewAlumniProfileUpdate, {
        update_id: updateId,
        decision,
        admin_note: adminNote || '',
    });
}

const deleteAlumniAccount = async (alumniId) => {
    return postAdminAlumniAction(endpoints.deleteAlumniAccount, {alumni_id: alumniId});
}

const reviewAlumniPost = async (postId, target, decision, adminNote) => {
    return postAdminAlumniAction(endpoints.reviewAlumniPost, {
        post_id: postId,
        target,
        decision,
        admin_note: adminNote || '',
    });
}

const setAlumniPostPlacement = async (postId, showOnHome, showOnAlumniPage) => {
    return postAdminAlumniAction(endpoints.setAlumniPostPlacement, {
        post_id: postId,
        show_on_home: showOnHome,
        show_on_alumni_page: showOnAlumniPage,
    });
}

const deleteAlumniPostByAdmin = async (postId, notifyAuthor, adminNote) => {
    return postAdminAlumniAction(endpoints.deleteAlumniPostByAdmin, {
        post_id: postId,
        notify_author: notifyAuthor,
        admin_note: adminNote || '',
    });
}

const serveAlumniFile = async (searchParams, setIsLoading, setError, setCanEmbed, setMimeType, setFilename, setFileBlobUrl) => {
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
        const response = await fetch(`${endpoints.serveAlumniFile}${encodeURIComponent(filePath)}`, {
            method: 'GET',
            headers: await buildAuthHeaders( await getAdminSessionId() )
        });

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
    fetchAllAlumniAccounts,
    fetchAllAlumniPosts,
    setAlumniAccountStatus,
    reviewAlumniProfileUpdate,
    deleteAlumniAccount,
    reviewAlumniPost,
    setAlumniPostPlacement,
    deleteAlumniPostByAdmin,
    serveAlumniFile,
}

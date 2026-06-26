import {
    checkAdminSession,
    checkAdminSessionFromAdminDashboard,
    checkAdminSessionFromAdminLogin
} from "./MainAdminServices.jsx";

import {adminLoginPageUrl} from "../../General/GeneralUtils.jsx";

const headToAdminLoginOnInvalidSession = async (navigate, allowedPermission, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkAdminSession(navigate, allowedPermission);

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToAdminLoginOnInvalidSessionFromAdminDashboard = async (navigate, setDashboardOptions, setIsLoading, setLoggedInName, setLoggedInUsername, setLoggedInUserId) => {
    try {
        setIsLoading(true);
        await checkAdminSessionFromAdminDashboard(navigate, setDashboardOptions, setLoggedInName, setLoggedInUsername, setLoggedInUserId);
    } catch (error) {
        console.log(error.message);
        navigate(adminLoginPageUrl);
    } finally {
        setIsLoading(false);
    }
}

const headToAdminDashboardOnValidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkAdminSessionFromAdminLogin(navigate);
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

export {
    headToAdminLoginOnInvalidSession,
    headToAdminLoginOnInvalidSessionFromAdminDashboard,
    headToAdminDashboardOnValidSession
}
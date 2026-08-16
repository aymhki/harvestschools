import {EventBookingLoginPageUrl} from "../../General/GeneralUtils.jsx";
import {
    checkEventBookingSession,
    checkEventBookingSessionFromBookingDashboard,
    checkEventBookingSessionFromBookingLogin
} from "./MainParentsEventBookingServices.jsx";


const headToEventBookingLoginOnInvalidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkEventBookingSession(navigate);

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToEventBookingLoginOnInvalidSessionFromEventBookingDashboard = async (navigate, setIsLoading) => {
    setIsLoading(true);

    try {
        await checkEventBookingSessionFromBookingDashboard(navigate);
    } catch (error) {
        console.log(error.message);
        navigate(EventBookingLoginPageUrl, { replace: true });
    } finally {
        setIsLoading(false);
    }
}

const headToEventBookingDashboardOnValidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkEventBookingSessionFromBookingLogin(navigate);
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

export {
    headToEventBookingLoginOnInvalidSession,
    headToEventBookingLoginOnInvalidSessionFromEventBookingDashboard,
    headToEventBookingDashboardOnValidSession
}
import {bookingLoginPageUrl} from "./GeneralUtils.jsx";
import {
    checkBookingSession,
    checkBookingSessionFromBookingDashboard,
    checkBookingSessionFromBookingLogin
} from "./MainParentsBookingServices.jsx";


const headToBookingLoginOnInvalidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkBookingSession(navigate);

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToBookingLoginOnInvalidSessionFromBookingDashboard = async (navigate, setIsLoading) => {
    setIsLoading(true);

    try {
        await checkBookingSessionFromBookingDashboard(navigate);
    } catch (error) {
        console.log(error.message);
        navigate(bookingLoginPageUrl);
    } finally {
        setIsLoading(false);
    }
}

const headToBookingDashboardOnValidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkBookingSessionFromBookingLogin(navigate);
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

export {
    headToBookingLoginOnInvalidSession,
    headToBookingLoginOnInvalidSessionFromBookingDashboard,
    headToBookingDashboardOnValidSession
}
import {graduationBookingLoginPageUrl} from "../../General/GeneralUtils.jsx";
import {
    checkGraduationBookingSession,
    checkGraduationBookingSessionFromBookingDashboard,
    checkGraduationBookingSessionFromBookingLogin
} from "./MainParentsGraduationBookingServices.jsx";


const headToGraduationBookingLoginOnInvalidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkGraduationBookingSession(navigate);

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToGraduationBookingLoginOnInvalidSessionFromGraduationBookingDashboard = async (navigate, setIsLoading) => {
    setIsLoading(true);

    try {
        await checkGraduationBookingSessionFromBookingDashboard(navigate);
    } catch (error) {
        console.log(error.message);
        navigate(graduationBookingLoginPageUrl, { replace: true });
    } finally {
        setIsLoading(false);
    }
}

const headToGraduationBookingDashboardOnValidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkGraduationBookingSessionFromBookingLogin(navigate);
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

export {
    headToGraduationBookingLoginOnInvalidSession,
    headToGraduationBookingLoginOnInvalidSessionFromGraduationBookingDashboard,
    headToGraduationBookingDashboardOnValidSession
}
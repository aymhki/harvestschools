import {checkAlumniSessionFromLogin, checkAlumniSessionFromProfile} from "./MainAlumniServices.jsx";

const headToAlumniProfileOnValidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkAlumniSessionFromLogin(navigate);
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToAlumniLoginOnInvalidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        return await checkAlumniSessionFromProfile(navigate);
    } catch (error) {
        console.log(error.message);
        return null;
    } finally {
        setIsLoading(false);
    }
}

export {
    headToAlumniProfileOnValidSession,
    headToAlumniLoginOnInvalidSession,
}

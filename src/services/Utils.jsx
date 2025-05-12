import axios from "axios";


const sessionDurationInHours = 1;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;


const checkAdminSession = async (
    navigate,
    setIsLoading,
    allowedPermission

) => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});

    const sessionId = cookies.harvest_schools_admin_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_admin_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_admin_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/admin/login');
    }

    try {
        const response = await axios.post('/scripts/checkAdminSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            navigate('/admin/login');
        }


        const userPermissionsResponse = await axios.post('/scripts/getUserPermissions.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });


        if (!userPermissionsResponse.data.includes(allowedPermission)) {
            navigate('/admin/dashboard');
            return;
        }

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
};

const checkBookingSession = async (
    navigate,
    setIsLoading,
) => {

    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});

    const sessionId = cookies.harvest_schools_booking_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        document.cookie = 'harvest_schools_booking_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'harvest_schools_booking_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/events/booking');
    }

    try {
        const response = await axios.post('/scripts/checkBookingSession.php', {
            session_id: sessionId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            navigate('/events/booking');
        }

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}



export {checkAdminSession, checkBookingSession, sessionDuration, sessionDurationInHours};
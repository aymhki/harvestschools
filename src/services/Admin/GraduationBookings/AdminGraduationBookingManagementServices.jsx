import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";
import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx"


const fetchGraduationBookingsRequest = async (navigate, setAllBookings) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            navigate(adminLoginPageUrl, { replace: true });
            return;
        }

        const response = await fetch(endpoints.getAllGraduationBookings, {method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result) {
            if (result.success && result.data) {
                setAllBookings( result.data );
            } else {
                if (result.message) {
                    console.log(result.message);
                }


                if (result.code  && (result.code === 401 || result.code === 403)) {
                    navigate(adminLoginPageUrl, { replace: true });
                }
            }
        }

    } catch (error) {
        console.log(error.message);
    }

    return null;
}

const handleDeleteGraduationBookingRequest = async (bookingId) => {
    try {
        const sessionId = await validateAdminSessionLocally();
        if (!sessionId) {
            return 'Session expired'
        }

        const response = await fetch(endpoints.deleteGraduationBookingEntry, {
            method: 'POST',
            body: JSON.stringify({bookingId: bookingId}),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return result.message;
        }

    } catch (error) {
        return error.message;
    }
}

const handleAddGraduationBookingRequest = async (formData) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.submitAddGraduationBookingForm, {
            method: 'POST',
            body: formData,
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return `${result.message}`;
        }
    } catch (error) {
        return error.message;
    }
}

const handleEditGraduationBookingRequest = async (formData, bookingId) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        formData.append('bookingId', bookingId);

        const response = await fetch(endpoints.submitEditGraduationBookingForm, {
            method: 'POST',
            body: formData,
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return `${result.message}`;
        }
    } catch (error) {
        return error.message;
    }
}


export {
    fetchGraduationBookingsRequest,
    handleDeleteGraduationBookingRequest,
    handleAddGraduationBookingRequest,
    handleEditGraduationBookingRequest
}

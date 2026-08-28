import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";
import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx"


const fetchEventBookingsRequest = async (navigate, setAllBookings) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            navigate(adminLoginPageUrl, { replace: true });
            return;
        }

        const response = await fetch(endpoints.getAllEventBookings, {method: 'POST',
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

const handleDeleteEventBookingRequest = async (bookingId) => {
    try {
        const sessionId = await validateAdminSessionLocally();
        if (!sessionId) {
            return 'Session expired'
        }

        const response = await fetch(endpoints.deleteEventBookingEntry, {
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

const handleAddEventBookingRequest = async (formData) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.submitAddEventBookingForm, {
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

const handleEditEventBookingRequest = async (formData, bookingId) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        formData.append('bookingId', bookingId);

        const response = await fetch(endpoints.submitEditEventBookingForm, {
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


const handleDeleteEventBookingsRequest = async (scope, division) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired'
        }

        const response = await fetch(endpoints.deleteEventBookings, {
            method: 'POST',
            body: JSON.stringify({scope: scope, division: division || ''}),
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


const fetchEventMetaDetailsRequest = async () => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return null;
        }

        const response = await fetch(endpoints.getEventCeremonyDetails, {
            method: 'POST',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        return result && result.success ? result.details : null;

    } catch (error) {
        console.log(error.message);

        return null;
    }
}

const handleUpdateEventMetaDetailsRequest = async (formData, selectedPlace) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        if (selectedPlace) {
            formData.append('selectedPlace', JSON.stringify(selectedPlace));
        }

        const response = await fetch(endpoints.updateEventMetaDetails, {
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
    fetchEventBookingsRequest,
    handleDeleteEventBookingRequest,
    handleDeleteEventBookingsRequest,
    handleAddEventBookingRequest,
    handleEditEventBookingRequest,
    fetchEventMetaDetailsRequest,
    handleUpdateEventMetaDetailsRequest
}

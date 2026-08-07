import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchAcademicCalendars = async (navigate, {calendarKey = '', academicYear = ''} = {}) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return null;
    }

    try {
        const params = new URLSearchParams();

        if (calendarKey && academicYear) {
            params.set('calendar', calendarKey);
            params.set('year', academicYear);
        }

        const query = params.toString();

        const response = await fetch(`${endpoints.getAcademicCalendars}${query ? `?${query}` : ''}`, {
            method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success && result.data) {
            return result.data;
        }

        if (result && result.message) {
            console.log(result.message);
        }

        if (result && result.code && (result.code === 401 || result.code === 403)) {
            navigate(adminLoginPageUrl, { replace: true });
        }

        return null;
    } catch (error) {
        console.log(error.message);

        return null;
    }
}


const postToCalendars = async (endpoint, payload, fallbackMessage) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoint, {method: 'POST',
            body: JSON.stringify(payload),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        return (result && result.message) || fallbackMessage;
    } catch (error) {
        return error.message;
    }
}


const sendCalendarForm = async (endpoint, formData, fallbackMessage) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const headers = await buildAuthHeaders(sessionId);

        delete headers['Content-Type'];

        const response = await fetch(endpoint, {method: 'POST', body: formData, headers});
        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        return (result && result.message) || fallbackMessage;
    } catch (error) {
        return error.message;
    }
}


const addAcademicCalendarYear = async (payload, pdfFile) => {
    const formData = new FormData();

    formData.append('payload', JSON.stringify(payload));

    if (pdfFile) {
        formData.append('calendar_pdf', pdfFile);
    }

    return sendCalendarForm(endpoints.addAcademicCalendarYear, formData, 'An error occurred while creating the calendar.');
}


const uploadCalendarPdf = async (calendarKey, academicYear, pdfFile) => {
    const formData = new FormData();

    formData.append('calendar_key', calendarKey);
    formData.append('academic_year', academicYear);
    formData.append('calendar_pdf', pdfFile);

    return sendCalendarForm(endpoints.uploadCalendarPdf, formData, 'An error occurred while uploading the PDF.');
}


const updateCalendarMetaData = async (payload) =>
    postToCalendars(endpoints.updateCalendarMetaData, payload, 'An error occurred while updating the calendar.');

const addCalendarEvent = async (payload) =>
    postToCalendars(endpoints.addCalendarEvent, payload, 'An error occurred while adding the event.');

const editCalendarEvent = async (payload) =>
    postToCalendars(endpoints.editCalendarEvent, payload, 'An error occurred while editing the event.');

const deleteCalendarEvent = async (eventId) =>
    postToCalendars(endpoints.deleteCalendarEvent, { event_id: eventId }, 'An error occurred while deleting the event.');


export {
    fetchAcademicCalendars,
    addAcademicCalendarYear,
    updateCalendarMetaData,
    uploadCalendarPdf,
    addCalendarEvent,
    editCalendarEvent,
    deleteCalendarEvent
}

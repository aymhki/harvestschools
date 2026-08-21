import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchBorrowingSystem = async (navigate, {applicationId = 0, editRequestId = 0} = {}) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return null;
    }

    try {
        const params = new URLSearchParams();

        if (applicationId) {
            params.set('application', String(applicationId));
        }

        if (editRequestId) {
            params.set('editRequest', String(editRequestId));
        }

        const query = params.toString();

        const response = await fetch(`${endpoints.getBorrowingSystem}${query ? `?${query}` : ''}`, {
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


const fetchEmployeeScore = async (employeeCode) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return null;
        }

        const response = await fetch(`${endpoints.getEmployeeScore}?employee=${encodeURIComponent(employeeCode)}`, {
            method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success && result.data) {
            return result.data;
        }

        return {error: (result && result.message) || 'The score could not be calculated.'};
    } catch (error) {
        return {error: error.message};
    }
}


const postToBorrowing = async (endpoint, payload, fallbackMessage) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
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


const recordEligibilityInputs = async (payload) =>
    postToBorrowing(endpoints.recordEligibilityInputs, payload, 'An error occurred while recording the figures for this employee.');

const submitBorrowingApplication = async (payload) =>
    postToBorrowing(endpoints.submitBorrowingApplication, payload, 'An error occurred while submitting the application.');

const reviewBorrowingApplication = async (payload) =>
    postToBorrowing(endpoints.reviewBorrowingApplication, payload, 'An error occurred while saving the decision.');

const submitBorrowingDelayRequest = async (payload) =>
    postToBorrowing(endpoints.submitBorrowingDelayRequest, payload, 'An error occurred while submitting the request.');

const reviewBorrowingDelayRequest = async (payload) =>
    postToBorrowing(endpoints.reviewBorrowingDelayRequest, payload, 'An error occurred while saving the decision.');

const recordBorrowingPayment = async (payload) =>
    postToBorrowing(endpoints.recordBorrowingPayment, payload, 'An error occurred while recording the instalment.');

const reviewBorrowingEditRequest = async (payload) =>
    postToBorrowing(endpoints.reviewBorrowingEditRequest, payload, 'An error occurred while saving the decision.');

const updateBorrowingConfig = async (payload) =>
    postToBorrowing(endpoints.updateBorrowingConfig, payload, 'An error occurred while saving the setting.');


export {
    fetchBorrowingSystem,
    fetchEmployeeScore,
    recordEligibilityInputs,
    submitBorrowingApplication,
    reviewBorrowingApplication,
    submitBorrowingDelayRequest,
    reviewBorrowingDelayRequest,
    recordBorrowingPayment,
    reviewBorrowingEditRequest,
    updateBorrowingConfig
}

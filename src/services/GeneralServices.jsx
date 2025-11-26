import {endpoints} from "./GeneralUtils.jsx";

const submitFormRequest = async (formData) => {
    try {
        const response = await fetch(endpoints.submitForm, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            if (result.message) {
                return `${result.message}`;
            } else {
                return 'Form submission failed. Please try again.';
            }
        }
    } catch (error) {
        return error.message;
    }
}

export {
    submitFormRequest
}
import {endpoints} from "../../General/GeneralUtils.jsx";



const submitJobApplicationRequest = async (formData) => {
    try {
        const response = await fetch(endpoints.submitJobApplication, {
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
    submitJobApplicationRequest,
}
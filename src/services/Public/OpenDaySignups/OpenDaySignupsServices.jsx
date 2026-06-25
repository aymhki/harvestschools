import {
    endpoints,
} from "../../General/GeneralUtils.jsx";

const submitOpenDaySignupRequest = async (formData, numberOfAttendees) => {
    try {
        formData.append('numberOfAttendees', numberOfAttendees)

        const response = await fetch(endpoints.submitOpenDaySignupForm, {
            method: 'POST',
            body: formData
        })

        const result = await response.json();

        if (result && result.success) {
            if (result.message) {
                console.log(result.message);
                return result;
            } else {
                return 'Signup failed. Please try again.';
            }
        } else {
            return result.message || 'Signup failed. Please try again.';
        }
    } catch ( error ) {
        return error.message;
    }
}


export {
    submitOpenDaySignupRequest
}
export const generateEventBookingConfirmationPDF = async (... args) => {
    const { generateEventBookingConfirmationPDF: generate } = await import('./GenerateEventBookingConfirmationPDF.jsx');
    return generate(...args);
};
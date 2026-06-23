export const generateGraduationBookingConfirmationPDF = async (... args) => {
    const { generateGraduationBookingConfirmationPDF: generate } = await import('./GenerateGraduationBookingConfirmationPDF.jsx');
    return generate(...args);
};
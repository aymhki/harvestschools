export const generateGraduationBookingConfirmationPDF = async (... args) => {
    const { generateGraduationBookingConfirmationPDF: generate } = await import('./GeneratePDF.jsx');
    return generate(...args);
};
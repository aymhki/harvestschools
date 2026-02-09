export const generateConfirmationPDF = async (... args) => {
    const { generateConfirmationPDF: generate } = await import('./GeneratePDF.jsx');
    return generate(...args);
};
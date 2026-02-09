import {
    additionalAttendeeCost,
    BASE_URLS,
    cdCost,
    formatDateFromPacific,
    isDevelopment,
    msgTimeout
} from "./GeneralUtils.jsx";

const generateConfirmationPDF = async (action = 'download', setIsLoading, bookingId, bookingUsername, detailedData, setError) => {
    try {
        setIsLoading(true);


        const [{ default: jsPDF }, { default: QRCode }] = await Promise. all([
            import('jspdf'),
            import('qrcode')
        ]);

        await Promise.all([
            import('../../public/assets/fonts/American Typewriter/american-typewriter-bold-bold.js'),
            import('../../public/assets/fonts/Futura/Futura Book font-normal.js'),
            import('../../public/assets/fonts/American Typewriter/American Typewriter Regular-normal.js'),
            import('../../public/assets/fonts/Futura/futur-bold.js'),
            import('../../public/assets/fonts/Futura/Futura Book Italic font-italic.js')
        ]);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        const titleFontName = 'American Typewriter Regular';
        const titleFontWeight = 'normal';
        const subTextFontName = 'Futura Book font';
        const subTextFontWeight = 'normal';
        const textFontName = 'futur';
        const textFontWeight = 'bold';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        const addFooter = () => {
            pdf.setFont('Futura Book Italic font', 'italic');
            pdf.setFontSize(9);
            pdf.text('This is an automatically generated confirmation document.', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
        };

        const truncateText = (text, maxLength = 100) => {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };

        const checkPageBreak = (currentY, requiredSpace = 10) => {
            if (currentY > pageHeight - requiredSpace - 10) {
                addFooter();
                pdf.addPage();
                return margin;
            }
            return currentY;
        };

        try {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
                logoImg.src = '/assets/images/HarvestLogos/HarvestLogo-01.png';
            });

            const logoWidth = 60;
            const logoHeight = 40;
            const logoX = (pageWidth - logoWidth) / 2;
            pdf.addImage(logoImg, 'PNG', logoX, 15, logoWidth, logoHeight);
        } catch (logoError) {
            console.warn('Could not load logo:', logoError);
        }

        let yPosition = 70;

        pdf.setFont('american-typewriter-bold', 'bold');
        pdf.setFontSize(24);
        pdf.text('Booking Confirmation', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        pdf.setFont(titleFontName, titleFontWeight);
        pdf.setFontSize(16);
        pdf.text('Booking Information', margin, yPosition);
        yPosition += 10;

        pdf.setFont(subTextFontName, subTextFontWeight);
        pdf.setFontSize(11);

        const leftColumnX = margin;
        const rightColumnX = pageWidth / 2;
        let leftY = yPosition;
        let rightY = yPosition;

        if (bookingId) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Booking ID:', leftColumnX, leftY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.text(bookingId.toString(), leftColumnX + 25, leftY);
            leftY += 6;
        }

        if (bookingUsername) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Username:', leftColumnX, leftY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.text(truncateText(bookingUsername), leftColumnX + 25, leftY);
            leftY += 6;
        }

        if (detailedData?.booking?.status) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Status:', leftColumnX, leftY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.text(truncateText(detailedData.booking.status), leftColumnX + 25, leftY);
            leftY += 6;
        }

        if (detailedData?.booking?.password_hash) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Auth ID:', rightColumnX, rightY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            const authId = detailedData.booking.password_hash;
            const wrappedAuthId = pdf.splitTextToSize(authId, 60);
            pdf.text(wrappedAuthId, rightColumnX + 20, rightY);
            rightY += (wrappedAuthId.length * 6);
        }

        yPosition = Math.max(leftY, rightY) + 10;

        if (detailedData?.parents && detailedData.parents.length > 0) {
            yPosition = checkPageBreak(yPosition, 40);

            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Parent Information', margin, yPosition);
            yPosition += 15;

            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);

            const columnWidth = contentWidth / 2 - 10;
            const leftColX = margin;
            const rightColX = margin + columnWidth + 20;

            for (let i = 0; i < detailedData.parents.length; i += 2) {
                yPosition = checkPageBreak(yPosition, 35);

                const leftParent = detailedData.parents[i];
                const rightParent = detailedData.parents[i + 1];

                let leftY = yPosition;
                let rightY = yPosition;

                pdf.setFont(textFontName, textFontWeight);
                pdf.text(`Parent ${i + 1}:`, leftColX, leftY);
                leftY += 6;

                pdf.setFont(subTextFontName, subTextFontWeight);
                if (leftParent.name) {
                    pdf.text(`Name: ${truncateText(leftParent.name, 40)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftParent.email) {
                    pdf.text(`Email: ${truncateText(leftParent.email, 35)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftParent.phone_number) {
                    pdf.text(`Phone: ${truncateText(leftParent.phone_number, 35)}`, leftColX + 5, leftY);
                    leftY += 5;
                }

                if (rightParent) {
                    pdf.setFont(textFontName, textFontWeight);
                    pdf.text(`Parent ${i + 2}:`, rightColX, rightY);
                    rightY += 6;

                    pdf.setFont(subTextFontName, subTextFontWeight);
                    if (rightParent.name) {
                        pdf.text(`Name: ${truncateText(rightParent.name, 40)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                    if (rightParent.email) {
                        pdf.text(`Email: ${truncateText(rightParent.email, 35)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                    if (rightParent.phone_number) {
                        pdf.text(`Phone: ${truncateText(rightParent.phone_number, 35)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                }

                yPosition = Math.max(leftY, rightY) + 8;
            }
            yPosition += 5;
        }

        if (detailedData?.students && detailedData.students.length > 0) {
            yPosition = checkPageBreak(yPosition, 40);

            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Student Information', margin, yPosition);
            yPosition += 15;

            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);

            const columnWidth = contentWidth / 2 - 10;
            const leftColX = margin;
            const rightColX = margin + columnWidth + 20;

            for (let i = 0; i < detailedData.students.length; i += 2) {
                yPosition = checkPageBreak(yPosition, 35);

                const leftStudent = detailedData.students[i];
                const rightStudent = detailedData.students[i + 1];

                let leftY = yPosition;
                let rightY = yPosition;

                pdf.setFont(textFontName, textFontWeight);
                pdf.text(`Student ${i + 1}:`, leftColX, leftY);
                leftY += 6;

                pdf.setFont(subTextFontName, subTextFontWeight);
                if (leftStudent.name) {
                    pdf.text(`Name: ${truncateText(leftStudent.name, 40)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftStudent.grade) {
                    pdf.text(`Grade: ${truncateText(leftStudent.grade, 40)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftStudent.school_division) {
                    pdf.text(`School Division: ${truncateText(leftStudent.school_division, 30)}`, leftColX + 5, leftY);
                    leftY += 5;
                }

                if (rightStudent) {
                    pdf.setFont(textFontName, textFontWeight);
                    pdf.text(`Student ${i + 2}:`, rightColX, rightY);
                    rightY += 6;

                    pdf.setFont(subTextFontName, subTextFontWeight);

                    if (rightStudent.name) {
                        pdf.text(`Name: ${truncateText(rightStudent.name, 40)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }

                    if (rightStudent.grade) {
                        pdf.text(`Grade: ${truncateText(rightStudent.grade, 40)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }

                    if (rightStudent.school_division) {
                        pdf.text(`School Division: ${truncateText(rightStudent.school_division, 30)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                }

                yPosition = Math.max(leftY, rightY) + 8;
            }
            yPosition += 5;
        }

        addFooter();
        pdf.addPage();
        yPosition = margin;

        if (detailedData?.extras) {
            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Extras Information', margin, yPosition);
            yPosition += 15;

            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);

            if (detailedData.extras.payment_status) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Payment Status:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(truncateText(detailedData.extras.payment_status), margin + 35, yPosition);
                yPosition += 6;
            }

            if (detailedData.extras.additional_attendees >= 0) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Additional Attendees:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                const attendeeText = detailedData.extras.additional_attendees == 0 ? 'No' : detailedData.extras.additional_attendees.toString();
                pdf.text(attendeeText, margin + 45, yPosition);
                yPosition += 6;
            }

            if (detailedData.extras.cd_count >= 0) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('After Party CDs:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                const cdText = detailedData.extras.cd_count == 0 ? 'No' : detailedData.extras.cd_count.toString();
                pdf.text(cdText, margin + 35, yPosition);
                yPosition += 6;
            }

            const totalCost = (detailedData.extras.cd_count * cdCost) + (detailedData.extras.additional_attendees * additionalAttendeeCost);

            if (totalCost > 0) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Extras Cost:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(`${totalCost} EGP`, margin + 37, yPosition);
                yPosition += 6;
            }

            if (detailedData.extras.updated_at) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Last Updated:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                const dateStr = formatDateFromPacific(detailedData.extras.updated_at);
                pdf.text(truncateText(dateStr), margin + 30, yPosition);
                yPosition += 6;
            }

            yPosition += 20;
        }


        if (detailedData?.booking) {
            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Total Amounts', margin, yPosition);
            yPosition += 15;

            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);

            const totalPaidForBaseFare = detailedData.booking.total_paid_for_base_fair
            const totalCostOfExtras =  detailedData.booking.total_extras_cost
            const totalCostOfBaseFareAndExtras = detailedData.booking.total_paid_for_base_and_extras

            if (totalPaidForBaseFare) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Paid For Base Fare:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(totalPaidForBaseFare, margin + 55, yPosition);
                yPosition += 6;
            }

            if (totalCostOfExtras) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Cost For Extras:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(totalCostOfExtras, margin + 45, yPosition);
                yPosition += 6;
            }

            if (totalCostOfBaseFareAndExtras) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Cost For Base Fare and Extras:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(totalCostOfBaseFareAndExtras, margin + 75, yPosition);
                yPosition += 6;
            }

        }

        yPosition += 30;

        try {
            const baseQRUrl = isDevelopment() ? BASE_URLS.development : 'https://harvestschools.com';
            const qrData = `${baseQRUrl}/events/booking-confirmation/?bookingId=${bookingId}&extrasId=${detailedData?.extras?.extra_id || ''}&authId=${detailedData?.booking?.password_hash || ''}&username=${bookingUsername}`;
            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'M'
            });

            const qrSize = 60;
            const qrX = (pageWidth - qrSize) / 2;
            pdf.addImage(qrCodeDataURL, 'PNG', qrX, yPosition, qrSize, qrSize);
        } catch (qrError) {
            console.warn('Could not generate QR code:', qrError);
            pdf.setFont(textFontName, textFontWeight);
            pdf.setFontSize(10);
            pdf.text('QR Code generation failed', pageWidth / 2, yPosition, { align: 'center' });
        }

        addFooter();

        const filename = `booking-confirmation-${bookingId}.pdf`;

        if (action === 'download') {
            try {



                if (isIOS) {
                    const pdfBlob = pdf.output('blob');

                    if (navigator.share) {
                        navigator.share({
                            files: [new File([pdfBlob], filename, { type: 'application/pdf' })],
                            title: 'Booking Confirmation'
                        }).catch(console.error);
                    } else {
                        const pdfBlob = pdf.output('blob');
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        const link = document.createElement('a');
                        link.href = pdfUrl;
                        link.download = filename;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        pdf.save(filename);
                    }
                } else if (isMobile) {
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = filename;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    pdf.save(filename);
                } else {
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    window.open(pdfUrl, "_blank");
                    pdf.save(filename);
                }
            } catch (downloadError) {
                console.warn('Download failed, opening in new tab:', downloadError);
                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_blank');
            }
        } else if (action === 'print') {
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, "_blank");
        }



    } catch (error) {
        console.error('Error generating PDF:', error.message || error || 'Unknown error');
        setError(`Error generating PDF: ${error.message || error || 'Unknown error'}`);
        setTimeout(() => {setError(null);}, msgTimeout);
    } finally {
        setIsLoading(false);
    }
};


export { generateConfirmationPDF };

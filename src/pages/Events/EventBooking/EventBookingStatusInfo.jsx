import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {Capacitor} from "@capacitor/core";
import {fetchEventBookingInfoBySessionRequest} from "../../../services/Parents/EventBookings/MainParentsEventBookingServices.jsx";
import {fetchWalletPassOffer, openWalletPass} from "../../../services/Parents/EventBookings/EventBookingWalletPassService.jsx";
import { formatDateFromPacific, formatCeremonyDate, formatCeremonyTime, isMobileApp } from "../../../services/General/GeneralUtils.jsx"
import {generateEventBookingConfirmationPDF} from "../../../services/Parents/EventBookings/GenerateEventBookingConfirmationPDFLazyWrapper.jsx"
import WalletBadgeButton from "../../../modules/WalletBadgeButton.jsx";
import Form from "../../../modules/Form.jsx";
import '../../../styles/Events.css'
import {useTranslation} from "react-i18next";
import {headToEventBookingLoginOnInvalidSession} from "../../../services/Parents/EventBookings/EventBookingNavigationServices.jsx";
import { useLoading } from '../../../services/General/GlobalLoadingService.jsx'

function EventBookingStatusInfo() {
    const {t, i18n} =  useTranslation(['events-pages']);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useLoading(false);
    const [fetchBookingBySessionError, setFetchBookingBySessionError] = useState(null);
    const [detailedData, setDetailedData] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    const [bookingUsername, setBookingUsername] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);
    const [walletPassOffer, setWalletPassOffer] = useState(null);
    const [walletNotice, setWalletNotice] = useState(null);

    useEffect(() => {
        headToEventBookingLoginOnInvalidSession(navigate, setIsLoading)
            .then(
                () => {
                    fetchBookingBySessionId();
                }
            )
    }, [])

    useEffect(() => {
        let isActive = true;

        if (bookingResult && bookingResult.success) {
            fetchWalletPassOffer().then(offer => {
                if (isActive) {
                    setWalletPassOffer(offer);
                }
            });
        }

        return () => {
            isActive = false;
        };
    }, [bookingResult])

    const handleAddToWallet = async () => {
        setWalletNotice(null);

        try {
            const result = await openWalletPass(walletPassOffer);

            if (result.alreadyInWallet && !result.openedInWallet) {
                setWalletNotice(t("events-pages.event-booking-pages.booking-status-info-page.pass-already-in-wallet"));
            }
        } catch (walletError) {
            setFetchBookingBySessionError(walletError.message || 'The pass could not be added.');
        }
    }

    const fetchBookingBySessionId = async () => {
        try {
            setIsLoading(true);

            const result = await  fetchEventBookingInfoBySessionRequest(navigate);

            if (result.success) {
                setBookingResult(result);
                setDetailedData(result.detailedData);
                setBookingId(result.bookingId);
                setBookingUsername(result.bookingUsername);

            } else {
                setFetchBookingBySessionError(result.message || result);
                setBookingId(null);
                setBookingUsername(null);
                setDetailedData(null);
                setBookingResult(null);
            }

        } catch (error) {
            setFetchBookingBySessionError(error.message);
            setBookingId(null);
            setBookingUsername(null);
            setDetailedData(null);
            setBookingResult(null);
        } finally {
            setIsLoading(false);
        }
    }

    let finalFormFields = [];
    if (bookingResult && bookingResult.success) {
        const result = bookingResult;
        let currentFormFields = [];
        let numParents = result.detailedData?.parents?.length || 0;
        let numStudents = result.detailedData?.students?.length || 0;

        if (result.bookingId) {
            currentFormFields.push({
                id: 1,
                type: 'text',
                name: 'booking-id',
                label: 'Booking ID:',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.booking-id"),
                required: false,
                value: result.bookingId,
                setValue: null,
                widthOfField: 2,
                httpName: 'booking-id',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
                alwaysEnglish: true
            });
        }

        if (result.bookingUsername) {
            currentFormFields.push({
                id: 2,
                type: 'text',
                name: 'username',
                label: 'Username:',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.username"),
                required: false,
                value: result.bookingUsername,
                setValue: null,
                widthOfField: 2,
                httpName: 'username',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
                alwaysEnglish: true
            });
        }

        if (result.detailedData.booking.password_hash) {
            currentFormFields.push({
                id: 3,
                type: 'text',
                name: 'auth-id',
                label: 'Auth ID:',
                required: false,
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.auth-id"),
                value: result.detailedData.booking.password_hash,
                setValue: null,
                widthOfField: 2,
                httpName: 'auth-id',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
                alwaysEnglish: true
            });
        }

        if (result.detailedData.booking.status) {
            currentFormFields.push({
                id: 4,
                type: 'text',
                name: 'booking-status',
                label: 'Booking Status:',
                required: false,
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.booking-status"),
                value: result.detailedData.booking.status,
                setValue: null,
                widthOfField: 2,
                httpName: 'booking-status',
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
                alwaysEnglish: true
            });
        }

        if (numParents) {
            for (let i = 0; i < numParents; i++ ) {
                const formattedNumber = new Intl.NumberFormat(i18n.language ==='ar' ? 'ar-EG' : 'en-US').format(i + 1);

                currentFormFields.push({
                    id: (currentFormFields[currentFormFields.length - 1].id + 1),
                    type: 'section',
                    name: 'new-parent',
                    label: 'Parent: ' + (i+1),
                    displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.parent", {"parent-number": formattedNumber}),
                    required: true,
                    widthOfField: 1,
                    httpName: 'new-parent',

                })

                if (result.detailedData.parents[i].parent_id) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'parent-id',
                        label: 'Parent Id: ',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.parent-id"),
                        required: false,
                        value: result.detailedData.parents[i].parent_id,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'parent-id',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }

                if (result.detailedData.parents[i].name) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'parent-name',
                        label: 'Parent Name: ',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.parent-name"),
                        required: false,
                        value: result.detailedData.parents[i].name,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'parent-name',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }

                if (result.detailedData.parents[i].email) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'parent-email',
                        label: 'Parent Email: ',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.parent-email"),
                        required: false,
                        value: result.detailedData.parents[i].email,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'parent-email',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }


                if(result.detailedData.parents[i].phone_number) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'parent-phone',
                        label: 'Parent Phone: ',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.parent-phone"),
                        required: false,
                        value: result.detailedData.parents[i].phone_number,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'parent-phone',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }
            }
        }

        if (numStudents) {
            for (let i = 0; i < numStudents; i++ ) {
                const formattedNumber = new Intl.NumberFormat(i18n.language ==='ar' ? 'ar-EG' : 'en-US').format(i + 1);
                currentFormFields.push({
                    id: (currentFormFields[currentFormFields.length - 1].id + 1),
                    type: 'section',
                    name: 'new-student',
                    label: 'Student: ' + (i+1),
                    displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.student", {"student-number": formattedNumber}),
                    required: true,
                    widthOfField: 1,
                    httpName: 'new-student',

                })

                if (result.detailedData.students[i].student_id) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'student-id',
                        label: 'Student Id: ',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.student-id"),
                        required: false,
                        value: result.detailedData.students[i].student_id,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'student-id',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }

                if (result.detailedData.students[i].name) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'student-name',
                        label: 'Student Name:',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.student-name"),
                        required: false,
                        value: result.detailedData.students[i].name,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'student-name',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }

                if (result.detailedData.students[i].grade) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'student-grade',
                        label: 'Student Grade:',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.student-grade"),
                        required: false,
                        value: result.detailedData.students[i].grade,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'student-grade',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }

                if (result.detailedData.students[i].school_division) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'text',
                        name: 'student-school-division',
                        label: 'Student School Division:',
                        displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.student-school-division"),
                        required: false,
                        value: result.detailedData.students[i].school_division,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'student-school-division',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                        alwaysEnglish: true
                    })
                }
            }
        }

        currentFormFields.push({
            id: (currentFormFields[currentFormFields.length - 1].id + 1),
            type: 'section',
            name: 'ceremony',
            label: 'Ceremony',
            displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.ceremony"),
            required: true,
            widthOfField: 1,
            httpName: 'ceremony',
        });

        const ceremony = result.detailedData.ceremony || {};
        const notAnnouncedYet = t("events-pages.event-booking-pages.booking-status-info-page.ceremony-to-be-announced");

        const ceremonyFields = [
            {
                name: 'ceremony-date',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.ceremony-date"),
                value: formatCeremonyDate(ceremony.ceremonyDate, i18n.language) || notAnnouncedYet,
                widthOfField: 2,
            },
            {
                name: 'ceremony-time',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.ceremony-time"),
                value: [formatCeremonyTime(ceremony.ceremonyTime, i18n.language), ceremony.timeZone]
                    .filter(Boolean).join(' · ') || notAnnouncedYet,
                widthOfField: 2,
            },
            {
                name: 'ceremony-location',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.ceremony-location"),
                value: [ceremony.locationName, ceremony.locationAddress].filter(Boolean).join(', ') || notAnnouncedYet,
                widthOfField: 1,
            },
        ];

        ceremonyFields.forEach((ceremonyField) => {
            currentFormFields.push({
                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                type: 'text',
                name: ceremonyField.name,
                label: ceremonyField.displayLabel,
                displayLabel: ceremonyField.displayLabel,
                required: false,
                value: ceremonyField.value,
                setValue: null,
                widthOfField: ceremonyField.widthOfField,
                httpName: ceremonyField.name,
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
            });
        });

        if (result.detailedData.extras) {
            currentFormFields.push({
                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                type: 'section',
                name: 'extras',
                label: 'Extras',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.extras"),
                required: true,
                widthOfField: 1,
                httpName: 'extras',
            })

            if (result.detailedData.extras.extra_id) {
                currentFormFields.push({
                    id: (currentFormFields[currentFormFields.length - 1].id + 1),
                    type: 'text',
                    name: 'extra-id',
                    label: 'Extra Booking Id:',
                    displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.extra-id"),
                    required: false,
                    value: result.detailedData.extras.extra_id,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-id',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true
                })
            }

            if (result.detailedData.extras.payment_status) {
                currentFormFields.push({
                    id: (currentFormFields[currentFormFields.length - 1].id + 1),
                    type: 'text',
                    name: 'extra-payment-status',
                    label: 'Extras Payment Status:',
                    displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.extra-payment-status"),
                    required: false,
                    value: result.detailedData.extras.payment_status,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-payment-status',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true
                })
            }

            if (result.detailedData.extras.additional_attendees >= 0) {
                currentFormFields.push({
                    id: (currentFormFields[currentFormFields.length - 1].id + 1),
                    type: 'text',
                    name: 'extra-additional-attendees',
                    label: 'Requested Additional Attendee(s):',
                    displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.requested-additional-attendees"),
                    required: false,
                    value: result.detailedData.extras.additional_attendees == 0 ? 'No' : result.detailedData.extras.additional_attendees,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-additional-attendees',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true
                })
            }

            if (result.detailedData.extras.cd_count >= 0) {
                currentFormFields.push({
                    id: (currentFormFields[currentFormFields.length - 1].id + 1),
                    type: 'text',
                    name: 'extra-cd-count',
                    label: 'Requested After Party CD(s):',
                    displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.requested-after-party-cd"),
                    required: false,
                    value: result.detailedData.extras.cd_count == 0 ? 'No' : result.detailedData.extras.cd_count,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-cd-count',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true
                })
            }

            if (result.detailedData.extras.updated_at) {
                currentFormFields.push({
                    id: (currentFormFields[currentFormFields.length - 1].id + 1),
                    type: 'text',
                    name: 'extra-updated-at',
                    label: 'Last Updated At:',
                    displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.last-updated-at"),
                    required: false,
                    value: formatDateFromPacific(result.detailedData.extras.updated_at),
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-updated-at',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true
                })
            }
        }

        currentFormFields.push({
            id: (currentFormFields[currentFormFields.length - 1].id + 1),
            type: 'section',
            name: 'total-amounts',
            label: 'Total Amounts',
            displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.total-amounts"),
            required: true,
            widthOfField: 1,
            httpName: 'total-amounts',
        });


        if (result.detailedData.booking.total_paid_for_base_fair) {
            currentFormFields.push({
                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                type: 'text',
                name: 'total-paid-for-base-fare',
                label: 'Total Paid For Base Fare:',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.total-for-base-fare"),
                required: false,
                value: `${result.detailedData.booking.total_paid_for_base_fair}`,
                setValue: null,
                widthOfField: 3,
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
                alwaysEnglish: true,
                httpName: 'total-paid-for-base-fare'
            })
        }

        if (result.detailedData.booking.total_extras_cost) {
            currentFormFields.push({
                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                type: 'text',
                name: 'total-extras-cost',
                label: 'Total Extras Cost:',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.total-for-extras"),
                required: false,
                value: `${result.detailedData.booking.total_extras_cost}`,
                setValue: null,
                widthOfField: 3,
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
                alwaysEnglish: true,
                httpName: 'total-extras-cost'

            })
        }

        if (result.detailedData.booking.total_paid_for_base_and_extras) {
            currentFormFields.push({
                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                type: 'text',
                name: 'total-paid-for-base-and-extras',
                label: 'Total Cost For Base And Extras:',
                displayLabel: t("events-pages.event-booking-pages.booking-status-info-page.total-cost-for-base-and-extras"),
                required: false,
                value: `${result.detailedData.booking.total_paid_for_base_and_extras}`,
                setValue: null,
                widthOfField: 3,
                labelOutside: true,
                labelOnTop: true,
                dontLetTheBrowserSaveField: true,
                readOnlyField: true,
                alwaysEnglish: true,
                httpName: 'total-paid-for-base-and-extras'
            })
        }

        finalFormFields = currentFormFields;
    }

    return (
        <>
            {isLoading ? (null) : (

                <div className={'booking-info-page'}>
                    <div className={"extreme-padding-container"}>
                        <h1>
                            {t("events-pages.event-booking-pages.booking-status-info-page.title")}
                        </h1>

                        {(finalFormFields && finalFormFields.length > 0 && !fetchBookingBySessionError) && (
                            <Form mailTo={''}
                                  formTitle={t("events-pages.event-booking-pages.booking-status-info-page.title")}
                                  sendPdf={false}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  fields={finalFormFields}
                                  formIsReadOnly={true}
                            />
                        )}

                        { (!fetchBookingBySessionError && finalFormFields && finalFormFields.length > 0 && detailedData && bookingId && bookingUsername) && (
                            <div className={'confirmation-buttons-wrapper-in-booking-info-page'}>
                                {walletPassOffer && (
                                    <WalletBadgeButton
                                        wallet={Capacitor.getPlatform() === 'ios' ? 'apple' : 'google'}
                                        language={i18n.language}
                                        label={Capacitor.getPlatform() === 'ios'
                                            ? t("events-pages.event-booking-pages.booking-status-info-page.add-to-apple-wallet-btn")
                                            : t("events-pages.event-booking-pages.booking-status-info-page.save-to-google-wallet-btn")}
                                        disabled={isLoading}
                                        onClick={handleAddToWallet}
                                    />
                                )}

                                {walletNotice && (
                                    <p className={'wallet-pass-notice'}>{walletNotice}</p>
                                )}

                                {!isMobileApp() && (
                                    <button
                                        className={'download-confirmation-button'}
                                        onClick={() => generateEventBookingConfirmationPDF(
                                            'download',
                                            setIsLoading,
                                            bookingId,
                                            bookingUsername,
                                            detailedData,
                                            setFetchBookingBySessionError,

                                        )}
                                        disabled={isLoading}
                                    >
                                        {t("events-pages.event-booking-pages.booking-status-info-page.download-confirmation-btn")}
                                    </button>
                                )}
                                {/*<button*/}
                                {/*    className={'print-confirmation-button'}*/}
                                {/*    onClick={() => generateConfirmationPDF(*/}
                                {/*        'print',*/}
                                {/*        setIsLoading,*/}
                                {/*        bookingId,*/}
                                {/*        bookingUsername,*/}
                                {/*        detailedData,*/}
                                {/*        setFetchBookingBySessionError,*/}
                                {/*    )}*/}
                                {/*    disabled={isLoading}*/}
                                {/*>*/}
                                {/*    Print Confirmation*/}
                                {/*</button>*/}
                            </div>
                        )}

                        {fetchBookingBySessionError && (
                            <>
                                <h2>
                                    {t("events-pages.event-booking-pages.booking-status-info-page.error-fetching-booking-info")}
                                </h2>
                                <p>
                                    {fetchBookingBySessionError}
                                </p>
                                <button onClick={() => {
                                    setFetchBookingBySessionError(null);
                                    fetchBookingBySessionId();
                                }}>
                                    {t("events-pages.event-booking-pages.booking-status-info-page.retry-btn")}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default EventBookingStatusInfo;
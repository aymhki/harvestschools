import Spinner from "../../../modules/Spinner.jsx";
import {useEffect, useState} from "react";
import { fetchBookingInfoBySessionRequest, headToBookingLoginOnInvalidSession } from "../../../services/Utils.jsx";
import { useNavigate } from "react-router-dom";
import ParallaxScrollSection from "../../../modules/ParallaxScrollSection.jsx";
import Form from '../../../modules/Form.jsx';
import '../../../styles/Events.css';
import {submitUpdateBookingExtrasRequest, generateConfirmationPDF} from "../../../services/Utils.jsx";
import {confirmedStatus, pendingPaymentStatus, notSignedUpStatus, additionalAttendeeCost, cdCost} from "../../../services/Utils.jsx";
import {useTranslation} from "react-i18next";

function BookingExtras() {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [fetchBookingBySessionError, setFetchBookingBySessionError] = useState(null);
    const [extrasFormField, setExtrasFormField] = useState(null);
    const [resetFormFromParent, setResetFormFromParent] = useState(false);
    const [detailedData, setDetailedData] = useState(null);
    const [formReadOnly, setFormReadOnly] = useState(true);
    const [formAllowEdit, setAllowEdit] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [bookingUsername, setBookingUsername] = useState(null);

    const additionalAttendeesFieldId = 1;
    const cdCountFieldId = 2;
    const paymentStatusFieldId = 3;
    const additionalAttendeesFieldCostId = 4;
    const cdCountFieldCostId = 5;
    const totalCostFieldId = 6;



    useEffect(() => {
        headToBookingLoginOnInvalidSession(navigate, setIsLoading).then(
            () => {
                fetchBookingBySessionId().then(
                    () => {
                        setIsLoading(false);
                    }
                ).catch(
                    (error) => {
                        setFetchBookingBySessionError(error.message);
                        setIsLoading(false);
                    }
                );
            }
        )
    }, [])

    useEffect(() => {
        if (!detailedData) {
            return;
        }

        let currentFormFields = [];

        if (detailedData.extras) {

            if (detailedData.extras.additional_attendees >= 0) {
                currentFormFields.push({
                    id: additionalAttendeesFieldId,
                    type: 'number',
                    name: 'extra-additional-attendees',
                    label: `Requested Additional Attendee(s) (${additionalAttendeeCost} EGP Each):`,
                    displayLabel: t("events-pages.booking-pages.booking-extras-page.extra-additional-attendees", {"cost-per-attendee": additionalAttendeeCost}),
                    required: false,
                    value: detailedData.extras.additional_attendees === 0 ? '0' : detailedData.extras.additional_attendees,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-additional-attendees',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    minimumValue: 0,
                    maximumValue: 10,
                    alwaysEnglish: true,
                    onChangeResult: [
                        {
                            idOfTheFieldThatShouldChangeBasedOnThisNewValue: additionalAttendeesFieldCostId,
                            whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue: 'multiply',
                            firstValueToMultiplyWith: additionalAttendeeCost,
                            isCurrency: true,
                        },
                        {
                            idOfTheFieldThatShouldChangeBasedOnThisNewValue: totalCostFieldId,
                            whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue: 'add & multiply',
                            fieldIdsToAddAndMultiplyTogether: {
                                [cdCountFieldId]: cdCost,
                                [additionalAttendeesFieldId]: additionalAttendeeCost,
                            },
                            isCurrency: true,
                        },
                        {
                            idOfTheFieldThatShouldChangeBasedOnThisNewValue: paymentStatusFieldId,
                            whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue: 'set',
                            fieldIdsToCheckIfBiggerThanZero: [additionalAttendeesFieldId, cdCountFieldId],
                            valueToSetOnValuesBiggerThanZero: pendingPaymentStatus,
                            valueToSetOnValuesZero: notSignedUpStatus,
                        }
                    ]

                })
            }

            if (detailedData.extras.additional_attendees >= 0) {
                currentFormFields.push({
                    id: additionalAttendeesFieldCostId,
                    type: 'text',
                    name: 'extra-additional-attendees-cost',
                    label: 'Total Additional Attendee(s) Cost:',
                    displayLabel: t("events-pages.booking-pages.booking-extras-page.extra-additional-attendees-cost"),
                    required: false,
                    value: detailedData.extras.additional_attendees === 0 ? '0' : `${(detailedData.extras.additional_attendees * additionalAttendeeCost)} EGP`,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-additional-attendees-cost',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true,
                })
            }

            if (detailedData.extras.cd_count >= 0) {
                currentFormFields.push({
                    id: cdCountFieldId,
                    type: 'number',
                    name: 'extra-cd-count',
                    label: `Requested After Party CD(s) (${cdCost} EGP Each):`,
                    displayLabel: t("events-pages.booking-pages.booking-extras-page.extra-cd-count", {"cost-per-cd": cdCost}),
                    required: false,
                    value: detailedData.extras.cd_count === 0 ? '0' : detailedData.extras.cd_count,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-cd-count',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    minimumValue: 0,
                    maximumValue: 10,
                    alwaysEnglish: true,
                    onChangeResult: [
                        {
                            idOfTheFieldThatShouldChangeBasedOnThisNewValue: cdCountFieldCostId,
                            whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue: 'multiply',
                            firstValueToMultiplyWith: cdCost,
                            isCurrency: true,
                        },
                        {
                            idOfTheFieldThatShouldChangeBasedOnThisNewValue: totalCostFieldId,
                            whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue: 'add & multiply',
                            fieldIdsToAddAndMultiplyTogether: {
                                [cdCountFieldId]: cdCost,
                                [additionalAttendeesFieldId]: additionalAttendeeCost,
                            },
                            isCurrency: true,
                        },
                        {
                            idOfTheFieldThatShouldChangeBasedOnThisNewValue: paymentStatusFieldId,
                            whatToDoWithTheValueOfTheFieldThatShouldChangeBasedOnThisNewValue: 'set',
                            fieldIdsToCheckIfBiggerThanZero: [additionalAttendeesFieldId, cdCountFieldId],
                            valueToSetOnValuesBiggerThanZero: pendingPaymentStatus,
                            valueToSetOnValuesZero: notSignedUpStatus,
                        }
                    ]
                })
            }


            if (detailedData.extras.cd_count >= 0) {
                currentFormFields.push({
                    id: cdCountFieldCostId,
                    type: 'text',
                    name: 'extra-cd-count-cost',
                    label: 'Total After Party CD(s) Cost:',
                    displayLabel: t("events-pages.booking-pages.booking-extras-page.extra-cd-count-cost"),
                    required: false,
                    value: detailedData.extras.cd_count === 0 ? '0' : `${(detailedData.extras.cd_count * cdCost)} EGP`,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-cd-count-cost',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true,
                })
            }

            if (detailedData.extras.payment_status) {

                currentFormFields.push({
                    id: paymentStatusFieldId,
                    type: 'text',
                    name: 'extra-payment-status',
                    label: 'Extras Payment Status:',
                    displayLabel: t("events-pages.booking-pages.booking-extras-page.extra-payment-status"),
                    required: false,
                    value: detailedData.extras.payment_status,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-payment-status',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true,
                })
            }

            if (detailedData.extras) {
                currentFormFields.push({
                    id: totalCostFieldId,
                    type: 'text',
                    name: 'extra-total-cost',
                    label: 'Total Cost:',
                    displayLabel: t("events-pages.booking-pages.booking-extras-page.extra-total-cost"),
                    required: false,
                    value: `${(detailedData.extras.cd_count * cdCost) + (detailedData.extras.additional_attendees * additionalAttendeeCost)} EGP`,
                    setValue: null,
                    widthOfField: 2,
                    httpName: 'extra-total-cost',
                    labelOutside: true,
                    labelOnTop: true,
                    dontLetTheBrowserSaveField: true,
                    readOnlyField: true,
                    alwaysEnglish: true,
                })
            }
        }
        setExtrasFormField(currentFormFields);
    }, [detailedData, i18n.language]);

    const fetchBookingBySessionId = async () => {
        try {
            setIsLoading(true);

            const result = await fetchBookingInfoBySessionRequest(navigate);

            if (result.success) {
                setDetailedData(result.detailedData);
                setBookingId(result.bookingId);
                setBookingUsername(result.bookingUsername);
                setFetchBookingBySessionError(null);
            }

        } catch (error) {
            setFetchBookingBySessionError(error.message);
            setExtrasFormField(null);
        } finally {
            setIsLoading(false);
        }

    }

    const handleExtrasFormSubmit = async (formData) => {
        try {
            if (detailedData.booking && detailedData.booking.booking_id) {
                setIsLoading(true);
                setFetchBookingBySessionError(null);

                const result = await submitUpdateBookingExtrasRequest(formData, detailedData.booking.booking_id, navigate);

                if (result.success) {
                    setResetFormFromParent(true);
                    setFormReadOnly(true);
                    setAllowEdit(false);
                    setExtrasFormField(null);
                    setDetailedData(null);
                    fetchBookingBySessionId();
                } else {
                    throw new Error(result.message || result || t("events-pages.booking-pages.booking-extras-page.error-while-submitting-the-form"));
                }
            } else {
                throw new Error(t("events-pages.booking-pages.booking-extras-page.booking-id-is-not-available"));
            }
        } catch (error) {
            throw new Error(error.message || 'Error while submitting the form');
        } finally {
            setIsLoading(false);
        }
    }



    useEffect(() => {
        if (detailedData && detailedData.extras) {
            if (detailedData.extras.payment_status !== confirmedStatus) {
                setAllowEdit(true);
            } else {
                setAllowEdit(false);
            }
        }
    }, [detailedData])

    return (
        <>
            {isLoading && (<Spinner/>)}
            <div className={'booking-extras-page'}>
                <ParallaxScrollSection backgroundImage={'/assets/images/AcademicsPages/Facilities/Toys.jpg'} title={''} darken={true}
                                       divElements={[
                                           (
                                               <>
                                                   {
                                                       fetchBookingBySessionError ? (
                                                           <div className={'fetch-booking-session-error-message-in-booking-extras-page'}>
                                                               <p>{fetchBookingBySessionError}</p>
                                                           </div>
                                                       ) : (
                                                           <div className={'booking-extras-form-wrapper'}>
                                                               <h3>
                                                                   {t("events-pages.booking-pages.booking-extras-page.title")}
                                                               </h3>
                                                               { extrasFormField && extrasFormField.length > 0 &&
                                                                   (
                                                                       <>
                                                                           <Form fields={ extrasFormField }
                                                                                 formTitle={ t("events-pages.booking-pages.booking-extras-page.title") }
                                                                                 mailTo={ '' }
                                                                                 noCaptcha={ true }
                                                                                 noInputFieldsCache={ true }
                                                                                 centerSubmitButton={ true }
                                                                                 noClearOption={ true }
                                                                                 formIsReadOnly={formReadOnly}
                                                                                 hasDifferentOnSubmitBehaviour={true}
                                                                                 differentOnSubmitBehaviour={handleExtrasFormSubmit}
                                                                                 hasDifferentOnCancelBehaviour={true}
                                                                                 hasDifferentSubmitButtonText={true}
                                                                                 differentSubmitButtonText={[
                                                                                     t("events-pages.booking-pages.booking-extras-page.save-btn"), t("events-pages.booking-pages.booking-extras-page.saving-btn")
                                                                                 ]}
                                                                                 resetFormFromParent={resetFormFromParent}
                                                                                 setResetFormFromParent={setResetFormFromParent}
                                                                           />

                                                                           {detailedData?.extras?.payment_status === confirmedStatus && (
                                                                               <div className={'confirmation-buttons-wrapper-in-booking-extras-page'}>
                                                                                   <button
                                                                                       className={'download-confirmation-button'}
                                                                                       onClick={() => generateConfirmationPDF(
                                                                                           'download',
                                                                                           setIsLoading,
                                                                                           bookingId,
                                                                                           bookingUsername,
                                                                                           detailedData,
                                                                                           setFetchBookingBySessionError,

                                                                                       )}
                                                                                       disabled={isLoading}
                                                                                   >
                                                                                       Download Confirmation
                                                                                   </button>
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

                                                                           {formAllowEdit && (
                                                                               ( formReadOnly ? (
                                                                                       <button className={'booking-extras-edit-form-button'} onClick={ () => {setFormReadOnly( false );}}>
                                                                                           {t("events-pages.booking-pages.booking-extras-page.edit-btn")}
                                                                                       </button>
                                                                                   ) : (
                                                                                       <button className={'booking-extras-cancel-form-button'} onClick={ () => {
                                                                                           setFormReadOnly( true );
                                                                                           setResetFormFromParent( true );
                                                                                           setAllowEdit( false );
                                                                                           setExtrasFormField(null);
                                                                                           fetchBookingBySessionId();

                                                                                       }}>
                                                                                           {t("events-pages.booking-pages.booking-extras-page.cancel-btn")}
                                                                                       </button>
                                                                                   )
                                                                               )
                                                                           )}
                                                                       </>
                                                                   )
                                                               }
                                                           </div>
                                                       )
                                                   }
                                               </>
                                           )
                                       ]}
                />
            </div>
        </>
    );
}

export default BookingExtras;

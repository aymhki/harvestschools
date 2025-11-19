import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Spinner from "../../../modules/Spinner.jsx";
import '../../../styles/Events.css';
import {fetchBookingConfirmationRequest} from "../../../services/Utils.jsx";
import {pendingPaymentStatus, notSignedUpStatus, confirmedStatus} from "../../../services/Utils.jsx";
import {useTranslation} from "react-i18next";

function BookingConfirmation() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);
    const [bookingConfirmationError, setBookingConfirmationError] = useState(null);
    const bookingId = searchParams.get('bookingId');
    const extrasId = searchParams.get('extrasId');
    const authId = searchParams.get('authId');
    const username = searchParams.get('username');


    const fetchConfirmationData = useCallback( async () => {
        try {
            setIsLoading( true );
            setBookingConfirmationError( null );

            const result = await fetchBookingConfirmationRequest( bookingId, extrasId, username, authId );

            if (result && result.success && result.confirmation_data) {
                setConfirmationData( result.confirmation_data );
            } else {
                throw new Error( result.message || result || t('events-pages.booking-pages.booking-confirmation-page.failed-to-fetch-confirmation-data') );
            }
        } catch ( err ) {
            setBookingConfirmationError( err.message || t('events-pages.booking-pages.booking-confirmation-page.failed-to-fetch-confirmation-data') );
        } finally {
            setIsLoading( false );
        }
    }, [authId, bookingId, extrasId, username, t] );

    useEffect(() => {
        setIsLoading(true);

        if (!bookingId || !authId || !username || !extrasId) {
            setBookingConfirmationError(t('events-pages.booking-pages.booking-confirmation-page.missing-required-confirmation-parameters'));
            setIsLoading(false);
            return;
        }

        fetchConfirmationData();
    }, [bookingId, extrasId, authId, username, fetchConfirmationData, t]);

    const getConfirmationTitle = (confirmationData) => {
        if (confirmationData.payment_status === confirmedStatus) {
            return (<h3>{t('events-pages.booking-pages.booking-confirmation-page.paid-for-base-fare-and-extras')}</h3>)
        } else if (confirmationData.payment_status === pendingPaymentStatus) {
            return (<h3>{t('events-pages.booking-pages.booking-confirmation-page.paid-for-base-fare-only')}</h3>)
        } else if (confirmationData.payment_status === notSignedUpStatus) {
            return (<h3>{t('events-pages.booking-pages.booking-confirmation-page.paid-for-base-fare-only')}</h3>)
        } else {
            return <h3>{t('events-pages.booking-pages.booking-confirmation-page.unknown')}</h3>
        }
    }

    const getAdditionalAttendeesTextToShow = (confirmationData) => {
        if (confirmationData.payment_status === confirmedStatus) {
            return (
                    <p>{ t('events-pages.booking-pages.booking-confirmation-page.number-of-additional-attendees-allowed', { "allowed-attendees": confirmationData.additional_attendees } ) } </p>
            )
        } else if (confirmationData.payment_status === pendingPaymentStatus) {
            return (
                <p>{t('events-pages.booking-pages.booking-confirmation-page.signed-up-for-attendees-but-did-not-pay-for-extras-yet', {"number-of-attendees": confirmationData.additional_attendees})} </p>
            )
        } else if (confirmationData.payment_status === notSignedUpStatus) {
            if (confirmationData.additional_attendees === 0 || confirmationData.additional_attendees === '0') {
                return (
                    <p>{t('events-pages.booking-pages.booking-confirmation-page.did-not-sign-up-for-additional-attendees')}</p>
                )
            } else {
                return (
                    <p>{ t('events-pages.booking-pages.booking-confirmation-page.found-additional-attendees-number', {"number-of-attendees": confirmationData.additional_attendees} ) }</p>
                )
            }
        } else {
            return <p>{t('events-pages.booking-pages.booking-confirmation-page.unknown-attendees-status')}</p>
        }
    }

    const getCDCountTextToShow = (confirmationData) => {
        if (confirmationData.payment_status === confirmedStatus) {
            return (
                <p>{t('events-pages.booking-pages.booking-confirmation-page.number-of-paid-for-cds', {"paid-for-cds": confirmationData.cd_count})} </p>
            )
        } else if (confirmationData.payment_status === pendingPaymentStatus) {
            return (
                <p>{t('events-pages.booking-pages.booking-confirmation-page.signed-up-for-cds-but-did-not-pay-for-extras-yet', {"number-of-cds": confirmationData.cd_count})}</p>
            )
        } else if (confirmationData.payment_status === notSignedUpStatus) {
            if (confirmationData.cd_count === 0 || confirmationData.cd_count === '0') {
                return ( <p>{t('events-pages.booking-pages.booking-confirmation-page.did-not-sign-up-for-cds')}</p> )
            } else {
                return (
                    <p>{t('events-pages.booking-pages.booking-confirmation-page.found-cds-number', {"number-of-cds": confirmationData.cd_count})}</p>
                )
            }
        } else {
            return <p>{t('events-pages.booking-pages.booking-confirmation-page.unknown-cds-status')}</p>
        }
    }


    return (
        <>
            {isLoading && <Spinner />}
            <div className={'booking-confirmation-page'}>
                <div className={'booking-confirmation-wrapper'}>
                    {bookingConfirmationError ? (
                        <>
                            <h1>
                                {t('events-pages.booking-pages.booking-confirmation-page.could-not-find-nor-confirm-booking')}
                            </h1>
                            <div className={'events-booking-confirmation-error-message'}>
                                <p>{bookingConfirmationError}</p>
                            </div>
                        </>
                    ) : confirmationData ? (
                        <div className={'confirmation-details'}>
                            <h1>{t('events-pages.booking-pages.booking-confirmation-page.booking-found')}</h1>
                            <div className={'confirmation-info'}>

                                {getConfirmationTitle(confirmationData)}

                                <p>{t('events-pages.booking-pages.booking-confirmation-page.booking-id')}</p>
                                <p className={"dynamic-booking-confirmation-result-value-field"}>{confirmationData.booking_id}</p>

                                <p>{t('events-pages.booking-pages.booking-confirmation-page.extras-status')}</p>
                                <p className={"dynamic-booking-confirmation-result-value-field"}>{confirmationData.payment_status}</p>

                                {getAdditionalAttendeesTextToShow(confirmationData)}
                                {getCDCountTextToShow(confirmationData)}

                                <p>{t('events-pages.booking-pages.booking-confirmation-page.total-paid-for-base-fare')}</p>
                                <p className={"dynamic-booking-confirmation-result-value-field"}>{confirmationData.total_paid_for_base_fair}</p>

                                <p>{t('events-pages.booking-pages.booking-confirmation-page.total-cost-for-extras')}</p>
                                <p className={"dynamic-booking-confirmation-result-value-field"}>{confirmationData.total_paid}</p>

                                <p>{t('events-pages.booking-pages.booking-confirmation-page.total-cost-for-base-and-extras')}</p>
                                <p className={"dynamic-booking-confirmation-result-value-field"}>{confirmationData.total_paid_for_base_and_extras}</p>

                            </div>
                        </div>
                    ) : (
                        <div className={'loading-message'}>
                            <p>{t('events-pages.booking-pages.booking-confirmation-page.loading-confirmation-details')}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default BookingConfirmation;

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Spinner from "../../../modules/Spinner.jsx";
import '../../../styles/Events.css';
import {fetchBookingConfirmationRequest} from "../../../services/Utils.jsx";
import {pendingPaymentStatus, notSignedUpStatus, confirmedStatus} from "../../../services/Utils.jsx";

function BookingConfirmation() {
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
				throw new Error( result.message || result || 'Failed to fetch confirmation data' );
			}
		} catch ( err ) {
			setBookingConfirmationError( err.message || 'Failed to fetch confirmation data' );
		} finally {
			setIsLoading( false );
		}
	}, [authId, bookingId, extrasId, username] );
	
	useEffect(() => {
		setIsLoading(true);
		
		if (!bookingId || !authId || !username || !extrasId) {
			setBookingConfirmationError('Missing required confirmation parameters');
			setIsLoading(false);
			return;
		}
		
		fetchConfirmationData();
	}, [bookingId, extrasId, authId, username, fetchConfirmationData]);
	
	const getConfirmationTitle = (confirmationData) => {
		if (confirmationData.payment_status === confirmedStatus) {
			return (<h3>Paid for base fare and extras</h3>)
		} else if (confirmationData.payment_status === pendingPaymentStatus) {
			return (<h3>Paid for base fare only</h3>)
		} else if (confirmationData.payment_status === notSignedUpStatus) {
			return (<h3>Paid for base fare only</h3>)
		} else {
			return <h3>Unknown</h3>
		}
	}
	
	const getAdditionalAttendeesTextToShow = (confirmationData) => {
		if (confirmationData.payment_status === confirmedStatus) {
			return (<p><strong>Number of Additional Attendee(s) Allowed:</strong> {confirmationData.additional_attendees}</p>)
		} else if (confirmationData.payment_status === pendingPaymentStatus) {
			return (<p><strong>Signed Up For:</strong> {confirmationData.additional_attendees} <strong>but did not pay for extras yet</strong> </p>)
		} else if (confirmationData.payment_status === notSignedUpStatus) {
			if (confirmationData.additional_attendees === 0 || confirmationData.additional_attendees === '0') {
				return ( <p><strong>Did not sign up for Additional Attendee(s)</strong></p> )
			} else {
				return (<p><strong>Found Additional Attendee(s) Number:</strong> {confirmationData.additional_attendees} <strong>but did not sign up for extras</strong> </p>)
			}
		} else {
			return <p>Unknown</p>
		}
	}
	
	const getCDCountTextToShow = (confirmationData) => {
		if (confirmationData.payment_status === confirmedStatus) {
			return (<p><strong>Number of Paid for CD(s):</strong> {confirmationData.cd_count}</p>)
		} else if (confirmationData.payment_status === pendingPaymentStatus) {
			return (<p><strong>Signed Up For:</strong> {confirmationData.cd_count} <strong>but did not pay for extras yet</strong> </p>)
		} else if (confirmationData.payment_status === notSignedUpStatus) {
			if (confirmationData.cd_count === 0 || confirmationData.cd_count === '0') {
				return ( <p><strong>Did not sign up for CD(s)</strong></p> )
			} else {
				return ( <p><strong>Found CD(s) Number:</strong> { confirmationData.cd_count } <strong>but did not sign up for extras</strong></p> )
			}
		} else {
			return <p>Unknown</p>
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
								Could not find nor confirm the booking
							</h1>
						<div className={'events-booking-confirmation-error-message'}>
							<p>{bookingConfirmationError}</p>
						</div>
						</>
					) : confirmationData ? (
						<div className={'confirmation-details'}>
							<h1>Booking Found</h1>
							<div className={'confirmation-info'}>
								{getConfirmationTitle(confirmationData)}
								<p><strong>Booking ID:</strong> {confirmationData.booking_id}</p>
								<p><strong>Extras Status:</strong> {confirmationData.payment_status}</p>
								{getAdditionalAttendeesTextToShow(confirmationData)}
								{getCDCountTextToShow(confirmationData)}
								<p><strong>Total Paid For Base Fare:</strong> {confirmationData.total_paid_for_base_fair}</p>
								<p><strong>Total Cost For Extras:</strong> {confirmationData.total_paid}</p>
								<p><strong>Total Cost For Base Fare and Extras:</strong> {confirmationData.total_paid_for_base_and_extras}</p>
								
							</div>
						</div>
					) : (
						<div className={'loading-message'}>
							<p>Loading confirmation details...</p>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

export default BookingConfirmation;


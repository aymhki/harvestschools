import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {checkBookingSession, getCookies} from "../../../services/Utils.jsx";
import Spinner from "../../../modules/Spinner.jsx";
import axios from "axios";
import Form from "../../../modules/Form.jsx";
import vacancies from "../../Vacancies.jsx";

function BookingStatusInfo() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [finalFormFields, setFinalFormFields] = useState([]);

    useEffect(() => {
        checkBookingSession(navigate, setIsLoading).then(
            () => {
                fetchBookingBySessionId();
            }
        )
    }, [])

    const fetchBookingBySessionId = async () => {
        try {
            setIsLoading(true);
            const cookies = getCookies();
            const sessionId = cookies.harvest_schools_booking_session_id;

            if (!sessionId) {
                throw new Error('Session ID not found. Please log in again.');
            }

            const response = await axios.post('/scripts/getBookingBySession.php', {
                sessionId: sessionId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });



            const result = await response.data;

            if (result.success) {
                console.log(result.bookingId);
                console.log(result.bookingUsername);
                console.log(result.sessionId);
                console.log(result.detailedData);
                console.log(result.tabularData);
                console.log(result.executionTime);

                let bookingIdField = null;
                let userNameField = null;
                let authIdField = null;
                let bookingStatusField = null;
                let currentFormFields = [];
                let numParents = null;

                if (result.detailedData && result.detailedData.parents) {
                    numParents = result.detailedData.parents.length;
                }

                if (result.bookingId !== null && result.bookingId !== undefined && result.bookingId !== '') {
                     bookingIdField = {
                        id: 1,
                        type: 'text',
                        name: 'booking-id',
                        label: 'Booking ID:',
                        required: false,
                        value: result.bookingId,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'booking-id',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                    }

                    currentFormFields.push(bookingIdField);
                }

                if (result.bookingUsername !== null && result.bookingUsername !== undefined && result.bookingUsername !== '' && result.bookingUsername.length > 0) {
                    userNameField = {
                        id: 2,
                        type: 'text',
                        name: 'username',
                        label: 'Username:',
                        required: false,
                        value: result.bookingUsername,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'username',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                    }

                    currentFormFields.push(userNameField);
                }

                if (result.detailedData.booking.password_hash !== null && result.detailedData.booking.password_hash !== undefined && result.detailedData.booking.password_hash !== '' && result.detailedData.booking.password_hash.length > 0) {
                    authIdField = {
                        id: 3,
                        type: 'text',
                        name: 'auth-id',
                        label: 'Auth ID:',
                        required: false,
                        value: result.detailedData.booking.password_hash,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'auth-id',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                    }

                    currentFormFields.push(authIdField);
                }

                if (result.detailedData.booking.status !== null && result.detailedData.booking.status !== undefined && result.detailedData.booking.status !== '' && result.detailedData.booking.status.length > 0) {
                    bookingStatusField = {
                        id: 4,
                        type: 'text',
                        name: 'booking-status',
                        label: 'Booking Status:',
                        required: false,
                        value: result.detailedData.booking.status,
                        setValue: null,
                        widthOfField: 2,
                        httpName: 'booking-status',
                        labelOutside: true,
                        labelOnTop: true,
                        dontLetTheBrowserSaveField: true,
                        readOnlyField: true,
                    }

                    currentFormFields.push(bookingStatusField);
                }

                if (numParents !== null && numParents !== undefined && numParents > 0) {
                   for (let i = 0; i < numParents; i++ ) {
                       currentFormFields.push({
                           id: (currentFormFields[currentFormFields.length - 1].id + 1),
                           type: 'section',
                           name: 'new-parent',
                           label: 'Parent: ' + (i+1),
                           required: true,
                           widthOfField: 1,
                           httpName: 'new-parent',

                       })

                       currentFormFields.push({
                           id: (currentFormFields[currentFormFields.length - 1].id + 1),
                           type: 'text',
                           name: 'parent-name',
                           label: 'Parent Name: ',
                           required: false,
                           value: result.detailedData.parents[i].name,
                           setValue: null,
                           widthOfField: 2,
                            httpName: 'parent-name',
                            labelOutside: true,
                            labelOnTop: true,
                            dontLetTheBrowserSaveField: true,
                            readOnlyField: true,
                       })


                   }
                }

                setFinalFormFields(currentFormFields);

            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                console.log(error.response.data.message);
            } else {
                console.log(error.message);
            }
        } finally {
            setIsLoading(false);
        }


    }

    return (
        <>
            {isLoading && (<Spinner/>)}

            <div className={'booking-info-page'}>
                <h1>
                    Booking Info
                </h1>

                <div className={'booking-info-page-form-wrapper'}>
                    {finalFormFields.length > 0 && (
                        <Form mailTo={''}
                              formTitle={'Booking Info'}
                              sendPdf={false}
                              lang={'en'}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              fields={finalFormFields}
                              formIsReadOnly={true}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default BookingStatusInfo;
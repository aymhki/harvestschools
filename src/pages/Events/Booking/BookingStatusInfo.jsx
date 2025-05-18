import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {fetchBookingInfoBySessionRequest, formatDateFromPacific, headToBookingLoginOnInvalidSession} from "../../../services/Utils.jsx";
import Spinner from "../../../modules/Spinner.jsx";
import Form from "../../../modules/Form.jsx";

function BookingStatusInfo() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [finalFormFields, setFinalFormFields] = useState([]);
    const [errorToDisplay, setErrorToDisplay] = useState(null);

    useEffect(() => {
        headToBookingLoginOnInvalidSession(navigate, setIsLoading)
        .then(
            () => {
                fetchBookingBySessionId();
            }
        )
    }, [])

    const fetchBookingBySessionId = async () => {
        try {
            setIsLoading(true);

            const result = await  fetchBookingInfoBySessionRequest(navigate);

            if (result.success) {
                let bookingIdField = null;
                let userNameField = null;
                let authIdField = null;
                let bookingStatusField = null;
                let currentFormFields = [];
                let numParents = null;
                let numStudents = null;

                if (result.detailedData && result.detailedData.parents) {
                    numParents = result.detailedData.parents.length;
                }

                if (result.detailedData && result.detailedData.students) {
                    numStudents = result.detailedData.students.length;
                }

                if (result.bookingId) {
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

                if (result.bookingUsername) {
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

                if (result.detailedData.booking.password_hash) {
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

                if (result.detailedData.booking.status) {
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

                if (numParents) {
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

                       if (result.detailedData.parents[i].parent_id) {
                           currentFormFields.push({
                               id: (currentFormFields[currentFormFields.length - 1].id + 1),
                               type: 'text',
                               name: 'parent-id',
                               label: 'Parent Id: ',
                               required: false,
                               value: result.detailedData.parents[i].parent_id,
                               setValue: null,
                               widthOfField: 2,
                               httpName: 'parent-id',
                               labelOutside: true,
                               labelOnTop: true,
                               dontLetTheBrowserSaveField: true,
                               readOnlyField: true,
                           })
                       }

                          if (result.detailedData.parents[i].name) {
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

                     if (result.detailedData.parents[i].email) {
                         currentFormFields.push({
                             id: (currentFormFields[currentFormFields.length - 1].id + 1),
                             type: 'text',
                             name: 'parent-email',
                             label: 'Parent Email: ',
                             required: false,
                             value: result.detailedData.parents[i].email,
                             setValue: null,
                             widthOfField: 2,
                             httpName: 'parent-email',
                             labelOutside: true,
                             labelOnTop: true,
                             dontLetTheBrowserSaveField: true,
                             readOnlyField: true,
                         })
                     }


                     if(result.detailedData.parents[i].phone_number) {
                         currentFormFields.push({
                             id: (currentFormFields[currentFormFields.length - 1].id + 1),
                             type: 'text',
                             name: 'parent-phone',
                             label: 'Parent Phone: ',
                             required: false,
                             value: result.detailedData.parents[i].phone_number,
                             setValue: null,
                             widthOfField: 2,
                             httpName: 'parent-phone',
                             labelOutside: true,
                             labelOnTop: true,
                             dontLetTheBrowserSaveField: true,
                             readOnlyField: true,
                         })
                     }
                   }
                }

                if (numStudents) {
                    for (let i = 0; i < numStudents; i++ ) {
                        currentFormFields.push({
                            id: (currentFormFields[currentFormFields.length - 1].id + 1),
                            type: 'section',
                            name: 'new-student',
                            label: 'Student: ' + (i+1),
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
                                required: false,
                                value: result.detailedData.students[i].student_id,
                                setValue: null,
                                widthOfField: 2,
                                httpName: 'student-id',
                                labelOutside: true,
                                labelOnTop: true,
                                dontLetTheBrowserSaveField: true,
                                readOnlyField: true,
                            })
                        }

                        if (result.detailedData.students[i].name) {
                            currentFormFields.push({
                                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                                type: 'text',
                                name: 'student-name',
                                label: 'Student Name:',
                                required: false,
                                value: result.detailedData.students[i].name,
                                setValue: null,
                                widthOfField: 2,
                                httpName: 'student-name',
                                labelOutside: true,
                                labelOnTop: true,
                                dontLetTheBrowserSaveField: true,
                                readOnlyField: true,
                            })
                        }

                        if (result.detailedData.students[i].grade) {
                            currentFormFields.push({
                                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                                type: 'text',
                                name: 'student-grade',
                                label: 'Student Grade:',
                                required: false,
                                value: result.detailedData.students[i].grade,
                                setValue: null,
                                widthOfField: 2,
                                httpName: 'student-grade',
                                labelOutside: true,
                                labelOnTop: true,
                                dontLetTheBrowserSaveField: true,
                                readOnlyField: true,
                            })
                        }

                        if (result.detailedData.students[i].school_division) {
                            currentFormFields.push({
                                id: (currentFormFields[currentFormFields.length - 1].id + 1),
                                type: 'text',
                                name: 'student-school-division',
                                label: 'Student School Division:',
                                required: false,
                                value: result.detailedData.students[i].school_division,
                                setValue: null,
                                widthOfField: 2,
                                httpName: 'student-school-division',
                                labelOutside: true,
                                labelOnTop: true,
                                dontLetTheBrowserSaveField: true,
                                readOnlyField: true,
                            })
                        }
                    }
                }

                if (result.detailedData.extras) {
                    currentFormFields.push({
                        id: (currentFormFields[currentFormFields.length - 1].id + 1),
                        type: 'section',
                        name: 'extras',
                        label: 'Extras',
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
                            required: false,
                            value: result.detailedData.extras.extra_id,
                            setValue: null,
                            widthOfField: 2,
                            httpName: 'extra-id',
                            labelOutside: true,
                            labelOnTop: true,
                            dontLetTheBrowserSaveField: true,
                            readOnlyField: true,
                        })
                    }

                    if (result.detailedData.extras.payment_status) {
                        currentFormFields.push({
                            id: (currentFormFields[currentFormFields.length - 1].id + 1),
                            type: 'text',
                            name: 'extra-payment-status',
                            label: 'Extras Payment Status:',
                            required: false,
                            value: result.detailedData.extras.payment_status,
                            setValue: null,
                            widthOfField: 2,
                            httpName: 'extra-payment-status',
                            labelOutside: true,
                            labelOnTop: true,
                            dontLetTheBrowserSaveField: true,
                            readOnlyField: true,
                        })
                    }

                    if (result.detailedData.extras.additional_attendees >= 0) {
                        currentFormFields.push({
                            id: (currentFormFields[currentFormFields.length - 1].id + 1),
                            type: 'text',
                            name: 'extra-additional-attendees',
                            label: 'Requested Additional Attendee(s):',
                            required: false,
                            value: result.detailedData.extras.additional_attendees == 0 ? 'No' : result.detailedData.extras.additional_attendees,
                            setValue: null,
                            widthOfField: 2,
                            httpName: 'extra-additional-attendees',
                            labelOutside: true,
                            labelOnTop: true,
                            dontLetTheBrowserSaveField: true,
                            readOnlyField: true,
                        })
                    }

                    if (result.detailedData.extras.cd_count >= 0) {
                        currentFormFields.push({
                            id: (currentFormFields[currentFormFields.length - 1].id + 1),
                            type: 'text',
                            name: 'extra-cd-count',
                            label: 'Requested After Part CD(s):',
                            required: false,
                            value: result.detailedData.extras.cd_count == 0 ? 'No' : result.detailedData.extras.cd_count,
                            setValue: null,
                            widthOfField: 2,
                            httpName: 'extra-cd-count',
                            labelOutside: true,
                            labelOnTop: true,
                            dontLetTheBrowserSaveField: true,
                            readOnlyField: true,
                        })
                    }

                    if (result.detailedData.extras.updated_at) {
                        currentFormFields.push({
                            id: (currentFormFields[currentFormFields.length - 1].id + 1),
                            type: 'text',
                            name: 'extra-updated-at',
                            label: 'Last Updated At:',
                            required: false,
                            value: formatDateFromPacific(result.detailedData.extras.updated_at),
                            setValue: null,
                            widthOfField: 2,
                            httpName: 'extra-updated-at',
                            labelOutside: true,
                            labelOnTop: true,
                            dontLetTheBrowserSaveField: true,
                            readOnlyField: true,
                        })
                    }
                }

                setFinalFormFields(currentFormFields);

            } else {
                setErrorToDisplay(result.message || result);
            }

        } catch (error) {
            setErrorToDisplay(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            {isLoading && (<Spinner/>)}

            <div className={'booking-info-page'}>


                <div className={"extreme-padding-container"}>
                    <h1>
                        Booking Info
                    </h1>

                    {(finalFormFields.length > 0 && !errorToDisplay) (
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

                    {errorToDisplay && (
                        <>
                            <h2>
                                Error fetching booking info
                            </h2>
                            <p>
                                {errorToDisplay}
                            </p>
                            <button onClick={() => {
                                setErrorToDisplay(null);
                                fetchBookingBySessionId();
                            }}>
                                Retry
                            </button>
                        </>
                    )}
                </div>

            </div>
        </>
    );
}

export default BookingStatusInfo;
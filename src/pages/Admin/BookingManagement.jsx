import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {checkAdminSession} from "../../services/Utils.jsx";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import '../../styles/Dashboard.css';

function BookingManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [allBookings, setAllBookings] = useState(null);

    const [resetAddBookingModal, setResetAddBookingModal] = useState(false);
    const [showAddBookingModal, setShowAddBookingModal] = useState(false);
    const [showDeleteBookingModal, setShowDeleteBookingModal] = useState(false);
    const [rowIndexToDelete, setRowIndexToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const colIndexForBookingId = 0
    const colIndexForStudentId = 1
    const colIndexForStudentName = 2

    const animateAddBookingModal = useSpring({
        opacity: showAddBookingModal ? 1 : 0,
        transform: showAddBookingModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateDeleteBookingModal = useSpring({
        opacity: showDeleteBookingModal ? 1 : 0,
        transform: showDeleteBookingModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const bookingUsernameFieldId = 1
    const bookingPasswordFieldId = 2
    const confirmBookingPasswordFieldId = 3
    const firstParentNameFieldId = 4
    const firstParentEmailFieldId = 5
    const firstParentPhoneNumberFieldId = 6
    const secondParentNameFieldId = 7
    const secondParentEmailFieldId = 8
    const secondParentPhoneNumberFieldId = 9

    const addBookingModalCoreFormFields = [
        {
            id: bookingUsernameFieldId,
            type: 'text',
            name: 'booking-username',
            label: 'Booking Username',
            required: true,
            placeholder: 'Booking Username',
            errorMsg: 'Please enter the booking username',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'booking-username',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
        },
        {
            id: bookingPasswordFieldId,
            type: 'password',
            name: 'booking-password',
            label: 'Booking Password',
            required: true,
            placeholder: 'Booking Password',
            errorMsg: 'Please enter the booking password',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'booking-password',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
        },
        {
            id: confirmBookingPasswordFieldId,
            type: 'password',
            name: 'confirm-booking-password',
            label: 'Confirm Booking Password',
            required: true,
            placeholder: 'Confirm Booking Password',
            errorMsg: 'Please enter the booking password',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'confirm-booking-password',
            mustMatchFieldWithId: 2,
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
        },
        {
            id: firstParentNameFieldId,
            type: 'text',
            name: 'first-parent-name',
            label: 'First Parent Name',
            required: true,
            placeholder: 'First Parent Name',
            errorMsg: 'Please enter the first parent name',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'first-parent-name',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: firstParentEmailFieldId,
            type: 'email',
            name: 'first-parent-email',
            label: 'First Parent Email',
            required: true,
            placeholder: 'First Parent Email',
            errorMsg: 'Please enter the first parent email',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'first-parent-email',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: firstParentPhoneNumberFieldId,
            type: 'tel',
            name: 'first-parent-phone-number',
            label: 'First Parent Phone Number',
            required: true,
            placeholder: 'First Parent Phone Number',
            errorMsg: 'Please enter the first parent phone number',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'first-parent-phone-number',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: secondParentNameFieldId,
            type: 'text',
            name: 'second-parent-name',
            label: 'Second Parent Name',
            required: false,
            placeholder: 'Second Parent Name',
            errorMsg: 'Please enter the second parent name',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'second-parent-name',
            mustNotMatchFieldWithId: firstParentNameFieldId,
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: secondParentEmailFieldId,
            type: 'email',
            name: 'second-parent-email',
            label: 'Second Parent Email',
            required: false,
            placeholder: 'Second Parent Email',
            errorMsg: 'Please enter the second parent email',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'second-parent-email',
            mustNotMatchFieldWithId: firstParentEmailFieldId,
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: secondParentPhoneNumberFieldId,
            type: 'tel',
            name: 'second-parent-phone-number',
            label: 'Second Parent Phone Number',
            required: false,
            placeholder: 'Second Parent Phone Number',
            errorMsg: 'Please enter the second parent phone number',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'second-parent-phone-number',
            mustNotMatchFieldWithId: firstParentPhoneNumberFieldId,
            labelOutside: true,
            labelOnTop: true,
        }
    ]

    const studentSectionFields = [
        {
            type: 'section',
            name: 'student-section',
            label: 'New Student',
            required: true,
            placeholder: 'Student Section',
            errorMsg: '',
            value: '',
            setValue: null,
            widthOfField: 1,
            httpName: 'student-section',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            type: 'text',
            name: 'student-name',
            label: 'Student Name',
            required: true,
            placeholder: 'Student Name',
            errorMsg: 'Please enter the student name',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-name',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            type: 'select',
            name: 'student-school-division',
            label: 'Student School Division',
            choices: ['IGCSE', 'American', 'National', 'Other'],
            required: true,
            placeholder: 'Student School Division',
            errorMsg: 'Please enter the student school division',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-school-division',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            type: 'select',
            name: 'student-grade',
            label: 'Student Grade',
            choices: ['PlaySchool', 'KG 1', 'KG 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
            required: true,
            placeholder: 'Student Grade',
            errorMsg: 'Please enter the student grade',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-grade',
            labelOutside: true,
            labelOnTop: true,
        },
    ]

    const cancelAddBookingModal = () => {
        setShowAddBookingModal(false);
        setResetAddBookingModal(true);
    }

    const handleCancelDeleteBookingModal = () => {
        setShowDeleteBookingModal(false);
        setRowIndexToDelete(null);
    }

    const handleDeleteBooking = async () => {
        try {
            setIsLoading(true);
            setIsDeleting(true);
            const bookingId = allBookings[rowIndexToDelete][colIndexForBookingId];
            const studentId = allBookings[rowIndexToDelete][colIndexForStudentId];

            const response = await fetch('/scripts/deleteBookingEntry.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: studentId,
                    bookingId: bookingId
                })
            });

            const result = await response.json();

            if (result.success) {
                setShowDeleteBookingModal(false);
                setIsDeleting(false);
                setDeleteError(null);
                setRowIndexToDelete(null);
                fetchBookings();
            } else {
                throw new Error(`${result.message}`);
            }
        } catch (error) {
            setIsDeleting(false);
            setRowIndexToDelete(null);
            console.error('Error deleting booking:', error.message);
            setDeleteError(error.message);
        } finally {
            setIsDeleting(false);
            setRowIndexToDelete(null);
            setIsLoading(false);
        }
    };

    const oneStudentLeftForBookingId = () => {
        if (allBookings && allBookings[rowIndexToDelete]) {
            const bookingId = allBookings[rowIndexToDelete][colIndexForBookingId];
            const studentCount = allBookings.filter(booking => booking[0] === bookingId).length;
            return studentCount === 1;
        } else {
            return false;
        }
    }

    const handleAddBooking = async (formData) => {
        try {
            setIsLoading(true);

            const response = await fetch('/scripts/submitAddBookingForm.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setResetAddBookingModal(true)
                setShowAddBookingModal(false);
                fetchBookings();
            } else {
                throw new Error(`${result.message}`);
            }
        } catch (error) {
            throw new Error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const fetchBookings = async () => {
        try {
            setIsLoading(true);

            const response = await fetch('/scripts/getAllBookings.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                setAllBookings(result.data);
            } else {
                console.log(result.message);
            }

        } catch (error) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        checkAdminSession(navigate, setIsLoading, 1);
    }, []);

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"booking-management-page"}>
                <Table tableData={allBookings}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       defaultHiddenColumns={
                       [
                            'Booking ID',
                            'Student ID',
                           'Booking Password',
                           'Student Created',
                           'Booking Created',
                       ]}
                       allowExport={true}
                       exportFileName={'bookings'}
                       sortConfigParam={{column: 0, direction: 'descending'}}
                       filterableColumns={
                       [
                           'School Division',
                           'Grade',
                       ]}
                       headerModuleElements={[(
                           <button key={1} onClick={() => {
                                setShowAddBookingModal(true);
                           }}>
                               Add Booking
                           </button>
                       ),
                       (
                             <button key={2} onClick={fetchBookings} disabled={isLoading}>
                                    {isLoading ? 'Loading...' : 'Reload Table Data'}
                             </button>
                       )
                       ]}
                       onDeleteEntry={(rowIndex) => {
                           setRowIndexToDelete(rowIndex);
                           setShowDeleteBookingModal(true);
                       }}
                       allowDeleteEntryOption={true}
                       columnsToWrap={
                            [
                                // 'Booking ID',
                                // 'School Division',
                                // 'Student ID',
                                // 'Grade',
                                // 'Student Name',
                                // 'Booking Username',
                                // 'First Parent Name',
                                // 'First Parent Email',
                                // 'First Parent Phone',
                                // 'CD Count',
                                // 'Additional Attendees',
                                // 'Payment Status',
                                // 'Second Parent Name',
                                // 'Second Parent Email',
                                // 'Second Parent Phone',
                            ]
                       }
                />
            </div>

            <animated.div style={animateAddBookingModal} className={"add-booking-modal"}>
                <div className={"add-booking-modal-form-overlay"} onClick={cancelAddBookingModal}/>
                <div className={"add-booking-modal-form-container"}>
                    <div className={"add-booking-modal-form-header"}>
                        <h3>
                            Add A New Booking
                        </h3>
                    </div>

                    <div className={"add-booking-modal-content"}>
                        <Form fields={addBookingModalCoreFormFields}
                              mailTo={''}
                              sendPdf={false}
                              formTitle={"Add Booking Modal Form"}
                              lang={"en"}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              resetFormFromParent={resetAddBookingModal}
                              setResetForFromParent={setResetAddBookingModal}
                              hasDifferentOnSubmitBehaviour={true}
                              differentOnSubmitBehaviour={handleAddBooking}
                              dynamicSections={[
                                  {
                                      addButtonText: "Add Student",
                                      removeButtonText: "Remove Student",
                                      startAddingFieldsFromId: 9,
                                      fieldsToAdd: studentSectionFields,
                                      maxSectionInstancesToAdd: 5,
                                      sectionId: "student-section",
                                      minimumSectionInstancesForValidSubmission: 1,
                                      sectionTitle: "New Student",
                                  }
                              ]}
                              formInModalPopup={true}
                              setShowFormModalPopup={setShowAddBookingModal}
                              pedanticIds={false}
                              formHasPasswordField={true}

                        />
                    </div>


                    <div className={"add-booking-modal-form-footer"}>
                        <button className={"add-booking-modal-form-cancel-button"} onClick={cancelAddBookingModal}>
                            Cancel
                        </button>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeleteBookingModal} className={"delete-booking-modal"}>
                <div className={"delete-booking-modal-overlay"} onClick={handleCancelDeleteBookingModal}/>

                <div className={"delete-booking-modal-container"}>

                    <div className={"delete-booking-modal-header"}>

                        <h3>
                            Delete Booking
                        </h3>

                    </div>

                    <div className={"delete-booking-modal-content"}>
                        {oneStudentLeftForBookingId() ? (
                            <p>
                                Are you sure you want to delete the booking record for (allBookings ? (
                                    <strong>{allBookings[rowIndexToDelete][colIndexForStudentName]}</strong>?
                            ) : (
                                <strong>this student</strong>?
                            ))
                                This is the only student left for this booking ID (allBookings ? (
                                <strong>{allBookings[rowIndexToDelete][colIndexForBookingId]}</strong>
                                ) : (
                                    <strong>this booking ID</strong>
                                )), so the parents data as well as the authentication credentials will be deleted.
                            </p>
                        ) : (
                            <p>
                                Are you sure you want to delete the booking record for (allBookings ? (<strong>{allBookings[rowIndexToDelete][colIndexForStudentName]}</strong>?) : (
                                    <strong>this student</strong>?
                                ))
                            </p>
                        )}
                    </div>

                    <div className={"delete-booking-modal-footer"}>
                        {deleteError && <p className={"delete-booking-modal-error"}>sss{deleteError}</p>}


                        <button className={"delete-booking-modal-cancel-button"} onClick={handleCancelDeleteBookingModal}>
                            Cancel
                        </button>

                        <button className={"delete-booking-modal-confirm-button"} onClick={() => {
                            handleDeleteBooking();
                        }}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>

                    </div>

                </div>


            </animated.div>
        </>
    );
}

export default BookingManagement;


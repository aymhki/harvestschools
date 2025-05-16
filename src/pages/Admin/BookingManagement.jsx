import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {checkAdminSession} from "../../services/Utils.jsx";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import '../../styles/Dashboard.css';
import axios from "axios";

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

    const [showEditBookingModal, setShowEditBookingModal] = useState(false);
    const [editBookingModalPreFilledCoreFields, setEditBookingModalPreFilledCoreFields] = useState(null);
    const [editBookingModalPreFilledExistingSections, setEditBookingModalPreFilledExistingSections] = useState(null);
    const [resetEditBookingModal, setResetEditBookingModal] = useState(false);

    const bookingUsernameFieldId = 1;
    const bookingPasswordFieldId = 2;
    const confirmBookingPasswordFieldId = 3;
    const firstParentNameFieldId = 4;
    const firstParentEmailFieldId = 5;
    const firstParentPhoneNumberFieldId = 6;
    const secondParentNameFieldId = 7;
    const secondParentEmailFieldId = 8;
    const secondParentPhoneNumberFieldId = 9;
    const additionalAttendeesFieldId = 10;
    const cdCountFieldId = 11;
    const extrasPaymentStatusFieldId = 12; // 'Not Signed Up','Signed Up, pending payment','Confirmed'
    const colIndexForBookingId = 0;

    const animateAddBookingModal = useSpring({
        opacity: showAddBookingModal ? 1 : 0,
        transform: showAddBookingModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateDeleteBookingModal = useSpring({
        opacity: showDeleteBookingModal ? 1 : 0,
        transform: showDeleteBookingModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateEditBookingModal = useSpring({
        opacity: showEditBookingModal ? 1 : 0,
        transform: showEditBookingModal ? 'translateY(0)' : 'translateY(-100%)'
    });

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
            required: false,
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
            required: false,
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
        },
        {
            id: additionalAttendeesFieldId,
            type: 'number',
            name: 'additional-attendees',
            label: 'Additional Attendees',
            required: false,
            placeholder: 'Additional Attendees',
            errorMsg: 'Please enter the additional attendees',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'additional-attendees',
            labelOutside: true,
            labelOnTop: true,
            defaultValue: '0',
        },
        {
            id: cdCountFieldId,
            type: 'number',
            name: 'cd-count',
            label: 'CD Count',
            required: false,
            placeholder: 'CD Count',
            errorMsg: 'Please enter the CD count',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'cd-count',
            labelOutside: true,
            labelOnTop: true,
            defaultValue: '0',
        },
        {
            id: extrasPaymentStatusFieldId,
            type: 'select',
            name: 'extras-payment-status',
            label: 'Extras Payment Status',
            choices:
                [
                   'Not Signed Up', 'Signed Up, pending payment', 'Confirmed'
                ],
            required: false,
            placeholder: 'Extras Payment Status',
            errorMsg: 'Please enter the extras payment status',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'extras-payment-status',
            labelOutside: true,
            labelOnTop: true,
            defaultValue: 'Not Signed Up',
        },
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
            choices: ['IGCSE', 'American', 'National', 'Kindergarten'],
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
            choices: ['Pre Play', 'PlaySchool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
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
    };

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

    const handleDeleteBooking = async () => {
        try {
            setIsLoading(true);
            setIsDeleting(true);
            const bookingId = allBookings[rowIndexToDelete][colIndexForBookingId];

            const response = await fetch('/scripts/deleteBookingEntry.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: bookingId,
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
            console.log('Error deleting booking:', error.message);
            setDeleteError(error.message);
        } finally {
            setIsDeleting(false);
            setRowIndexToDelete(null);
            setShowDeleteBookingModal(false);
            setIsLoading(false);
        }
    };

    const handleCancelDeleteBookingModal = () => {
        setShowDeleteBookingModal(false);
        setRowIndexToDelete(null);
    }

    const handleEditBookingModalInitialization = async (rowIndex) => {
        setShowEditBookingModal(true);
        //['Booking ID', 'Booking Created', 'Booking Date', 'Booking Time', 'Booking Status', 'Booking Notes', 'Booking Username', 'Booking Password', 'Student IDs', 'Student Names', 'School Divisions', 'Grades', 'Students Created', 'Parent Names', 'Parent Emails', 'Parent Phones', 'CD Count', 'Additional Attendees', 'Booking Extras Status']
        const bookingUsername = allBookings[rowIndex][6];
        const studentIds = allBookings[rowIndex][8];
        const studentNames = allBookings[rowIndex][9];
        const studentSchoolDivisions = allBookings[rowIndex][10];
        const studentGrades = allBookings[rowIndex][11];
        const parentNames = allBookings[rowIndex][13];
        const parentEmails = allBookings[rowIndex][14];
        const parentPhones = allBookings[rowIndex][15];
        const cdCount = allBookings[rowIndex][16];
        const additionalAttendees = allBookings[rowIndex][17];
        const bookingExtrasStatus = allBookings[rowIndex][18];

        const studentNamesArray = studentNames.split(', ');
        const studentSchoolDivisionsArray = studentSchoolDivisions.split(', ');
        const studentGradesArray = studentGrades.split(', ');

        const parentNamesArray = parentNames.split(', ');
        const parentEmailsArray = parentEmails.split(', ');
        const parentPhonesArray = parentPhones.split(', ');
        const studentIdsArray = studentIds.split(', ');

        const editBookingModalCoreFields = addBookingModalCoreFormFields.map((field) => {
            if (field.id === bookingUsernameFieldId) {
                field.defaultValue = bookingUsername;
            } else if (field.id === cdCountFieldId) {
                field.defaultValue = cdCount;
            } else if (field.id === additionalAttendeesFieldId) {
                field.defaultValue = additionalAttendees;
            } else if (field.id === extrasPaymentStatusFieldId) {
                field.defaultValue = bookingExtrasStatus;
            } else if (field.id === firstParentNameFieldId) {
                field.defaultValue = parentNamesArray[0];
            } else if (field.id === firstParentEmailFieldId) {
                field.defaultValue = parentEmailsArray[0];
            } else if (field.id === firstParentPhoneNumberFieldId) {
                field.defaultValue = parentPhonesArray[0];
            } else if (field.id === secondParentNameFieldId) {
                if (parentNamesArray[1]) {
                    field.defaultValue = parentNamesArray[1];
                }
            } else if (field.id === secondParentEmailFieldId) {
                if (parentEmailsArray[1]) {
                    field.defaultValue = parentEmailsArray[1];
                }
            } else if (field.id === secondParentPhoneNumberFieldId) {
                if (parentPhonesArray[1]) {
                    field.defaultValue = parentPhonesArray[1];
                }
            } else if (field.id === bookingPasswordFieldId || field.id === confirmBookingPasswordFieldId) {
                field.required = false;
            }

            return field;
        });

        setEditBookingModalPreFilledCoreFields(editBookingModalCoreFields);

        const editBookingModalStudentSectionFields = studentSectionFields.map((field) => {
            if (field.name === 'student-section') {
                field.defaultValue = studentIds;
            } else if (field.name === 'student-name') {
                field.defaultValue = studentNames;
            } else if (field.name === 'student-school-division') {
                field.defaultValue = studentSchoolDivisions;
            } else if (field.name === 'student-grade') {
                field.defaultValue = studentGrades;
            }
            return field;
        })

        const editBookingModalStudentSectionInstances = [];
        for (let i = 0; i < studentIdsArray.length; i++) {
            const editBookingModalStudentSectionInstance = editBookingModalStudentSectionFields.map((field) => {
                if (field.name === 'student-section') {
                    field.defaultValue = studentIdsArray[i];
                } else if (field.name === 'student-name') {
                    field.defaultValue = studentNamesArray[i];
                } else if (field.name === 'student-school-division') {
                    field.defaultValue = studentSchoolDivisionsArray[i];
                } else if (field.name === 'student-grade') {
                    field.defaultValue = studentGradesArray[i];
                }
                return field;
            })
            editBookingModalStudentSectionInstances.push(editBookingModalStudentSectionInstance);
        }

        setEditBookingModalPreFilledExistingSections(editBookingModalStudentSectionInstances);
    }

    const handleEditBooking = async (formData) => {

    }

    const handleCancelEditBookingModal = () => {
        setShowEditBookingModal(false);
        setEditBookingModalPreFilledCoreFields(null);
        setEditBookingModalPreFilledExistingSections(null);
    }

    const fetchBookings = async () => {
        try {
            setIsLoading(true);

            const response = await axios.get(`/scripts/getAllBookings.php`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            });

            if (response.data.success) {
                setAllBookings(response.data.data);
            } else {
                setAllBookings(null);
            }

        } catch (error) {

            if (error.response && error.response.data && error.response.data.message && error.response.data.code) {
                console.log(error.response.data.message);

                if (error.response.data.code === 401 || error.response.data.code === 403) {
                    navigate('/admin/login');
                }

            } else {
                console.log(error.message);

                if (error.status === 401 || error.status === 403 || error.code === 401 || error.code === 403) {
                    navigate('/admin/login');
                }
            }

        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
       checkAdminSession(navigate, setIsLoading, 1).then(
           () => {
               fetchBookings();
           }
       )
    }, []);

    useEffect(() => {
        if (showAddBookingModal || showDeleteBookingModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [showAddBookingModal, showDeleteBookingModal]);

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
                           'Booking Status',
                           'Booking Password',
                           'Student Created',
                           'Booking Created',
                           'Booking Date',
                           'Booking Time',
                           'Booking Notes',
                           'Students Created',

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
                       allowEditEntryOption={true}
                       onEditEntryOption={(rowIndex) => {
                            handleEditBookingModalInitialization(rowIndex);
                       }}
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
                              pedanticIds={true}
                              formHasPasswordField={true}
                              footerButtonsSpaceBetween={true}
                              switchFooterButtonsOrder={true}

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
                            <p>
                                Are you sure you want to delete this booking ID{' '}
                                {allBookings && rowIndexToDelete !== null ? (
                                    <strong>{allBookings[rowIndexToDelete][colIndexForBookingId]}</strong>
                                ) : (
                                    <strong>this booking ID</strong>
                                )}, all the student(s), parent(s), authentication credentials data will be deleted.
                            </p>
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

            <animated.div style={animateEditBookingModal} className={"edit-booking-modal"}>
                <div className={"edit-booking-modal-overlay"} onClick={() => {
                    handleCancelEditBookingModal();
                }}/>

                <div className={"edit-booking-modal-container"}>
                    <div className={"edit-booking-modal-header"}>
                        <h3>
                            Edit Booking
                        </h3>
                    </div>

                    <div className={"edit-booking-modal-content"}>
                        {editBookingModalPreFilledCoreFields && editBookingModalPreFilledExistingSections && (
                            <Form fields={editBookingModalPreFilledCoreFields}
                                  mailTo={''}
                                  sendPdf={false}
                                  formTitle={"Edit Booking Modal Form"}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleEditBooking}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={[
                                      "Save", "Saving...", "تعديل", "جاري التعديل..."
                                  ]}
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
                                          existingFilledSectionInstances: editBookingModalPreFilledExistingSections,
                                      }
                                  ]}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={setShowEditBookingModal}
                                  pedanticIds={false}
                                  formHasPasswordField={true}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  resetFormFromParent={resetEditBookingModal}
                                  setResetForFromParent={setResetEditBookingModal}
                            />
                        )}
                    </div>

                    <div className={"edit-booking-modal-footer"}>
                        <button className={"edit-booking-modal-cancel-button"} onClick={() => {
                            handleCancelEditBookingModal();
                        }}>
                            Cancel
                        </button>
                    </div>
                </div>

            </animated.div>
        </>
    );
}

export default BookingManagement;

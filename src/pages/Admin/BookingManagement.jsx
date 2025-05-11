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


    const animateAddBookingModal = useSpring({
        opacity: showAddBookingModal ? 1 : 0,
        transform: showAddBookingModal ? 'translateY(0)' : 'translateY(-100%)'
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
            dontLetTheBrowserSaveField: true,
            labelOutside: true,
            labelOnTop: true,
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
            dontLetTheBrowserSaveField: true,
            labelOutside: true,
            labelOnTop: true,
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
            dontLetTheBrowserSaveField: true,
            labelOutside: true,
            labelOnTop: true,
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
                // Refresh the bookings list
                // You might need to implement a function to fetch bookings
                // fetchBookings();
            } else {
                throw new Error('Error: ' + result.message);
            }
        } catch (error) {
            throw new Error("Error adding booking: ", error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        // checkAdminSession(navigate, setIsLoading, 1);
    }, []);

    useEffect(() => {
        setAllBookings(null);
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
                       []}
                       allowExport={true}
                       exportFileName={'bookings'}
                       sortConfigParam={{column: 0, direction: 'descending'}}
                       filterableColumns={
                       []}
                       headerModuleElements={[(
                           <button key={1} onClick={() => {
                                setShowAddBookingModal(true);
                           }}>
                               Add Booking
                           </button>
                       )]}
                       onDeleteEntry={(rowIndex) => {
                           console.log(rowIndex);
                       }}
                       allowDeleteEntryOption={true}
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
        </>
    );
}

export default BookingManagement;

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
    const [allBookings, setAllBookings] = useState([
        ["1", "2", "3", "4", "5"],
        ["6", "7", "8", "9", "10"],
    ]);

    const [resetAddBookingModal, setResetAddBookingModal] = useState(false);
    const [showAddBookingModal, setShowAddBookingModal] = useState(false);

    const animateAddBookingModal = useSpring({
        opacity: showAddBookingModal ? 1 : 0,
        transform: showAddBookingModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const addBookingModalCoreFormFields = [
        {
            id: 1,
            type: 'text',
            name: 'booking-username',
            label: 'Booking Username',
            required: true,
            placeholder: 'Booking Username',
            errorMsg: 'Please enter the booking username',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'booking-username'
        },
        {
            id: 2,
            type: 'password',
            name: 'booking-password',
            label: 'Booking Password',
            required: true,
            placeholder: 'Booking Password',
            errorMsg: 'Please enter the booking password',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'booking-password'
        },
        {
            id: 3,
            type: 'password',
            name: 'confirm-booking-password',
            label: 'Confirm Booking Password',
            required: true,
            placeholder: 'Confirm Booking Password',
            errorMsg: 'Please enter the booking password',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'confirm-booking-password'
        },
        {
            id: 4,
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
        },
        {
            id: 5,
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
        },
        {
            id: 6,
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
        },
        {
            id: 7,
            type: 'text',
            name: 'second-parent-name',
            label: 'Second Parent Name',
            required: true,
            placeholder: 'Second Parent Name',
            errorMsg: 'Please enter the second parent name',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'second-parent-name',
        },
        {
            id: 8,
            type: 'email',
            name: 'second-parent-email',
            label: 'Second Parent Email',
            required: true,
            placeholder: 'Second Parent Email',
            errorMsg: 'Please enter the second parent email',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'second-parent-email',
        },
        {
            id: 9,
            type: 'tel',
            name: 'second-parent-phone-number',
            label: 'Second Parent Phone Number',
            required: true,
            placeholder: 'Second Parent Phone Number',
            errorMsg: 'Please enter the second parent phone number',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'second-parent-phone-number',
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
        },
    ]


    const cancelAddBookingModal = () => {
        setShowAddBookingModal(false);
        setResetAddBookingModal(true);
    }

    useEffect(() => {
        // checkAdminSession(navigate, setIsLoading, 1);
    }, []);

    useEffect(() => {
       // setAllBookings(null);
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"booking-management-page"}>
                {(
                    ( (allBookings && Array.isArray(allBookings) && allBookings.length > 0)   ) ? (

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

                    ) : (
                        isLoading ? <h1>Loading...</h1> : <h1>No bookings found.</h1>
                    )
                )}
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
                              mailTo={"sonichki@gmail.com"}
                              sendPdf={false}
                              formTitle={"Add Booking Modal Form"}
                              lang={"en"}
                              captchaLength={1}
                              noInputFieldsCache={true}
                              noCaptcha={true}
                              resetFormFromParent={resetAddBookingModal}
                              setResetForFromParent={setResetAddBookingModal}
                              sectionsToAdd={[

                              {
                                  addButtonText: "Add Student",
                                  removeButtonText: "Remove Student",
                                  startAddingFieldsFromId: 5,
                                  fieldsToAdd: studentSectionFields,
                                  maxSectionInstancesToAdd: 5,
                                  sectionId: "new-student-section"
                              }

                              ]}
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

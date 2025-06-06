import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {
    headToAdminLoginOnInvalidSession,
    fetchBookingsRequest,
    handleAddBookingRequest,
    handleDeleteBookingRequest,
    msgTimeout,
    handleEditBookingRequest
} from "../../services/Utils.jsx";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import '../../styles/AdminDashboard.css';

function BookingManagement() {
    const navigate = useNavigate();
    const maxNumberOfStudents = 5;
    const [isLoading, setIsLoading] = useState(false);
    const [allBookings, setAllBookings] = useState(null);
    const [resetAddBookingModal, setResetAddBookingModal] = useState(false);
    const [showAddBookingModal, setShowAddBookingModal] = useState(false);
    const [showDeleteBookingModal, setShowDeleteBookingModal] = useState(false);
    const [rowIndexToDelete, setRowIndexToDelete] = useState(null);
    const [rowIndexToEdit, setRowIndexToEdit] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [showEditBookingModal, setShowEditBookingModal] = useState(false);
    const [editBookingModalPreFilledCoreFields, setEditBookingModalPreFilledCoreFields] = useState(null);
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
    const cdCountFieldId = 10;
    const additionalAttendeesFieldId = 11;
    const extrasPaymentStatusFieldId = 12;
    const firstStudentSectionTitleId = 13;
    const firstStudentNameId = 14;
    const firstStudentSchoolDivisionId = 15;
    const firstStudentGradeId = 16;
    const secondStudentSectionTitleId = 17;
    const secondStudentNameId = 18;
    const secondStudentSchoolDivisionId = 19;
    const secondStudentGradeId = 20;
    const thirdStudentSectionTitleId = 21;
    const thirdStudentNameId = 22;
    const thirdStudentSchoolDivisionId = 23;
    const thirdStudentGradeId = 24;
    const fourthStudentSectionTitleId = 25;
    const fourthStudentNameId = 26;
    const fourthStudentSchoolDivisionId = 27;
    const fourthStudentGradeId = 28;
    const fifthStudentSectionTitleId = 29;
    const fifthStudentNameId = 30;
    const fifthStudentSchoolDivisionId = 31;
    const fifthStudentGradeId = 32;
    
    const colIndexForBookingId = 0;
    const colIndexForBookingUsername = 6;
    const colIndexForStudentIds = 8;
    const colIndexForStudentNames = 9;
    const colIndexForStudentSchoolDivisions = 10;
    const colIndexForStudentGrades = 11;
    const colIndexForParentNames = 14;
    const colIndexForParentEmails = 15;
    const colIndexForParentPhones = 16;
    const colIndexForCdCount = 17;
    const colIndexForAdditionalAttendees = 18;
    const colIndexForBookingExtrasStatus = 19;

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
            // mustNotMatchFieldWithId: firstParentEmailFieldId,
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
            // mustNotMatchFieldWithId: firstParentPhoneNumberFieldId,
            labelOutside: true,
            labelOnTop: true,
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
            minimumValue: '0',
            maximumValue: '10',
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
            minimumValue: '0',
            maximumValue: '10',
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
        {
            id: firstStudentSectionTitleId,
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
            id: firstStudentNameId,
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
            id: firstStudentSchoolDivisionId,
            type: 'select',
            name: 'student-school-division',
            label: 'Student School Division',
            choices: ['International', 'National', 'Kindergarten'],
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
            id: firstStudentGradeId,
            type: 'select',
            name: 'student-grade',
            label: 'Student Grade',
            choices: ['Pre Play', 'PlaySchool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
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
        {
            id: secondStudentSectionTitleId,
            type: 'section',
            name: 'student-section',
            label: 'New Student',
            required: false,
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
            id: secondStudentNameId,
            type: 'text',
            name: 'student-name',
            label: 'Student Name',
            required: false,
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
            id: secondStudentSchoolDivisionId,
            type: 'select',
            name: 'student-school-division',
            label: 'Student School Division',
            choices: ['International', 'National', 'Kindergarten'],
            required: false,
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
            id: secondStudentGradeId,
            type: 'select',
            name: 'student-grade',
            label: 'Student Grade',
            choices: ['Pre Play', 'PlaySchool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
            required: false,
            placeholder: 'Student Grade',
            errorMsg: 'Please enter the student grade',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-grade',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: thirdStudentSectionTitleId,
            type: 'section',
            name: 'student-section',
            label: 'New Student',
            required: false,
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
            id: thirdStudentNameId,
            type: 'text',
            name: 'student-name',
            label: 'Student Name',
            required: false,
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
            id: thirdStudentSchoolDivisionId,
            type: 'select',
            name: 'student-school-division',
            label: 'Student School Division',
            choices: ['International', 'National', 'Kindergarten'],
            required: false,
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
            id: thirdStudentGradeId,
            type: 'select',
            name: 'student-grade',
            label: 'Student Grade',
            choices: ['Pre Play', 'PlaySchool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
            required: false,
            placeholder: 'Student Grade',
            errorMsg: 'Please enter the student grade',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-grade',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: fourthStudentSectionTitleId,
            type: 'section',
            name: 'student-section',
            label: 'New Student',
            required: false,
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
            id: fourthStudentNameId,
            type: 'text',
            name: 'student-name',
            label: 'Student Name',
            required: false,
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
            id: fourthStudentSchoolDivisionId,
            type: 'select',
            name: 'student-school-division',
            label: 'Student School Division',
            choices: ['International', 'National', 'Kindergarten'],
            required: false,
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
            id: fourthStudentGradeId,
            type: 'select',
            name: 'student-grade',
            label: 'Student Grade',
            choices: ['Pre Play', 'PlaySchool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
            required: false,
            placeholder: 'Student Grade',
            errorMsg: 'Please enter the student grade',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-grade',
            labelOutside: true,
            labelOnTop: true,
        },
        {
            id: fifthStudentSectionTitleId,
            type: 'section',
            name: 'student-section',
            label: 'New Student',
            required: false,
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
            id: fifthStudentNameId,
            type: 'text',
            name: 'student-name',
            label: 'Student Name',
            required: false,
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
            id: fifthStudentSchoolDivisionId,
            type: 'select',
            name: 'student-school-division',
            label: 'Student School Division',
            choices: ['International', 'National', 'Kindergarten'],
            required: false,
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
            id: fifthStudentGradeId,
            type: 'select',
            name: 'student-grade',
            label: 'Student Grade',
            choices: ['Pre Play', 'PlaySchool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
            required: false,
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
        setIsLoading(true);

        try {
            const result = await handleAddBookingRequest(formData);

            if (result.success) {
                setResetAddBookingModal(true)
                setShowAddBookingModal(false);
                fetchBookings();
                return true;
            } else {
                throw new Error(result || 'An error occurred while adding the booking.');
            }

        } catch (error) {
            throw new Error(error.message || 'An error occurred while adding the booking.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleDeleteBooking = async () => {
        if (rowIndexToDelete === null) {
            setDeleteError('Please select a booking to delete.');
            return;
        }

        setIsLoading(true);
        setIsDeleting(true);
        const bookingId = allBookings[rowIndexToDelete][colIndexForBookingId];

        try {
            const response = await handleDeleteBookingRequest(bookingId);

            if (response.success) {
                setShowDeleteBookingModal(false);
                setDeleteError(null);
                setRowIndexToDelete(null);
                setShowDeleteBookingModal(false);
                fetchBookings();
            } else {
                setDeleteError(response || 'An error occurred while deleting the booking.');
                setTimeout(() => {setDeleteError(null);}, msgTimeout);
            }
        } catch(error) {
            setDeleteError(error.message || 'An error occurred while deleting the booking.');
            setTimeout(() => {setDeleteError(null);}, msgTimeout);
        } finally {
            setIsDeleting(false);
            setIsLoading(false);
        }
    };

    const handleCancelDeleteBookingModal = () => {
        setShowDeleteBookingModal(false);
        setRowIndexToDelete(null);
    }

    const handleEditBookingModalInitialization = (rowIndex) => {
        setRowIndexToEdit(rowIndex);
        
        const bookingUsername = allBookings[rowIndex][colIndexForBookingUsername];
        const studentIds = allBookings[rowIndex][colIndexForStudentIds];
        const studentNames = allBookings[rowIndex][colIndexForStudentNames];
        const studentSchoolDivisions = allBookings[rowIndex][colIndexForStudentSchoolDivisions];
        const studentGrades = allBookings[rowIndex][colIndexForStudentGrades];
        const parentNames = allBookings[rowIndex][colIndexForParentNames];
        const parentEmails = allBookings[rowIndex][colIndexForParentEmails];
        const parentPhones = allBookings[rowIndex][colIndexForParentPhones];
        const cdCount = allBookings[rowIndex][colIndexForCdCount];
        const additionalAttendees = allBookings[rowIndex][colIndexForAdditionalAttendees];
        const bookingExtrasStatus = allBookings[rowIndex][colIndexForBookingExtrasStatus];
        const studentNamesArray = studentNames.split(', ');
        const studentSchoolDivisionsArray = studentSchoolDivisions.split(', ');
        const studentGradesArray = studentGrades.split(', ');
        const parentNamesArray = parentNames.split(', ');
        const parentEmailsArray = parentEmails.split(', ');
        const parentPhonesArray = parentPhones.split(', ');
        const studentIdsArray = studentIds.split(', ');

        const editBookingModalCoreFields = addBookingModalCoreFormFields.map((field) => {
            if (field.id === bookingUsernameFieldId) {
                field.value = bookingUsername;
                field.widthOfField = 1;
            } else if (field.id === cdCountFieldId) {
                field.value = cdCount;
            } else if (field.id === additionalAttendeesFieldId) {
                field.value = additionalAttendees;
            } else if (field.id === extrasPaymentStatusFieldId) {
                field.value = bookingExtrasStatus;
            } else if (field.id === firstParentNameFieldId) {
                field.value = parentNamesArray[0];
            } else if (field.id === firstParentEmailFieldId) {
                field.value = parentEmailsArray[0];
            } else if (field.id === firstParentPhoneNumberFieldId) {
                field.value = parentPhonesArray[0];
            } else if (field.id === secondParentNameFieldId) {
                if (parentNamesArray[1]) {
                    field.value = parentNamesArray[1];
                }
            } else if (field.id === secondParentEmailFieldId) {
                if (parentEmailsArray[1]) {
                    field.value = parentEmailsArray[1];
                }
            } else if (field.id === secondParentPhoneNumberFieldId) {
                if (parentPhonesArray[1]) {
                    field.value = parentPhonesArray[1];
                }
            } else if (field.id === bookingPasswordFieldId || field.id === confirmBookingPasswordFieldId) {
                field.required = false;
                field.value = '';
                field.widthOfField = 2 ;
                
                if (field.id === bookingPasswordFieldId) {
                    field.label = '(Leave it empty if you do not want to change it)';
                } else if (field.id === confirmBookingPasswordFieldId) {
                    field.label = '(Leave it empty if you do not want to change it)';
                }
            }

            return field;
        });

        for (let i = 0; i < studentIdsArray.length && i < maxNumberOfStudents; i++) {
            const studentFieldIds = [
                { nameId: firstStudentNameId, divisionId: firstStudentSchoolDivisionId, gradeId: firstStudentGradeId },
                { nameId: secondStudentNameId, divisionId: secondStudentSchoolDivisionId, gradeId: secondStudentGradeId },
                { nameId: thirdStudentNameId, divisionId: thirdStudentSchoolDivisionId, gradeId: thirdStudentGradeId },
                { nameId: fourthStudentNameId, divisionId: fourthStudentSchoolDivisionId, gradeId: fourthStudentGradeId },
                { nameId: fifthStudentNameId, divisionId: fifthStudentSchoolDivisionId, gradeId: fifthStudentGradeId }
            ];
            
            const currentStudentFields = studentFieldIds[i];
            
            editBookingModalCoreFields.forEach(field => {
                if (field.id === currentStudentFields.nameId) {
                    field.value = studentNamesArray[i] || '';
                } else if (field.id === currentStudentFields.divisionId) {
                    field.value = studentSchoolDivisionsArray[i] || '';
                } else if (field.id === currentStudentFields.gradeId) {
                    field.value = studentGradesArray[i] || '';
                }
            });
        }
        
        setEditBookingModalPreFilledCoreFields(editBookingModalCoreFields);
        setShowEditBookingModal(true);
    }

    const handleEditBooking = async (formData) => {
        setIsLoading(true);

        try {
            const bookingId = allBookings[rowIndexToEdit][colIndexForBookingId];
            const result = await handleEditBookingRequest(formData, bookingId);

            if (result.success) {
                setResetEditBookingModal(true);
                setShowEditBookingModal(false);
                setAllBookings(null);
                setResetAddBookingModal(true);
                setShowAddBookingModal(false);
                setRowIndexToEdit(null);
                setEditBookingModalPreFilledCoreFields(null);
                fetchBookings();
                return true;
            } else {
                throw new Error(result || 'An error occurred while editing the booking.');
            }

        } catch (error) {
            throw new Error(error.message || 'An error occurred while editing the booking.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEditBookingModal = () => {
        setShowEditBookingModal(false);
        setEditBookingModalPreFilledCoreFields(null);
    }

    const fetchBookings = async () => {
        setIsLoading(true);

        try {
            await fetchBookingsRequest(navigate, setAllBookings);
        } catch (error) {
            console.log(error.message || 'An error occurred while fetching the bookings.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, 1, setIsLoading)
        .then(
            () => {
                fetchBookings();
            }
        )
    }, []);

    useEffect(() => {
        if (showAddBookingModal || showDeleteBookingModal || showEditBookingModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [showAddBookingModal, showDeleteBookingModal, showEditBookingModal]);

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
                           'Student IDs',
                           'Total CD Cost',
                           'Total Additional Attendee(s) Cost',
                           'Parent Emails',
                           'Student Count'
                       ]}
                       allowExport={true}
                       exportFileName={'bookings'}
                       sortConfigParam={{column: 0, direction: 'descending'}}
                       filterableColumns={
                       [
                           'School Divisions',
                           'Grades',
                           'Booking Extras Status',
                           'Booking Username',
                           'Student Names',
                           'Parent Names',
                           'Parent Emails',
                           'Parent Phones',
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
                       columnsToWrap={[]}
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
                                {(allBookings && rowIndexToDelete !== null && allBookings[rowIndexToDelete]) ? (
                                    <strong>{allBookings[rowIndexToDelete][colIndexForBookingId]}</strong>
                                ) : (
                                    <strong>this booking ID</strong>
                                )}, all the student(s), parent(s), authentication credentials data will be deleted.
                            </p>

                        {deleteError && (
                            <>
                                <br/>
                                <p className={"delete-booking-modal-error"}>{deleteError}</p>
                            </>
                        )}
                    </div>

                    <div className={"delete-booking-modal-footer"}>



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
                        {editBookingModalPreFilledCoreFields && (
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
                                  formInModalPopup={true}
                                  setShowFormModalPopup={setShowEditBookingModal}
                                  pedanticIds={false}
                                  formHasPasswordField={true}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  resetFormFromParent={resetEditBookingModal}
                                  setResetForFromParent={setResetEditBookingModal}
                                  thisFormIsEditingAnEntry={true}
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


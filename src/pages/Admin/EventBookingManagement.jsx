import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router";
import {useEffect, useState, useRef, useMemo} from "react";
import {msgTimeout, EventBookingManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";
import Table from "../../modules/Table.jsx";
import {fetchImportDescriptor, importCsvFile} from "../../services/Admin/Imports/AdminImportServices.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx'
import debounce from "lodash.debounce";
import {
    fetchEventBookingsRequest,
    handleAddEventBookingRequest,
    handleDeleteEventBookingRequest,
    handleDeleteEventBookingsRequest,
    handleEditEventBookingRequest,
    fetchEventMetaDetailsRequest,
    handleUpdateEventMetaDetailsRequest
} from "../../services/Admin/EventBookings/AdminEventBookingManagementServices.jsx";
import {searchPlaces} from "../../services/General/GooglePlacesService.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'

function EventBookingManagement() {
    const navigate = useNavigate();
    const maxNumberOfStudents = 5;
    const [isLoading, setIsLoading] = useLoading(false);
    const [allBookings, setAllBookings] = useState(null);
    const [importDescriptor, setImportDescriptor] = useState(null);
    const [resetAddBookingModal, setResetAddBookingModal] = useState(false);
    const [showAddBookingModal, setShowAddBookingModal] = useState(false);
    const [showDeleteBookingModal, setShowDeleteBookingModal] = useState(false);
    const [showDeleteBookingsModal, setShowDeleteBookingsModal] = useState(false);
    const [deleteBookingsScope, setDeleteBookingsScope] = useState('');
    const [isDeletingBookings, setIsDeletingBookings] = useState(false);
    const [deleteBookingsError, setDeleteBookingsError] = useState(null);
    const [rowIndexToDelete, setRowIndexToDelete] = useState(null);
    const [rowIndexToEdit, setRowIndexToEdit] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [showEditBookingModal, setShowEditBookingModal] = useState(false);
    const [editBookingModalPreFilledCoreFields, setEditBookingModalPreFilledCoreFields] = useState(null);
    const [editBookingModalDynamicSections, setEditBookingModalDynamicSections] = useState(null);
    const [resetEditBookingModal, setResetEditBookingModal] = useState(false);
    const addBookingModalFooterButtonsRef = useRef(null);
    const editBookingModalFooterButtonsRef = useRef(null);
    const [showUpdateVenueModal, setShowUpdateVenueModal] = useState(false);
    const [ceremonyDetails, setCeremonyDetails] = useState(null);
    const [ceremonyLocationChoices, setCeremonyLocationChoices] = useState([]);
    const updateVenueModalFooterButtonsRef = useRef(null);
    const ceremonyPlacesByLabel = useRef({});

    const ceremonyDateFieldId = 1;
    const ceremonyLocationFieldId = 2;
    const ceremonyHourFieldId = 3;
    const ceremonyMinuteFieldId = 4;
    const ceremonyMeridiemFieldId = 5;
    const ceremonyTimeZoneFieldId = 6;
    const ceremonyLocationSearchDelay = 100;
    const fallbackTimeZone = 'Africa/Cairo';

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
    const studentsDynamicSectionId = 100;
    const studentNameTemplateFieldId = 14;
    const studentSchoolDivisionTemplateFieldId = 15;
    const studentGradeTemplateFieldId = 16;
    const minNumberOfStudents = 1;

    const deleteAllBookingsChoice = 'All bookings';
    const schoolDivisions = ['International', 'National', 'Kindergarten', 'American', 'British'];

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

    const animateDeleteBookingsModal = useSpring({
        opacity: showDeleteBookingsModal ? 1 : 0,
        transform: showDeleteBookingsModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateEditBookingModal = useSpring({
        opacity: showEditBookingModal ? 1 : 0,
        transform: showEditBookingModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateUpdateVenueModal = useSpring({
        opacity: showUpdateVenueModal ? 1 : 0,
        transform: showUpdateVenueModal ? 'translateY(0)' : 'translateY(-100%)'
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
            displayLabel: 'Booking Username'
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
            alwaysEnglish: true,
            displayLabel: 'Booking Password'
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
            alwaysEnglish: true,
            displayLabel: 'Confirm Booking Password'
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
            displayLabel: 'First Parent Name'
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
            displayLabel: 'First Parent Email'
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
            displayLabel: 'First Parent Phone Number'
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
            displayLabel: 'Second Parent Name'
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
            displayLabel: 'Second Parent Email'
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
            displayLabel: 'Second Parent Phone Number'
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
            alwaysEnglish: true,
            displayLabel: 'CD Count'
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
            alwaysEnglish: true,
            displayLabel: 'Additional Attendees'
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
            alwaysEnglish: true,
            displayLabel: 'Extras Payment Status'
        },
    ]

    const studentSectionTemplateFields = [
        {
            id: studentNameTemplateFieldId,
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
            displayLabel: 'Student Name'
        },
        {
            id: studentSchoolDivisionTemplateFieldId,
            type: 'select',
            name: 'student-school-division',
            label: 'Student School Division',
            choices: ['International', 'National', 'Kindergarten', 'American', 'British'],
            required: true,
            placeholder: 'Student School Division',
            errorMsg: 'Please enter the student school division',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-school-division',
            labelOutside: true,
            labelOnTop: true,
            alwaysEnglish: true,
            displayLabel: 'Student School Division'
        },
        {
            id: studentGradeTemplateFieldId,
            type: 'select',
            name: 'student-grade',
            label: 'Student Grade',
            choices: ['Pre Play', 'Playschool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
            required: true,
            placeholder: 'Student Grade',
            errorMsg: 'Please enter the student grade',
            value: '',
            setValue: null,
            widthOfField: 3,
            httpName: 'student-grade',
            labelOutside: true,
            labelOnTop: true,
            alwaysEnglish: true,
            displayLabel: 'Student Grade'
        },
    ]

    const buildStudentsDynamicSection = (instances) => ({
        sectionId: studentsDynamicSectionId,
        title: 'Student',
        addButtonLabel: 'Add Student',
        removeButtonLabel: 'Remove Student',
        insertAfterFieldId: extrasPaymentStatusFieldId,
        minInstances: minNumberOfStudents,
        maxInstances: maxNumberOfStudents,
        fields: studentSectionTemplateFields,
        instances: instances || [],
    });

    const cancelAddBookingModal = () => {
        setShowAddBookingModal(false);
        setResetAddBookingModal(true);
    };

    const handleAddBooking = async (formData) => {
        setIsLoading(true);

        try {
            const result = await handleAddEventBookingRequest(formData);

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
            const response = await handleDeleteEventBookingRequest(bookingId);

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

    const bookingsMatchingDeleteScope = useMemo(() => {
        if (!allBookings || allBookings.length <= 1) {
            return 0;
        }

        const rows = allBookings.slice(1);

        if (deleteBookingsScope === deleteAllBookingsChoice) {
            return rows.length;
        }

        return rows.filter((row) => {
            const divisions = String(row[colIndexForStudentSchoolDivisions] || '')
                .split(',')
                .map((division) => division.trim())
                .filter(Boolean);

            return divisions.length > 0 && divisions.every((division) => division === deleteBookingsScope);
        }).length;
    }, [allBookings, deleteBookingsScope]);

    const openDeleteBookingsModal = () => {
        setDeleteBookingsScope(deleteAllBookingsChoice);
        setDeleteBookingsError(null);
        setShowDeleteBookingsModal(true);
    };

    const handleCancelDeleteBookingsModal = () => {
        setShowDeleteBookingsModal(false);
        setDeleteBookingsError(null);
    };

    const handleDeleteBookings = async () => {
        setIsLoading(true);
        setIsDeletingBookings(true);

        try {
            const isAll = deleteBookingsScope === deleteAllBookingsChoice;
            const response = await handleDeleteEventBookingsRequest(isAll ? 'all' : 'division', isAll ? '' : deleteBookingsScope);

            if (response.success) {
                setShowDeleteBookingsModal(false);
                setDeleteBookingsError(null);
                fetchBookings();
            } else {
                setDeleteBookingsError(response || 'An error occurred while deleting the bookings.');
                setTimeout(() => {setDeleteBookingsError(null);}, msgTimeout);
            }
        } catch (error) {
            setDeleteBookingsError(error.message || 'An error occurred while deleting the bookings.');
            setTimeout(() => {setDeleteBookingsError(null);}, msgTimeout);
        } finally {
            setIsDeletingBookings(false);
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

        const editBookingModalCoreFields = addBookingModalCoreFormFields.map((coreField) => {
            const field = {...coreField};

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

        const editStudentInstances = [];

        for (let i = 0; i < studentIdsArray.length && i < maxNumberOfStudents; i++) {
            editStudentInstances.push({
                [studentNameTemplateFieldId]: studentNamesArray[i] || '',
                [studentSchoolDivisionTemplateFieldId]: studentSchoolDivisionsArray[i] || '',
                [studentGradeTemplateFieldId]: studentGradesArray[i] || '',
            });
        }

        setEditBookingModalDynamicSections([buildStudentsDynamicSection(editStudentInstances)]);
        setEditBookingModalPreFilledCoreFields(editBookingModalCoreFields);
        setShowEditBookingModal(true);
    }

    const handleEditBooking = async (formData) => {
        setIsLoading(true);

        try {
            const bookingId = allBookings[rowIndexToEdit][colIndexForBookingId];
            const result = await handleEditEventBookingRequest(formData, bookingId);

            if (result.success) {
                setResetEditBookingModal(true);
                setShowEditBookingModal(false);
                setAllBookings(null);
                setResetAddBookingModal(true);
                setShowAddBookingModal(false);
                setRowIndexToEdit(null);
                setEditBookingModalPreFilledCoreFields(null);
                setEditBookingModalDynamicSections(null);
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
        setEditBookingModalDynamicSections(null);
    }

    const buildPaddedChoices = (count, startAt) =>
        Array.from({length: count}, (unused, index) => String(index + startAt).padStart(2, '0'));

    const getDeviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimeZone;

    const availableTimeZones = useMemo(() => (
        typeof Intl.supportedValuesOf === 'function'
            ? Intl.supportedValuesOf('timeZone')
            : [getDeviceTimeZone(), fallbackTimeZone]
    ), []);

    const buildCeremonyLocationLabel = (details) =>
        details ? [details.locationName, details.locationAddress].filter(Boolean).join(' — ') : '';

    const splitCeremonyTime = (ceremonyTime) => {
        const parts = String(ceremonyTime || '').split(':');
        const hourOfDay = Number(parts[0]);
        let splitTime = {hour: '', minute: '', meridiem: ''};

        if (parts.length >= 2 && !Number.isNaN(hourOfDay)) {
            splitTime = {
                hour: String(hourOfDay % 12 === 0 ? 12 : hourOfDay % 12).padStart(2, '0'),
                minute: String(Number(parts[1])).padStart(2, '0'),
                meridiem: hourOfDay >= 12 ? 'PM' : 'AM',
            };
        }

        return splitTime;
    };

    const searchCeremonyLocations = useMemo(() => debounce(async (query) => {
        const places = await searchPlaces(query);

        places.forEach((place) => {
            ceremonyPlacesByLabel.current[place.label] = place;
        });

        setCeremonyLocationChoices(places.map((place) => place.label));
    }, ceremonyLocationSearchDelay), []);

    const savedCeremonyLocationLabel = buildCeremonyLocationLabel(ceremonyDetails);
    const savedCeremonyTime = splitCeremonyTime(ceremonyDetails ? ceremonyDetails.ceremonyTime : '');

    const updateVenueModalFormFields = [
        {
            id: ceremonyDateFieldId,
            type: 'date',
            minYear: new Date().getFullYear() - 2,
            maxYear: new Date().getFullYear() + 2,
            name: 'ceremony-date',
            label: 'Ceremony Date',
            displayLabel: 'Ceremony Date',
            required: true,
            errorMsg: 'Please choose the ceremony date',
            defaultValue: (ceremonyDetails && ceremonyDetails.ceremonyDate) || '',
            setValue: null,
            widthOfField: 1,
            httpName: 'ceremony-date',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            alwaysEnglish: true,
        },
        {
            id: ceremonyLocationFieldId,
            type: 'search-select',
            name: 'ceremony-location',
            label: 'Ceremony Location',
            displayLabel: 'Ceremony Location',
            placeholder: 'Search for a place',
            required: true,
            errorMsg: 'Please search for and choose the ceremony location',
            defaultValue: savedCeremonyLocationLabel,
            setValue: null,
            widthOfField: 1,
            httpName: 'ceremony-location',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            alwaysEnglish: true,
            choices: ceremonyLocationChoices,
            onSearchQueryChange: searchCeremonyLocations,
        },
        {
            id: ceremonyHourFieldId,
            type: 'select',
            name: 'ceremony-hour',
            label: 'Ceremony Hour',
            displayLabel: 'Hour',
            required: true,
            errorMsg: 'Please choose the ceremony hour',
            defaultValue: savedCeremonyTime.hour,
            setValue: null,
            widthOfField: 3,
            httpName: 'ceremony-hour',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            alwaysEnglish: true,
            choices: buildPaddedChoices(12, 1),
        },
        {
            id: ceremonyMinuteFieldId,
            type: 'number',
            name: 'ceremony-minute',
            label: 'Ceremony Minute',
            displayLabel: 'Minute',
            placeholder: 'Minute',
            required: true,
            errorMsg: 'Please enter a minute between 0 and 59',
            defaultValue: savedCeremonyTime.minute,
            setValue: null,
            widthOfField: 3,
            httpName: 'ceremony-minute',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            alwaysEnglish: true,
            minimumValue: 0,
            maximumValue: 59,
        },
        {
            id: ceremonyMeridiemFieldId,
            type: 'select',
            name: 'ceremony-meridiem',
            label: 'Ceremony Meridiem',
            displayLabel: 'AM / PM',
            required: true,
            errorMsg: 'Please choose AM or PM',
            defaultValue: savedCeremonyTime.meridiem,
            setValue: null,
            widthOfField: 3,
            httpName: 'ceremony-meridiem',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            alwaysEnglish: true,
            choices: ['AM', 'PM'],
        },
        {
            id: ceremonyTimeZoneFieldId,
            type: 'search-select',
            name: 'ceremony-time-zone',
            label: 'Ceremony Time Zone',
            displayLabel: 'Ceremony Time Zone',
            placeholder: 'Search for a time zone',
            required: true,
            errorMsg: 'Please choose the ceremony time zone',
            defaultValue: (ceremonyDetails && ceremonyDetails.timeZone) || '',
            setValue: null,
            widthOfField: 1,
            httpName: 'ceremony-time-zone',
            labelOutside: true,
            labelOnTop: true,
            dontLetTheBrowserSaveField: true,
            alwaysEnglish: true,
            choices: availableTimeZones,
        },
    ];

    const openUpdateVenueModal = async () => {
        setIsLoading(true);

        const details = await fetchEventMetaDetailsRequest();

        ceremonyPlacesByLabel.current = {};

        if (details && details.locationName) {
            ceremonyPlacesByLabel.current[buildCeremonyLocationLabel(details)] = {
                name: details.locationName,
                address: details.locationAddress,
                placeId: details.locationPlaceId,
                latitude: details.locationLatitude,
                longitude: details.locationLongitude,
            };
        }

        setCeremonyDetails(details || {});
        setCeremonyLocationChoices([]);
        setShowUpdateVenueModal(true);
        setIsLoading(false);
    };

    const closeUpdateVenueModal = () => {
        setShowUpdateVenueModal(false);
        setCeremonyDetails(null);
        setCeremonyLocationChoices([]);
        ceremonyPlacesByLabel.current = {};
    };

    const handleUpdateVenue = async (formData) => {
        setIsLoading(true);

        try {
            const selectedLabel = String(formData.get(`field_${ceremonyLocationFieldId}`) || '');
            const selectedPlace = ceremonyPlacesByLabel.current[selectedLabel] || null;
            const result = await handleUpdateEventMetaDetailsRequest(formData, selectedPlace);

            if (result && result.success) {
                closeUpdateVenueModal();
                return true;
            } else {
                throw new Error(result || 'An error occurred while updating the ceremony details.');
            }

        } catch (error) {
            throw new Error(error.message || 'An error occurred while updating the ceremony details.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookings = async () => {
        setIsLoading(true);

        try {
            await fetchEventBookingsRequest(navigate, setAllBookings);
        } catch (error) {
            console.log(error.message || 'An error occurred while fetching the bookings.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, EventBookingManagementPermissionLevel, setIsLoading)
        .then(
            () => {
                fetchBookings();
                fetchImportDescriptor(navigate, 'eventBookings').then(setImportDescriptor);
            }
        )
    }, []);

    useEffect(() => {
        if (showAddBookingModal || showDeleteBookingModal || showDeleteBookingsModal || showEditBookingModal || showUpdateVenueModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [showAddBookingModal, showDeleteBookingModal, showDeleteBookingsModal, showEditBookingModal, showUpdateVenueModal]);

    useEffect(() => {
        return () => {
            searchCeremonyLocations.cancel();
        };
    }, [searchCeremonyLocations]);

    const columnDataTypes = {
        "date": ["Student Created", "Booking Created"],
        "currency": ["Total CD Cost", "Total Additional Attendee(s) Cost", "Total Paid for Base Fare"],
        "number": ["ID", "Additional Attendees"],
    };

    return (
        <>

            <div className={"booking-management-page"}>
                <Table tableData={allBookings}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       allowSticky={true}
                       forceEnglishTable={true}
                       allowSearch={true}
                       searchPlaceholder={'Search bookings'}
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
                       importConfig={{
                           templateName: 'bookings',
                           descriptor: importDescriptor,
                           onImport: async (file) => {
                               const result = await importCsvFile('eventBookings', {}, file);

                               if (result.imported > 0) {
                                   await fetchBookings();
                               }

                               return result;
                           },
                       }}
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
                           "Students Created",
                           "Booking Created",
                           "Total CD Cost",
                           "Total Additional Attendee(s) Cost",
                           "Total Paid for Base Fare",
                           "Additional Attendees",
                       ]}
                       headerModuleElements={[
                           (
                               <button key={3} onClick={() => {
                                    setShowAddBookingModal(true);
                               }}>
                                   Add Booking
                               </button>
                           ),
                           (
                               <button key={5} onClick={openUpdateVenueModal} disabled={isLoading}>
                                   Update Venue
                               </button>
                           ),
                           (
                               <button key={6} onClick={openDeleteBookingsModal} disabled={isLoading}>
                                   Delete Bookings
                               </button>
                           ),
                           (
                                 <button key={4} onClick={fetchBookings} disabled={isLoading}>
                                        {isLoading ? 'Loading...' : 'Reload Table Data'}
                                 </button>
                           )
                       ]}
                       footerModuleElements={[]}
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
                       dataTypes={
                           columnDataTypes
                       }
                       isLoading={isLoading}
                />
            </div>

            <animated.div style={animateAddBookingModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={cancelAddBookingModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>
                            Add A New Booking
                        </h3>
                    </div>
                    <div className={"general-large-admin-action-modal-content"}>
                        <Form fields={addBookingModalCoreFormFields}
                              dynamicSections={[buildStudentsDynamicSection([])]}
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
                              forceEnglishForm={true}
                              formFooterButtonsAreOutside={true}
                              footerButtonsPortalTarget={addBookingModalFooterButtonsRef}
                        />
                    </div>


                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-booking-modal-form-cancel-button"} onClick={cancelAddBookingModal}>
                            Cancel
                        </button>
                        <div ref={addBookingModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeleteBookingModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={handleCancelDeleteBookingModal}/>

                <div className={"general-small-admin-action-modal-container"}>

                    <div className={"general-small-admin-action-modal-header"}>

                        <h3>
                            Delete Booking
                        </h3>

                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
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
                                <p>{deleteError}</p>
                            </>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>



                        <button onClick={handleCancelDeleteBookingModal}>
                            Cancel
                        </button>

                        <button onClick={() => {
                            handleDeleteBooking();
                        }}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>


                    </div>

                </div>


            </animated.div>

            <animated.div style={animateDeleteBookingsModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={handleCancelDeleteBookingsModal}/>

                <div className={"general-small-admin-action-modal-container"}>

                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>
                            Delete Bookings
                        </h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>

                        <select id={"delete-bookings-scope"} className={"select-form-field"} value={deleteBookingsScope}
                                onChange={(event) => setDeleteBookingsScope(event.target.value)}>
                            <option value={deleteAllBookingsChoice}>{deleteAllBookingsChoice}</option>
                            {schoolDivisions.map((division) => (
                                <option key={division} value={division}>
                                    {`Bookings whose students are all in ${division}`}
                                </option>
                            ))}
                        </select>

                        <br/>

                        <p>
                            This will delete <strong>{bookingsMatchingDeleteScope}</strong>{' '}
                            booking{bookingsMatchingDeleteScope === 1 ? '' : 's'}, and all the student(s),
                            parent(s) and authentication credentials that belong to them. A booking with a
                            student outside the chosen division is left alone.
                        </p>

                        {deleteBookingsError && (
                            <>
                                <br/>
                                <p>{deleteBookingsError}</p>
                            </>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={handleCancelDeleteBookingsModal}>
                            Cancel
                        </button>

                        <button onClick={handleDeleteBookings} disabled={bookingsMatchingDeleteScope === 0}>
                            {isDeletingBookings ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>

                </div>

            </animated.div>

            <animated.div style={animateEditBookingModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={() => {
                    handleCancelEditBookingModal();
                }}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>
                            Edit Booking
                        </h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {editBookingModalPreFilledCoreFields && editBookingModalDynamicSections && (
                            <Form fields={editBookingModalPreFilledCoreFields}
                                  dynamicSections={editBookingModalDynamicSections}
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
                                      "Save", "Saving..."
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
                                  forceEnglishForm={true}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={editBookingModalFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"edit-booking-modal-cancel-button"} onClick={() => {
                            handleCancelEditBookingModal();
                        }}>
                            Cancel
                        </button>
                        <div ref={editBookingModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>

            </animated.div>

            <animated.div style={animateUpdateVenueModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeUpdateVenueModal}/>

                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>
                            Update Ceremony Venue
                        </h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        {ceremonyDetails && (
                            <Form fields={updateVenueModalFormFields}
                                  mailTo={''}
                                  sendPdf={false}
                                  formTitle={"Update Ceremony Venue Modal Form"}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleUpdateVenue}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={[
                                      "Save", "Saving..."
                                  ]}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={setShowUpdateVenueModal}
                                  pedanticIds={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  thisFormIsEditingAnEntry={true}
                                  forceEnglishForm={true}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={updateVenueModalFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"update-venue-modal-cancel-button"} onClick={closeUpdateVenueModal}>
                            Cancel
                        </button>
                        <div ref={updateVenueModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>

            </animated.div>
        </>
    );
}

export default EventBookingManagement;


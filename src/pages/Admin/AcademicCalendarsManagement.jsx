import '../../styles/AdminDashboard.css';
import {useNavigate, useSearchParams} from "react-router";
import {useEffect, useMemo, useRef, useState} from "react";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import FancyList from "../../modules/FancyList.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {msgTimeout, anyAcademicCalendarPermissionLevels} from "../../services/General/GeneralUtils.jsx";
import {
    fetchAcademicCalendars,
    addAcademicCalendarYear,
    updateCalendarMetaData,
    uploadCalendarPdf,
    addCalendarEvent,
    editCalendarEvent,
    deleteCalendarEvent
} from "../../services/Admin/AcademicCalendars/AdminAcademicCalendarsServices.jsx";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'

const eventTitleEnColIndex = 1;
const eventTitleArColIndex = 2;
const eventStartColIndex = 3;
const eventEndColIndex = 4;
const eventIdColIndex = 6;

const yearFieldId = 1;
const availableFromFieldId = 2;
const noteEnFieldId = 3;
const noteArFieldId = 4;
const pdfFieldId = 5;

const eventsSectionId = 1;
const eventTitleEnTemplateId = 11;
const eventTitleArTemplateId = 12;
const eventStartTemplateId = 13;
const eventEndTemplateId = 14;

const metaAvailableFromFieldId = 21;
const metaNoteEnFieldId = 22;
const metaNoteArFieldId = 23;

const singleTitleEnFieldId = 32;
const singleTitleArFieldId = 33;
const singleStartFieldId = 34;
const singleEndFieldId = 35;

const pdfOnlyFieldId = 41;

const PDF_FIELD_LABEL = 'Calendar PDF';

const eventRowFields = [
    { id: eventTitleEnTemplateId, type: 'text', name: 'title-en', label: 'Title (EN)', required: true, errorMsg: 'Please enter the English title', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (EN)', httpName: 'event-title-en' },
    { id: eventTitleArTemplateId, type: 'text', name: 'title-ar', label: 'Title (AR)', required: true, errorMsg: 'Please enter the Arabic title', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (AR)', lang: 'ar', httpName: 'event-title-ar' },
    { id: eventStartTemplateId, type: 'date', name: 'start-date', label: 'Start Date', required: true, errorMsg: 'Please choose the start date', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Start Date', httpName: 'event-start-date', alwaysEnglish: true },
    { id: eventEndTemplateId, type: 'date', name: 'end-date', label: 'End Date', required: true, errorMsg: 'Please choose the end date', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'End Date', httpName: 'event-end-date', alwaysEnglish: true },
];

function AcademicCalendarsManagement() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useLoading(false);
    const [calendars, setCalendars] = useState([]);
    const [eventsData, setEventsData] = useState(null);

    const [modalType, setModalType] = useState(null);
    const [modalFields, setModalFields] = useState(null);
    const [modalDynamicSections, setModalDynamicSections] = useState(null);
    const [resetModal, setResetModal] = useState(false);
    const [rowIndexToEdit, setRowIndexToEdit] = useState(null);

    const [rowIndexToDelete, setRowIndexToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const modalFooterButtonsRef = useRef(null);


    const openCalendarKey = searchParams.get('calendar') || '';
    const openAcademicYear = searchParams.get('year') || '';
    const isTableViewFor = (calendarKey) => openCalendarKey === calendarKey && openAcademicYear !== '';

    const animateModal = useSpring({
        opacity: modalType ? 1 : 0,
        transform: modalType ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateDeleteModal = useSpring({
        opacity: showDeleteModal ? 1 : 0,
        transform: showDeleteModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const reloadData = async () => {
        setIsLoading(true);

        const data = await fetchAcademicCalendars(navigate, {
            calendarKey: openCalendarKey,
            academicYear: openAcademicYear,
        });

        if (data) {
            setCalendars(data.calendars || []);
            setEventsData(data.events || null);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, anyAcademicCalendarPermissionLevels, setIsLoading)
            .then(() => {
                reloadData();
            });
    }, [openCalendarKey, openAcademicYear]);

    useEffect(() => {
        if (calendars.length > 0 && openCalendarKey === '') {
            setSearchParams({ calendar: calendars[0].key }, { replace: true });
        }
    }, [calendars, openCalendarKey]);

    const openCalendar = useMemo(
        () => calendars.find((calendar) => calendar.key === openCalendarKey) || null,
        [calendars, openCalendarKey]
    );

    const openYear = useMemo(
        () => (openCalendar ? (openCalendar.years || []).find((year) => year.academicYear === openAcademicYear) : null),
        [openCalendar, openAcademicYear]
    );

    const showTableView = (calendarKey, academicYear) => {
        setSearchParams({ calendar: calendarKey, year: academicYear });
    };

    const goBackToList = () => {
        setSearchParams(openCalendarKey ? { calendar: openCalendarKey } : {});
    };

    const openTabIndex = Math.max(0, calendars.findIndex((calendar) => calendar.key === openCalendarKey));

    const handleTabChange = (tabIndex) => {
        const calendar = calendars[tabIndex];

        if (calendar) {
            setSearchParams({ calendar: calendar.key });
        }
    };

    const closeModal = () => {
        setModalType(null);
        setModalFields(null);
        setModalDynamicSections(null);
        setResetModal(true);
        setRowIndexToEdit(null);
    };

    const openAddYearModal = (calendarKey) => {
        setModalType({ kind: 'add-year', calendarKey });
        setModalDynamicSections([{
            sectionId: eventsSectionId,
            title: 'Events',
            addButtonLabel: 'Add Event',
            removeButtonLabel: 'Remove Event',
            insertAfterFieldId: availableFromFieldId,
            minInstances: 1,
            maxInstances: 300,
            fields: eventRowFields,
        }]);

        setModalFields([
            { id: yearFieldId, type: 'text', name: 'academic-year', label: 'Academic Year', required: true, errorMsg: 'Please enter the academic year as 2026/2027', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Academic Year (this year/next year)', httpName: 'academic-year', alwaysEnglish: true },
            { id: availableFromFieldId, type: 'date', name: 'available-from', label: 'Available From', required: true, errorMsg: 'Please choose when this calendar starts showing', value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Start showing this academic calendar at', httpName: 'available-from', alwaysEnglish: true },
            { id: noteEnFieldId, type: 'textarea', name: 'note-en', label: 'Note (EN)', required: false, value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, placeholder: 'All holidays during the week are shifted to Thursday of that week as per the ministry of education instructions', displayLabel: 'Note shown above the public table (EN)', httpName: 'note-en' },
            { id: noteArFieldId, type: 'textarea', name: 'note-ar', label: 'Note (AR)', required: false, value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, lang: 'ar', displayLabel: 'Note shown above the public table (AR)', httpName: 'note-ar' },
            { id: pdfFieldId, type: 'file', name: 'calendar-pdf', label: PDF_FIELD_LABEL, required: false, value: '', allowedFileTypes: ['application/pdf', '.pdf'], errorMsg: 'Please upload the calendar as a PDF', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Calendar PDF for the Download Calendar button (optional)', httpName: 'calendar-pdf' },
        ]);
    };

    const openMetaDataModal = () => {
        setModalType({ kind: 'meta', calendarKey: openCalendarKey, academicYear: openAcademicYear });
        setModalDynamicSections(null);
        setModalFields([
            { id: metaAvailableFromFieldId, type: 'date', name: 'available-from', label: 'Available From', required: true, errorMsg: 'Please choose when this calendar starts showing', value: '', defaultValue: openYear ? openYear.availableFrom : '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Start showing this academic calendar at', httpName: 'available-from', alwaysEnglish: true },
            { id: metaNoteEnFieldId, type: 'textarea', name: 'note-en', label: 'Note (EN)', required: false, value: '', defaultValue: openYear ? openYear.noteEn : '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Note shown above the public table (EN)', httpName: 'note-en' },
            { id: metaNoteArFieldId, type: 'textarea', name: 'note-ar', label: 'Note (AR)', required: false, value: '', defaultValue: openYear ? openYear.noteAr : '', widthOfField: 1, labelOutside: true, labelOnTop: true, lang: 'ar', displayLabel: 'Note shown above the public table (AR)', httpName: 'note-ar' },
        ]);
    };

    const openPdfModal = () => {
        setModalType({ kind: 'pdf', calendarKey: openCalendarKey, academicYear: openAcademicYear });
        setModalDynamicSections(null);
        setModalFields([
            { id: pdfOnlyFieldId, type: 'file', name: 'calendar-pdf', label: PDF_FIELD_LABEL, required: true, allowedFileTypes: ['application/pdf', '.pdf'], errorMsg: 'Please choose a PDF', value: '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Calendar PDF', httpName: 'calendar-pdf' },
        ]);
    };

    const openEventModal = (mode, rowIndex) => {
        const row = mode === 'edit' ? eventsData[rowIndex] : null;

        setModalType({ kind: mode === 'edit' ? 'edit-event' : 'add-event', calendarKey: openCalendarKey, academicYear: openAcademicYear });
        setModalDynamicSections(null);
        setRowIndexToEdit(rowIndex ?? null);
        setModalFields([
            { id: singleTitleEnFieldId, type: 'text', name: 'title-en', label: 'Title (EN)', required: true, errorMsg: 'Please enter the English title', value: '', defaultValue: row ? row[eventTitleEnColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (EN)', httpName: 'title-en' },
            { id: singleTitleArFieldId, type: 'text', name: 'title-ar', label: 'Title (AR)', required: true, errorMsg: 'Please enter the Arabic title', value: '', defaultValue: row ? row[eventTitleArColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (AR)', lang: 'ar', httpName: 'title-ar' },
            { id: singleStartFieldId, type: 'date', name: 'start-date', label: 'Start Date', required: true, errorMsg: 'Please choose the start date', value: '', defaultValue: row ? row[eventStartColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Start Date', httpName: 'start-date', alwaysEnglish: true },
            { id: singleEndFieldId, type: 'date', name: 'end-date', label: 'End Date', required: true, errorMsg: 'Please choose the end date', value: '', defaultValue: row ? row[eventEndColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'End Date', httpName: 'end-date', alwaysEnglish: true },
        ]);
    };

    const collectDynamicEvents = (values) => {
        const count = Number(values[`dynamicSectionCount_${eventsSectionId}`] || 0);
        const events = [];

        for (let ordinal = 0; ordinal < count; ordinal += 1) {
            const at = (templateId) => values[`field_${eventsSectionId}_i${ordinal}_f${templateId}`] || '';

            events.push({
                title_en: at(eventTitleEnTemplateId),
                title_ar: at(eventTitleArTemplateId),
                start_date: at(eventStartTemplateId),
                end_date: at(eventEndTemplateId),
            });
        }

        return events;
    };

    const handleModalSubmit = async (formData) => {
        setIsLoading(true);

        try {
            const values = Object.fromEntries(formData.entries());
            let result;
            let nextView = null;

            if (modalType.kind === 'add-year') {
                const academicYear = values[`field_${yearFieldId}`];

                result = await addAcademicCalendarYear({
                    calendar_key: modalType.calendarKey,
                    academic_year: academicYear,
                    available_from: values[`field_${availableFromFieldId}`],
                    note_en: values[`field_${noteEnFieldId}`] || '',
                    note_ar: values[`field_${noteArFieldId}`] || '',
                    events: collectDynamicEvents(values),
                }, formData.get(PDF_FIELD_LABEL));

                nextView = { calendarKey: modalType.calendarKey, academicYear };
            } else if (modalType.kind === 'meta') {
                result = await updateCalendarMetaData({
                    calendar_key: modalType.calendarKey,
                    academic_year: modalType.academicYear,
                    available_from: values[`field_${metaAvailableFromFieldId}`],
                    note_en: values[`field_${metaNoteEnFieldId}`] || '',
                    note_ar: values[`field_${metaNoteArFieldId}`] || '',
                });
            } else if (modalType.kind === 'pdf') {
                result = await uploadCalendarPdf(modalType.calendarKey, modalType.academicYear, formData.get(PDF_FIELD_LABEL));
            } else if (modalType.kind === 'add-event' || modalType.kind === 'edit-event') {
                const payload = {
                    calendar_key: modalType.calendarKey,
                    academic_year: modalType.academicYear,
                    title_en: values[`field_${singleTitleEnFieldId}`],
                    title_ar: values[`field_${singleTitleArFieldId}`],
                    start_date: values[`field_${singleStartFieldId}`],
                    end_date: values[`field_${singleEndFieldId}`],
                };

                if (modalType.kind === 'edit-event') {
                    payload.event_id = Number(eventsData[rowIndexToEdit][eventIdColIndex]);
                    result = await editCalendarEvent(payload);
                } else {
                    result = await addCalendarEvent(payload);
                }
            }

            if (result && result.success) {
                closeModal();

                if (nextView) {
                    showTableView(nextView.calendarKey, nextView.academicYear);
                } else {
                    await reloadData();
                }

                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            throw new Error(error.message || 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (rowIndexToDelete === null) {
            return;
        }

        setIsLoading(true);
        setIsDeleting(true);

        try {
            const result = await deleteCalendarEvent(Number(eventsData[rowIndexToDelete][eventIdColIndex]));

            if (result && result.success) {
                setShowDeleteModal(false);
                setRowIndexToDelete(null);
                await reloadData();
                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            setDeleteError(error.message || 'An error occurred while deleting the event.');
            setTimeout(() => { setDeleteError(null); }, msgTimeout);
        } finally {
            setIsLoading(false);
            setIsDeleting(false);
        }
    };

    const renderYearList = (calendar) => (
        <div className="admin-page-tab-content">
            <FancyList
                items={(calendar.years || []).map((year) => ({
                    id: year.academicYear,
                    title: year.academicYear,
                    subtitle: `${year.eventCount} events${year.hasPdf ? ' · PDF attached' : ' · no PDF'} · updated ${year.updatedAt}`,
                    badge: year.isLive ? 'Showing now' : (year.isAvailable ? null : `From ${year.availableFrom}`),
                    meta: null,
                }))}
                onSelect={(item) => showTableView(calendar.key, item.id)}
                isLoading={isLoading}
                emptyMessage={'No academic calendars yet for this department'}
                headerElements={[
                    (
                        <button key={1} onClick={() => openAddYearModal(calendar.key)}>
                            Add a new Academic Calendar Year
                        </button>
                    )
                ]}
            />
        </div>
    );

    const renderTableView = () => (
        <div className="admin-page-tab-content">
            <Table tableData={eventsData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   isLoading={isLoading}
                   defaultHiddenColumns={['Event ID']}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => openEventModal('edit', rowIndex)}
                   allowDeleteEntryOption={true}
                   onDeleteEntry={(rowIndex) => {
                       setRowIndexToDelete(rowIndex);
                       setDeleteError(null);
                       setShowDeleteModal(true);
                   }}
                   headerModuleElements={[
                       (<button key={1} onClick={goBackToList}>Go Back</button>),
                       (<button key={2} onClick={openPdfModal}>Update PDF</button>),
                       (<button key={3} onClick={() => openEventModal('add', null)}>Add Event</button>),
                       (<button key={4} onClick={openMetaDataModal}>Update Meta Data</button>),
                   ]}
                   footerModuleElements={[]}
            />
        </div>
    );

    const renderCalendarPane = (calendar) => (
        isTableViewFor(calendar.key) ? renderTableView() : renderYearList(calendar)
    );

    const tabData = useMemo(() => calendars.map((calendar, index) => ({
        id: index,
        label: calendar.label,
        element: renderCalendarPane(calendar),
    })), [calendars, isLoading, eventsData, openCalendarKey, openAcademicYear]);

    const modalTitles = {
        'add-year': 'Add a new Academic Calendar Year',
        'meta': 'Update Meta Data',
        'pdf': 'Update PDF',
        'add-event': 'Add Event',
        'edit-event': 'Edit Event',
    };

    return (
        <>

            <div className={"academic-calendars-management-page"}>
                {calendars.length > 1
                    ? <TabsPage tabData={tabData}
                                initialTab={0}
                                controlledTab={openTabIndex}
                                onTabChange={handleTabChange}
                                title={"Academic Calendars Management"}/>
                    : (calendars.length === 1 ? renderCalendarPane(calendars[0]) : null)}
            </div>

            <animated.div style={animateModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>{modalType ? modalTitles[modalType.kind] : ''}</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>


                        {(modalType && modalFields != null) && (
                            <Form fields={modalFields}
                                  dynamicSections={modalDynamicSections || undefined}
                                  mailTo={''}
                                  sendPdf={false}
                                  formTitle={"Academic Calendar Modal Form"}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  resetFormFromParent={resetModal}
                                  setResetForFromParent={setResetModal}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleModalSubmit}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={() => closeModal()}
                                  formHasPasswordField={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  forceEnglishForm={true}
                                  noClearOption={true}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={['Save Changes', 'Saving...']}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={modalFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"} onClick={closeModal}>
                            Cancel
                        </button>
                        <div ref={modalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeleteModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={() => setShowDeleteModal(false)}/>
                <div className={"general-small-admin-action-modal-container"}>
                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>Delete Event</h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
                        <p>
                            Are you sure you want to
                            delete {eventsData && eventsData[rowIndexToDelete] && eventsData[rowIndexToDelete][eventTitleEnColIndex]}?
                            This action cannot be reversed.
                        </p>

                        {deleteError && (
                            <>
                                <br/>
                                <p>{deleteError}</p>
                            </>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={() => { setShowDeleteModal(false); setRowIndexToDelete(null); }}>
                            Cancel
                        </button>

                        <button onClick={handleDelete}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default AcademicCalendarsManagement;

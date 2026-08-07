import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useMemo, useRef, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {msgTimeout, staffDirectoryManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx";
import {
    fetchStaffDirectory,
    addEmployee,
    editEmployee,
    deleteEmployee
} from "../../services/Admin/StaffDirectory/AdminStaffDirectoryManagementServices.jsx";

const sortOrderColIndex = 0;
const employeeCodeColIndex = 1;
const nameEnColIndex = 2;
const nameArColIndex = 3;
const positionEnColIndex = 4;
const positionArColIndex = 5;
const subjectEnColIndex = 6;
const subjectArColIndex = 7;
const degreeEnColIndex = 8;
const degreeArColIndex = 9;
const departmentsColIndex = 10;
const displayColIndex = 11;
const isPublicColIndex = 12;
const classificationColIndex = 13;
const fingerprintColIndex = 14;
const emailColIndex = 15;
const phoneColIndex = 16;
const addressColIndex = 17;
const birthDateColIndex = 18;
const hireDateColIndex = 19;
const graduationYearColIndex = 20;
const nationalIdColIndex = 21;
const insuranceColIndex = 22;
const notesColIndex = 23;

const sortOrderFormFieldId = 1;
const employeeCodeFormFieldId = 2;
const nameEnFormFieldId = 3;
const nameArFormFieldId = 4;
const positionEnFormFieldId = 5;
const positionArFormFieldId = 6;
const subjectEnFormFieldId = 7;
const subjectArFormFieldId = 8;
const departmentsFormFieldId = 9;
const displayFormFieldId = 10;
const isPublicFormFieldId = 11;
const emailFormFieldId = 12;
const phoneFormFieldId = 13;
const hireDateFormFieldId = 14;
const notesFormFieldId = 15;
const degreeEnFormFieldId = 16;
const degreeArFormFieldId = 17;
const classificationFormFieldId = 18;
const fingerprintFormFieldId = 19;
const addressFormFieldId = 20;
const birthDateFormFieldId = 21;
const graduationYearFormFieldId = 22;
const nationalIdFormFieldId = 23;
const insuranceFormFieldId = 24;

function StaffDirectoryManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [employeesData, setEmployeesData] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [displayStyles, setDisplayStyles] = useState([]);

    const [showEditorModal, setShowEditorModal] = useState(false);
    const [resetEditorModal, setResetEditorModal] = useState(false);
    const [editorFields, setEditorFields] = useState(null);
    const [editorMode, setEditorMode] = useState('add');
    const [rowIndexToEdit, setRowIndexToEdit] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rowIndexToDelete, setRowIndexToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const editorModalFooterButtonsRef = useRef(null);

    const animateEditorModal = useSpring({
        opacity: showEditorModal ? 1 : 0,
        transform: showEditorModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const animateDeleteModal = useSpring({
        opacity: showDeleteModal ? 1 : 0,
        transform: showDeleteModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const reloadData = async () => {
        setIsLoading(true);
        await fetchStaffDirectory(navigate, setEmployeesData, setDepartments, setDisplayStyles);
        setIsLoading(false);
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, staffDirectoryManagementPermissionLevel, setIsLoading)
            .then(() => {
                reloadData();
            });
    }, []);

    const departmentNames = useMemo(() => departments.map((department) => department.name), [departments]);

    const departmentKeysForNames = (names) => names
        .map((name) => departments.find((department) => department.name === name))
        .filter(Boolean)
        .map((department) => department.key);

    const buildFormFields = (rowData) => ([
        { id: sortOrderFormFieldId, type: 'number', name: 'sort_order', label: 'ID', required: false, value: rowData ? rowData[sortOrderColIndex] : '', defaultValue: rowData ? rowData[sortOrderColIndex] : '', minimumValue: 0, maximumValue: 100000, widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'ID (also the order the table and the staff pages use)', httpName: 'staff-sort-order', alwaysEnglish: true },
        { id: employeeCodeFormFieldId, type: 'text', name: 'employee_code', label: 'Employee ID', required: false, value: rowData ? rowData[employeeCodeColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: rowData ? 'Employee ID' : 'Employee ID (leave blank to generate the next one)', readOnlyField: !!rowData, httpName: 'staff-employee-code', dontLetTheBrowserSaveField: true },
        { id: isPublicFormFieldId, type: 'select', name: 'is_public', label: 'Shown Publicly', required: true, choices: ['Yes', 'No'], defaultValue: rowData ? rowData[isPublicColIndex] : 'No', value: rowData ? rowData[isPublicColIndex] : 'No', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Shown Publicly', httpName: 'staff-is-public' },
        { id: nameEnFormFieldId, type: 'text', name: 'name_en', label: 'Name (EN)', required: true, errorMsg: 'Please enter the English name', value: rowData ? rowData[nameEnColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (EN)', httpName: 'staff-name-en', dontLetTheBrowserSaveField: true },
        { id: nameArFormFieldId, type: 'text', name: 'name_ar', label: 'Name (AR)', required: true, errorMsg: 'Please enter the Arabic name', value: rowData ? rowData[nameArColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (AR)', lang: 'ar', httpName: 'staff-name-ar', dontLetTheBrowserSaveField: true },
        { id: positionEnFormFieldId, type: 'text', name: 'position_en', label: 'Position (EN)', required: true, errorMsg: 'Please enter the English position', value: rowData ? rowData[positionEnColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Position (EN), separate more than one with a comma', httpName: 'staff-position-en' },
        { id: positionArFormFieldId, type: 'text', name: 'position_ar', label: 'Position (AR)', required: true, errorMsg: 'Please enter the Arabic position', value: rowData ? rowData[positionArColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Position (AR), separate more than one with a comma', lang: 'ar', httpName: 'staff-position-ar' },
        { id: subjectEnFormFieldId, type: 'text', name: 'subject_en', label: 'Subject (EN)', required: false, value: rowData ? rowData[subjectEnColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Subject (EN), separate more than one with a comma', httpName: 'staff-subject-en' },
        { id: subjectArFormFieldId, type: 'text', name: 'subject_ar', label: 'Subject (AR)', required: false, value: rowData ? rowData[subjectArColIndex] : '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Subject (AR), separate more than one with a comma', lang: 'ar', httpName: 'staff-subject-ar' },
        { id: departmentsFormFieldId, type: 'select', name: 'departments', label: 'Departments', required: true, multiple: true, large: true, choices: departmentNames, errorMsg: 'Please choose at least one department', defaultValue: rowData ? rowData[departmentsColIndex] : '', value: rowData ? rowData[departmentsColIndex] : '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Departments', httpName: 'staff-departments' },
        { id: displayFormFieldId, type: 'select', name: 'display_style', label: 'Display', required: true, choices: displayStyles.length ? displayStyles : ['Table Row'], defaultValue: rowData ? rowData[displayColIndex] : 'Table Row', value: rowData ? rowData[displayColIndex] : 'Table Row', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Display', httpName: 'staff-display' },
        { id: degreeEnFormFieldId, type: 'text', name: 'degree_en', label: 'Degree (EN)', required: false, value: rowData ? rowData[degreeEnColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Academic Degree (EN)', httpName: 'staff-degree-en' },
        { id: degreeArFormFieldId, type: 'text', name: 'degree_ar', label: 'Degree (AR)', required: false, value: rowData ? rowData[degreeArColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Academic Degree (AR)', lang: 'ar', httpName: 'staff-degree-ar' },
        { id: classificationFormFieldId, type: 'text', name: 'classification', label: 'Classification', required: false, value: rowData ? rowData[classificationColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Classification (never published)', httpName: 'staff-classification' },
        { id: fingerprintFormFieldId, type: 'text', name: 'fingerprint_code', label: 'Fingerprint Code', required: false, value: rowData ? rowData[fingerprintColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Fingerprint Code (never published)', httpName: 'staff-fingerprint', alwaysEnglish: true },
        { id: graduationYearFormFieldId, type: 'text', name: 'graduation_year', label: 'Graduation Year', required: false, value: rowData ? rowData[graduationYearColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Graduation Year (never published)', httpName: 'staff-graduation-year', alwaysEnglish: true },
        { id: emailFormFieldId, type: 'email', name: 'email', label: 'Email', required: false, value: rowData ? rowData[emailColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Email (never published)', httpName: 'staff-email', dontLetTheBrowserSaveField: true },
        { id: phoneFormFieldId, type: 'text', name: 'phone', label: 'Phone', required: false, value: rowData ? rowData[phoneColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Phone (never published)', httpName: 'staff-phone', dontLetTheBrowserSaveField: true },
        { id: hireDateFormFieldId, type: 'date', name: 'hire_date', label: 'Hire Date', required: false, value: rowData ? rowData[hireDateColIndex] : '', defaultValue: rowData ? rowData[hireDateColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Hire Date (never published)', httpName: 'staff-hire-date', alwaysEnglish: true },
        { id: addressFormFieldId, type: 'text', name: 'address', label: 'Address', required: false, value: rowData ? rowData[addressColIndex] : '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Address (never published)', httpName: 'staff-address' },
        { id: birthDateFormFieldId, type: 'date', name: 'birth_date', label: 'Date of Birth', required: false, value: rowData ? rowData[birthDateColIndex] : '', defaultValue: rowData ? rowData[birthDateColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Date of Birth (never published)', httpName: 'staff-birth-date', alwaysEnglish: true },
        { id: nationalIdFormFieldId, type: 'text', name: 'national_id', label: 'National ID', required: false, value: rowData ? rowData[nationalIdColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'National ID (never published)', httpName: 'staff-national-id', alwaysEnglish: true, dontLetTheBrowserSaveField: true },
        { id: insuranceFormFieldId, type: 'text', name: 'insurance_number', label: 'Insurance Number', required: false, value: rowData ? rowData[insuranceColIndex] : '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Insurance Number (never published)', httpName: 'staff-insurance', alwaysEnglish: true, dontLetTheBrowserSaveField: true },
        { id: notesFormFieldId, type: 'textarea', name: 'notes', label: 'Notes', required: false, value: rowData ? rowData[notesColIndex] : '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Notes (never published)', httpName: 'staff-notes' },
    ]);

    const openEditor = (mode, rowIndex) => {
        setEditorMode(mode);
        setRowIndexToEdit(rowIndex ?? null);
        setEditorFields(buildFormFields(mode === 'edit' ? employeesData[rowIndex] : null));
        setShowEditorModal(true);
    };

    const closeEditor = () => {
        setShowEditorModal(false);
        setResetEditorModal(true);
        setEditorFields(null);
        setRowIndexToEdit(null);
    };

    const handleEditorSubmit = async (formData) => {
        setIsLoading(true);

        try {
            const values = Object.fromEntries(formData.entries());
            const chosenDepartments = String(values[`field_${departmentsFormFieldId}`] || '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean);

            const payload = {
                sort_order: values[`field_${sortOrderFormFieldId}`] || '',
                employee_code: editorMode === 'edit' ? employeesData[rowIndexToEdit][employeeCodeColIndex] : (values[`field_${employeeCodeFormFieldId}`] || ''),
                name_en: values[`field_${nameEnFormFieldId}`],
                name_ar: values[`field_${nameArFormFieldId}`],
                position_en: values[`field_${positionEnFormFieldId}`],
                position_ar: values[`field_${positionArFormFieldId}`],
                subject_en: values[`field_${subjectEnFormFieldId}`] || '',
                subject_ar: values[`field_${subjectArFormFieldId}`] || '',
                departments: departmentKeysForNames(chosenDepartments),
                display_style: values[`field_${displayFormFieldId}`],
                is_public: values[`field_${isPublicFormFieldId}`],
                email: values[`field_${emailFormFieldId}`] || '',
                phone: values[`field_${phoneFormFieldId}`] || '',
                hire_date: values[`field_${hireDateFormFieldId}`] || '',
                notes: values[`field_${notesFormFieldId}`] || '',
                degree_en: values[`field_${degreeEnFormFieldId}`] || '',
                degree_ar: values[`field_${degreeArFormFieldId}`] || '',
                classification: values[`field_${classificationFormFieldId}`] || '',
                fingerprint_code: values[`field_${fingerprintFormFieldId}`] || '',
                graduation_year: values[`field_${graduationYearFormFieldId}`] || '',
                address: values[`field_${addressFormFieldId}`] || '',
                birth_date: values[`field_${birthDateFormFieldId}`] || '',
                national_id: values[`field_${nationalIdFormFieldId}`] || '',
                insurance_number: values[`field_${insuranceFormFieldId}`] || '',
            };

            const result = editorMode === 'edit' ? await editEmployee(payload) : await addEmployee(payload);

            if (result && result.success) {
                closeEditor();
                await reloadData();
                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            throw new Error(error.message || 'An error occurred while saving the employee.');
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
            const result = await deleteEmployee(employeesData[rowIndexToDelete][employeeCodeColIndex]);

            if (result && result.success) {
                setShowDeleteModal(false);
                setRowIndexToDelete(null);
                await reloadData();
                return true;
            }

            throw new Error((result && result.message) || result);
        } catch (error) {
            setDeleteError(error.message || 'An error occurred while deleting the employee.');
            setTimeout(() => { setDeleteError(null); }, msgTimeout);
        } finally {
            setIsLoading(false);
            setIsDeleting(false);
        }
    };

    const cancelDeleteModal = () => {
        setShowDeleteModal(false);
        setRowIndexToDelete(null);
        setDeleteError(null);
    };

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"staff-directory-management-page"}>
                <Table tableData={employeesData}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       allowSticky={true}
                       forceEnglishTable={true}
                       isLoading={isLoading}
                       sortConfigParam={{column: 0, direction: 'ascending'}}
                       defaultHiddenColumns={['Address', 'Birth Date', 'Graduation Year', 'National ID', 'Insurance Number', 'Notes', 'Hidden']}
                       filterableColumns={['Departments', 'Display', 'Public', 'Classification']}
                       allowEditEntryOption={true}
                       onEditEntryOption={(rowIndex) => openEditor('edit', rowIndex)}
                       allowDeleteEntryOption={true}
                       onDeleteEntry={(rowIndex) => {
                           setRowIndexToDelete(rowIndex);
                           setDeleteError(null);
                           setShowDeleteModal(true);
                       }}
                       headerModuleElements={[
                           (
                               <button key={1} onClick={() => openEditor('add', null)}>
                                   Add Employee
                               </button>
                           ),
                           (
                               <button key={2} onClick={reloadData} disabled={isLoading}>
                                   {isLoading ? 'Loading...' : 'Reload Table Data'}
                               </button>
                           )
                       ]}
                       footerModuleElements={[]}
                />
            </div>

            <animated.div style={animateEditorModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={closeEditor}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>{editorMode === 'edit' ? 'Edit Employee' : 'Add Employee'}</h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        <p className={"general-large-admin-action-modal-content-note"}>
                            Note: Highlighted Line puts the employee above the table as &quot;Position: Name&quot;
                            instead of in it, which is how heads and vices are shown.
                        </p>

                        {(showEditorModal && editorFields != null) && (
                            <Form fields={editorFields}
                                  mailTo={''}
                                  sendPdf={false}
                                  formTitle={"Staff Directory Modal Form"}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  resetFormFromParent={resetEditorModal}
                                  setResetForFromParent={setResetEditorModal}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleEditorSubmit}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={setShowEditorModal}
                                  formHasPasswordField={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  forceEnglishForm={true}
                                  noClearOption={true}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={['Save Changes', 'Saving...']}
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={editorModalFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"} onClick={closeEditor}>
                            Cancel
                        </button>
                        <div ref={editorModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>

            <animated.div style={animateDeleteModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={cancelDeleteModal}/>
                <div className={"general-small-admin-action-modal-container"}>
                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>Delete Employee</h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>
                        <p>
                            Are you sure you want to
                            delete {employeesData && employeesData[rowIndexToDelete] && employeesData[rowIndexToDelete][nameEnColIndex]}?
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
                        <button onClick={cancelDeleteModal}>
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

export default StaffDirectoryManagement;

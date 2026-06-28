import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import Spinner from "../../modules/Spinner.jsx";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {infoSystemManagementPermissionLevel, isDevelopment} from "../../services/General/GeneralUtils.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import {fetchInfoSystemData, updateInfoSystemData} from "../../services/Admin/InfoSystem/AdminInfoSystemManagementServices.jsx";

function InfoSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [globalSettingsData, setGlobalSettingsData] = useState(null);
    const [departmentsData, setDepartmentsData] = useState(null);
    const [stagesData, setStagesData] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [resetEditModal, setResetEditModal] = useState(false);
    const [editFormFields, setEditFormFields] = useState(null);
    const [currentEditType, setCurrentEditType] = useState(null);
    const [indexOfRowToEdit, setIndexOfRowToEdit] = useState(null);

    const animateEditModal = useSpring({
        opacity: showEditModal ? 1 : 0,
        transform: showEditModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const reloadData = async () => {
        setIsLoading(true);
        await fetchInfoSystemData(navigate, setGlobalSettingsData, setDepartmentsData, setStagesData);
        setIsLoading(false);
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, infoSystemManagementPermissionLevel, setIsLoading)
            .then(() => {
                reloadData();
            });
    }, []);

    const settingKeyColIndex = 1;
    const settingValColIndex = 2;
    const settingIsEncryptedColIndex = 3;
    const settingDescriptionColIndex = 4;

    const departmentKeyColIndex = 1;
    const departmentNameEnColIndex = 2;
    const departmentNameArColIndex = 3;
    const departmentContactNumberColIndex = 4;
    const departmentIsAcademicColIndex = 5;

    const stageKeyColIndex = 1;
    const stageDeptKeyColIndex = 2;
    const stageSectionKeyColIndex = 3;
    const stageSectionTitleEnColIndex = 4;
    const stageSectionTitleArColIndex = 5;
    const stageNameEnColIndex = 6;
    const stageNameArColIndex = 7;
    const stageAgeEnColIndex = 9;
    const stageAgeArColIndex = 10;
    const stageIsOfferedColIndex = 8;
    const stageTuitionFeesColIndex = 11;

    const settingKeysWithLimitedValues = {
        'BOT_MODE': ['simple', 'intermediate', 'advanced'],
        'USE_HISTORY_ACROSS_SESSIONS': ['Yes', 'No'],
        'LLM_PROVIDER': ['deepseek', 'gemini'],
        'SESSION_TIMEOUT_MINUTES': ['30', '60', '120']
    }

    const handleEditInitialization = (type, rowIndex) => {
        let rowData;
        let formFieldsConfig = [];

        if (type === 'settings') {
            rowData = globalSettingsData[rowIndex];
            const isSettingKeyWithLimitedValues = settingKeysWithLimitedValues[rowData[settingKeyColIndex]];

            if (isSettingKeyWithLimitedValues) {
                formFieldsConfig = [
                    { id: 'setting_key', type: 'text', name: 'setting_key', label: 'Setting Key', required: true, value: rowData[settingKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Setting Key', readOnlyField: true},
                    { id: 'val', type: 'select', name: 'val', label: 'Value', required: true, value: rowData[settingValColIndex], defaultValue: [rowData[settingValColIndex]], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Value', choices: isSettingKeyWithLimitedValues},
                    { id: 'is_encrypted', type: 'select', name: 'is_encrypted', label: 'Is Encrypted', required: true, choices: ['Yes', 'No'], defaultValue: [rowData[settingIsEncryptedColIndex]], value: rowData[settingIsEncryptedColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Is Encrypted'},
                    { id: 'description', type: 'textarea', name: 'description', label: 'Description', required: false, value: rowData[settingDescriptionColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Description'}
                ];
            } else {

                formFieldsConfig = [
                    { id: 'setting_key', type: 'text', name: 'setting_key', label: 'Setting Key', required: true, value: rowData[settingKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Setting Key', readOnlyField: true},
                    { id: 'val', type: 'text', name: 'val', label: 'Value', required: true, value: rowData[settingValColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Value'},
                    { id: 'is_encrypted', type: 'select', name: 'is_encrypted', label: 'Is Encrypted', required: true, choices: ['Yes', 'No'], defaultValue: [rowData[settingIsEncryptedColIndex]], value: rowData[settingIsEncryptedColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Is Encrypted'},
                    { id: 'description', type: 'textarea', name: 'description', label: 'Description', required: false, value: rowData[settingDescriptionColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Description'}
                ];
            }
        } else if (type === 'departments') {
            rowData = departmentsData[rowIndex];
            formFieldsConfig = [
                { id: 'dept_key', type: 'text', name: 'dept_key', label: 'Department Key', required: true, value: rowData[departmentKeyColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Department Key', readOnlyField: true },
                { id: 'name_en', type: 'text', name: 'name_en', label: 'Name (EN)', required: true, value: rowData[departmentNameEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (EN)' },
                { id: 'name_ar', type: 'text', name: 'name_ar', label: 'Name (AR)', required: true, value: rowData[departmentNameArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (AR)', lang: 'ar' },
                { id: 'contact_number', type: 'text', name: 'contact_number', label: 'Contact Number', required: true, value: rowData[departmentContactNumberColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: "Contact Number (Do not add a '+' at the beggining and always start with 20 for this work correctly in Whatsapp api" },
                { id: 'is_academic', type: 'select', name: 'is_academic', label: 'Is Academic', required: true, choices: ['Yes', 'No'], defaultValue: [rowData[departmentIsAcademicColIndex]], value: rowData[departmentIsAcademicColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Is Academic' },
            ];
        } else if (type === 'stages') {
            rowData = stagesData[rowIndex];
            formFieldsConfig = [
                { id: 'stage_key', type: 'text', name: 'stage_key', label: 'Stage Key', required: true, value: rowData[stageKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Stage Key', readOnlyField: true  },
                { id: 'dept_key', type: 'text', name: 'dept_key', label: 'Department Key', required: true, value: rowData[stageDeptKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Department Key', readOnlyField: true  },
                { id: 'section_key', type: 'text', name: 'section_key', label: 'Section Key', required: true, value: rowData[stageSectionKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Section Key', readOnlyField: true  },
                { id: 'section_title_en', type: 'text', name: 'section_title_en', label: 'Section Title (EN)', required: true, value: rowData[stageSectionTitleEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Section Title (EN)' },
                { id: 'section_title_ar', type: 'text', name: 'section_title_ar', label: 'Section Title (AR)', required: true, value: rowData[stageSectionTitleArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Section Title (AR)', lang: 'ar' },
                { id: 'name_en', type: 'text', name: 'name_en', label: 'Name (EN)', required: true, value: rowData[stageNameEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (EN)' },
                { id: 'name_ar', type: 'text', name: 'name_ar', label: 'Name (AR)', required: true, value: rowData[stageNameArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (AR)', lang: 'ar' },
                { id: 'age_en', type: 'text', name: 'age_en', label: 'Age (EN)', required: true, value: rowData[stageAgeEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Age (EN)' },
                { id: 'age_ar', type: 'text', name: 'age_ar', label: 'Age (AR)', required: true, value: rowData[stageAgeArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Age (AR)', lang: 'ar' },
                { id: 'is_offered', type: 'select', name: 'is_offered', label: 'Is Offered', required: true, choices: ['Yes', 'No'], defaultValue: [rowData[stageIsOfferedColIndex]], value: rowData[stageIsOfferedColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Is Offered' },
                { id: 'tuition_fees', type: 'number', name: 'tuition_fees', label: 'Tuition Fees', required: true, value: rowData[stageTuitionFeesColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Tuition Fees', minimumValue: 1, maximumValue: 1000000000 },
            ];
        }

        setCurrentEditType(type);
        setEditFormFields(formFieldsConfig);
        setShowEditModal(true);
        setIndexOfRowToEdit(rowIndex);
    };

    const handleEditInfoSystemSubmit = async (formData) => {
        setIsLoading(true);

        try {
            const formDataJson = Object.fromEntries(formData.entries());
            let payload = {};

            if (currentEditType === 'settings') {
                payload = {
                    settings: [{
                        setting_key: globalSettingsData[indexOfRowToEdit][1],
                        val: formDataJson['field_val'],
                        is_encrypted: formDataJson['field_is_encrypted'],
                        description: formDataJson['field_description'] || '',
                        sort_order: Number(globalSettingsData[indexOfRowToEdit][0])
                    }]
                };
            } else if (currentEditType === 'departments') {
                payload = {
                    departments: [{
                        dept_key: departmentsData[indexOfRowToEdit][1],
                        name_en: formDataJson['field_name_en'],
                        name_ar: formDataJson['field_name_ar'],
                        contact_number: formDataJson['field_contact_number'],
                        is_academic: formDataJson['field_is_academic'],
                        sort_order: Number(departmentsData[indexOfRowToEdit][0])
                    }]
                };
            } else if (currentEditType === 'stages') {
                payload = {
                    stages: [{
                        stage_key: stagesData[indexOfRowToEdit][1],
                        dept_key: stagesData[indexOfRowToEdit][2],
                        section_key: stagesData[indexOfRowToEdit][3],
                        section_title_en: formDataJson['field_section_title_en'],
                        section_title_ar: formDataJson['field_section_title_ar'],
                        name_en: formDataJson['field_name_en'],
                        name_ar: formDataJson['field_name_ar'],
                        is_offered: formDataJson['field_is_offered'],
                        age_en: formDataJson['field_age_en'],
                        age_ar: formDataJson['field_age_ar'],
                        tuition_fees: Number(formDataJson['field_tuition_fees']),
                        sort_order: Number(stagesData[indexOfRowToEdit][0])
                    }]
                };
            }

            payload.is_development = isDevelopment();
            const result = await updateInfoSystemData(payload);

            if (result && result.success) {
                setShowEditModal(false);
                setResetEditModal(true);
                setCurrentEditType(null);
                setEditFormFields(null);
                await reloadData();
                return true;
            } else {
                throw new Error(result.message || result);
            }

        } catch (error) {
            throw new Error(error.message || 'An error occurred while editing the info system data.');
        } finally {
            setIsLoading(false);
        }
    };

    const cancelEditModal = () => {
        setShowEditModal(false);
        setResetEditModal(true);
        setCurrentEditType(null);
        setEditFormFields(null);
    };

    const reloadButtonConfig = [
        (
            <button key={1} onClick={reloadData} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Reload Table Data'}
            </button>
        )
    ];

    const GlobalSettings = () => (
        <div className="admin-page-tab-content">
            <Table tableData={globalSettingsData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => handleEditInitialization('settings', rowIndex)}
                   isLoading={isLoading}
                   headerModuleElements={reloadButtonConfig}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   allowBreakWordColumns={{ "Value": '10rem' }}
                   truncateValuesColumns={{'Value': 100}}
            />
        </div>
    );

    const Departments = () => (
        <div className="admin-page-tab-content">
            <Table tableData={departmentsData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => handleEditInitialization('departments', rowIndex)}
                   isLoading={isLoading}
                   headerModuleElements={reloadButtonConfig}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
            />
        </div>
    );

    const Stages = () => (
        <div className="admin-page-tab-content">
            <Table tableData={stagesData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => handleEditInitialization('stages', rowIndex)}
                   isLoading={isLoading}
                   headerModuleElements={reloadButtonConfig}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   currencyColumns={[
                       'Tuition Fees'
                   ]}
                   currencySymbols={['EGP']}
                   currencySymbolPositions={['right-space']}
            />
        </div>
    );

    const tabData = [
        {
            id: 0,
            label: 'Global Settings',
            component: GlobalSettings
        },
        {
            id: 1,
            label: 'Departments',
            component: Departments
        },
        {
            id: 2,
            label: 'Stages',
            component: Stages
        },
    ];

    return (
        <>
            {isLoading && <Spinner/>}



            <div className={"info-system-management-page"}>

                <TabsPage tabData={tabData} initialTab={0} title={"Info System Management"}/>
            </div>

            <animated.div style={animateEditModal} className={"general-large-admin-action-modal"}>
                <div className={"general-large-admin-action-modal-overlay"} onClick={cancelEditModal}/>
                <div className={"general-large-admin-action-modal-container"}>
                    <div className={"general-large-admin-action-modal-header"}>
                        <h3>
                            Edit {currentEditType ? currentEditType.charAt(0).toUpperCase() + currentEditType.slice(1) : ''}
                        </h3>
                    </div>

                    <div className={"general-large-admin-action-modal-content"}>
                        <p className={"general-large-admin-action-modal-content-note"}>
                            Note: Do not edit the info system data values unless you know what you are doing.
                        </p>
                        { (showEditModal && editFormFields != null) && (
                            <Form fields={editFormFields}
                                  mailTo={''}
                                  sendPdf={false}
                                  formTitle={"Edit Info System Modal Form"}
                                  lang={"en"}
                                  captchaLength={1}
                                  noInputFieldsCache={true}
                                  noCaptcha={true}
                                  resetFormFromParent={resetEditModal}
                                  setResetForFromParent={setResetEditModal}
                                  hasDifferentOnSubmitBehaviour={true}
                                  differentOnSubmitBehaviour={handleEditInfoSystemSubmit}
                                  formInModalPopup={true}
                                  setShowFormModalPopup={setShowEditModal}
                                  formHasPasswordField={false}
                                  footerButtonsSpaceBetween={true}
                                  switchFooterButtonsOrder={true}
                                  forceEnglishForm={true}
                                  noClearOption={true}
                                  hasDifferentSubmitButtonText={true}
                                  differentSubmitButtonText={['Save Changes', 'Saving...']}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"} onClick={cancelEditModal}>
                            Cancel
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default InfoSystemManagement;
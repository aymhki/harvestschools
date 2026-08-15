import '../../styles/AdminDashboard.css';
import {useNavigate} from "react-router";
import {useEffect, useMemo, useRef, useState} from "react";
import {useSpring, animated} from "react-spring";
import Form from '../../modules/Form.jsx';
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import {infoSystemManagementPermissionLevel, isDevelopment, msgTimeout} from "../../services/General/GeneralUtils.jsx";
import TabsPage from "../../modules/TabsPage.jsx";
import {fetchInfoSystemData, updateInfoSystemData} from "../../services/Admin/InfoSystem/AdminInfoSystemManagementServices.jsx";
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'

function InfoSystemManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useLoading(false);
    const [globalSettingsData, setGlobalSettingsData] = useState(null);
    const [departmentsData, setDepartmentsData] = useState(null);
    const [stagesData, setStagesData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [policiesData, setPoliciesData] = useState(null);
    const [formEmailsData, setFormEmailsData] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [resetEditModal, setResetEditModal] = useState(false);
    const [editFormFields, setEditFormFields] = useState(null);
    const [currentEditType, setCurrentEditType] = useState(null);
    const [indexOfRowToEdit, setIndexOfRowToEdit] = useState(null);
    const [syncConfigDataError, setSyncConfigDataError] = useState(null);
    const editModalFooterButtonsRef = useRef(null);

    const animateEditModal = useSpring({
        opacity: showEditModal ? 1 : 0,
        transform: showEditModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const reloadData = async () => {
        setIsLoading(true);
        await fetchInfoSystemData(navigate, setGlobalSettingsData, setDepartmentsData, setStagesData, setProfileData, setPoliciesData, setFormEmailsData);
        setIsLoading(false);
    };

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, infoSystemManagementPermissionLevel, setIsLoading)
            .then(() => {
                reloadData();
            });
    }, []);

    const settingSortOrderColIndex = 0;
    const settingKeyColIndex = 1;
    const settingValColIndex = 2;
    const settingIsEncryptedColIndex = 3;
    const settingDescriptionColIndex = 4;

    const departmentSortOrderColIndex = 0;
    const departmentKeyColIndex = 1;
    const departmentNameEnColIndex = 2;
    const departmentNameArColIndex = 3;
    const departmentContactNumberColIndex = 4;
    const departmentIsAcademicColIndex = 5;

    const stageSortOrderColIndex = 0;
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

    const profileSortOrderColIndex = 0;
    const profileKeyColIndex = 1;
    const profileCategoryColIndex = 2;
    const profileValueEnColIndex = 3;
    const profileValueArColIndex = 4;
    const profileNoteEnColIndex = 5;
    const profileNoteArColIndex = 6;

    const formEmailSortOrderColIndex = 0;
    const formEmailKeyColIndex = 1;
    const formEmailLabelColIndex = 2;
    const formEmailRecipientColIndex = 3;
    const formEmailIsActiveColIndex = 4;

    const policySortOrderColIndex = 0;
    const policyKeyColIndex = 1;
    const policyGroupKeyColIndex = 2;
    const policyTitleEnColIndex = 3;
    const policyTitleArColIndex = 4;
    const policyDetailEnColIndex = 5;
    const policyDetailArColIndex = 6;

    const settingKeysWithLimitedValues = {
        'BOT_MODE': ['simple', 'intermediate', 'advanced'],
        'USE_HISTORY_ACROSS_SESSIONS': ['Yes', 'No'],
        'LLM_PROVIDER': ['deepseek', 'gemini', 'claude'],
        'SESSION_TIMEOUT_MINUTES': ['30', '60', '120'],
        'BOT_ON': ['Yes', 'No'],
        'NUMBER_OF_MESSAGES_BEFORE_LLM_ASKS_FOR_FEEDBACK': ['3', '5', '10', '20'],
        'SHOW_UNOFFERED_STAGES': ['Yes', 'No']
    }

    const settingKeyFormFieldId = 1;
    const settingValFormFieldId = 2;
    const settingIsEncryptedFormFieldId = 3;
    const settingDescriptionFormFieldId = 4;

    const departmentKeyFormFieldId = 1;
    const departmentNameEnFormFieldId = 2;
    const departmentNameArFormFieldId = 3;
    const departmentContactNumberFormFieldId = 4;
    const departmentIsAcademicFormFieldId = 5;

    const stageKeyFormFieldId = 1;
    const stageDeptKeyFormFieldId = 2;
    const stageSectionKeyFormFieldId = 3;
    const stageSectionTitleEnFormFieldId = 4;
    const stageSectionTitleArFormFieldId = 5;
    const stageNameEnFormFieldId = 6;
    const stageNameArFormFieldId = 7;
    const stageAgeEnFormFieldId = 9;
    const stageAgeArFormFieldId = 10;
    const stageIsOfferedFormFieldId = 8;
    const stageTuitionFeesFormFieldId = 11;

    const profileKeyFormFieldId = 1;
    const profileCategoryFormFieldId = 2;
    const profileValueEnFormFieldId = 3;
    const profileValueArFormFieldId = 4;
    const profileNoteEnFormFieldId = 5;
    const profileNoteArFormFieldId = 6;

    const formEmailLabelFormFieldId = 1;
    const formEmailRecipientFormFieldId = 2;
    const formEmailIsActiveFormFieldId = 3;

    const policyKeyFormFieldId = 1;
    const policyGroupKeyFormFieldId = 2;
    const policyTitleEnFormFieldId = 3;
    const policyTitleArFormFieldId = 4;
    const policyDetailEnFormFieldId = 5;
    const policyDetailArFormFieldId = 6;

    const profileCategories = ['identity', 'location', 'contact', 'social', 'hours', 'fees', 'admission', 'general'];
    const policyGroupKeys = ['discounts', 'accreditations', 'fee_exclusions'];

    const handleEditInitialization = (type, rowIndex) => {
        let rowData;
        let formFieldsConfig = [];

        if (type === 'settings') {
            rowData = globalSettingsData[rowIndex];
            const isSettingKeyWithLimitedValues = settingKeysWithLimitedValues[rowData[settingKeyColIndex]];

            if (isSettingKeyWithLimitedValues) {
                formFieldsConfig = [
                    { id: settingKeyFormFieldId, type: 'text', name: 'setting_key', label: 'Setting Key', required: true, value: rowData[settingKeyColIndex], defaultValue: rowData[settingKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Setting Key', readOnlyField: true, httpName: 'setting-key'},
                    { id: settingValFormFieldId, type: 'select', name: 'val', label: 'Value', required: true, value: '', defaultValue: rowData[settingValColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Value', choices: isSettingKeyWithLimitedValues, httpName: 'setting-value'},
                    { id: settingIsEncryptedFormFieldId, type: 'select', name: 'is_encrypted', label: 'Is Encrypted', required: true, choices: ['Yes', 'No'], defaultValue: rowData[settingIsEncryptedColIndex], value: '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Is Encrypted', httpName: 'setting-is-encrypted'},
                    { id: settingDescriptionFormFieldId, type: 'textarea', name: 'description', label: 'Description', required: false, value: '', defaultValue: rowData[settingDescriptionColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Description', httpName: 'setting-description'}
                ];
            } else {

                formFieldsConfig = [
                    { id: settingKeyFormFieldId, type: 'text', name: 'setting_key', label: 'Setting Key', required: true, value: rowData[settingKeyColIndex], defaultValue: rowData[settingKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Setting Key', readOnlyField: true, httpName: 'setting-key'},
                    { id: settingValFormFieldId, type: 'text', name: 'val', label: 'Value', required: true, value: '', defaultValue: rowData[settingValColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Value', httpName: 'setting-value'},
                    { id: settingIsEncryptedFormFieldId, type: 'select', name: 'is_encrypted', label: 'Is Encrypted', required: true, choices: ['Yes', 'No'], defaultValue: rowData[settingIsEncryptedColIndex], value: '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Is Encrypted', httpName: 'setting-is-encrypted'},
                    { id: settingDescriptionFormFieldId, type: 'textarea', name: 'description', label: 'Description', required: false, value: '', defaultValue: rowData[settingDescriptionColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Description', httpName: 'setting-description'}
                ];
            }
        } else if (type === 'departments') {
            rowData = departmentsData[rowIndex];
            formFieldsConfig = [
                { id: departmentKeyFormFieldId, type: 'text', name: 'dept_key', label: 'Department Key', required: true, value: rowData[departmentKeyColIndex], defaultValue: rowData[departmentKeyColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Department Key', readOnlyField: true, httpName: 'department-key' },
                { id: departmentNameEnFormFieldId, type: 'text', name: 'name_en', label: 'Name (EN)', required: true, value: '', defaultValue: rowData[departmentNameEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (EN)', httpName: 'department-name-en' },
                { id: departmentNameArFormFieldId, type: 'text', name: 'name_ar', label: 'Name (AR)', required: true, value: '', defaultValue: rowData[departmentNameArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (AR)', lang: 'ar', httpName: 'department-name-ar' },
                { id: departmentContactNumberFormFieldId, type: 'text', name: 'contact_number', label: 'Contact Number', required: true, value: '', defaultValue: rowData[departmentContactNumberColIndex], widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: "Contact Number (Do not add a '+' at the beginning and always start with 20 for this work correctly in WhatsApp api)", httpName: 'department-contact-number' },
                { id: departmentIsAcademicFormFieldId, type: 'select', name: 'is_academic', label: 'Is Academic', required: true, choices: ['Yes', 'No'], defaultValue: rowData[departmentIsAcademicColIndex], value: '', widthOfField: 1, labelOutside: true, labelOnTop: true, displayLabel: 'Is Academic', httpName: 'department-is-academic' },
            ];
        } else if (type === 'stages') {
            rowData = stagesData[rowIndex];
            formFieldsConfig = [
                { id: stageKeyFormFieldId, type: 'text', name: 'stage_key', label: 'Stage Key', required: true, value: rowData[stageKeyColIndex], defaultValue: rowData[stageKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Stage Key', readOnlyField: true, httpName: 'stage-key'  },
                { id: stageDeptKeyFormFieldId, type: 'text', name: 'dept_key', label: 'Department Key', required: true, value: rowData[stageDeptKeyColIndex], defaultValue: rowData[stageDeptKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Department Key', readOnlyField: true, httpName: 'department-key'  },
                { id: stageSectionKeyFormFieldId, type: 'select', name: 'section_key', label: 'Section Key', required: true, value: '', defaultValue: rowData[stageSectionKeyColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Section Key', httpName: 'section-key', choices: ['early_stg', 'nat_kg', 'nat_jr', 'nat_mid', 'nat_sr', 'brit_fs', 'brit_prim', 'brit_mid', 'brit_sec', 'am_kg', 'am_elem', 'am_mid', 'am_high']  },
                { id: stageSectionTitleEnFormFieldId, type: 'text', name: 'section_title_en', label: 'Section Title (EN)', required: true, value: '', defaultValue: rowData[stageSectionTitleEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Section Title (EN)', httpName: 'stage-section-title-en' },
                { id: stageSectionTitleArFormFieldId, type: 'text', name: 'section_title_ar', label: 'Section Title (AR)', required: true, value: '', defaultValue: rowData[stageSectionTitleArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Section Title (AR)', lang: 'ar', httpName: 'stage-section-title-ar' },
                { id: stageNameEnFormFieldId, type: 'text', name: 'name_en', label: 'Name (EN)', required: true, value: '', defaultValue: rowData[stageNameEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (EN)', httpName: 'stage-name-en'    },
                { id: stageNameArFormFieldId, type: 'text', name: 'name_ar', label: 'Name (AR)', required: true, value: '', defaultValue: rowData[stageNameArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Name (AR)', lang: 'ar', httpName: 'stage-name-ar' },
                { id: stageAgeEnFormFieldId, type: 'text', name: 'age_en', label: 'Age (EN)', required: true, value: '', defaultValue: rowData[stageAgeEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Age (EN)', httpName: 'stage-age-en' },
                { id: stageAgeArFormFieldId, type: 'text', name: 'age_ar', label: 'Age (AR)', required: true, value: '', defaultValue: rowData[stageAgeArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Age (AR)', lang: 'ar', httpName: 'stage-age-ar' },
                { id: stageIsOfferedFormFieldId, type: 'select', name: 'is_offered', label: 'Is Offered', required: true, choices: ['Yes', 'No'], defaultValue: rowData[stageIsOfferedColIndex], value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Is Offered', httpName: 'stage-is-offered' },
                { id: stageTuitionFeesFormFieldId, type: 'number', name: 'tuition_fees', label: 'Tuition Fees', required: true, value: '', defaultValue: rowData[stageTuitionFeesColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Tuition Fees', minimumValue: 1, maximumValue: 1000000000, httpName: 'stage-tuition-fees' },
            ];
        } else if (type === 'profile') {
            rowData = profileData[rowIndex];
            formFieldsConfig = [
                { id: profileKeyFormFieldId, type: 'text', name: 'profile_key', label: 'Profile Key', required: true, value: rowData[profileKeyColIndex], defaultValue: rowData[profileKeyColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Profile Key', readOnlyField: true, httpName: 'profile-key' },
                { id: profileCategoryFormFieldId, type: 'select', name: 'category', label: 'Category', required: true, choices: profileCategories, defaultValue: rowData[profileCategoryColIndex], value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Category', httpName: 'profile-category' },
                { id: profileValueEnFormFieldId, type: 'textarea', name: 'value_en', label: 'Value (EN)', required: false, value: '', defaultValue: rowData[profileValueEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Value (EN)', httpName: 'profile-value-en' },
                { id: profileValueArFormFieldId, type: 'textarea', name: 'value_ar', label: 'Value (AR)', required: false, value: '', defaultValue: rowData[profileValueArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Value (AR)', lang: 'ar', httpName: 'profile-value-ar' },
                { id: profileNoteEnFormFieldId, type: 'textarea', name: 'note_en', label: 'Note (EN)', required: false, value: '', defaultValue: rowData[profileNoteEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Note (EN)', httpName: 'profile-note-en' },
                { id: profileNoteArFormFieldId, type: 'textarea', name: 'note_ar', label: 'Note (AR)', required: false, value: '', defaultValue: rowData[profileNoteArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Note (AR)', lang: 'ar', httpName: 'profile-note-ar' },
            ];
        } else if (type === 'formEmails') {
            rowData = formEmailsData[rowIndex];
            formFieldsConfig = [
                { id: formEmailLabelFormFieldId, type: 'text', name: 'label', label: 'Form', required: true, value: '', defaultValue: rowData[formEmailLabelColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Form', httpName: 'form-email-label' },
                { id: formEmailRecipientFormFieldId, type: 'text', name: 'recipient_email', label: 'Recipient Email', required: true, value: '', defaultValue: rowData[formEmailRecipientColIndex], widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Recipient Email', httpName: 'form-email-recipient' },
                { id: formEmailIsActiveFormFieldId, type: 'select', name: 'is_active', label: 'Is Active', required: true, choices: ['Yes', 'No'], defaultValue: rowData[formEmailIsActiveColIndex], value: '', widthOfField: 3, labelOutside: true, labelOnTop: true, displayLabel: 'Is Active', httpName: 'form-email-is-active' },
            ];
        } else if (type === 'policies') {
            rowData = policiesData[rowIndex];
            formFieldsConfig = [
                { id: policyKeyFormFieldId, type: 'text', name: 'item_key', label: 'Item Key', required: true, value: rowData[policyKeyColIndex], defaultValue: rowData[policyKeyColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Item Key', readOnlyField: true, httpName: 'policy-item-key' },
                { id: policyGroupKeyFormFieldId, type: 'select', name: 'group_key', label: 'Group Key', required: true, choices: policyGroupKeys, defaultValue: rowData[policyGroupKeyColIndex], value: '', widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Group Key', httpName: 'policy-group-key' },
                { id: policyTitleEnFormFieldId, type: 'text', name: 'title_en', label: 'Title (EN)', required: true, value: '', defaultValue: rowData[policyTitleEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (EN)', httpName: 'policy-title-en' },
                { id: policyTitleArFormFieldId, type: 'text', name: 'title_ar', label: 'Title (AR)', required: true, value: '', defaultValue: rowData[policyTitleArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Title (AR)', lang: 'ar', httpName: 'policy-title-ar' },
                { id: policyDetailEnFormFieldId, type: 'textarea', name: 'detail_en', label: 'Detail (EN)', required: false, value: '', defaultValue: rowData[policyDetailEnColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Detail (EN)', httpName: 'policy-detail-en' },
                { id: policyDetailArFormFieldId, type: 'textarea', name: 'detail_ar', label: 'Detail (AR)', required: false, value: '', defaultValue: rowData[policyDetailArColIndex], widthOfField: 2, labelOutside: true, labelOnTop: true, displayLabel: 'Detail (AR)', lang: 'ar', httpName: 'policy-detail-ar' },
            ];
        }

        setCurrentEditType(type);
        setEditFormFields(formFieldsConfig);
        setShowEditModal(true);
        setIndexOfRowToEdit(rowIndex);
    };

    const handleSyncInfoSystemSubmit = async () => {
        try {
            setIsLoading(true);
            let payload = {};

            payload.is_development = isDevelopment();
            payload.update_static_content_only = true;
            const result = await updateInfoSystemData(payload);

            if (result && result.success) {
                return true;
            } else {
                throw new Error(result.message || result);
            }
        } catch (error) {
            setSyncConfigDataError(error.message || 'An error occurred while editing the info system data.');

            setTimeout(() => {
                setSyncConfigDataError(null);
            }, msgTimeout);
        } finally {
            setIsLoading(false);
        }
    }

    const handleEditInfoSystemSubmit = async (formData) => {
        setIsLoading(true);

        try {
            const formDataJson = Object.fromEntries(formData.entries());
            let payload = {};

            if (currentEditType === 'settings') {
                payload = {
                    settings: [{
                        setting_key: globalSettingsData[indexOfRowToEdit][settingKeyColIndex],
                        val: formDataJson[`field_${settingValFormFieldId}`],
                        is_encrypted: formDataJson[`field_${settingIsEncryptedFormFieldId}`],
                        description: formDataJson[`field_${settingDescriptionFormFieldId}`] || '',
                        sort_order: Number(globalSettingsData[indexOfRowToEdit][settingSortOrderColIndex])
                    }]
                };
            } else if (currentEditType === 'departments') {
                payload = {
                    departments: [{
                        dept_key: departmentsData[indexOfRowToEdit][departmentKeyColIndex],
                        name_en: formDataJson[`field_${departmentNameEnFormFieldId}`],
                        name_ar: formDataJson[`field_${departmentNameArFormFieldId}`],
                        contact_number: formDataJson[`field_${departmentContactNumberFormFieldId}`],
                        is_academic: formDataJson[`field_${departmentIsAcademicFormFieldId}`],
                        sort_order: Number(departmentsData[indexOfRowToEdit][departmentSortOrderColIndex])
                    }]
                };
            } else if (currentEditType === 'stages') {
                payload = {
                    stages: [{
                        stage_key: stagesData[indexOfRowToEdit][stageKeyColIndex],
                        dept_key: stagesData[indexOfRowToEdit][stageDeptKeyColIndex],
                        section_key: formDataJson[`field_${stageSectionKeyFormFieldId}`],
                        section_title_en: formDataJson[`field_${stageSectionTitleEnFormFieldId}`],
                        section_title_ar: formDataJson[`field_${stageSectionTitleArFormFieldId}`],
                        name_en: formDataJson[`field_${stageNameEnFormFieldId}`],
                        name_ar: formDataJson[`field_${stageNameArFormFieldId}`],
                        is_offered: formDataJson[`field_${stageIsOfferedFormFieldId}`],
                        age_en: formDataJson[`field_${stageAgeEnFormFieldId}`],
                        age_ar: formDataJson[`field_${stageAgeArFormFieldId}`],
                        tuition_fees: Number(formDataJson[`field_${stageTuitionFeesFormFieldId}`]),
                        sort_order: Number(stagesData[indexOfRowToEdit][stageSortOrderColIndex])
                    }]
                };
            } else if (currentEditType === 'profile') {
                payload = {
                    profile: [{
                        profile_key: profileData[indexOfRowToEdit][profileKeyColIndex],
                        category: formDataJson[`field_${profileCategoryFormFieldId}`],
                        value_en: formDataJson[`field_${profileValueEnFormFieldId}`] || '',
                        value_ar: formDataJson[`field_${profileValueArFormFieldId}`] || '',
                        note_en: formDataJson[`field_${profileNoteEnFormFieldId}`] || '',
                        note_ar: formDataJson[`field_${profileNoteArFormFieldId}`] || '',
                        sort_order: Number(profileData[indexOfRowToEdit][profileSortOrderColIndex])
                    }]
                };
            } else if (currentEditType === 'formEmails') {
                payload = {
                    formEmails: [{
                        form_key: formEmailsData[indexOfRowToEdit][formEmailKeyColIndex],
                        label: formDataJson[`field_${formEmailLabelFormFieldId}`],
                        recipient_email: formDataJson[`field_${formEmailRecipientFormFieldId}`],
                        is_active: formDataJson[`field_${formEmailIsActiveFormFieldId}`],
                        sort_order: Number(formEmailsData[indexOfRowToEdit][formEmailSortOrderColIndex])
                    }]
                };
            } else if (currentEditType === 'policies') {
                payload = {
                    policies: [{
                        item_key: policiesData[indexOfRowToEdit][policyKeyColIndex],
                        group_key: formDataJson[`field_${policyGroupKeyFormFieldId}`],
                        title_en: formDataJson[`field_${policyTitleEnFormFieldId}`],
                        title_ar: formDataJson[`field_${policyTitleArFormFieldId}`],
                        detail_en: formDataJson[`field_${policyDetailEnFormFieldId}`] || '',
                        detail_ar: formDataJson[`field_${policyDetailArFormFieldId}`] || '',
                        sort_order: Number(policiesData[indexOfRowToEdit][policySortOrderColIndex])
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

    const getTableModuleHeaderElements = useMemo(() => {
        return [
            (
                <button key={1} onClick={reloadData} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Reload Table Data'}
                </button>
            ),
            (
                <button key={2} onClick={async () => await handleSyncInfoSystemSubmit()} disabled={isLoading}>
                    {isLoading ? 'Syncing...' : 'Trigger Server Static Data Update'}
                </button>
            ),
            syncConfigDataError && (
                <p key={3} className={'admin-table-header-button-error'}>
                    {syncConfigDataError}
                </p>
            )
        ];
    }, [syncConfigDataError]);

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
                   headerModuleElements={getTableModuleHeaderElements}
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
                   headerModuleElements={getTableModuleHeaderElements}
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
                   headerModuleElements={getTableModuleHeaderElements}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   currencyColumns={[
                       'Tuition Fees'
                   ]}
                   filterableColumns={[
                       'Section Key',
                       'Department Key',
                       'Is Offered'
                   ]}
                   currencySymbols={['EGP']}
                   currencySymbolPositions={['right-space']}
            />
        </div>
    );

    const SchoolProfile = () => (
        <div className="admin-page-tab-content">
            <Table tableData={profileData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => handleEditInitialization('profile', rowIndex)}
                   isLoading={isLoading}
                   headerModuleElements={getTableModuleHeaderElements}
                   sortConfigParam={{column: 0, direction: 'ascending'}}
                   filterableColumns={[
                       'Category'
                   ]}
            />
        </div>
    );

    const PolicyItems = () => (
        <div className="admin-page-tab-content">
            <Table tableData={policiesData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => handleEditInitialization('policies', rowIndex)}
                   isLoading={isLoading}
                   headerModuleElements={getTableModuleHeaderElements}
                   sortConfigParam={{column: 2, direction: 'ascending'}}
                   filterableColumns={[
                       'Group Key'
                   ]}
            />
        </div>
    );

    const FormEmails = () => (
        <div className="admin-page-tab-content">
            <Table tableData={formEmailsData}
                   scrollable={true}
                   compact={true}
                   allowHideColumns={true}
                   allowSticky={true}
                   forceEnglishTable={true}
                   allowEditEntryOption={true}
                   onEditEntryOption={(rowIndex) => handleEditInitialization('formEmails', rowIndex)}
                   isLoading={isLoading}
                   headerModuleElements={getTableModuleHeaderElements}
                   sortConfigParam={{column: 1, direction: 'ascending'}}
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
        {
            id: 3,
            label: 'School Profile',
            component: SchoolProfile
        },
        {
            id: 4,
            label: 'Policy Items',
            component: PolicyItems
        },
        {
            id: 5,
            label: 'Form Emails',
            component: FormEmails
        },
    ];

    return (
        <>



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

                        { (currentEditType === 'settings') && (
                            <p className={"general-large-admin-action-modal-content-note"}>
                                Note: Do not edit the info system settings data values unless you know what you are doing.
                            </p>
                        )}

                        { (currentEditType === 'departments' || currentEditType === 'stages') && (
                            <p className={"general-large-admin-action-modal-content-note"}>
                                Note: Titles & names should preferably be under 20 characters (Spaces are characters).
                            </p>
                        )}

                        { (currentEditType === 'profile' || currentEditType === 'policies') && (
                            <p className={"general-large-admin-action-modal-content-note"}>
                                Note: These values are read by Siri, Gemini and the chat bot.
                            </p>
                        )}

                        {currentEditType === 'formEmails' && (
                            <p className={"general-large-admin-action-modal-content-note"}>
                                Note: This is the mailbox that receives submissions from this form. Setting Is Active to No
                                sends them to the default inquiries mailbox instead.
                            </p>
                        )}


                        {currentEditType === 'stages' && (
                            <p className={"general-large-admin-action-modal-content-note"}>
                                Note: You should not assign more than 6 stages to the same section key.
                            </p>
                        )}

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
                                  formFooterButtonsAreOutside={true}
                                  footerButtonsPortalTarget={editModalFooterButtonsRef}
                            />
                        )}
                    </div>

                    <div className={"general-large-admin-action-modal-footer"}>
                        <button className={"add-admin-user-modal-form-cancel-button"} onClick={cancelEditModal}>
                            Cancel
                        </button>
                        <div ref={editModalFooterButtonsRef} className="modal-footer-buttons-portal-target"/>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

export default InfoSystemManagement;
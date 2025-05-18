import PropTypes from 'prop-types';
import {useEffect, useState } from "react";
import {Fragment} from "react";
import '../styles/Form.css'
import jsPDF from 'jspdf';
import {createRef} from "react";
import { v4 as uuidv4 } from 'uuid';
import {useSpring, animated} from "react-spring";
import { useCallback } from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {useFormCache} from "../services/Utils.jsx";
import {msgTimeout} from "../services/Utils.jsx";
import {submitFormRequest} from "../services/Utils.jsx";

function Form({
                  fields,
                  mailTo,
                  sendPdf,
                  formTitle,
                  lang,
                  captchaLength,
                  noInputFieldsCache,
                  noCaptcha,
                  hasDifferentOnSubmitBehaviour,
                  differentOnSubmitBehaviour,
                  noClearOption,
                  hasDifferentSubmitButtonText,
                  differentSubmitButtonText,
                  centerSubmitButton,
                  easySimpleCaptcha,
                  fullMarginField,
                  hasSetSubmittingLocal,
                  setSubmittingLocal,
                  resetFormFromParent,
                  setResetForFromParent,
                  dynamicSections = [],
                  pedanticIds,
                    formInModalPopup,
                    setShowFormModalPopup,
                  formIsReadOnly,
                footerButtonsSpaceBetween,
                  switchFooterButtonsOrder
              }) {

    const [submitting, setSubmitting] = useState(false);
    const [generalFormError, setGeneralFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [dynamicFields, setDynamicFields] = useState(fields);
    const captchaMaxLength = easySimpleCaptcha ? 4 : 7;
    const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz0123456789@#$%&';
    const [refs, setRefs] = useState({});
    const [fileInputs, setFileInputs] = useState({});
    const [showSelectDateModal, setShowSelectDateModal] = useState(false);
    const [selectedDateDay, setSelectedDateDay] = useState('');
    const [selectedDateMonth, setSelectedDateMonth] = useState('');
    const [selectedDateYear, setSelectedDateYear] = useState('');
    const [selectedDateFieldID, setSelectedDateFieldID] = useState(null);
    const [selectedDateFieldLabel, setSelectedDateFieldLabel] = useState('');
    const [selectedDateError, setSelectedDateError] = useState('');
    const animateDateModal = useSpring({
        opacity: showSelectDateModal ? 1 : 0,
        transform: showSelectDateModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    const [sectionInstances, setSectionInstances] = useState({});
    const [nextIdCounter, setNextIdCounter] = useState(fields.length + 1);
    const [showPasswords, setShowPasswords] = useState(false);
    const { loadCachedValues, saveToCache, clearCache } = useFormCache(formTitle, fields);
    const [prefilledInitialized, setPrefilledInitialized] = useState(false);
    const [fieldValues, setFieldValues] = useState({});


    useEffect(() => {
        const initialSectionInstances = {};
        dynamicSections.forEach(section => {
            initialSectionInstances[section.sectionId] = {
                count: 0,
                instances: [],
                nextInsertPosition: section.startAddingFieldsFromId
            };
        });
        setSectionInstances(initialSectionInstances);
    }, []);

    useEffect(() => {
        const newRefs = {};
        dynamicFields.forEach(field => {
            if (!refs[field.id]) {
                newRefs[field.id] = createRef();
            } else {
                newRefs[field.id] = refs[field.id];
            }
        });
        setRefs(newRefs);
    }, [dynamicFields]);

    useEffect(() => {
        if (Object.keys(sectionInstances).length > 0 && !prefilledInitialized) {
            let tempNextIdCounter = nextIdCounter;
            let tempDynamicFields = [...dynamicFields];
            let tempSectionInstances = {...sectionInstances};
            let tempRefs = {...refs};

            dynamicSections.forEach(section => {
                if (section.existingFilledSectionInstances && section.existingFilledSectionInstances.length > 0) {
                    const sectionId = section.sectionId;

                    section.existingFilledSectionInstances.forEach(prefilledFields => {
                        const currentSectionState = tempSectionInstances[sectionId];

                        if (section.maxSectionInstancesToAdd !== -1 &&
                            currentSectionState.count >= section.maxSectionInstancesToAdd) {
                            return;
                        }

                        const instanceId = `${sectionId}_${currentSectionState.count}`;

                        let insertionIndex;
                        if (currentSectionState.instances.length === 0) {
                            const startFieldIndex = tempDynamicFields.findIndex(
                                field => field.id === section.startAddingFieldsFromId
                            );
                            insertionIndex = startFieldIndex !== -1 ? startFieldIndex + 1 : tempDynamicFields.length;
                        } else {
                            insertionIndex = currentSectionState.nextInsertPosition;
                        }

                        const newFields = prefilledFields.map((field, index) => {
                            const newId = tempNextIdCounter++;
                            return {
                                ...field,
                                id: newId,
                                originalId: field.id || newId,
                                instanceId: instanceId
                            };
                        });

                        const controlFieldId = tempNextIdCounter++;
                        const controlField = {
                            id: controlFieldId,
                            type: 'control',
                            instanceId: instanceId,
                            sectionId: sectionId,
                            isControl: true,
                            httpName: `control_${instanceId}`,
                            label: `Control ${instanceId}`
                        };

                        const allNewFields = [...newFields, controlField];

                        tempDynamicFields.splice(insertionIndex, 0, ...allNewFields);

                        allNewFields.forEach(field => {
                            tempRefs[field.id] = createRef();
                        });

                        const newInstance = {
                            instanceId,
                            fieldIds: allNewFields.map(field => field.id),
                            insertedAtIndex: insertionIndex
                        };


                        tempSectionInstances = {
                            ...tempSectionInstances,
                            [sectionId]: {
                                count: currentSectionState.count + 1,
                                instances: [...currentSectionState.instances, newInstance],
                                nextInsertPosition: insertionIndex + allNewFields.length
                            }
                        };
                    });
                }
            });

            setNextIdCounter(tempNextIdCounter);
            setDynamicFields(tempDynamicFields);
            setSectionInstances(tempSectionInstances);
            setRefs(tempRefs);
            setPrefilledInitialized(true);
        }
    }, [sectionInstances, prefilledInitialized, dynamicSections, dynamicFields, nextIdCounter, refs]);


    const processFieldRules = useCallback((currentFields, field, value) => {
        if (field.rules) {
            const rule = field.rules.find(r => r.value === value);

            if (rule) {
                const newFields = currentFields.filter(f => {
                    let keep = true;
                    field.rules.forEach(rule => {
                        rule.ruleResult.forEach(newField => {
                            if (newField.name === f.name) {
                                keep = false;
                            } else if (newField.rules) {
                                newField.rules.forEach(subRule => {
                                    subRule.ruleResult.forEach(subNewField => {
                                        if (subNewField.name === f.name) {
                                            keep = false;
                                        }
                                    });
                                });
                            }
                        });
                    });
                    return keep;
                });

                const currentIndex = newFields.findIndex(f => f.name === field.name);

                rule.ruleResult.forEach(newField => {
                    newFields.splice(currentIndex + 1, 0, newField);
                });

                return newFields;
            } else {
                return currentFields.filter(f => {
                    let keep = true;
                    field.rules.forEach(rule => {
                        rule.ruleResult.forEach(newField => {
                            if (newField.name === f.name) {
                                keep = false;
                            } else if (newField.rules) {
                                newField.rules.forEach(subRule => {
                                    subRule.ruleResult.forEach(subNewField => {
                                        if (subNewField.name === f.name) {
                                            keep = false;
                                        }
                                    });
                                });
                            }
                        });
                    });
                    return keep;
                });
            }
        }
        return currentFields;
    }, []);

    useEffect(() => {
        if(noInputFieldsCache) {
            return;
        }

        let cachedValues = loadCachedValues();

        const initializeForm = () => {
            let currentFields = [...fields];

            Object.entries(cachedValues).forEach(([fieldId, value]) => {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = value;
                }
            });

            fields.forEach(field => {
                const cachedValue = cachedValues[field.id];
                if (field.rules && cachedValue) {
                    currentFields = processFieldRules(currentFields, field, cachedValue);
                }
            });

            setDynamicFields(currentFields);
        };

        initializeForm();
    }, [fields, loadCachedValues, processFieldRules, noInputFieldsCache]);

    const resetFormCompletely = () => {
        setDynamicFields([...fields]);
        setFileInputs({});
        setCaptchaValue(generateCaptcha());
        setEnteredCaptcha('');


        setFieldValues({});

        setSectionInstances(prevState => {
            const resetState = {};

            dynamicSections.forEach(section => {
                resetState[section.sectionId] = {
                    count: 0,
                    instances: [],
                    nextInsertPosition: section.startAddingFieldsFromId
                };
            });

            return resetState;
        });

        if (prefilledInitialized) {
            setPrefilledInitialized(false);
        }

        setNextIdCounter(fields.length + 1);
        setGeneralFormError('');
        setSuccessMessage('');

        if (hasSetSubmittingLocal) {
            setSubmittingLocal(false);
        }

        setTimeout(() => {
            fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = '';
                }
            });
        }, 0);
    };

    function resetForm() {
        resetFormCompletely();
        clearCache();
    }

    function generateCaptcha() {
        let captcha = '';
        for (let i = 0; i < captchaMaxLength; i++) {
            captcha += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        return captcha;
    }

    useEffect(() => {
        if (resetFormFromParent) {
            resetFormCompletely();

            if (setResetForFromParent) {
                setResetForFromParent(false);
            }
        }
    }, [resetFormFromParent, setResetForFromParent, fields.length, resetFormCompletely]);

    const [captchaValue, setCaptchaValue] = useState(generateCaptcha());
    const [enteredCaptcha, setEnteredCaptcha] = useState('');

    const findInsertionIndex = (sectionId) => {
        const section = dynamicSections.find(s => s.sectionId === sectionId);
        const sectionState = sectionInstances[sectionId];

        if (!section || !sectionState) {
            return -1;
        }

        if (sectionState.instances.length === 0) {
            const startFieldIndex = dynamicFields.findIndex(field => field.id === section.startAddingFieldsFromId);
            return startFieldIndex !== -1 ? startFieldIndex + 1 : dynamicFields.length;
        }

        const lastInstance = sectionState.instances[sectionState.instances.length - 1];
        const lastFieldId = Math.max(...lastInstance.fieldIds);
        const lastFieldIndex = dynamicFields.findIndex(field => field.id === lastFieldId);
        return lastFieldIndex !== -1 ? lastFieldIndex + 1 : dynamicFields.length;
    };

    const addSectionInstance = (sectionId) => {
        setSectionInstances(prevState => {
            const section = dynamicSections.find(s => s.sectionId === sectionId);
            if (!section) return prevState;
            const currentSectionState = prevState[sectionId];

            if (section.maxSectionInstancesToAdd !== -1 &&
                currentSectionState.count >= section.maxSectionInstancesToAdd) {
                return prevState;
            }

            const instanceId = `${sectionId}_${currentSectionState.instances.length}`;
            const insertionIndex = findInsertionIndex(sectionId);

            if (insertionIndex === -1) return prevState;

            const newFields = section.fieldsToAdd.map((field, index) => {
                return {
                    ...field,
                    id: nextIdCounter + index,
                    originalId: field.id,
                    instanceId: instanceId
                };
            });

            const controlField = {
                id: nextIdCounter + newFields.length,
                type: 'control',
                instanceId: instanceId,
                sectionId: sectionId,
                isControl: true,
                httpName: `control_${instanceId}`,
                label: `Control ${instanceId}`
            };

            const allNewFieldIds = new Set([
                ...newFields.map(f => f.id),
                controlField.id
            ]);

            const allNewFields = [...newFields, controlField];
            const updatedDynamicFields = [...dynamicFields];
            updatedDynamicFields.splice(insertionIndex, 0, ...allNewFields);

            const idMap = {};
            const normalizedFields = updatedDynamicFields.map((field, index) => {
                const newId = index + 1;
                if (field.id !== newId) {
                    idMap[field.id] = newId;
                    return { ...field, id: newId };
                }
                return field;
            });

            const updatedFieldValues = {...fieldValues};

            const existingFieldValues = {...fieldValues};

            normalizedFields.forEach(field => {
                const oldId = Object.entries(idMap).find(([_, newId]) => newId === field.id)?.[0];

                if (allNewFieldIds.has(parseInt(oldId))) {
                    delete updatedFieldValues[field.id];
                }
                else if (oldId && existingFieldValues[oldId] !== undefined) {
                    updatedFieldValues[field.id] = existingFieldValues[oldId];
                }
            });

            setFieldValues(updatedFieldValues);

            const newRefs = {...refs};
            normalizedFields.forEach(field => {
                if (allNewFields.some(newField => newField.id === field.id) || idMap[field.id]) {
                    newRefs[field.id] = createRef();
                }
            });

            setRefs(newRefs);
            setDynamicFields(normalizedFields);
            setNextIdCounter(normalizedFields.length + 1);

            const updatedInstances = currentSectionState.instances.map(instance => ({
                ...instance,
                fieldIds: instance.fieldIds.map(id => idMap[id] || id)
            }));

            const newInstanceFieldIds = allNewFields.map(field =>
                idMap[field.id] || field.id
            );

            return {
                ...prevState,
                [sectionId]: {
                    count: currentSectionState.instances.length + 1,
                    instances: [
                        ...updatedInstances,
                        {
                            instanceId: instanceId,
                            fieldIds: newInstanceFieldIds,
                            insertedAtIndex: insertionIndex
                        }
                    ],
                    nextInsertPosition: insertionIndex + allNewFields.length
                }
            };
        });
    };

    const removeSectionInstance = (sectionId, instanceId) => {
        setSectionInstances(prevState => {
            const currentSectionState = {...prevState[sectionId]};
            if (!currentSectionState) return prevState;

            const instanceIndex = currentSectionState.instances.findIndex(
                instance => instance.instanceId === instanceId
            );

            if (instanceIndex === -1) return prevState;

            const instanceToRemove = currentSectionState.instances[instanceIndex];
            const fieldsToRemove = instanceToRemove.fieldIds;

            const existingFieldValues = {...fieldValues};

            const updatedDynamicFields = dynamicFields.filter(
                field => !fieldsToRemove.includes(field.id)
            );

            const idMap = {};
            const normalizedFields = updatedDynamicFields.map((field, index) => {
                const newId = index + 1;
                if (field.id !== newId) {
                    idMap[field.id] = newId;
                    return { ...field, id: newId };
                }
                return field;
            });

            const updatedFieldValues = {};
            normalizedFields.forEach(field => {
                const oldId = field.id in idMap ? field.id :
                    Object.entries(idMap).find(([_, newId]) => newId === field.id)?.[0];

                if (oldId && existingFieldValues[oldId] !== undefined) {
                    updatedFieldValues[field.id] = existingFieldValues[oldId];
                }
            });

            setFieldValues(updatedFieldValues);

            const newRefs = {};
            normalizedFields.forEach(field => {
                if (refs[field.id]) {
                    newRefs[idMap[field.id] || field.id] = refs[field.id];
                } else {
                    newRefs[idMap[field.id] || field.id] = createRef();
                }
            });

            setRefs(newRefs);
            setDynamicFields(normalizedFields);
            setNextIdCounter(normalizedFields.length + 1);

            let updatedInstances = [...currentSectionState.instances];
            updatedInstances.splice(instanceIndex, 1);

            updatedInstances = updatedInstances.map((instance, index) => {
                const newInstanceId = `${sectionId}_${index}`;

                normalizedFields.forEach(field => {
                    if (field.instanceId === instance.instanceId) {
                        field.instanceId = newInstanceId;
                    }
                });

                const updatedFieldIds = instance.fieldIds
                    .filter(id => !fieldsToRemove.includes(id))
                    .map(id => idMap[id] || id);

                const removedFieldsBeforeThisInstance =
                    instanceToRemove.insertedAtIndex < instance.insertedAtIndex ?
                        fieldsToRemove.length : 0;

                return {
                    ...instance,
                    instanceId: newInstanceId,
                    fieldIds: updatedFieldIds,
                    insertedAtIndex: instance.insertedAtIndex - removedFieldsBeforeThisInstance
                };
            });

            let newNextInsertPosition;
            if (updatedInstances.length === 0) {
                const startField = dynamicSections.find(section => section.sectionId === sectionId);
                newNextInsertPosition = normalizedFields.findIndex(
                    field => field.id === startField.startAddingFieldsFromId
                ) + 1;

                if (newNextInsertPosition <= 0) {
                    newNextInsertPosition = normalizedFields.length;
                }
            } else {
                const lastInstance = updatedInstances[updatedInstances.length - 1];
                const lastFieldId = Math.max(...lastInstance.fieldIds);
                const lastFieldIndex = normalizedFields.findIndex(field => field.id === lastFieldId);
                newNextInsertPosition = lastFieldIndex !== -1 ? lastFieldIndex + 1 : normalizedFields.length;
            }

            return {
                ...prevState,
                [sectionId]: {
                    ...currentSectionState,
                    count: updatedInstances.length,
                    instances: updatedInstances,
                    nextInsertPosition: newNextInsertPosition
                }
            };
        });
    };

    const renderAddSectionButton = (section) => {
        const sectionState = sectionInstances[section.sectionId];
        if (!sectionState) return null;

        if (section.maxSectionInstancesToAdd !== -1 &&
            sectionState.count >= section.maxSectionInstancesToAdd) {
            return null;
        }

        return (
            <button
                type="button"
                className="add-section-button"
                onClick={() => addSectionInstance(section.sectionId)}
                disabled={submitting}
            >
                {section.addButtonText || `Add ${section.sectionId}`}
            </button>
        );
    };

    const renderControlField = (field) => {
        if (!field.isControl) return null;
        const section = dynamicSections.find(s => s.sectionId === field.sectionId);

        return (
            <div className="dynamic-section-control">
                <button
                    type="button"
                    className="remove-section-button"
                    onClick={() => removeSectionInstance(field.sectionId, field.instanceId)}
                    disabled={submitting}
                >
                    {section?.removeButtonText || `Remove`}
                </button>
            </div>
        );
    };

    const onChange = (e, field) => {
        const maxSizeInBytes = 2 * 1024 * 1024;
        const value = (field.type === 'radio' || field.type === 'checkbox') ? e.target.checked : e.target.value;

        if (field.type === 'file' && e.target.files[0].size > maxSizeInBytes) {
            e.target.setCustomValidity('File size must be less than 2MB');
        } else if (field.type === 'file' && !field.allowedFileTypes.includes(e.target.files[0].type)) {
            e.target.setCustomValidity(`File type must be one of the following: ${field.allowedFileTypes.join(', ')}`);
        } else if (field.type === 'file') {
            const file = e.target.files[0];
            e.target.setCustomValidity('');
            setGeneralFormError('');
            setSuccessMessage('');
            setFileInputs(prev => ({...prev, [field.id]: file}));
            field.file = file;
        } else {
            if (field.regex && !new RegExp(field.regex).test(value)) {
                e.target.setCustomValidity(field.errorMsg);
                e.target.reportValidity();
            } else {
                e.target.setCustomValidity('');
                setGeneralFormError('');
                setSuccessMessage('');

                setFieldValues(prev => ({
                    ...prev,
                    [field.id]: value,
                    ...(field.originalId ? { [field.originalId]: value } : {})
                }));

                field.value = value;

                if(!noInputFieldsCache) {
                    saveToCache(field, value);
                }
            }

            const newFields = processFieldRules(dynamicFields, field, value);
            setDynamicFields(newFields);
        }
    }

    const renderFieldBasedOnType = (field) => {
        if (field.type === 'control' && field.isControl) {
            return (
                <div className="dynamic-section-instance" key={field.id}>
                    {renderControlField(field)}
                </div>
            );
        }

        return (
            <Fragment key={`${field.id}-${field.instanceId || 'base'}`}>
                { (field.labelOutside && !field.labelOnTop) && <label htmlFor={field.id} className={ "form-label-outside"}>
                    {field.label+ (field.required ? '*' : '')}
                </label>}

                {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'time') && (
                    field.dontLetTheBrowserSaveField ? (
                         (field.labelOutside && field.labelOnTop) ? (
                             <div className={`field-with-label-on-top ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                                <label htmlFor={field.id} className={ "form-label-outside"}>
                                    {field.label+ (field.required ? '*' : '')}
                                </label>
                                <input
                                    type={field.type}
                                    id={field.id}
                                    name={'hidden'}
                                    required={field.required}
                                    placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                    disabled={submitting || field.readOnlyField}
                                    onChange={(e) => onChange(e, field)}
                                    autoComplete="new-password"
                                    data-lpignore="true"
                                    readOnly={field.readOnlyField ? true : false}
                                    className={`text-form-field ${field.readOnlyField ? 'read-only-field' : ''}`}
                                    data-instance-id={field.instanceId || ''}
                                    value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                        fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                                    min={(field.type === 'number' && field.minimumValue) ? field.minimumValue : ''}
                                    max={(field.type === 'number' && field.maximumValue) ? field.maximumValue : ''}
                                />
                             </div>

                        ) : (
                             <input
                                 type={field.type}
                                 id={field.id}
                                 name={'hidden'}
                                 required={field.required}
                                 placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                 disabled={submitting || field.readOnlyField}
                                 onChange={(e) => onChange(e, field)}
                                 autoComplete="new-password"
                                 data-lpignore="true"
                                 readOnly={field.readOnlyField ? true : false}
                                 className={`text-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}  ${field.readOnlyField ? 'read-only-field' : ''}`}
                                 data-instance-id={field.instanceId || ''}
                                 value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                     fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                                 min={(field.type === 'number' && field.minimumValue) ? field.minimumValue : ''}
                                 max={(field.type === 'number' && field.maximumValue) ? field.maximumValue : ''}
                             />
                         )

                    ) : (
                        (field.labelOutside && field.labelOnTop) ? (
                        <div className={`field-with-label-on-top ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                            <label htmlFor={field.id} className={ "form-label-outside"}>
                                {field.label+ (field.required ? '*' : '')}
                            </label>
                            <input
                                type={ field.type}
                                id={field.id}
                                name={field.httpName}
                                required={field.required}
                                placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                disabled={submitting || field.readOnlyField}
                                onChange={(e) => onChange(e, field)}
                                readOnly={field.readOnlyField ? true : false}
                                className={`text-form-field ${field.readOnlyField ? 'read-only-field' : ''}`}
                                data-instance-id={field.instanceId || ''}
                                value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                    fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                                min={(field.type === 'number' && field.minimumValue) ? field.minimumValue : ''}
                                max={(field.type === 'number' && field.maximumValue) ? field.maximumValue : ''}
                            />
                        </div>
                        ) : (
                            <input
                                type={ field.type}
                                id={field.id}
                                name={field.httpName}
                                required={field.required}
                                placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                disabled={submitting || field.readOnlyField}
                                onChange={(e) => onChange(e, field)}
                                readOnly={field.readOnlyField ? true : false}
                                className={`text-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'} ${field.readOnlyField ? 'read-only-field' : ''}`}
                                data-instance-id={field.instanceId || ''}
                                value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                    fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                                min={(field.type === 'number' && field.minimumValue) ? field.minimumValue : ''}
                                max={(field.type === 'number' && field.maximumValue) ? field.maximumValue : ''}
                            />
                        )
                    )
                )}

                {field.type === 'password' && (
                    (field.labelOutside && field.labelOnTop) ? (
                        <div className={`field-with-label-on-top ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                            <label htmlFor={field.id} className={"form-label-outside"}>
                                {field.label + (field.required ? '*' : '')}
                            </label>
                            <div className="password-field-wrapper">
                                <input
                                    type={field.dontLetTheBrowserSaveField ? "text" :  showPasswords ? "text" : "password"}
                                    id={field.id}
                                    name={field.dontLetTheBrowserSaveField ?  'hidden' : field.httpName}
                                    required={field.required}
                                    placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                    disabled={submitting || field.readOnlyField}
                                    onChange={(e) => onChange(e, field)}
                                    autoComplete={field.dontLetTheBrowserSaveField ? "new-password" : ""}
                                    data-lpignore={field.dontLetTheBrowserSaveField ? "true" : ""}
                                    className={`text-form-field ${(!showPasswords && field.dontLetTheBrowserSaveField) ? 'txtPassword' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
                                    data-instance-id={field.instanceId || ''}
                                    readOnly={field.readOnlyField ? true : false}
                                    value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                        fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                                />
                                <button
                                    type="button"
                                    className="toggle-password-visibility"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    aria-label={showPasswords ? "Hide password" : "Show password"}
                                    tabIndex="-1"
                                >
                                    {showPasswords ? <VisibilityOffIcon/> :  <VisibilityIcon/>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`password-field-wrapper ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                            <input
                                type={field.dontLetTheBrowserSaveField ? "text" :  showPasswords ? "text" : "password"}
                                id={field.id}
                                name={field.dontLetTheBrowserSaveField ?  'hidden' : field.httpName}
                                required={field.required}
                                placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                disabled={submitting || field.readOnlyField}
                                readOnly={field.readOnlyField ? true : false}
                                onChange={(e) => onChange(e, field)}
                                autoComplete={field.dontLetTheBrowserSaveField ? "new-password" : ""}
                                data-lpignore={field.dontLetTheBrowserSaveField ? "true" : ""}
                                className={`text-form-field ${(!showPasswords && field.dontLetTheBrowserSaveField) ? 'txtPassword' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
                                data-instance-id={field.instanceId || ''}
                                value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                    fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                            />
                            <button
                                type="button"
                                className="toggle-password-visibility"
                                onClick={() => setShowPasswords(!showPasswords)}
                                aria-label={showPasswords ? "Hide password" : "Show password"}
                                tabIndex="-1"
                            >
                                {showPasswords ? <VisibilityOffIcon/> : <VisibilityIcon/> }
                            </button>
                        </div>
                    )
                )}

                {field.type === 'date' && (
                    (field.labelOutside && field.labelOnTop) ? (
                        <div className={`field-with-label-on-top ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                            <label htmlFor={field.id} className={ "form-label-outside"}>
                                {field.label+ (field.required ? '*' : '')}
                            </label>
                                <input
                                    type={'text'}
                                    id={field.id}
                                    name={field.httpName}
                                    required={field.required}
                                    placeholder={`${field.placeholder ? field.placeholder+' (YYYY-MM-DD)' : field.label+' (YYYY-MM-DD)'}${field.required ? '*' : ''}`}
                                    disabled={submitting || field.readOnlyField}
                                    readOnly={true}
                                    onChange={(e) => {
                                        onChange(e, field);
                                    }}
                                    onFocus={() => showSelectDateModalForField(field.id, field.label)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Tab') {
                                            setShowSelectDateModal(false);
                                            setSelectedDateMonth('');
                                            setSelectedDateDay('');
                                            setSelectedDateYear('');
                                            setSelectedDateError('');
                                            setFieldValues(prev => ({
                                                ...prev,
                                                [selectedDateFieldID]: '',
                                            }));
                                        }
                                    }}
                                    className={`text-form-field ${field.readOnlyField ? 'read-only-field' : ''}`}
                                    data-instance-id={field.instanceId || ''}
                                    value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                        fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                                />
                        </div>
                    ) : (
                        <input
                            type={'text'}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={`${field.placeholder ? field.placeholder+' (YYYY-MM-DD)' : field.label+' (YYYY-MM-DD)'}${field.required ? '*' : ''}`}
                            disabled={submitting || field.readOnlyField}
                            readOnly={true}
                            onChange={(e) => {
                                onChange(e, field);
                            }}
                            onFocus={() => showSelectDateModalForField(field.id, field.label)}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                    setShowSelectDateModal(false);
                                    setSelectedDateMonth('');
                                    setSelectedDateDay('');
                                    setSelectedDateYear('');
                                    setSelectedDateError('');
                                    setFieldValues(prev => ({
                                        ...prev,
                                        [selectedDateFieldID]: '',
                                    }));
                                }
                            }}
                            className={`text-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'} ${field.readOnlyField ? 'read-only-field' : ''}`}
                            data-instance-id={field.instanceId || ''}
                            value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                        />
                    )
                )}

                {field.type === 'textarea' && (
                (field.labelOutside && field.labelOnTop) ? (
                    <div className={`field-with-label-on-top ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                        <label htmlFor={field.id} className={ "form-label-outside"}>
                            {field.label+ (field.required ? '*' : '')}
                        </label>

                        <textarea
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                            disabled={submitting || field.readOnlyField}
                            readOnly={field.readOnlyField ? true : false}
                            onChange={(e) => onChange(e, field)}
                            className={`textarea-form-field ${field.readOnlyField ? 'read-only-field' : ''}`}
                            data-instance-id={field.instanceId || ''}
                            value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                        />

                    </div>

                ) : (
                    <textarea
                        id={field.id}
                        name={field.httpName}
                        required={field.required}
                        placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                        disabled={submitting || field.readOnlyField}
                        readOnly={field.readOnlyField ? true : false}
                        onChange={(e) => onChange(e, field)}
                        className={`textarea-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'} ${field.large ? 'large-height-textarea' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
                        data-instance-id={field.instanceId || ''}
                        value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                            fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                    />
                )
                )}

                {field.type === 'select' && (
                (field.labelOutside && field.labelOnTop) ? (
                    <div className={`field-with-label-on-top ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                        <label htmlFor={field.id} className={ "form-label-outside"}>
                            {field.label+ (field.required ? '*' : '')}
                        </label>

                        <select
                            multiple={field.multiple}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            disabled={submitting || field.readOnlyField}
                            className={
                                field.multiple ? (
                                        `select-multiple-form-field ${field.readOnlyField ? 'read-only-field' : ''}`
                                    ) : (
                                        `select-form-field ${field.readOnlyField ? 'read-only-field' : ''}`
                                )
                            }
                            onChange={(e) => onChange(e, field)}
                            data-instance-id={field.instanceId || ''}
                            value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}

                        >
                            {(!field.multiple) && <option value="">{`${field.label}${field.required ? '*' : ''}`}</option>}
                            {field.choices.map((choice, index) => (
                                <option key={index} value={choice}>{choice}</option>
                            ))}
                        </select>
                    </div>
                    ) : (
                        <select
                            multiple={field.multiple}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            disabled={submitting || field.readOnlyField}
                            className={
                                field.multiple ? (
                                        `select-multiple-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'} ${field.readOnlyField ? 'read-only-field' : ''}`
                                    ) :
                                    (`select-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'} ${field.readOnlyField ? 'read-only-field' : ''}`)
                            }
                            onChange={(e) => onChange(e, field)}
                            data-instance-id={field.instanceId || ''}
                            value={(field.readOnlyField && field.value && field.value !== '') ? field.value :
                                fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.defaultValue ? field.defaultValue : ''}
                        >
                            {(!field.multiple) && <option value="">{`${field.label}${field.required ? '*' : ''}`}</option>}
                            {field.choices && field.choices.map((choice, index) => (
                                <option key={index} value={choice}>{choice}</option>
                            ))}
                        </select>
                    )
                )}

                {field.type === 'radio' &&
                    field.choices && field.choices.map((choice, index) => (
                        <label key={index}>
                            <input
                                type="radio"
                                id={field.id}
                                name={field.httpName}
                                required={field.required}
                                value={choice}
                                disabled={submitting}
                                className={`radio-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                                onChange={(e) => onChange(e, field)}
                                data-instance-id={field.instanceId || ''}
                                defaultChecked={ (!field.readOnlyField && field.defaultValue) ? field.defaultValue === choice : false}
                            />
                            {choice}
                        </label>
                    ))
                }

                {field.type === 'checkbox' &&
                    field.choices && field.choices.map((choice, index) => (
                        <label key={index}>
                            <input
                                type="checkbox"
                                id={field.id}
                                name={field.httpName}
                                required={field.required}
                                value={choice}
                                disabled={submitting}
                                className={`checkbox-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                                onChange={(e) => onChange(e, field)}
                                data-instance-id={field.instanceId || ''}
                                defaultChecked={ (!field.readOnlyField && field.defaultValue) ? field.defaultValue === choice : false}
                            />
                            {choice}
                        </label>
                    ))
                }

                {field.type === 'file' &&
                    <div className={`file-form-field-styled ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                         data-instance-id={field.instanceId || ''}
                    >
                        <label htmlFor={field.id}>
                            {field.label + (field.required ? '*' : '')}
                        </label>

                        <div className={"file-form-field-styled-buttons-wrapper"}>
                            <button onClick={() => {
                                refs[field.id].current.click();
                            }} type={"button"}  disabled={submitting}>Upload</button>

                            {fileInputs[field.id] && (
                                <button  className={"remove-button"}
                                         onClick={(e) => {{
                                             e.preventDefault();
                                             field.file = null;
                                             setFileInputs(prev => ({ ...prev, [field.id]: null }));
                                             refs[field.id].current.value = '';
                                         }}} type={"button"}
                                         disabled={submitting}
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <label>
                            {fileInputs[field.id] ? (fileInputs[field.id].name.length > 20 ? fileInputs[field.id].name.substring(0, 20) + '...' : fileInputs[field.id].name) : 'No file selected'}
                        </label>

                        <input
                            type="file"
                            className={"file-form-field"}
                            id={field.id}
                            name={field.httpName}
                            label={field.label}
                            required={field.required}
                            accept={field.allowedFileTypes ? field.allowedFileTypes.join(',') : ''}
                            disabled={submitting}
                            onChange={(e) => {
                                onChange(e, field)
                            }}
                            ref={refs[field.id]}
                            data-instance-id={field.instanceId || ''}
                        />

                        <label>
                            Maximum file size: 2MB
                        </label>
                    </div>
                }

                {field.type === 'section' && (
                    <div className={`form-title-section ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                         id={field.id}
                         ref={refs[field.id]}
                         data-instance-id={field.instanceId || ''}
                    >
                        <h3>
                            {field.label}
                        </h3>
                    </div>
                )}

                {field.type === 'button' && (
                    <button
                        className={`form-button ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        onClick={(e) => {
                            field.onClick(e, field);
                        }}
                        type={"button"}
                        disabled={submitting}
                        id={field.id}
                        ref={refs[field.id]}
                        data-instance-id={field.instanceId || ''}
                    >
                        {field.label}
                    </button>
                )}
            </Fragment>
        );
    }

    const renderDynamicSectionButtons = () => {
        if (dynamicSections.length === 0) return null;

        return (
            <div className="dynamic-sections-container">
                {dynamicSections.map(section => (
                    <div key={`add_section_${section.sectionId}`} className="dynamic-section-button-wrapper">
                        {renderAddSectionButton(section)}
                    </div>
                ))}
            </div>
        );
    };

    const handleCopy = (event) => {
        event.preventDefault();
    };

    const handleCut = (event) => {
        event.preventDefault();
    };

    const handlePaste = (event) => {
        event.preventDefault();
    };

    const handleMouseDown = (event) => {
        event.preventDefault();
    };

    const handleKeyDown = (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    };

    const showSelectDateModalForField = (fieldID, fieldLabel) => {
        setSelectedDateFieldID(fieldID);
        setSelectedDateFieldLabel(fieldLabel);
        setShowSelectDateModal(true);
    }

    const handleDateSelection = (day, month, year) => {
        if (!day || !month || !year) {
            setSelectedDateError(lang === 'ar' ? 'الرجاء اختيار تاريخ صحيح' : 'Please select a valid date');
            setTimeout(() => { setSelectedDateError(''); }, msgTimeout);
            return;
        }

        if (day < 10) {
            day = `0${day}`;
        }

        if (month < 10) {
            month = `0${month}`;
        }

        setSelectedDateDay(day);
        setSelectedDateMonth(month);
        setSelectedDateYear(year);
        document.getElementById(selectedDateFieldID).value = `${year}-${month}-${day}`;



        setFieldValues(prev => ({
            ...prev,
            [selectedDateFieldID]: `${year}-${month}-${day}`,
        }));


        setSelectedDateMonth('');
        setSelectedDateDay('');
        setSelectedDateYear('');
        setShowSelectDateModal(false);

        if (!noInputFieldsCache) {
            saveToCache({id: selectedDateFieldID, label: selectedDateFieldLabel}, `${year}-${month}-${day}`);
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault();

        if (pedanticIds) {
            const idMap = {};
            dynamicFields.forEach((field, index) => {
                const newId = index + 1;
                if (field.id !== newId) {
                    idMap[field.id] = newId;
                    field.id = newId;
                }
            });

            if (Object.keys(idMap).length > 0) {
                setSectionInstances(prevState => {
                    const newState = {...prevState};
                    Object.keys(newState).forEach(sectionId => {
                        newState[sectionId].instances = newState[sectionId].instances.map(instance => ({
                            ...instance,
                            fieldIds: instance.fieldIds.map(id => idMap[id] || id)
                        }));
                    });
                    return newState;
                });
            }
        }

        if (submitting) { return; }

        if (enteredCaptcha !== captchaValue && !noCaptcha) {
            setGeneralFormError(lang === 'ar' ? 'الكود التحقق غير صحيح' : 'Captcha is incorrect');
            setTimeout(() => { setGeneralFormError(''); }, msgTimeout);
            return;
        }

        for (let i=0; i < dynamicFields.length; i++) {
            if (dynamicFields[i].mustMatchFieldWithId) {
                let firstValue = document.getElementById(dynamicFields[i].id).value;
                let secondValue = document.getElementById(dynamicFields[i].mustMatchFieldWithId).value;

                if (firstValue && secondValue) {
                    if (firstValue !== secondValue) {
                        setGeneralFormError("Field '" + dynamicFields[i].label + "' must match field '" + dynamicFields.find(field => field.id === dynamicFields[i].mustMatchFieldWithId).label + "'");
                        setTimeout(() => { setGeneralFormError(''); }, msgTimeout);

                        document.getElementById(dynamicFields[i].id).value = '';
                        document.getElementById(dynamicFields[i].mustMatchFieldWithId).value = '';

                        document.getElementById(dynamicFields[i].mustMatchFieldWithId).focus();
                        document.getElementById(dynamicFields[i].mustMatchFieldWithId).setCustomValidity("This field values must match the value of the field '" + dynamicFields.find(field => field.id === dynamicFields[i].mustMatchFieldWithId).label + "'");
                        return;
                    }
                }
            }

            if (dynamicFields[i].mustNotMatchFieldWithId) {
                let firstValue = document.getElementById(dynamicFields[i].id).value;
                let secondValue = document.getElementById(dynamicFields[i].mustNotMatchFieldWithId).value;

                if (firstValue && secondValue) {
                    if (firstValue === secondValue) {
                        setGeneralFormError("Field '" + dynamicFields[i].label + "' must not match field '" + dynamicFields.find(field => field.id === dynamicFields[i].mustNotMatchFieldWithId).label + "'");
                        setTimeout(() => { setGeneralFormError(''); }, msgTimeout);

                        document.getElementById(dynamicFields[i].id).value = '';
                        document.getElementById(dynamicFields[i].mustNotMatchFieldWithId).value = '';

                        document.getElementById(dynamicFields[i].mustNotMatchFieldWithId).focus();
                        document.getElementById(dynamicFields[i].mustNotMatchFieldWithId).setCustomValidity("This field values must not match the value of the field '" + dynamicFields.find(field => field.id === dynamicFields[i].mustNotMatchFieldWithId).label + "'");
                        return;
                    }
                }
            }
        }

        if (dynamicSections && dynamicSections.length > 0) {
            for (let i=0; i < dynamicSections.length; i++) {
                if (sectionInstances[dynamicSections[i].sectionId].count < dynamicSections[i].minimumSectionInstancesForValidSubmission) {
                    setGeneralFormError( 'You need a minimum of ' + dynamicSections[i].minimumSectionInstancesForValidSubmission + " instances for the section '" + dynamicSections[i].sectionTitle + "'");
                    setTimeout(() => { setGeneralFormError(''); }, msgTimeout);
                    return;
                }
            }
        }

        setSubmitting(true);

        if (hasSetSubmittingLocal) {
            setSubmittingLocal(true);
        }

        setGeneralFormError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();

            dynamicFields.forEach(field => {
                if (field.type !== 'section' && field.type !== 'button' && field.type !== 'control') {
                    let value = document.getElementById(field.id)?.value || '';

                    if (field.type === 'file' && field.file) {
                        const file = field.file;
                        const fileExtension = file.name.split('.').pop();
                        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                        const uniqueFileName = `${fileNameWithoutExt}-${uuidv4()}.${fileExtension}`;
                        const renamedFile = new File([file], uniqueFileName, {type: file.type});
                        value = uniqueFileName;
                        formData.append(`uniqueFileName_${field.label}`, uniqueFileName);
                        formData.append(field.label, renamedFile, uniqueFileName);
                    }

                    formData.append(`field_${field.id}`, value);
                    formData.append(`label_${field.id}`, field.label);

                    if (field.instanceId) {
                        formData.append(`instance_${field.id}`, field.instanceId);
                        const sectionId = field.instanceId.split('_')[0];
                        formData.append(`section_${field.id}`, sectionId);
                    }
                }
            });

            if (sendPdf) {
                const pdf = new jsPDF();
                pdf.text("Form Submission", 10, 10);
                pdf.text(`Title: ${formTitle}`, 10, 20);

                dynamicFields.forEach((field, index) => {
                    if (field.type !== 'button' && field.type !== 'section' && field.type !== 'control') {
                        const value = document.getElementById(field.id)?.value || '';
                        pdf.text(`${field.label}: ${value}`, 10, 30 + (index * 10));
                    }
                });

                const pdfBlob = pdf.output('blob');
                formData.append('pdfFile', pdfBlob, 'form.pdf');
            }

            formData.append('mailTo', mailTo);
            formData.append('formTitle', formTitle);

            if (hasDifferentOnSubmitBehaviour && differentOnSubmitBehaviour) {
                try {
                    const result = await differentOnSubmitBehaviour(formData);

                    if (result) {
                        setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');

                        setTimeout(() => {
                            setSuccessMessage('');

                            if (formInModalPopup) {
                                setShowFormModalPopup(false);
                            }

                            resetFormCompletely();
                            clearCache();

                        }, msgTimeout);
                    }

                } catch (error) {
                    setGeneralFormError(error.message || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.') );
                    setTimeout(() => { setGeneralFormError(''); }, msgTimeout);
                    setSubmitting(false);
                    if (hasSetSubmittingLocal) {
                        setSubmittingLocal(false)
                    }
                }
            } else {
                try {
                    const result = await submitFormRequest(formData)

                    if (result.success) {
                        setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');
                        setTimeout(() => {
                            setSuccessMessage('');
                            if (formInModalPopup) {
                                setShowFormModalPopup(false);
                            }
                            resetFormCompletely();
                            clearCache();
                        }, msgTimeout);

                    } else {
                        setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : result.message || 'Form submission failed. Please try again.');
                        setTimeout(() => {
                            setGeneralFormError('');
                        }, msgTimeout);
                    }
                } catch (error) {
                    setGeneralFormError(error.message  || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.') );
                    setTimeout(() => { setGeneralFormError(''); }, msgTimeout);
                    setSubmitting(false);
                    if (hasSetSubmittingLocal) {
                        setSubmittingLocal(false)
                    }
                }
            }
        } catch (error) {
            setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : error || error.message + ': Form submission failed. Please try again.');
            setTimeout(() => { setGeneralFormError(''); }, msgTimeout);
        } finally {
            setSubmitting(false);

            if (hasSetSubmittingLocal) {
                setSubmittingLocal(false);
            }
        }
    };

    return (
        <>
            <form
                className="form"
                onSubmit={onSubmit}
                method="post"
                onReset={resetForm}
            >
                {dynamicFields.map((field, index) => (
                    renderFieldBasedOnType(field, index)
                ))}

                {!noCaptcha && (
                    <>
                        {!easySimpleCaptcha && (
                            <label htmlFor={"captcha"} className={"form-label-outside"}>
                                {lang === 'ar' ? 'كود التحقق*' : 'Captcha*'}
                            </label>
                        )
                        }

                        <div className={`${captchaLength === 2 ? (fullMarginField ? 'captcha-wrapper-with-half-width-full-margin' : 'captcha-wrapper-half-width') : (fullMarginField ? 'captcha-wrapper-with-full-margin' : 'captcha-wrapper')}`}>
                            <input className={`text-form-field ${captchaLength === 2 ? 'full-width' : 'half-width'} captcha-input`} type={"text"}
                                   placeholder={""} required={true} value={enteredCaptcha}
                                   onChange={(e) => {
                                       setEnteredCaptcha(e.target.value);
                                   }}
                                   onPaste={handlePaste}
                            />

                            <div className={`text-form-field ${captchaLength === 2 ? 'full-width': 'half-width'} captcha-box`} type={"text"}
                                 onCopy={handleCopy}
                                 onCut={handleCut}
                                 onPaste={handlePaste}
                                 onMouseDown={handleMouseDown}
                                 onKeyDown={handleKeyDown}
                                 onTouchStart={handleMouseDown}
                            >{captchaValue}</div>

                            <button className={`${captchaLength === 2 ? 'captcha-refresh-button-half-width' : 'refresh-captcha-button'}`} onClick={(e)=> { e.preventDefault(); setCaptchaValue(generateCaptcha()); }} type={"button"}>⟳</button>
                        </div>
                    </>
                )}

                {!formIsReadOnly && (
                    <div className={`form-footer ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : ''}`}>
                    {generalFormError && <p className="general-form-error">{generalFormError}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    {renderDynamicSectionButtons()}

                    <div className={`form-footer-buttons-wrapper ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : 'left-buttons'}`}>

                        { switchFooterButtonsOrder ? (
                            <>
                                { !noClearOption && (
                                    lang === 'ar' ? (
                                        <button type="reset" disabled={submitting}
                                                className="reset-button">مسح</button>
                                    ) : (
                                        <button type="reset" disabled={submitting}
                                                className="reset-button">Clear</button>
                                    ))
                                }

                                {hasDifferentSubmitButtonText ? (
                                    lang === 'ar' ? (
                                        <button type={"submit"} disabled={submitting} className={"submit-button"}>
                                            {submitting ? differentSubmitButtonText[3] : differentSubmitButtonText[2]}
                                        </button>
                                    ) : (
                                        <button type={"submit"} disabled={submitting} className={"submit-button"}>
                                            {submitting ? differentSubmitButtonText[1] : differentSubmitButtonText[0]}
                                        </button>
                                    )
                                ) : (
                                    lang === 'ar' ? (
                                        <button type="submit" disabled={submitting}
                                                className="submit-button">{submitting ? 'جاري الارسال...' : 'ارسال'}</button>
                                    ) : (
                                        <button type="submit" disabled={submitting}
                                                className="submit-button">{submitting ? 'Submitting...' : 'Submit'}</button>
                                    )
                                )}
                            </>
                        ) : (
                            <>
                                {hasDifferentSubmitButtonText ? (
                                    lang === 'ar' ? (
                                        <button type={"submit"} disabled={submitting} className={"submit-button"}>
                                            {submitting ? differentSubmitButtonText[3] : differentSubmitButtonText[2]}
                                        </button>
                                    ) : (
                                        <button type={"submit"} disabled={submitting} className={"submit-button"}>
                                            {submitting ? differentSubmitButtonText[1] : differentSubmitButtonText[0]}
                                        </button>
                                    )
                                ) : (
                                    lang === 'ar' ? (
                                        <button type="submit" disabled={submitting}
                                                className="submit-button">{submitting ? 'جاري الارسال...' : 'ارسال'}</button>
                                    ) : (
                                        <button type="submit" disabled={submitting}
                                                className="submit-button">{submitting ? 'Submitting...' : 'Submit'}</button>
                                    )
                                )}

                                { !noClearOption && (
                                    lang === 'ar' ? (
                                        <button type="reset" disabled={submitting}
                                                className="reset-button">مسح</button>
                                    ) : (
                                        <button type="reset" disabled={submitting}
                                                className="reset-button">Clear</button>
                                    ))
                                }
                            </>
                        )}


                    </div>
                </div>
                )}
            </form>

            <animated.div style={animateDateModal} className={"form-select-date-modal"}>
                <div className={"form-select-date-modal-overlay"} onClick={() => {
                    setShowSelectDateModal(false);
                    setSelectedDateMonth('');
                    setSelectedDateDay('');
                    setSelectedDateYear('');
                    setSelectedDateError('');
                    setFieldValues(prev => ({
                        ...prev,
                        [selectedDateFieldID]: '',
                    }));
                }}/>

                <div className={"form-select-date-modal-container"}>
                    <div className={"form-select-date-modal-header"}>
                        <p>
                            {selectedDateFieldLabel}
                        </p>
                    </div>

                    <div className={"form-select-date-modal-content"}>
                        <form className={"form-select-date-modal-form"} onSubmit={(e) => {
                            e.preventDefault();
                            handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
                        }}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
                                  }
                              }}
                        >
                            <select className={"select-form-field third-width"} onChange={(e) => setSelectedDateYear(e.target.value)}
                                    value={selectedDateYear}
                                    autoFocus={true}
                            >
                                <option value={''}>Year</option>

                                {Array.from({length: new Date().getFullYear() - 1970 + 1}, (v, k) => k + 1970).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            <select className={"select-form-field third-width"} onChange={(e) => setSelectedDateMonth(e.target.value)}
                                    value={selectedDateMonth}
                            >
                                <option value={''}>Month</option>
                                {Array.from({length: 12}, (v, k) => k + 1).map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>

                            <select className={"select-form-field third-width"} onChange={(e) => setSelectedDateDay(e.target.value)}
                                    value={selectedDateDay}
                            >
                                <option value={''}>Day</option>

                                { (selectedDateMonth && selectedDateYear && parseInt(selectedDateYear) !== undefined && parseInt(selectedDateMonth))  ?
                                    Array.from({length: new Date(parseInt(selectedDateYear), parseInt(selectedDateMonth), 0).getDate()}, (v, k) => k + 1).map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    )) : null
                                }
                            </select>
                        </form>
                    </div>

                    {selectedDateError && <p className={"general-form-error"}>{selectedDateError}</p>}

                    <div className={"form-select-date-modal-footer"}>
                        <button className={"form-select-date-modal-close-btn"} onClick={() => {
                            setShowSelectDateModal(false);
                            setSelectedDateMonth('');
                            setSelectedDateDay('');
                            setSelectedDateYear('');
                            setSelectedDateError('');
                            document.getElementById(selectedDateFieldID).value = '';
                            setFieldValues(prev => ({
                                ...prev,
                                [selectedDateFieldID]: '',
                            }));
                        }}>
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>

                        <button className={"form-select-date-modal-confirm-btn"} onClick={() => {
                            handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
                        }} type={"submit"}>
                            {lang === 'ar' ? 'تأكيد' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </animated.div>
        </>
    );
}

Form.propTypes = {
    fields: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        httpName: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        required: PropTypes.bool.isRequired,
        errorMsg: PropTypes.string,
        choices: PropTypes.arrayOf(PropTypes.string),
        regex: PropTypes.string,
        widthOfField: PropTypes.number, // a number between 1 and 3 where 1 means taking 100% of the width, 2 means taking 50% of the width, and 3 means taking 33.33% of the width
        labelOutside: PropTypes.bool,
        allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
        placeholder: PropTypes.string,
        dontLetTheBrowserSaveField: PropTypes.bool,
        multiple: PropTypes.bool,
        onClick: PropTypes.func,
        mustMatchFieldWithId: PropTypes.number,
        mustNotMatchFieldWithId: PropTypes.number,
        labelOnTop: PropTypes.bool,
        readOnlyField: PropTypes.bool,
        defaultValue: PropTypes.string,
        minimumValue: PropTypes.string,
        maximumValue: PropTypes.string,

        rules: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.string.isRequired,
            ruleResult: PropTypes.arrayOf(PropTypes.shape({
                id: PropTypes.number.isRequired,
                httpName: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
                type: PropTypes.string.isRequired,
                required: PropTypes.bool.isRequired,
                errorMsg: PropTypes.string,
                choices: PropTypes.arrayOf(PropTypes.string),
                regex: PropTypes.string,
                widthOfField: PropTypes.number, // a number between 1 and 3 where 1 means taking 100% of the width, 2 means taking 50% of the width, and 3 means taking 33.33% of the width
                labelOutside: PropTypes.bool,
                allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
                placeholder: PropTypes.string,
                dontLetTheBrowserSaveField: PropTypes.bool,
                multiple: PropTypes.bool,
                onClick: PropTypes.func,
                mustMatchFieldWithId: PropTypes.number,
                mustNotMatchFieldWithId: PropTypes.number,
                labelOnTop: PropTypes.bool,
                readOnlyField: PropTypes.bool,
                defaultValue: PropTypes.string,
                minimumValue: PropTypes.string,
                maximumValue: PropTypes.string,

                rules: PropTypes.arrayOf(PropTypes.shape({
                    value: PropTypes.string.isRequired,
                    ruleResult: PropTypes.arrayOf(PropTypes.shape({
                        id: PropTypes.number.isRequired,
                        httpName: PropTypes.string.isRequired,
                        label: PropTypes.string.isRequired,
                        type: PropTypes.string.isRequired,
                        required: PropTypes.bool.isRequired,
                        errorMsg: PropTypes.string,
                        choices: PropTypes.arrayOf(PropTypes.string),
                        regex: PropTypes.string,
                        mustMatchFieldWithId: PropTypes.number,
                        mustNotMatchFieldWithId: PropTypes.number,
                        widthOfField: PropTypes.number, // a number between 1 and 3 where 1 means taking 100% of the width, 2 means taking 50% of the width, and 3 means taking 33.33% of the width
                        labelOutside: PropTypes.bool,
                        allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
                        placeholder: PropTypes.string,
                        dontLetTheBrowserSaveField: PropTypes.bool,
                        multiple: PropTypes.bool,
                        labelOnTop: PropTypes.bool,
                        readOnlyField: PropTypes.bool,
                        defaultValue: PropTypes.string,
                        minimumValue: PropTypes.string,
                        maximumValue: PropTypes.string,
                    }))
                }))
            }))
        }))
    })).isRequired,

    mailTo: PropTypes.string.isRequired,
    sendPdf: PropTypes.bool.isRequired,
    formTitle: PropTypes.string.isRequired,
    lang: PropTypes.string.isRequired,
    captchaLength: PropTypes.number.isRequired,
    noInputFieldsCache: PropTypes.bool,
    noCaptcha: PropTypes.bool,
    hasDifferentOnSubmitBehaviour: PropTypes.bool,
    differentOnSubmitBehaviour: PropTypes.func,
    noClearOption: PropTypes.bool,
    hasDifferentSubmitButtonText: PropTypes.bool,
    differentSubmitButtonText: PropTypes.arrayOf(PropTypes.string),
    centerSubmitButton: PropTypes.bool,
    easySimpleCaptcha: PropTypes.bool,
    fullMarginField: PropTypes.bool,
    hasSetSubmittingLocal: PropTypes.bool,
    setSubmittingLocal: PropTypes.func,
    resetFormFromParent: PropTypes.bool,
    setResetForFromParent: PropTypes.func,
    dynamicSections: PropTypes.arrayOf(PropTypes.shape({
        addButtonText: PropTypes.string.isRequired,
        removeButtonText: PropTypes.string.isRequired,
        startAddingFieldsFromId: PropTypes.number.isRequired,
        fieldsToAdd: PropTypes.arrayOf(PropTypes.object).isRequired,
        maxSectionInstancesToAdd: PropTypes.number.isRequired,
        sectionId: PropTypes.string.isRequired,
        sectionTitle: PropTypes.string.isRequired,
        minimumSectionInstancesForValidSubmission: PropTypes.number.isRequired,
        existingFilledSectionInstances: PropTypes.arrayOf(
            PropTypes.arrayOf(PropTypes.object)
        )
    })),
    pedanticIds: PropTypes.bool,
    formInModalPopup: PropTypes.bool,
    setShowFormModalPopup: PropTypes.func,
    formIsReadOnly: PropTypes.bool,
    footerButtonsSpaceBetween: PropTypes.bool,
    switchFooterButtonsOrder: PropTypes.bool,


};

export default Form;


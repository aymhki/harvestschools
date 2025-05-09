import PropTypes from 'prop-types';
import {useEffect, useState } from "react";
import {Fragment} from "react";
import '../styles/Form.css'
import jsPDF from 'jspdf';
import {createRef} from "react";
import { v4 as uuidv4 } from 'uuid'; // Import the UUID library
import {useSpring, animated} from "react-spring";
import { useCallback } from 'react';


const getStorageKey = (formTitle, fieldId, fieldLabel) => {
    return `form_${formTitle}_${fieldLabel}_${fieldId}`;
};

const useFormCache = (formTitle, fields) => {

    const loadCachedValues = useCallback(() => {
        const cachedValues = {};
        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            const cachedValue = localStorage.getItem(storageKey);
            if (cachedValue !== null) {
                cachedValues[field.id] = cachedValue;
            }
        });
        return cachedValues;
    }, [fields, formTitle]);


    const saveToCache = useCallback((field, value) => {
        const storageKey = getStorageKey(formTitle, field.id, field.label);
        if (value) {
            localStorage.setItem(storageKey, value);
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [formTitle]);

    const clearCache = useCallback(() => {
        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            localStorage.removeItem(storageKey);
        });
    }, [fields, formTitle]);

    return { loadCachedValues, saveToCache, clearCache };
};

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
                    setSubmittingLocal
}) {

    const [submitting, setSubmitting] = useState(false); //disable fields when submitting
    const [generalFormError, setGeneralFormError] = useState(''); //general form error message
    const [successMessage, setSuccessMessage] = useState(''); //success message
    const [dynamicFields, setDynamicFields] = useState(fields); // Store dynamic fields based on rules
    const captchaMaxLength = easySimpleCaptcha ? 4 : 7; // Maximum length of captcha
    const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz0123456789@#$%&';
    const [refs, setRefs] = useState({}); // Store references to form fields
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

    const { loadCachedValues, saveToCache, clearCache } = useFormCache(formTitle, fields);
    const msgTimeout = 3500

    useEffect(() => {
        const newRefs = {};
        dynamicFields.forEach(field => {
            newRefs[field.id] = createRef();
        });

        setRefs(newRefs);
    }, []);

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

    function resetForm() {
        setTimeout(() => {
            setGeneralFormError('');
            setSuccessMessage('');
            setSubmitting(false);

            if (hasSetSubmittingLocal) {
                setSubmittingLocal(false);
            }


            setDynamicFields(fields);
            setFileInputs({});
            setCaptchaValue(generateCaptcha());
            setEnteredCaptcha('');
            dynamicFields.forEach(field => {
                document.getElementById(field.id).value = '';
            })

        }, msgTimeout);

        clearCache();
    }

    function generateCaptcha() {
        let captcha = '';
        for (let i = 0; i < captchaMaxLength; i++) {
            captcha += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        return captcha;
    }

    const [captchaValue, setCaptchaValue] = useState(generateCaptcha()); // Store captcha value
    const [enteredCaptcha, setEnteredCaptcha] = useState(''); // Store entered captcha value


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
            } else  {

                e.target.setCustomValidity('');
                setGeneralFormError('');
                setSuccessMessage('');
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


            return (
                <Fragment key={field.id} >
                {field.labelOutside && <label htmlFor={field.id} className={ "form-label-outside"}>
                    {field.label+ (field.required ? '*' : '')}

                </label>}

                    {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'time' || field.type === 'password') && (
                        field.dontLetTheBrowserSaveField ? (
                            <input
                                type={field.type}
                                id={field.id}
                                name={field.httpName}
                                required={field.required}
                                placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                disabled={submitting}
                                onChange={(e) => onChange(e, field)}
                                autoComplete="new-password"
                                data-lpignore="true"
                                className={`text-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                            />
                        ) : (
                            <input
                                type={field.type}
                                id={field.id}
                                name={field.httpName}
                                required={field.required}
                                placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                                disabled={submitting}
                                onChange={(e) => onChange(e, field)}
                                className={`text-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                            />
                        )
                    )}

                    {field.type === 'date' && (

                        <input
                            type={'text'}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={`${field.placeholder ? field.placeholder+' (YYYY-MM-DD)' : field.label+' (YYYY-MM-DD)'}${field.required ? '*' : ''}`}
                            disabled={submitting}
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
                                }
                            }}



                            className={`text-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        />
                    )}

                    {field.type === 'textarea' &&
                        <textarea
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={`${field.placeholder ? field.placeholder : field.label}${field.required ? '*' : ''}`}
                            disabled={submitting}
                            onChange={(e) => onChange(e, field)}
                            className={`textarea-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'} ${field.large ? 'large-height-textarea' : ''}`}
                        />
                    }

                    {field.type === 'select' &&
                        <select
                            multiple={field.multiple}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            disabled={submitting}

                            className={
                            field.multiple ? (
                                `select-multiple-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`
                                ) :

                                (`select-form-field ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`)

                            }

                            onChange={(e) => onChange(e, field)}
                        >
                            {(!field.multiple) && <option value="">{`${field.label}${field.required ? '*' : ''}`}</option>}
                            {field.choices.map((choice, index) => (
                                <option key={index} value={choice}>{choice}</option>
                            ))}
                        </select>
                    }

                    {field.type === 'radio' &&
                        field.choices.map((choice, index) => (
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
                                />
                                {choice}
                            </label>
                        ))
                    }

                    {field.type === 'checkbox' &&
                        field.choices.map((choice, index) => (
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
                                />
                                {choice}
                            </label>
                        ))
                    }

                    {field.type === 'file' &&
                        <div className={`file-form-field-styled ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
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
                            />

                            <label>
                                Maximum file size: 2MB
                            </label>
                        </div>
                    }

                    {field.type === 'section' && (
                        <div className={`form-title-section ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`} id={field.id} key={field.id}  ref={refs[field.id]}>
                            <h3 >
                                {field.label}
                            </h3>
                        </div>
                    )}


                    {field.type === 'button' && (
                        <button className={`form-button ${field.widthOfField === 1 ? (fullMarginField ? 'full-width-with-margin' : 'full-width') : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`} onClick={(e) => {
                            field.onClick(e, field);
                        }} type={"button"} disabled={submitting} id={field.id} key={field.id}  ref={refs[field.id]} >
                            {field.label}
                        </button>
                    )}

                </Fragment>
            );

    }

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
                if (field.type !== 'section' && field.type !== 'button') {
                    let value = document.getElementById(field.id).value;

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
                }
            });

            if (sendPdf) {
                const pdf = new jsPDF();
                pdf.text("Form Submission", 10, 10);
                pdf.text(`Title: ${formTitle}`, 10, 20);

                dynamicFields.forEach((field, index) => {
                    if (field.type !== 'button' && field.type !== 'section') {
                        const value = document.getElementById(field.id).value;
                        pdf.text(`${field.label}: ${value}`, 10, 30 + (index * 10));
                    }
                });

                const pdfBlob = pdf.output('blob');
                formData.append('pdfFile', pdfBlob, 'form.pdf');
            }

            formData.append('mailTo', mailTo);
            formData.append('formTitle', formTitle);

            if (hasDifferentOnSubmitBehaviour) {
                try {
                    await differentOnSubmitBehaviour(formData);
                } catch (error) {
                    setGeneralFormError(error.message + ': Form submission failed. Please try again.' || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.') );
                    setTimeout(() => { setGeneralFormError(''); }, msgTimeout);
                    // resetForm();
                    // clearCache();

                    setSubmitting(false);
                    if (hasSetSubmittingLocal) {
                        setSubmittingLocal(false)
                    }
                }
            } else {
                try {
                    const response = await fetch('/scripts/submitForm.php', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');
                        setTimeout(() => {
                            setSuccessMessage('');
                        }, msgTimeout);
                        resetForm();
                        clearCache();
                    } else {
                        setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : result.message + ': Form submission failed. Please try again.');
                        setTimeout(() => {
                            setGeneralFormError('');
                        }, msgTimeout);
                    }
                } catch (error) {
                    setGeneralFormError(error.message + ': Form submission failed. Please try again.' || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.') );
                    setTimeout(() => { setGeneralFormError(''); }, msgTimeout);
                    // resetForm();
                    // clearCache();

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

                                   onChange={

                                    (e) => {

                                       setEnteredCaptcha(e.target.value);
                                    }
                            }
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

                <div className={`form-footer ${centerSubmitButton ? 'center-buttons' : 'left-buttons'}`}>

                    {generalFormError && <p className="general-form-error">{generalFormError}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className={`form-footer-buttons-wrapper ${centerSubmitButton ? 'center-buttons' : 'left-buttons'}`}>

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

                    </div>
                </div>
            </form>





        <animated.div style={animateDateModal} className={"form-select-date-modal"}>
            <div className={"form-select-date-modal-overlay"} onClick={() => {
                setShowSelectDateModal(false);
                setSelectedDateMonth('');
                setSelectedDateDay('');
                setSelectedDateYear('');
                setSelectedDateError('');
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
        allowedFileTypes: PropTypes.arrayOf(PropTypes.string.isRequired),
        placeholder: PropTypes.string,
        dontLetTheBrowserSaveField: PropTypes.bool,
        multiple: PropTypes.bool,
        onClick: PropTypes.func,
        mustMatchFieldWithId: PropTypes.number,
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
                allowedFileTypes: PropTypes.arrayOf(PropTypes.string.isRequired),
                placeholder: PropTypes.string,
                dontLetTheBrowserSaveField: PropTypes.bool,
                multiple: PropTypes.bool,
                onClick: PropTypes.func,
                mustMatchFieldWithId: PropTypes.number,

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
                        widthOfField: PropTypes.number, // a number between 1 and 3 where 1 means taking 100% of the width, 2 means taking 50% of the width, and 3 means taking 33.33% of the width
                        labelOutside: PropTypes.bool,
                        allowedFileTypes: PropTypes.arrayOf(PropTypes.string.isRequired),
                        placeholder: PropTypes.string,
                        dontLetTheBrowserSaveField: PropTypes.bool,
                        multiple: PropTypes.bool,
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
    setSubmittingLocal: PropTypes.func
};

export default Form;
// import PropTypes from 'prop-types';
// import {useEffect, useState} from "react";
// import {Fragment} from "react";
// import '../styles/Form.css'
// import {v6 as uuidv6} from 'uuid';
// import {useSpring, animated} from "react-spring";
// import {useCallback} from 'react';
// import VisibilityIcon from '@mui/icons-material/Visibility';
// import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// import RemoveIcon from '@mui/icons-material/Remove';
// import AddIcon from '@mui/icons-material/Add';
// import {useFormCache} from "../services/Utils.jsx";
// import {msgTimeout} from "../services/Utils.jsx";
// import {submitFormRequest} from "../services/Utils.jsx";
//
// function Form({
//                   fields,
//                   mailTo,
//                   formTitle,
//                   lang,
//                   captchaLength,
//                   noInputFieldsCache,
//                   noCaptcha,
//                   hasDifferentOnSubmitBehaviour,
//                   differentOnSubmitBehaviour,
//                   noClearOption,
//                   hasDifferentSubmitButtonText,
//                   differentSubmitButtonText,
//                   centerSubmitButton,
//                   easySimpleCaptcha,
//                   fullMarginField,
//                   hasSetSubmittingLocal,
//                   setSubmittingLocal,
//                   resetFormFromParent,
//                   setResetForFromParent,
//                   formInModalPopup,
//                   setShowFormModalPopup,
//                   formIsReadOnly,
//                   footerButtonsSpaceBetween,
//                   switchFooterButtonsOrder,
//               }) {
//
//     const [submitting, setSubmitting] = useState(false);
//     const [generalFormError, setGeneralFormError] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [dynamicFields, setDynamicFields] = useState(fields);
//     const captchaMaxLength = easySimpleCaptcha ? 4 : 7;
//     const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz0123456789@#$%&';
//     const [fileInputs, setFileInputs] = useState({});
//     const [showSelectDateModal, setShowSelectDateModal] = useState(false);
//     const [selectedDateDay, setSelectedDateDay] = useState('');
//     const [selectedDateMonth, setSelectedDateMonth] = useState('');
//     const [selectedDateYear, setSelectedDateYear] = useState('');
//     const [selectedDateFieldID, setSelectedDateFieldID] = useState(null);
//     const [selectedDateFieldLabel, setSelectedDateFieldLabel] = useState('');
//     const [selectedDateError, setSelectedDateError] = useState('');
//     const animateDateModal = useSpring({
//         opacity: showSelectDateModal ? 1 : 0,
//         transform: showSelectDateModal ? 'translateY(0)' : 'translateY(-100%)'
//     });
//     const [showPasswords, setShowPasswords] = useState(false);
//     const {loadCachedValues, saveToCache, clearCache} = useFormCache(formTitle, fields);
//     const [prefilledInitialized, setPrefilledInitialized] = useState(false);
//     const [captchaValue, setCaptchaValue] = useState('');
//     const [enteredCaptcha, setEnteredCaptcha] = useState('');
//     const [fieldValues, setFieldValues] = useState({});
//
//     const resetFormCommon = (shouldClearFieldDefaults = false) => {
//
//         if (shouldClearFieldDefaults) {
//             const newFields = fields.map(field => ({
//                 ...field,
//                 defaultValue: '',
//                 value: ''
//             }));
//             setDynamicFields(newFields);
//         } else {
//             setDynamicFields([...fields]);
//         }
//
//         setFileInputs({});
//         setCaptchaValue(generateCaptcha());
//         setEnteredCaptcha('');
//         setGeneralFormError('');
//         setSuccessMessage('');
//
//         if (hasSetSubmittingLocal) {
//             setSubmittingLocal(false);
//         }
//         if (!shouldClearFieldDefaults && prefilledInitialized) {
//             setPrefilledInitialized(false);
//         }
//
//         setFieldValues({});
//     };
//
//     const resetFormCompletely = useCallback(() => {
//         resetFormCommon(false);
//     }, []);
//
//     const resetForm = () => {
//         resetFormCompletely();
//         clearCache();
//     }
//
//     const generateCaptcha = useCallback(() => {
//         let captcha = '';
//
//         for (let i = 0; i < captchaMaxLength; i++) {
//             captcha += characters.charAt(Math.floor(Math.random() * characters.length));
//         }
//
//         return captcha;
//     }, [])
//
//     const getWidthClass = (widthOfField) => {
//         if (widthOfField === 1) return fullMarginField ? 'full-width-with-margin' : 'full-width';
//         if (widthOfField === 1.5) return 'two-thirds-width';
//         if (widthOfField === 2) return 'half-width';
//         return 'third-width';
//     };
//
//     const getFieldValue = (field) => {
//         return fieldValues[field.id] || '';
//     };
//
//     const getCommonInputProps = (field) => ({
//         id: field.id,
//         name: field.httpName,
//         required: field.required,
//         disabled: submitting || field.readOnlyField,
//         readOnly: field.readOnlyField || false,
//         onChange: (e) => onChange(e, field),
//         value: getFieldValue(field)
//     });
//
//     const getPlaceholder = (field) =>
//         `${field.placeholder || field.label}${field.required ? '*' : ''}`;
//
//     const getLabelText = (field) =>
//         `${field.label}${field.required ? '*' : ''}`;
//
//     const renderLabel = (field, htmlFor = field.id) => (
//         <label htmlFor={htmlFor} className="form-label-outside">
//             {getLabelText(field)}
//         </label>
//     );
//
//     const renderWithOptionalLabel = (field, children) => {
//         const widthClass = getWidthClass(field.widthOfField);
//
//         if (field.labelOutside && field.labelOnTop) {
//             return (
//                 <div className={`field-with-label-on-top ${widthClass}`}>
//                     {renderLabel(field)}
//                     {children}
//                 </div>
//             );
//         }
//
//         return children;
//     };
//
//     const renderTextInput = (field, type = field.type) => {
//         const baseProps = getCommonInputProps(field);
//         const widthClass = getWidthClass(field.widthOfField);
//
//         const inputProps = {
//             ...baseProps,
//             type,
//             placeholder: getPlaceholder(field),
//             className: `text-form-field ${field.readOnlyField ? 'read-only-field' : ''}`
//         };
//
//         if (field.dontLetTheBrowserSaveField) {
//             inputProps.name = 'hidden';
//             inputProps.autoComplete = 'new-password';
//             inputProps['data-lpignore'] = 'true';
//         }
//
//         const input = <input {...inputProps} className={`${inputProps.className} ${!field.labelOutside || !field.labelOnTop ? widthClass : ''}`}/>;
//
//         return renderWithOptionalLabel(field, input);
//     };
//
//     const renderNumberInput = (field) => {
//         const baseProps = getCommonInputProps(field);
//         const widthClass = getWidthClass(field.widthOfField);
//
//         const handleNumberChange = (delta) => (e) => {
//             e.preventDefault();
//             const currentValue = parseInt(fieldValues[field.id]) || 0;
//
//             if ( !( (field.maximumValue && currentValue + delta > field.maximumValue) || (field.minimumValue && currentValue + delta < field.minimumValue) || isNaN(currentValue + delta) ) ) {
//                 setFieldValues({...fieldValues, [field.id]: currentValue + delta});
//
//                 if (!noInputFieldsCache) {
//                     saveToCache(field, currentValue + delta);
//                 }
//             }
//         };
//
//         const numberInput = (
//             <div className={`number-input-container ${!field.labelOutside || !field.labelOnTop ? widthClass : ''}`}>
//                 <button className="number-input-reduce-button" type="button" onClick={handleNumberChange(-1)}>
//                     <span><RemoveIcon/></span>
//                 </button>
//
//                 <input
//                     {...baseProps}
//                     type="text"
//                     placeholder={getPlaceholder(field)}
//                     className={`number-form-field ${field.readOnlyField ? 'read-only-field' : ''}`}
//                     min={field.minimumValue || ''}
//                     max={field.maximumValue || ''}
//                 />
//
//                 <button className="number-input-add-button" type="button" onClick={handleNumberChange(1)}>
//                     <span><AddIcon/></span>
//                 </button>
//             </div>
//         );
//
//         return renderWithOptionalLabel(field, numberInput);
//     };
//
//     const renderPasswordInput = (field) => {
//         const baseProps = getCommonInputProps(field);
//         const widthClass = getWidthClass(field.widthOfField);
//
//         const inputProps = {
//             ...baseProps,
//             type: field.dontLetTheBrowserSaveField ? "text" : (showPasswords ? "text" : "password"),
//             placeholder: getPlaceholder(field),
//             className: `text-form-field ${(!showPasswords && field.dontLetTheBrowserSaveField) ? 'txtPassword' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`
//         };
//
//         if (field.dontLetTheBrowserSaveField) {
//             inputProps.name = 'hidden';
//             inputProps.autoComplete = 'new-password';
//             inputProps['data-lpignore'] = 'true';
//         }
//
//         const passwordField = (
//             <div className={`password-field-wrapper ${!field.labelOutside || !field.labelOnTop ? widthClass : ''}`}>
//                 <input {...inputProps} />
//                 <button
//                     type="button"
//                     className="toggle-password-visibility"
//                     onClick={() => setShowPasswords(!showPasswords)}
//                     aria-label={showPasswords ? "Hide password" : "Show password"}
//                     tabIndex="-1"
//                 >
//                     {showPasswords ? <VisibilityOffIcon/> : <VisibilityIcon/>}
//                 </button>
//             </div>
//         );
//
//         return renderWithOptionalLabel(field, passwordField);
//     };
//
//     const renderDateInput = (field) => {
//         const baseProps = getCommonInputProps(field);
//         const widthClass = getWidthClass(field.widthOfField);
//
//         const handleKeyDown = (e) => {
//             if (e.key === 'Tab') {
//                 setShowSelectDateModal(false);
//                 setSelectedDateMonth('');
//                 setSelectedDateDay('');
//                 setSelectedDateYear('');
//                 setSelectedDateError('');
//                 dynamicFields.find(f => f.id === selectedDateFieldID).setValue('');
//             }
//         };
//
//         const dateInput = (
//             <input
//                 {...baseProps}
//                 type="text"
//                 placeholder={`${field.placeholder ? field.placeholder + ' (YYYY-MM-DD)' : field.label + ' (YYYY-MM-DD)'}${field.required ? '*' : ''}`}
//                 readOnly={true}
//                 onFocus={() => showSelectDateModalForField(field.id, field.label)}
//                 onKeyDown={handleKeyDown}
//                 className={`text-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
//             />
//         );
//
//         return renderWithOptionalLabel(field, dateInput);
//     };
//
//     const renderTextarea = (field) => {
//         const baseProps = getCommonInputProps(field);
//         const widthClass = getWidthClass(field.widthOfField);
//
//         const textarea = (
//             <textarea
//                 {...baseProps}
//                 placeholder={getPlaceholder(field)}
//                 className={`textarea-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.large ? 'large-height-textarea' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
//             />
//         );
//
//         return renderWithOptionalLabel(field, textarea);
//     };
//
//     const renderSelect = (field) => {
//         const baseProps = getCommonInputProps(field);
//         const widthClass = getWidthClass(field.widthOfField);
//
//         const selectElement = (
//             <select
//                 {...baseProps}
//                 multiple={field.multiple}
//                 className={
//                     field.multiple ?
//                         `select-multiple-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''}` :
//                         `select-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''}`
//                 }
//             >
//                 {!field.multiple && <option value="">{getLabelText(field)}</option>}
//                 {field.choices && field.choices.map((choice, index) => (
//                     <option key={index} value={choice}>{choice}</option>
//                 ))}
//             </select>
//         );
//
//         return renderWithOptionalLabel(field, selectElement);
//     };
//
//     const renderChoiceInputs = (field, submitting, onChange, type) => {
//         const widthClass = getWidthClass(field.widthOfField);
//
//         return field.choices && field.choices.map((choice, index) => (
//             <label key={index}>
//                 <input
//                     type={type}
//                     id={field.id}
//                     name={field.httpName}
//                     required={field.required}
//                     value={choice}
//                     disabled={submitting}
//                     className={`${type}-form-field ${widthClass}`}
//                     onChange={(e) => onChange(e, field)}
//                     data-instance-id={field.instanceId || ''}
//                     defaultChecked={(!field.readOnlyField && field.value) ? field.value === choice : false}
//                 />
//                 {choice}
//             </label>
//         ));
//     };
//     const renderFileInput = (field) => {
//         const widthClass = getWidthClass(field.widthOfField);
//
//         return (
//             <div className={`file-form-field-styled ${widthClass}`} data-instance-id={field.instanceId || ''}>
//                 <label htmlFor={field.id}>
//                     {getLabelText(field)}
//                 </label>
//                 <div className="file-form-field-styled-buttons-wrapper">
//                     <button type="button" disabled={submitting}>
//                         Upload
//                     </button>
//                     {fileInputs[field.id] && (
//                         <button
//                             className="remove-button"
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 field.file = null;
//                                 setFileInputs(prev => ({...prev, [field.id]: null}));
//                             }}
//                             type="button"
//                             disabled={submitting}
//                         >
//                             Remove
//                         </button>
//                     )}
//                 </div>
//                 <label>
//                     {fileInputs[field.id]
//                         ? (fileInputs[field.id].name.length > 20
//                                 ? fileInputs[field.id].name.substring(0, 20) + '...'
//                                 : fileInputs[field.id].name
//                         )
//                         : 'No file selected'
//                     }
//                 </label>
//                 <input
//                     type="file"
//                     className="file-form-field"
//                     id={field.id}
//                     name={field.httpName}
//                     label={field.label}
//                     required={field.required}
//                     accept={field.allowedFileTypes ? field.allowedFileTypes.join(',') : ''}
//                     disabled={submitting}
//                     onChange={(e) => onChange(e, field)}
//                     data-instance-id={field.instanceId || ''}
//                 />
//                 <label>Maximum file size: 2MB</label>
//             </div>
//         );
//     };
//     const renderButton = (field) => {
//         const widthClass = getWidthClass(field.widthOfField);
//
//         return (
//             <button
//                 className={`form-button ${widthClass}`}
//                 onClick={(e) => field.onClick(e, field)}
//                 type="button"
//                 disabled={submitting}
//                 id={field.id}
//                 data-instance-id={field.instanceId || ''}
//             >
//                 {field.label}
//             </button>
//         );
//     };
//
//     const renderFieldBasedOnType = (field) => {
//         if (field.type === 'hidden') {
//             return (
//                 <input
//                     type="hidden"
//                     id={field.id}
//                     name={field.httpName}
//                     value={getFieldValue(field)}
//                 />
//             );
//         }
//         return (
//             <Fragment key={String(field.id)}>
//                 {(field.labelOutside && !field.labelOnTop) && renderLabel(field)}
//                 {(['text', 'email', 'tel', 'time'].includes(field.type)) && renderTextInput(field)}
//                 {field.type === 'number' && renderNumberInput(field)}
//                 {field.type === 'password' && renderPasswordInput(field)}
//                 {field.type === 'date' && renderDateInput(field)}
//                 {field.type === 'textarea' && renderTextarea(field)}
//                 {field.type === 'select' && renderSelect(field)}
//                 {field.type === 'radio' && renderChoiceInputs(field, 'radio')}
//                 {field.type === 'checkbox' && renderChoiceInputs(field, 'checkbox')}
//                 {field.type === 'file' && renderFileInput(field)}
//                 {field.type === 'button' && renderButton(field)}
//             </Fragment>
//         );
//     };
//     const handleCopy = (event) => {
//         event.preventDefault();
//     };
//     const handleCut = (event) => {
//         event.preventDefault();
//     };
//     const handlePaste = (event) => {
//         event.preventDefault();
//     };
//     const handleMouseDown = (event) => {
//         event.preventDefault();
//     };
//     const handleKeyDown = (event) => {
//         if (event.ctrlKey) {
//             event.preventDefault();
//         }
//     };
//     const showSelectDateModalForField = (fieldID, fieldLabel) => {
//         setSelectedDateFieldID(fieldID);
//         setSelectedDateFieldLabel(fieldLabel);
//         setShowSelectDateModal(true);
//     }
//     const handleDateSelection = (day, month, year) => {
//         if (!day || !month || !year) {
//             setSelectedDateError(lang === 'ar' ? 'الرجاء اختيار تاريخ صحيح' : 'Please select a valid date');
//             setTimeout(() => {
//                 setSelectedDateError('');
//             }, msgTimeout);
//             return;
//         }
//         if (day < 10) {
//             day = `0${day}`;
//         }
//         if (month < 10) {
//             month = `0${month}`;
//         }
//         setSelectedDateDay(day);
//         setSelectedDateMonth(month);
//         setSelectedDateYear(year);
//         dynamicFields.find(f => f.id === selectedDateFieldID).setValue(`${year}-${month}-${day}`);
//         setSelectedDateMonth('');
//         setSelectedDateDay('');
//         setSelectedDateYear('');
//         setShowSelectDateModal(false);
//
//         if (!noInputFieldsCache) {
//             saveToCache({id: selectedDateFieldID, label: selectedDateFieldLabel}, `${year}-${month}-${day}`);
//         }
//     }
//     const processFieldRules = useCallback((currentFields, field, value) => {
//         if (field.rules) {
//
//             const rule = field.rules.find(r => r.value === value);
//
//             if (rule) {
//                 const newFields = currentFields.filter(f => {
//                     let keep = true;
//                     field.rules.forEach(rule => {
//                         rule.ruleResult.forEach(newField => {
//                             if (newField.name === f.name) {
//                                 keep = false;
//                             } else if (newField.rules) {
//                                 newField.rules.forEach(subRule => {
//                                     subRule.ruleResult.forEach(subNewField => {
//                                         if (subNewField.name === f.name) {
//                                             keep = false;
//                                         }
//                                     });
//                                 });
//                             }
//                         });
//                     });
//                     return keep;
//                 });
//
//                 const currentIndex = newFields.findIndex(f => f.name === field.name);
//
//                 rule.ruleResult.forEach(newField => {
//                     newFields.splice(currentIndex + 1, 0, newField);
//                 });
//
//                 return newFields;
//
//             } else {
//
//                 return currentFields.filter(f => {
//                     let keep = true;
//                     field.rules.forEach(rule => {
//                         rule.ruleResult.forEach(newField => {
//                             if (newField.name === f.name) {
//                                 keep = false;
//                             } else if (newField.rules) {
//                                 newField.rules.forEach(subRule => {
//                                     subRule.ruleResult.forEach(subNewField => {
//                                         if (subNewField.name === f.name) {
//                                             keep = false;
//                                         }
//                                     });
//                                 });
//                             }
//                         });
//                     });
//
//                     return keep;
//                 });
//             }
//         }
//
//         return currentFields;
//     }, []);
//
//     const onChange = (e, field) => {
//         const maxSizeInBytes = 2 * 1024 * 1024;
//         const value = (field.type === 'radio' || field.type === 'checkbox') ? e.target.checked : e.target.value;
//         if (field.type === 'number' && (isNaN(value) || (field.minimumValue && Number(value) < field.minimumValue) || (field.maximumValue && Number(value) > field.maximumValue))) {
//             e.target.setCustomValidity(`Value must be a number between ${field.minimumValue} and ${field.maximumValue}`);
//         } else if (field.type === 'file' && e.target.files[0].size > maxSizeInBytes) {
//             e.target.setCustomValidity('File size must be less than 2MB');
//         } else if (field.type === 'file' && !field.allowedFileTypes.includes(e.target.files[0].type)) {
//             e.target.setCustomValidity(`File type must be one of the following: ${field.allowedFileTypes.join(', ')}`);
//         } else if (field.type === 'file') {
//             const file = e.target.files[0];
//             e.target.setCustomValidity('');
//             setGeneralFormError('');
//             setSuccessMessage('');
//             setFileInputs(prev => ({...prev, [field.id]: file}));
//             field.file = file;
//         } else {
//             if (field.regex && !new RegExp(field.regex).test(value)) {
//                 e.target.setCustomValidity(field.errorMsg);
//                 e.target.reportValidity();
//             } else {
//                 e.target.setCustomValidity('');
//                 setGeneralFormError('');
//                 setSuccessMessage('');
//
//                 setFieldValues(prev => ({...prev, [field.id]: value}));
//
//                 if (!noInputFieldsCache) {
//                     saveToCache(field, value);
//                 }
//             }
//
//             // const newFields = processFieldRules(dynamicFields, field, value);
//             // setDynamicFields(newFields);
//         }
//     }
//
//     const onSubmit = async (e) => {
//         e.preventDefault();
//         if (submitting) {
//             return;
//         }
//         if (enteredCaptcha !== captchaValue && !noCaptcha) {
//             setGeneralFormError(lang === 'ar' ? 'الكود التحقق غير صحيح' : 'Captcha is incorrect');
//             setTimeout(() => {
//                 setGeneralFormError('');
//             }, msgTimeout);
//             return;
//         }
//         for (let i = 0; i < dynamicFields.length; i++) {
//             if (dynamicFields[i].mustMatchFieldWithId) {
//                 let firstValue = dynamicFields[i].value;
//                 let secondValue = dynamicFields[dynamicFields[i].mustMatchFieldWithId].value;
//
//                 if (firstValue && secondValue) {
//                     if (firstValue !== secondValue) {
//                         setGeneralFormError("Field '" + dynamicFields[i].label + "' must match field '" + dynamicFields.find(field => field.id === dynamicFields[i].mustMatchFieldWithId).label + "'");
//                         setTimeout(() => {
//                             setGeneralFormError('');
//                         }, msgTimeout);
//
//                         return;
//                     }
//                 }
//             }
//             if (dynamicFields[i].mustNotMatchFieldWithId) {
//                 let firstValue = dynamicFields[i].value;
//                 let secondValue = dynamicFields[dynamicFields[i].mustNotMatchFieldWithId].value;
//
//                 if (firstValue && secondValue) {
//                     if (firstValue === secondValue) {
//                         setGeneralFormError("Field '" + dynamicFields[i].label + "' must not match field '" + dynamicFields.find(field => field.id === dynamicFields[i].mustNotMatchFieldWithId).label + "'");
//                         setTimeout(() => {
//                             setGeneralFormError('');
//                         }, msgTimeout);
//
//                         return;
//                     }
//                 }
//             }
//         }
//
//         setSubmitting(true);
//
//         if (hasSetSubmittingLocal) {
//             setSubmittingLocal(true);
//         }
//
//         setGeneralFormError('');
//         setSuccessMessage('');
//
//         try {
//             const formData = new FormData();
//             dynamicFields.forEach(field => {
//                 let value = fieldValues[field.id] || '';
//
//                 if (field.type === 'file' && field.file) {
//                     const file = field.file;
//                     const fileExtension = file.name.split('.').pop();
//                     const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
//                     const uniqueFileName = `${fileNameWithoutExt}-${uuidv6()}.${fileExtension}`;
//                     const renamedFile = new File([file], uniqueFileName, {type: file.type});
//                     value = uniqueFileName;
//                     formData.append(`uniqueFileName_${field.label}`, uniqueFileName);
//                     formData.append(field.label, renamedFile, uniqueFileName);
//                 }
//
//                 formData.append(`field_${field.id}`, value);
//                 formData.append(`label_${field.id}`, field.label);
//             });
//
//             formData.append('mailTo', mailTo);
//             formData.append('formTitle', formTitle);
//
//             if (hasDifferentOnSubmitBehaviour && differentOnSubmitBehaviour) {
//
//                 try {
//                     const result = await differentOnSubmitBehaviour(formData);
//
//                     if (result) {
//                         setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');
//                         setTimeout(() => {
//                             setSuccessMessage('');
//                             resetFormCompletely();
//                             clearCache();
//                         }, msgTimeout);
//                     }
//                 } catch (error) {
//                     setGeneralFormError(error.message || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.'));
//                     setTimeout(() => {
//                         setGeneralFormError('');
//                     }, msgTimeout);
//
//                     setSubmitting(false);
//
//                     if (hasSetSubmittingLocal) {
//                         setSubmittingLocal(false)
//                     }
//                 }
//             } else {
//                 try {
//                     const result = await submitFormRequest(formData)
//                     if (result.success) {
//                         setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');
//                         setTimeout(() => {
//                             setSuccessMessage('');
//                             if (formInModalPopup) {
//                                 setShowFormModalPopup(false);
//                             }
//                             resetFormCompletely();
//                             clearCache();
//                         }, msgTimeout);
//                     } else {
//                         setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : result.message || 'Form submission failed. Please try again.');
//                         setTimeout(() => {
//                             setGeneralFormError('');
//                         }, msgTimeout);
//                     }
//                 } catch (error) {
//                     setGeneralFormError(error.message || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.'));
//                     setTimeout(() => {
//                         setGeneralFormError('');
//                     }, msgTimeout);
//                     setSubmitting(false);
//                     if (hasSetSubmittingLocal) {
//                         setSubmittingLocal(false)
//                     }
//                 }
//             }
//         } catch (error) {
//             setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : error || error.message + ': Form submission failed. Please try again.');
//             setTimeout(() => {setGeneralFormError('');}, msgTimeout);
//         } finally {
//             setSubmitting(false);
//
//             if (hasSetSubmittingLocal) {
//                 setSubmittingLocal(false);
//             }
//         }
//     };
//
//     useEffect(() => {
//         if (noInputFieldsCache) {
//             return;
//         }
//
//         const cachedValues = loadCachedValues();
//
//         dynamicFields.forEach(field => {
//             const cachedValue = cachedValues[field.id];
//             if (cachedValue !== undefined) {
//                 setFieldValues(prev => ({...prev, [field.id]: cachedValue}));
//             }
//         });
//
//         let currentFields = [...dynamicFields];
//
//         dynamicFields.forEach(field => {
//             const cachedValue = cachedValues[field.id];
//             if (field.rules && cachedValue) {
//                 currentFields = processFieldRules(currentFields, field, cachedValue);
//             }
//         });
//
//
//         setDynamicFields(currentFields);
//     }, []);
//
//     useEffect(() => {
//         if (captchaValue === '') {
//             setCaptchaValue(generateCaptcha());
//         }
//     }, [captchaValue, setCaptchaValue, generateCaptcha]);
//
//     useEffect(() => {
//         if (resetFormFromParent) {
//             resetFormCompletely();
//
//             if (setResetForFromParent) {
//                 setResetForFromParent(false);
//             }
//         }
//     }, [resetFormFromParent, setResetForFromParent, fields.length, resetFormCompletely]);
//
//     const getLocalizedText = (lang, enText, arText) => {
//         return lang === 'ar' ? arText : enText;
//     };
//
//     const CaptchaField = () => {
//         if (noCaptcha) return null;
//
//         const captchaWrapperClass = captchaLength === 2
//             ? (fullMarginField ? 'captcha-wrapper-with-half-width-full-margin' : 'captcha-wrapper-half-width')
//             : (fullMarginField ? 'captcha-wrapper-with-full-margin' : 'captcha-wrapper');
//         const fieldWidthClass = captchaLength === 2 ? 'full-width' : 'half-width';
//         const refreshButtonClass = captchaLength === 2 ? 'captcha-refresh-button-half-width' : 'refresh-captcha-button';
//
//         return (
//             <>
//                 {!easySimpleCaptcha && (
//                     <label htmlFor="captcha" className="form-label-outside">
//                         {getLocalizedText(lang, 'Captcha*', 'كود التحقق*')}
//                     </label>
//                 )}
//                 <div className={captchaWrapperClass}>
//                     <input
//                         className={`text-form-field ${fieldWidthClass} captcha-input`}
//                         type="text"
//                         placeholder=""
//                         required
//                         value={enteredCaptcha}
//                         onChange={(e) => setEnteredCaptcha(e.target.value)}
//                         onPaste={handlePaste}
//                     />
//                     <div
//                         className={`text-form-field ${fieldWidthClass} captcha-box`}
//                         onCopy={handleCopy}
//                         onCut={handleCut}
//                         onPaste={handlePaste}
//                         onMouseDown={handleMouseDown}
//                         onKeyDown={handleKeyDown}
//                         onTouchStart={handleMouseDown}
//                     >
//                         {captchaValue}
//                     </div>
//                     <button
//                         className={refreshButtonClass}
//                         onClick={(e) => {
//                             e.preventDefault();
//                             setCaptchaValue(generateCaptcha());
//                         }}
//                         type="button"
//                     >
//                         ⟳
//                     </button>
//                 </div>
//             </>
//         );
//     };
//
//     const SubmitButton = () => {
//         if (hasDifferentSubmitButtonText) {
//             const buttonText = lang === 'ar'
//                 ? (submitting ? differentSubmitButtonText[3] : differentSubmitButtonText[2])
//                 : (submitting ? differentSubmitButtonText[1] : differentSubmitButtonText[0]);
//             return (
//                 <button type="submit" disabled={submitting} className="submit-button">
//                     {buttonText}
//                 </button>
//             );
//         }
//
//         return (
//             <button type="submit" disabled={submitting} className="submit-button">
//                 {getLocalizedText(lang,
//                     submitting ? 'Submitting...' : 'Submit',
//                     submitting ? 'جاري الارسال...' : 'ارسال'
//                 )}
//             </button>
//         );
//     };
//
//     const ResetButtons = () => (
//         <div className="reset-buttons-wrapper">
//             {!noClearOption && (
//                 <button type="reset" disabled={submitting} className="reset-button">
//                     {getLocalizedText(lang, 'Clear', 'مسح')}
//                 </button>
//             )}
//         </div>
//     );
//
//     const FormFooter = () => {
//         if (formIsReadOnly) return null;
//         const footerClass = `form-footer ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : ''}`;
//         const buttonsWrapperClass = `form-footer-buttons-wrapper ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : 'left-buttons'}`;
//
//         const submitButton = (
//             <SubmitButton/>
//         );
//
//         const resetButtons = (
//             <ResetButtons/>
//         );
//
//         return (
//             <div className={footerClass}>
//                 {generalFormError && <p className="general-form-error">{generalFormError}</p>}
//                 {successMessage && <p className="success-message">{successMessage}</p>}
//                 <div className={buttonsWrapperClass}>
//                     {switchFooterButtonsOrder ? (
//                         <>
//                             {resetButtons}
//                             {submitButton}
//                         </>
//                     ) : (
//                         <>
//                             {submitButton}
//                             {resetButtons}
//                         </>
//                     )}
//                 </div>
//             </div>
//         );
//     };
//
//     const DateModal = () => {
//         const closeModal = () => {
//             setShowSelectDateModal(false);
//             setSelectedDateMonth('');
//             setSelectedDateDay('');
//             setSelectedDateYear('');
//             setSelectedDateError('');
//             dynamicFields.find(f => f.id === selectedDateFieldID).setValue('');
//         };
//
//         const handleSubmit = (e) => {
//             e.preventDefault();
//             handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
//         };
//
//         const handleKeyDown = (e) => {
//             if (e.key === 'Enter') {
//                 handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
//             }
//         };
//
//         const generateDayOptions = () => {
//             if (selectedDateMonth && selectedDateYear && parseInt(selectedDateYear) && parseInt(selectedDateMonth)) {
//                 const daysInMonth = new Date(parseInt(selectedDateYear), parseInt(selectedDateMonth), 0).getDate();
//                 return Array.from({length: daysInMonth}, (v, k) => k + 1).map(day => (
//                     <option key={day} value={day}>{day}</option>
//                 ));
//             }
//             return null;
//         };
//
//         return (
//             <animated.div style={animateDateModal} className="form-select-date-modal">
//                 <div className="form-select-date-modal-overlay" onClick={closeModal}/>
//                 <div className="form-select-date-modal-container">
//                     <div className="form-select-date-modal-header">
//                         <p>{selectedDateFieldLabel}</p>
//                     </div>
//                     <div className="form-select-date-modal-content">
//                         <form
//                             className="form-select-date-modal-form"
//                             onSubmit={handleSubmit}
//                             onKeyDown={handleKeyDown}
//                         >
//                             <select
//                                 className="select-form-field third-width"
//                                 onChange={(e) => setSelectedDateYear(e.target.value)}
//                                 value={selectedDateYear}
//                                 autoFocus
//                             >
//                                 <option value="">Year</option>
//                                 {Array.from({length: new Date().getFullYear() - 1970 + 1}, (v, k) => k + 1970).map(year => (
//                                     <option key={year} value={year}>{year}</option>
//                                 ))}
//                             </select>
//                             <select
//                                 className="select-form-field third-width"
//                                 onChange={(e) => setSelectedDateMonth(e.target.value)}
//                                 value={selectedDateMonth}
//                             >
//                                 <option value="">Month</option>
//                                 {Array.from({length: 12}, (v, k) => k + 1).map(month => (
//                                     <option key={month} value={month}>{month}</option>
//                                 ))}
//                             </select>
//                             <select
//                                 className="select-form-field third-width"
//                                 onChange={(e) => setSelectedDateDay(e.target.value)}
//                                 value={selectedDateDay}
//                             >
//                                 <option value="">Day</option>
//                                 {generateDayOptions()}
//                             </select>
//                         </form>
//                     </div>
//                     {selectedDateError && <p className="general-form-error">{selectedDateError}</p>}
//                     <div className="form-select-date-modal-footer">
//                         <button className="form-select-date-modal-close-btn" onClick={closeModal}>
//                             {getLocalizedText(lang, 'Cancel', 'إلغاء')}
//                         </button>
//                         <button
//                             className="form-select-date-modal-confirm-btn"
//                             onClick={() => handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear)}
//                             type="submit"
//                         >
//                             {getLocalizedText(lang, 'Confirm', 'تأكيد')}
//                         </button>
//                     </div>
//                 </div>
//             </animated.div>
//         );
//     };
//
//     const MainForm = () => {
//         return (
//             <>
//                 <form className="form" onSubmit={onSubmit} method="post" onReset={resetForm}>
//                     {dynamicFields.map((field) => (renderFieldBasedOnType(field)))}
//                     <CaptchaField/>
//                     <FormFooter/>
//                 </form>
//                 <DateModal/>
//             </>
//         );
//     };
//
//     return (
//         <>
//             {MainForm()}
//         </>
//     );
// }
//
// const fieldShape = {
//     id: PropTypes.string.isRequired,
//     httpName: PropTypes.string.isRequired,
//     label: PropTypes.string.isRequired,
//     type: PropTypes.string.isRequired,
//     required: PropTypes.bool.isRequired,
//     value: PropTypes.object,
//     setValue: PropTypes.func,
//     errorMsg: PropTypes.string,
//     choices: PropTypes.arrayOf(PropTypes.string),
//     regex: PropTypes.string,
//     widthOfField: PropTypes.number,
//     labelOutside: PropTypes.bool,
//     allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
//     placeholder: PropTypes.string,
//     dontLetTheBrowserSaveField: PropTypes.bool,
//     multiple: PropTypes.bool,
//     onClick: PropTypes.func,
//     mustMatchFieldWithId: PropTypes.number,
//     mustNotMatchFieldWithId: PropTypes.number,
//     labelOnTop: PropTypes.bool,
//     readOnlyField: PropTypes.bool,
//     defaultValue: PropTypes.string,
//     minimumValue: PropTypes.string,
//     maximumValue: PropTypes.string,
//     rules: PropTypes.arrayOf({
//         value: PropTypes.string.isRequired,
//         ruleResult: PropTypes.arrayOf(PropTypes.shape(PropTypes.object)).isRequired
//     }),
// };
//
//
//
// Form.propTypes = {
//     fields: PropTypes.arrayOf(fieldShape).isRequired,
//     mailTo: PropTypes.string.isRequired,
//     formTitle: PropTypes.string.isRequired,
//     lang: PropTypes.string.isRequired,
//     captchaLength: PropTypes.number.isRequired,
//     noInputFieldsCache: PropTypes.bool,
//     noCaptcha: PropTypes.bool,
//     hasDifferentOnSubmitBehaviour: PropTypes.bool,
//     differentOnSubmitBehaviour: PropTypes.func,
//     noClearOption: PropTypes.bool,
//     hasDifferentSubmitButtonText: PropTypes.bool,
//     differentSubmitButtonText: PropTypes.arrayOf(PropTypes.string),
//     centerSubmitButton: PropTypes.bool,
//     easySimpleCaptcha: PropTypes.bool,
//     fullMarginField: PropTypes.bool,
//     hasSetSubmittingLocal: PropTypes.bool,
//     setSubmittingLocal: PropTypes.func,
//     resetFormFromParent: PropTypes.bool,
//     setResetForFromParent: PropTypes.func,
//     formInModalPopup: PropTypes.bool,
//     setShowFormModalPopup: PropTypes.func,
//     formIsReadOnly: PropTypes.bool,
//     footerButtonsSpaceBetween: PropTypes.bool,
//     switchFooterButtonsOrder: PropTypes.bool,
// };
//
// export default Form;
//
//
//

import PropTypes from 'prop-types';
import {useEffect, useState, useRef, createRef} from "react";
import {Fragment} from "react";
import '../styles/Form.css'
import {v6 as uuidv6} from 'uuid';
import {useSpring, animated} from "react-spring";
import {useCallback} from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import {useFormCache} from "../services/Utils.jsx";
import {msgTimeout} from "../services/Utils.jsx";
import {submitFormRequest} from "../services/Utils.jsx";
function Form({
                  fields,
                  mailTo,
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
                  formInModalPopup,
                  setShowFormModalPopup,
                  formIsReadOnly,
                  footerButtonsSpaceBetween,
                  switchFooterButtonsOrder,
              }) {
    
    const [submitting, setSubmitting] = useState(false);
    const [generalFormError, setGeneralFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [dynamicFields, setDynamicFields] = useState(fields);
    const captchaMaxLength = easySimpleCaptcha ? 4 : 7;
    const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz0123456789@#$%&';
    const [fileInputs, setFileInputs] = useState({});
    const [showSelectDateModal, setShowSelectDateModal] = useState(false);
    const [selectedDateDay, setSelectedDateDay] = useState('');
    const [selectedDateMonth, setSelectedDateMonth] = useState('');
    const [selectedDateYear, setSelectedDateYear] = useState('');
    const [selectedDateFieldID, setSelectedDateFieldID] = useState(null);
    const [selectedDateFieldLabel, setSelectedDateFieldLabel] = useState('');
    const [selectedDateError, setSelectedDateError] = useState('');
    const animateDateModal = useSpring({ opacity: showSelectDateModal ? 1 : 0, transform: showSelectDateModal ? 'translateY(0)' : 'translateY(-100%)' });
    const [showPasswords, setShowPasswords] = useState(false);
    const {loadCachedValues, saveToCache, clearCache} = useFormCache(formTitle, fields);
    const [prefilledInitialized, setPrefilledInitialized] = useState(false);
    const [captchaValue, setCaptchaValue] = useState('');
    const fieldRefs = useRef({});
    const enteredCaptcha = useRef('');
    const [refsHaveBeenSet, setRefsHaveBeenSet] = useState(false);
    const [cacheHaveBeenLoaded, setCacheHaveBeenLoaded] = useState(false);

    
    const resetFormCommon = (shouldClearFieldDefaults = false) => {
        
        if (shouldClearFieldDefaults) {
            const newFields = fields.map(field => ({
                ...field,
                defaultValue: '',
                value: ''
            }));
            setDynamicFields(newFields);
        } else {
            setDynamicFields([...fields]);
        }
        
        Object.keys(fieldRefs.current).forEach(fieldId => {
            const ref = fieldRefs.current[fieldId];
            if (ref.current) {
                if (ref.current.type === 'checkbox' || ref.current.type === 'radio') {
                    ref.current.checked = false;
                } else {
                    ref.current.value = '';
                }
            }
        });
        
        setFileInputs({});
        setCaptchaValue(generateCaptcha());
        
        enteredCaptcha.current = '';
        
        setGeneralFormError('');
        setSuccessMessage('');
        
        if (hasSetSubmittingLocal) {
            setSubmittingLocal(false);
        }
        if (!shouldClearFieldDefaults && prefilledInitialized) {
            setPrefilledInitialized(false);
        }
    };
    
    const resetFormCompletely = useCallback(() => {
        resetFormCommon(false);
    }, []);
    
    const resetForm = () => {
        resetFormCompletely();
        clearCache();
    }
    
    const generateCaptcha = useCallback(() => {
        let captcha = '';
        
        for (let i = 0; i < captchaMaxLength; i++) {
            captcha += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        return captcha;
    }, [captchaMaxLength, characters])
    
    const getWidthClass = (widthOfField) => {
        if (widthOfField === 1) return fullMarginField ? 'full-width-with-margin' : 'full-width';
        if (widthOfField === 1.5) return 'two-thirds-width';
        if (widthOfField === 2) return 'half-width';
        return 'third-width';
    };
    
    const getCommonInputProps = (field) => ({
        id: field.id,
        name: field.httpName,
        required: field.required,
        disabled: submitting || field.readOnlyField,
        readOnly: field.readOnlyField || false,
        onChange: (e) => onChange(e, field),
        ref: fieldRefs.current[field.id],
        defaultValue: field.defaultValue || ''
    });
    
    const getPlaceholder = (field) =>
        `${field.placeholder || field.label}${field.required ? '*' : ''}`;
    
    const getLabelText = (field) =>
        `${field.label}${field.required ? '*' : ''}`;
    
    const renderLabel = (field, htmlFor = field.id) => (
        <label htmlFor={htmlFor} className="form-label-outside">
            {getLabelText(field)}
        </label>
    );
    
    const renderWithOptionalLabel = (field, children) => {
        const widthClass = getWidthClass(field.widthOfField);
        
        if (field.labelOutside && field.labelOnTop) {
            return (
                <div className={`field-with-label-on-top ${widthClass}`}>
                    {renderLabel(field)}
                    {children}
                </div>
            );
        }
        
        return children;
    };
    
    const renderTextInput = (field, type = field.type) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);
        
        const inputProps = {
            ...baseProps,
            type,
            placeholder: getPlaceholder(field),
            className: `text-form-field ${field.readOnlyField ? 'read-only-field' : ''}`
        };
        
        if (field.dontLetTheBrowserSaveField) {
            inputProps.name = 'hidden';
            inputProps.autoComplete = 'new-password';
            inputProps['data-lpignore'] = 'true';
        }
        
        const input = <input {...inputProps} className={`${inputProps.className} ${!field.labelOutside || !field.labelOnTop ? widthClass : ''}`}/>;
        
        return renderWithOptionalLabel(field, input);
    };
    
    const renderNumberInput = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);
        
        const handleNumberChange = (delta) => (e) => {
            e.preventDefault();
            const ref = fieldRefs.current[field.id];
            
            if (ref && ref.current) {
                const currentValue = parseInt(ref.current.value) || 0;
                
                if (!(
                    (field.maximumValue && currentValue + delta > field.maximumValue) ||
                    (field.minimumValue && currentValue + delta < field.minimumValue) ||
                    isNaN(currentValue + delta)
                )) {
                    ref.current.value = currentValue + delta;
                    
                    if (!noInputFieldsCache) {
                        saveToCache(field, currentValue + delta);
                    }
                }
            }
        };
        
        const numberInput = (
            <div className={`number-input-container ${!field.labelOutside || !field.labelOnTop ? widthClass : ''}`}>
                <button className="number-input-reduce-button" type="button" onClick={handleNumberChange(-1)}>
                    <span><RemoveIcon/></span>
                </button>
                
                <input
                    {...baseProps}
                    type="text"
                    placeholder={getPlaceholder(field)}
                    className={`number-form-field ${field.readOnlyField ? 'read-only-field' : ''}`}
                    min={field.minimumValue || ''}
                    max={field.maximumValue || ''}
                />
                
                <button className="number-input-add-button" type="button" onClick={handleNumberChange(1)}>
                    <span><AddIcon/></span>
                </button>
            </div>
        );
        
        return renderWithOptionalLabel(field, numberInput);
    };
    
    const renderPasswordInput = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);
        
        const inputProps = {
            ...baseProps,
            type: field.dontLetTheBrowserSaveField ? "text" : (showPasswords ? "text" : "password"),
            placeholder: getPlaceholder(field),
            className: `text-form-field ${(!showPasswords && field.dontLetTheBrowserSaveField) ? 'txtPassword' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`
        };
        
        if (field.dontLetTheBrowserSaveField) {
            inputProps.name = 'hidden';
            inputProps.autoComplete = 'new-password';
            inputProps['data-lpignore'] = 'true';
        }
        
        const passwordField = (
            <div className={`password-field-wrapper ${!field.labelOutside || !field.labelOnTop ? widthClass : ''}`}>
                <input {...inputProps} />
                <button
                    type="button"
                    className="toggle-password-visibility"
                    onClick={() => setShowPasswords(!showPasswords)}
                    aria-label={showPasswords ? "Hide password" : "Show password"}
                    tabIndex="-1"
                >
                    {showPasswords ? <VisibilityOffIcon/> : <VisibilityIcon/>}
                </button>
            </div>
        );
        
        return renderWithOptionalLabel(field, passwordField);
    };
    
    const renderDateInput = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);
        
        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                setShowSelectDateModal(false);
                setSelectedDateMonth('');
                setSelectedDateDay('');
                setSelectedDateYear('');
                setSelectedDateError('');
                
                const ref = fieldRefs.current[selectedDateFieldID];
                
                if (ref && ref.current) {
                    ref.current.value = '';
                }
            }
        };
        
        const dateInput = (
            <input
                {...baseProps}
                type="text"
                placeholder={`${field.placeholder ? field.placeholder + ' (YYYY-MM-DD)' : field.label + ' (YYYY-MM-DD)'}${field.required ? '*' : ''}`}
                readOnly={true}
                onFocus={() => showSelectDateModalForField(field.id, field.label)}
                onKeyDown={handleKeyDown}
                className={`text-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
            />
        );
        
        return renderWithOptionalLabel(field, dateInput);
    };
    
    const renderTextarea = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);
        
        const textarea = (
            <textarea
                {...baseProps}
                placeholder={getPlaceholder(field)}
                className={`textarea-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.large ? 'large-height-textarea' : ''} ${field.readOnlyField ? 'read-only-field' : ''}`}
            />
        );
        
        return renderWithOptionalLabel(field, textarea);
    };
    
    const renderSelect = (field) => {
        const baseProps = getCommonInputProps(field);
        const widthClass = getWidthClass(field.widthOfField);
        
        const selectElement = (
            <select
                {...baseProps}
                multiple={field.multiple}
                className={
                    field.multiple ?
                        `select-multiple-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''}` :
                        `select-form-field ${!field.labelOutside || !field.labelOnTop ? widthClass : ''} ${field.readOnlyField ? 'read-only-field' : ''}`
                }
            >
                {!field.multiple && <option value="">{getLabelText(field)}</option>}
                {field.choices && field.choices.map((choice, index) => (
                    <option key={index} value={choice}>{choice}</option>
                ))}
            </select>
        );
        
        return renderWithOptionalLabel(field, selectElement);
    };
    
    const renderChoiceInputs = (field, type) => {
        const widthClass = getWidthClass(field.widthOfField);
        
        return field.choices && field.choices.map((choice, index) => {
            const choiceRefKey = `${field.id}_${index}`;
            if (!fieldRefs.current[choiceRefKey]) {
                fieldRefs.current[choiceRefKey] = createRef();
            }
            
            return (
                <label key={index}>
                    <input
                        type={type}
                        id={field.id}
                        name={field.httpName}
                        required={field.required}
                        value={choice}
                        disabled={submitting}
                        className={`${type}-form-field ${widthClass}`}
                        onChange={(e) => onChange(e, field)}
                        data-instance-id={field.instanceId || ''}
                        defaultChecked={(!field.readOnlyField && field.value) ? field.value === choice : false}
                        ref={fieldRefs.current[choiceRefKey]}
                    />
                    {choice}
                </label>
            );
        });
    };
    
    const renderFileInput = (field) => {
        const widthClass = getWidthClass(field.widthOfField);
        
        if (!fieldRefs.current[field.id]) {
            fieldRefs.current[field.id] = createRef();
        }
        
        return (
            <div className={`file-form-field-styled ${widthClass}`} data-instance-id={field.instanceId || ''}>
                <label htmlFor={field.id}>
                    {getLabelText(field)}
                </label>
                <div className="file-form-field-styled-buttons-wrapper">
                    <button type="button" disabled={submitting}
                    onClick={() => {
                        const ref = fieldRefs.current[field.id];
                        if (ref && ref.current) {
                            ref.current.click();
                        }
                    }}
                    >
                        Upload
                    </button>
                    {fileInputs[field.id] && (
                        <button
                            className="remove-button"
                            onClick={(e) => {
                                e.preventDefault();
                                field.file = null;
                                setFileInputs(prev => ({...prev, [field.id]: null}));
                                
                                // Clear file input using ref
                                const ref = fieldRefs.current[field.id];
                                if (ref && ref.current) {
                                    ref.current.value = '';
                                }
                            }}
                            type="button"
                            disabled={submitting}
                        >
                            Remove
                        </button>
                    )}
                </div>
                <label>
                    {fileInputs[field.id]
                        ? (fileInputs[field.id].name.length > 20
                                ? fileInputs[field.id].name.substring(0, 20) + '...'
                                : fileInputs[field.id].name
                        )
                        : 'No file selected'
                    }
                </label>
                <input
                    type="file"
                    className="file-form-field"
                    id={field.id}
                    name={field.httpName}
                    label={field.label}
                    required={field.required}
                    accept={field.allowedFileTypes ? field.allowedFileTypes.join(',') : ''}
                    disabled={submitting}
                    onChange={(e) => onChange(e, field)}
                    data-instance-id={field.instanceId || ''}
                    ref={fieldRefs.current[field.id]}
                />
                <label>Maximum file size: 2MB</label>
            </div>
        );
    };
    
    const renderButton = (field) => {
        const widthClass = getWidthClass(field.widthOfField);
        
        return (
            <button
                className={`form-button ${widthClass}`}
                onClick={(e) => field.onClick(e, field)}
                type="button"
                disabled={submitting}
                id={field.id}
                data-instance-id={field.instanceId || ''}
            >
                {field.label}
            </button>
        );
    };
    
    const renderFieldBasedOnType = (field) => {
        if (field.type === 'hidden') {
            if (!fieldRefs.current[field.id]) {
                fieldRefs.current[field.id] = createRef();
            }
            
            return (
                <input
                    type="hidden"
                    id={field.id}
                    name={field.httpName}
                    defaultValue={field.defaultValue || ''}
                    ref={fieldRefs.current[field.id]}
                />
            );
        }
        return (
            <Fragment key={String(field.id)}>
                {(field.labelOutside && !field.labelOnTop) && renderLabel(field)}
                {(['text', 'email', 'tel', 'time'].includes(field.type)) && renderTextInput(field)}
                {field.type === 'number' && renderNumberInput(field)}
                {field.type === 'password' && renderPasswordInput(field)}
                {field.type === 'date' && renderDateInput(field)}
                {field.type === 'textarea' && renderTextarea(field)}
                {field.type === 'select' && renderSelect(field)}
                {field.type === 'radio' && renderChoiceInputs(field, 'radio')}
                {field.type === 'checkbox' && renderChoiceInputs(field, 'checkbox')}
                {field.type === 'file' && renderFileInput(field)}
                {field.type === 'button' && renderButton(field)}
            </Fragment>
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
            setTimeout(() => {
                setSelectedDateError('');
            }, msgTimeout);
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
        const dateValue = `${year}-${month}-${day}`;
        const ref = fieldRefs.current[selectedDateFieldID];
        
        if (ref && ref.current) {
            ref.current.value = dateValue;
        }
        
        setSelectedDateMonth('');
        setSelectedDateDay('');
        setSelectedDateYear('');
        setShowSelectDateModal(false);
        
        if (!noInputFieldsCache) {
            saveToCache({id: selectedDateFieldID, label: selectedDateFieldLabel}, dateValue);
        }
    }
    
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
    
    const onChange = (e, field) => {
        const maxSizeInBytes = 2 * 1024 * 1024;
        const value = (field.type === 'radio' || field.type === 'checkbox') ? e.target.checked : e.target.value;
        
        if (field.type === 'number' && (isNaN(value) || (field.minimumValue && Number(value) < field.minimumValue) || (field.maximumValue && Number(value) > field.maximumValue))) {
            e.target.setCustomValidity(`Value must be a number between ${field.minimumValue} and ${field.maximumValue}`);
        } else if (field.type === 'file' && e.target.files[0].size > maxSizeInBytes) {
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
                
                if (!noInputFieldsCache) {
                    saveToCache(field, value);
                }
            }
            
            const newFields = processFieldRules(dynamicFields, field, value);
            setDynamicFields(newFields);
        }
    }
    
    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (submitting) {
            return;
        }
        
        if (enteredCaptcha.current && enteredCaptcha.current.value !== captchaValue && !noCaptcha) {
            setGeneralFormError(lang === 'ar' ? 'الكود التحقق غير صحيح' : 'Captcha is incorrect');
            setTimeout(() => {
                setGeneralFormError('');
            }, msgTimeout);
            return;
        }
        
        for (let i = 0; i < dynamicFields.length; i++) {
            if (dynamicFields[i].mustMatchFieldWithId) {
                const field1Ref = fieldRefs.current[dynamicFields[i].id];
                const field2Ref = fieldRefs.current[dynamicFields[i].mustMatchFieldWithId];
                
                if (field1Ref?.current && field2Ref?.current) {
                    const firstValue = field1Ref.current.value;
                    const secondValue = field2Ref.current.value;
                    
                    if (firstValue && secondValue) {
                        if (firstValue !== secondValue) {
                            setGeneralFormError("Field '" + dynamicFields[i].label + "' must match field '" +
                                dynamicFields.find(field => field.id === dynamicFields[i].mustMatchFieldWithId).label + "'");
                            setTimeout(() => {
                                setGeneralFormError('');
                            }, msgTimeout);
                            
                            return;
                        }
                    }
                }
            }
            
            if (dynamicFields[i].mustNotMatchFieldWithId) {
                const field1Ref = fieldRefs.current[dynamicFields[i].id];
                const field2Ref = fieldRefs.current[dynamicFields[i].mustNotMatchFieldWithId];
                
                if (field1Ref?.current && field2Ref?.current) {
                    const firstValue = field1Ref.current.value;
                    const secondValue = field2Ref.current.value;
                    
                    if (firstValue && secondValue) {
                        if (firstValue === secondValue) {
                            setGeneralFormError("Field '" + dynamicFields[i].label + "' must not match field '" +
                                dynamicFields.find(field => field.id === dynamicFields[i].mustNotMatchFieldWithId).label + "'");
                            setTimeout(() => {
                                setGeneralFormError('');
                            }, msgTimeout);
                            return;
                        }
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
                let value;
                
                if (field.type === 'file' && field.file) {
                    const file = field.file;
                    const fileExtension = file.name.split('.').pop();
                    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                    const uniqueFileName = `${fileNameWithoutExt}-${uuidv6()}.${fileExtension}`;
                    const renamedFile = new File([file], uniqueFileName, {type: file.type});
                    value = uniqueFileName;
                    formData.append(`uniqueFileName_${field.label}`, uniqueFileName);
                    formData.append(field.label, renamedFile, uniqueFileName);
                } else {
                    const ref = fieldRefs.current[field.id];
                    if (ref && ref.current) {
                        if (field.type === 'checkbox' || field.type === 'radio') {
                            value = ref.current.checked ? ref.current.value : '';
                        } else {
                            value = ref.current.value || '';
                        }
                    } else {
                        value = field.readOnlyField ? (field.value || '') : '';
                    }
                }
                
                formData.append(`field_${field.id}`, value);
                formData.append(`label_${field.id}`, field.label);
            });
            
            formData.append('mailTo', mailTo);
            formData.append('formTitle', formTitle);
            
            if (hasDifferentOnSubmitBehaviour && differentOnSubmitBehaviour) {
                try {
                    const result = await differentOnSubmitBehaviour(formData);
                    
                    if (result) {
                        setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');
                        setTimeout(() => {
                            setSuccessMessage('');
                            resetFormCompletely();
                            clearCache();
                        }, msgTimeout);
                    }
                } catch (error) {
                    setGeneralFormError(error.message || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.'));
                    setTimeout(() => {
                        setGeneralFormError('');
                    }, msgTimeout);
                    
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
                    setGeneralFormError(error.message || (lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : 'Form submission failed. Please try again.'));
                    setTimeout(() => {
                        setGeneralFormError('');
                    }, msgTimeout);
                    setSubmitting(false);
                    if (hasSetSubmittingLocal) {
                        setSubmittingLocal(false)
                    }
                }
            }
        } catch (error) {
            setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : error || error.message + ': Form submission failed. Please try again.');
            setTimeout(() => {setGeneralFormError('');}, msgTimeout);
        } finally {
            setSubmitting(false);
            
            if (hasSetSubmittingLocal) {
                setSubmittingLocal(false);
            }
        }
    };
    
    useEffect(() => {
        if ( noInputFieldsCache || cacheHaveBeenLoaded || (!refsHaveBeenSet) ) {
            return;
        }
        
        const cachedValues = loadCachedValues();
        
        dynamicFields.forEach(field => {
            const cachedValue = cachedValues[field.id];
            if (cachedValue !== undefined && field.value === '') {
                const ref = fieldRefs.current[field.id];
                if (ref && ref.current) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        ref.current.checked = cachedValue;
                    } else {
                        ref.current.value = cachedValue;
                    }
                }
            } else if (field.value !== '') {
                const ref = fieldRefs.current[field.id];
                if (ref && ref.current) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        ref.current.checked = field.value;
                    } else {
                        ref.current.value = field.value;
                    }
                }
            }
        });
        
        
        let currentFields = [...dynamicFields];
        
        dynamicFields.forEach(field => {
            const cachedValue = cachedValues[field.id];
            
            if (field.rules && cachedValue) {
                currentFields = processFieldRules(currentFields, field, cachedValue);
            }
        });
        
        setDynamicFields(currentFields);
        
        setCacheHaveBeenLoaded(true);

    
    }, [dynamicFields, noInputFieldsCache, cacheHaveBeenLoaded, fieldRefs, processFieldRules, refsHaveBeenSet, loadCachedValues]);
    
    useEffect(() => {
        dynamicFields.forEach(field => {
            if (!fieldRefs.current[field.id]) {
                fieldRefs.current[field.id] = createRef();
            }
        });
        
        setRefsHaveBeenSet(true);
    }, [dynamicFields]);
    
    useEffect(() => {
        if (captchaValue === '') {
            setCaptchaValue(generateCaptcha());
        }
    }, [captchaValue, setCaptchaValue, generateCaptcha]);
    
    useEffect(() => {
        if (resetFormFromParent) {
            resetFormCompletely();
            
            if (setResetForFromParent) {
                setResetForFromParent(false);
            }
        }
    }, [resetFormFromParent, setResetForFromParent, fields.length, resetFormCompletely]);
    
    const getLocalizedText = (lang, enText, arText) => {
        return lang === 'ar' ? arText : enText;
    };
    
    const CaptchaField = () => {
        if (noCaptcha) return null;
        
        const captchaWrapperClass = captchaLength === 2
            ? (fullMarginField ? 'captcha-wrapper-with-half-width-full-margin' : 'captcha-wrapper-half-width')
            : (fullMarginField ? 'captcha-wrapper-with-full-margin' : 'captcha-wrapper');
        const fieldWidthClass = captchaLength === 2 ? 'full-width' : 'half-width';
        const refreshButtonClass = captchaLength === 2 ? 'captcha-refresh-button-half-width' : 'refresh-captcha-button';
        
        return (
            <>
                {!easySimpleCaptcha && (
                    <label htmlFor="captcha" className="form-label-outside">
                        {getLocalizedText(lang, 'Captcha*', 'كود التحقق*')}
                    </label>
                )}
                <div className={captchaWrapperClass}>
                    <input
                        className={`text-form-field ${fieldWidthClass} captcha-input`}
                        type="text"
                        placeholder=""
                        required
                        onPaste={handlePaste}
                    />
                    <div
                        className={`text-form-field ${fieldWidthClass} captcha-box`}
                        onCopy={handleCopy}
                        onCut={handleCut}
                        onPaste={handlePaste}
                        onMouseDown={handleMouseDown}
                        onKeyDown={handleKeyDown}
                        onTouchStart={handleMouseDown}
                    >
                        {captchaValue}
                    </div>
                    <button
                        className={refreshButtonClass}
                        onClick={(e) => {
                            e.preventDefault();
                            setCaptchaValue(generateCaptcha());
                        }}
                        type="button"
                    >
                        ⟳
                    </button>
                </div>
            </>
        );
    };
    
    const SubmitButton = () => {
        if (hasDifferentSubmitButtonText) {
            const buttonText = lang === 'ar'
                ? (submitting ? differentSubmitButtonText[3] : differentSubmitButtonText[2])
                : (submitting ? differentSubmitButtonText[1] : differentSubmitButtonText[0]);
            return (
                <button type="submit" disabled={submitting} className="submit-button">
                    {buttonText}
                </button>
            );
        }
        
        return (
            <button type="submit" disabled={submitting} className="submit-button">
                {getLocalizedText(lang,
                    submitting ? 'Submitting...' : 'Submit',
                    submitting ? 'جاري الارسال...' : 'ارسال'
                )}
            </button>
        );
    };
    
    const ResetButtons = () => (
        <div className="reset-buttons-wrapper">
            {!noClearOption && (
                <button type="reset" disabled={submitting} className="reset-button">
                    {getLocalizedText(lang, 'Clear', 'مسح')}
                </button>
            )}
        </div>
    );
    
    const FormFooter = () => {
        if (formIsReadOnly) return null;
        const footerClass = `form-footer ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : ''}`;
        const buttonsWrapperClass = `form-footer-buttons-wrapper ${centerSubmitButton ? 'center-buttons' : footerButtonsSpaceBetween ? '' : 'left-buttons'}`;
        
        const submitButton = (
            <SubmitButton/>
        );
        
        const resetButtons = (
            <ResetButtons/>
        );
        
        return (
            <div className={footerClass}>
                {generalFormError && <p className="general-form-error">{generalFormError}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <div className={buttonsWrapperClass}>
                    {switchFooterButtonsOrder ? (
                        <>
                            {resetButtons}
                            {submitButton}
                        </>
                    ) : (
                        <>
                            {submitButton}
                            {resetButtons}
                        </>
                    )}
                </div>
            </div>
        );
    };
    
    const DateModal = () => {
        const closeModal = () => {
            setShowSelectDateModal(false);
            setSelectedDateMonth('');
            setSelectedDateDay('');
            setSelectedDateYear('');
            setSelectedDateError('');
            
            const ref = fieldRefs.current[selectedDateFieldID];
            
            if (ref && ref.current) {
                ref.current.value = '';
            }
        };
        
        const handleSubmit = (e) => {
            e.preventDefault();
            handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
        };
        
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear);
            }
        };
        
        const generateDayOptions = () => {
            if (selectedDateMonth && selectedDateYear && parseInt(selectedDateYear) && parseInt(selectedDateMonth)) {
                const daysInMonth = new Date(parseInt(selectedDateYear), parseInt(selectedDateMonth), 0).getDate();
                return Array.from({length: daysInMonth}, (v, k) => k + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                ));
            }
            return null;
        };
        
        return (
            <animated.div style={animateDateModal} className="form-select-date-modal">
                <div className="form-select-date-modal-overlay" onClick={closeModal}/>
                <div className="form-select-date-modal-container">
                    <div className="form-select-date-modal-header">
                        <p>{selectedDateFieldLabel}</p>
                    </div>
                    <div className="form-select-date-modal-content">
                        <form
                            className="form-select-date-modal-form"
                            onSubmit={handleSubmit}
                            onKeyDown={handleKeyDown}
                        >
                            <select
                                className="select-form-field third-width"
                                onChange={(e) => setSelectedDateYear(e.target.value)}
                                value={selectedDateYear}
                                autoFocus
                            >
                                <option value="">Year</option>
                                {Array.from({length: new Date().getFullYear() - 1970 + 1}, (v, k) => k + 1970).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select
                                className="select-form-field third-width"
                                onChange={(e) => setSelectedDateMonth(e.target.value)}
                                value={selectedDateMonth}
                            >
                                <option value="">Month</option>
                                {Array.from({length: 12}, (v, k) => k + 1).map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                            <select
                                className="select-form-field third-width"
                                onChange={(e) => setSelectedDateDay(e.target.value)}
                                value={selectedDateDay}
                            >
                                <option value="">Day</option>
                                {generateDayOptions()}
                            </select>
                        </form>
                    </div>
                    {selectedDateError && <p className="general-form-error">{selectedDateError}</p>}
                    <div className="form-select-date-modal-footer">
                        <button className="form-select-date-modal-close-btn" onClick={closeModal}>
                            {getLocalizedText(lang, 'Cancel', 'إلغاء')}
                        </button>
                        <button
                            className="form-select-date-modal-confirm-btn"
                            onClick={() => handleDateSelection(selectedDateDay, selectedDateMonth, selectedDateYear)}
                            type="submit"
                        >
                            {getLocalizedText(lang, 'Confirm', 'تأكيد')}
                        </button>
                    </div>
                </div>
            </animated.div>
        );
    };
    
    const MainForm = () => {
        return (
            <>
                <form className="form" onSubmit={onSubmit} method="post" onReset={resetForm}>
                    {dynamicFields.map((field) => (renderFieldBasedOnType(field)))}
                    <CaptchaField/>
                    <FormFooter/>
                </form>
                <DateModal/>
            </>
        );
    };
    
    return (
        <>
            {MainForm()}
        </>
    );
}

const fieldShape = {
    id: PropTypes.number.isRequired,
    httpName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    required: PropTypes.bool.isRequired,
    value: PropTypes.string,
    setValue: PropTypes.func,
    errorMsg: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.string),
    regex: PropTypes.string,
    widthOfField: PropTypes.number,
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
        ruleResult: PropTypes.arrayOf(PropTypes.object).isRequired
    })),
};

Form.propTypes = {
    fields: PropTypes.arrayOf(PropTypes.shape(fieldShape)).isRequired,
    mailTo: PropTypes.string.isRequired,
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
    formInModalPopup: PropTypes.bool,
    setShowFormModalPopup: PropTypes.func,
    formIsReadOnly: PropTypes.bool,
    footerButtonsSpaceBetween: PropTypes.bool,
    switchFooterButtonsOrder: PropTypes.bool,
};

export default Form;
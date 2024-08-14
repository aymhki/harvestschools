
import PropTypes from "prop-types";
import {useEffect, useState} from "react";
import {Fragment} from "react";
import '../styles/Form.css'
import jsPDF from 'jspdf';
import {createRef} from "react";
import { v4 as uuidv4 } from 'uuid'; // Import the UUID library


function Form({fields, mailTo, sendPdf, formTitle, lang, captchaLength}) {
    const [submitting, setSubmitting] = useState(false); //disable fields when submitting
    const [generalFormError, setGeneralFormError] = useState(''); //general form error message
    const [successMessage, setSuccessMessage] = useState(''); //success message
    const [dynamicFields, setDynamicFields] = useState(fields); // Store dynamic fields based on rules
    const captchaMaxLength = 10; // Maximum length of captcha
    const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghkmnopqrstuvwxyz0123456789@#$%&';
    const [refs, setRefs] = useState({}); // Store references to form fields
    const [fileInputs, setFileInputs] = useState({});

    useEffect(() => {
        const newRefs = {};
        dynamicFields.forEach(field => {
            newRefs[field.id] = createRef();
        });
        setRefs(newRefs);
    }, []);

    function resetForm() {
        setTimeout(() => {
            setGeneralFormError('');
            setSuccessMessage('');
            setSubmitting(false);
            setDynamicFields(fields);
            setFileInputs({});
            setCaptchaValue(generateCaptcha());
            setEnteredCaptcha('');
            dynamicFields.forEach(field => {
                document.getElementById(field.id).value = '';
            })

        }, 3000);
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
            } else {
                e.target.setCustomValidity('');
                setGeneralFormError('');
                setSuccessMessage('');

            }


            // Check and apply rules
            if (field.rules) {
                const rule = field.rules.find(r => r.value === value);

                if (rule) {
                    const newFields = [...dynamicFields];
                    const currentIndex = newFields.findIndex(f => f.name === field.name);

                    // Add fields if rule applies
                    rule.ruleResult.forEach(newField => {
                        // push the newField after the current field
                        newFields.splice(currentIndex + 1, 0, newField);
                    });

                    setDynamicFields(newFields);
                } else {
                    const newFields = dynamicFields.filter(f => {
                        let keep = true;
                        field.rules.forEach(rule => {
                            rule.ruleResult.forEach(newField => {
                                if (newField.name === f.name) {
                                    keep = false;
                                }
                            });
                        });
                        return keep;
                    });

                    setDynamicFields(newFields);
                }
            }
        }


    }

    const renderFieldBasedOnType = (field) => {


            return (
                <Fragment key={field.id} >
                {field.labelOutside && <label htmlFor={field.id} className={ "form-label-outside"}>
                    {field.label}

                </label>}

                    {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'time' || field.type === 'password') &&
                        <input
                            type={field.type}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.placeholder ? field.placeholder : field.label}
                            disabled={submitting}
                            onChange={(e) => onChange(e, field)}
                            className={`text-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                        />
                    }

                    {field.type === 'date' && (

                        <input
                            type={'text'}
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.placeholder ? field.placeholder+' (YYYY-MM-DD)' : field.label+' (YYYY-MM-DD)'}
                            disabled={submitting}
                            onChange={(e) => {
                                onChange(e, field);
                            }}
                            className={`text-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}

                        />
                    )}

                    {field.type === 'textarea' &&
                        <textarea
                            id={field.id}
                            name={field.httpName}
                            required={field.required}
                            placeholder={field.placeholder ? field.placeholder : field.label}
                            disabled={submitting}
                            onChange={(e) => onChange(e, field)}
                            className={`textarea-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
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
                                `select-multiple-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`
                                ) :

                                (`select-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`)

                            }

                            onChange={(e) => onChange(e, field)}
                        >
                            {(!field.multiple) && <option value="">{field.label}</option>}
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
                                    className={`radio-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
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
                                    className={`checkbox-form-field ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}
                                    onChange={(e) => onChange(e, field)}
                                />
                                {choice}
                            </label>
                        ))
                    }

                    {field.type === 'file' &&
                        <div className={`file-form-field-styled ${field.widthOfField === 1 ? 'full-width' : field.widthOfField === 1.5 ? 'two-thirds-width' : field.widthOfField === 2 ? 'half-width' : 'third-width'}`}>
                            <label htmlFor={field.id}>{field.label}</label>

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


    const onSubmit = async (e) => {
        e.preventDefault();
        if (submitting) { return; }


        if (enteredCaptcha !== captchaValue) {
            setGeneralFormError(lang === 'ar' ? 'الكود التحقق غير صحيح' : 'Captcha is incorrect');
            setTimeout(() => { setGeneralFormError(''); }, 3000);
            return;
        }

        setSubmitting(true);
        setGeneralFormError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            dynamicFields.forEach(field => {
                let value = document.getElementById(field.id).value;

                // Check if the field is of type 'file'
                if (field.type === 'file' && field.file) {
                    const file = field.file;
                    const fileExtension = file.name.split('.').pop();
                    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                    const uniqueFileName = `${fileNameWithoutExt}-${uuidv4()}.${fileExtension}`;
                    const renamedFile = new File([file], uniqueFileName, { type: file.type });

                    // Append the unique file name instead of the original value
                    value = uniqueFileName;

                    // Append unique file name and renamed file to formData
                    formData.append(`uniqueFileName_${field.label}`, uniqueFileName); // Append unique file name
                    formData.append(field.label, renamedFile, uniqueFileName);
                }

                // Append value and label to formData
                formData.append(`field_${field.id}`, value);
                formData.append(`label_${field.id}`, field.label); // Append labels separately
            });


            formData.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });

            if (sendPdf) {
                const pdf = new jsPDF();
                pdf.text("Form Submission", 10, 10);
                pdf.text(`Title: ${formTitle}`, 10, 20);
                dynamicFields.forEach((field, index) => {
                    const value = document.getElementById(field.id).value;
                    pdf.text(`${field.label}: ${value}`, 10, 30 + (index * 10));
                });

                const pdfBlob = pdf.output('blob');
                formData.append('pdfFile', pdfBlob, 'form.pdf');
            }

            formData.append('mailTo', mailTo);
            formData.append('formTitle', formTitle);

            const response = await fetch('scripts/submitForm.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setSuccessMessage(lang === 'ar' ? 'تم الارسال بنجاح' : 'Form submitted successfully!');
                setTimeout(() => { setSuccessMessage(''); }, 3000);
                resetForm();
            } else {
                console.log(result)
                setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : result.message + 'Form submission failed. Please try again.');
                setTimeout(() => { setGeneralFormError(''); }, 3000);
            }
        } catch (error) {
            setGeneralFormError(lang === 'ar' ? 'فشل الارسال، حاول مره اخرى' : error || 'Form submission failed. Please try again.');
            setTimeout(() => { setGeneralFormError(''); }, 3000);
        } finally {
            setSubmitting(false);
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

                <label htmlFor={"captcha"} className={"form-label-outside"}>
                    {lang === 'ar' ? 'الكود التحقق' : 'Captcha'}
                </label>

                <div className={`${captchaLength === 2 ? 'captcha-wrapper-half-width' : 'captcha-wrapper'}`}

                >


                    <input className={`text-form-field ${captchaLength === 2 ? 'full-width' : 'half-width'} captcha-input`} type={"text"}
                           placeholder={""} required={true} value={enteredCaptcha}

                           onChange={

                            (e) => {

                               setEnteredCaptcha(e.target.value);
                            }
                    }
                           onPaste={handlePaste}

                    />

                <div className={`text-form-field ${captchaLength === 2 ? 'full-width' : 'half-width'} captcha-box`} type={"text"}
                     onCopy={handleCopy}
                     onCut={handleCut}
                     onPaste={handlePaste}
                     onMouseDown={handleMouseDown}
                     onKeyDown={handleKeyDown}
                    onTouchStart={handleMouseDown}

                >{captchaValue}</div>

                    <button className={`${captchaLength === 2 ? 'captcha-refresh-button-half-width' : 'refresh-captcha-button'}`} onClick={(e)=> { e.preventDefault(); setCaptchaValue(generateCaptcha()); }} type={"button"}>⟳</button>

                </div>

                <div className="form-footer">

                    {
                        lang === 'ar' ? (
                            <button type="submit" disabled={submitting}
                                    className="submit-button">{submitting ? 'جاري الارسال...' : 'ارسال'}</button>
                        ) : (
                            <button type="submit" disabled={submitting}
                                    className="submit-button">{submitting ? 'Submitting...' : 'Submit'}</button>
                        )
                    }


                    {generalFormError && <p className="general-form-error">{generalFormError}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                </div>
            </form>
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
        multiple: PropTypes.bool,
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
                multiple: PropTypes.bool,
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
    captchaLength: PropTypes.number.isRequired
};

export default Form;